import { Rng, clamp } from './rng';
import { LEVEL_STARTER_OVR } from '../data/countries';
import { getClub, getCountry } from './data';
import { curOvr } from './attributes';
import { clubLvl, clubStd } from './world';
import { ageAt, dateOf, fmtDate, seasonOf, swOf } from './time';
import { marketValue, formatKRW, priceF } from './finance';
import { LEVEL_WAGE_MULT } from '../data/countries';
import { effOvr, stageStd } from './match';
import { STAGE_AGE, STAGE_REF, minProAge } from './stages';
import { addLog } from './log';
import { hunit } from './streams';
import { windowIdx, windowOpenW, windowCloseW, windowNow, nextWindowW } from './calendar';
import { genOffers, makeOfferFor, pickOne, fallbackOffer, targetLevel, compFee, clubWageCap, joinClub, leaveToFree, closeMarket, dropQueuedOffers, marketKey, contractWeeksLeft, transferFee, freeTerms, roleLabel } from './transfer';
import { presentOffers, hasPendingOffer } from './offers';
import type { GameState, Offer, OfferMode } from './types';

const LEVELS = [2, 3, 4, 5, 6];
const ALL_LEVELS_UP = LEVELS;
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
  if (o.yth) return { youth: 'U19·리저브 합류', scholar: '장학 계약', pro: '프로 계약' }[o.yth];
  switch (o.mode) {
    case 'renew': return '재계약';
    case 'loan': return '임대';
    case 'free': return '자유계약';
    case 'pre': return '사전 계약';
    default: return '이적';
  }
}

function externalOffer(s: GameState, rng: Rng, clubId: string, mode: OfferMode, first = false): Offer | null {
  const o = makeOfferFor(s, rng, clubId, first ? 'first' : 'window', { mode, first });
  if (!o) return null;
  if (mode === 'transfer') o.fee = transferFee(s, rng);
  else freeTerms(o, rng);
  return o;
}

function slotOffer(s: GameState, rng: Rng, used: Set<string>, lvls: number[] | undefined, tight: boolean, gate = false, first = false, foreign?: 'only' | 'no'): Offer | null {
  const ovr = curOvr(s.ab);
  for (let i = 0; i < 8; i++) {
    const club = pickOne(s, rng, { kind: first ? 'first' : 'window', ovr, used, gate, tight, levels: lvls, foreign });
    if (!club) continue;
    const o = externalOffer(s, rng, club.id, 'transfer', first);
    if (!o) {
      used.add(club.id);
      continue;
    }
    used.add(club.id);
    return o;
  }
  return null;
}

function fallbackDistinct(s: GameState, rng: Rng, used: Set<string>, mode: OfferMode): Offer | null {
  const o = fallbackOffer(s, rng, 'window', used);
  if (!o) return null;
  o.trial = false;
  o.mode = mode;
  if (mode === 'transfer') o.fee = transferFee(s, rng);
  else freeTerms(o, rng);
  used.add(o.clubId);
  return o;
}

function renewReason(s: GameState): '' | 'expiring' | 'form' {
  if (s.career.pre || s.career.transferReq >= 0) return '';
  if (contractWeeksLeft(s) <= 78) return 'expiring';
  const last = s.career.seasons[s.career.seasons.length - 1];
  if (last && last.s === seasonOf(s.week) - 1 && last.clubId === s.career.clubId && last.ratingN > 0 && last.ratingSum / last.ratingN >= 7 && last.avail > 0 && last.apps / last.avail >= 0.6) return 'form';
  return '';
}

function abroadCondition(s: GameState): boolean {
  const home = getCountry(s.p.country);
  if (curOvr(s.ab) >= starterOvr(home.top) + 2) return true;
  if (s.fame.abroad >= 40) return true;
  const last = s.career.seasons.slice(-2);
  return last.length === 2 && last[1].s === last[0].s + 1 && last.every((r) => r.ratingN > 0 && r.ratingSum / r.ratingN >= 7 && r.lvl >= home.top && r.clubId.split(':')[0] === home.code);
}

