import { swOf } from '../engine/time';
import type { GameState } from '../engine/types';

export function matchesThisWeekPeek(s: GameState): boolean {
  const sw = swOf(s.week);
  for (const f of s.career.fixtures) if (f.w === sw && f.kind !== 'friendly') return true;
  return false;
}
