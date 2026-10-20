import { hunit } from './streams';
import { LEVEL_STARTER_OVR, LEVEL_WAGE_MULT } from '../data/countries';
import { Rng, clamp } from './rng';
import { getCal, mFor } from './calibration';
import { allCountries, getClub, getCountry, getLeague, leaguesOf, type ClubStatic } from './data';
import { curOvr } from './attributes';
import { clubLvl, clubStd, clubSt, dyn, ensureCountry, startLeagueSeason, buildRounds, simScore, record, membersOf, clubLeagueId, roundRng } from './world';
import { ageAt, seasonOf, swOf } from './time';
import { genName, makePerson, randomPos } from './relations';
import { marketValue, priceF } from './finance';
import { addLog, toast } from './log';
import { isCosmetic } from './flags';
import { changeYouthClub, closeYouthCurrent, restageYouth } from './yleague';
import type { Contract, GameState, Offer, Role } from './types';
import { emptyRec } from './records';
import { CONT_LP_WEEKS, CONT_COMPS } from '../data/competitions';
import { leagueWeek, profileOf } from './calendar';

export const ROLE_VAL: Record<Role, number> = { starter: 3, rotation: 2, prospect: 1, backup: 0 };

export function clubWageCap(s: GameState, clubId: string): number {
  const cs = getClub(clubId);
  const lvl = clubLvl(s, clubId);
  return Math.round(6000 * LEVEL_WAGE_MULT[lvl] * (0.5 + getCountry(cs.country).econ) * 2.6 / 10) * 10;
}

export function wageFor(s: GameState, clubId: string, role: Role, ovr: number, age: number): number {
  const cs = getClub(clubId);
  const lvl = clubLvl(s, clubId);
  const std = clubStd(s, clubId);
  const c = getCountry(cs.country);
  const base = 6000 * LEVEL_WAGE_MULT[lvl];
  const spread = Math.exp(clamp((ovr - std) / 10, -1.6, 1.8));
  const roleF = role === 'starter' ? 1 : role === 'rotation' ? 0.75 : role === 'prospect' ? 0.5 : 0.55;
  const ageF = age <= 17 ? 0.28 : age <= 19 ? 0.5 : age <= 21 ? 0.78 : age >= 33 ? 0.85 : 1;
  const fameF = 1 + s.fame.dom / 60 + s.fame.abroad / 45;
  const w = base * spread * roleF * ageF * (0.5 + c.econ) * fameF;
  return Math.min(Math.max(300, Math.round(w / 10) * 10), clubWageCap(s, clubId));
}

export function roleFor(marginRaw: number, age: number, pot: number, std: number): Role | null {
  const margin = marginRaw - 1.2 * Math.max(0, age - 31);
  if (margin >= -1.5) return 'starter';
  if (margin >= -5) return 'rotation';
  if (age <= 22 && pot >= std - 2 && margin >= -13) return 'prospect';
  if (margin >= -8.5) return 'backup';
  return null;
}

function levelFit(gap: number): number {
  return 1 / (1 + Math.exp(-(gap + 6) / 3.6));
}

export interface OfferGen { kind: 'window' | 'free' | 'first' | 'renew' | 'trial'; n?: number }

function countriesWithLevel(L: number): string[] {
  const out: string[] = [];
  for (const c of allCountries()) if (c.top >= L) out.push(c.code);
  return out;
}

function pickClubIn(s: GameState, rng: Rng, code: string, L: number, ovr: number, excl: string, tight = false): ClubStatic | null {
  ensureCountry(s, code);
  const cands: ClubStatic[] = [];
  const w: number[] = [];
  for (const lg of leaguesOf(code)) {
    for (const id of lg.clubIds) {
      if (id === excl) continue;
      if (clubLvl(s, id) !== L) continue;
      const cs = getClub(id);
      const std = clubStd(s, id);
      const gap = ovr - std;
      if (gap < (tight ? -9 : -14)) continue;
      if (tight && gap > 16) continue;
      cands.push(cs);
      w.push(tight ? Math.exp(-Math.pow(gap - 2, 2) / 60) + 0.01 : Math.exp(-Math.pow(gap + 1, 2) / 110) + 0.02);
    }
  }
  if (!cands.length) return null;
  return rng.weighted(cands, w);
}

