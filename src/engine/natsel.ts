import { Rng, clamp, seedState } from './rng';
import { curOvr } from './attributes';
import { getCountry } from './data';
import { clubLvl } from './world';
import { genName, makePerson } from './relations';
import { natTeamBase } from './match';
import { ageAt, seasonOf, yearOf } from './time';
import { addLog } from './log';
import type { GameState, NatLevel, NatStage, NatStyle, PoolMember, Pos, Role } from './types';
import { josa } from './josa';

export const LEVEL_ADJ: Record<NatLevel, number> = { A: 0, u23: -4, u20: -7, u17: -12 };
const AGE_RANGE: Record<NatLevel, [number, number]> = { A: [20, 33], u23: [19, 23], u20: [17, 20], u17: [15, 17] };

export const STYLE_LABEL: Record<NatStyle, string> = {
  attack: '공격적 · 최근 폼과 활약을 중시',
  defense: '수비적 · 소속팀 수준과 안정감을 중시',
  rebuild: '세대교체 · 젊은 선수를 선호',
  veteran: '경험 중시 · 대표팀 이력을 선호'
};

type Grp = 'GK' | 'DF' | 'MF' | 'FW';
const GROUP: Record<Pos, Grp> = { GK: 'GK', CB: 'DF', LB: 'DF', RB: 'DF', DM: 'MF', CM: 'MF', AM: 'MF', LW: 'FW', RW: 'FW', ST: 'FW' };
const FINAL_Q: Record<Grp, number> = { GK: 3, DF: 9, MF: 8, FW: 6 };
const PRELIM_Q: Record<Grp, number> = { GK: 4, DF: 14, MF: 12, FW: 10 };
const STARTER_Q: Record<Grp, number> = { GK: 1, DF: 4, MF: 3, FW: 3 };
const POSITIONS: Pos[] = ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST'];
const LVL_B: Record<number, number> = { 6: 4, 5: 2, 4: 0, 3: -2, 2: -4, 1: -4 };

interface Mul { club: number; place: number; form: number; hist: number; age: number }
const STYLE_MUL: Record<NatStyle, Mul> = {
  attack: { club: 1, place: 0.8, form: 1.2, hist: 1, age: 1 },
  defense: { club: 1.2, place: 1, form: 0.8, hist: 1, age: 1 },
  rebuild: { club: 1, place: 1, form: 1, hist: 0.8, age: 1.2 },
  veteran: { club: 1, place: 1, form: 0.8, hist: 1.2, age: 0.8 }
};

export interface SelIn { ovr: number; center: number; lvl: number; abroadTop: boolean; role: number; form: number; hist: number; body: number; age: number }
export interface Comps { skill: number; club: number; place: number; form: number; hist: number; body: number; age: number }

export function selComps(i: SelIn, style: NatStyle): Comps {
  const m = STYLE_MUL[style];
  return {
    skill: (i.ovr - i.center) * 1.6,
    club: ((LVL_B[i.lvl] ?? -4) + (i.abroadTop ? 1 : 0)) * m.club,
    place: i.role * m.place,
    form: (i.form - 6.8) * 3 * 0.55 * m.form,
    hist: i.hist * m.hist,
    body: -i.body,
    age: i.age >= 33 ? -(i.age - 32) * m.age : style === 'rebuild' && i.age <= 23 ? 1.2 : 0
  };
}

export function selScore(i: SelIn, style: NatStyle): number {
  const c = selComps(i, style);
  return c.skill + c.club + c.place + c.form + c.hist + c.body + c.age;
}

export function centerOf(s: GameState, level: NatLevel): number {
  const base = natTeamBase(s.p.country);
  return level === 'A' ? base - 4 : base + LEVEL_ADJ[level] - 18;
}

function newMember(rng: Rng, country: string, pos: Pos, level: NatLevel, center: number, age?: number): PoolMember {
  const c = getCountry(country);
  const [a0, a1] = AGE_RANGE[level];
  const lvl = clamp(Math.round(rng.normal(c.top - 1.3, 1)), 2, 6);
  return {
    name: genName(rng, country).name, pos, age: age ?? rng.int(a0, a1), ovr: Math.round((center + rng.normal(0, level === 'A' ? 4.5 : 4)) * 10) / 10,
    lvl, role: rng.weighted([3, 0, -3, -5], [35, 35, 20, 10]), caps: level === 'A' ? Math.max(0, Math.round(rng.normal(8, 9))) : 0, abroad: lvl > c.top
  };
}

function seasonSeed(s: GameState, level: NatLevel, season: number): Rng {
  return new Rng(seedState(`${s.cfg.seed}|natpool|${level}|${season}`));
}

