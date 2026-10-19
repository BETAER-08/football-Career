import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const dir = new URL('../src/data/names/', import.meta.url);
const files = process.argv.slice(2);
const bases = {};
const countries = {};
for (const f of files) {
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const [code, kind, list] = line.split('|');
    if (code.startsWith('@')) bases[code + kind] = ((bases[code + kind] ?? '') + ' ' + list.trim()).trim();
    else {
      countries[code] = countries[code] || { G: '', S: '' };
      countries[code][kind] += ' ' + list.trim();
    }
  }
}
const expand = (s) => s.replace(/\+@(\w+)([GS])/g, (_m, b, k) => bases['@' + b + k] ?? (console.error('missing base', b, k), '')).trim().split(/(?<=[가-힣])\s+(?=[A-Za-zÀ-ž])/).map((t) => t.trim().replace(/\s+/g, '_')).filter(Boolean);
for (const [code, v] of Object.entries(countries)) {
  const out = {};
  for (const k of ['G', 'S']) {
    const seen = new Set();
    const arr = [];
    for (const tok of expand(v[k])) {
      const i = tok.indexOf(':');
      if (i < 0) { console.error('bad token', code, tok); continue; }
      const en = tok.slice(0, i);
      if (seen.has(en)) continue;
      seen.add(en);
      arr.push(tok);
    }
    out[k] = arr;
    if (arr.length < 100) console.error('SHORT', code, k, arr.length);
  }
  const esc = (a) => a.join(' ').replace(/'/g, "\\'");
  writeFileSync(new URL(`${code}.ts`, dir), `import type { NamePoolRaw } from '../schema';\n\nexport const names: NamePoolRaw = {\n  given: '${esc(out.G)}',\n  surname: '${esc(out.S)}'\n};\n`);
}
const codes = readdirSync(dir).filter((f) => /^[A-Z]{2}\.ts$/.test(f)).map((f) => f.slice(0, 2)).sort();
const idx = ["import { NamePoolSchema, type NamePoolRaw } from '../schema';"];
for (const c of codes) idx.push(`import { names as n${c} } from './${c}';`);
idx.push('', 'const RAW: Record<string, NamePoolRaw> = { ' + codes.map((c) => `${c}: n${c}`).join(', ') + ' };', '');
idx.push('export const NAME_POOLS: Record<string, { given: [string, string][]; surname: [string, string][] }> = Object.fromEntries(');
idx.push('  Object.entries(RAW).map(([code, raw]) => {');
idx.push('    const p = NamePoolSchema.parse(raw);');
idx.push("    const split = (s: string): [string, string][] => s.split(' ').map((t) => { const i = t.indexOf(':'); return [t.slice(0, i).replace(/_/g, ' '), t.slice(i + 1).replace(/_/g, ' ')]; });");
idx.push('    return [code, { given: split(p.given), surname: split(p.surname) }];');
idx.push('  })');
idx.push(');', '');
writeFileSync(new URL('index.ts', dir), idx.join('\n'));
console.log('countries', Object.keys(countries).length, 'written; index', codes.length);
