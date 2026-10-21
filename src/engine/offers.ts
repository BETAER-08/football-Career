import { Rng, clamp } from './rng';
import { clubLvl } from './world';
import { getClub, getCountry } from './data';
import { formatKRW, formatMarket } from './finance';
import { moveYouthTo } from './youthmove';
import { closeMarket, negotiate, trialPass, joinClub, roleLabel, genOffers, fallbackOffer, leaveToFree, feeNote } from './transfer';
import { clubDeal, youthDeal, extendContract, signPre, modeLabel, expireToFree } from './market';
import { addLog } from './log';
import { isSchoolId } from '../data/schools';
import { pushDecision, fireEvent, getEvent } from './events';
import { coachOfferLabel } from './coach';
import type { Chip, Decision, GameState, Offer, ResultPanel } from './types';
import { ageAt } from './time';

export function offerLabel(s: GameState, o: Offer): string {
  const c = getClub(o.clubId);
  return `[${modeLabel(o)}] ${c.name} · ${getCountry(c.country).ko} · ${roleLabel(o.role)} · 연봉 ${formatKRW(o.wage)}${o.fee ? ` · ${o.first || o.yth ? '유스 보상금' : '이적료'} ${formatMarket(o.fee)}` : ''}${o.optionFee ? ` · 임대 · 완전 이적 옵션 ${formatMarket(o.optionFee)}` : ''}${o.trial ? ' · 입단 테스트' : ''}${o.tag === 'money' ? ' · 고액 연봉 제안' : ''}`;
}

export function hasPendingOffer(s: GameState): boolean {
  return (s.decision !== null && s.decision.kind === 'offer') || s.decQueue.some((d) => d.kind === 'offer');
}

