import { Rng, clamp } from './rng';
import { curOvr } from './attributes';
import { clubSt, clubStd, dyn, simScore, record, positionOf } from './world';
import { getClub, getCountry } from './data';
import { ageAt } from './time';
import type { Fixture, GameState, Pos, Role } from './types';

export const ROLE_BONUS: Record<Role, number> = { starter: 1.4, rotation: 0.2, prospect: -0.9, backup: -2 };

const POS_GOAL: Record<Pos, number> = { ST: 0.3, LW: 0.14, RW: 0.14, AM: 0.12, CM: 0.07, DM: 0.03, LB: 0.025, RB: 0.025, CB: 0.04, GK: 0 };
const POS_ASSIST: Record<Pos, number> = { ST: 0.1, LW: 0.17, RW: 0.17, AM: 0.2, CM: 0.12, DM: 0.04, LB: 0.1, RB: 0.1, CB: 0.02, GK: 0.005 };

export interface MatchOut {
  fx: Fixture;
  hg: number;
  ag: number;
  myGoals: number;
  oppGoals: number;
  result: 'W' | 'D' | 'L';
  played: boolean;
  started: boolean;
  mins: number;
  goals: number;
  assists: number;
  rating: number;
  cs: boolean;
  yc: number;
  rc: number;
  pens: boolean;
  penWin: boolean;
  homeName: string;
  awayName: string;
  line: string;
  moment: string;
  firstPro: boolean;
  advance: boolean;
}

export function effOvr(s: GameState): number {
  const base = curOvr(s.ab);
  const sharp = 0.88 + 0.12 * (s.st.sharp / 100);
  const fat = 1 - 0.10 * Math.max(0, s.st.fatigue - 55) / 45;
  const mor = 0.97 + 0.06 * (s.st.morale / 100);
  const frm = 1 + ((s.st.form.length ? s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length : 6.5) - 6.5) * 0.006;
  return base * sharp * fat * mor * frm;
}

export function youthStd(s: GameState, clubId: string, age: number): number {
  const std = clubStd(s, clubId);
  const f = 0.52 + 0.48 * Math.pow(clamp((age - 11) / 8, 0, 1), 0.85);
  return std * 0.86 * f + 6;
}

export function selectionX(s: GameState, margin: number, role: Role, youth: boolean): number {
  const coachRel = s.people.coach ? s.people.coach.rel : 0;
  const fit = s.people.coach ? s.people.coach.traitVal : 0;
  const frm = s.st.form.length ? s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length - 6.5 : 0;
  let x = margin / 3.4 + (youth ? 0.8 : ROLE_BONUS[role]) + coachRel / 70 + fit + frm * 0.5;
  if (s.st.fatigue > 60) x -= (s.st.fatigue - 60) / 40;
  x += (s.st.sharp - 60) / 80;
  return x;
}

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function momentTrigger(s: GameState, fx: Fixture, out: MatchOut, clubId: string): string {
  if (!out.played || out.mins < 12) return '';
  if (out.pens && out.started) return 'shootout';
  if (fx.final && fx.kind !== 'league') return 'final';
  if (out.firstPro) return 'debut';
  if (fx.kind === 'intl' && s.nat.caps === 1 && s.nat.status === 'senior') return 'intl_debut';
  if (fx.kind === 'league') {
    const lg = dyn(s, clubId).lg;
    const rt = s.world.leagues[lg];
    if (rt) {
      const total = (rt.order.length % 2 === 0 ? rt.order.length - 1 : rt.order.length) * 2;
      if (rt.round >= total - 2 && positionOf(s, lg, clubId) >= rt.order.length - 4) return 'relegation';
    }
    if (fx.big) return 'derby';
  }
  return '';
}

export function isDerby(s: GameState, a: string, b: string): boolean {
  const ca = getClub(a);
  const cb = getClub(b);
  return ca.city === cb.city && ca.country === cb.country;
}