export function ensurePool(s: GameState, level: NatLevel): PoolMember[] {
  const season = seasonOf(s.week);
  const center = centerOf(s, level);
  let pool = s.nat.pool[level];
  let at = s.nat.poolS[level];
  if (!pool || at === undefined) {
    const rng = seasonSeed(s, level, season);
    pool = [];
    for (const pos of POSITIONS) for (let k = rng.int(4, 6); k > 0; k--) pool.push(newMember(rng, s.p.country, pos, level, center));
    s.nat.pool[level] = pool;
    s.nat.poolS[level] = season;
    return pool;
  }
  while (at < season) {
    at += 1;
    const rng = seasonSeed(s, level, at);
    const [a0, a1] = AGE_RANGE[level];
    const next: PoolMember[] = [];
    for (const m of pool) {
      const age = m.age + 1;
      let ovr = m.ovr;
      if (level === 'A') ovr += age <= 24 ? 1.2 : age <= 29 ? 0.2 : -0.8 * (age - 29);
      else ovr += 1.5;
      ovr += rng.normal(0, 1.2);
      const gone = level === 'A' ? age >= 34 && rng.chance(0.5) || age >= 37 || ovr < center - 14 : age > a1 || ovr < center - 14;
      if (gone) continue;
      next.push({ ...m, age, ovr: Math.round(ovr * 10) / 10, caps: m.caps + (level === 'A' && ovr > center - 2 ? rng.int(0, 7) : 0), role: rng.chance(0.25) ? rng.weighted([3, 0, -3, -5], [35, 35, 20, 10]) : m.role });
    }
    for (const pos of POSITIONS) {
      let n = next.filter((m) => m.pos === pos).length;
      const want = rng.int(4, 6);
      while (n < want) {
        next.push(newMember(rng, s.p.country, pos, level, center, level === 'A' ? rng.int(20, 23) : rng.int(a0, a0 + 1)));
        n++;
      }
    }
    pool = next;
  }
  s.nat.pool[level] = pool;
  s.nat.poolS[level] = at;
  return pool;
}

export function ensureNatCoach(s: GameState, rng: Rng): void {
  const season = seasonOf(s.week);
  if (s.people.natcoach && s.nat.coachUntil >= 0 && season < s.nat.coachUntil) return;
  const changed = !!s.people.natcoach && s.nat.coachUntil >= 0;
  const styles: NatStyle[] = ['attack', 'defense', 'rebuild', 'veteran'];
  s.nat.coachStyle = rng.pick(styles);
  s.nat.coachUntil = season + rng.int(3, 5);
  const keepRel = s.people.natcoach ? s.people.natcoach.rel : 0;
  const p = makePerson(rng, s.ev, 'natcoach', s.p.country, { age: rng.int(45, 66), refYear: yearOf(s.week), job: '대표팀 감독', rel: changed ? Math.round(keepRel * 0.2) : 0 });
  p.style = STYLE_LABEL[s.nat.coachStyle];
  s.people.natcoach = p;
  if (changed) addLog(s, 'world', '대표팀 감독 교체', `${getCountry(s.p.country).natTeam} 감독이 ${josa(p.name, '으로')} 바뀌었다. 성향: ${STYLE_LABEL[s.nat.coachStyle]}.`, []);
}

export function roleScore(s: GameState): number {
  const a = s.nat.mins10;
  if (a.length < 4) return 0;
  const ex = a.filter((x) => x < 0).length;
  if (ex / a.length >= 0.5) return -5;
  const m = a.reduce((x, y) => x + Math.max(0, y), 0) / a.length;
  return m >= 0.65 ? 3 : m >= 0.3 ? 0 : -3;
}

export function pushMins(s: GameState, v: number): void {
  s.nat.mins10.push(Math.round(v * 100) / 100);
  if (s.nat.mins10.length > 10) s.nat.mins10.shift();
}

export function myInputs(s: GameState, level: NatLevel): SelIn {
  const age = ageAt(s.p.birth, s.week);
  const form = s.st.form.length ? s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length : 6.5;
  const clubId = s.career.clubId;
  const lvl = clubId ? clubLvl(s, clubId) : 1;
  const abroadTop = !!clubId && clubId.split(':')[0] !== s.p.country && lvl >= 5;
  const coachRel = s.people.natcoach ? s.people.natcoach.rel : 0;
  const recent = s.week - s.nat.lastCallW <= 20 ? 1.5 : 0;
  const hist = recent + Math.min(2, s.nat.caps / 10) + clamp(coachRel / 50, -2, 2);
  let body = 0;
  if (s.week - s.nat.injEndW <= 4) body += 2;
  if (s.st.sharp < 45) body += clamp(1 + (45 - s.st.sharp) / 10, 1, 3);
  return { ovr: curOvr(s.ab), center: centerOf(s, level), lvl, abroadTop, role: roleScore(s), form, hist, body: Math.min(3, body), age };
}

