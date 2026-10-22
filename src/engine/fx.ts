import { ALL_ATTRS, ATTR_LABEL, HIDDEN_KEYS, HIDDEN_LABEL, type AttrKey, type Chip, type GameState, type HiddenKey } from './types';
import { Rng, clamp } from './rng';
import { getClub, getCountry } from './data';
import { ageAt, dateOf, swOf, seasonOf } from './time';
import { whyNow } from './why';
import { shownOvr, youthCallMin, enforceCap } from './attributes';

function shownRawOf(s: GameState): number {
  return shownOvr(s.ab, ageAt(s.p.birth, s.week));
}

export type Op =
  | { kind: 'var'; t: string; sign: '+' | '-' | '='; v: number }
  | { kind: 'flag'; n: string; on: boolean }
  | { kind: 'fx'; n: string; arg: string }
  | { kind: 'fu'; id: string; a: number; b: number };

export interface FxCtx { rng: Rng }
export type FxHandler = (s: GameState, ctx: FxCtx, arg: string) => Chip[] | void;

const handlers: Record<string, FxHandler> = {};
export function registerFx(name: string, fn: FxHandler): void {
  handlers[name] = fn;
}
export function hasFx(name: string): boolean {
  return name in handlers;
}

const SCALARS = ['morale', 'happy', 'stress', 'fatigue', 'health', 'sharp', 'burnout', 'sleep', 'diet', 'drink', 'fameD', 'fameA', 'val', 'cash', 'cashw', 'cashy', 'debt', 'deposit', 'stocks', 'followers', 'sponsor', 'edu', 'pot', 'skill', 'goal', 'assist', 'rating', 'coachFame', 'standing', 'postRep', 'postSkill', 'natCaps', 'income', 'realEstate', 'business', 'agentSkill', 'tactics', 'development', 'leadership', 'management', 'media', 'data', 'langSkill'];
const SCALAR_SET = new Set(SCALARS);

export const SCALAR_LABEL: Record<string, string> = {
  morale: '사기', happy: '행복', stress: '스트레스', fatigue: '피로', health: '건강', sharp: '경기 감각', burnout: '번아웃 위험', sleep: '수면', diet: '식단',
  drink: '음주', fameD: '국내 명성', fameA: '해외 명성', val: '시장가치', cash: '현금', cashw: '현금', cashy: '현금', debt: '부채', deposit: '예금', stocks: '주식',
  followers: 'SNS 팔로워', sponsor: '스폰서 수입', edu: '학력', pot: '성장 가능성', skill: '전체 능력', goal: '득점', assist: '도움', rating: '평점',
  coachFame: '지도자 명성', standing: '입지', postRep: '평판', postSkill: '전문성', natCaps: 'A매치', income: '수입', realEstate: '부동산', business: '사업',
  agentSkill: '에이전트 역량', tactics: '전술', development: '육성', leadership: '리더십', management: '선수단 관리', media: '미디어 대응', data: '데이터 활용', langSkill: '언어'
};

export const REL_LABEL: Record<string, string> = {
  coach: '감독', fcoach: '1군 감독', captain: '주장', mate1: '동료', mate2: '동료', mate3: '동료', rival: '라이벌', agent: '에이전트', father: '아버지', mother: '어머니',
  partner: '연인', fans: '팬', media: '언론', natcoach: '대표팀 감독', director: '단장', owner: '구단주', mates: '동료', family: '가족', sibling1: '형제자매', all: '주변'
};

const cache = new Map<string, Op[]>();

export function parseFx(src: string | undefined): Op[] {
  if (!src) return [];
  const hit = cache.get(src);
  if (hit) return hit;
  const ops: Op[] = [];
  for (const tok of src.trim().split(/\s+/)) {
    if (!tok) continue;
    if (tok.startsWith('flag:')) { ops.push({ kind: 'flag', n: tok.slice(5), on: true }); continue; }
    if (tok.startsWith('unflag:')) { ops.push({ kind: 'flag', n: tok.slice(7), on: false }); continue; }
    if (tok.startsWith('fu:')) {
      const m = /^fu:([\w-]+)@(\d+)-(\d+)$/.exec(tok);
      if (!m) throw new Error(`bad fu ${tok}`);
      ops.push({ kind: 'fu', id: m[1], a: Number(m[2]), b: Number(m[3]) });
      continue;
    }
    if (tok.startsWith('fx:')) {
      const body = tok.slice(3);
      const i = body.indexOf('=');
      const n = i < 0 ? body : body.slice(0, i);
      ops.push({ kind: 'fx', n, arg: i < 0 ? '' : body.slice(i + 1) });
      continue;
    }
    const m = /^([A-Za-z_][\w.]*)([+\-=])(-?\d+(?:\.\d+)?)$/.exec(tok);
    if (!m) throw new Error(`bad fx token "${tok}" in "${src}"`);
    const t = m[1];
    if (!validTarget(t)) throw new Error(`bad fx target "${t}" in "${src}"`);
    ops.push({ kind: 'var', t, sign: m[2] as '+' | '-' | '=', v: Number(m[3]) });
  }
  cache.set(src, ops);
  return ops;
}

