import { Rng, clamp } from './rng';
import { LEVEL_STARTER_OVR } from '../data/countries';
import { getClub, getCountry, leaguesOf } from './data';
import { curOvr } from './attributes';
import { clubLvl, ensureCountry, membersOf } from './world';
import { ageAt, dateOf, fmtDate, seasonOf, swOf } from './time';
import { marketValue, formatKRW } from './finance';
import { addLog } from './log';
import { hunit } from './streams';
import { windowIdx, windowOpenW, windowCloseW, windowNow, nextWindowW } from './calendar';
import { genOffers, makeOfferFor, pickClubIn, countriesWithLevel, levelFit, clubWageCap, joinClub, leaveToFree, closeMarket, dropQueuedOffers, marketKey, contractWeeksLeft, transferFee, freeTerms, roleLabel, wageFor } from './transfer';
import { presentOffers, hasPendingOffer } from './offers';
import { genName } from './relations';
import type { GameState, Offer, OfferMode } from './types';

const LEVELS = [2, 3, 4, 5, 6];
export const STAY_LABEL = '현 소속팀에 남는다';

export function starterOvr(lvl: number): number {
  return LEVEL_STARTER_OVR[lvl] ?? LEVEL_STARTER_OVR[2];
}

export function marketEligible(s: GameState): boolean {
  if (s.phase !== 'pro' || s.career.retired || !s.career.clubId || !s.career.signed) return false;
  const con = s.career.contract;
  if (!con || con.youth || con.loanFrom) return false;
  if (s.life.mil === 'serving') return false;
  return ageAt(s.p.birth, s.week) >= 18;
}

export function minOffers(s: GameState, summer: boolean): number {
  const ovr = curOvr(s.ab);
  const lvl = s.career.clubId ? clubLvl(s, s.career.clubId) : 2;
  const raised = contractWeeksLeft(s) <= 78 || s.career.transferReq >= 0 || ovr >= starterOvr(lvl) + 8;
  if (summer) return raised ? 3 : 2;
  return raised ? 2 : 1;
}

export function modeLabel(o: Offer): string {
  switch (o.mode) {
    case 'renew': return '재계약';
    case 'loan': return '임대';
    case 'free': return '자유계약';
    case 'pre': return '사전 계약';
    default: return '이적';
  }
}

function pickLevel(s: GameState, rng: Rng, ovr: number, lvls: number[]): number {
  const age = ageAt(s.p.birth, s.week);
  const expLvl = LEVELS.reduce((b, L) => (ovr >= starterOvr(L) - 4 ? L : b), 2);
  const w = lvls.map((L) => {
    const gap = ovr + (age <= 22 ? (s.ab.pot - ovr) * 0.25 : 0) - starterOvr(L);
    let v = levelFit(gap) + 0.001;
    if (L < expLvl) v *= Math.exp(-(expLvl - L) * 0.9);
    return v;
  });
  return lvls[rng.weightedIndex(w)];
}

function pickCountry(s: GameState, rng: Rng, L: number): string | null {
  const home = getCountry(s.p.country);
  const list = countriesWithLevel(L);
  if (!list.length) return null;
  if (list.includes(home.code) && rng.chance(L >= 5 ? 0.45 : 0.8)) return home.code;
  const cw = list.map((c) => {
    const cc = getCountry(c);
    let v = Math.sqrt(cc.pros + 400);
    if (cc.confed === home.confed) v *= 1.6;
    if (cc.lang === home.lang) v *= 1.8;
    if (c === home.code) v *= 1.4;
    return v;
  });
  return list[rng.weightedIndex(cw)];
}

function externalOffer(s: GameState, rng: Rng, clubId: string, mode: OfferMode): Offer | null {
  const o = makeOfferFor(s, rng, clubId, 'window', { mode });
  if (!o) return null;
  if (mode === 'transfer') o.fee = transferFee(s, rng);
  else freeTerms(o, rng);
  return o;
}

function slotOffer(s: GameState, rng: Rng, used: Set<string>, lvls: number[], tight: boolean): Offer | null {
  const ovr = curOvr(s.ab);
  for (let i = 0; i < 16; i++) {
    const L = pickLevel(s, rng, ovr, lvls);
    const code = pickCountry(s, rng, L);
    if (!code) continue;
    const club = pickClubIn(s, rng, code, L, ovr, s.career.clubId, tight && i < 8);
    if (!club || used.has(club.id)) continue;
    const o = externalOffer(s, rng, club.id, 'transfer');
    if (!o) continue;
    used.add(club.id);
    return o;
  }
  return null;
}

