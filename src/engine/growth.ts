import { ALL_ATTRS, ATTR_GROUP, type GameState } from './types';
import { Rng, clamp } from './rng';
import { ageProgress, enforceCap, ovrOf } from './attributes';
import { focusDef } from './lifestyle';
import { getClub } from './data';

function heightFrac(f0: number, age: number, growth: 'early' | 'normal' | 'late'): number {
  const end = growth === 'early' ? 17.5 : growth === 'late' ? 19.8 : 18.6;
  const x = clamp((age - 14) / (end - 14), 0, 1);
  return f0 + (1 - f0) * (1 - (1 - x) * (1 - x));
}

export function bodyWeek(s: GameState, age: number): void {
  const ab = s.ab;
  if (age >= 26 && s.week % 13 !== 0) return;
  const h = Math.max(ab.height, Math.round(s.p.finalHeight * heightFrac(ab.hFrac0, age, s.p.growth)));
  ab.height = h;
  const mus = (ab.a.strength - 9) * 0.05;
  const target = ab.bmi0 + clamp((age - 14) * 0.34, 0, 3.4) + mus - (age > 32 ? (age - 32) * -0.05 : 0) - (s.st.burnout > 70 ? 0.3 : 0);
  const wt = target * (h / 100) * (h / 100);
  ab.weight = Math.round((ab.weight + (wt - ab.weight) * 0.06) * 10) / 10;
}

export function growWeek(s: GameState, rng: Rng, age: number): void {
  const ab = s.ab;
  bodyWeek(s, age);
  const f = focusDef(s);
  const club = s.career.clubId ? getClub(s.career.clubId) : null;
  const share = clamp(ab.playShare, 0, 1);
  const playF = age < 22 ? 0.72 + 0.56 * clamp(share / 0.75, 0, 1) : 0.92 + 0.16 * clamp(share / 0.75, 0, 1);
  const facil = club ? 0.97 + 0.06 * (club.facil / 100) : 0.97;
  const acad = club && s.phase === 'youth' ? 0.97 + 0.06 * (club.acad / 100) : 1;
  const life = 0.9 + 0.2 * ((s.st.sleep + s.st.diet) / 200);
  const staff = 1 + (s.fin.trainer > 0 ? 0.07 : 0) + (s.fin.nutritionist > 0 ? 0.02 : 0) + (s.fin.psychCoach > 0 ? 0.015 : 0);
  const pro = 0.9 + 0.2 * (s.hid.pro / 100);
  const state = (s.st.fatigue > 85 ? 0.82 : 1) * (s.st.injury ? 0.6 : 1) * (1 - Math.min(0.15, s.st.burnout / 600));
  const ageBoost = age <= 16 ? 1.08 : 1;
  const ent = s.career.entry;
  const jump = s.week < ent.boostEnd ? 1.1 : 1;
  const train = (s.phase === 'youth' && ent.step >= 1 ? 1.04 : 1) * (s.yt && s.yt.adult ? 1.03 : 1);
  const mul = playF * facil * acad * life * staff * pro * state * f.growth * ab.growthMul * ageBoost * jump * train;
  const noise = [0.8 + rng.next() * 0.4, 0.8 + rng.next() * 0.4, 0.8 + rng.next() * 0.4, 0.8 + rng.next() * 0.4];
  const r = 0.042 * mul;
  const g = s.p.growth;
  const prog = {
    tech: ageProgress('tech', age, g),
    gk: ageProgress('gk', age, g),
    phys: ageProgress('phys', age, g),
    mental: ageProgress('mental', age, g)
  };
  const gmul = { tech: f.tech * noise[0], gk: f.tech * noise[1], phys: f.phys * noise[2], mental: f.mental * noise[3] };
  const isGk = ab.pos === 'GK';
  for (let i = 0; i < ALL_ATTRS.length; i++) {
    const k = ALL_ATTRS[i];
    const grp = ATTR_GROUP[k];
    if (grp === 'gk' && !isGk) continue;
    const target = ab.ceil[k] * prog[grp];
    const cur = ab.a[k];
    const d = target - cur;
    const rate = d >= 0 ? r * gmul[grp] : r * 0.7;
    ab.a[k] = clamp(cur + d * rate, 1, 20);
  }
  enforceCap(s.ab);
}

export function seasonEndGrowth(s: GameState, age: number): void {
  const ab = s.ab;
  if (age < 20) {
    const gain = ovrOf(ab.a, ab.pos) - s.snap.ovr;
    if (gain < 2) {
      const d = (2 - gain) / 5;
      for (const k of ALL_ATTRS) {
        if (ATTR_GROUP[k] === 'gk' && ab.pos !== 'GK') continue;
        ab.a[k] = clamp(ab.a[k] + d, 1, 20);
        ab.ceil[k] = Math.max(ab.ceil[k], ab.a[k]);
      }
    }
  }
  if (age >= 21 && ab.playShare < 0.3) {
    const leak = 0.012 * ((0.3 - ab.playShare) / 0.3);
    for (const k of ALL_ATTRS) ab.ceil[k] = Math.max(1, ab.ceil[k] * (1 - leak));
  }
  enforceCap(s.ab);
}
