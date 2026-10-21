import { describe, expect, it } from 'vitest';
import { newGame, runBot } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { setFast } from '../src/engine/log';
import { setCosmetic } from '../src/engine/flags';
import { forcedOrigin, originRng } from '../src/engine/headless';
import { createState, scoutLine } from '../src/engine/player';
import { anchored, curOvr, rawForAnchored } from '../src/engine/attributes';
import { migrateState } from '../src/engine/migrate';
import { growWeek } from '../src/engine/growth';
import { rngOf } from '../src/engine/world';
import { ALL_ATTRS } from '../src/engine/types';
import type { GameConfig, GameState } from '../src/engine/types';

ensureContent();

const cfgOf = (seed: string): GameConfig => ({ seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });
const CODES = ['GB', 'US', 'BR', 'JP', 'KR', 'NG', 'ES', 'DE'];

describe('숨겨진 성장 한계', () => {
  it('상한 분포가 15/35/35/15 ±1.5%p이고 모두 60~99이며 시작 오버롤은 상한 − 6 이하이다', () => {
    const N = 10000;
    const bins = [0, 0, 0, 0];
    for (let i = 0; i < N; i++) {
      const seed = `cap-${i}`;
      const level = 2 + (i % 5);
      const origin = forcedOrigin(originRng(seed), CODES[i % CODES.length], level);
      const { state } = createState(cfgOf(seed), origin);
      const cap = state.ab.cap;
      expect(cap).toBeGreaterThanOrEqual(60);
      expect(cap).toBeLessThanOrEqual(99);
      expect(state.p.startOvr).toBeLessThanOrEqual(cap - 6 + 0.06);
      expect(anchored(curOvr(state.ab))).toBeLessThanOrEqual(cap + 0.05);
      bins[Math.min(3, Math.floor((cap - 60) / 10))]++;
    }
    const want = [0.15, 0.35, 0.35, 0.15];
    for (let t = 0; t < 4; t++) expect(Math.abs(bins[t] / N - want[t])).toBeLessThanOrEqual(0.015);
  });

  it('상한은 국가·수준과 무관하다', () => {
    const mean = (code: string, level: number): number => {
      let sum = 0;
      for (let i = 0; i < 1500; i++) {
        const seed = `capind-${code}-${level}-${i}`;
        sum += createState(cfgOf(seed), forcedOrigin(originRng(seed), code, level)).state.ab.cap;
      }
      return sum / 1500;
    };
    const a = mean('GB', 6);
    const b = mean('NG', 2);
    expect(Math.abs(a - b)).toBeLessThan(2);
  });

  it('능력치를 최대로 올려도 주간 성장 처리 후 오버롤이 상한을 넘지 않는다', () => {
    for (let i = 0; i < 20; i++) {
      const seed = `capmax-${i}`;
      const s = newGame(cfgOf(seed), forcedOrigin(originRng(seed), CODES[i % CODES.length], 4));
      for (const k of ALL_ATTRS) s.ab.a[k] = 20;
      growWeek(s, rngOf(s), 18);
      expect(anchored(curOvr(s.ab))).toBeLessThanOrEqual(s.ab.cap + 0.05);
    }
  });

  it('커리어 전체에서 오버롤이 상한을 넘지 않는다', () => {
    setFast(true);
    setCosmetic(false);
    for (let i = 0; i < 8; i++) {
      const seed = `capcareer-${i}`;
      let peak = 0;
      const end = runBot(cfgOf(seed), forcedOrigin(originRng(seed), CODES[i], 5), (x) => {
        peak = Math.max(peak, anchored(curOvr(x.ab)));
        return false;
      }, 52 * 22);
      expect(peak).toBeLessThanOrEqual(end.ab.cap + 0.1);
    }
  });

  it('화면 문구에 상한 수치가 드러나지 않는다', () => {
    for (let i = 0; i < 300; i++) {
      const seed = `capui-${i}`;
      const { state } = createState(cfgOf(seed), forcedOrigin(originRng(seed), CODES[i % CODES.length], 2 + (i % 5)));
      const texts = [state.p.rumor, scoutLine(state)];
      const capStr = String(Math.round(state.ab.cap));
      for (const t of texts) {
        expect(t).not.toMatch(/\d/);
        expect(t.includes(capStr)).toBe(false);
        expect(t).not.toContain('잠재력은');
      }
    }
  });

  it('구 저장은 잠재력을 상한으로 옮기고 60~99로 제한한다', () => {
    const seed = 'capmig';
    const s: GameState = newGame(cfgOf(seed), forcedOrigin(originRng(seed), 'GB', 4));
    const old = JSON.parse(JSON.stringify(s)) as GameState & Record<string, unknown>;
    old.v = 7;
    (old.ab as unknown as Record<string, unknown>).cap = undefined;
    old.ab.pot = 120;
    const r1 = migrateState(old);
    expect(r1.ok && r1.state.ab.cap).toBe(99);
    const old2 = JSON.parse(JSON.stringify(s)) as GameState & Record<string, unknown>;
    old2.v = 7;
    (old2.ab as unknown as Record<string, unknown>).cap = undefined;
    old2.ab.pot = 40;
    const r2 = migrateState(old2);
    expect(r2.ok && r2.state.ab.cap).toBe(60);
    expect(r2.ok && r2.state.ab.pot).toBeCloseTo(rawForAnchored(60), 1);
  });
});
