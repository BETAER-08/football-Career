import { CUP_WEEKS } from '../data/competitions';
import { getLeague, leaguesOf } from './data';
import { clubLeagueId } from './world';
import { swOf } from './time';
import type { GameState } from './types';

export type CalKind = 'aw' | 'sa';

export interface CalProfile {
  kind: CalKind;
  leagueWeeks: number[];
  friendlies: number[];
  cupWeeks: number[];
  windows: [number, number][];
  preseason: [number, number];
  offseason: [number, number];
  seasonEnd: [number, number];
  midSeason: number;
}

const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const PROFILES: Record<CalKind, CalProfile> = {
  aw: {
    kind: 'aw',
    leagueWeeks: range(6, 44),
    friendlies: [2, 4],
    cupWeeks: CUP_WEEKS,
    windows: [[0, 9], [26, 30]],
    preseason: [0, 5],
    offseason: [47, 51],
    seasonEnd: [44, 51],
    midSeason: 25
  },
  sa: {
    kind: 'sa',
    leagueWeeks: [...range(0, 21), ...range(34, 51)],
    friendlies: [32, 33],
    cupWeeks: [3, 8, 13, 18, 38, 44, 50],
    windows: [[0, 3], [26, 34]],
    preseason: [31, 33],
    offseason: [22, 28],
    seasonEnd: [18, 22],
    midSeason: 21
  }
};

export function profileOf(kind: CalKind): CalProfile {
  return PROFILES[kind];
}

export function leagueCal(lgId: string): CalKind {
  return getLeague(lgId).cal;
}

export function activeLeagueId(s: GameState): string {
  const id = s.phase === 'coach' && s.coach.clubId ? s.coach.clubId : s.career.clubId;
  if (id) return clubLeagueId(s, id);
  if (s.career.cur.leagueId) return s.career.cur.leagueId;
  return leaguesOf(s.p.country)[0].id;
}

export function calKindOf(s: GameState): CalKind {
  return leagueCal(activeLeagueId(s));
}

export function calOf(s: GameState): CalProfile {
  return PROFILES[calKindOf(s)];
}

export function leagueWeek(p: CalProfile, round: number, games: number): number {
  const L = p.leagueWeeks.length;
  return p.leagueWeeks[Math.min(L - 1, Math.floor((round * L) / games))];
}

const within = (sw: number, r: [number, number]): boolean => sw >= r[0] && sw <= r[1];

export function inWindow(p: CalProfile, sw: number): boolean {
  return p.windows.some((r) => within(sw, r));
}

export function windowNow(s: GameState): boolean {
  return inWindow(calOf(s), swOf(s.week));
}

export function isPreseason(s: GameState): boolean {
  return within(swOf(s.week), calOf(s).preseason);
}

export function isOffseason(s: GameState): boolean {
  return within(swOf(s.week), calOf(s).offseason);
}

export function isSeasonEnd(s: GameState): boolean {
  return within(swOf(s.week), calOf(s).seasonEnd);
}

export function hasWinterBreak(s: GameState): boolean {
  const lg = getLeague(activeLeagueId(s));
  return lg.cal === 'aw' && lg.winterBreak;
}
