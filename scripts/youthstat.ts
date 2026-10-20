import { runBot } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { setFast } from '../src/engine/log';
import { setCosmetic } from '../src/engine/flags';
import { forcedOrigin, originRng, mixedSpec } from '../src/engine/headless';
import { ageAt } from '../src/engine/time';
import { setCal } from '../src/engine/calibration';

ensureContent();
setFast(true);
setCosmetic(false);

const N = Number(process.argv[2] ?? 500);
if (process.argv[3]) setCal({ youthBoost: Number(process.argv[3]) });
const t0 = Date.now();
let signed = 0;
let debuted = 0;
let jumped = 0;
let dbl = 0;
let callup = 0;
let train = 0;
let squad = 0;
let settled = 0;
const debutAges: number[] = [];
const signAges: number[] = [];
const stageEnd: Record<string, number> = {};
let weeksTotal = 0;
for (let i = 0; i < N; i++) {
  const sp = mixedSpec(i, 'ys-');
  const origin = forcedOrigin(originRng(sp.seed), sp.country);
  let sawCall = false;
  let signAge = -1;
  const s = runBot({ seed: sp.seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 }, origin, (st) => {
    if (st.career.entry.callups > 0) sawCall = true;
    if (signAge < 0 && st.career.signed) signAge = ageAt(st.p.birth, st.week);
    return st.career.retired || st.ended || st.week > 52 * 12;
  });
  weeksTotal += s.week;
  if (s.career.signed) { signed++; signAges.push(signAge); }
  if (s.career.debuted) { debuted++; debutAges.push(ageAt(s.p.birth, s.career.debutW)); }
  if (s.career.entry.jumps > 0) jumped++;
  if (s.career.entry.doubleJump) dbl++;
  if (sawCall) callup++;
  if (s.career.entry.step >= 1 || s.career.debuted) train++;
  if (s.career.entry.step >= 2 || s.career.debuted) squad++;
  if (s.phase !== 'youth' && s.career.debuted) settled++;
  stageEnd[s.career.youthStage] = (stageEnd[s.career.youthStage] ?? 0) + 1;
}
const med = (a: number[]) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : 0; };
const pct = (v: number, n = N) => (v / n * 100).toFixed(1) + '%';
console.log(`N=${N} time=${((Date.now() - t0) / 1000).toFixed(1)}s ms/career-week=${((Date.now() - t0) / weeksTotal).toFixed(3)}`);
console.log('signed', pct(signed), 'debuted', pct(debuted), 'train', pct(train), 'squad', pct(squad), 'settledPro', pct(settled));
console.log('jump', pct(jumped), 'double', pct(dbl), 'callup', pct(callup));
console.log('signAge median', med(signAges), 'dist', [16, 17, 18, 19, 20].map((a) => a + ':' + signAges.filter((x) => x === a).length).join(' '));
const le = (a: number) => pct(debutAges.filter((x) => x <= a).length, debutAges.length);
console.log('debutAge median', med(debutAges), '<=16', le(16), '<=17', le(17), '<=18', le(18), '<=19', le(19), '<=20', le(20), '<=21', le(21));
console.log('stageEnd', JSON.stringify(stageEnd));