function fallbackDistinct(s: GameState, rng: Rng, used: Set<string>, mode: OfferMode): Offer | null {
  const lgs = leaguesOf(s.p.country);
  ensureCountry(s, s.p.country);
  const pool: string[] = [];
  for (let i = lgs.length - 1; i >= 0 && pool.length < 6; i--) {
    for (const id of membersOf(s, lgs[i].id)) if (id !== s.career.clubId && !used.has(id)) pool.push(id);
  }
  if (!pool.length) return null;
  const id = rng.pick(pool);
  const age = ageAt(s.p.birth, s.week);
  const wage = Math.max(300, Math.round(wageFor(s, id, 'backup', curOvr(s.ab), age) * 0.85));
  const cn = genName(rng, getClub(id).country);
  const o: Offer = {
    id: s.ev.nextId++, clubId: id, role: 'backup', wage, years: rng.int(1, 2), signing: 0, appBonus: 0, goalBonus: 0, buyout: 0, loan: false, trial: false,
    exp: s.week + 8, coachName: cn.name, coachStyle: '선수를 시험해 보는 타입', first: false, fromAgent: false, tag: 'fallback', mode, fee: 0
  };
  if (mode === 'transfer') o.fee = transferFee(s, rng);
  else freeTerms(o, rng);
  used.add(id);
  return o;
}

function renewReason(s: GameState): '' | 'expiring' | 'form' {
  if (s.career.pre || s.career.transferReq >= 0) return '';
  if (contractWeeksLeft(s) <= 78) return 'expiring';
  const last = s.career.seasons[s.career.seasons.length - 1];
  if (last && last.s === seasonOf(s.week) - 1 && last.clubId === s.career.clubId && last.ratingN > 0 && last.ratingSum / last.ratingN >= 7 && last.avail > 0 && last.apps / last.avail >= 0.6) return 'form';
  return '';
}

export function renewOffer(s: GameState, rng: Rng, counterWage = 0): Offer | null {
  const con = s.career.contract;
  const clubId = s.career.clubId;
  if (!con || !clubId) return null;
  const o = makeOfferFor(s, rng, clubId, 'renew', { renew: true, mode: 'renew' });
  if (!o) return null;
  const age = ageAt(s.p.birth, s.week);
  const rel = s.people.coach ? s.people.coach.rel : 0;
  const finance = 0.9 + 0.2 * hunit(`${s.cfg.seed}|fin|${clubId}|${seasonOf(s.week)}`);
  const cap = clubWageCap(s, clubId);
  let wage = Math.max(o.wage, con.wage) * finance * (1 + clamp(rel, -50, 80) / 700);
  if (counterWage > 0) wage = Math.max(wage, counterWage * 0.92);
  wage = Math.max(con.wage * 0.96, wage);
  o.wage = Math.max(300, Math.round(Math.min(wage, cap) / 10) * 10);
  o.years = age >= 32 ? rng.int(1, 2) : age >= 29 ? rng.int(1, 3) : rng.int(2, 4);
  o.signing = Math.round(o.wage * rng.float(0.05, 0.2));
  o.fee = 0;
  o.tag = 'renew';
  o.mode = 'renew';
  return o;
}

export function extendContract(s: GameState, o: Offer): void {
  const con = s.career.contract;
  if (!con) return;
  const sw = swOf(s.week);
  const next = s.week + o.years * 52 - sw + (sw > 30 ? 52 : 0);
  con.wage = o.wage;
  con.role = o.role;
  con.signing = o.signing;
  con.appBonus = o.appBonus;
  con.goalBonus = o.goalBonus;
  con.titleBonus = Math.round(o.wage * 0.05);
  con.buyout = o.buyout;
  con.endW = Math.max(next, con.endW + 52);
  s.career.promisedRole = o.role;
  if (o.signing > 0) {
    s.fin.cash += o.signing * 0.7;
    s.fin.yearIncomeAcc += o.signing;
  }
  closeMarket(s);
  dropQueuedOffers(s);
  s.career.transferReq = -1;
  s.career.reqStance = '';
  addLog(s, 'milestone', '재계약', `${getClub(o.clubId).name}와(과) 계약을 연장했다. 연봉 ${formatKRW(o.wage)}, 새 계약 ${o.years}년, 약속된 역할은 ${roleLabel(o.role)}.`, [], { star: true });
}

