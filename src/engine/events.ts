import { EventSchema, type EventDef, type RawEvent, type RawOutcome } from '../data/schema';
import { noteText } from '../data/stats-notes';
import { Rng } from './rng';
import { applyFx, checkPct, evalConds, parseCond, parseCheck, parseFx, previewChips, pctChip, validateFx, REL_LABEL } from './fx';
import { addLog, isFast, toast } from './log';
import { getClub, getCountry, getLeague } from './data';
import { curOvr } from './attributes';
import { formatKRW } from './finance';
import { ageAt, dateOf, seasonOf, swOf } from './time';
import { clearCause, setCause } from './why';
import { budgetTarget, initBudget, tierRoom } from './budget';
import type { Src } from './types';
import type { Chip, Decision, DecisionChoice, GameState, Phase, ResultPanel } from './types';

export interface Loaded { def: EventDef; has: boolean }

const registry = new Map<string, EventDef>();
const byPhase: Record<Phase, EventDef[]> = { youth: [], pro: [], coach: [], postcareer: [] };
const moments: EventDef[] = [];
let loaded = false;

export function loadEvents(raw: RawEvent[]): void {
  registry.clear();
  for (const k of Object.keys(byPhase) as Phase[]) byPhase[k].length = 0;
  moments.length = 0;
  for (const r of raw) {
    const def = EventSchema.parse(r);
    if (def.note) def.note = noteText(def.note);
    if (registry.has(def.id)) throw new Error(`duplicate event ${def.id}`);
    registry.set(def.id, def);
  }
  for (const def of registry.values()) {
    for (const c of def.cond) parseCond(c);
    const outs: RawOutcome[] = [];
    if (def.fx) validateFx(def.fx);
    if (def.fu) validateFx(def.fu);
    if (def.fxBad) validateFx(def.fxBad);
    if (def.choices) for (const ch of def.choices) {
      if (ch.check) parseCheck(ch.check);
      for (const o of [ch.ok, ch.bad, ch.great, ch.worst]) if (o) outs.push(o);
      if ((ch.bad || ch.worst || ch.great) && !ch.check) throw new Error(`${def.id}: outcomes without check`);
    }
    for (const o of outs) {
      validateFx(o.fx);
      validateFx(o.fu);
    }
    if (def.text.length < 2) throw new Error(`${def.id}: need 2 text variants`);
    if (def.scheduledOnly || def.kind === 'moment') {
      if (def.kind === 'moment') moments.push(def);
    }
  }
  for (const def of registry.values()) {
    const fus: string[] = [];
    const scan = (fx?: string) => { for (const op of parseFx(fx)) if (op.kind === 'fu') fus.push(op.id); };
    scan(def.fx);
    scan(def.fu);
    if (def.choices) for (const ch of def.choices) for (const o of [ch.ok, ch.bad, ch.great, ch.worst]) if (o) { scan(o.fx); scan(o.fu); }
    for (const id of fus) if (!registry.has(id)) throw new Error(`${def.id}: follow-up ${id} missing`);
    if (def.kind !== 'moment' && !def.scheduledOnly) for (const ph of def.phase) byPhase[ph].push(def);
  }
  loaded = true;
}

export function eventsLoaded(): boolean {
  return loaded;
}
export function getEvent(id: string): EventDef {
  const e = registry.get(id);
  if (!e) throw new Error(`event ${id}`);
  return e;
}
export function allEventDefs(): EventDef[] {
  return [...registry.values()];
}

import { upperClubPick } from './upper';

