import { ActionSchema, type ActionDef, type RawAction } from '../data/schema';
import { Rng } from './rng';
import { applyFx, checkPct, evalConds, parseCond, parseCheck, scaleFx, validateFx, previewChips, pctChip, type FxCtx } from './fx';
import { decideOutcome, render } from './events';
import { chooseVariant } from './narrative';
import { outcomeTexts } from '../data/schema';
import { addLog, isFast } from './log';
import { clearCause, setCause } from './why';
import { dateOf } from './time';
import { curOvr } from './attributes';
import { priceF } from './finance';
import type { Chip, GameState, ResultPanel } from './types';

const registry = new Map<string, ActionDef>();
export type ActionHandler = (s: GameState, ctx: FxCtx, amount: number, grade: string, eff: number) => Chip[] | void;

const DIMINISH_WINDOW = 26;
const DIMINISH_FLOOR = 0.4;

export function recentUses(s: GameState, id: string): number {
  return (s.ev.actUse[id] ?? []).filter((w) => s.week - w < DIMINISH_WINDOW).length;
}

export function effectMul(s: GameState, def: ActionDef): number {
  if (!def.diminish) return 1;
  return Math.max(DIMINISH_FLOOR, 1 - def.diminish * recentUses(s, def.id));
}
const handlers: Record<string, ActionHandler> = {};

export function registerAction(name: string, fn: ActionHandler): void {
  handlers[name] = fn;
}

export function loadActions(raw: RawAction[]): void {
  registry.clear();
  for (const r of raw) {
    const def = ActionSchema.parse(r);
    if (registry.has(def.id)) throw new Error(`duplicate action ${def.id}`);
    for (const c of def.cond) parseCond(c);
    if (def.check) parseCheck(def.check);
    for (const o of [def.ok, def.bad, def.great, def.worst]) if (o) { validateFx(o.fx); validateFx(o.fu); }
    if (def.handler && !(def.handler in handlers)) throw new Error(`action ${def.id}: handler ${def.handler} missing`);
    registry.set(def.id, def);
  }
}

export function allActions(): ActionDef[] {
  return [...registry.values()];
}
export function getAction(id: string): ActionDef {
  const a = registry.get(id);
  if (!a) throw new Error(`action ${id}`);
  return a;
}

export interface ActionStatus {
  def: ActionDef;
  enabled: boolean;
  reason: string;
  cdLeft: number;
  cost: number;
  chips: Chip[];
}

export function actionCost(s: GameState, def: ActionDef, amount: number): number {
  const pf = priceF(s.p.country);
  if (def.param === 'amount') return Math.max(0, Math.round(amount));
  return Math.round(def.cost * pf);
}

export function actionStatus(s: GameState, def: ActionDef): ActionStatus {
  const cdLeft = Math.max(0, (s.ev.actCd[def.id] ?? 0) - s.week);
  let reason = '';
  if (!def.phase.includes(s.phase)) reason = '지금은 할 수 없다';
  else if (cdLeft > 0) reason = `쿨타임 ${cdLeft}주`;
  else if (!evalConds(s, def.cond)) reason = condReason(s, def);
  const cost = actionCost(s, def, 0);
  if (!reason && def.param !== 'amount' && cost > s.fin.cash + s.fin.deposit && cost > 2500) reason = '현금이 부족하다';
  if (!reason && def.param === 'amount' && s.fin.cash < 10) reason = '현금이 부족하다';
  const chips = isFast() ? [] : previewChips(scaleFx(def.ok.fx, effectMul(s, def)), s);
  if (def.check && !isFast()) chips.unshift(pctChip(checkPct(s, def.check, curOvr(s.ab))));
  return { def, enabled: !reason, reason, cdLeft, cost, chips };
}

function condReason(s: GameState, def: ActionDef): string {
  for (const c of def.cond) {
    if (parseCond(c)(s)) continue;
    if (c.startsWith('licenseAge')) return '현역 선수는 28세 이상부터 등록할 수 있다';
    return `조건 미충족: ${c.replace('>=', ' ≥ ').replace('<=', ' ≤ ')}`;
  }
  return '조건 미충족';
}

export function runAction(s: GameState, rng: Rng, id: string, amount: number): ResultPanel | null {
  const def = getAction(id);
  const st = actionStatus(s, def);
  if (!st.enabled) return null;
  const ctx: FxCtx = { rng };
  const cost = actionCost(s, def, amount);
  if (def.param === 'amount' && (amount <= 0 || amount > s.fin.cash)) return null;
  const chips: Chip[] = [];
  if (cost > 0 && def.param !== 'amount') {
    let pay = cost;
    const fromCash = Math.min(s.fin.cash, pay);
    s.fin.cash -= fromCash;
    pay -= fromCash;
    const fromDep = Math.min(s.fin.deposit, pay);
    s.fin.deposit -= fromDep;
    pay -= fromDep;
    if (pay > 0) s.fin.debt += pay;
    chips.push({ k: '비용', d: -cost, u: '만' });
  }
  s.decCtx = { amt: String(Math.round(amount)) };
  const outcome = decideOutcome(s, rng, def);
  const sched0 = s.ev.sched.length;
  setCause(def.label);
  const eff = effectMul(s, def);
  if (def.handler) {
    const r = handlers[def.handler](s, ctx, amount, outcome.grade, eff);
    if (r) for (const c of r) chips.push(c);
  }
  applyFx(s, ctx, scaleFx(outcome.out.fx, eff), chips);
  if (outcome.out.fu) applyFx(s, ctx, scaleFx(outcome.out.fu, eff), chips);
  clearCause();
  if (eff < 1) chips.push({ k: `반복 사용 효과 ${Math.round(eff * 100)}%`, d: 0 });
  if (def.diminish) s.ev.actUse[def.id] = [...(s.ev.actUse[def.id] ?? []).filter((w) => s.week - w < DIMINISH_WINDOW), s.week];
  s.ev.actCd[def.id] = s.week + def.cooldown;
  const outs = outcomeTexts(outcome.out.t);
  const text = render(s, outs[chooseVariant(s, `act:${def.id}:${outcome.grade}`, outs.length)]);
  const later = /fu:/.test(outcome.out.fx ?? '') || /fu:/.test(outcome.out.fu ?? '');
  const panel: ResultPanel = { title: def.label, grade: outcome.grade, roll: outcome.roll, need: outcome.need, text, changes: chips, later, w: s.week };
  const lid = addLog(s, 'system', def.label, text, chips, { mine: true, grade: outcome.grade, pick: def.label, result: text, roll: outcome.roll, need: outcome.need });
  if (lid) for (let i = sched0; i < s.ev.sched.length; i++) s.ev.sched[i].src = { w: s.week, q: `${dateOf(s.week).y}년 ${dateOf(s.week).m}월 · 선택: ${def.label}`, log: lid, ref: def.id };
  return panel;
}