export function signPre(s: GameState, o: Offer): void {
  s.career.pre = o;
  if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel - 8, -100, 100);
  closeMarket(s);
  dropQueuedOffers(s);
  addLog(s, 'milestone', '사전 계약', `${getClub(o.clubId).name}와(과) 사전 계약을 맺었다. 계약이 끝나는 시즌 종료 후 이적료 없이 합류한다.`, [], { star: true });
}

export function renewalCounter(s: GameState, externals: Offer[]): number {
  const con = s.career.contract;
  if (!con) return 0;
  const best = externals.filter((o) => !o.loan && o.mode !== 'renew').reduce((m, o) => Math.max(m, o.wage), 0);
  return best >= con.wage * 1.5 ? best : 0;
}

function orderOffers(offers: Offer[], s: GameState): Offer[] {
  return offers.slice().sort((a, b) => {
    if (a.mode === 'renew' && b.mode !== 'renew') return -1;
    if (b.mode === 'renew' && a.mode !== 'renew') return 1;
    return clubLvl(s, b.clubId) - clubLvl(s, a.clubId) || b.wage - a.wage;
  });
}

export function buildBatch(s: GameState, rng: Rng, summer: boolean, n: number): Offer[] {
  const clubId = s.career.clubId;
  const ovr = curOvr(s.ab);
  const cur = clubLvl(s, clubId);
  const used = new Set<string>([clubId, ...(s.career.mkt ? s.career.mkt.used : [])]);
  const out: Offer[] = [];
  const reason = renewReason(s);
  let renew: Offer | null = reason ? renewOffer(s, rng) : null;
  if (ovr > starterOvr(cur)) {
    const up = cur < 6 ? LEVELS.filter((L) => L > cur) : [6];
    const o = slotOffer(s, rng, used, up, false);
    if (o) out.push(o);
  }
  if (summer && ovr >= starterOvr(6) && !out.some((o) => clubLvl(s, o.clubId) === 6)) {
    const o = slotOffer(s, rng, used, [6], false);
    if (o) out.push(o);
  }
  let guard = 0;
  while (out.length + (renew ? 1 : 0) < n && guard++ < 24) {
    const relax = guard > 10;
    const batch = relax ? [slotOffer(s, rng, used, [2, 3, 4], false)].filter((x): x is Offer => !!x) : genOffers(s, rng, 'window', 3);
    for (const o of batch) {
      if (used.has(o.clubId) || out.length + (renew ? 1 : 0) >= n) continue;
      if (s.career.contract && s.career.contract.wage > clubWageCap(s, o.clubId) * 0.9 && !relax) continue;
      o.mode = 'transfer';
      used.add(o.clubId);
      out.push(o);
    }
  }
  while (out.length + (renew ? 1 : 0) < n) {
    const fb = fallbackDistinct(s, rng, used, 'transfer');
    if (!fb) break;
    out.push(fb);
  }
  if (!renew && !s.career.pre && s.career.transferReq < 0) {
    const counter = renewalCounter(s, out);
    if (counter > 0) renew = renewOffer(s, rng, counter);
  }
  const winter = windowIdx(s) === 1;
  if (winter && contractWeeksLeft(s) <= 26 && !s.career.pre) {
    for (const o of out) {
      if (!o.loan && o.mode === 'transfer' && rng.chance(0.45)) {
        o.mode = 'pre';
        freeTerms(o, rng);
      }
    }
  }
  const age = ageAt(s.p.birth, s.week);
  const role = s.career.contract?.role ?? 'backup';
  if (age <= 24 && swOf(s.week) <= 9 && (role === 'prospect' || role === 'backup') && cur >= 3 && rng.chance(0.3)) {
    const low = genOffers(s, rng, 'window', 2).filter((o) => clubLvl(s, o.clubId) < cur && getClub(o.clubId).country === getClub(clubId).country && !used.has(o.clubId));
    if (low.length) out.push({ ...low[0], loan: true, years: 1, mode: 'loan', fee: 0 });
  }
  if (renew) out.push(renew);
  return orderOffers(out, s);
}

