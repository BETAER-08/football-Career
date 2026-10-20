import { ageAt, dateOf, fmtDate, seasonOf, swOf } from '../engine/time';
import { formatKRW } from '../engine/finance';
import type { Chip, GameState } from '../engine/types';

export { formatKRW };

export function chipText(c: Chip): string {
  if (c.d === 0) return c.k;
  if (c.u === '만') return `${c.k} ${c.d > 0 ? '+' : '-'}${formatKRW(Math.abs(c.d))}`;
  const v = Math.abs(c.d);
  const num = v >= 10 ? Math.round(v) : v >= 1 ? v.toFixed(1) : v.toFixed(2);
  return `${c.k} ${c.d > 0 ? '+' : '-'}${num}`;
}

export function arrowChip(c: Chip): string {
  if (c.d === 0) return c.k;
  const n = Math.min(3, Math.round(Math.abs(c.d)) || 1);
  return `${c.k}${(c.d > 0 ? '↑' : '↓').repeat(n)}`;
}

export function yearLabel(s: GameState): string {
  const d = dateOf(s.week);
  return `${d.y}년`;
}

export function dateLabel(s: GameState): string {
  return fmtDate(dateOf(s.week));
}

export function ageOf(s: GameState): number {
  return ageAt(s.p.birth, s.week);
}

export function yearProgress(s: GameState): number {
  return swOf(s.week) / 52;
}

export function seasonIndex(s: GameState): number {
  return seasonOf(s.week);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function mrz(s: GameState): [string, string] {
  const clean = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, '').trim().replace(/ +/g, '<');
  const parts = s.p.en.split(' ');
  const given = clean(parts.slice(0, -1).join(' ') || parts[0]);
  const sur = clean(parts[parts.length - 1]);
  const cc = s.p.country;
  const l1 = `P<${cc}${sur}<<${given}`.padEnd(30, '<').slice(0, 30);
  const yy = pad2(s.p.birth.y % 100);
  const id = String(Math.abs(hash(s.cfg.seed)) % 1000000000).padStart(9, '0');
  const l2 = `${id}<${cc}${yy}${pad2(s.p.birth.m)}${pad2(s.p.birth.d)}M${pad2(2026 % 100)}0701<<<<<<`.padEnd(30, '<').slice(0, 30);
  return [l1, l2];
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
}

export function seed32(str: string): number {
  return hash(str) >>> 0;
}

export function kstDateSeed(): string {
  const now = new Date(Date.now() + 9 * 3600 * 1000);
  return `daily-${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(now.getUTCDate())}`;
}

export function randomSeed(): string {
  const a = new Uint32Array(2);
  crypto.getRandomValues(a);
  return `${a[0].toString(36)}${a[1].toString(36)}`.toUpperCase();
}

export function whyText(s: GameState, key: string): string {
  const l = s.why[key];
  if (!l || !l.length) return '';
  return l.map((e) => `${e.d > 0 ? '+' : '−'}${Math.abs(e.d) >= 10 ? Math.round(Math.abs(e.d)) : Math.abs(e.d).toFixed(Math.abs(e.d) < 1 ? 2 : 1)} ${e.c}`).join(' · ');
}
