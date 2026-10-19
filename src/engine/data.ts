import { COUNTRIES, COUNTRY_BY_CODE } from '../data/countries';
import { LEAGUES_BY_COUNTRY } from '../data/leagues';
import { CITIES } from '../data/cities';
import { NAME_POOLS } from '../data/names';
import type { Country, League, City } from '../data/schema';
import { hashString, lerp } from './rng';
import { LEVEL_STARTER_OVR } from '../data/countries';

export interface ClubStatic {
  id: string;
  name: string;
  city: string;
  country: string;
  lg0: string;
  idx: number;
  st0: number;
  std0: number;
  lvl0: number;
  elite: boolean;
  acad: number;
  facil: number;
  fin0: number;
  color: number;
  tier0: number;
}

export interface LeagueStatic extends League {
  country: string;
  clubIds: string[];
}

const clubs: Record<string, ClubStatic> = {};
const leagues: Record<string, LeagueStatic> = {};
const byCountry: Record<string, string[]> = {};
let built = false;

function noise(id: string, salt: number): number {
  return ((hashString(id + salt) % 1000) / 1000 - 0.5) * 2;
}

function build(): void {
  if (built) return;
  built = true;
  for (const c of COUNTRIES) {
    const ls = LEAGUES_BY_COUNTRY[c.code];
    byCountry[c.code] = ls.map((l) => l.id);
    for (const l of ls) {
      const items = l.clubs.split(';').map((s) => s.split('|'));
      const n = items.length;
      const ids: string[] = [];
      const meanSt = (l.top + l.bottom) / 2;
      const eliteN = l.elite;
      const eliteSt = eliteN > 0 ? l.top - ((l.top - l.bottom) * (eliteN - 1)) / (2 * Math.max(1, n - 1)) : 0;
      items.forEach(([name, city], i) => {
        const t = n > 1 ? i / (n - 1) : 0;
        const st = lerp(l.top, l.bottom, Math.pow(t, 0.85));
        const id = `${c.code}:${name}`;
        const elite = i < eliteN;
        const lvl0 = l.lvl + (elite ? 1 : 0);
        const std0 = elite
          ? LEVEL_STARTER_OVR[lvl0] + (st - eliteSt) * 0.35
          : LEVEL_STARTER_OVR[l.lvl] + (st - meanSt) * 0.4;
        const acad = Math.max(5, Math.min(99, Math.round(18 + (st - 30) * 0.8 + c.infra * 28 + noise(id, 1) * 7)));
        const facil = Math.max(5, Math.min(99, Math.round(15 + (st - 30) * 0.7 + c.infra * 36 + noise(id, 2) * 7)));
        const fin0 = Math.max(5, Math.min(99, Math.round(10 + (st - 30) * 0.85 + c.econ * 22 + noise(id, 3) * 8)));
        clubs[id] = {
          id, name, city, country: c.code, lg0: l.id, idx: i, st0: st, std0, lvl0, elite, acad, facil, fin0,
          color: hashString(name) % 360, tier0: l.tier
        };
        ids.push(id);
      });
      leagues[l.id] = { ...l, country: c.code, clubIds: ids };
    }
  }
}

export function getClub(id: string): ClubStatic {
  build();
  const c = clubs[id];
  if (!c) throw new Error(`club ${id}`);
  return c;
}
export function hasClub(id: string): boolean {
  build();
  return id in clubs;
}
export function getLeague(id: string): LeagueStatic {
  build();
  const l = leagues[id];
  if (!l) throw new Error(`league ${id}`);
  return l;
}
export function leaguesOf(code: string): LeagueStatic[] {
  build();
  return byCountry[code].map((id) => leagues[id]);
}
export function allCountries(): Country[] {
  return COUNTRIES;
}
export function getCountry(code: string): Country {
  const c = COUNTRY_BY_CODE[code];
  if (!c) throw new Error(`country ${code}`);
  return c;
}
export function citiesOf(code: string): City[] {
  return CITIES[code];
}
export function namePool(code: string): { given: [string, string][]; surname: [string, string][] } {
  return NAME_POOLS[code];
}
export function allClubIds(): string[] {
  build();
  return Object.keys(clubs);
}
export function countClubs(code: string): { leagues: number; clubs: number } {
  build();
  const ls = leaguesOf(code);
  return { leagues: ls.length, clubs: ls.reduce((s, l) => s + l.clubIds.length, 0) };
}
export function academyGrade(acad: number): string {
  return acad >= 85 ? 'S' : acad >= 70 ? 'A' : acad >= 55 ? 'B' : acad >= 40 ? 'C' : 'D';
}
