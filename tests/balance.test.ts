import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import cal from '../src/data/calibration.json';
import { createPool, type Pool } from '../src/engine/pool';
import { mixedSpec, targetShare, type CareerResult, type Spec } from '../src/engine/headless';
import type { Calibration } from '../src/engine/calibration';
import { newGame, tickState } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { COUNTRIES } from '../src/data/countries';

const calibration: Calibration = {
  youthBoost: cal.youthBoost,
  injEndScale: cal.injEndScale,
  retireScale: (cal as { retireScale: number }).retireScale,
  m: cal.m as Record<string, number>
};
const meta = cal.meta as { mixN: number; mixPrefix: string };
const results = (cal as unknown as { results: Record<string, { n: number }> }).results;

let pool: Pool;
beforeAll(() => {
  pool = createPool();
});
afterAll(async () => {
  await pool.close();
});

function stats(rs: CareerResult[]) {
  const deb = rs.filter((r) => r.debuted);
  const retired = deb.filter((r) => r.retireAge > 0);
  return {
    debutRate: deb.length / rs.length,
    bigShare: deb.filter((r) => r.playedBig).length / Math.max(1, deb.length),
    injEnd: rs.filter((r) => r.endedByInjury).length / rs.length,
    avgRetire: retired.reduce((a, r) => a + r.retireAge, 0) / Math.max(1, retired.length)
  };
}

describe('확률 보정 목표', () => {
  it('유스→1군 데뷔율 55~65%, 커리어 종료 부상 2~5%, 평균 은퇴 나이 31~35세', async () => {
    const specs: Spec[] = Array.from({ length: meta.mixN }, (_, i) => mixedSpec(i, meta.mixPrefix));
    const st = stats(await pool.run(specs, calibration));
    expect(st.debutRate).toBeGreaterThanOrEqual(0.55);
    expect(st.debutRate).toBeLessThanOrEqual(0.65);
    expect(st.injEnd).toBeGreaterThanOrEqual(0.02);
    expect(st.injEnd).toBeLessThanOrEqual(0.05);
    expect(st.avgRetire).toBeGreaterThanOrEqual(31);
    expect(st.avgRetire).toBeLessThanOrEqual(35);
  });

  it('국가별 데뷔자 중 수준 5 이상 도달 비율이 표의 빅리그/프로 비율과 ±20% 이내', async () => {
    const bad: string[] = [];
    for (const c of COUNTRIES) {
      const target = targetShare(c.code);
      const n = results[c.code].n;
      const specs: Spec[] = Array.from({ length: n }, (_, i) => ({ seed: `cal-${c.code}-${i}`, country: c.code, level: 0, pos: 'random', mode: 'player' }));
      const st = stats(await pool.run(specs, calibration));
      const ok = target < 0.001 ? Math.abs(st.bigShare - target) <= 0.0015 : Math.abs(st.bigShare - target) <= target * 0.2;
      if (!ok) bad.push(`${c.code} 목표 ${(target * 100).toFixed(3)}% 실제 ${(st.bigShare * 100).toFixed(3)}%`);
    }
    expect(bad).toEqual([]);
  });
});

describe('지도자 밸런스 (66세까지 그만두지 않고 제안을 받는 봇)', () => {
  it('감독 데뷔 90% 이상, 수준 5 이상 감독·대표팀 감독 15~25%, 대표팀 감독 5~10%, 평균 경질 1~2회', async () => {
    const specs: Spec[] = Array.from({ length: 400 }, (_, i) => ({ ...mixedSpec(i, 'cs-'), mode: 'coach' as const }));
    const rs = (await pool.run(specs, calibration)).filter((r) => r.coachEntered);
    const mgr = rs.filter((r) => r.everManager).length / rs.length;
    const big = rs.filter((r) => r.everBigOrNat).length / rs.length;
    const nat = rs.filter((r) => r.everNat).length / rs.length;
    const fired = rs.reduce((a, r) => a + r.fired, 0) / rs.length;
    expect(mgr).toBeGreaterThanOrEqual(0.9);
    expect(big).toBeGreaterThanOrEqual(0.15);
    expect(big).toBeLessThanOrEqual(0.25);
    expect(nat).toBeGreaterThanOrEqual(0.05);
    expect(nat).toBeLessThanOrEqual(0.1);
    expect(fired).toBeGreaterThanOrEqual(1);
    expect(fired).toBeLessThanOrEqual(2);
  });
});

describe('성능', () => {
  it('헤드리스 커리어 10,000회가 60초 안에 끝난다', async () => {
    const specs: Spec[] = Array.from({ length: 10000 }, (_, i) => mixedSpec(i, 'perf-'));
    const t0 = Date.now();
    const rs = await pool.run(specs, calibration);
    const sec = (Date.now() - t0) / 1000;
    expect(rs.length).toBe(10000);
    expect(sec).toBeLessThan(60);
  });
  it('주 단위 tick 한 번은 2ms 미만이다', () => {
    ensureContent();
    const s = newGame({ seed: 'perf-tick', name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });
    s.auto = true;
    let worst = 0;
    let total = 0;
    let n = 0;
    for (let i = 0; i < 52 * 12; i++) {
      if (s.decision) s.decision = null;
      const t0 = performance.now();
      tickState(s);
      const d = performance.now() - t0;
      total += d;
      n++;
      worst = Math.max(worst, d);
    }
    expect(total / n).toBeLessThan(2);
    expect(worst).toBeLessThan(20);
  });
});
