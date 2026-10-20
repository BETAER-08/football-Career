import { Rng, hashString } from './rng';
import type { GameState } from './types';
import type { RngState } from './rng';

const seedHash = new Map<string, number>();

function mixState(h0: number): RngState {
  const s: RngState = [0, 0, 0, 0];
  let h = h0 >>> 0;
  for (let i = 0; i < 4; i++) {
    h = (Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
    s[i] = (h ^ (h >>> 16)) >>> 0;
  }
  const r = new Rng(s);
  for (let i = 0; i < 6; i++) r.next();
  return r.s;
}

export function stream(seed: string, tag: string, n = 0): Rng {
  let b = seedHash.get(seed);
  if (b === undefined) {
    b = hashString(`${seed}|w`);
    if (seedHash.size > 400) seedHash.clear();
    seedHash.set(seed, b);
  }
  const t = hashString(tag) ^ Math.imul(n + 1, 2654435761);
  return new Rng(mixState((b ^ Math.imul(t, 1597334677)) >>> 0));
}

export function wrng(s: GameState, tag: string, n = 0): Rng {
  return stream(s.cfg.seed, tag, n);
}

export function hnorm(key: string): number {
  const a = (hashString(key) + 0.5) / 4294967296;
  const b = (hashString(key + '#') + 0.5) / 4294967296;
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
}

export function hunit(key: string): number {
  return hashString(key) / 4294967296;
}