function validTarget(t: string): boolean {
  if (SCALAR_SET.has(t)) return true;
  if (t.startsWith('attr.') || t.startsWith('ceil.')) return (ALL_ATTRS as string[]).includes(t.slice(t.indexOf('.') + 1));
  if (t.startsWith('hid.')) return (HIDDEN_KEYS as readonly string[]).includes(t.slice(4));
  if (t.startsWith('rel.')) return true;
  if (t.startsWith('lang.')) return true;
  return false;
}

export function scaleFx(src: string | undefined, k: number): string | undefined {
  if (!src || k >= 1) return src;
  return src
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const m = /^([A-Za-z_][\w.]*)([+\-=])(-?\d+(?:\.\d+)?)$/.exec(tok);
      if (!m || m[2] === '=') return tok;
      const v = Number(m[3]) * k;
      return `${m[1]}${m[2]}${v >= 10 ? Math.round(v) : Math.round(v * 100) / 100}`;
    })
    .join(' ');
}

export function validateFx(src: string | undefined): void {
  for (const op of parseFx(src)) {
    if (op.kind === 'fx' && !hasFx(op.n)) throw new Error(`unknown fx:${op.n}`);
  }
}

const SILENT_PREFIX = ['hid.', 'ceil.'];

export function labelOf(t: string, s?: GameState): string {
  if (t.startsWith('attr.')) return ATTR_LABEL[t.slice(5) as AttrKey];
  if (t.startsWith('hid.')) return HIDDEN_LABEL[t.slice(4) as HiddenKey];
  if (t.startsWith('rel.')) {
    const key = t.slice(4);
    if (s && s.people[key]) return `${REL_LABEL[key] ?? s.people[key].kind} 관계`;
    return `${REL_LABEL[key] ?? '관계'} 관계`;
  }
  if (t.startsWith('lang.')) return `${t.slice(5)} 숙련`;
  return SCALAR_LABEL[t] ?? t;
}

function addChip(chips: Chip[], k: string, d: number, u?: string): void {
  if (Math.abs(d) < 1e-9) return;
  const ex = chips.find((c) => c.k === k && c.u === u);
  if (ex) ex.d += d;
  else chips.push({ k, d, u });
}

export function money(s: GameState, w: number): number {
  const c = s.career.contract;
  const wage = c ? c.wage / 52 : 0;
  const floor = 30 + getCountry(s.p.country).econ * 120;
  return Math.max(wage, floor) * w;
}

