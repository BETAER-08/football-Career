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

export function levelWeights(code: string): Record<number, number> {
  const c = getCountry(code);
  const w: Record<number, number> = {};
  const lower: Record<number, number> = { 2: 0.4, 3: 0.35, 4: 0.25 };
  for (let l = 2; l <= Math.min(4, c.top); l++) w[l] = lower[l];
  const share = c.pros > 0 ? c.big / c.pros : 0;
  if (c.top >= 5) w[5] = share * 1.2;
  if (c.top >= 6) w[6] = share * 0.8;
  return w;
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

export function rollOrigin(rng: Rng): RouletteResult {
  const totalPros = COUNTRIES.reduce((s, c) => s + c.pros, 0);
  const ci = rng.weightedIndex(COUNTRIES.map((c) => c.pros));
  const country = COUNTRIES[ci].code;
  const countryPct = (COUNTRIES[ci].pros / totalPros) * 100;
  const lw = levelWeights(country);
  const levels = Object.keys(lw).map(Number);
  const lwv = levels.map((l) => lw[l]);
  const lwTotal = lwv.reduce((a, b) => a + b, 0);
  const level = levels[rng.weightedIndex(lwv)];
  const clubs = candidateClubs(country, level);
  const leagueCounts: Record<string, number> = {};
  for (const c of clubs) leagueCounts[c.lg0] = (leagueCounts[c.lg0] ?? 0) + 1;
  const lgIds = Object.keys(leagueCounts);
  const lgIdx = rng.weightedIndex(lgIds.map((id) => leagueCounts[id]));
  const leagueId = lgIds[lgIdx];
  const levelPct = (lw[level] / lwTotal) * 100;
  const leaguePct = levelPct * (leagueCounts[leagueId] / clubs.length);
  const inLeague = clubs.filter((c) => c.lg0 === leagueId);
  const weights = inLeague.map(clubWeight);
  const wTotal = weights.reduce((a, b) => a + b, 0);
  const idx = rng.weightedIndex(weights);
  return { country, countryPct, leagueId, leaguePct, level, clubId: inLeague[idx].id, clubPct: (weights[idx] / wTotal) * 100 };
}

export function potentialMean(level: number, infra: number): number {
  const base: Record<number, number> = { 2: 48, 3: 51, 4: 54, 5: 58, 6: 63 };
  return base[level] + (infra - 0.5) * 4;
}

export function starterOvr(level: number): number {
  return LEVEL_STARTER_OVR[level];
}
