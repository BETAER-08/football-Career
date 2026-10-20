import { ALL_ATTRS, ATTR_GROUP, type AttrKey, type Pos, type Abilities } from './types';
import { clamp } from './rng';

type W = Partial<Record<AttrKey, number>>;

const RAW_W: Record<Pos, W> = {
  ST: { finishing: 6, shooting: 5, positioning: 5, accel: 4, pace: 4, firstTouch: 4, composure: 4, dribbling: 3, heading: 3, strength: 3, jumping: 2, agility: 2, balance: 2, longShots: 2, vision: 1, workRate: 1, concentration: 1, creativity: 1, penalties: 1, teamwork: 1, stamina: 1, weakFoot: 1 },
  LW: { dribbling: 5, pace: 5, accel: 5, crossing: 4, firstTouch: 4, agility: 4, finishing: 3, shooting: 3, creativity: 3, passing: 3, balance: 2, vision: 2, workRate: 2, stamina: 2, composure: 2, positioning: 2, weakFoot: 2, longShots: 1, teamwork: 1 },
  RW: { dribbling: 5, pace: 5, accel: 5, crossing: 4, firstTouch: 4, agility: 4, finishing: 3, shooting: 3, creativity: 3, passing: 3, balance: 2, vision: 2, workRate: 2, stamina: 2, composure: 2, positioning: 2, weakFoot: 2, longShots: 1, teamwork: 1 },
  AM: { passing: 5, vision: 5, firstTouch: 4, creativity: 5, dribbling: 4, composure: 3, longShots: 3, shooting: 3, finishing: 2, agility: 2, balance: 2, accel: 2, positioning: 3, workRate: 2, teamwork: 2, concentration: 2, pace: 1, stamina: 2, weakFoot: 1, freeKicks: 1 },
  CM: { passing: 5, vision: 4, stamina: 4, teamwork: 4, workRate: 4, firstTouch: 3, tackling: 3, concentration: 3, composure: 3, positioning: 3, longPassing: 3, creativity: 2, dribbling: 2, strength: 2, balance: 2, marking: 1, agility: 1, longShots: 1, aggression: 1 },
  DM: { tackling: 5, marking: 4, positioning: 5, passing: 4, stamina: 4, workRate: 4, concentration: 4, teamwork: 3, strength: 3, composure: 3, vision: 2, aggression: 3, balance: 2, longPassing: 2, firstTouch: 2, jumping: 2, heading: 2, pace: 1, accel: 1, leadership: 1 },
  CB: { marking: 6, tackling: 6, heading: 5, positioning: 6, strength: 5, jumping: 4, concentration: 4, composure: 3, aggression: 3, pace: 3, accel: 2, balance: 2, passing: 2, leadership: 2, teamwork: 2, longPassing: 1, firstTouch: 1, stamina: 1, agility: 1 },
  LB: { tackling: 4, marking: 4, pace: 5, accel: 4, stamina: 5, crossing: 4, positioning: 4, workRate: 4, dribbling: 2, passing: 3, teamwork: 3, concentration: 3, agility: 2, balance: 2, heading: 1, strength: 2, firstTouch: 2, composure: 1 },
  RB: { tackling: 4, marking: 4, pace: 5, accel: 4, stamina: 5, crossing: 4, positioning: 4, workRate: 4, dribbling: 2, passing: 3, teamwork: 3, concentration: 3, agility: 2, balance: 2, heading: 1, strength: 2, firstTouch: 2, composure: 1 },
  GK: { reflexes: 8, handling: 7, oneOnOne: 6, aerial: 6, positioning: 6, concentration: 5, kicking: 4, buildUp: 3, composure: 3, agility: 3, jumping: 2, leadership: 2, balance: 1, strength: 1, passing: 1, vision: 1, teamwork: 1 }
};

export const POS_W: Record<Pos, Record<AttrKey, number>> = (() => {
  const out = {} as Record<Pos, Record<AttrKey, number>>;
  for (const pos of Object.keys(RAW_W) as Pos[]) {
    const raw = RAW_W[pos];
    let sum = 0;
    for (const k of ALL_ATTRS) sum += raw[k] ?? 0;
    const rec = {} as Record<AttrKey, number>;
    for (const k of ALL_ATTRS) rec[k] = (raw[k] ?? 0) / sum;
    out[pos] = rec;
  }
  return out;
})();

export const POS_PROFILE_MAX: Record<Pos, number> = (() => {
  const out = {} as Record<Pos, number>;
  for (const pos of Object.keys(POS_W) as Pos[]) {
    let m = 0;
    for (const k of ALL_ATTRS) m = Math.max(m, POS_W[pos][k]);
    out[pos] = m;
  }
  return out;
})();

export function ovrOf(a: Record<AttrKey, number>, pos: Pos): number {
  const w = POS_W[pos];
  let s = 0;
  for (let i = 0; i < ALL_ATTRS.length; i++) {
    const k = ALL_ATTRS[i];
    s += w[k] * a[k];
  }
  return s * 5;
}