export function applyVar(s: GameState, t: string, sign: '+' | '-' | '=', v: number, chips: Chip[]): void {
  const signed = sign === '-' ? -v : v;
  const set = sign === '=';
  if (t.startsWith('attr.')) {
    const k = t.slice(5) as AttrKey;
    const before = s.ab.a[k];
    const delta = !set && signed < 0 && s.phase === 'youth' ? signed * 1.5 : signed;
    s.ab.a[k] = clamp(set ? v : before + delta, 1, 20);
    const ceilStep = set ? 0 : delta < 0 ? delta * 0.8 : delta * 0.6;
    s.ab.ceil[k] = clamp(Math.max(s.ab.ceil[k] + ceilStep, delta < 0 ? s.ab.a[k] : s.ab.a[k] * 0.9), 1, 20);
    enforceCap(s.ab);
    addChip(chips, ATTR_LABEL[k], s.ab.a[k] - before);
    whyNow(s, t, s.ab.a[k] - before);
    return;
  }
  if (t.startsWith('ceil.')) {
    const k = t.slice(5) as AttrKey;
    s.ab.ceil[k] = clamp(set ? v : s.ab.ceil[k] + signed, 1, 20);
    return;
  }
  if (t.startsWith('hid.')) {
    const k = t.slice(4) as HiddenKey;
    s.hid[k] = clamp(set ? v : s.hid[k] + signed, 0, 100);
    return;
  }
  if (t.startsWith('rel.')) {
    const key = t.slice(4);
    const keys = key === 'mates' ? ['mate1', 'mate2', 'mate3'] : key === 'family' ? ['father', 'mother', ...Object.keys(s.people).filter((k) => k.startsWith('sibling'))] : key === 'all' ? Object.keys(s.people) : [key];
    for (const kk of keys) {
      const p = s.people[kk];
      if (!p) continue;
      const before = p.rel;
      p.rel = clamp(set ? v : p.rel + signed, -100, 100);
      addChip(chips, `${REL_LABEL[kk] ?? p.name} 관계`, p.rel - before);
      whyNow(s, `rel.${kk}`, p.rel - before);
    }
    return;
  }
  if (t.startsWith('lang.')) {
    const k = t.slice(5);
    const before = s.life.lang[k] ?? 0;
    s.life.lang[k] = clamp(set ? v : before + signed, 0, 100);
    addChip(chips, `${k} 숙련`, s.life.lang[k] - before);
    return;
  }
  const label = SCALAR_LABEL[t];
  switch (t) {
    case 'morale': case 'happy': case 'stress': case 'fatigue': case 'health': case 'sharp': case 'burnout': case 'sleep': case 'diet': case 'drink': {
      const o = s.st as unknown as Record<string, number>;
      const before = o[t];
      o[t] = clamp(set ? v : before + signed, 0, 100);
      addChip(chips, label, o[t] - before);
      whyNow(s, `st.${t}`, o[t] - before);
      return;
    }
    case 'fameD': { const b = s.fame.dom; s.fame.dom = clamp(set ? v : b + signed, 0, 100); addChip(chips, label, s.fame.dom - b); return; }
    case 'fameA': { const b = s.fame.abroad; s.fame.abroad = clamp(set ? v : b + signed, 0, 100); addChip(chips, label, s.fame.abroad - b); return; }
    case 'val': { const b = s.fame.value; s.fame.value = Math.max(1, Math.round(set ? v : b * (1 + signed / 100))); addChip(chips, label, s.fame.value - b, '만'); return; }
    case 'cash': { const b = s.fin.cash; s.fin.cash = Math.round(set ? v : b + signed); addChip(chips, '현금', s.fin.cash - b, '만'); return; }
    case 'cashw': { const amt = Math.round(money(s, signed)); s.fin.cash += amt; s.fin.yearIncomeAcc += Math.max(0, amt); addChip(chips, '현금', amt, '만'); return; }
    case 'cashy': { const base = Math.max(s.career.contract ? s.career.contract.wage : 0, 800); const amt = Math.round(base * signed); s.fin.cash += amt; addChip(chips, '현금', amt, '만'); return; }
    case 'debt': { const b = s.fin.debt; s.fin.debt = Math.max(0, Math.round(set ? v : b + signed)); addChip(chips, '부채', s.fin.debt - b, '만'); return; }
    case 'deposit': { const b = s.fin.deposit; s.fin.deposit = Math.max(0, Math.round(set ? v : b + signed)); addChip(chips, '예금', s.fin.deposit - b, '만'); return; }
    case 'stocks': { const b = s.fin.stocks; s.fin.stocks = Math.max(0, Math.round(set ? v : b + signed)); addChip(chips, '주식', s.fin.stocks - b, '만'); return; }
    case 'realEstate': { const b = s.fin.realEstate; s.fin.realEstate = Math.max(0, Math.round(set ? v : b + signed)); addChip(chips, '부동산', s.fin.realEstate - b, '만'); return; }
    case 'business': { const b = s.fin.business; s.fin.business = Math.max(0, Math.round(set ? v : b + signed)); addChip(chips, '사업 지분', s.fin.business - b, '만'); return; }
    case 'followers': { const b = s.fin.followers; s.fin.followers = Math.max(0, Math.round(set ? v : b + signed * Math.max(1, b * 0.02 + 5))); addChip(chips, label, s.fin.followers - b, '만'); return; }
    case 'sponsor': { const b = s.fin.sponsorYear; s.fin.sponsorYear = Math.max(0, Math.round(set ? v : b + signed)); addChip(chips, label, s.fin.sponsorYear - b, '만'); return; }
    case 'edu': { const b = s.life.eduProgress; s.life.eduProgress = Math.max(0, set ? v : b + signed); addChip(chips, label, s.life.eduProgress - b); return; }
    case 'pot': {
      const k = signed;
      for (const a of ALL_ATTRS) s.ab.ceil[a] = clamp(s.ab.ceil[a] + k * 0.12, 1, 20);
      addChip(chips, label, k);
      return;
    }
    case 'skill': {
      for (const a of ALL_ATTRS) if (!['reflexes', 'handling', 'oneOnOne', 'aerial', 'kicking', 'buildUp'].includes(a) || s.ab.pos === 'GK') s.ab.a[a] = clamp(s.ab.a[a] + signed, 1, 20);
      addChip(chips, label, signed);
      return;
    }
    case 'agentSkill': { s.fin.agentSkill = clamp(set ? v : s.fin.agentSkill + signed, 0, 100); return; }
    case 'coachFame': { const b = s.coach.fame; s.coach.fame = clamp(set ? v : b + signed, 0, 100); s.coach.peakFame = Math.max(s.coach.peakFame, s.coach.fame); addChip(chips, label, s.coach.fame - b); return; }
    case 'standing': { const b = s.coach.standing; s.coach.standing = clamp(set ? v : b + signed, 0, 100); addChip(chips, label, s.coach.standing - b); return; }
    case 'postRep': { const b = s.post.rep; s.post.rep = clamp(set ? v : b + signed, 0, 100); addChip(chips, label, s.post.rep - b); return; }
    case 'postSkill': { const b = s.post.skill; s.post.skill = clamp(set ? v : b + signed, 0, 100); addChip(chips, label, s.post.skill - b); return; }
    case 'natCaps': { s.nat.caps += signed; return; }
    case 'income': { const amt = Math.round(signed); s.fin.cash += amt; s.fin.yearIncomeAcc += Math.max(0, amt); addChip(chips, '현금', amt, '만'); return; }
    case 'tactics': case 'development': case 'leadership': case 'management': case 'media': case 'data': {
      const o = s.coach.skills;
      const b = o[t];
      o[t] = clamp(set ? v : b + signed, 0, Math.max(40, s.coach.cap));
      addChip(chips, `${label}`, o[t] - b);
      return;
    }
    case 'langSkill': { const b = s.coach.skills.language; s.coach.skills.language = clamp(set ? v : b + signed, 0, 100); addChip(chips, label, s.coach.skills.language - b); return; }
    case 'goal': case 'assist': case 'rating': {
      const k = `m.${t}`;
      s.decCtx[k] = String(Number(s.decCtx[k] ?? 0) + signed);
      return;
    }
    default:
      throw new Error(`apply ${t}`);
  }
}

