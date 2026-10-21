import { getCountry } from './data';
import { Rng, clamp } from './rng';
import { anchored, curOvr } from './attributes';
import { ageAt } from './time';
import type { GameState, Pos } from './types';

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

const VALUE_POINTS: [number, number][] = [
  [45, 500], [50, 3000], [55, 8000], [60, 20000], [65, 60000], [70, 200000], [75, 700000],
  [80, 2500000], [85, 7000000], [88, 11000000], [90, 15000000], [93, 22000000]
];

export function baseValue(ovr: number): number {
  if (ovr <= VALUE_POINTS[0][0]) return VALUE_POINTS[0][1];
  const last = VALUE_POINTS[VALUE_POINTS.length - 1];
  if (ovr >= last[0]) return last[1];
  for (let i = 1; i < VALUE_POINTS.length; i++) {
    const [x1, y1] = VALUE_POINTS[i];
    if (ovr <= x1) {
      const [x0, y0] = VALUE_POINTS[i - 1];
      return Math.exp(Math.log(y0) + ((ovr - x0) / (x1 - x0)) * (Math.log(y1) - Math.log(y0)));
    }
  }
  return last[1];
}

export function ageValueF(age: number): number {
  if (age <= 19) return 1.4;
  if (age <= 23) return 1.3;
  if (age <= 27) return 1;
  if (age <= 29) return 0.75;
  if (age <= 31) return 0.5;
  if (age <= 33) return 0.3;
  return 0.15;
}

export function posValueF(pos: Pos): number {
  if (pos === 'GK') return 0.7;
  if (pos === 'CB' || pos === 'LB' || pos === 'RB') return 0.9;
  if (pos === 'ST' || pos === 'LW' || pos === 'RW') return 1.15;
  return 1;
}

export function formValueF(s: GameState): number {
  const last = s.career.seasons[s.career.seasons.length - 1];
  if (!last || last.apps <= 0 || last.ratingN <= 0) return 0.85;
  const avg = last.ratingSum / last.ratingN;
  return avg >= 7.3 ? 1.2 : avg >= 6.8 ? 1 : avg >= 6.3 ? 0.9 : 0.8;
}

export interface ValueParts { ovr: number; base: number; age: number; ageF: number; potF: number; posF: number; formF: number; fameF: number; injF: number; value: number }

export function valueParts(s: GameState): ValueParts {
  const ovr = anchored(curOvr(s.ab));
  const age = ageAt(s.p.birth, s.week);
  const base = baseValue(ovr);
  const ageF = ageValueF(age);
  const potF = age <= 23 ? 1 + Math.max(0, s.ab.pot - ovr) / 30 : 1;
  const posF = posValueF(s.ab.pos);
  const formF = formValueF(s);
  const fameF = 1 + s.fame.abroad / 200;
  const injF = s.st.injury && s.st.injury.weeksLeft >= 12 ? 0.7 : 1;
  const value = Math.max(1, Math.round(base * ageF * potF * posF * formF * fameF * injF));
  return { ovr, base, age, ageF, potF, posF, formF, fameF, injF, value };
}

export function marketValue(s: GameState): number {
  return Math.max(1, valueParts(s).value);
}

export function formatMarket(man: number): string {
  const v = Math.abs(Math.round(man));
  const sign = man < 0 ? '-' : '';
  if (v < 10000) return `${sign}${v.toLocaleString('ko-KR')}만 원`;
  if (v < 10000000) return `${sign}${(v / 10000).toFixed(1)}억 원`;
  return `${sign}${Math.round(v / 10000).toLocaleString('ko-KR')}억 원`;
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
