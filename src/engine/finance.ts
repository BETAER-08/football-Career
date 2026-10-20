import { getCountry } from './data';
import { LEVEL_VALUE_MULT } from '../data/countries';
import { Rng, clamp } from './rng';
import { clubLvl, clubStd } from './world';
import { curOvr } from './attributes';
import { ageAt } from './time';
import type { GameState } from './types';

export function priceF(code: string): number {
  return 0.55 + getCountry(code).econ * 0.75;
}

export const LIVING_COST: Record<number, number> = { 1: 500, 2: 1400, 3: 3200, 4: 8000 };

export function netWorth(s: GameState): number {
  return Math.round(s.fin.cash + s.fin.deposit + s.fin.stocks + s.fin.realEstate + s.fin.business - s.fin.debt);
}

export function currentWage(s: GameState): number {
  if (s.phase === 'coach' && s.coach.contract) return s.coach.contract.wage;
  if (s.career.contract && !s.career.contract.youth) return s.career.contract.wage;
  if (s.career.contract && s.career.contract.youth) return s.career.contract.wage;
  return 0;
}

export function marketValue(s: GameState): number {
  const ovr = curOvr(s.ab);
  const age = ageAt(s.p.birth, s.week);
  let lvl = 2;
  let std = 47;
  if (s.career.clubId) {
    lvl = clubLvl(s, s.career.clubId);
    std = clubStd(s, s.career.clubId);
  }
  const base = 50000 * LEVEL_VALUE_MULT[lvl];
  const spread = Math.exp(clamp((ovr - std) / 9, -3, 2.4));
  let ageF = 1;
  if (age <= 21) ageF = 1 + clamp((s.ab.pot - ovr) / 40, 0, 0.8);
  else if (age >= 28) ageF = Math.max(0.15, 1 - 0.11 * (age - 27));
  const fameF = 1 + s.fame.dom / 250 + s.fame.abroad / 150;
  const pf = priceF(s.p.country);
  const v = base * spread * ageF * fameF * (0.8 + pf * 0.3) * (age < 15 ? 0.05 : age < 17 ? 0.25 : 1);
  return Math.max(10, Math.round(v));
}

export function weeklyFinance(s: GameState, rng: Rng): void {
  const f = s.fin;
  const pf = priceF(s.p.country);
  const country = getCountry(s.p.country);
  const wage = s.phase === 'postcareer' ? 0 : currentWage(s);
  let gross = wage / 52;
  if (s.phase === 'postcareer') gross += s.post.income / 52;
  gross += f.sponsorYear / 52;
  const agentCut = s.people.agent && !s.people.agent.gone ? gross * (f.agentFee / 100) : 0;
  const tax = Math.max(0, gross - agentCut) * country.tax;
  const net = gross - agentCut - tax;
  f.yearIncomeAcc += gross;
  let cost = (LIVING_COST[f.livingTier] * pf) / 52;
  if (f.housing === 'rent') cost += (1200 * pf) / 52;
  if (f.housing === 'dorm') cost *= 0.4;
  const age = ageAt(s.p.birth, s.week);
  if (age < 18) cost = 0;
  cost = Math.min(cost, Math.max(f.cash > 100 ? (150 * pf) / 52 : 0, net * 0.7));
  cost += f.familySupport / 52;
  cost += f.trainer > 0 ? (900 * pf) / 52 : 0;
  cost += f.nutritionist > 0 ? (500 * pf) / 52 : 0;
  cost += f.psychCoach > 0 ? (500 * pf) / 52 : 0;
  cost += f.car * (300 * pf) / 52;
  const interest = (f.debt * 0.04) / 52;
  f.cash += net - cost - interest;
  f.deposit *= 1 + 0.025 / 52;
  const drift = 0.0012;
  const vol = 0.024;
  const ret = drift + rng.normal(0, vol);
  f.stockIndex = Math.max(20, f.stockIndex * (1 + ret));
  f.stocks = Math.max(0, f.stocks * (1 + ret));
  f.realEstate *= 1 + 0.03 / 52;
  if (f.cash < 0) {
    f.debt += -f.cash;
    f.cash = 0;
  } else if (f.debt > 0 && f.cash > 0) {
    const pay = Math.min(f.debt, f.cash * 0.5);
    f.debt -= pay;
    f.cash -= pay;
  }
  if (f.debt > 0) {
    s.st.stress = clamp(s.st.stress + 0.15, 0, 100);
  }
}

export function yearEndFinance(s: GameState, rng: Rng): void {
  s.fin.yearIncome = Math.round(s.fin.yearIncomeAcc);
  s.fin.yearIncomeAcc = 0;
  if (s.fin.business > 0) {
    const f = Math.exp(rng.normal(0.02, 0.5));
    s.fin.business = Math.round(s.fin.business * clamp(f, 0.05, 4));
  }
}

export function formatKRW(man: number): string {
  const neg = man < 0;
  let v = Math.abs(Math.round(man));
  const parts: string[] = [];
  const jo = Math.floor(v / 100000000);
  v -= jo * 100000000;
  const eok = Math.floor(v / 10000);
  v -= eok * 10000;
  if (jo) parts.push(`${jo}조`);
  if (eok) parts.push(`${eok.toLocaleString('ko-KR')}억`);
  if (v && !jo && eok < 100) parts.push(`${v.toLocaleString('ko-KR')}만`);
  if (!parts.length) parts.push('0원');
  else if (parts[parts.length - 1].endsWith('억') || parts[parts.length - 1].endsWith('조')) parts[parts.length - 1] += '';
  const t = parts.join(' ');
  const out = /[억조]$/.test(t) || /만$/.test(t) ? t + '원' : t;
  return neg ? `-${out}` : out;
}