export function makeOfferFor(s: GameState, rng: Rng, clubId: string, tag: string, opts: { loan?: boolean; trial?: boolean; first?: boolean; renew?: boolean } = {}): Offer | null {
  const ovr = curOvr(s.ab);
  const age = ageAt(s.p.birth, s.week);
  const std = clubStd(s, clubId);
  const margin = ovr - std;
  let role = roleFor(margin, age, s.ab.pot, std);
  if (opts.renew && role === null) role = 'backup';
  if (!role) return null;
  const promised = role;
  const wage = wageFor(s, clubId, promised, ovr, age);
  const years = age <= 21 ? rng.int(3, 5) : age <= 30 ? rng.int(2, 4) : rng.int(1, 2);
  const val = marketValue(s);
  const coachName = genName(rng, getClub(clubId).country);
  const offer: Offer = {
    id: s.ev.nextId++,
    clubId,
    role: promised,
    wage,
    years: opts.loan ? 1 : years,
    signing: Math.round(wage * rng.float(0.05, 0.35)),
    appBonus: Math.round((wage / 52) * rng.float(0.05, 0.25)),
    goalBonus: Math.round((wage / 52) * rng.float(0.1, 0.5)),
    buyout: Math.round(val * rng.float(1.2, 3.2)),
    loan: !!opts.loan,
    trial: !!opts.trial,
    exp: s.week + 6,
    coachName: coachName.name,
    coachStyle: rng.pick(['공격 축구를 선호', '수비 안정을 중시', '점유율 축구', '빠른 역습', '강한 압박', '엄격한 규율', '선수와 소통하는 타입', '유망주를 믿고 쓰는 타입']),
    first: !!opts.first,
    fromAgent: !!(s.people.agent && !s.people.agent.gone && rng.chance(0.5)),
    tag
  };
  return offer;
}

const RICH = ['SA', 'TR', 'CN'];

const FREE_YOUTH = 0.2;

