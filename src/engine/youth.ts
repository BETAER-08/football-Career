import { LEVEL_WAGE_MULT } from '../data/countries';
import { Rng, clamp } from './rng';
import { curOvr } from './attributes';
import { getClub, getCountry } from './data';
import { addLog, toast } from './log';
import { stageStd } from './match';
import { STAGE_EXPECT, STAGE_ORDER, isSchoolStage } from './stages';
import { settleToPro } from './yleague';
import { schoolSeasonEnd } from './school';
import { SCHOOL_COUNTRIES } from '../data/schools';
import { ageAt, swOf } from './time';
import { clubLvl } from './world';
import { priceF } from './finance';
import { fireEvent, getEvent } from './events';
import type { GameState, YouthStage } from './types';

export { STAGE_ORDER };
const MIN_SEASONS: Record<YouthStage, number> = { U15: 1, U17: 2, U19: 1, RES: 99, HS: 99, UNI: 99 };
const MAX_SEASONS: Record<YouthStage, number> = { U15: 2, U17: 3, U19: 3, RES: 99, HS: 99, UNI: 99 };
const RELEASE_AT: Record<YouthStage, number> = { U15: -9, U17: -8, U19: -10, RES: -99, HS: -99, UNI: -99 };
const PROMOTE_AT = -3;

export type ReviewResult = 'promote' | 'stay' | 'release';

export function reviewScore(s: GameState, rng: Rng, age: number): number {
  const cid = s.career.clubId;
  const stage = s.career.youthStage;
  const ovr = curOvr(s.ab);
  const cur = s.career.yCur;
  const share = s.yt ? clamp(cur.mins / Math.max(1, s.yt.games * 90), 0, 1) : s.ab.playShare;
  const avg = cur.ratingN >= 5 ? cur.ratingSum / cur.ratingN : 6.3;
  let x = ovr - stageStd(s, cid, stage);
  x += (s.ab.pot - ovr) * 0.12;
  x += (s.people.coach ? s.people.coach.rel : 0) / 14;
  x += (share - 0.5) * 3;
  x += (avg - 6.3) * 1.4;
  x += (s.hid.pro - 50) / 25;
  x -= Math.max(0, age - (STAGE_EXPECT[stage] + 1.5)) * 2.5;
  x += rng.normal(0, 2.2);
  if (s.career.scholar === 1) x += 3;
  else if (s.career.scholar === 2) x -= 3.5;
  return x;
}

export function reviewOutcome(s: GameState, x: number, age: number): ReviewResult {
  const stage = s.career.youthStage;
  const nth = s.career.stageSeasons + 1;
  if (stage === 'RES') return 'stay';
  if (x < RELEASE_AT[stage] && !s.career.signed && !s.career.debuted) return 'release';
  if (stage === 'U19') return s.career.signed && (age >= 18 || nth >= 2 || x >= PROMOTE_AT) ? 'promote' : 'stay';
  if (nth >= MIN_SEASONS[stage] && (x >= PROMOTE_AT || nth >= MAX_SEASONS[stage])) return 'promote';
  return 'stay';
}

export function youthSeasonReview(s: GameState, rng: Rng): void {
  if (s.phase !== 'youth' || s.career.retired || !s.career.clubId) return;
  if (isSchoolStage(s.career.youthStage)) {
    schoolSeasonEnd(s, rng);
    return;
  }
  const age = ageAt(s.p.birth, s.week);
  const x = reviewScore(s, rng, age);
  const out = reviewOutcome(s, x, age);
  const stage = s.career.youthStage;
  s.ev.flags['yr:result'] = out === 'promote' ? 1 : out === 'stay' ? 0 : 2;
  s.ev.flags['yr:week'] = s.week;
  if (stage === 'RES') {
    if (age >= 21) settleToPro(s, rng, '리저브 졸업');
    else s.career.stageSeasons += 1;
    return;
  }
  if (out === 'promote') {
    s.career.youthStage = STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1];
    s.career.stageSeasons = 0;
    fireEvent(s, rng, getEvent('ys_review_promote'));
    return;
  }
  if (out === 'stay') {
    s.career.stageSeasons += 1;
    fireEvent(s, rng, getEvent('ys_review_stay'));
    return;
  }
  addLog(s, 'milestone', '승급 심사', `${getClub(s.career.clubId).name} ${stage} 팀에서 방출 통보를 받았다.`, [], { star: true });
  releaseEvent(s, rng, stage === 'U19');
}

export function scholarWage(s: GameState, high: boolean): number {
  const c = getCountry(getClub(s.career.clubId).country);
  const lvl = clubLvl(s, s.career.clubId);
  const base = 6000 * LEVEL_WAGE_MULT[lvl] * 0.04 * (0.5 + c.econ) * (high ? 1.6 : 1);
  return Math.max(100, Math.round((base * priceF(c.code)) / 10) * 10);
}

export function scholarshipStep(s: GameState, rng: Rng, age: number): void {
  if (s.phase !== 'youth' || s.career.signed || s.career.retired || !s.career.clubId || s.career.track !== 'pro') return;
  if (s.career.scholar !== 0 || age < 16 || swOf(s.week) < 2 || swOf(s.week) > 44) return;
  if (s.decision || s.decQueue.length || s.ev.count.ys_scholar_offer || s.ev.count.ys_scholar_denied) return;
  const ovr = curOvr(s.ab);
  const x = ovr - stageStd(s, s.career.clubId, s.career.youthStage) + (s.ab.pot - ovr) * 0.2 + (s.people.coach ? s.people.coach.rel : 0) / 12 + rng.normal(0, 2);
  const pass = x >= -4;
  toast(s, pass ? '장학 계약 면담이 잡혔다.' : '장학 계약 심사 결과가 나왔다.');
  fireEvent(s, rng, getEvent(pass ? 'ys_scholar_offer' : 'ys_scholar_denied'));
}

export function releaseEvent(s: GameState, rng: Rng, final: boolean): void {
  const country = s.career.clubId ? getClub(s.career.clubId).country : s.p.country;
  const age = ageAt(s.p.birth, s.week);
  if (final) s.career.youthJudged = true;
  if (SCHOOL_COUNTRIES.includes(country) && (final || (age <= 17 && (country === 'KR' || country === 'JP')))) {
    fireEvent(s, rng, getEvent(final ? 'ys_alt_final' : 'ys_alt_young'));
    return;
  }
  fireEvent(s, rng, getEvent(final ? 'youth_final_release' : 'ys_release_notice'));
}