export function presentOffers(s: GameState, offers: Offer[], ref: string, title: string, text: string, allowDecline: boolean, declineLabel = '모두 거절하고 기다린다'): void {
  if (!offers.length) return;
  const labeler = (o: Offer) => (ref === 'coachjob' ? coachOfferLabel(o) : offerLabel(s, o));
  const choices = offers.map((o) => ({ label: labeler(o), chips: [] as Chip[], pct: null as number | null, disabled: '' }));
  if (allowDecline) choices.push({ label: declineLabel, chips: [], pct: null, disabled: '' });
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

function repush(s: GameState, d: Decision, rest: Offer[]): void {
  if (!rest.length) return;
  const nd: Decision = { ...d, uid: s.ev.nextId++, offers: rest, choices: rest.map((x) => ({ label: offerLabel(s, x), chips: [], pct: null, disabled: '' })) };
  if (d.choices.length > d.offers.length) nd.choices.push(d.choices[d.choices.length - 1]);
  pushDecision(s, nd);
}

export function resolveOffer(s: GameState, rng: Rng, d: Decision, idx: number, demandsStr: string): ResultPanel {
  const offers = d.offers;
  const w = s.week;
  if (idx >= offers.length) {
    if (d.ref === 'first' && !s.career.debuted) s.career.rejectCount += 1;
    if (d.ref === 'renew' && s.career.clubId) {
      expireToFree(s, rng);
      return { title: '재계약을 거절했다', grade: 'none', roll: 0, need: 100, text: '계약이 만료돼 자유계약 선수가 됐다.', changes: [], later: true, w };
    }
    if (d.ref === 'window') {
      return { title: '잔류를 선택했다', grade: 'none', roll: 0, need: 100, text: '이번 시장에서는 현 소속팀에 남기로 했다.', changes: [], later: true, w };
    }
    return { title: '제안을 모두 거절했다', grade: 'none', roll: 0, need: 100, text: '서두르지 않기로 했다. 더 나은 기회가 올 수도, 오지 않을 수도 있다.', changes: [], later: true, w };
  }
  const o = offers[idx];
  const rest = offers.filter((x) => x.id !== o.id);
  const youthMove = !!s.career.clubId && !!s.career.contract?.youth && !isSchoolId(s.career.clubId) && o.clubId !== s.career.clubId && o.mode === 'transfer' && d.ref !== 'coachjob';
  if ((o.mode === 'transfer' && s.career.clubId) || youthMove) {
    const deal = youthMove ? youthDeal(s, rng, o) : clubDeal(s, rng, o);
    if (!deal.ok) {
      const from = getClub(s.career.clubId).name;
      const to = getClub(o.clubId).name;
      s.st.morale = clamp(s.st.morale - 3, 0, 100);
      if (s.people.coach) s.people.coach.rel = clamp(s.people.coach.rel - 2, -100, 100);
      addLog(s, 'system', '구단 간 협상 결렬', `${from}이(가) ${to}의 제안을 받아들이지 않았다.`, [{ k: '사기', d: -3 }]);
      repush(s, d, rest);
      const evId = youthMove ? 'deal_collapse_youth' : 'deal_collapse_pro';
      if ((s.phase === 'pro' || s.phase === 'youth') && !s.career.retired && s.career.clubId && (s.ev.cd[evId] ?? 0) <= s.week && rng.chance(0.65)) fireEvent(s, rng, getEvent(evId));
      return { title: '구단 간 협상 결렬', grade: 'bad', roll: Math.round(deal.roll * 100), need: Math.round(deal.p * 100), text: `${from}이(가) ${to}의 ${youthMove ? '유스 이적' : '이적'} 제안을 거절했다. 구단 간 ${youthMove ? '육성 보상금' : '이적료'} 합의가 이뤄지지 않았다.`, changes: [{ k: '사기', d: -3 }], later: false, w };
    }
  }
  const demands = { wage: demandsStr.includes('wage'), role: demandsStr.includes('role'), buyout: demandsStr.includes('buyout') };
  const neg = negotiate(s, rng, o, demands);
  if (!neg.ok) {
    repush(s, d, rest);
    s.career.upBias = Math.max(0, s.career.upBias);
    return { title: `${getClub(o.clubId).name}와 협상`, grade: 'bad', roll: Math.round(neg.roll * 100), need: Math.round(neg.need * 100), text: neg.text, changes: [], later: false, w };
  }
  let final = neg.offer;
  if (final.trial) {
    const tp = trialPass(s, rng, final);
    if (!tp.ok) {
      repush(s, d, rest);
      s.st.morale = clamp(s.st.morale - 5, 0, 100);
      return { title: `${getClub(final.clubId).name} 입단 테스트`, grade: 'bad', roll: Math.round(tp.roll * 100), need: Math.round(tp.need * 100), text: '테스트에서 기대한 인상을 남기지 못했다.', changes: [{ k: '사기', d: -5 }], later: false, w };
    }
    final = { ...final, trial: false };
  }
  const club = getClub(final.clubId).name;
  if (final.yth === 'youth' || final.yth === 'scholar') {
    moveYouthTo(s, rng, final.clubId, `${club}의 ${final.yth === 'scholar' ? '장학 계약' : 'U19·리저브 합류'} 제안을 받아들여 유스 이적했다. 유스 보상금 ${formatMarket(final.fee ?? 0)}.`, final.yth === 'scholar');
    if (final.yth === 'scholar' && s.career.contract) s.career.contract.wage = final.wage;
    closeMarket(s);
    return { title: `${club} 유스 이적`, grade: 'ok', roll: Math.round(neg.roll * 100), need: Math.round(neg.need * 100), text: `${neg.text} ${club}에서 ${final.note ?? '새 도전을 시작한다'}.`, changes: [], later: false, w };
  }
  if (final.mode === 'renew') {
    extendContract(s, final);
    return { title: `${club} 재계약`, grade: 'ok', roll: Math.round(neg.roll * 100), need: Math.round(neg.need * 100), text: `${neg.text} ${club}와(과) ${final.years}년 재계약을 맺었다. 약속된 역할은 ${roleLabel(final.role)}.`, changes: [], later: false, w };
  }
  if (final.mode === 'pre') {
    signPre(s, final);
    return { title: `${club} 사전 계약`, grade: 'ok', roll: Math.round(neg.roll * 100), need: Math.round(neg.need * 100), text: `${neg.text} 시즌 종료 후 이적료 없이 ${club}에 합류하기로 했다. 남은 기간 현 소속팀과의 관계가 서먹해진다.`, changes: [{ k: '감독 관계', d: -8 }], later: false, w };
  }
  const wasFree = !s.career.clubId;
  joinClub(s, rng, final, wasFree ? '자유계약' : '이적');
  const chips: Chip[] = [];
  return { title: `${club} 입단`, grade: 'ok', roll: Math.round(neg.roll * 100), need: Math.round(neg.need * 100), text: `${neg.text} ${club}에서 ${roleLabel(final.role)}로 새 출발한다.${feeNote(final) ? ` (${feeNote(final)})` : ''}`, changes: chips, later: false, w };
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
