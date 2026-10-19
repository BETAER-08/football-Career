import { START_YEAR } from './time';
import type { SeasonRec } from './types';

export function emptyRec(s: number, clubId: string, clubName: string, lgId: string, lgName: string, lvl: number, loan = false): SeasonRec {
  return {
    s, year: START_YEAR + s, clubId, clubName, leagueId: lgId, leagueName: lgName, lvl, apps: 0, starts: 0, mins: 0, goals: 0,
    assists: 0, ratingSum: 0, ratingN: 0, cs: 0, yc: 0, rc: 0, injDays: 0, intApps: 0, intGoals: 0, pos: 0, loan,
    trophies: [], awards: [], avail: 0, done: false
  };
}