function lowUse(s: GameState): boolean {
  const c = s.career.cur;
  if (c.avail >= 6) return c.apps / c.avail < 0.3;
  const last = s.career.seasons[s.career.seasons.length - 1];
  return !!last && last.avail > 0 && last.apps / last.avail < 0.3;
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
  const dir = s.career.transferReq >= 0 ? s.career.reqDir : '';
  const fo = dir === 'abroad' ? 'only' : dir === 'dom' ? 'no' : undefined;
  const isForeign = (o: Offer): boolean => getClub(o.clubId).country !== s.p.country;
  if (ovr > starterOvr(cur)) {
    const up = cur < 6 ? LEVELS.filter((L) => L > cur) : [6];
    const o = slotOffer(s, rng, used, up, false, false, false, fo) ?? (fo ? null : slotOffer(s, rng, used, up, false));
    if (o) out.push(o);
  }
  if (summer && ovr >= starterOvr(6) && !out.some((o) => clubLvl(s, o.clubId) === 6)) {
    const o = slotOffer(s, rng, used, [6], false, false, false, fo);
    if (o) out.push(o);
  }
  if (ageAt(s.p.birth, s.week) >= 18 && dir !== 'dom' && abroadCondition(s) && (summer || rng.chance(0.6)) && !out.some(isForeign)) {
    let o: Offer | null = null;
    if (ovr >= starterOvr(5) - 4) o = slotOffer(s, rng, used, [5, 6], false, false, false, 'only');
    if (!o) o = slotOffer(s, rng, used, undefined, false, false, false, 'only');
    if (o) out.push(o);
  }
  let guard = 0;
  while (out.length + (renew ? 1 : 0) < n && guard++ < 24) {
    const relax = guard > 10 || dir === 'abroad';
    const batch = relax ? [slotOffer(s, rng, used, undefined, false, false, false, fo)].filter((x): x is Offer => !!x) : genOffers(s, rng, 'window', 3);
    for (const o of batch) {
      if (used.has(o.clubId) || out.length + (renew ? 1 : 0) >= n) continue;
      if (s.career.contract && s.career.contract.wage > clubWageCap(s, o.clubId) * 0.9 && !relax) continue;
      o.mode = 'transfer';
      used.add(o.clubId);
      out.push(o);
    }
  }
  while (dir !== 'abroad' && out.length + (renew ? 1 : 0) < n) {
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
  if (dir !== 'abroad' && ageAt(s.p.birth, s.week) <= 21 && cur >= 3 && lowUse(s) && rng.chance(0.65)) {
    const lo = slotOffer(s, rng, used, [Math.max(2, cur - 1)], false);
    if (lo) out.push({ ...lo, loan: true, years: 1, mode: 'loan', fee: 0 });
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

export function youthMarketEligible(s: GameState): boolean {
  if (s.phase !== 'youth' || s.career.retired || !s.career.clubId || s.career.track !== 'pro' || s.career.signed) return false;
  if (s.career.contract && !s.career.contract.youth) return false;
  const st = s.career.youthStage;
  return ageAt(s.p.birth, s.week) >= 17 || st === 'U19' || st === 'RES';
}

function youthEquiv(ovr: number): number {
  const f = 0.52 + 0.48 * Math.pow(clamp((STAGE_AGE.U19 - 11) / 8, 0, 1), 0.85);
  return (ovr + STAGE_REF - 6) / (0.86 * f);
}

function youthWage(s: GameState, clubId: string): number {
  const c = getCountry(getClub(clubId).country);
  const lvl = clubLvl(s, clubId);
  const base = 6000 * LEVEL_WAGE_MULT[lvl] * 0.04 * (0.5 + c.econ);
  return Math.max(100, Math.round((base * priceF(c.code)) / 10) * 10);
}

function entryNote(s: GameState, clubId: string): string {
  const r = curOvr(s.ab) - clubStd(s, clubId);
  return r >= -4 ? '1군 훈련 합류 예정' : r >= -10 ? '1군 훈련 합류 기회' : '1군 진입은 아직 먼 이야기';
}

export function youthOffers(s: GameState, rng: Rng, n: number, used: Set<string>): Offer[] {
  const own = s.career.clubId;
  const cur = clubLvl(s, own);
  const ownAcad = getClub(own).acad;
  const out: Offer[] = [];
  const ovrEq = youthEquiv(curOvr(s.ab));
  const lvls = cur >= 6 ? [6] : ALL_LEVELS_UP.filter((L) => L >= cur);
  const margin = effOvr(s) - stageStd(s, own, s.career.youthStage);
  let guard = 0;
  while (out.length < n && guard++ < 30) {
    const club = pickOne(s, rng, { kind: 'youth', ovr: ovrEq, used, gate: true, tight: false, levels: lvls });
    if (!club) continue;
    used.add(club.id);
    const L = clubLvl(s, club.id);
    if (L < cur || (L === cur && cur < 6 && club.acad < ownAcad + 10)) continue;
    const form: 'youth' | 'scholar' | 'pro' = margin >= 4 && ageAt(s.p.birth, s.week) >= minProAge(club.country) && rng.chance(0.3) ? 'pro' : s.career.scholar !== 1 && rng.chance(0.45) ? 'scholar' : 'youth';
    let o: Offer | null;
    if (form === 'pro') {
      o = makeOfferFor(s, rng, club.id, 'first', { first: true, anyRole: true });
      if (o) o.fee = compFee(s);
    } else {
      const base = makeOfferFor(s, rng, club.id, 'youth', { first: false, anyRole: true });
      o = base ? { ...base, role: 'prospect', wage: form === 'scholar' ? Math.round(youthWage(s, club.id) * 1.4 / 10) * 10 : youthWage(s, club.id), years: 2, signing: 0, appBonus: 0, goalBonus: 0, buyout: 0, fee: compFee(s) } : null;
    }
    if (!o) continue;
    o.yth = form;
    o.note = entryNote(s, club.id);
    out.push(o);
  }
  return out;
}

function youthMarketWeek(s: GameState, rng: Rng): void {
  const idx = windowIdx(s);
  if (idx < 0) return;
  const key = marketKey(s);
  let m = s.career.mkt;
  if (!m || m.key !== key) {
    m = { key, batchW: Math.max(s.week, windowOpenW(s) + rng.int(0, 1)), sent: false, extras: [], used: [] };
    s.career.mkt = m;
  }
  if (m.sent || s.week < m.batchW) return;
  const blocked = !!s.decision || s.decQueue.length > 0 || hasPendingOffer(s);
  if (blocked && s.week < windowCloseW(s)) return;
  m.sent = true;
  const margin = effOvr(s) - stageStd(s, s.career.clubId, s.career.youthStage);
  if (margin <= 0) return;
  const n = rng.int(0, margin >= 6 ? 2 : 1);
  if (!n) return;
  const offers = youthOffers(s, rng, n, new Set([s.career.clubId]));
  if (!offers.length) return;
  presentOffers(s, offers, 'window', '유스 이적 제안', `${windowIdx(s) === 0 ? '여름' : '겨울'} 이적시장에서 ${offers.length}개 구단이 접촉해 왔다.`, true, STAY_LABEL);
}

export function marketWeek(s: GameState, rng: Rng): void {
  if (!marketEligible(s)) {
    if (youthMarketEligible(s)) youthMarketWeek(s, rng);
    return;
  }
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

export function applyTransferRequest(s: GameState, rng: Rng, accepted: boolean, dir: '' | 'dom' | 'abroad' = ''): void {
  s.career.transferReq = s.week;
  s.career.reqDir = dir;
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
  s.career.reqDir = '';
  s.career.reqStance = '';
  if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel + 3, -100, 100);
  addLog(s, 'system', '이적 요청 철회', '이적 요청을 거두고 현 소속팀에 남기로 했다.', []);
}

export const REQ_DIR_TEXT: Record<'' | 'dom' | 'abroad', string> = { '': '방향 무관', dom: '국내 희망', abroad: '해외 이적 희망' };

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

export function firstContractOffers(s: GameState, rng: Rng): Offer[] {
  const ovr = curOvr(s.ab);
  const age = ageAt(s.p.birth, s.week);
  const clubId = s.career.clubId;
  const used = new Set<string>(clubId ? [clubId] : []);
  const out: Offer[] = [];
  const own = clubId ? makeOfferFor(s, rng, clubId, 'first', { first: true, anyRole: true }) : null;
  if (own) {
    own.fee = 0;
    out.push(own);
  }
  const maxL = targetLevel(ovr, s.ab.pot, age);
  if (maxL >= 3) {
    for (let L = maxL; L >= Math.max(2, maxL - 2); L--) {
      const o = slotOffer(s, rng, used, [L], false, false, true);
      if (o) {
        out.push(o);
        break;
      }
    }
  }
  const want = 3 + (rng.chance(0.35) ? 1 : 0);
  let guard = 0;
  while (out.length < want && guard++ < 14) {
    const relax = guard > 8;
    const batch = relax ? [slotOffer(s, rng, used, undefined, false, false, true)].filter((x): x is Offer => !!x) : genOffers(s, rng, 'first', 3);
    for (const o of batch) {
      if (used.has(o.clubId) || out.length >= want) continue;
      used.add(o.clubId);
      out.push(o);
    }
  }
  while (out.length < 3) {
    const fb = fallbackOffer(s, rng, 'first', used);
    if (!fb) break;
    fb.trial = false;
    used.add(fb.clubId);
    out.push(fb);
  }
  for (const o of out) {
    o.first = true;
    o.fee = o.clubId === clubId ? 0 : compFee(s);
    o.note = entryNote(s, o.clubId);
  }
  return orderOffers(out, s);
}

export function youthDeal(s: GameState, rng: Rng, o: Offer): DealOut {
  let p = 0.8;
  if (s.career.scholar === 1) p -= 0.18;
  if (s.people.coach) p -= clamp(s.people.coach.rel, -60, 60) / 700;
  p += clamp(((o.fee ?? 0) / Math.max(1, compFee(s)) - 1) * 0.1, -0.1, 0.1);
  p = clamp(p, 0.3, 0.95);
  const roll = rng.next();
  return { ok: roll < p, auto: false, p, roll };
}