function present(s: GameState, offers: Offer[], text: string): void {
  if (!offers.length) return;
  const m = s.career.mkt;
  if (m) for (const o of offers) if (!m.used.includes(o.clubId)) m.used.push(o.clubId);
  presentOffers(s, offers, 'window', '이적 제안', text, true, STAY_LABEL);
}

function batchText(s: GameState, offers: Offer[]): string {
  const ext = offers.filter((o) => o.mode !== 'renew').length;
  const renew = offers.some((o) => o.mode === 'renew');
  const lead = windowIdx(s) === 0 ? '여름 이적시장이 열렸다.' : '겨울 이적시장이 열렸다.';
  const pre = offers.some((o) => o.mode === 'pre') ? ' 계약 만료가 가까워 사전 계약을 노리는 구단도 있다.' : '';
  return `${lead} ${ext}개 구단이 접촉해 왔다.${renew ? ' 현 소속팀도 재계약 의사를 밝혔다.' : ''}${pre}`;
}

export function deliverBatch(s: GameState, rng: Rng): Offer[] {
  const summer = windowIdx(s) === 0;
  const offers = buildBatch(s, rng, summer, minOffers(s, summer));
  present(s, offers, batchText(s, offers));
  if (offers.some((o) => clubLvl(s, o.clubId) > clubLvl(s, s.career.clubId))) s.career.upBias = 0;
  return offers;
}

export function marketWeek(s: GameState, rng: Rng): void {
  if (!marketEligible(s)) return;
  const idx = windowIdx(s);
  if (idx < 0) return;
  const key = marketKey(s);
  let m = s.career.mkt;
  if (!m || m.key !== key) {
    m = { key, batchW: Math.max(s.week, windowOpenW(s) + rng.int(0, 1)), sent: false, extras: [], used: [] };
    s.career.mkt = m;
  }
  const blocked = !!s.decision || s.decQueue.length > 0 || hasPendingOffer(s);
  const closing = s.week >= windowCloseW(s);
  if (!m.sent && s.week >= m.batchW) {
    if (blocked && !closing) return;
    m.sent = true;
    deliverBatch(s, rng);
    const left: number[] = [];
    for (let w = s.week + 1; w <= windowCloseW(s); w++) left.push(w);
    const k = Math.min(left.length, rng.int(0, 2));
    m.extras = rng.shuffle(left).slice(0, k).sort((a, b) => a - b);
    return;
  }
  if (m.sent && m.extras.length && s.week >= m.extras[0]) {
    if (blocked) return;
    m.extras.shift();
    const used = new Set<string>([s.career.clubId, ...m.used]);
    const o = slotOffer(s, rng, used, LEVELS, true);
    if (o) present(s, [o], '이적 시장에서 또 다른 구단이 접촉해 왔다.');
  }
}

export function requestBatch(s: GameState, rng: Rng): void {
  if (!marketEligible(s) || !windowNow(s)) return;
  const key = marketKey(s);
  if (!s.career.mkt || s.career.mkt.key !== key) s.career.mkt = { key, batchW: s.week, sent: true, extras: [], used: [] };
  s.career.mkt.sent = true;
  deliverBatch(s, rng);
}

export function applyTransferRequest(s: GameState, rng: Rng, accepted: boolean): void {
  s.career.transferReq = s.week;
  s.career.reqStance = accepted ? 'accepted' : 'refused';
  if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel - 10, -100, 100);
  if (s.people.fans) s.people.fans.rel = clamp(s.people.fans.rel - 6, -100, 100);
  if (!accepted) s.st.morale = clamp(s.st.morale - 4, 0, 100);
  const club = s.career.clubId ? getClub(s.career.clubId).name : '구단';
  if (accepted) addLog(s, 'milestone', '이적 요청 접수', `${club}이(가) 이적 요청을 받아들였다. 적절한 제안이 오면 보내 주겠다는 입장이다.`, [], { star: true });
  else addLog(s, 'milestone', '이적 요청 거절', `${club}이(가) 이적 요청을 거절했다. 핵심 선수를 쉽게 내줄 수 없다는 입장이다.`, [], { star: true });
  if (windowNow(s)) requestBatch(s, rng);
}

