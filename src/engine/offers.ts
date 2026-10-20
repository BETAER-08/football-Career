import { Rng, clamp } from './rng';
import { clubLvl } from './world';
import { getClub, getCountry } from './data';
import { formatKRW } from './finance';
import { negotiate, trialPass, joinClub, roleLabel, genOffers, fallbackOffer, leaveToFree } from './transfer';
import { pushDecision } from './events';
import { coachOfferLabel } from './coach';
import type { Chip, Decision, GameState, Offer, ResultPanel } from './types';
import { ageAt } from './time';

export function offerLabel(s: GameState, o: Offer): string {
  const c = getClub(o.clubId);
  return `${c.name} · ${getCountry(c.country).ko} · ${roleLabel(o.role)} · 연봉 ${formatKRW(o.wage)}${o.loan ? ' · 임대' : ''}${o.trial ? ' · 입단 테스트' : ''}`;
}

export function hasPendingOffer(s: GameState): boolean {
  return (s.decision !== null && s.decision.kind === 'offer') || s.decQueue.some((d) => d.kind === 'offer');
}

export function presentOffers(s: GameState, offers: Offer[], ref: string, title: string, text: string, allowDecline: boolean): void {
  if (!offers.length) return;
  const labeler = (o: Offer) => (ref === 'coachjob' ? coachOfferLabel(o) : offerLabel(s, o));
  const choices = offers.map((o) => ({ label: labeler(o), chips: [] as Chip[], pct: null as number | null, disabled: '' }));
  if (allowDecline) choices.push({ label: '모두 거절하고 기다린다', chips: [], pct: null, disabled: '' });
  const d: Decision = { uid: s.ev.nextId++, kind: 'offer', ref, title, text, choices, w: s.week, heavy: false, help: '', ctx: '', offers };
  pushDecision(s, d);
}

export function offerScore(s: GameState, o: Offer): number {
  const lvl = clubLvl(s, o.clubId);
  const roleV = { starter: 3, rotation: 2, prospect: 1, backup: 0 }[o.role];
  const age = ageAt(s.p.birth, s.week);
  const abroadPenalty = getClub(o.clubId).country !== s.p.country ? (50 - s.hid.adapt) / 40 : 0;
  const loanPenalty = o.loan ? -1.2 : 0;
  const base = lvl * 2.2 + roleV * (age <= 22 ? 1.6 : 2.2) + Math.log(Math.max(100, o.wage)) * 0.35 - abroadPenalty + loanPenalty - (o.trial ? 0.8 : 0);
  return base + s.hid.ambition / 60;
}

export function bestOfferIndex(s: GameState, offers: Offer[]): number {
  let bi = 0;
  let bs = -1e9;
  offers.forEach((o, i) => {
    const sc = offerScore(s, o);
    if (sc > bs) { bs = sc; bi = i; }
  });
  return bi;
}

export function resolveOffer(s: GameState, rng: Rng, d: Decision, idx: number, demandsStr: string): ResultPanel {
  const offers = d.offers;
  const w = s.week;
  if (idx >= offers.length) {
    if (d.ref === 'first' && !s.career.debuted) s.career.rejectCount += 1;
    return { title: '제안을 모두 거절했다', grade: 'none', roll: 0, need: 100, text: '서두르지 않기로 했다. 더 나은 기회가 올 수도, 오지 않을 수도 있다.', changes: [], later: true, w };
  }
  const o = offers[idx];
  const demands = { wage: demandsStr.includes('wage'), role: demandsStr.includes('role'), buyout: demandsStr.includes('buyout') };
  const neg = negotiate(s, rng, o, demands);
  if (!neg.ok) {
    const rest = offers.filter((x) => x.id !== o.id);
    if (rest.length) {
      const nd: Decision = { ...d, uid: s.ev.nextId++, offers: rest, choices: rest.map((x) => ({ label: offerLabel(s, x), chips: [], pct: null, disabled: '' })) };
      if (d.choices.length > offers.length) nd.choices.push({ label: '모두 거절하고 기다린다', chips: [], pct: null, disabled: '' });
      pushDecision(s, nd);
    }
    s.career.upBias = Math.max(0, s.career.upBias);
    return { title: `${getClub(o.clubId).name}와 협상`, grade: 'bad', roll: Math.round(neg.roll * 100), need: Math.round(neg.need * 100), text: neg.text, changes: [], later: false, w };
  }
  let final = neg.offer;
  if (final.trial) {
    const tp = trialPass(s, rng, final);
    if (!tp.ok) {
      const rest = offers.filter((x) => x.id !== o.id);
      if (rest.length) {
        const nd: Decision = { ...d, uid: s.ev.nextId++, offers: rest, choices: rest.map((x) => ({ label: offerLabel(s, x), chips: [], pct: null, disabled: '' })) };
        if (d.choices.length > offers.length) nd.choices.push({ label: '모두 거절하고 기다린다', chips: [], pct: null, disabled: '' });
        pushDecision(s, nd);
      }
      s.st.morale = clamp(s.st.morale - 5, 0, 100);
      return { title: `${getClub(final.clubId).name} 입단 테스트`, grade: 'bad', roll: Math.round(tp.roll * 100), need: Math.round(tp.need * 100), text: '테스트에서 기대한 인상을 남기지 못했다.', changes: [{ k: '사기', d: -5 }], later: false, w };
    }
    final = { ...final, trial: false };
  }
  const wasFree = !s.career.clubId;
  joinClub(s, rng, final, d.ref === 'renew' ? '재계약' : wasFree ? '자유계약' : '이적');
  const chips: Chip[] = [];
  return { title: `${getClub(final.clubId).name} 입단`, grade: 'ok', roll: Math.round(neg.roll * 100), need: Math.round(neg.need * 100), text: `${neg.text} ${getClub(final.clubId).name}에서 ${roleLabel(final.role)}로 새 출발한다.`, changes: chips, later: false, w };
}

export function ensureSomeOffer(s: GameState, rng: Rng, kind: 'free' | 'first'): Offer[] {
  let offers = genOffers(s, rng, kind, kind === 'first' ? 3 : 3);
  if (!offers.length) {
    const fb = fallbackOffer(s, rng, kind);
    if (fb) offers = [fb];
  }
  return offers;
}

export function releasePlayer(s: GameState, reason: string): void {
  leaveToFree(s, reason);
}
