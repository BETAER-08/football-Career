import { ageAt, seasonOf } from './time';
import type { Rng } from './rng';
import type { GameState } from './types';

export const MAX_MAJOR = 2;
export const MAX_MINOR = 2;

export function initBudget(s: GameState, rng: Rng): void {
  const b = s.ev.bud;
  const epi = s.phase === 'postcareer' && s.post.path !== 'none' && s.post.path !== 'left';
  b.s = seasonOf(s.week);
  b.choiceT = epi ? 1 : rng.int(2, 4);
  b.passT = epi ? rng.int(3, 4) : rng.int(6, 8);
  b.choiceN = 0;
  b.majorN = 0;
  b.minorN = 0;
  b.passN = 0;
}

export function budgetBonus(s: GameState): number {
  const season = seasonOf(s.week);
  const age = ageAt(s.p.birth, s.week);
  const con = s.career.contract;
  const left = con ? con.endW - s.week : 0;
  let v = 0;
  if (s.phase === 'youth' && age >= 17) v += 1;
  if (s.phase === 'pro' && s.career.debutW >= 0 && seasonOf(s.career.debutW) === season) v += 1;
  if (s.phase === 'pro' && con && !con.youth && left > 0 && left <= 52) v += 1;
  if ((s.phase === 'youth' || s.phase === 'pro') && s.st.injury && s.st.injury.weeksLeft >= 8) v += 1;
  const ab = s.ev.flags.abroad;
  if (s.phase === 'pro' && ab !== undefined && seasonOf(ab) === season) v += 1;
  if (s.phase === 'pro' && age >= 32) v += 1;
  if (s.phase === 'coach' && s.coach.role === 'manager' && s.coach.managerSeasons === 0) v += 2;
  if (s.phase === 'pro' && con && !con.youth && con.role === 'starter' && left >= 104) {
    const h = s.career.clubsHist[s.career.clubsHist.length - 1];
    if (h && season - h.fromS >= 1) v -= 1;
  }
  return v;
}

export function budgetTarget(s: GameState): number {
  const epi = s.phase === 'postcareer' && s.post.path !== 'none' && s.post.path !== 'left';
  if (epi) return s.ev.bud.choiceT;
  return Math.max(1, Math.min(5, s.ev.bud.choiceT + budgetBonus(s)));
}

export function tierRoom(s: GameState, tier: 'major' | 'minor' | undefined): boolean {
  const b = s.ev.bud;
  if (tier === 'major') return b.majorN < MAX_MAJOR;
  return b.minorN < MAX_MINOR || (b.minorN < MAX_MINOR + (budgetBonus(s) > 0 ? 1 : 0));
}