export function withdrawTransferRequest(s: GameState): void {
  s.career.transferReq = -1;
  s.career.reqStance = '';
  if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel + 3, -100, 100);
  addLog(s, 'system', '이적 요청 철회', '이적 요청을 거두고 현 소속팀에 남기로 했다.', []);
}

export function nextWindowText(s: GameState): string {
  const open = windowNow(s);
  if (open) return `열림 · ~${fmtDate(dateOf(windowCloseW(s)))}`;
  return `닫힘 · 다음 개장 ${fmtDate(dateOf(nextWindowW(s)))}`;
}

export function freeOffers(s: GameState, rng: Rng, n: number, waited: number): Offer[] {
  const shift = Math.min(10, waited / 6);
  const wageMul = clamp(1 - waited * 0.008, 0.6, 1);
  const out: Offer[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (out.length < n && guard++ < 18) {
    const batch = genOffers(s, rng, 'free', 3, { shift, wageMul, noTrial: true });
    for (const o of batch) {
      if (used.has(o.clubId) || out.length >= n) continue;
      o.mode = 'free';
      o.trial = false;
      freeTerms(o, rng);
      used.add(o.clubId);
      out.push(o);
    }
  }
  return out;
}

export function expireToFree(s: GameState, rng: Rng): void {
  leaveToFree(s, '계약 만료');
  freeAgentOffers(s, rng, '계약이 만료되어 자유계약 선수가 됐다. 이적료가 들지 않는 만큼 구단들이 서명 보너스를 앞세워 접촉해 왔다.');
}

export function releaseToFree(s: GameState, rng: Rng, reason: string): void {
  leaveToFree(s, reason);
  if (s.career.signed && s.phase === 'pro') freeAgentOffers(s, rng, '자유계약 선수가 되자 구단들이 이적료 없이 영입할 수 있다며 접촉해 왔다.');
}

export function freeAgentOffers(s: GameState, rng: Rng, text: string): void {
  const min = curOvr(s.ab) < starterOvr(2) - 8 ? 1 : 2;
  const offers = freeOffers(s, rng, min, 0);
  const used = new Set<string>(offers.map((o) => o.clubId));
  while (offers.length < min) {
    const fb = fallbackDistinct(s, rng, used, 'free');
    if (!fb) break;
    offers.push(fb);
  }
  presentOffers(s, offers, 'free', '자유계약 제안', text, true);
}

export function executePre(s: GameState, rng: Rng): void {
  const o = s.career.pre;
  if (!o) return;
  s.career.pre = null;
  addLog(s, 'milestone', '계약 만료', `${getClub(s.career.clubId).name}과(와)의 계약이 만료됐다. 사전 계약에 따라 이적료 없이 떠난다.`, [], { star: true });
  joinClub(s, rng, { ...o, mode: 'pre' }, '사전 계약');
}

export interface DealOut { ok: boolean; auto: boolean; p: number; roll: number }

export function clubDeal(s: GameState, rng: Rng, o: Offer): DealOut {
  const con = s.career.contract;
  if (!con || con.youth || con.loanFrom || o.first || o.mode !== 'transfer') return { ok: true, auto: true, p: 1, roll: 0 };
  const fee = o.fee ?? 0;
  if (con.buyout > 0 && fee >= con.buyout) return { ok: true, auto: true, p: 1, roll: 0 };
  const left = contractWeeksLeft(s) / 52;
  const val = marketValue(s);
  let p = 0.68;
  p += left <= 0.5 ? 0.2 : left <= 1 ? 0.1 : left >= 3 ? -0.1 : left >= 2 ? -0.04 : 0;
  p += { starter: -0.15, rotation: -0.05, prospect: 0.05, backup: 0.1 }[con.role];
  p += clamp((fee / Math.max(1, val) - 1) * 0.5, -0.25, 0.25);
  if (s.career.transferReq >= 0) p += s.career.reqStance === 'refused' ? -0.3 : 0.25;
  if (s.people.coach) p -= clamp(s.people.coach.rel, -60, 60) / 600;
  p = clamp(p, 0.05, 0.95);
  const roll = rng.next();
  return { ok: roll < p, auto: false, p, roll };
}
