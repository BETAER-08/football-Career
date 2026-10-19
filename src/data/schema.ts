import { z } from 'zod';

export const CountrySchema = z.object({
  code: z.string().length(2),
  ko: z.string(),
  en: z.string(),
  flag: z.string(),
  top: z.number().int().min(2).max(6),
  infra: z.number().min(0).max(1),
  econ: z.number().min(0).max(1),
  natBase: z.number(),
  pros: z.number(),
  big: z.number(),
  confed: z.enum(['AFC', 'UEFA', 'CAF', 'CONMEBOL', 'CONCACAF']),
  height: z.number(),
  gini: z.number(),
  tax: z.number(),
  lang: z.string(),
  nameOrder: z.enum(['given', 'surname']),
  nameJoin: z.enum(['', ' ']),
  natTeam: z.string(),
  mil: z.boolean()
});
export type Country = z.infer<typeof CountrySchema>;

export const LeagueSchema = z.object({
  id: z.string(),
  ko: z.string(),
  en: z.string(),
  tier: z.number().int().min(1),
  lvl: z.number().int().min(2).max(6),
  top: z.number(),
  bottom: z.number(),
  up: z.number().int().min(0),
  down: z.number().int().min(0),
  elite: z.number().int().min(0).default(0),
  cup: z.string(),
  clubs: z.string().min(3)
});
export type RawLeague = z.input<typeof LeagueSchema>;
export type League = z.infer<typeof LeagueSchema>;

export const CitySchema = z.object({ ko: z.string(), en: z.string(), pop: z.number().positive() });
export type City = z.infer<typeof CitySchema>;

export const NamePoolSchema = z.object({
  given: z.string().min(10),
  surname: z.string().min(10)
});
export type NamePoolRaw = z.infer<typeof NamePoolSchema>;

export const OutcomeSchema = z.object({
  t: z.string(),
  fx: z.string().optional(),
  fu: z.string().optional()
});
export type RawOutcome = z.infer<typeof OutcomeSchema>;

export const ChoiceSchema = z.object({
  label: z.string(),
  pv: z.string().optional(),
  check: z.string().optional(),
  great: OutcomeSchema.optional(),
  ok: OutcomeSchema,
  bad: OutcomeSchema.optional(),
  worst: OutcomeSchema.optional()
});
export type RawChoice = z.infer<typeof ChoiceSchema>;

export const PhaseSchema = z.enum(['youth', 'pro', 'coach', 'postcareer']);

export const EventSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['passive', 'choice', 'chain-step', 'moment']),
    phase: z.array(PhaseSchema).min(1),
    weight: z.number().positive(),
    cond: z.array(z.string()).default([]),
    cooldown: z.number().int().min(0).default(0),
    max: z.number().int().min(1).default(1),
    group: z.string().optional(),
    note: z.string().optional(),
    text: z.array(z.string()).min(2),
    fx: z.string().optional(),
    fu: z.string().optional(),
    choices: z.array(ChoiceSchema).optional(),
    trigger: z.string().optional(),
    chain: z.string().optional(),
    heavy: z.boolean().optional(),
    help: z.string().optional(),
    scheduledOnly: z.boolean().optional()
  })
  .superRefine((e, ctx) => {
    if ((e.kind === 'choice' || e.kind === 'moment') && (!e.choices || e.choices.length < 2)) {
      ctx.addIssue({ code: 'custom', message: `${e.id}: choices required` });
    }
    if (e.kind === 'moment' && !e.trigger) ctx.addIssue({ code: 'custom', message: `${e.id}: trigger required` });
    if (e.kind === 'passive' && e.choices) ctx.addIssue({ code: 'custom', message: `${e.id}: passive has choices` });
  });
export type RawEvent = z.input<typeof EventSchema>;
export type EventDef = z.infer<typeof EventSchema>;

export const ActionSchema = z.object({
  id: z.string(),
  group: z.enum(['money', 'career', 'life']),
  label: z.string(),
  desc: z.string(),
  phase: z.array(PhaseSchema).min(1),
  cond: z.array(z.string()).default([]),
  cooldown: z.number().int().min(0),
  cost: z.number().min(0).default(0),
  costPct: z.number().min(0).max(1).optional(),
  pv: z.string().optional(),
  check: z.string().optional(),
  great: OutcomeSchema.optional(),
  ok: OutcomeSchema,
  bad: OutcomeSchema.optional(),
  worst: OutcomeSchema.optional(),
  handler: z.string().optional(),
  confirm: z.boolean().optional(),
  param: z.enum(['amount']).optional()
});
export type RawAction = z.input<typeof ActionSchema>;
export type ActionDef = z.infer<typeof ActionSchema>;

export const InjurySchema = z.object({
  id: z.string(),
  ko: z.string(),
  part: z.string(),
  weight: z.number(),
  minW: z.number(),
  maxW: z.number(),
  recur: z.number(),
  loss: z.string().optional(),
  severe: z.boolean().optional()
});
export type InjuryDef = z.infer<typeof InjurySchema>;

export const StatNoteSchema = z.object({ id: z.string(), text: z.string(), est: z.boolean() });
export type StatNote = z.infer<typeof StatNoteSchema>;
