import { LEVEL_WAGE_MULT } from '../data/countries';
import { Rng } from './rng';
import { curOvr } from './attributes';
import { getClub, getCountry } from './data';
import { addLog, toast } from './log';
import { youthStd } from './match';
import { ageAt, swOf } from './time';
import { clubLvl } from './world';
import { priceF } from './finance';
import { fireEvent, getEvent } from './events';
import type { GameState, YouthStage } from './types';

export const STAGE_ORDER: YouthStage[] = ['U15', 'U17', 'U19'];
const MIN_SEASONS: Record<YouthStage, number> = { U15: 1, U17: 2, U19: 99 };
const MAX_SEASONS: Record<YouthStage, number> = { U15: 2, U17: 3, U19: 99 };
const RELEASE_AT: Record<YouthStage, number> = { U15: -9, U17: -8, U19: -10 };
const PROMOTE_AT = -3;
const PEER_SHIFT = 10;

export type ReviewResult = 'promote' | 'stay' | 'release';

export function reviewScore(s: GameState, rng: Rng, age: number): number {
  const cid = s.career.clubId;
  const ovr = curOvr(s.ab);
  let x = ovr - youthStd(s, cid, age) + PEER_SHIFT;
  x += (s.ab.pot - ovr) * 0.12;
  x += (s.people.coach ? s.people.coach.rel : 0) / 14;
  x += (s.ab.playShare - 0.5) * 3;
  x += (s.hid.pro - 50) / 25;
  x += rng.normal(0, 2.2);
  if (s.career.scholar === 1) x += 3;
  else if (s.career.scholar === 2) x -= 3.5;
  return x;
}

export function reviewOutcome(s: GameState, x: number): ReviewResult {
  const stage = s.career.youthStage;
  const nth = s.career.stageSeasons + 1;
  if (x < RELEASE_AT[stage]) return 'release';
  if (stage === 'U19') return 'stay';
  if (nth >= MIN_SEASONS[stage] && (x >= PROMOTE_AT || nth >= MAX_SEASONS[stage])) return 'promote';
  return 'stay';
}

export function youthSeasonReview(s: GameState, rng: Rng): void {
  if (s.phase !== 'youth' || s.career.debuted || s.career.retired || !s.career.clubId) return;
  const age = ageAt(s.p.birth, s.week);
  const x = reviewScore(s, rng, age);
  const out = reviewOutcome(s, x);
  const stage = s.career.youthStage;
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
  if (stage === 'U19') {
    s.career.youthJudged = true;
    fireEvent(s, rng, getEvent('youth_final_release'));
  } else fireEvent(s, rng, getEvent('ys_release_notice'));
}

export function scholarWage(s: GameState, high: boolean): number {
  const c = getCountry(getClub(s.career.clubId).country);
  const lvl = clubLvl(s, s.career.clubId);
  const base = 6000 * LEVEL_WAGE_MULT[lvl] * 0.04 * (0.5 + c.econ) * (high ? 1.6 : 1);
  return Math.max(100, Math.round((base * priceF(c.code)) / 10) * 10);
}

export function scholarshipStep(s: GameState, rng: Rng, age: number): void {
  if (s.phase !== 'youth' || s.career.debuted || s.career.retired || !s.career.clubId) return;
  if (s.career.scholar !== 0 || age < 16 || swOf(s.week) < 2 || swOf(s.week) > 44) return;
  if (s.decision || s.decQueue.length || s.ev.count.ys_scholar_offer || s.ev.count.ys_scholar_denied) return;
  const ovr = curOvr(s.ab);
  const x = ovr - youthStd(s, s.career.clubId, age) + PEER_SHIFT + (s.ab.pot - ovr) * 0.2 + (s.people.coach ? s.people.coach.rel : 0) / 12 + rng.normal(0, 2);
  const pass = x >= -4;
  toast(s, pass ? '장학 계약 면담이 잡혔다.' : '장학 계약 심사 결과가 나왔다.');
  fireEvent(s, rng, getEvent(pass ? 'ys_scholar_offer' : 'ys_scholar_denied'));
}
