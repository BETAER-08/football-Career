import { Rng } from './rng';
import { bestOfferIndex, offerScore } from './offers';
import { clubLvl } from './world';
import type { Decision, GameState } from './types';
import { focusList } from './lifestyle';
import { ageAt } from './time';
import { licenseLevel } from './coach';

export const botPolicy = { coachBias: 1, pathWeights: null as null | [number, number, number, number] };

const NEG = new Set(['스트레스', '피로', '번아웃 위험', '부채', '부상 위험', '음주']);

export function eventUtility(s: GameState, d: Decision, idx: number): number {
  const ch = d.choices[idx];
  let u = 0;
  for (const c of ch.chips) {
    if (c.k.startsWith('성공 약')) continue;
    let w = NEG.has(c.k) ? -1 : 1;
    if (c.k.includes('관계')) w = 0.7;
    if ((c.k === '현금' || c.k === '예금' || c.k === '주식') && s.hid.thrift > 55) w = 0.9;
    else if (c.k === '현금') w = 0.5;
    if ((c.k === '국내 명성' || c.k === '해외 명성' || c.k === '시장가치') && s.hid.ambition > 55) w = 1.4;
    if (c.k.includes('가족') && s.hid.family > 60) w = 1.4;
    if (c.k === '성장 가능성') w = 2;
    u += w * c.d;
  }
  if (ch.pct !== null) u += (ch.pct - 45) / 28;
  return u;
}

export function autoDecide(s: GameState, rng: Rng, d: Decision): { idx: number; demands: string } {
  if (d.kind === 'offer') {
    if (d.ref === 'coachjob') {
      let bi = d.choices.length - 1;
      let bs = -1;
      d.offers.forEach((o, i) => {
        const role = { youth: 1, assistant: 2.2, manager: 3.4, national: 3.8 }[o.tag] ?? 1;
        const lvl = o.clubId.startsWith('NAT:') ? 4 : clubLvl(s, o.clubId);
        const sc = role * 3 + lvl + Math.log(Math.max(100, o.wage)) * 0.1;
        if (sc > bs) { bs = sc; bi = i; }
      });
      const cur = s.coach.role === 'none' ? -1 : { youthCoach: 1, assistant: 2.2, manager: 3.4, national: 3.8 }[s.coach.role] * 3 + (s.coach.clubId ? clubLvl(s, s.coach.clubId) : 4);
      if (bs > cur + 0.5) return { idx: bi, demands: '' };
      return { idx: d.choices.length - 1, demands: '' };
    }
    if (d.ref === 'renew') {
      return { idx: 0, demands: s.hid.ambition > 70 && s.fin.agentSkill > 50 ? 'wage' : '' };
    }
    const best = bestOfferIndex(s, d.offers);
    if (d.ref === 'window' && s.career.clubId) {
      const cur = s.career.contract;
      const lvl = clubLvl(s, s.career.clubId);
      const o = d.offers[best];
      const curScore = lvl * 2.2 + ({ starter: 3, rotation: 2, prospect: 1, backup: 0 }[cur?.role ?? 'backup']) * 2.0 + Math.log(Math.max(100, cur?.wage ?? 100)) * 0.35 + s.hid.ambition / 60;
      const sc = offerScore(s, o);
      const stay = s.hid.loyalty / 80;
      if (sc > curScore + 0.6 + stay) return { idx: best, demands: '' };
      return { idx: d.choices.length - 1, demands: '' };
    }
    return { idx: best, demands: '' };
  }
  if (d.kind === 'career' && d.ref === 'path') {
    const w = botPolicy.pathWeights ?? [
      (s.career.debuted ? 48 : 30) * botPolicy.coachBias + (s.ab.a.leadership > 11 ? 14 : 0) + (s.hid.ambition > 60 ? 8 : 0),
      14 + (s.hid.social > 60 ? 12 : 0) + s.fame.peakFame / 5,
      14 + (s.life.eduLevel >= 2 ? 8 : 0),
      12 + (s.hid.thrift < 40 ? 6 : 0) + (s.fin.cash > 30000 ? 10 : 0)
    ];
    return { idx: rng.weightedIndex(w), demands: '' };
  }
  if (d.ref === 'retire_nudge') return { idx: rng.chance(0.85) ? 0 : 1, demands: '' };
  let best = 0;
  let bu = -1e9;
  for (let i = 0; i < d.choices.length; i++) {
    const u = eventUtility(s, d, i) + rng.normal(0, 0.45);
    if (u > bu) { bu = u; best = i; }
  }
  return { idx: best, demands: '' };
}