export function applyFx(s: GameState, ctx: FxCtx, src: string | undefined, chips: Chip[] = []): Chip[] {
  for (const op of parseFx(src)) {
    switch (op.kind) {
      case 'var':
        applyVar(s, op.t, op.sign, op.v, chips);
        break;
      case 'flag':
        if (op.on) s.ev.flags[op.n] = s.week;
        else delete s.ev.flags[op.n];
        break;
      case 'fu':
        schedule(s, ctx.rng, op.id, op.a, op.b);
        break;
      case 'fx': {
        const h = handlers[op.n];
        if (!h) throw new Error(`fx:${op.n}`);
        const r = h(s, ctx, op.arg);
        if (r) for (const c of r) addChip(chips, c.k, c.d, c.u);
        break;
      }
    }
  }
  enforceCap(s.ab);
  return chips;
}

export function schedule(s: GameState, rng: Rng, id: string, a: number, b: number): void {
  const at = s.week + rng.int(a, b);
  s.ev.sched.push({ id, at, exp: at + 12 });
}

export function previewChips(src: string | undefined, s: GameState): Chip[] {
  const out: Chip[] = [];
  for (const op of parseFx(src)) {
    if (op.kind !== 'var') continue;
    if (SILENT_PREFIX.some((p) => op.t.startsWith(p))) continue;
    if (op.t === 'goal' || op.t === 'assist' || op.t === 'rating') continue;
    const signed = op.sign === '-' ? -op.v : op.v;
    if (op.sign === '=') continue;
    let mag: number;
    const a = Math.abs(signed);
    if (op.t.startsWith('attr.')) mag = a >= 1.5 ? 2 : 1;
    else if (op.t.startsWith('rel.')) mag = a >= 15 ? 2 : 1;
    else if (op.t === 'cash' || op.t === 'cashw' || op.t === 'cashy' || op.t === 'debt' || op.t === 'income') mag = a >= 400 || op.t === 'cashy' ? 2 : 1;
    else mag = a >= 12 ? 2 : 1;
    const k = labelOf(op.t, s);
    const ex = out.find((c) => c.k === k);
    if (ex) ex.d += Math.sign(signed) * mag;
    else out.push({ k, d: Math.sign(signed) * mag });
  }
  return out;
}