export function playPlayerMatch(s: GameState, rng: Rng, fx: Fixture, youth: boolean): MatchOut {
  const clubId = s.career.clubId;
  const myClub = getClub(clubId);
  const mySt = fx.kind === 'intl' ? natTeamBase(s.p.country) : clubSt(s, clubId) + (youth ? -2 : 0);
  const [hg, ag] = fx.home ? simScore(rng, mySt, fx.oppSt) : simScore(rng, fx.oppSt, mySt);
  const myG = fx.home ? hg : ag;
  const opG = fx.home ? ag : hg;
  let pens = false;
  let penWin = false;
  if (fx.ko && myG === opG) {
    pens = true;
    penWin = rng.chance(0.5 + (mySt - fx.oppSt) / 200);
  }
  const result: 'W' | 'D' | 'L' = myG > opG ? 'W' : myG < opG ? 'L' : pens ? (penWin ? 'W' : 'L') : 'D';
  const out: MatchOut = {
    fx, hg, ag, myGoals: myG, oppGoals: opG, result, played: false, started: false, mins: 0, goals: 0, assists: 0, rating: 0, cs: false, yc: 0, rc: 0,
    pens, penWin, homeName: '', awayName: '', line: '', moment: '', firstPro: false, advance: result === 'W'
  };
  const myName = fx.kind === 'intl' ? '대표팀' : myClub.name;
  out.homeName = fx.home ? myName : fx.opp;
  out.awayName = fx.home ? fx.opp : myName;
  const age = ageAt(s.p.birth.y, s.week);
  if (s.st.injury || s.phase === 'coach' || s.phase === 'postcareer' || (fx.kind === 'friendly' && false)) return out;
  const role = s.career.contract?.role ?? 'prospect';
  const pos = s.ab.pos;
  let margin: number;
  if (fx.kind === 'intl') margin = effOvr(s) - natStd(s);
  else if (youth) margin = effOvr(s) - youthStd(s, clubId, age);
  else margin = effOvr(s) - clubStd(s, clubId);
  if (fx.kind === 'cup' || fx.kind === 'friendly') margin += 1.5;
  const x = selectionX(s, margin, fx.kind === 'intl' ? 'rotation' : role, youth);
  const pStart = logistic(x);
  const pSub = logistic(x + 1.3) * 0.85;
  const u = rng.next();
  let started = false;
  let mins = 0;
  if (u < pStart) {
    started = true;
    mins = 90 - (rng.chance(0.3) ? rng.int(8, 40) : 0);
  } else if (rng.next() < pSub) {
    mins = rng.int(8, 38);
  }
  if (fx.kind === 'friendly' && started) mins = Math.min(mins, rng.int(45, 75));
  if (mins === 0) {
    s.career.seasonAvailAcc += 1;
    return out;
  }
  out.played = true;
  out.started = started;
  out.mins = mins;
  const mf = mins / 90;
  const shootQ = clamp(((s.ab.a.finishing + s.ab.a.shooting) / 2) / 11, 0.55, 1.7);
  const passQ = clamp(((s.ab.a.passing + s.ab.a.vision + s.ab.a.crossing) / 3) / 11, 0.55, 1.7);
  const form = Math.exp(clamp(margin, -25, 20) / 22);
  const gShare = clamp(POS_GOAL[pos] * form * shootQ * mf * (s.ab.traits.includes('clutch') ? 1.05 : 1), 0, 0.7);
  const aShare = clamp(POS_ASSIST[pos] * form * passQ * mf, 0, 0.6);
  let goals = 0;
  let assists = 0;
  for (let i = 0; i < myG; i++) {
    if (rng.next() < gShare) goals++;
    else if (rng.next() < aShare / Math.max(0.3, 1 - gShare)) assists++;
  }
  let yc = 0;
  let rc = 0;
  const aggr = (s.ab.a.aggression + s.ab.a.tackling) / 2 / 10;
  if (rng.next() < 0.11 * aggr * (pos === 'DM' || pos === 'CB' ? 1.35 : 1) * mf * (1 + s.hid.temper / 250)) yc = 1;
  if (rng.next() < (0.006 + s.hid.temper / 9000) * mf) rc = 1;
  else if (yc && rng.next() < 0.05) rc = 1;
  const cs = opG === 0 && mins >= 60 && (pos === 'GK' || pos === 'CB' || pos === 'LB' || pos === 'RB' || pos === 'DM');
  let rating = 6.1 + 0.85 * Math.tanh(margin / 9) + rng.normal(0, 0.52) + (result === 'W' ? 0.28 : result === 'L' ? -0.22 : 0) + goals * 0.9 + assists * 0.55 + (cs ? 0.35 : 0) - yc * 0.2 - rc * 0.9;
  if (mins < 60) rating = 6 + (rating - 6) * (0.45 + mins / 140);
  rating = clamp(Math.round(rating * 10) / 10, 3, 10);
  out.goals = goals;
  out.assists = assists;
  out.rating = rating;
  out.cs = cs;
  out.yc = yc;
  out.rc = rc;
  const cur = s.career.cur;
  const first = s.career.debuted && s.ev.flags.pro_debut === undefined && !youth && fx.kind !== 'friendly';
  out.firstPro = first;
  if (fx.kind !== 'friendly') {
    cur.apps += 1;
    if (started) cur.starts += 1;
    cur.mins += mins;
    cur.goals += goals;
    cur.assists += assists;
    cur.ratingSum += rating;
    cur.ratingN += 1;
    if (cs) cur.cs += 1;
    cur.yc += yc;
    cur.rc += rc;
    if (fx.kind === 'intl') {
      cur.intApps += 1;
      cur.intGoals += goals;
    }
    s.career.seasonMinsAcc += mins;
    s.career.seasonAvailAcc += 1;
    s.st.form.push(rating);
    if (s.st.form.length > 5) s.st.form.shift();
  }
  s.st.sharp = clamp(s.st.sharp + mf * 9, 0, 100);
  s.st.fatigue = clamp(s.st.fatigue + mf * (fx.kind === 'friendly' ? 4 : 7.5), 0, 100);
  s.st.morale = clamp(s.st.morale + (result === 'W' ? 2.2 : result === 'L' ? -2 : 0.2) + (rating - 6.5) * 0.7, 0, 100);
  s.st.happy = clamp(s.st.happy + (result === 'W' ? 0.8 : result === 'L' ? -0.6 : 0) + (started ? 0.3 : -0.2), 0, 100);
  s.st.stress = clamp(s.st.stress + (fx.final ? 4 : 0.6) + (rc ? 3 : 0) - (result === 'W' ? 0.7 : 0), 0, 100);
  if (rc && fx.kind === 'league') s.ev.flags.suspended = s.week;
  const con = s.career.contract;
  if (con && fx.kind !== 'friendly') {
    const bonus = (started || mins > 20 ? con.appBonus : 0) + goals * con.goalBonus;
    if (bonus > 0) {
      s.fin.cash += bonus * (1 - 0.3);
      s.fin.yearIncomeAcc += bonus;
    }
  }
  if (s.people.fans && fx.kind !== 'friendly') {
    s.people.fans.rel = clamp(s.people.fans.rel + (rating >= 7.4 ? 0.45 : rating < 5.5 ? -0.4 : 0.05) + goals * 0.3, -100, 100);
  }
  if (s.people.coach && fx.kind !== 'friendly') {
    s.people.coach.rel = clamp(s.people.coach.rel + (rating >= 7.2 ? 0.35 : rating < 5.4 ? -0.35 : 0) + (rc ? -2 : 0), -100, 100);
  }
  s.fame.dom = clamp(s.fame.dom + (fx.kind === 'intl' ? 0.2 : 0.02) * (0.4 + clubLevelFame(s) / 6) * (goals + 0.3 * assists + (rating > 7.5 ? 0.5 : 0)), 0, 100);
  out.moment = momentTrigger(s, fx, out, clubId);
  out.line = `${out.homeName} ${hg}-${ag} ${out.awayName}${pens ? (penWin ? ' (승부차기 승)' : ' (승부차기 패)') : ''}`;
  return out;
}

