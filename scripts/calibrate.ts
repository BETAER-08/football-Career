import { writeFileSync } from 'node:fs';
import { createPool } from '../src/engine/pool';
import { mixedSpec, countryCodes, targetShare, type Spec, type CareerResult } from '../src/engine/headless';
import type { Calibration } from '../src/engine/calibration';
import { getCountry } from '../src/engine/data';

const quick = process.argv.includes('--quick');
const MIX_N = quick ? 600 : 1800;
const MIX_PREFIX = 'cal-mix-';
const OUT = new URL('../src/data/calibration.json', import.meta.url);

function stats(rs: CareerResult[]) {
  const deb = rs.filter((r) => r.debuted);
  const big = deb.filter((r) => r.playedBig).length;
  const retired = deb.filter((r) => r.retireAge > 0);
  return {
    n: rs.length,
    debut: deb.length,
    debutRate: deb.length / Math.max(1, rs.length),
    big,
    bigShare: big / Math.max(1, deb.length),
    injEnd: rs.filter((r) => r.endedByInjury).length / Math.max(1, rs.length),
    avgRetire: retired.reduce((a, r) => a + r.retireAge, 0) / Math.max(1, retired.length)
  };
}

async function bisect(lo: number, hi: number, iters: number, log: boolean, f: (x: number) => Promise<number>, target: number): Promise<number> {
  let a = log ? Math.log(lo) : lo;
  let b = log ? Math.log(hi) : hi;
  let best = (a + b) / 2;
  let bestErr = Infinity;
  for (let i = 0; i < iters; i++) {
    const mid = (a + b) / 2;
    const x = log ? Math.exp(mid) : mid;
    const v = await f(x);
    const err = Math.abs(v - target);
    if (err < bestErr) { bestErr = err; best = mid; }
    if (v < target) a = mid;
    else b = mid;
  }
  return log ? Math.exp(best) : best;
}

async function main(): Promise<void> {
  const pool = createPool();
  const cal: Calibration = { youthBoost: 6, injEndScale: 1, retireScale: 1, m: {} };
  const t0 = Date.now();
  const mix: Spec[] = Array.from({ length: MIX_N }, (_, i) => mixedSpec(i, MIX_PREFIX));
  const runMix = async () => stats(await pool.run(mix, cal));

  console.log('1/4 youthBoost');
  cal.youthBoost = await bisect(-12, 40, quick ? 8 : 10, false, async (x) => { cal.youthBoost = x; return (await runMix()).debutRate; }, 0.6);
  console.log('  youthBoost', cal.youthBoost.toFixed(3));

  console.log('2/4 retireScale');
  cal.retireScale = await bisect(0.2, 6, quick ? 6 : 8, true, async (x) => { cal.retireScale = x; return -(await runMix()).avgRetire; }, -33.5);
  console.log('  retireScale', cal.retireScale.toFixed(3));

  console.log('3/4 injEndScale');
  cal.injEndScale = await bisect(0.1, 30, quick ? 6 : 8, true, async (x) => { cal.injEndScale = x; return (await runMix()).injEnd; }, 0.035);
  console.log('  injEndScale', cal.injEndScale.toFixed(3));

  console.log('4/4 per-country m');
  const results: Record<string, { n: number; debut: number; big: number; share: number; target: number; m: number }> = {};
  for (const code of countryCodes()) {
    const target = targetShare(code);
    const c = getCountry(code);
    if (target === 0) {
      cal.m[code] = 0;
    }
    const n = quick ? 500 : Math.min(2600, Math.max(700, Math.ceil(26 / Math.max(target, 0.002) / 0.6)));
    const specs: Spec[] = Array.from({ length: n }, (_, i) => ({ seed: `cal-${code}-${i}`, country: code, level: 0, pos: 'random', mode: 'player' }));
    if (target > 0) {
      const tol = target < 0.001 ? 0.0015 : target * 0.2;
      cal.m[code] = await bisect(0.00002, 400, quick ? 9 : 11, true, async (x) => {
        cal.m[code] = x;
        return stats(await pool.run(specs, cal)).bigShare;
      }, target);
      void tol;
    }
    const st = stats(await pool.run(specs, cal));
    results[code] = { n, debut: st.debut, big: st.big, share: st.bigShare, target, m: cal.m[code] };
    console.log(`  ${code} ${c.ko} m=${cal.m[code].toFixed(4)} share=${(st.bigShare * 100).toFixed(3)}% target=${(target * 100).toFixed(3)}% n=${n}`);
  }

  const fin = await runMix();
  console.log('final mix', fin);
  const out = {
    meta: { note: 'scripts/calibrate.ts 가 산출한 보정 계수입니다. youthBoost는 게임성을 위해 유스→1군 데뷔율을 실제보다 높게 보정하는 단일 계수입니다.', generated: new Date().toISOString().slice(0, 10), mixN: MIX_N, mixPrefix: MIX_PREFIX, quick },
    youthBoost: Math.round(cal.youthBoost * 1000) / 1000,
    injEndScale: Math.round(cal.injEndScale * 1000) / 1000,
    retireScale: Math.round(cal.retireScale * 1000) / 1000,
    m: Object.fromEntries(Object.entries(cal.m).map(([k, v]) => [k, Math.round(v * 100000) / 100000])),
    results,
    mix: { debutRate: fin.debutRate, injEnd: fin.injEnd, avgRetire: fin.avgRetire }
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  await pool.close();
  console.log('done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
}

main().catch((e) => { console.error(e); process.exit(1); });