export interface CheckTerm { t: string; w: number }
export interface Check { base: number; terms: CheckTerm[] }
const checkCache = new Map<string, Check>();

export function parseCheck(src: string): Check {
  const hit = checkCache.get(src);
  if (hit) return hit;
  const parts = src.trim().split(/\s+/);
  const base = Number(parts[0]);
  if (Number.isNaN(base)) throw new Error(`bad check ${src}`);
  const terms: CheckTerm[] = parts.slice(1).map((p) => {
    const i = p.lastIndexOf('*');
    if (i < 0) throw new Error(`bad check term ${p}`);
    const t = p.slice(0, i);
    if (!checkValueValid(t)) throw new Error(`bad check target ${t}`);
    return { t, w: Number(p.slice(i + 1)) };
  });
  const c = { base, terms };
  checkCache.set(src, c);
  return c;
}

function checkValueValid(t: string): boolean {
  if (t.startsWith('attr.')) return (ALL_ATTRS as string[]).includes(t.slice(5));
  if (t.startsWith('hid.')) return (HIDDEN_KEYS as readonly string[]).includes(t.slice(4));
  if (t.startsWith('rel.')) return true;
  const special = ['ovr', 'morale', 'happy', 'stress', 'fatigue', 'health', 'sharp', 'sleep', 'diet', 'drink', 'fameD', 'fameA', 'form', 'coachFame', 'standing', 'tactics', 'development', 'leadership', 'management', 'media', 'data', 'agent', 'postSkill', 'postRep', 'lvl', 'cashy'];
  return special.includes(t) || validVar(t);
}

export function checkValue(s: GameState, t: string, ovr: number): number {
  if (t.startsWith('attr.')) return s.ab.a[t.slice(5) as AttrKey] - 10;
  if (t.startsWith('hid.')) return s.hid[t.slice(4) as HiddenKey] - 50;
  if (t.startsWith('rel.')) return s.people[t.slice(4)]?.rel ?? 0;
  switch (t) {
    case 'ovr': return ovr - 60;
    case 'morale': return s.st.morale - 50;
    case 'happy': return s.st.happy - 50;
    case 'stress': return s.st.stress - 50;
    case 'fatigue': return s.st.fatigue - 50;
    case 'health': return s.st.health - 50;
    case 'sharp': return s.st.sharp - 50;
    case 'sleep': return s.st.sleep - 50;
    case 'diet': return s.st.diet - 50;
    case 'drink': return s.st.drink - 20;
    case 'fameD': return s.fame.dom - 30;
    case 'fameA': return s.fame.abroad - 20;
    case 'form': return s.st.form.length ? s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length * 10 - 65 : 0;
    case 'coachFame': return s.coach.fame - 30;
    case 'standing': return s.coach.standing - 50;
    case 'tactics': return s.coach.skills.tactics - 50;
    case 'development': return s.coach.skills.development - 50;
    case 'leadership': return s.coach.skills.leadership - 50;
    case 'management': return s.coach.skills.management - 50;
    case 'media': return s.coach.skills.media - 50;
    case 'data': return s.coach.skills.data - 50;
    case 'agent': return s.fin.agentSkill - 40;
    case 'postSkill': return s.post.skill - 40;
    case 'postRep': return s.post.rep - 40;
    case 'lvl': return 0;
    case 'cashy': return 0;
    default: return getVar(s, t);
  }
}

export function checkPct(s: GameState, src: string, ovr: number): number {
  const c = parseCheck(src);
  let p = c.base;
  for (const term of c.terms) p += term.w * checkValue(s, term.t, ovr);
  return clamp(Math.round(p), 5, 95);
}

export function pctChip(p: number): Chip {
  const lo = Math.max(5, p - 5);
  const hi = Math.min(95, p + 5);
  return { k: `성공 약 ${lo}~${hi}%`, d: 0 };
}