function clubLevelFame(s: GameState): number {
  return s.career.cur.lvl || 2;
}

export function natTeamBase(code: string): number {
  return getCountry(code).natBase;
}

export function natStd(s: GameState): number {
  return natTeamBase(s.p.country) - 3;
}

export function playTeamOnly(s: GameState, rng: Rng, fx: Fixture, mySt: number): MatchOut {
  const [hg, ag] = fx.home ? simScore(rng, mySt, fx.oppSt) : simScore(rng, fx.oppSt, mySt);
  const myG = fx.home ? hg : ag;
  const opG = fx.home ? ag : hg;
  let pens = false;
  let penWin = false;
  if (fx.ko && myG === opG) {
    pens = true;
    penWin = rng.chance(0.5 + (mySt - fx.oppSt) / 200);
  }
  const result: 'W' | 'D' | 'L' = myG > opG ? 'W' : myG < opG ? 'L' : pens ? (penWin ? 'W' : 'L') : 'D';
  return {
    fx, hg, ag, myGoals: myG, oppGoals: opG, result, played: false, started: false, mins: 0, goals: 0, assists: 0, rating: 0, cs: false, yc: 0, rc: 0,
    pens, penWin, homeName: '', awayName: '', line: '', moment: '', firstPro: false, advance: result === 'W'
  };
}

export function recordLeagueResult(s: GameState, lgId: string, clubId: string, fx: Fixture, out: MatchOut): void {
  const opp = fx.oppId;
  const home = fx.home ? clubId : opp;
  const away = fx.home ? opp : clubId;
  record(s, lgId, home, away, out.hg, out.ag);
}