export function render(s: GameState, tpl: string): string {
  const club = s.phase === 'coach' && s.coach.clubId ? s.coach.clubId : s.career.clubId;
  const clubName = club ? getClub(club).name : '무적';
  const mates = ['mate1', 'mate2', 'mate3'].filter((k) => s.people[k]);
  const mate = mates.length ? s.people[mates[s.week % mates.length]].name : '동료';
  const sib = Object.keys(s.people).find((k) => k.startsWith('sibling'));
  const child = Object.keys(s.people).find((k) => k.startsWith('child'));
  const con = s.career.contract;
  return tpl.replace(/\{(\w+)\}/g, (_m, k: string) => {
    switch (k) {
      case 'name': return s.p.name;
      case 'club': return clubName;
      case 'league': return club ? getLeague(s.career.cur.leagueId || getClub(club).lg0).ko : '리그';
      case 'coach': return s.people.coach?.name ?? '감독';
      case 'captain': return s.people.captain?.name ?? '주장';
      case 'mate': return mate;
      case 'mate1': return s.people.mate1?.name ?? mate;
      case 'mate2': return s.people.mate2?.name ?? mate;
      case 'mate3': return s.people.mate3?.name ?? mate;
      case 'oldmate': return s.wld.faces.find((f) => f.role === 'mate' && f.status !== 'quit')?.name ?? mate;
      case 'oldrival': return s.wld.faces.find((f) => f.role === 'rival')?.name ?? '옛 라이벌';
      case 'youthcoach': return s.wld.youthCoach.name || '유스 시절 감독';
      case 'rival': return s.people.rival?.name ?? '라이벌';
      case 'agent': return s.people.agent && !s.people.agent.gone ? s.people.agent.name : '에이전트';
      case 'father': return s.people.father?.name ?? '아버지';
      case 'mother': return s.people.mother?.name ?? '어머니';
      case 'sibling': return sib ? s.people[sib].name : '형제';
      case 'partner': return s.people.partner?.name ?? '연인';
      case 'child': return child ? s.people[child].name : '아이';
      case 'reporter': return s.people.media?.name ?? '기자';
      case 'director': return s.people.director?.name ?? '단장';
      case 'owner': return s.people.owner?.name ?? '구단주';
      case 'natcoach': return s.people.natcoach?.name ?? '대표팀 감독';
      case 'city': return s.p.hometown;
      case 'country': return getCountry(s.p.country).ko;
      case 'nat': return getCountry(s.p.country).natTeam;
      case 'age': return String(ageAt(s.p.birth, s.week));
      case 'opp': return s.decCtx.opp ?? '상대 팀';
      case 'upclub': {
        const id = upperClubPick(s, false);
        return id ? getClub(id).name : '상위 구단';
      }
      case 'upabroad': {
        const id = upperClubPick(s, true);
        return id ? getClub(id).name : '해외 구단';
      }
      case 'wk': return formatKRW(con ? con.wage / 52 : 100);
      case 'yr': return formatKRW(con ? con.wage : 1000);
      case 'amt': return formatKRW(Number(s.decCtx.amt ?? 1000));
      case 'star': return s.coach.squad.length ? s.coach.squad[s.week % s.coach.squad.length].name : mate;
      case 'cash': return formatKRW(s.fin.cash);
      case 'year': return String(2026 + seasonOf(s.week));
      case 'stage': return s.career.youthStage === 'RES' ? '리저브' : s.career.youthStage;
      case 'fcoach': return s.people.fcoach?.name ?? '1군 감독';
      default: return `{${k}}`;
    }
  });
}

function pick(rng: Rng, arr: string[]): string {
  return arr[rng.int(0, arr.length - 1)];
}

function chipsFor(s: GameState, ch: EventDef['choices'] extends (infer C)[] | undefined ? C : never): Chip[] {
  const c = ch as { pv?: string; check?: string; ok: RawOutcome; great?: RawOutcome };
  let chips: Chip[];
  if (c.pv) chips = c.pv.split(' ').map((t) => ({ k: t.replace(/[↑↓]+$/, ''), d: (t.match(/↑/g)?.length ?? 0) - (t.match(/↓/g)?.length ?? 0) }));
  else chips = previewChips(c.ok.fx, s);
  if (c.check) chips = [pctChip(checkPct(s, c.check, curOvr(s.ab))), ...chips];
  return chips;
}

function quoteOf(s: GameState, label: string): string {
  const d = dateOf(s.week);
  return `${d.y}년 ${d.m}월 · 선택: ${label}`;
}