export function genOffers(s: GameState, rng: Rng, kind: OfferGen['kind'], count: number): Offer[] {
  const ovr = curOvr(s.ab);
  const age = ageAt(s.p.birth, s.week);
  const curLvl = s.career.clubId ? clubLvl(s, s.career.clubId) : 1;
  const mf = mFor(s.p.country);
  const out: Offer[] = [];
  const used = new Set<string>();
  if (s.career.clubId) used.add(s.career.clubId);
  const fameBoost = 1 + s.fame.dom / 120 + s.fame.abroad / 80;
  const potBoost = age <= 22 ? 1 + Math.max(0, s.ab.pot - ovr) / 40 : 1;
  const levels = [2, 3, 4, 5, 6];
  const expLvl = levels.reduce((b, L) => (ovr >= LEVEL_STARTER_OVR[L] - 4 ? L : b), 2);
  const home = getCountry(s.p.country);
  for (let i = 0; i < count; i++) {
    const w = levels.map((L) => {
      const gap = ovr + (age <= 22 ? (s.ab.pot - ovr) * 0.25 : 0) - LEVEL_STARTER_OVR[L];
      let v = levelFit(gap) * (L > curLvl ? 1 + s.career.upBias : 1);
      if (L >= 5) v *= mf * fameBoost * potBoost;
      if (L < curLvl - 1 && kind !== 'free' && kind !== 'first' && kind !== 'trial') v *= 0.25;
      if (gap > 8 && L < expLvl - 1) v *= Math.exp(-(expLvl - 1 - L) * 1.2);
      return Math.max(0, v) + (L === 2 ? 0.02 : 0);
    });
    const L = levels[rng.weightedIndex(w)];
    const dom = countriesWithLevel(L).includes(home.code);
    let code: string;
    if (dom && rng.chance(L >= 5 ? 0.45 : 0.8)) code = home.code;
    else {
      const list = countriesWithLevel(L);
      const cw = list.map((c) => {
        const cc = getCountry(c);
        let v = Math.sqrt(cc.pros + 400);
        if (cc.confed === home.confed) v *= 1.6;
        if (cc.lang === home.lang) v *= 1.8;
        if (c === home.code) v *= 1.4;
        return v;
      });
      code = list[rng.weightedIndex(cw)];
    }
    if (code !== home.code && L >= 4 && rng.next() > Math.min(1, Math.pow(Math.max(mf, 1e-6), 0.6))) continue;
    const club = pickClubIn(s, rng, code, L, ovr, s.career.clubId, kind === 'window' || kind === 'free');
    if (!club || used.has(club.id)) continue;
    if (s.phase === 'youth' && kind === 'free' && !rng.chance(FREE_YOUTH)) continue;
    if (kind === 'window' && age >= 22 && age <= 34 && ovr >= 52 && rng.chance(0.05)) {
      const rc = rng.pick(RICH);
      if (rc !== s.career.clubId?.split(':')[0]) {
        const rich = pickClubIn(s, rng, rc, 3, ovr, s.career.clubId, false) ?? pickClubIn(s, rng, rc, 4, ovr, s.career.clubId, false);
        if (rich && !used.has(rich.id)) {
          const ro = makeOfferFor(s, rng, rich.id, 'money', { first: false });
          if (ro) {
            ro.wage = Math.round((ro.wage * rng.float(3, 6)) / 10) * 10;
            ro.role = 'starter';
            used.add(rich.id);
            out.push(ro);
            continue;
          }
        }
      }
    }
    const trial = kind === 'trial' || (kind === 'free' && code !== home.code && rng.chance(0.3));
    const offer = makeOfferFor(s, rng, club.id, kind, { trial, first: kind === 'first' });
    if (!offer) continue;
    if ((kind === 'window' || kind === 'free') && s.career.contract && !s.career.contract.youth && s.career.contract.wage > clubWageCap(s, club.id) * 0.9) continue;
    used.add(club.id);
    out.push(offer);
  }
  return out;
}

export function fallbackOffer(s: GameState, rng: Rng, kind: OfferGen['kind']): Offer | null {
  const lgs = leaguesOf(s.p.country);
  const low = lgs[lgs.length - 1];
  ensureCountry(s, s.p.country);
  const ids = membersOf(s, low.id);
  const excl = s.career.clubId;
  const pool = ids.filter((id) => id !== excl);
  if (!pool.length) return null;
  const id = rng.pick(pool);
  const age = ageAt(s.p.birth, s.week);
  const wage = Math.max(300, Math.round(wageFor(s, id, 'backup', curOvr(s.ab), age) * 0.8));
  const cn = genName(rng, getClub(id).country);
  return {
    id: s.ev.nextId++, clubId: id, role: 'backup', wage, years: 1, signing: 0, appBonus: 0, goalBonus: 0, buyout: 0, loan: false, trial: true,
    exp: s.week + 8, coachName: cn.name, coachStyle: '선수를 시험해 보는 타입', first: kind === 'first', fromAgent: false, tag: 'fallback'
  };
}

export function negotiate(s: GameState, rng: Rng, o: Offer, demands: { wage: boolean; role: boolean; buyout: boolean }): { ok: boolean; offer: Offer; text: string; roll: number; need: number } {
  const agent = s.fin.agentSkill;
  const val = marketValue(s);
  let fail = 0.04;
  if (demands.wage) fail += 0.14;
  if (demands.role) fail += 0.17;
  if (demands.buyout) fail += 0.1;
  fail -= agent / 600;
  fail -= Math.min(0.08, val / 20000000);
  if (o.first) fail += 0.04;
  fail = clamp(fail, 0.02, 0.7);
  const roll = rng.next();
  const need = fail;
  if (!demands.wage && !demands.role && !demands.buyout) return { ok: true, offer: o, text: '조건을 그대로 받아들였다.', roll, need };
  if (roll < need) return { ok: false, offer: o, text: '요구가 과하다는 이유로 구단이 제안을 거둬들였다.', roll, need };
  const no = { ...o };
  if (demands.wage) no.wage = Math.round(o.wage * 1.18);
  if (demands.role && ROLE_VAL[o.role] < 3) no.role = (['backup', 'prospect', 'rotation', 'starter'] as Role[])[Math.min(3, ROLE_VAL[o.role] + 1)];
  if (demands.buyout) no.buyout = Math.round(o.buyout * 0.55);
  return { ok: true, offer: no, text: '협상이 타결됐다. 요구한 조건이 반영됐다.', roll, need };
}

