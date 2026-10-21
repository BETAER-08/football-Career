import { tickState, autoStep, autoWeek } from '../engine/game';
import type { GameState } from '../engine/types';

export const SKIP_MAX_WEEKS = 52;
export const NORMAL_LIMIT = 40;

export type SkipEnd = 'decision' | 'modal' | 'phase' | 'ended' | 'quiet' | 'stalled';

export interface Resume {
  playing: boolean;
  speed: number;
}

export interface PlayState {
  playing: boolean;
  speed: number;
  skipping: boolean;
  acc: number;
  skipWeeks: number;
  resume: Resume | null;
}

export function newPlayState(speed = 1): PlayState {
  return { playing: false, speed, skipping: false, acc: 0, skipWeeks: 0, resume: null };
}

export function modalPending(g: GameState): boolean {
  return g.pendingReview >= 0 || g.wld.ceremonyDue;
}

export function beginSkip(ps: PlayState): void {
  ps.resume = { playing: ps.playing, speed: ps.speed };
  ps.skipping = true;
  ps.playing = true;
  ps.acc = 0;
  ps.skipWeeks = 0;
}

export function cancelSkip(ps: PlayState): boolean {
  if (!ps.skipping) return false;
  ps.skipping = false;
  ps.acc = 0;
  ps.skipWeeks = 0;
  if (ps.resume) {
    ps.playing = ps.resume.playing;
    ps.speed = ps.resume.speed;
  }
  ps.resume = null;
  return true;
}

export function endSkip(ps: PlayState, reason: SkipEnd): void {
  ps.skipping = false;
  ps.acc = 0;
  ps.skipWeeks = 0;
  ps.playing = false;
  if (reason === 'quiet' || reason === 'ended' || reason === 'stalled') ps.resume = null;
}

export function settle(ps: PlayState, g: GameState, modalOpen: boolean, defaultPlay: boolean): void {
  if (g.decision || g.ended || modalOpen || ps.skipping) return;
  if (ps.resume) {
    ps.playing = ps.resume.playing;
    ps.speed = ps.resume.speed;
    ps.resume = null;
    return;
  }
  if (defaultPlay) ps.playing = true;
}

export interface StepResult {
  weeks: number;
  ended: SkipEnd | null;
}

export function stepPlayback(ps: PlayState, g: GameState, dt: number, wms: number): StepResult {
  let n = 0;
  let ended: SkipEnd | null = null;
  const phase = g.phase;
  if (ps.skipping) {
    while (ps.skipping) {
      if (g.auto) autoWeek(g);
      if (!tickState(g)) {
        ended = 'stalled';
        break;
      }
      n++;
      ps.skipWeeks += 1;
      const hadDecision = !!g.decision;
      if (g.auto && g.decision) autoStep(g);
      if (hadDecision || g.decision) ended = 'decision';
      else if (g.ended) ended = 'ended';
      else if (modalPending(g)) ended = 'modal';
      else if (g.phase !== phase) ended = 'phase';
      else if (ps.skipWeeks >= SKIP_MAX_WEEKS) ended = 'quiet';
      if (ended) break;
    }
    if (ended) endSkip(ps, ended);
    return { weeks: n, ended };
  }
  ps.acc += dt;
  while (ps.acc >= wms && n < NORMAL_LIMIT) {
    ps.acc -= wms;
    if (g.auto) autoWeek(g);
    if (!tickState(g)) break;
    n++;
    const hadDecision = !!g.decision;
    if (g.auto && g.decision) autoStep(g);
    if (hadDecision || g.decision || g.ended || g.phase !== phase) {
      if (g.decision) ps.playing = false;
      break;
    }
  }
  return { weeks: n, ended };
}