export function autoFocus(s: GameState, rng: Rng): string {
  const list = focusList(s.phase).map((f) => f.id);
  const has = (id: string) => list.includes(id);
  const age = ageAt(s.p.birth, s.week);
  if (s.phase === 'youth' || s.phase === 'pro') {
    if (s.st.stress > 72 && has('rest')) return 'rest';
    if (s.st.fatigue > 78 && has('recover')) return 'recover';
    if (s.st.injury && has('recover')) return 'recover';
    const r = rng.next();
    if (age < 16) return r < 0.5 ? 'tech' : r < 0.72 ? 'phys' : r < 0.82 ? 'tactic' : 'family';
    if (age <= 28) return r < 0.4 ? 'tech' : r < 0.65 ? 'phys' : r < 0.8 ? 'tactic' : r < 0.86 ? 'social' : r < 0.92 ? 'money' : 'family';
    return r < 0.3 ? 'recover' : r < 0.5 ? 'tech' : r < 0.65 ? 'tactic' : r < 0.8 ? 'family' : 'money';
  }
  if (s.phase === 'coach') {
    if (s.st.stress > 75) return 'rest';
    const r = rng.next();
    if (s.coach.studying) return 'license';
    return r < 0.35 ? 'tactics' : r < 0.55 ? 'develop' : r < 0.7 ? 'manage' : r < 0.8 ? 'media' : r < 0.9 ? 'data' : 'family';
  }
  if (s.st.stress > 75) return 'rest';
  const r = rng.next();
  return r < 0.3 ? list[0] : r < 0.55 ? list[1] : r < 0.7 ? 'family' : r < 0.85 ? 'health' : list[2] ?? list[0];
}

export function autoActionId(s: GameState, rng: Rng): { id: string; amount: number } | null {
  if (s.phase === 'youth' || s.phase === 'pro') {
    const wage = s.career.contract ? s.career.contract.wage : 0;
    if (s.phase === 'pro' && s.fin.trainer === 0 && s.fin.cash > Math.max(1200, wage * 0.5) && rng.next() < 0.5) return { id: 'hire_trainer', amount: 0 };
    if (s.phase === 'pro' && s.fin.cash > Math.max(3000, wage * 1.3) && rng.next() < 0.35) return { id: 'invest_deposit', amount: Math.round(s.fin.cash * 0.4) };
    if (s.phase === 'pro' && s.st.injury && s.st.injury.weeksLeft >= 3 && rng.next() < 0.3) return { id: 'checkup', amount: 0 };
    if (s.st.stress > 78 && rng.next() < 0.5) return { id: 'vacation', amount: 0 };
    if (s.phase === 'pro' && ageAt(s.p.birth, s.week) >= 28 && s.coach.licenses.C === 0 && s.coach.studying === '' && s.hid.ambition > 45 && rng.next() < 0.12) return { id: 'coach_license', amount: 0 };
    if (s.phase === 'pro' && !s.coach.studying && s.coach.licenses.C && !s.coach.licenses.B && ageAt(s.p.birth, s.week) >= 30 && rng.next() < 0.1) return { id: 'coach_license', amount: 0 };
  } else if (s.phase === 'coach') {
    if (!s.coach.studying && licenseLevel(s) < 4 && rng.next() < 0.1) return { id: 'coach_license', amount: 0 };
  }
  return null;
}
