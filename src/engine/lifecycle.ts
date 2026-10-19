import { Rng, clamp } from './rng';
import { addLog, toast } from './log';
import { ageAt, seasonOf, swOf, isWindow } from './time';
import { curOvr } from './attributes';
import { clubLvl, clubStd } from './world';
import { getClub } from './data';
import { genOffers, genYouthJudgement, joinClub, leaveToFree, fallbackOffer, makeOfferFor, roleLabel, closeCurrent } from './transfer';
import { presentOffers, hasPendingOffer } from './offers';
import { fireEvent, getEvent, pushDecision } from './events';
import { getCal } from './calibration';
import type { Decision, GameState } from './types';

export function endGame(s: GameState, reason: string): void {
  if (s.ended) return;
  s.ended = true;
  s.endReason = reason;
  s.decision = null;
  s.decQueue = [];
  addLog(s, 'milestone', '축구 인생 종료', reason, [], { star: true });
}

export function retirePlayer(s: GameState, rng: Rng, reason: string, byInjury = false): void {
  if (s.career.retired) return;
  const age = ageAt(s.p.birth.y, s.week);
  s.career.retired = true;
  s.career.retireAge = age;
  s.career.retireReason = reason;
  if (byInjury) s.career.endedByInjury = true;
  if (s.career.clubId) {
    s.career.clubsHist[s.career.clubsHist.length - 1].toS = seasonOf(s.week);
    closeCurrent(s);
    s.career.contract = null;
    s.career.clubId = '';
  }
  s.career.fixtures.length = 0;
  s.phase = 'postcareer';
  s.focus = 'study';
  s.post.enteredW = s.week;
  s.post.rep = clamp(s.fame.peakFame * 0.6, 0, 100);
  s.post.skill = 10;
  if (s.career.debuted) addLog(s, 'milestone', '은퇴', `${age}세에 현역에서 은퇴했다. ${reason}`, [], { star: true });
  else addLog(s, 'milestone', '축구 포기', `프로 무대에 서지 못한 채 선수의 꿈을 접었다. ${reason}`, [], { star: true });
  s.st.injury = null;
  const d: Decision = {
    uid: s.ev.nextId++, kind: 'career', ref: 'path', title: '은퇴 후의 길',
    text: s.career.debuted ? '유니폼을 벗었다. 이제 축구와 어떻게 함께할 것인가?' : '선수로서의 길은 여기까지였다. 그래도 축구와의 인연을 이어갈 수 있다.',
    choices: [
      { label: '지도자의 길 (C급 과정부터)', chips: [{ k: '지도자 자격증', d: 1 }], pct: null, disabled: '' },
      { label: '해설·방송', chips: [{ k: '평판', d: 1 }, { k: '수입', d: 1 }], pct: null, disabled: '' },
      { label: '구단 행정 (스카우트 · 테크니컬 디렉터 · 단장)', chips: [{ k: '전문성', d: 1 }], pct: null, disabled: '' },
      { label: '사업', chips: [{ k: '수입 변동', d: 1 }], pct: null, disabled: '' },
      { label: '축구계를 떠난다 (이야기를 끝낸다)', chips: [], pct: null, disabled: '' }
    ],
    w: s.week, heavy: false, help: '', ctx: '', offers: []
  };
  pushDecision(s, d);
}

export function expireContracts(s: GameState, rng: Rng): void {
  const con = s.career.contract;
  if (!con || !s.career.clubId) return;
  if (s.life.mil === 'serving') return;
  const age = ageAt(s.p.birth.y, s.week);
  if (con.loanFrom) {
    const parent = con.loanFrom;
    const o = makeOfferFor(s, rng, parent, 'loanreturn', { renew: true });
    if (o) {
      leaveToFree(s, '임대 종료');
      joinClub(s, rng, { ...o, years: 2 }, '임대 복귀');
      s.career.contract!.loanFrom = '';
      return;
    }
  }
  if (con.youth) return;
  if (con.endW > s.week + 1) return;
  const margin = curOvr(s.ab) - clubStd(s, s.career.clubId);
  const p = 1 / (1 + Math.exp(-((margin + 7) / 3 + s.people.coach.rel / 55))) * (age >= 35 ? 0.5 : 1);
  if (rng.next() < p) {
    const o = makeOfferFor(s, rng, s.career.clubId, 'renew', { renew: true });
    if (o) {
      o.exp = s.week + 20;
      presentOffers(s, [o], 'renew', '재계약 제안', `${getClub(s.career.clubId).name}이(가) 계약 연장을 제안했다. 약속 역할은 ${roleLabel(o.role)}.`, true);
      return;
    }
  }
  leaveToFree(s, '계약 만료');
}

