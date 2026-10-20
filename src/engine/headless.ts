import { Rng, seedState } from './rng';
import { getCal, setCal, type Calibration } from './calibration';
import { allCountries, getCountry } from './data';
import { originIn, type RouletteResult } from './roulette';
import { runBot, newGame, autoStep, autoWeek, tickState } from './game';
import { botPolicy } from './auto';
import { setFast } from './log';
import { setCosmetic } from './flags';
import { ageAt } from './time';
import type { GameConfig, GameState, Pos } from './types';

export interface Spec {
  seed: string;
  country: string;
  level: number;
  pos: Pos | 'random';
  mode: 'player' | 'coach';
}

export interface CareerResult {
  debuted: boolean;
  playedBig: boolean;
  maxLvl: number;
  retireAge: number;
  endedByInjury: boolean;
  score: number;
  weeks: number;
  coachEntered: boolean;
  everManager: boolean;
  everBigOrNat: boolean;
  everNat: boolean;
  fired: number;
  coachAge: number;
  seasonsPlayed: number;
}

export function forcedOrigin(rng: Rng, country: string, level?: number): RouletteResult {
  return originIn(rng, country, level);
}

export function originRng(seed: string): Rng {
  return new Rng(seedState(seed + '|forced'));
}

export function runOne(spec: Spec): CareerResult {
  setFast(true);
  setCosmetic(false);
  const cfg: GameConfig = { seed: spec.seed, name: '', pos: spec.pos, mode: 'normal', code: '', lengthMin: 60 };
  const origin = forcedOrigin(originRng(spec.seed), spec.country, spec.level > 0 ? spec.level : undefined);
  let s: GameState;
  if (spec.mode === 'player') {
    s = runBot(cfg, origin, (st) => st.career.retired || st.ended);
  } else {
    botPolicy.coachBias = 1000;
    botPolicy.pathWeights = [1, 0, 0, 0];
    s = newGame(cfg, origin);
    s.auto = true;
    let guard = 0;
    while (!s.ended && guard++ < 52 * 70) {
      autoStep(s);
      if (ageAt(s.p.birth, s.week) >= 66) break;
      autoWeek(s);
      if (!tickState(s)) autoStep(s);
    }
    botPolicy.coachBias = 1;
    botPolicy.pathWeights = null;
  }
  setFast(false);
  setCosmetic(true);
  return {
    debuted: s.career.debuted,
    playedBig: s.career.playedLvl5,
    maxLvl: s.career.maxLvl,
    retireAge: s.career.retireAge,
    endedByInjury: s.career.endedByInjury,
    score: s.score,
    weeks: s.week,
    coachEntered: s.coach.entered,
    everManager: s.coach.everManager,
    everBigOrNat: s.coach.everBig || s.coach.everNat,
    everNat: s.coach.everNat,
    fired: s.coach.fired,
    coachAge: ageAt(s.p.birth, s.week),
    seasonsPlayed: s.career.seasons.length
  };
}

export function runBatch(specs: Spec[], cal?: Partial<Calibration>): CareerResult[] {
  if (cal) setCal(cal);
  return specs.map(runOne);
}

export function currentCal(): Calibration {
  return { ...getCal(), m: { ...getCal().m } };
}

export function countryCodes(): string[] {
  return allCountries().map((c) => c.code);
}

export function targetShare(code: string): number {
  const c = getCountry(code);
  return c.pros > 0 ? c.big / c.pros : 0;
}

export function mixedSpec(i: number, prefix: string): Spec {
  const rng = new Rng(seedState(prefix + i + '|mix'));
  const cs = allCountries();
  const c = cs[rng.weightedIndex(cs.map((x) => x.pros))];
  return { seed: `${prefix}${i}`, country: c.code, level: 0, pos: 'random', mode: 'player' };
}
