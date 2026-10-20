import { runOne, type Spec } from '../src/engine/headless';
import { ensureContent } from '../src/engine/content';

ensureContent();
const N = Number(process.argv[2] ?? 300);
for (const c of ['KR', 'JP', 'US', 'GB']) {
  let n = 0, school = 0, pro = 0, debut = 0, viaSchoolDebut = 0;
  for (let i = 0; i < N; i++) {
    const sp: Spec = { seed: `sc-${c}-${i}`, country: c, level: 0, pos: 'random', mode: 'player' };
    const r = runOne(sp);
    n++;
    if (r.school) school++;
    if (r.schoolPro) pro++;
    if (r.debuted) debut++;
    if (r.schoolPro && r.debuted) viaSchoolDebut++;
  }
  console.log(c, { n, school: (school / n * 100).toFixed(1) + '%', schoolToPro: pro, schoolToProOfSchool: (pro / Math.max(1, school) * 100).toFixed(1) + '%', debut: (debut / n * 100).toFixed(1) + '%', viaSchoolDebut });
}
