import { applyFx } from './fx';
import { addLog } from './log';
import { stream } from './streams';
import { seasonOf } from './time';
import type { Rng } from './rng';
import type { GameState, GoalDef, Pos, SeasonGoals } from './types';
import { getLeague } from './data';
import { clubLeagueId } from './world';

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

export function makeGoals(s: GameState, rng: Rng | null = null): SeasonGoals | null {
  if (s.phase !== 'youth' && s.phase !== 'pro') return null;
  if (!s.career.clubId) return null;
  const season = seasonOf(s.week);
  const g = games(s);
  const role = s.career.contract?.role ?? 'prospect';
  const r = rng ?? stream(s.cfg.seed, 'goals', season);
  void r;
  const youth = s.phase === 'youth';
  let club: GoalDef;
  let mult = 1;
  if (youth) {
    club = { id: 'c', label: `리그 ${Math.round(g * 0.5)}경기 출전`, metric: 'apps', target: Math.round(g * 0.5) };
    mult = 0.6;
  } else if (role === 'starter') {
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
  const c = s.career.cur;
  switch (d.metric) {
    case 'apps': return c.apps;
    case 'starts': return c.starts;
    case 'goals': return c.goals;
    case 'cs': return c.cs;
    case 'rating': return c.ratingN >= 5 ? c.ratingSum / c.ratingN : 0;
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