const TRIAL_YOUTH = 0.2;

export function trialPass(s: GameState, rng: Rng, o: Offer): { ok: boolean; roll: number; need: number } {
  const L = clubLvl(s, o.clubId);
  const std = clubStd(s, o.clubId);
  const gap = curOvr(s.ab) - std;
  const foreign = getClub(o.clubId).country !== s.p.country;
  let p = 0.55 + gap / 22 + (foreign ? (s.hid.adapt - 50) / 400 : 0) + s.fame.dom / 400;
  if (L >= 5) p *= mFor(s.p.country);
  else if (foreign && L >= 4) p *= Math.min(1, Math.pow(Math.max(mFor(s.p.country), 1e-6), 0.3));
  if (s.phase === 'youth') p *= TRIAL_YOUTH;
  p = clamp(p, 0.04, 0.92);
  const roll = rng.next();
  return { ok: roll < p, roll, need: p };
}

export function buildClubPeople(s: GameState, rng: Rng, clubId: string, firstJoin: boolean): void {
  const cs = getClub(clubId);
  const code = cs.country;
  const year = 2026 + seasonOf(s.week);
  const st = s.ev;
  const old = Object.keys(s.people).filter((k) => k.startsWith('mate'));
  let best: string | null = null;
  for (const k of old) if (!best || s.people[k].rel > s.people[best].rel) best = k;
  if (best && s.people[best].rel > 25 && !firstJoin) {
    const p = s.people[best];
    p.kind = 'friend';
    p.note = '옛 동료';
    s.people.friend1 = p;
  }
  for (const k of old) delete s.people[k];
  const tmp = { nextId: st.nextId };
  s.people.coach = makePerson(rng, tmp, 'coach', code, { age: rng.int(38, 62), refYear: year, job: s.phase === 'youth' ? '리저브 감독' : '감독', rel: rng.int(-5, 15), clubId });
  s.people.coach.traitVal = rng.normal(0, 0.45);
  s.people.captain = makePerson(rng, tmp, 'captain', code, { age: rng.int(27, 35), refYear: year, job: '주장', rel: rng.int(-5, 15), pos: randomPos(rng), ovr: Math.round(clubStd(s, clubId) + 2), clubId });
  const age = ageAt(s.p.birth, s.week);
  for (let i = 1; i <= 3; i++) {
    s.people[`mate${i}`] = makePerson(rng, tmp, 'mate', code, {
      age: clamp(age + rng.int(-3, 4), 15, 36), refYear: year, job: '팀 동료', rel: rng.int(-5, 20), pos: randomPos(rng), ovr: Math.round(clubStd(s, clubId) + rng.normal(0, 4)), clubId
    });
  }
  const rv = s.people.rival;
  if (rv) {
    rv.clubId = clubId;
    rv.pos = s.ab.pos;
    rv.ovr = Math.round(clubStd(s, clubId) + rng.normal(-1, 3));
    rv.pot = Math.round(rv.ovr + rng.int(0, 8));
    rv.job = '같은 포지션 경쟁자';
    rv.gone = false;
    rv.birthYear = year - clamp(age + rng.int(-2, 3), 15, 36);
  }
  st.nextId = tmp.nextId;
}

