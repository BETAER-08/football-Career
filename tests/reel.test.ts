import { describe, expect, it } from 'vitest';
import { originFromSeed } from '../src/engine/player';
import { ACCEL_MS, DECEL_MS, MAX_BODY, MIN_BODY, REEL_MS, buildFullPlan, motionAt } from '../src/ui/reel';
import type { GameConfig } from '../src/engine/types';

const cfg = (seed: string): GameConfig => ({ seed, name: 'a', pos: 'random', mode: 'normal', code: '', lengthMin: 30 });

describe('reel', () => {
  it('같은 시드는 같은 결과 칸에 멈춘다', () => {
    for (const seed of ['a', 'b', 'seed-3', 'zz9']) {
      const o = originFromSeed(cfg(seed));
      const p1 = buildFullPlan(o, seed);
      const p2 = buildFullPlan(o, seed);
      expect(p1.reels.map((r) => r.cells.map((c) => c.key))).toEqual(p2.reels.map((r) => r.cells.map((c) => c.key)));
      const keys = [o.country, o.leagueId, o.clubId];
      p1.reels.forEach((r, i) => {
        expect(r.cells[r.resultAt].key).toBe(keys[i]);
        expect(r.resultAt).toBeGreaterThanOrEqual(MIN_BODY);
        expect(r.resultAt).toBeLessThanOrEqual(MAX_BODY);
        expect(r.cells.length).toBe(r.resultAt + 3);
      });
    }
  });

  it('모션은 결과 칸에 정확히 멈추고 약 8% 넘어갔다가 돌아온다', () => {
    const travel = 35;
    expect(motionAt(0, travel).pos).toBe(0);
    const end = motionAt(REEL_MS, travel);
    expect(end.done).toBe(true);
    expect(end.pos).toBeCloseTo(travel, 6);
    let max = 0;
    let prev = -1;
    for (let t = 0; t <= REEL_MS; t += 4) {
      const m = motionAt(t, travel);
      expect(m.pos).toBeGreaterThanOrEqual(prev - 1e-9 - 1);
      prev = m.pos;
      max = Math.max(max, m.pos);
    }
    expect(max).toBeGreaterThan(travel);
    expect(max - travel).toBeLessThan(1);
    expect(motionAt(ACCEL_MS, travel).speed).toBeCloseTo(1, 6);
    expect(motionAt(REEL_MS - DECEL_MS, travel).speed).toBeCloseTo(1, 6);
  });
});
