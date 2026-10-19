import { readFileSync, writeFileSync } from 'node:fs';
const src = process.argv[2];
const dir = new URL('../src/data/cities/', import.meta.url);
const codes = [];
for (const line of readFileSync(src, 'utf8').split('\n').filter(Boolean)) {
  const [code, rest] = line.split('|');
  const items = rest.split(',').map((s) => {
    const [ko, en, pop] = s.split(':');
    return `  { ko: '${ko}', en: "${en}", pop: ${pop} }`;
  });
  writeFileSync(new URL(`${code}.ts`, dir), `import type { City } from '../schema';\n\nexport const cities: City[] = [\n${items.join(',\n')}\n];\n`);
  codes.push(code);
}
const idx = ["import { CitySchema, type City } from '../schema';"];
for (const c of codes.sort()) idx.push(`import { cities as c${c} } from './${c}';`);
idx.push('', 'const RAW: Record<string, City[]> = { ' + codes.map((c) => `${c}: c${c}`).join(', ') + ' };', '');
idx.push('export const CITIES: Record<string, City[]> = Object.fromEntries(');
idx.push('  Object.entries(RAW).map(([k, v]) => [k, v.map((c) => CitySchema.parse(c))])');
idx.push(');', '');
writeFileSync(new URL('index.ts', dir), idx.join('\n'));
console.log(codes.length);