export interface NatResult { level: NatLevel; stage: NatStage; rank: number; quota: number; group: Grp; score: number; rivalsAbove: number; reasons: string[]; comps: Comps }

const REASON: Record<keyof Comps, string> = {
  skill: '대표팀 기준에 못 미치는 실력',
  club: '소속팀 수준이 낮음',
  place: '소속팀 출전 시간 부족',
  form: '최근 폼 부진',
  hist: '대표팀 이력과 감독 신뢰 부족',
  body: '몸 상태와 경기 감각 문제',
  age: '나이 부담'
};

export function natSelect(s: GameState, rng: Rng, level: NatLevel): NatResult {
  const style = s.nat.coachStyle;
  const me = myInputs(s, level);
  const pos = s.ab.pos;
  const group = GROUP[pos];
  const comps = selComps(me, style);
  const score = comps.skill + comps.club + comps.place + comps.form + comps.hist + comps.body + comps.age;
  const pool = ensurePool(s, level).filter((m) => GROUP[m.pos] === group);
  const center = me.center;
  let above = 0;
  for (const m of pool) {
    const inp: SelIn = {
      ovr: m.ovr, center, lvl: m.lvl, abroadTop: m.abroad && m.lvl >= 5, role: m.role, form: rng.normal(6.8, 0.35),
      hist: Math.min(2, m.caps / 10) + (rng.chance(0.5) ? 1.5 : 0), body: rng.chance(0.08) ? 2 : 0, age: m.age
    };
    if (selScore(inp, style) > score) above += 1;
  }
  const rank = above + 1;
  const floor = me.ovr >= center - 12 && !s.st.injury;
  let stage: NatStage = 'none';
  if (floor) {
    if (rank <= STARTER_Q[group]) stage = 'starter';
    else if (rank <= FINAL_Q[group]) stage = 'called';
    else if (rank <= PRELIM_Q[group]) stage = 'prelim';
  }
  const neg = (Object.keys(comps) as (keyof Comps)[]).filter((k) => comps[k] < -0.5).map((k) => ({ t: REASON[k], v: -comps[k] }));
  if (rank > FINAL_Q[group]) neg.push({ t: `같은 포지션 경쟁자 ${above}명이 더 높은 평가를 받음`, v: Math.min(8, (rank - FINAL_Q[group]) * 1.2) });
  if (s.st.injury) neg.push({ t: '부상으로 명단에 오를 수 없음', v: 99 });
  neg.sort((a, b) => b.v - a.v);
  return { level, stage, rank, quota: FINAL_Q[group], group, score, rivalsAbove: above, reasons: neg.slice(0, 2).map((x) => x.t), comps };
}

export function natRoleOf(s: GameState): Role {
  return s.nat.stage === 'starter' ? 'starter' : s.nat.stage === 'called' ? 'rotation' : 'prospect';
}

export const STAGE_TEXT: Record<NatStage, string> = { none: '미발탁', prelim: '예비 명단', called: '소집', starter: '주전' };

export function applyStage(s: GameState, res: NatResult): void {
  const prev = s.nat.stage;
  s.nat.stage = res.stage;
  s.nat.stageW = s.week;
  const dropped = (prev === 'called' || prev === 'starter') && (res.stage === 'none' || res.stage === 'prelim');
  const lost = prev === 'prelim' && res.stage === 'none';
  if (res.stage === 'prelim') {
    s.nat.lastWhy = res.reasons;
    if (prev !== 'prelim') addLog(s, 'system', '대표팀 예비 명단', `${getCountry(s.p.country).natTeam} 예비 명단에 이름을 올렸다 (${res.group} ${res.rank}순위, 소집 ${res.quota}명). 아쉬운 점: ${res.reasons.join(' · ') || '경쟁이 치열했다'}.`, []);
  } else if (dropped || lost) {
    s.nat.lastWhy = res.reasons;
    addLog(s, 'system', '대표팀 탈락', `${getCountry(s.p.country).natTeam} 명단에서 빠졌다. 이유: ${res.reasons.join(' · ') || '포지션 경쟁'}.`, []);
  } else if (res.stage === 'called' || res.stage === 'starter') s.nat.lastWhy = [];
}