type Getter = (s: GameState) => number;
export interface CondEnv {
  clubLvl: (s: GameState) => number;
  ovr: (s: GameState) => number;
  abroad: (s: GameState) => boolean;
  hasWindow: (s: GameState) => boolean;
  preseason: (s: GameState) => boolean;
  offseason: (s: GameState) => boolean;
  seasonEnd: (s: GameState) => boolean;
  winterBreak: (s: GameState) => boolean;
  springAutumn: (s: GameState) => boolean;
  upperClub: (s: GameState) => boolean;
  upperAbroad: (s: GameState) => boolean;
}
let condEnv: CondEnv | null = null;
export function setCondEnv(e: CondEnv): void {
  condEnv = e;
}

const getters: Record<string, Getter> = {
  age: (s) => ageAt(s.p.birth, s.week),
  season: (s) => seasonOf(s.week),
  sw: (s) => swOf(s.week),
  ovr: (s) => condEnv!.ovr(s),
  pot: (s) => s.ab.pot,
  lvl: (s) => condEnv!.clubLvl(s),
  lvlmax: (s) => s.career.maxLvl,
  cash: (s) => s.fin.cash,
  net: (s) => s.fin.cash + s.fin.deposit + s.fin.stocks + s.fin.realEstate + s.fin.business - s.fin.debt,
  debt: (s) => s.fin.debt,
  wage: (s) => (s.career.contract ? s.career.contract.wage : 0),
  fameD: (s) => s.fame.dom,
  fameA: (s) => s.fame.abroad,
  value: (s) => s.fame.value,
  morale: (s) => s.st.morale,
  happy: (s) => s.st.happy,
  stress: (s) => s.st.stress,
  fatigue: (s) => s.st.fatigue,
  health: (s) => s.st.health,
  sharp: (s) => s.st.sharp,
  burnout: (s) => s.st.burnout,
  drink: (s) => s.st.drink,
  sleep: (s) => s.st.sleep,
  diet: (s) => s.st.diet,
  smoker: (s) => (s.st.smoker ? 1 : 0),
  form: (s) => (s.st.form.length ? s.st.form.reduce((a, b) => a + b, 0) / s.st.form.length : 0),
  injured: (s) => (s.st.injury ? 1 : 0),
  injweeks: (s) => (s.st.injury ? s.st.injury.weeksLeft : 0),
  debuted: (s) => (s.career.debuted ? 1 : 0),
  married: (s) => (s.life.romance === 'married' ? 1 : 0),
  dating: (s) => (s.life.romance === 'dating' ? 1 : 0),
  single: (s) => (s.life.romance === 'single' || s.life.romance === 'divorced' ? 1 : 0),
  divorced: (s) => (s.life.divorced ? 1 : 0),
  children: (s) => s.life.children,
  hasAgent: (s) => (s.people.agent && !s.people.agent.gone ? 1 : 0),
  agentSkill: (s) => s.fin.agentSkill,
  abroad: (s) => (condEnv!.abroad(s) ? 1 : 0),
  window: (s) => (condEnv!.hasWindow(s) ? 1 : 0),
  preseason: (s) => (condEnv!.preseason(s) ? 1 : 0),
  offseason: (s) => (condEnv!.offseason(s) ? 1 : 0),
  seasonEnd: (s) => (condEnv!.seasonEnd(s) ? 1 : 0),
  winterBreak: (s) => (condEnv!.winterBreak(s) ? 1 : 0),
  springAutumn: (s) => (condEnv!.springAutumn(s) ? 1 : 0),
  upperClub: (s) => (condEnv!.upperClub(s) ? 1 : 0),
  upperAbroad: (s) => (condEnv!.upperAbroad(s) ? 1 : 0),
  dorm: (s) => (s.p.dorm && s.fin.housing === 'dorm' ? 1 : 0),
  retired: (s) => (s.career.retired ? 1 : 0),
  caps: (s) => s.nat.caps,
  natGap: (s) => condEnv!.ovr(s) - (getCountry(s.p.country).natBase - 4),
  sinceCall: (s) => s.week - s.nat.lastCallW,
  wcFever: (s) => {
    const d = dateOf(s.week);
    return (d.y - 2026) % 4 === 0 && ((d.m === 5 && d.d >= 15) || d.m === 6 || (d.m === 7 && d.d <= 19)) ? 1 : 0;
  },
  birthWeek: (s) => {
    const d = dateOf(s.week);
    const t0 = Date.UTC(d.y, d.m - 1, d.d);
    const b = s.p.birth;
    return [d.y, d.y + 1].some((y) => {
      const x = Date.UTC(y, b.m - 1, b.d);
      return x >= t0 && x < t0 + 7 * 86400000;
    }) ? 1 : 0;
  },
  faceInLeague: (s) => {
    const lg = s.career.cur.leagueId;
    return lg && s.career.clubId && s.wld.faces.some((f) => f.status === 'pro' && f.clubId !== s.career.clubId && getClub(f.clubId).lg0 === lg) ? 1 : 0;
  },
  faceWedding: (s) => (s.wld.faces.some((f) => f.status !== 'youth' && f.status !== 'quit' && f.wedS >= 0 && f.wedS >= seasonOf(s.week) - 1) ? 1 : 0),
  faceCoach: (s) => (s.wld.faces.some((f) => f.status === 'retired' && f.coachS >= 0 && f.coachS <= seasonOf(s.week)) ? 1 : 0),
  rivalInjured: (s) => (s.wld.faces.some((f) => f.role === 'rival' && f.status === 'pro' && f.injuredS >= seasonOf(s.week) - 1) ? 1 : 0),
  rivalSameTeam: (s) => (s.career.clubId && s.wld.faces.some((f) => f.role === 'rival' && f.status === 'pro' && f.clubId === s.career.clubId) ? 1 : 0),
  youthCoachRetire: (s) => (s.wld.youthCoach.name && seasonOf(s.week) >= s.wld.youthCoach.retireS ? 1 : 0),
  business: (s) => s.fin.business,
  msN: (s) => s.post.ms[s.post.path] ?? 0,
  pathYears: (s) => (s.week - s.post.enteredW) / 52,
  pathWeeks: (s) => s.week - s.post.enteredW,
  sinceMs: (s) => s.week - (s.post.msWeek[s.post.path] ?? -999),
  partnered: (s) => (s.life.romance === 'dating' || s.life.romance === 'married' ? 1 : 0),
  contractLeft: (s) => (s.career.contract ? Math.max(0, s.career.contract.endW - s.week) : 0),
  hasClub: (s) => (s.career.clubId ? 1 : 0),
  hasReq: (s) => (s.career.transferReq >= 0 ? 1 : 0),
  hasPre: (s) => (s.career.pre ? 1 : 0),
  coachFame: (s) => s.coach.fame,
  standing: (s) => s.coach.standing,
  license: (s) => (s.coach.licenses.P ? 4 : s.coach.licenses.A ? 3 : s.coach.licenses.B ? 2 : s.coach.licenses.C ? 1 : 0),
  coachSeasons: (s) => s.coach.coachSeasons,
  fired: (s) => s.coach.fired,
  postRep: (s) => s.post.rep,
  postSkill: (s) => s.post.skill,
  edu: (s) => s.life.eduLevel,
  followers: (s) => s.fin.followers,
  sponsor: (s) => s.fin.sponsorYear,
  trainer: (s) => s.fin.trainer,
  housingOwn: (s) => (s.fin.housing === 'own' ? 1 : 0),
  car: (s) => s.fin.car,
  income: (s) => s.fin.yearIncome,
  stockIdx: (s) => s.fin.stockIndex,
  tier: (s) => s.p.incomeTier,
  supportive: (s) => s.p.supportive,
  mil: (s) => (s.life.mil === 'pending' ? 1 : 0),
  squadStrength: (s) => s.coach.squad.length,
  roleRank: (s) => ({ starter: 3, rotation: 2, prospect: 1, backup: 0 })[s.career.contract?.role ?? 'backup'],
  youth: (s) => (s.phase === 'youth' ? 1 : 0),
  stageIdx: (s) => ['U15', 'U17', 'U19', 'RES'].indexOf(s.career.youthStage),
  youthCall: (s) => (shownRawOf(s) >= youthCallMin(getCountry(s.p.country).natBase) ? 1 : 0),
  signed: (s) => (s.career.signed ? 1 : 0),
  school: (s) => (s.career.track === 'school' ? 1 : 0),
  schoolUni: (s) => (s.career.youthStage === 'UNI' ? 1 : 0),
  ftTrain: (s) => (s.career.entry.step >= 1 ? 1 : 0),
  ftSquad: (s) => (s.career.entry.step >= 2 ? 1 : 0),
  jumps: (s) => s.career.entry.jumps,
  ytRank: (s) => (s.yt && s.career.clubId && s.yt.table[s.career.clubId] ? [...s.yt.ids].sort((a, b) => s.yt!.table[b][0] - s.yt!.table[a][0]).indexOf(s.career.clubId) + 1 : 99),
  ytFrac: (s) => (s.yt ? s.yt.round / Math.max(1, s.yt.games) : 0),
  ytShare: (s) => (s.yt && s.career.yCur.avail >= 6 ? s.career.yCur.apps / s.career.yCur.avail : 1),
  bteam: (s) => (s.yt && s.yt.adult ? 1 : 0),
  licenseAge: (s) => (s.phase === 'youth' || s.phase === 'pro' ? ageAt(s.p.birth, s.week) : 99),
  studying: (s) => (s.coach.studying ? 1 : 0)
};

