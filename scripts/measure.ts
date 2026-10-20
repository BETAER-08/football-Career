import { newGame, autoStep, autoWeek, tickState } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { setFast } from '../src/engine/log';
import { setCosmetic } from '../src/engine/flags';
import { forcedOrigin, originRng, mixedSpec } from '../src/engine/headless';
import { budgetBonus } from '../src/engine/budget';
import { seasonOf, swOf } from '../src/engine/time';

ensureContent();
setFast(true);
setCosmetic(false);

const N = Number(process.argv[2] ?? 1000);
const rows: { phase: string; c: number; maj: number; min: number; p: number; bonus: number }[] = [];
for (let i = 0; i < N; i++) {
  const sp = mixedSpec(i, 'meas-');
  const origin = forcedOrigin(originRng(sp.seed), sp.country);
  const s = newGame({ seed: sp.seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 }, origin);
  s.auto = true;
  let guard = 0;
  while (!s.ended && guard++ < 52 * 62) {
    autoStep(s);
    autoWeek(s);
    if (swOf(s.week) === 50 && s.ev.bud.s === seasonOf(s.week)) rows.push({ phase: s.phase, c: s.ev.bud.choiceN, maj: s.ev.bud.majorN, min: s.ev.bud.minorN, p: s.ev.bud.passN, bonus: budgetBonus(s) });
    if (!tickState(s)) autoStep(s);
  }
}
const stat = (f: (r: (typeof rows)[number]) => number, rs = rows) => ({ avg: +(rs.reduce((a, r) => a + f(r), 0) / Math.max(1, rs.length)).toFixed(2), max: rs.reduce((a, r) => Math.max(a, f(r)), 0), n: rs.length });
console.log('careers', N, 'seasons', rows.length);
console.log('choice/season', stat((r) => r.c), 'major', stat((r) => r.maj), 'minor', stat((r) => r.min));
console.log('passive/season', stat((r) => r.p));
for (const ph of ['youth', 'pro', 'coach', 'postcareer']) {
  const rs = rows.filter((r) => r.phase === ph);
  console.log(ph, 'choice', stat((r) => r.c, rs), 'passive', stat((r) => r.p, rs));
}
const up = rows.filter((r) => r.bonus > 0);
const down = rows.filter((r) => r.bonus < 0);
const flat = rows.filter((r) => r.bonus === 0);
console.log('bonus>0 choice', stat((r) => r.c, up), 'bonus=0', stat((r) => r.c, flat), 'bonus<0', stat((r) => r.c, down));