export function weeklyUnattached(s: GameState, rng: Rng): void {
  if (s.career.clubId || s.career.retired) return;
  if (s.decision && s.decision.kind === 'offer') return;
  const waited = s.week - s.career.freeAgentW;
  const age = ageAt(s.p.birth.y, s.week);
  if (waited > 0 && waited % 3 === 0 && rng.next() < 0.7) {
    let offers = genOffers(s, rng, 'free', 3);
    if (!offers.length && waited >= 9) {
      const fb = fallbackOffer(s, rng, 'free');
      if (fb) offers = [fb];
    }
    if (offers.length) presentOffers(s, offers, 'free', '새 팀의 제안', '무적 신분인 당신에게 몇몇 구단이 관심을 보였다.', true);
  }
  if (waited >= 78 || (age >= 37 && waited >= 26)) retirePlayer(s, rng, '새로운 소속 팀을 끝내 찾지 못했다.');
}

export function windowOffers(s: GameState, rng: Rng): void {
  const sw = swOf(s.week);
  if (!isWindow(sw) || !s.career.clubId || s.career.retired || s.phase !== 'pro') return;
  if (s.decision || hasPendingOffer(s)) return;
  const age = ageAt(s.p.birth.y, s.week);
  const wantOut = s.ev.flags.transfer_request !== undefined ? 3 : 1;
  const p = (0.055 + s.fame.dom / 700 + s.career.upBias * 0.08) * wantOut;
  if (rng.next() >= p) return;
  const curLvl = clubLvl(s, s.career.clubId);
  const offers = genOffers(s, rng, 'window', 1).filter((o) => clubLvl(s, o.clubId) >= curLvl || o.wage > (s.career.contract ? s.career.contract.wage : 0) * 1.2);
  if (age <= 24 && swOf(s.week) <= 9 && ['prospect', 'backup'].includes(s.career.contract?.role ?? '') && curLvl >= 3 && rng.chance(0.3)) {
    const lowLvlClubs = genOffers(s, rng, 'window', 2).filter((o) => clubLvl(s, o.clubId) < curLvl && getClub(o.clubId).country === getClub(s.career.clubId).country);
    if (lowLvlClubs.length) {
      const lo = { ...lowLvlClubs[0], loan: true, years: 1 };
      offers.push(lo);
    }
  }
  if (!offers.length) return;
  const hi = offers.some((o) => clubLvl(s, o.clubId) > curLvl);
  presentOffers(s, offers, 'window', '이적 제안', `이적 시장에서 ${offers.length}개 구단이 접촉해 왔다.`, true);
  if (hi) s.career.upBias = 0;
}

export function upBiasUpdate(s: GameState): void {
  const cur = s.career.cur;
  if (!s.career.clubId || s.phase !== 'pro') return;
  const avg = cur.ratingN ? cur.ratingSum / cur.ratingN : 0;
  if (avg >= 7 && cur.starts >= 12) s.career.upBias = Math.min(0.6, s.career.upBias + 0.08);
}

export function youthStep(s: GameState, rng: Rng, age: number): void {
  const sw = swOf(s.week);
  if (s.phase !== 'youth' || s.career.debuted || s.career.retired) return;
  if (age >= 17 && sw === 30 && s.career.clubId) {
    const j = genYouthJudgement(s, rng);
    if (j.pass) {
      addLog(s, 'milestone', '1군 계약 판정', `${getClub(s.career.clubId).name} 코칭스태프가 프로 계약을 검토한다. 여러 구단이 관심을 보인다.`, [], { star: true });
      presentOffers(s, j.offers, 'first', '프로 계약 제안', '유스 생활의 결실로 프로 계약 제안이 도착했다.', age < 19 && s.career.rejectCount < 2);
    } else if (age >= 19) {
      s.career.youthJudged = true;
      const def = getEvent('youth_final_release');
      fireEvent(s, rng, def);
    } else {
      toast(s, '아직 1군 문은 열리지 않았다. 한 시즌 더 증명해야 한다.');
    }
  }
  if (age >= 20 && !s.career.clubId && !s.career.retired && s.week - s.career.freeAgentW > 60) {
    retirePlayer(s, rng, '프로 구단의 문은 끝내 열리지 않았다.');
  }
}

export function forceRetireCheck(s: GameState, rng: Rng, age: number): void {
  if (s.career.retired || s.phase === 'coach' || s.phase === 'postcareer') return;
  if (age >= 41) retirePlayer(s, rng, '더 이상 몸이 따라주지 않았다.');
}

const RETIRE_P: Record<number, number> = { 31: 0.04, 32: 0.08, 33: 0.14, 34: 0.21, 35: 0.3, 36: 0.4, 37: 0.5, 38: 0.6, 39: 0.7, 40: 0.82 };

export function retirePressure(s: GameState, rng: Rng, age: number): void {
  if (s.career.retired || s.phase !== 'pro' || age < 31 || !s.career.clubId) return;
  let p = RETIRE_P[Math.min(40, age)] ?? 0;
  const margin = curOvr(s.ab) - clubStd(s, s.career.clubId);
  if (margin < -5) p *= 1.5;
  else if (margin > 4) p *= 0.65;
  if (s.st.chronic && Object.keys(s.st.chronic).length >= 2) p *= 1.2;
  p = Math.min(0.95, p * getCal().retireScale);
  if (rng.next() >= p) return;
  const def = getEvent('retire_nudge');
  fireEvent(s, rng, def);
}
