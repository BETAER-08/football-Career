import { COUNTRIES, LEVEL_STARTER_OVR } from '../data/countries';
import { getClub, getCountry, leaguesOf, type ClubStatic } from './data';
import { Rng } from './rng';

export interface RouletteResult {
  country: string;
  countryPct: number;
  leagueId: string;
  leaguePct: number;
  level: number;
  clubId: string;
  clubPct: number;
}

export const U15_RATE: Record<number, number> = { 6: 1, 5: 1, 4: 0.9, 3: 0.6, 2: 0.25 };
export const U15_SQUAD: Record<number, number> = { 6: 28, 5: 25, 4: 22, 3: 20, 2: 18 };

export function u15Rate(level: number, infra: number): number {
  const base = U15_RATE[level];
  return level <= 3 ? base * Math.min(1, 0.5 + infra) : base;
}

export function levelWeights(code: string): Record<number, number> {
  const c = getCountry(code);
  const w: Record<number, number> = {};
  for (let l = 2; l <= c.top; l++) {
    const n = candidateClubs(code, l).length;
    if (n > 0) w[l] = n * u15Rate(l, c.infra) * U15_SQUAD[l];
  }
  return w;
}

export const START_BOOST: Record<number, number> = { 2: 0.5, 3: 0.8, 4: 1.3, 5: 2, 6: 2.6 };

export function startWeights(code: string): Record<number, number> {
  const w = levelWeights(code);
  const out: Record<number, number> = {};
  for (const k of Object.keys(w)) out[Number(k)] = w[Number(k)] * (START_BOOST[Number(k)] ?? 1);
  if (code === 'GB' && out[4] !== undefined && out[6] !== undefined) [out[4], out[6]] = [out[6], out[4]];
  return out;
}

export function clubWeight(c: ClubStatic): number {
  return Math.pow(c.acad / 50, 2) * (0.5 + c.fin0 / 100);
}

export function candidateClubs(code: string, level: number): ClubStatic[] {
  const out: ClubStatic[] = [];
  for (const l of leaguesOf(code)) {
    for (const id of l.clubIds) {
      const c = getClub(id);
      if (c.lvl0 === level) out.push(c);
    }
  }
  return out;
}

export function originIn(rng: Rng, country: string, level?: number): RouletteResult {
  const lw = startWeights(country);
  const levels = Object.keys(lw).map(Number);
  const forced = level !== undefined && levels.includes(level) ? level : undefined;
  const pool = forced !== undefined ? [forced] : levels;
  const lwv = pool.map((l) => lw[l]);
  const lwTotal = levels.reduce((a, l) => a + lw[l], 0);
  const lv = pool[rng.weightedIndex(lwv)];
  const clubs = candidateClubs(country, lv);
  const leagueCounts: Record<string, number> = {};
  for (const c of clubs) leagueCounts[c.lg0] = (leagueCounts[c.lg0] ?? 0) + 1;
  const lgIds = Object.keys(leagueCounts);
  const leagueId = lgIds[rng.weightedIndex(lgIds.map((id) => leagueCounts[id]))];
  const levelPct = (lw[lv] / lwTotal) * 100;
  const leaguePct = levelPct * (leagueCounts[leagueId] / clubs.length);
  const inLeague = clubs.filter((c) => c.lg0 === leagueId);
  const weights = inLeague.map(clubWeight);
  const wTotal = weights.reduce((a, b) => a + b, 0);
  const idx = rng.weightedIndex(weights);
  return { country, countryPct: 0, leagueId, leaguePct, level: lv, clubId: inLeague[idx].id, clubPct: (weights[idx] / wTotal) * 100 };
}

export function youthCount(code: string): number {
  return Object.values(levelWeights(code)).reduce((a, b) => a + b, 0);
}

export function rollOrigin(rng: Rng): RouletteResult {
  const counts = COUNTRIES.map((c) => youthCount(c.code));
  const totalPros = counts.reduce((s, v) => s + v, 0);
  const ci = rng.weightedIndex(counts);
  const country = COUNTRIES[ci].code;
  const o = originIn(rng, country);
  return { ...o, countryPct: (counts[ci] / totalPros) * 100 };
}

export function potentialMean(level: number, infra: number): number {
  const base: Record<number, number> = { 2: 48, 3: 51, 4: 54, 5: 58, 6: 63 };
  return base[level] + (infra - 0.5) * 4;
}

export function starterOvr(level: number): number {
  return LEVEL_STARTER_OVR[level];
}
