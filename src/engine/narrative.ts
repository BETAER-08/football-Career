import { Rng } from './rng';
import { stream } from './streams';
import { genName, makePerson } from './relations';
import { dateOf } from './time';
import { isJosaKind, josa } from './josa';
import { outcomeTexts, type EventDef } from '../data/schema';
import type { Bind, GameState, Person, PersonRef } from './types';

export const PERSON_TOKENS = [
  'coach', 'captain', 'mate', 'mate1', 'mate2', 'mate3', 'oldmate', 'oldrival', 'youthcoach', 'rival', 'agent', 'father', 'mother',
  'sibling', 'partner', 'child', 'reporter', 'director', 'owner', 'natcoach', 'star', 'fcoach'
] as const;

const PERSON_SET = new Set<string>(PERSON_TOKENS);
const AUTO_TOKENS = new Set<string>(['reporter']);
const TOKEN_RE = /\{(\w+)(?::[가-힣]+)?\}/g;

export function tokensIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(TOKEN_RE)) if (PERSON_SET.has(m[1]) && !out.includes(m[1])) out.push(m[1]);
  return out;
}

const tokenCache = new Map<string, string[]>();

export function defTexts(def: EventDef): string[] {
  const out: string[] = [...def.text];
  if (def.textBad) out.push(...def.textBad);
  if (def.again) out.push(def.again);
  if (def.choices) {
    for (const ch of def.choices) {
      out.push(ch.label);
      for (const o of [ch.ok, ch.bad, ch.great, ch.worst]) if (o) out.push(...outcomeTexts(o.t));
    }
  }
  return out;
}

export function defTokens(def: EventDef): string[] {
  let t = tokenCache.get(def.id);
  if (!t) {
    const set = new Set<string>();
    for (const x of defTexts(def)) for (const k of tokensIn(x)) set.add(k);
    t = [...set];
    tokenCache.set(def.id, t);
  }
  return t;
}

export function resetTokenCache(): void {
  tokenCache.clear();
}

function ref(k: string, p: Person | undefined): PersonRef | null {
  return p && p.name ? { k, n: p.name } : null;
}

function candidates(s: GameState, token: string): PersonRef[] {
  const pe = s.people;
  const one = (k: string): PersonRef[] => {
    const r = ref(k, pe[k]);
    return r ? [r] : [];
  };
  switch (token) {
    case 'coach': case 'captain': case 'mate1': case 'mate2': case 'mate3': case 'rival': case 'father': case 'mother': case 'partner':
    case 'director': case 'owner': case 'natcoach': case 'fcoach':
      return one(token);
    case 'agent': return pe.agent && !pe.agent.gone ? one('agent') : [];
    case 'reporter': return one('media');
    case 'mate': return ['mate1', 'mate2', 'mate3'].flatMap(one);
    case 'sibling': {
      const k = Object.keys(pe).find((x) => x.startsWith('sibling'));
      return k ? one(k) : [];
    }
    case 'child': {
      const k = Object.keys(pe).find((x) => x.startsWith('child'));
      return k ? one(k) : [];
    }
    case 'oldmate': {
      const f = s.wld.faces.find((x) => x.role === 'mate' && x.status !== 'quit');
      return f ? [{ k: `face:${f.key}`, n: f.name }] : [];
    }
    case 'oldrival': {
      const f = s.wld.faces.find((x) => x.role === 'rival');
      return f ? [{ k: `face:${f.key}`, n: f.name }] : [];
    }
    case 'youthcoach': return s.wld.youthCoach.name ? [{ k: 'youthcoach', n: s.wld.youthCoach.name }] : [];
    case 'star': return s.coach.squad.map((p) => ({ k: `squad:${p.id}`, n: p.name }));
    default: return [];
  }
}

export function personExists(s: GameState, token: string): boolean {
  if (AUTO_TOKENS.has(token)) return true;
  return candidates(s, token).length > 0;
}

export function refValid(s: GameState, r: PersonRef): boolean {
  if (r.k.startsWith('face:')) return s.wld.faces.some((f) => `face:${f.key}` === r.k && f.name === r.n && f.status !== 'quit');
  if (r.k.startsWith('squad:')) return s.coach.squad.some((p) => `squad:${p.id}` === r.k && p.name === r.n);
  if (r.k === 'youthcoach') return s.wld.youthCoach.name === r.n;
  const p = s.people[r.k];
  return !!p && p.name === r.n && !p.gone;
}

export function needsMet(s: GameState, def: EventDef, inherited?: Bind): boolean {
  if (!narrativeFlags.personGate) return true;
  for (const t of defTokens(def)) {
    if (inherited && inherited[t]) {
      if (!refValid(s, inherited[t])) return false;
      continue;
    }
    if (!personExists(s, t)) return false;
  }
  return true;
}

export function bindRng(s: GameState, id: string): Rng {
  return stream(s.cfg.seed, `bind:${id}`, s.week);
}

function makeReporter(s: GameState, rng: Rng): PersonRef {
  const country = s.career.clubId ? s.p.country : s.p.country;
  const year = dateOf(s.week).y;
  const p = makePerson(rng, s.ev, 'media', country, { age: rng.int(30, 56), refYear: year, job: '담당 기자', rel: rng.int(-10, 10) });
  s.people.media = p;
  return { k: 'media', n: p.name };
}

export const narrativeFlags = { personGate: true };

export const narrativeStats = { fallback: 0, autoReporter: 0 };

export function bindTokens(s: GameState, tokens: string[], rng: Rng, inherited?: Bind): Bind {
  const out: Bind = {};
  for (const t of tokens) {
    if (inherited && inherited[t] && refValid(s, inherited[t])) {
      out[t] = inherited[t];
      continue;
    }
    if (t === 'reporter' && !s.people.media) {
      narrativeStats.autoReporter += 1;
      out[t] = makeReporter(s, rng);
      continue;
    }
    const c = candidates(s, t);
    if (c.length) out[t] = c.length === 1 ? c[0] : c[rng.int(0, c.length - 1)];
    else {
      narrativeStats.fallback += 1;
      out[t] = { k: `tmp:${t}`, n: genName(rng, s.p.country).name };
    }
  }
  return out;
}

export function bindDef(s: GameState, def: EventDef, inherited?: Bind): Bind {
  return bindTokens(s, defTokens(def), bindRng(s, def.id), inherited);
}

export function freshName(s: GameState, token: string): string | null {
  const c = candidates(s, token);
  return c.length ? c[0].n : null;
}

export const RECENT_KEEP = 5;

export function chooseVariant(s: GameState, key: string, n: number): number {
  if (n <= 1) return 0;
  const used = s.ev.varUsed[key] ?? [];
  const skip = new Set(used.slice(-Math.min(n - 1, RECENT_KEEP)));
  const open: number[] = [];
  for (let i = 0; i < n; i++) if (!skip.has(i)) open.push(i);
  const rng = stream(s.cfg.seed, `var:${key}`, s.ev.varN++);
  const idx = open.length ? open[rng.int(0, open.length - 1)] : rng.int(0, n - 1);
  const next = [...used, idx];
  s.ev.varUsed[key] = next.length > RECENT_KEEP ? next.slice(-RECENT_KEEP) : next;
  return idx;
}

export function fillTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)(?::([가-힣]+))?\}/g, (m, k: string, j: string | undefined) => {
    const v = vars[k];
    if (v === undefined) return m;
    return j && isJosaKind(j) ? josa(v, j) : v;
  });
}

export function say(s: GameState, key: string, variants: readonly string[], vars: Record<string, string> = {}): string {
  return fillTemplate(variants[chooseVariant(s, key, variants.length)], vars);
}
