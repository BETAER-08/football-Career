import { isCosmetic } from './flags';
import type { GameState } from './types';

let cause = '';

export function setCause(c: string): void {
  cause = c;
}

export function clearCause(): void {
  cause = '';
}

export function recordWhy(s: GameState, key: string, c: string, d: number): void {
  if (!isCosmetic() || Math.abs(d) < 0.03 || !c) return;
  const list = s.why[key] ?? (s.why[key] = []);
  const top = list[0];
  if (top && top.c === c && top.w === s.week) {
    top.d += d;
    return;
  }
  list.unshift({ c, d: Math.round(d * 100) / 100, w: s.week });
  if (list.length > 3) list.length = 3;
}

export function whyNow(s: GameState, key: string, d: number): void {
  if (cause) recordWhy(s, key, cause, d);
}