export function setupClubSeason(s: GameState, clubId: string, mid: boolean): void {
  const lgId = clubLeagueId(s, clubId);
  startLeagueSeason(s, lgId);
  const rt = s.world.leagues[lgId];
  const games = (rt.order.length % 2 === 0 ? rt.order.length - 1 : rt.order.length) * 2;
  const sw = swOf(s.week);
  const cal = profileOf(getLeague(lgId).cal);
  const rounds = buildRounds(rt.order);
  let r0 = 0;
  if (mid) {
    while (r0 < games && leagueWeek(cal, r0, games) < sw) r0++;
    for (let r = 0; r < r0; r++) {
      const rr = roundRng(s, `lr:${lgId}`, r);
      for (const [h, a] of rounds[r]) {
        const [hg, ag] = simScore(rr, dyn(s, h).st, dyn(s, a).st);
        record(s, lgId, h, a, hg, ag);
      }
    }
    rt.round = r0;
  }
  const fixtures = s.career.fixtures;
  fixtures.length = 0;
  const cs = getClub(clubId);
  const lvl = clubLvl(s, clubId);
  for (let r = r0; r < games; r++) {
    const rd = rounds[r];
    const pair = rd.find(([h, a]) => h === clubId || a === clubId);
    if (!pair) continue;
    const home = pair[0] === clubId;
    const opp = home ? pair[1] : pair[0];
    const big = getClub(opp).city === cs.city;
    fixtures.push({ w: leagueWeek(cal, r, games), comp: getLeague(lgId).ko, kind: 'league', opp: getClub(opp).name, oppSt: dyn(s, opp).st, ko: false, stage: `${r + 1}라운드`, home, big, final: false, round: r, oppId: opp });
  }
  const country = cs.country;
  const cRT = ensureCountry(s, country);
  const wr = roundRng(s, `setup:${clubId}`, mid ? 1 : 0);
  if (s.phase !== 'youth') {
    for (const w of cal.friendlies) {
      if (w <= sw) continue;
      const pool = membersOf(s, lgId).filter((id) => id !== clubId);
      const oid = wr.pick(pool);
      fixtures.push({ w, comp: '프리시즌 친선경기', kind: 'friendly', opp: getClub(oid).name, oppSt: dyn(s, oid).st - 3, ko: false, stage: '친선', home: wr.chance(0.5), big: false, final: false, round: -1, oppId: oid });
    }
  }
  const tier = getLeague(lgId).tier;
  const entry = tier >= 4 ? 0 : tier === 3 ? 1 : tier === 2 ? 2 : 3;
  s.career.cupAlive = !mid || sw < cal.cupWeeks[3] - 3;
  s.career.cupRound = entry;
  if (s.career.cupAlive) scheduleCup(s, wr, clubId, lgId, entry);
  const q = cRT.qual[clubId];
  s.career.contQualified = q ?? '';
  s.career.contAlive = false;
  s.career.contComp = '';
  s.career.contPts = 0;
  s.career.contGames = 0;
  if (q && !mid) {
    s.career.contAlive = true;
    s.career.contComp = q;
    const comp = CONT_COMPS[q];
    CONT_LP_WEEKS.forEach((w, i) => {
      const oppSt = comp.mean - 3 + wr.normal(0, comp.sd);
      fixtures.push({ w, comp: comp.ko, kind: 'cont', opp: `${comp.ko} 상대 ${i + 1}`, oppSt, ko: false, stage: `리그 페이즈 ${i + 1}`, home: i % 2 === 0, big: false, final: false, round: i, oppId: '' });
    });
  }
  fixtures.sort((a, b) => a.w - b.w);
  s.career.cur.leagueId = lgId;
  s.career.cur.leagueName = getLeague(lgId).ko;
  s.career.cur.lvl = lvl;
  s.career.cur.clubId = clubId;
  s.career.cur.clubName = cs.name;
  const rtd = s.world.leagues;
  for (const k of Object.keys(rtd)) if (k !== lgId && k !== s.coach.clubId && !(s.coach.clubId && clubLeagueId(s, s.coach.clubId) === k)) delete rtd[k];
}