export function ovrAt(ab: Abilities, pos: Pos): number {
  const base = ovrOf(ab.a, pos);
  if (pos === ab.pos) return base;
  const prof = ab.sec[pos] ?? 0;
  return base * (0.72 + 0.28 * (prof / 100));
}

const ANCHORS: [number, number][] = [[26, 22], [52, 50], [57, 60], [61.5, 70], [73, 80], [79, 90], [88, 100]];

export function anchored(raw: number): number {
  const A = ANCHORS;
  if (raw >= A[A.length - 1][0]) return 100;
  if (raw <= A[0][0]) return Math.max(0, A[0][1] - (A[0][0] - raw) * ((A[1][1] - A[0][1]) / (A[1][0] - A[0][0])));
  for (let i = 1; i < A.length; i++) {
    if (raw <= A[i][0]) {
      const [x0, y0] = A[i - 1];
      const [x1, y1] = A[i];
      return y0 + ((raw - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return 100;
}

export const YOUTH_BONUS = 10;

export function rawForAnchored(d: number): number {
  let lo = 0;
  let hi = 100;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (anchored(m) < d) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export const START_MIN: Record<number, number> = { 6: 50, 5: 47, 4: 44, 3: 42, 2: 40 };

export function shownRaw(raw: number, adj: number, age: number): number {
  const t = Math.min(1, Math.max(0, (24 - age) / 7));
  return Math.min(100, Math.max(0, anchored(raw) + adj * t));
}

export function shownOvr(ab: Abilities, age: number): number {
  return shownRaw(ovrOf(ab.a, ab.pos), ab.dispAdj ?? 0, age);
}

export function curOvr(ab: Abilities): number {
  return ovrOf(ab.a, ab.pos);
}

export function techAvg(ab: Abilities): number {
  let s = 0;
  let n = 0;
  for (const k of ALL_ATTRS) {
    if (ATTR_GROUP[k] === 'tech') { s += ab.a[k]; n++; }
  }
  return s / n;
}

export function groupAvg(ab: Abilities, g: 'tech' | 'phys' | 'mental'): number {
  let s = 0;
  let n = 0;
  for (const k of ALL_ATTRS) {
    if (ATTR_GROUP[k] === g) { s += ab.a[k]; n++; }
  }
  return s / n;
}

export function ceilingOvr(ab: Abilities): number {
  return ovrOf(ab.ceil, ab.pos);
}

export function makeCeil(pos: Pos, pot: number, nz: () => number): Record<AttrKey, number> {
  const w = POS_W[pos];
  const mx = POS_PROFILE_MAX[pos];
  const raw = {} as Record<AttrKey, number>;
  for (const k of ALL_ATTRS) {
    const g = ATTR_GROUP[k];
    const gk = pos === 'GK';
    if (g === 'gk') raw[k] = gk ? 6 + 9 * (w[k] / mx) + nz() * 1.2 : 2 + Math.abs(nz()) * 1.2;
    else raw[k] = 5.5 + 10 * (w[k] / mx) + nz() * 1.3;
  }
  for (let it = 0; it < 4; it++) {
    const cur = ovrOf(raw, pos);
    const shift = (pot - cur) / 5;
    for (const k of ALL_ATTRS) {
      if (ATTR_GROUP[k] === 'gk' && pos !== 'GK') continue;
      raw[k] = clamp(raw[k] + shift * (it < 3 ? 1 : 0.8), 1, 20);
    }
  }
  return raw;
}

export function ageProgress(group: 'tech' | 'phys' | 'mental' | 'gk', age: number, growth: 'early' | 'normal' | 'late'): number {
  const shift = growth === 'early' ? -1.6 : growth === 'late' ? 2 : 0;
  const peak = (group === 'phys' ? 22 : group === 'mental' ? 25.5 : 23.5) + shift;
  const g0 = growth === 'early' ? 0.62 : growth === 'late' ? 0.5 : 0.56;
  const p = clamp((age - 12) / (peak - 12), 0, 1);
  const f = g0 + (1 - g0) * Math.pow(p, 0.7);
  let dec = 1;
  if (group === 'phys') {
    const d = growth === 'early' ? 26.5 : growth === 'late' ? 28.5 : 27.5;
    if (age > d) dec = 1 - 0.04 * Math.pow(age - d, 1.15);
  } else if (group === 'tech' || group === 'gk') {
    const d = 31;
    if (age > d) dec = 1 - 0.018 * Math.pow(age - d, 1.1);
  } else if (age > 35) dec = 1 - 0.007 * (age - 35);
  return f * Math.max(0.4, dec);
}

export function youthCallMin(natBase: number): number {
  return Math.min(62, Math.max(40, 40 + (natBase - 50) * 0.5));
}
