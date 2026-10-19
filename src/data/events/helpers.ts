import type { RawChoice, RawEvent } from '../schema';

type Phase = 'youth' | 'pro' | 'coach' | 'postcareer';
export type O = [string, string?, string?];

export interface EvOpt {
  cond?: string[];
  cd?: number;
  max?: number;
  group?: string;
  note?: string;
  heavy?: boolean;
  help?: string;
  fu?: string;
  chain?: string;
  sched?: boolean;
  kind?: 'chain-step';
}

const o = (a: O) => ({ t: a[0], fx: a[1], fu: a[2] });

export function pa(id: string, ph: Phase[], w: number, texts: [string, string], fx: string, opt: EvOpt = {}): RawEvent {
  return {
    id, kind: opt.kind ?? 'passive', phase: ph, weight: w, cond: opt.cond ?? [], cooldown: opt.cd ?? 26, max: opt.max ?? 4, group: opt.group,
    note: opt.note, text: texts, fx: fx || undefined, fu: opt.fu, heavy: opt.heavy, help: opt.help, chain: opt.chain, scheduledOnly: opt.sched
  };
}

export interface CcOpt { chk?: string; great?: O; bad?: O; worst?: O; pv?: string }

export function cc(label: string, ok: O, opt: CcOpt = {}): RawChoice {
  return {
    label, pv: opt.pv, check: opt.chk, ok: o(ok), great: opt.great ? o(opt.great) : undefined, bad: opt.bad ? o(opt.bad) : undefined, worst: opt.worst ? o(opt.worst) : undefined
  };
}

export function ch(id: string, ph: Phase[], w: number, texts: [string, string], choices: RawChoice[], opt: EvOpt = {}): RawEvent {
  return {
    id, kind: opt.kind ?? 'choice', phase: ph, weight: w, cond: opt.cond ?? [], cooldown: opt.cd ?? 40, max: opt.max ?? 2, group: opt.group, note: opt.note,
    text: texts, choices, heavy: opt.heavy, help: opt.help, chain: opt.chain, scheduledOnly: opt.sched, fu: opt.fu
  };
}

export function mo(id: string, trigger: string, ph: Phase[], texts: [string, string], choices: RawChoice[], opt: EvOpt = {}): RawEvent {
  return {
    id, kind: 'moment', phase: ph, weight: 1, cond: opt.cond ?? [], cooldown: opt.cd ?? 0, max: opt.max ?? 99, group: opt.group, note: opt.note,
    text: texts, choices, trigger
  };
}

export const HELP_GRIEF = '큰 상실감과 슬픔은 자연스러운 감정입니다. 혼자 견디지 말고 가족, 가까운 친구, 가까운 정신건강 상담 기관에 도움을 요청할 수 있습니다.';
export const HELP_ADDICT = '도박·음주 문제는 의지만으로 해결하기 어려울 수 있습니다. 가까운 중독 상담·치료 기관이나 전문의의 도움을 받을 수 있습니다.';
export const HELP_VIOLENCE = '폭력이나 위협은 결코 당신의 잘못이 아닙니다. 안전을 최우선으로 하고 구단·협회의 상담 창구와 가까운 지원 기관에 도움을 요청하세요.';