export function scheduleCup(s: GameState, rng: Rng, clubId: string, lgId: string, stage: number): void {
  const st = clubSt(s, clubId);
  const oppSt = clamp(st + rng.normal(-4 + (stage - 2) * 1.8, 7), 20, 98);
  const final = stage === 6;
  s.career.fixtures.push({
    w: profileOf(getLeague(lgId).cal).cupWeeks[stage], comp: getLeague(lgId).cup, kind: 'cup', opp: `${getLeague(lgId).cup} 상대`, oppSt, ko: true,
    stage: ['1라운드', '2라운드', '3라운드', '16강', '8강', '4강', '결승'][stage], home: rng.chance(0.5), big: false, final, round: stage, oppId: ''
  });
}

export function closeCurrent(s: GameState): void {
  const cur = s.career.cur;
  if (!cur.done && (cur.apps > 0 || cur.mins > 0 || cur.avail > 0)) s.career.seasons.push({ ...cur, done: true });
  cur.done = true;
}

export function joinClub(s: GameState, rng: Rng, o: Offer, reason: string): void {
  const age = ageAt(s.p.birth, s.week);
  const prev = s.career.clubId;
  const cs = getClub(o.clubId);
  const firstPro = !s.career.signed && !o.loan;
  const hadPrev = !!prev;
  if (hadPrev) {
    s.career.clubsHist[s.career.clubsHist.length - 1].toS = seasonOf(s.week);
    closeCurrent(s);
  }
  const loanFrom = o.loan ? (s.career.contract?.loanFrom || prev) : '';
  const parentContract = o.loan ? s.career.contract : null;
  const con: Contract = {
    clubId: o.clubId, role: o.role, wage: o.wage, startW: s.week, endW: s.week + o.years * 52 - swOf(s.week) + (swOf(s.week) > 30 ? 52 : 0),
    signing: o.signing, appBonus: o.appBonus, goalBonus: o.goalBonus, titleBonus: Math.round(o.wage * 0.05), buyout: o.buyout, loanFrom: loanFrom ?? '', youth: false
  };
  if (o.loan && parentContract) con.endW = Math.min(con.endW, (seasonOf(s.week) + 1) * 52);
  s.career.contract = con;
  s.career.clubId = o.clubId;
  s.career.clubsHist.push({ clubId: o.clubId, fromS: seasonOf(s.week), toS: -1 });
  s.career.freeAgentW = -1;
  s.career.promisedRole = o.role;
  s.career.cur = emptyRec(seasonOf(s.week), o.clubId, cs.name, '', '', 2, o.loan);
  s.career.seasonMinsAcc = 0;
  s.career.seasonAvailAcc = 0;
  let restage = false;
  if (firstPro) {
    s.career.signed = true;
    if (s.phase === 'youth' && (s.career.youthStage === 'U15' || s.career.youthStage === 'U17' || s.career.youthStage === 'HS')) {
      s.career.youthStage = 'U19';
      restage = true;
    } else if (s.phase === 'youth' && s.career.youthStage === 'UNI') {
      s.career.youthStage = 'RES';
      restage = true;
    }
    if (s.career.track === 'school') s.ev.flags.schoolPro = s.week;
    s.career.track = 'pro';
  }
  if (o.signing > 0) {
    s.fin.cash += o.signing * 0.7;
    s.fin.yearIncomeAcc += o.signing;
  }
  s.fin.housing = o.loan ? s.fin.housing : s.fin.housing === 'family' && age < 18 ? 'family' : s.fin.housing === 'own' ? 'own' : getClub(prev || o.clubId).city === cs.city && s.fin.housing !== 'dorm' ? s.fin.housing : age < 18 ? 'dorm' : 'rent';
  if (age >= 18 && s.fin.housing === 'dorm') s.fin.housing = 'rent';
  if (!(s.phase === 'youth' && prev === o.clubId)) buildClubPeople(s, rng, o.clubId, !hadPrev);
  setupClubSeason(s, o.clubId, true);
  if (s.phase === 'youth' && prev !== o.clubId) changeYouthClub(s);
  else if (s.phase === 'youth' && restage) restageYouth(s);
  const lvl = clubLvl(s, o.clubId);
  s.career.cur.lvl = lvl;
  s.career.maxLvl = Math.max(s.career.maxLvl, lvl);
  s.career.bigClub = o.tag === 'renew' ? s.career.bigClub : lvl >= 5 && hunit(`${s.cfg.seed}|big`) < Math.min(1, Math.pow(Math.max(mFor(s.p.country), 1e-6), 0.5));
  if (cs.country !== s.p.country) {
    s.ev.flags.abroad = s.week;
    s.fame.abroad = clamp(s.fame.abroad + 1.5 + lvl, 0, 100);
    s.st.stress = clamp(s.st.stress + 4 * (1 - s.hid.adapt / 120), 0, 100);
    if (s.hid.adapt < 45) s.st.happy = clamp(s.st.happy - 4, 0, 100);
  } else delete s.ev.flags.abroad;
  if (prev) {
    s.people.coach.rel += 0;
  }
  if (firstPro) {
    addLog(s, 'milestone', '프로 계약', `${cs.name}와(과) ${Math.round(o.years)}년 프로 계약을 맺었다. 약속된 역할은 ${roleLabel(o.role)}.`, [], { star: true });
  } else {
    addLog(s, 'milestone', o.loan ? '임대' : '이적', `${cs.name}${o.loan ? '로 임대 이적' : '로 이적'}했다 (${reason}). 약속된 역할은 ${roleLabel(o.role)}.`, [], { star: true });
  }
  toast(s, `${cs.name} 입단 · ${roleLabel(o.role)}`);
  if (isCosmetic()) s.cues.push('transfer');
  s.fame.value = marketValue(s);
}

