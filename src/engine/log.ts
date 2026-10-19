import type { Chip, GameState, LogEntry } from './types';

let fast = false;
export function setFast(v: boolean): void {
  fast = v;
}
export function isFast(): boolean {
  return fast;
}

export function addLog(s: GameState, kind: LogEntry['kind'], title: string, text: string, chips: Chip[] = [], extra: Partial<LogEntry> = {}): void {
  if (fast) return;
  const e: LogEntry = { id: s.ev.nextId++, w: s.week, kind, title, text, chips: chips.filter((c) => Math.abs(c.d) >= 1e-9), ...extra };
  s.log.push(e);
  if (s.log.length > 1500) {
    const keep = s.log.filter((l, i) => l.star || i >= s.log.length - 1000 || l.kind === 'milestone');
    s.log = keep.slice(-1300);
  }
}

export function toast(s: GameState, text: string, chips: Chip[] = []): void {
  if (fast) return;
  s.toasts.push({ id: s.ev.nextId++, w: s.week, text, chips: chips.filter((c) => Math.abs(c.d) >= 1e-9) });
  if (s.toasts.length > 6) s.toasts.shift();
}
