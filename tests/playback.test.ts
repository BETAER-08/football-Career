import { describe, expect, it } from 'vitest';
import { newGame, resolveDecision } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { rngOf } from '../src/engine/world';
import { autoDecide } from '../src/engine/auto';
import { beginSkip, cancelSkip, newPlayState, settle, stepPlayback, SKIP_MAX_WEEKS } from '../src/ui/playback';
import type { GameState } from '../src/engine/types';

ensureContent();

function mk(seed: string): GameState {
  return newGame({ seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });
}

function skipUntilEnd(s: GameState, ps: ReturnType<typeof newPlayState>): string | null {
  let guard = 0;
  let last: string | null = null;
  while (ps.skipping && guard++ < 200) last = stepPlayback(ps, s, 40, 1000).ended;
  return last;
}

describe('다음 결정까지', () => {
  it('첫 결정에서 멈추고 스킵 상태가 남지 않는다', () => {
    const s = mk('skip-a');
    const ps = newPlayState(4);
    ps.playing = true;
    beginSkip(ps);
    const ended = skipUntilEnd(s, ps);
    expect(ended).not.toBeNull();
    expect(ps.skipping).toBe(false);
    expect(ps.acc).toBe(0);
    expect(ps.playing).toBe(false);
    if (ended === 'decision') expect(s.decision).not.toBeNull();
  });

  it('결정을 처리한 뒤 프레임당 진행 주 수가 일반 재생 기준을 넘지 않는다', () => {
    const s = mk('skip-b');
    const ps = newPlayState(4);
    ps.playing = true;
    beginSkip(ps);
    skipUntilEnd(s, ps);
    let guard = 0;
    while (s.decision && guard++ < 20) {
      const { idx, demands } = autoDecide(s, rngOf(s), s.decision);
      resolveDecision(s, idx, demands, false);
    }
    settle(ps, s, false, true);
    expect(ps.playing).toBe(true);
    expect(ps.speed).toBe(4);
    expect(ps.acc).toBe(0);
    const wms = 1000 / 4;
    for (let f = 0; f < 5; f++) {
      if (s.decision || s.ended) break;
      const r = stepPlayback(ps, s, 40, wms);
      expect(r.weeks).toBeLessThanOrEqual(1);
    }
  });

  it('스킵 전 상태가 멈춤이면 멈춤으로, 재생 4×면 4×로 돌아간다', () => {
    for (const [playing, speed] of [[false, 1], [true, 4]] as [boolean, number][]) {
      const s = mk(`skip-c${speed}`);
      const ps = newPlayState(speed);
      ps.playing = playing;
      beginSkip(ps);
      skipUntilEnd(s, ps);
      let guard = 0;
      while (s.decision && guard++ < 20) {
        const { idx, demands } = autoDecide(s, rngOf(s), s.decision);
        resolveDecision(s, idx, demands, false);
      }
      settle(ps, s, false, true);
      expect(ps.playing).toBe(playing);
      expect(ps.speed).toBe(speed);
    }
  });

  it('스킵 중 재취소는 스킵 전 상태로 돌린다', () => {
    const ps = newPlayState(8);
    ps.playing = false;
    beginSkip(ps);
    expect(ps.skipping).toBe(true);
    expect(cancelSkip(ps)).toBe(true);
    expect(ps.skipping).toBe(false);
    expect(ps.playing).toBe(false);
    expect(ps.speed).toBe(8);
    expect(ps.acc).toBe(0);
    expect(cancelSkip(ps)).toBe(false);
  });

  it('모달 도착과 52주 안전장치도 스킵 상태를 남기지 않는다', () => {
    const s = mk('skip-d');
    s.pendingReview = 0;
    const ps = newPlayState(1);
    beginSkip(ps);
    const r = stepPlayback(ps, s, 40, 1000);
    expect(r.ended === 'modal' || r.ended === 'decision').toBe(true);
    expect(ps.skipping).toBe(false);
    expect(ps.acc).toBe(0);
    const s2 = mk('skip-e');
    s2.auto = true;
    const ps2 = newPlayState(1);
    ps2.playing = true;
    beginSkip(ps2);
    let guard = 0;
    while (ps2.skipping && guard++ < 400) {
      const rr = stepPlayback(ps2, s2, 40, 1000);
      if (rr.ended === 'quiet') {
        expect(rr.weeks).toBeLessThanOrEqual(SKIP_MAX_WEEKS);
      }
    }
    expect(ps2.skipping).toBe(false);
    expect(ps2.acc).toBe(0);
  });
});