export function roleLabel(r: Role): string {
  return { starter: '주전', rotation: '로테이션', prospect: '유망주', backup: '백업' }[r];
}

export function updateRole(s: GameState): void {
  const con = s.career.contract;
  if (!con || !s.career.clubId) return;
  const margin = curOvr(s.ab) - clubStd(s, s.career.clubId);
  const age = ageAt(s.p.birth, s.week);
  const r = roleFor(margin + s.people.coach.rel / 40, age, s.ab.pot, clubStd(s, s.career.clubId));
  const target: Role = r ?? 'backup';
  if (ROLE_VAL[target] > ROLE_VAL[con.role]) con.role = target;
  else if (ROLE_VAL[target] < ROLE_VAL[con.role]) con.role = target;
}

export function leaveToFree(s: GameState, reason: string): void {
  if (s.career.clubId) {
    if (s.phase === 'youth') closeYouthCurrent(s);
    s.career.clubsHist[s.career.clubsHist.length - 1].toS = seasonOf(s.week);
    closeCurrent(s);
    s.career.cur = emptyRec(seasonOf(s.week), '', '', '', '', 2);
  }
  s.career.clubId = '';
  s.career.track = 'pro';
  s.yt = null;
  s.career.contract = null;
  s.career.freeAgentW = s.week;
  s.career.fixtures.length = 0;
  addLog(s, 'system', '무적 신분', `소속 구단이 없어졌다 (${reason}). 새 팀을 찾아야 한다.`, []);
}

export function genYouthJudgement(s: GameState, rng: Rng): { pass: boolean; score: number; need: number; offers: Offer[] } {
  const ovr = curOvr(s.ab);
  const score = ovr + 0.4 * (s.ab.pot - ovr) + getCal().youthBoost + rng.normal(0, 2.5);
  const need = 60;
  const pass = score >= need;
  if (!pass) return { pass, score, need, offers: [] };
  const n = rng.int(1, 4);
  let offers = genOffers(s, rng, 'first', n);
  if (!offers.length) {
    const fb = fallbackOffer(s, rng, 'first');
    if (fb) { fb.trial = false; offers = [fb]; }
  }
  return { pass, score, need, offers };
}

export function priceOf(code: string): number {
  return priceF(code);
}
