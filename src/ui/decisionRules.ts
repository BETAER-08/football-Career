import type { Decision, DecisionChoice } from '../engine/types';

const IRREVERSIBLE = /(은퇴|계약 ?해지|그만둔다|떠난다)/;
const DANGEROUS_REF = /^(mf_|match_fix)/;
const DANGEROUS_LABEL = /(받아들인다|계속 협조한다)/;

export function isIrreversible(d: Decision, c: DecisionChoice): boolean {
  if (d.kind === 'retire' && IRREVERSIBLE.test(c.label)) return true;
  if (IRREVERSIBLE.test(c.label) && /(은퇴한다|은퇴 선언|지도자 은퇴|축구계를 떠난다)/.test(c.label)) return true;
  if (DANGEROUS_REF.test(d.ref) && DANGEROUS_LABEL.test(c.label)) return true;
  return false;
}

export function pctRange(p: number): [number, number] {
  return [Math.max(1, Math.round(p - 4)), Math.min(99, Math.round(p + 4))];
}