function takeSrc(s: GameState, id: string): Src | undefined {
  const src = s.ev.pendSrc[id];
  if (src) delete s.ev.pendSrc[id];
  return src;
}

export function buildDecision(s: GameState, rng: Rng, def: EventDef): Decision {
  const prev = s.ev.last[def.id];
  const base = render(s, pick(rng, def.text));
  const text = def.again && prev ? `${render(s, def.again.replace(/\{prev\}/g, prev.label))} ${base}` : base;
  const src = takeSrc(s, def.id);
  const choices: DecisionChoice[] = (def.choices ?? []).map((ch) => ({
    label: render(s, ch.label),
    chips: isFast() ? [] : chipsFor(s, ch),
    pct: ch.check ? checkPct(s, ch.check, curOvr(s.ab)) : null,
    disabled: ''
  }));
  const dec: Decision = {
    uid: s.ev.nextId++, kind: def.kind === 'moment' ? 'moment' : 'event', ref: def.id, title: def.chain ? '이어지는 이야기' : def.kind === 'moment' ? '결정적 순간' : '선택의 순간',
    text, choices, w: s.week, heavy: !!def.heavy, help: def.help ?? '', ctx: '', offers: [], quote: src?.q, from: src?.log
  };
  return dec;
}

export function markFired(s: GameState, def: EventDef): void {
  s.ev.cd[def.id] = s.week + def.cooldown;
  s.ev.count[def.id] = (s.ev.count[def.id] ?? 0) + 1;
  s.ev.recent.push(def.id);
  if (s.ev.recent.length > 30) s.ev.recent.shift();
  if (def.group) {
    s.ev.flags[`grp:${def.group}`] = s.week;
  }
  if (def.exclusiveGroup) s.ev.flags[`xg:${def.exclusiveGroup}`] = seasonOf(s.week);
}

export function eligible(s: GameState, def: EventDef, groupWindow = 6): boolean {
  if ((s.ev.count[def.id] ?? 0) >= def.max) return false;
  const cd = s.ev.cd[def.id];
  if (cd !== undefined && s.week < cd) return false;
  if (def.cooldown < 20 && s.ev.recent.includes(def.id)) return false;
  if (def.group) {
    const g = s.ev.flags[`grp:${def.group}`];
    if (g !== undefined && s.week - g < groupWindow) return false;
  }
  if (def.exclusiveGroup && s.ev.flags[`xg:${def.exclusiveGroup}`] === seasonOf(s.week)) return false;
  return evalConds(s, def.cond);
}

export function pushDecision(s: GameState, d: Decision): void {
  if (s.decision) s.decQueue.push(d);
  else s.decision = d;
}

export function firePassive(s: GameState, rng: Rng, def: EventDef): void {
  markFired(s, def);
  s.decCtx = {};
  const src = takeSrc(s, def.id);
  const bad = !!src && !!def.textBad && ['bad', 'worst'].includes(s.ev.last[src.ref]?.grade ?? '');
  const pool = bad ? (def.textBad as string[]) : def.text;
  const text = render(s, pick(rng, pool));
  setCause(text.slice(0, 14));
  const chips = applyFx(s, { rng }, bad && def.fxBad !== undefined ? def.fxBad : def.fx);
  if (def.fu) applyFx(s, { rng }, def.fu);
  clearCause();
  if (!isFast()) {
    addLog(s, def.chain ? 'chain' : 'passive', '', text, chips, { note: def.note, heavy: def.heavy, help: def.help, from: src?.log, quote: src?.q });
    toast(s, text, chips);
  }
}

export function fireEvent(s: GameState, rng: Rng, def: EventDef): void {
  if (def.choices && def.choices.length) {
    markFired(s, def);
    s.decCtx = {};
    pushDecision(s, buildDecision(s, rng, def));
  } else firePassive(s, rng, def);
}

export interface Resolved { panel: ResultPanel; chips: Chip[] }