export function getVar(s: GameState, name: string): number {
  if (name.startsWith('attr.')) return s.ab.a[name.slice(5) as AttrKey];
  if (name.startsWith('hid.')) return s.hid[name.slice(4) as HiddenKey];
  if (name.startsWith('rel.')) return s.people[name.slice(4)]?.rel ?? 0;
  if (name.startsWith('lang.')) return s.life.lang[name.slice(5)] ?? 0;
  if (name.startsWith('skill.')) return (s.coach.skills as unknown as Record<string, number>)[name.slice(6)] ?? 0;
  const g = getters[name];
  if (!g) throw new Error(`cond var ${name}`);
  return g(s);
}

export function validVar(name: string): boolean {
  if (name.startsWith('attr.') || name.startsWith('hid.') || name.startsWith('rel.') || name.startsWith('lang.') || name.startsWith('skill.')) return true;
  return name in getters;
}

export type Cond = (s: GameState) => boolean;
const condCache = new Map<string, Cond>();

export function parseCond(src: string): Cond {
  const hit = condCache.get(src);
  if (hit) return hit;
  let str = src.trim();
  let neg = false;
  if (str.startsWith('!')) { neg = true; str = str.slice(1); }
  let base: Cond;
  if (str.startsWith('flag:')) {
    const n = str.slice(5);
    base = (s) => n in s.ev.flags;
  } else if (str.startsWith('country:')) {
    const n = str.slice(8);
    base = (s) => s.p.country === n;
  } else if (str.startsWith('clubCountry:')) {
    const n = str.slice(12);
    base = (s) => (s.career.clubId ? s.career.clubId.startsWith(n + ':') : false);
  } else if (str.startsWith('role:')) {
    const n = str.slice(5).split('|');
    base = (s) => n.includes(s.career.contract?.role ?? '');
  } else if (str.startsWith('coachRole:')) {
    const n = str.slice(10).split('|');
    base = (s) => n.includes(s.coach.role);
  } else if (str.startsWith('path:')) {
    const n = str.slice(5);
    base = (s) => s.post.path === n;
  } else if (str.startsWith('pos:')) {
    const n = str.slice(4).split('|');
    base = (s) => n.includes(s.ab.pos);
  } else if (str.startsWith('growth:')) {
    const n = str.slice(7);
    base = (s) => s.p.growth === n;
  } else if (str.startsWith('trait:')) {
    const n = str.slice(6);
    base = (s) => s.ab.traits.includes(n);
  } else if (str.startsWith('mil:')) {
    const n = str.slice(4);
    base = (s) => s.life.mil === n;
  } else {
    const m = /^([A-Za-z_][\w.]*)(>=|<=|==|!=|>|<)(-?\d+(?:\.\d+)?)$/.exec(str);
    if (m) {
      if (!validVar(m[1])) throw new Error(`cond var ${m[1]} in ${src}`);
      const v = Number(m[3]);
      const name = m[1];
      switch (m[2]) {
        case '>=': base = (s) => getVar(s, name) >= v; break;
        case '<=': base = (s) => getVar(s, name) <= v; break;
        case '>': base = (s) => getVar(s, name) > v; break;
        case '<': base = (s) => getVar(s, name) < v; break;
        case '==': base = (s) => getVar(s, name) === v; break;
        default: base = (s) => getVar(s, name) !== v; break;
      }
    } else {
      if (!validVar(str)) throw new Error(`cond var ${str} in ${src}`);
      const name = str;
      base = (s) => getVar(s, name) > 0;
    }
  }
  const c: Cond = neg ? (s) => !base(s) : base;
  condCache.set(src, c);
  return c;
}

export function evalConds(s: GameState, conds: string[]): boolean {
  for (const c of conds) if (!parseCond(c)(s)) return false;
  return true;
}
