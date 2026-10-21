import { applyFx } from './fx';
import { addLog } from './log';
import { stream } from './streams';
import { seasonOf } from './time';
import type { Rng } from './rng';
import type { GameState, GoalDef, Pos, SeasonGoals } from './types';
import { getLeague } from './data';
import { clubLeagueId } from './world';
import { STAGE_LABEL } from './stages';
import { ageAt } from './time';

export const DREAM_LABEL: Record<string, string> = {
  legend: '고향 팀의 레전드', bigstarter: '빅리그 주전', national: '국가대표', ballon: '발롱도르', rich: '부자'
};

function games(s: GameState): number {
  const id = s.career.clubId;
  if (!id) return 34;
  const lg = getLeague(clubLeagueId(s, id));
  const n = lg.clubIds.length;
  return (n % 2 === 0 ? n - 1 : n) * 2;
}

function personal(pos: Pos, mult: number): GoalDef {
  const m = (v: number, lo: number) => Math.max(lo, Math.round(v * mult));
  if (pos === 'ST') return { id: 'p', label: `리그 ${m(10, 3)}골`, metric: 'goals', target: m(10, 3) };
  if (pos === 'LW' || pos === 'RW') return { id: 'p', label: `리그 ${m(7, 2)}골`, metric: 'goals', target: m(7, 2) };
  if (pos === 'AM') return { id: 'p', label: `리그 ${m(6, 2)}골`, metric: 'goals', target: m(6, 2) };
  if (pos === 'GK' || pos === 'CB') return { id: 'p', label: `클린시트 ${m(10, 3)}회`, metric: 'cs', target: m(10, 3) };
  return { id: 'p', label: `평균 평점 ${mult >= 0.9 ? '7.0' : '6.8'} 이상`, metric: 'rating', target: mult >= 0.9 ? 7.0 : 6.8 };
}

function youthGames(s: GameState): number {
  return s.yt ? s.yt.games : 26;
}

function youthPersonal(s: GameState): GoalDef {
  const pos = s.ab.pos;
  const g = youthGames(s);
  const stage = s.career.youthStage;
  const m = stage === 'U15' ? 0.8 : stage === 'RES' ? 0.7 : 1;
  const k = (v: number, lo: number) => Math.max(lo, Math.round(v * m * (g / 26)));
  if (pos === 'ST') return { id: 'p', label: `${STAGE_LABEL[stage]} 리그 ${k(10, 3)}골`, metric: 'goals', target: k(10, 3) };
  if (pos === 'LW' || pos === 'RW' || pos === 'AM') return { id: 'p', label: `${STAGE_LABEL[stage]} 리그 ${k(6, 2)}골 ${k(5, 2)}도움`, metric: 'goals', target: k(6, 2) };
  if (pos === 'GK' || pos === 'CB') return { id: 'p', label: `${STAGE_LABEL[stage]} 클린시트 ${k(8, 3)}회`, metric: 'cs', target: k(8, 3) };
  if (pos === 'CM') return { id: 'p', label: `${STAGE_LABEL[stage]} 리그 ${k(5, 2)}도움`, metric: 'assists', target: k(5, 2) };
  return { id: 'p', label: '평균 평점 6.8 이상', metric: 'rating', target: 6.8 };
}

function youthGoals(s: GameState): { club: GoalDef; personal: GoalDef } {
  const stage = s.career.youthStage;
  const e = s.career.entry;
  const age = ageAt(s.p.birth, s.week);
  const g = youthGames(s);
  if (s.career.signed && !s.career.debuted) {
    const club: GoalDef = e.step >= 2 ? { id: 'c', label: '1군 데뷔', metric: 'debut', target: 1 } : e.step === 1 ? { id: 'c', label: '1군 명단 5회 이상', metric: 'squad', target: 5 } : { id: 'c', label: '1군 훈련 합류', metric: 'train', target: 1 };
    const rec: GoalDef = stage === 'RES' ? { id: 'p', label: `리저브 리그 ${Math.round(g * 0.6)}경기 출전`, metric: 'apps', target: Math.round(g * 0.6) } : { id: 'p', label: `U19 리그 ${Math.round(g * 0.6)}경기 출전`, metric: 'apps', target: Math.round(g * 0.6) };
    return { club, personal: rec.metric === 'apps' && s.ab.pos !== 'GK' ? youthPersonal(s) : rec };
  }
  if (s.career.signed && s.career.debuted) {
    return { club: { id: 'c', label: '1군 5경기 출전', metric: 'squad', target: 5 }, personal: youthPersonal(s) };
  }
  let club: GoalDef;
  if (s.career.track === 'pro' && age >= 16 && s.career.scholar === 0 && stage !== 'U15') club = { id: 'c', label: '장학 계약 체결', metric: 'scholar', target: 1 };
  else if (s.career.track === 'pro' && age >= 16 && e.step === 0 && stage !== 'U15') club = { id: 'c', label: '1군 훈련 합류', metric: 'train', target: 1 };
  else club = { id: 'c', label: `${STAGE_LABEL[stage]} 리그 ${Math.round(g * 0.6)}경기 출전`, metric: 'apps', target: Math.round(g * 0.6) };
  return { club, personal: youthPersonal(s) };
}