export function resolveEventChoice(s: GameState, rng: Rng, d: Decision, idx: number): ResultPanel {
  const def = getEvent(d.ref);
  const ch = (def.choices ?? [])[idx];
  const outcome = decideOutcome(s, rng, ch);
  const chips: Chip[] = [];
  s.decCtx.eventId = def.id;
  const label = render(s, ch.label);
  const sched0 = s.ev.sched.length;
  setCause(label);
  applyFx(s, { rng }, outcome.out.fx, chips);
  if (outcome.out.fu) applyFx(s, { rng }, outcome.out.fu, chips);
  clearCause();
  const later = parseFx(outcome.out.fx).some((o) => o.kind === 'fu') || parseFx(outcome.out.fu).some((o) => o.kind === 'fu');
  const text = render(s, outcome.out.t);
  const panel: ResultPanel = { title: label, grade: outcome.grade, roll: outcome.roll, need: outcome.need, text, changes: chips, later, w: s.week };
  s.ev.last[def.id] = { w: s.week, label, grade: outcome.grade };
  const gl = { great: '대성공', ok: '성공', bad: '실패', worst: '대실패', none: '' }[outcome.grade];
  if (!isFast()) {
    const id = addLog(s, def.kind === 'moment' ? 'moment' : def.chain ? 'chain' : 'choice', label, `${d.text}\n→ ${text}${gl ? `\n판정 ${gl} · 굴린 값 ${outcome.roll} / 필요 ${outcome.need}` : ''}${later ? '\n↻ 이 선택은 나중에 다시 돌아올 수 있어요.' : ''}`, chips, {
      heavy: def.heavy, help: def.help, note: def.note, mine: true, grade: outcome.grade, pick: label, result: text, roll: outcome.roll, need: outcome.need, from: d.from, quote: d.quote
    });
    for (let i = sched0; i < s.ev.sched.length; i++) s.ev.sched[i].src = { w: s.week, q: quoteOf(s, label), log: id, ref: def.id };
  }
  return panel;
}

export function decideOutcome(s: GameState, rng: Rng, ch: { check?: string; great?: RawOutcome; ok: RawOutcome; bad?: RawOutcome; worst?: RawOutcome }): { out: RawOutcome; grade: ResultPanel['grade']; roll: number; need: number } {
  if (!ch.check) return { out: ch.ok, grade: 'none', roll: 0, need: 100 };
  const p = checkPct(s, ch.check, curOvr(s.ab));
  const roll = Math.round(rng.next() * 1000) / 10;
  if (roll < p) {
    if (ch.great && roll < p * 0.28) return { out: ch.great, grade: 'great', roll, need: p };
    return { out: ch.ok, grade: 'ok', roll, need: p };
  }
  if (ch.worst && roll > 100 - (100 - p) * 0.28) return { out: ch.worst, grade: 'worst', roll, need: p };
  return { out: ch.bad ?? ch.ok, grade: ch.bad ? 'bad' : 'ok', roll, need: p };
}

export function dueScheduled(s: GameState): EventDef[] {
  const out: EventDef[] = [];
  const keep: typeof s.ev.sched = [];
  for (const it of s.ev.sched) {
    if (it.at > s.week) { keep.push(it); continue; }
    const def = registry.get(it.id);
    if (!def) continue;
    if ((s.ev.count[it.id] ?? 0) >= def.max) continue;
    if (evalConds(s, def.cond) && !(s.ev.cd[it.id] !== undefined && s.week < s.ev.cd[it.id])) {
      if (it.src) s.ev.pendSrc[def.id] = it.src;
      out.push(def);
      continue;
    }
    if (s.week < it.exp) keep.push({ ...it, at: s.week + 2 });
  }
  s.ev.sched = keep;
  return out;
}

export const MIN_GAP = { v: 1 };
export const CHOICE_GAP = 8;

