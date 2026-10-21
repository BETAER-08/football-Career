import { allCountries, getClub, getLeague, leaguesOf } from '../engine/data';
import type { RouletteResult } from '../engine/roulette';
import { clubKit, countryCode3, countryColors, hashString32, readableOn } from './pixel/palette';

export const CELL_H = 62;
export const REEL_MS = 1600;
export const ACCEL_MS = 200;
export const DECEL_MS = 700;
export const GAP_MS = 300;
export const MIN_BODY = 30;
export const MAX_BODY = 40;
export const TAIL_CELLS = 2;
export const OVERSHOOT = 0.08;
export const CAPTION_MS = 300;
export const POP_MS = 250;
export const REDUCED_STEP_MS = 400;

export type ReelCell =
  | { kind: 'country'; key: string; name: string; code3: string; bg: string; fg: string }
  | { kind: 'league'; key: string; name: string; level: string }
  | { kind: 'club'; key: string; name: string; color: string };

export interface ReelPlan {
  cells: ReelCell[];
  resultAt: number;
  pool: ReelCell[];
}

export function leagueLevelLabel(lvl: number): string {
  if (lvl <= 2) return '하부리그';
  if (lvl === 3) return '프로 하위권';
  if (lvl === 4) return '프로 중위권';
  if (lvl === 5) return '빅리그';
  return '월드 빅클럽';
}

export function countryPool(): ReelCell[] {
  return allCountries().map((c) => {
    const col = countryColors(c.code);
    return { kind: 'country', key: c.code, name: c.ko, code3: countryCode3(c.code), bg: col.primary, fg: readableOn(col.primary) };
  });
}

export function leaguePool(country: string): ReelCell[] {
  return leaguesOf(country).map((l) => ({ kind: 'league', key: l.id, name: l.ko, level: leagueLevelLabel(l.lvl) }));
}

export function clubPool(leagueId: string): ReelCell[] {
  return getLeague(leagueId).clubIds.map((id) => {
    const c = getClub(id);
    return { kind: 'club', key: id, name: c.name, color: clubKit(id, c.color).primary };
  });
}

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildPlan(pool: ReelCell[], resultKey: string, seed: string, reel: number): ReelPlan {
  const rand = mulberry(hashString32(`${seed}|reel${reel}`));
  const body = MIN_BODY + Math.floor(rand() * (MAX_BODY - MIN_BODY + 1));
  const result = pool.find((c) => c.key === resultKey) ?? pool[0];
  const cells: ReelCell[] = [];
  let last = '';
  for (let i = 0; i < body + 1 + TAIL_CELLS; i++) {
    if (i === body) {
      cells.push(result);
      last = result.key;
      continue;
    }
    let pick = pool[Math.floor(rand() * pool.length)];
    for (let t = 0; t < 8 && pool.length > 1 && (pick.key === last || (i === body - 1 && pick.key === result.key) || (i > body && pick.key === result.key)); t++) {
      pick = pool[Math.floor(rand() * pool.length)];
    }
    cells.push(pick);
    last = pick.key;
  }
  return { cells, resultAt: body, pool };
}

function overshootFor(c1: number): number {
  const c3 = c1 + 1;
  let best = 1;
  for (let i = 0; i <= 400; i++) {
    const k = i / 400;
    const v = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    if (v > best) best = v;
  }
  return best - 1;
}

function solveBack(): number {
  let lo = 0.2;
  let hi = 4;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (overshootFor(mid) < OVERSHOOT) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const BACK = solveBack();

export function easeOutBack(k: number): number {
  const c3 = BACK + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + BACK * Math.pow(k - 1, 2);
}

export interface Motion {
  pos: number;
  speed: number;
  done: boolean;
}

export function motionAt(t: number, travel: number): Motion {
  const flat = REEL_MS - ACCEL_MS - DECEL_MS;
  const span = DECEL_MS / (BACK + 3);
  const v = travel / (ACCEL_MS / 2 + flat + span);
  if (t <= 0) return { pos: 0, speed: 0, done: false };
  if (t < ACCEL_MS) {
    const k = t / ACCEL_MS;
    return { pos: (v * ACCEL_MS * k * k) / 2, speed: k, done: false };
  }
  const p1 = (v * ACCEL_MS) / 2;
  if (t < ACCEL_MS + flat) return { pos: p1 + v * (t - ACCEL_MS), speed: 1, done: false };
  const p2 = p1 + v * flat;
  if (t < REEL_MS) {
    const k = (t - ACCEL_MS - flat) / DECEL_MS;
    const d = 1 - k;
    const c3 = BACK + 1;
    const slope = 3 * c3 * d * d + 2 * BACK * d;
    return { pos: p2 + v * span * easeOutBack(k), speed: Math.max(0, Math.min(1, (span * slope) / DECEL_MS)), done: false };
  }
  return { pos: p2 + v * span, speed: 0, done: true };
}

export function stripOffset(pos: number): number {
  return CELL_H - pos * CELL_H;
}

export function tickIntervalOk(now: number, lastTick: number): boolean {
  return now - lastTick >= 50;
}

export function fitSize(text: string, avail: number): number {
  const steps = [20, 17, 15, 13];
  let units = 0;
  for (const ch of text) units += /[ᄀ-ᇿ㄰-㆏가-힯一-鿿]/.test(ch) ? 1 : ch === ' ' ? 0.35 : 0.6;
  for (const s of steps) if (units * s <= avail) return s;
  return steps[steps.length - 1];
}

export interface FullPlan {
  reels: ReelPlan[];
  result: RouletteResult;
}

export function buildFullPlan(origin: RouletteResult, seed: string): FullPlan {
  return {
    reels: [
      buildPlan(countryPool(), origin.country, seed, 0),
      buildPlan(leaguePool(origin.country), origin.leagueId, seed, 1),
      buildPlan(clubPool(origin.leagueId), origin.clubId, seed, 2)
    ],
    result: origin
  };
}
