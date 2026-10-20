import { INJURIES, INJURY_BY_ID } from '../data/injuries';
import { ALL_ATTRS, type AttrKey, type GameState, type Injury } from './types';
import { Rng, clamp } from './rng';
import { getCal } from './calibration';
import { recordWhy } from './why';

export function parseLoss(loss: string | undefined): [AttrKey, number][] {
  if (!loss) return [];
  return loss.split(',').map((t) => {
    const m = /^([a-zA-Z]+)-(\d+(?:\.\d+)?)$/.exec(t);
    if (!m || !(ALL_ATTRS as string[]).includes(m[1])) throw new Error(`loss ${t}`);
    return [m[1] as AttrKey, Number(m[2])];
  });
}

export function injuryHazard(s: GameState, minutesShare: number): number {
  const h = s.hid.injuryProne / 50;
  const fat = s.st.fatigue > 70 ? 1.45 : s.st.fatigue > 50 ? 1.15 : 1;
  const sleep = 1.12 - s.st.sleep / 450;
  const drink = 1 + s.st.drink / 400;
  const chronic = 1 + Math.min(0.5, Object.keys(s.st.chronic).length * 0.06);
  const base = 0.011 + 0.026 * minutesShare;
  return base * clamp(h, 0.55, 1.6) * fat * sleep * drink * chronic * (s.fin.trainer > 0 ? 0.92 : 1) * (s.fin.nutritionist > 0 ? 0.95 : 1);
}

export function pickInjury(rng: Rng, ageFactor: number): (typeof INJURIES)[number] {
  const w = INJURIES.map((i) => (i.id === 'achilles' || i.id === 'back' ? i.weight * ageFactor : i.weight));
  return INJURIES[rng.weightedIndex(w)];
}

export function applyLoss(s: GameState, loss: [AttrKey, number][], mult = 1): void {
  for (const [k, v] of loss) {
    s.ab.a[k] = Math.max(1, s.ab.a[k] - v * mult);
    s.ab.ceil[k] = Math.max(1, s.ab.ceil[k] - v * mult * 0.8);
  }
}

export function startInjury(s: GameState, rng: Rng, id: string | null, age: number, forced?: { weeks: number }): Injury {
  const ageF = age >= 30 ? 1.6 : age >= 26 ? 1.2 : 1;
  const def = id ? INJURY_BY_ID[id] : pickInjury(rng, ageF);
  let weeks = forced ? forced.weeks : Math.round(def.minW + (def.maxW - def.minW) * Math.pow(rng.next(), 1.35));
  if (!forced) weeks = Math.max(1, Math.round(weeks * (age >= 31 ? 1.15 : 1) * (s.fin.trainer > 0 ? 0.94 : 1)));
  const repeat = s.st.injHist.filter((h) => h.id === def.id).length;
  const inj: Injury = { id: def.id, ko: def.ko, part: def.part, weeksLeft: weeks, total: weeks, early: false, recurrence: repeat > 0 && s.st.recur !== null };
  const h0 = s.st.health;
  const m0 = s.st.morale;
  s.st.injury = inj;
  s.st.injHist.push({ id: def.id, part: def.part, w: s.week });
  if (s.st.injHist.length > 60) s.st.injHist.shift();
  s.st.health = clamp(s.st.health - Math.min(40, weeks * 2.5), 15, 100);
  s.st.morale = clamp(s.st.morale - 4 - Math.min(10, weeks), 0, 100);
  s.st.fatigue = Math.max(0, s.st.fatigue - 20);
  if (weeks >= 20 || def.severe) {
    s.st.stress = clamp(s.st.stress + 10, 0, 100);
    s.st.happy = clamp(s.st.happy - 8, 0, 100);
  }
  recordWhy(s, 'st.health', `부상(${def.ko})`, s.st.health - h0);
  recordWhy(s, 'st.morale', `부상(${def.ko})`, s.st.morale - m0);
  s.career.cur.injDays += weeks * 7;
  s.st.chronic[def.part] = (s.st.chronic[def.part] ?? 0) + (def.weight > 5 ? 0.6 : 0.3);
  if (s.st.chronic[def.part] >= 3.2) s.st.chronic[def.part] = 3.2;
  applyLoss(s, parseLoss(def.loss));
  return inj;
}

export function injuryEndsCareer(s: GameState, rng: Rng, id: string, age: number): boolean {
  const def = INJURY_BY_ID[id];
  if (!def) return false;
  const scale = getCal().injEndScale;
  const count = s.st.injHist.filter((h) => h.id === id).length;
  let p = 0;
  if (def.severe) p = count >= 3 ? 0.5 : count === 2 ? 0.16 : 0.015;
  else if (def.id === 'meniscus') p = count >= 3 ? 0.08 : 0.004;
  else if (def.id === 'achilles') p = count >= 3 ? 0.06 : 0.003;
  else if (def.id === 'stress') p = count >= 2 ? 0.05 : 0.004;
  else if (def.id === 'concussion') p = count >= 4 ? 0.07 : 0.002;
  else if (def.id === 'back') p = count >= 5 ? 0.04 : 0.001;
  if (age >= 31) p *= 1.4;
  if (age <= 18) p *= 1.2;
  return rng.chance(Math.min(0.95, p * scale));
}

export function advanceInjury(s: GameState, rng: Rng): 'none' | 'recovered' {
  const inj = s.st.injury;
  if (!inj) return 'none';
  inj.weeksLeft -= s.st.rehabEarly ? 1.4 : 1;
  s.st.health = clamp(s.st.health + 1.6, 0, 100);
  if (inj.weeksLeft <= 0) {
    const def = INJURY_BY_ID[inj.id];
    s.st.injury = null;
    const rp = def.recur * (s.st.rehabEarly ? 2.4 : 1) * (1 + (s.st.chronic[def.part] ?? 0) * 0.12) * clamp(s.hid.injuryProne / 50, 0.7, 1.4);
    s.st.rehabEarly = false;
    if (s.ev.flags.reinjure !== undefined) {
      delete s.ev.flags.reinjure;
      s.st.recur = { id: def.id, w: s.week + rng.int(1, 3) };
    } else if (rng.chance(clamp(rp, 0, 0.8))) s.st.recur = { id: def.id, w: s.week + rng.int(1, 7) };
    return 'recovered';
  }
  return 'none';
}

export function healthLabel(h: number): string {
  return h >= 90 ? '최상' : h >= 70 ? '양호' : h >= 50 ? '보통' : h >= 30 ? '나쁨' : '위험';
}