export function rollWeekly(s: GameState, rng: Rng): void {
  const phase = s.phase;
  for (const def of dueScheduled(s)) {
    if (s.decision && def.choices) { s.decQueue.push(buildDecision(s, rng, def)); markFired(s, def); continue; }
    fireEvent(s, rng, def);
  }
  const pool = byPhase[phase];
  if (!pool.length) return;
  const season = seasonOf(s.week);
  const b = s.ev.bud;
  if (b.s !== season) initBudget(s, rng);
  if (s.week - s.ev.lastRollW <= MIN_GAP.v) return;
  const left = Math.max(1, 51 - swOf(s.week));
  const cTarget = budgetTarget(s);
  if (!s.decision && s.week - b.lastChoiceW >= CHOICE_GAP && b.choiceN < cTarget) {
    const pc = Math.min(0.7, ((cTarget - b.choiceN) / left) * 1.25);
    if (rng.next() < pc && pickAndFire(s, rng, pool, true)) {
      s.ev.lastRollW = s.week;
      b.lastChoiceW = s.week;
      return;
    }
  }
  if (b.passN < b.passT) {
    const pp = Math.min(0.8, ((b.passT - b.passN) / left) * 1.2);
    if (rng.next() < pp && pickAndFire(s, rng, pool, false)) s.ev.lastRollW = s.week;
  }
}

function fatigue(s: GameState, def: EventDef): number {
  const rec = s.ev.recent;
  let f = 1;
  const at = rec.lastIndexOf(def.id);
  if (at >= 0) f *= rec.length - at <= 12 ? 0.25 : 0.6;
  const g = def.exclusiveGroup ?? def.group;
  if (g) {
    for (let i = Math.max(0, rec.length - 6); i < rec.length; i++) {
      const o = registry.get(rec[i]);
      if (o && (o.exclusiveGroup ?? o.group) === g) { f *= 0.4; break; }
    }
  }
  return f;
}

function pickAndFire(s: GameState, rng: Rng, pool: EventDef[], interactive: boolean): boolean {
  const cands: EventDef[] = [];
  const w: number[] = [];
  for (const def of pool) {
    const isInt = !!(def.choices && def.choices.length);
    if (isInt !== interactive) continue;
    if (isInt && !tierRoom(s, def.tier)) continue;
    if (!eligible(s, def)) continue;
    cands.push(def);
    w.push(def.weight * fatigue(s, def));
  }
  if (!cands.length) return false;
  const def = cands[rng.weightedIndex(w)];
  const b = s.ev.bud;
  if (interactive) {
    b.choiceN += 1;
    if (def.tier === 'major') b.majorN += 1;
    else b.minorN += 1;
  } else b.passN += 1;
  fireEvent(s, rng, def);
  return true;
}

export function momentFor(s: GameState, trigger: string): EventDef | null {
  const cands = moments.filter((m) => m.trigger === trigger && m.phase.includes(s.phase) && eligibleMoment(s, m));
  return cands.length ? cands[(s.week + (s.ev.nextId | 0)) % cands.length] : null;
}

function eligibleMoment(s: GameState, def: EventDef): boolean {
  if ((s.ev.count[def.id] ?? 0) >= def.max) return false;
  const cd = s.ev.cd[def.id];
  if (cd !== undefined && s.week < cd) return false;
  return evalConds(s, def.cond);
}

export function applyMomentContext(s: GameState): { goals: number; assists: number; rating: number } {
  const g = Number(s.decCtx['m.goal'] ?? 0);
  const a = Number(s.decCtx['m.assist'] ?? 0);
  const r = Number(s.decCtx['m.rating'] ?? 0);
  if (g || a || r) {
    const rec = s.decCtx.tier === 'y' ? s.career.yCur : s.career.cur;
    rec.goals += Math.max(0, g);
    rec.assists += Math.max(0, a);
    if (rec.ratingN > 0) rec.ratingSum += r;
    if (s.st.form.length) s.st.form[s.st.form.length - 1] = Math.min(10, Math.max(3, s.st.form[s.st.form.length - 1] + r));
  }
  return { goals: g, assists: a, rating: r };
}

export function relLabelOf(k: string): string {
  return REL_LABEL[k] ?? k;
}