export function makeGoals(s: GameState, rng: Rng | null = null): SeasonGoals | null {
  if (s.phase !== 'youth' && s.phase !== 'pro') return null;
  if (!s.career.clubId) return null;
  const season = seasonOf(s.week);
  const r = rng ?? stream(s.cfg.seed, 'goals', season);
  void r;
  if (s.phase === 'youth') {
    const y = youthGoals(s);
    return { s: season, club: y.club, personal: y.personal, settled: false };
  }
  const g = games(s);
  const role = s.career.contract?.role ?? 'prospect';
  if (!s.career.debuted) {
    const e = s.career.entry;
    const club: GoalDef = e.squadN < 5 ? { id: 'c', label: '1군 명단 등록 5회', metric: 'squadReg', target: e.squadN + 5, base: e.squadN } : { id: 'c', label: '1군 데뷔', metric: 'debut', target: 1 };
    return { s: season, club, personal: { id: 'p', label: '리저브 평균 평점 6.8 이상', metric: 'resrating', target: 6.8 }, settled: false };
  }
  let club: GoalDef;
  let mult = 1;
  if (role === 'starter') {
    club = { id: 'c', label: `리그 ${Math.round(g * 0.7)}경기 출전`, metric: 'apps', target: Math.round(g * 0.7) };
  } else if (role === 'rotation') {
    club = { id: 'c', label: `로테이션 확보 (선발 ${Math.round(g * 0.35)}경기)`, metric: 'starts', target: Math.round(g * 0.35) };
    mult = 0.6;
  } else {
    club = { id: 'c', label: `1군 ${Math.max(5, Math.round(g * 0.2))}경기 출전`, metric: 'apps', target: Math.max(5, Math.round(g * 0.2)) };
    mult = 0.3;
  }
  return { s: season, club, personal: personal(s.ab.pos, mult), settled: false };
}

export function goalValue(s: GameState, d: GoalDef): number {
  const youth = s.phase === 'youth' && !(s.career.signed && s.career.debuted && (d.metric === 'squad'));
  const c = youth ? s.career.yCur : s.career.cur;
  switch (d.metric) {
    case 'apps': return c.apps;
    case 'starts': return c.starts;
    case 'goals': return c.goals;
    case 'assists': return c.assists;
    case 'cs': return c.cs;
    case 'rating': return c.ratingN >= 5 ? c.ratingSum / c.ratingN : 0;
    case 'scholar': return s.career.scholar === 1 ? 1 : 0;
    case 'train': return s.career.entry.step >= 1 ? 1 : 0;
    case 'squad': return s.career.debuted ? s.career.cur.apps : s.career.entry.squadN;
    case 'debut': return s.career.debuted ? 1 : 0;
    case 'squadReg': return s.career.entry.squadN;
    case 'resrating': return s.career.resCur.ratingN >= 5 ? s.career.resCur.ratingSum / s.career.resCur.ratingN : 0;
    default: return 0;
  }
}

export function settleGoals(s: GameState, rng: Rng): { label: string; done: boolean; reward: string }[] {
  const g = s.goals;
  if (!g || g.settled) return [];
  g.settled = true;
  const out: { label: string; done: boolean; reward: string }[] = [];
  const one = (d: GoalDef, ok: string, bad: string, tag: string) => {
    d.done = goalValue(s, d) >= d.target;
    const fx = d.done ? ok : bad;
    const chips = applyFx(s, { rng }, fx);
    const reward = chips.map((c) => `${c.k} ${c.d > 0 ? '+' : ''}${Math.round(c.d * 10) / 10}`).join(', ');
    addLog(s, 'system', `${tag} 목표 ${d.done ? '달성' : '미달'}`, `${d.label} — ${d.done ? '달성했다.' : '이루지 못했다.'}`, chips);
    out.push({ label: `${tag}: ${d.label}`, done: !!d.done, reward });
  };
  one(g.club, 'morale+5 rel.coach+3 fameD+0.3', 'morale-3 rel.coach-2', '구단 기대');
  one(g.personal, 'morale+4 fameD+0.5 happy+2', 'morale-2', '개인');
  return out;
}
