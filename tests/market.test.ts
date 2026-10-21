import { afterAll, describe, expect, it } from 'vitest';
import { newGame, tickState, autoWeek, resolveDecision, actionInput } from '../src/engine/game';
import { autoDecide } from '../src/engine/auto';
import { Rng, seedState } from '../src/engine/rng';
import { rngOf, clubLvl } from '../src/engine/world';
import { ensureContent } from '../src/engine/content';
import { ageAt, swOf, seasonOf } from '../src/engine/time';
import { curOvr, shownOvr, anchored } from '../src/engine/attributes';
import { scaleToOvr } from '../src/engine/player';
import { ALL_ATTRS } from '../src/engine/types';
import { windowIdx, windowNow, nextWindowW, windowCloseW } from '../src/engine/calendar';
import { forcedOrigin, originRng } from '../src/engine/headless';
import { setFast } from '../src/engine/log';
import { setCosmetic } from '../src/engine/flags';
import { effM, setM, getCal } from '../src/engine/calibration';
import { buildBatch, clubDeal, marketEligible, minOffers, freeOffers } from '../src/engine/market';
import { marketKey, contractWeeksLeft } from '../src/engine/transfer';
import { presentOffers } from '../src/engine/offers';
import type { Decision, GameState, Offer } from '../src/engine/types';

ensureContent();

const savedM = { ...getCal().m };

afterAll(() => {
  getCal().m = { ...savedM };
});

function mk(seed: string, country?: string): GameState {
  const cfg = { seed, name: '', pos: 'random' as const, mode: 'normal' as const, code: '', lengthMin: 60 as const };
  if (!country) return newGame(cfg);
  return newGame(cfg, forcedOrigin(originRng(seed), country));
}

function boost(s: GameState, v: number): void {
  for (const k of ALL_ATTRS) s.ab.a[k] = v;
}

function at(s: GameState, w: number): GameState {
  return { ...s, week: w } as GameState;
}

function lock(s: GameState): void {
  scaleToOvr(s.ab.a, s.ab.pos, anchored(79.5));
}

function declineAll(s: GameState): void {
  let guard = 0;
  while (s.decision && guard++ < 12 && !s.ended) {
    const d = s.decision;
    if (d.kind === 'offer' && (d.ref === 'window' || d.ref === 'free' || d.ref === 'renew')) resolveDecision(s, d.offers.length, '', false);
    else {
      const { idx, demands } = autoDecide(s, rngOf(s), d);
      resolveDecision(s, idx, demands, false);
    }
  }
}

interface Tap {
  onDecision?: (d: Decision) => boolean;
  beforeTick?: (s: GameState) => void;
  afterTick?: (s: GameState) => void;
}

function step(s: GameState, tap: Tap = {}): void {
  let guard = 0;
  while (s.decision && guard++ < 12 && !s.ended) {
    const d = s.decision;
    if (tap.onDecision && tap.onDecision(d)) continue;
    const { idx, demands } = autoDecide(s, rngOf(s), d);
    resolveDecision(s, idx, demands, false);
  }
  autoWeek(s);
  tap.beforeTick?.(s);
  tickState(s);
  tap.afterTick?.(s);
}

function reachAdultPro(s: GameState, power = 0, maxWeeks = 52 * 8): boolean {
  s.auto = true;
  for (let i = 0; i < maxWeeks && !s.ended && !s.career.retired; i++) {
    if (s.phase === 'pro' && marketEligible(s) && s.career.clubId) return true;
    if (power) boost(s, power);
    step(s);
  }
  return s.phase === 'pro' && marketEligible(s);
}

function proState(seed: string, country?: string, power = 13): GameState {
  for (let k = 0; k < 6; k++) {
    const s = mk(k ? `${seed}-${k}` : seed, country);
    if (reachAdultPro(s, power)) return s;
  }
  throw new Error('no pro state');
}

describe('이적시장 최소 제안 보장', () => {
  it('18세 이상 프로 선수는 매 여름 시장에서 2개 이상, 겨울 시장에서 1개 이상 받는다', () => {
    setFast(true);
    setCosmetic(false);
    let checked = 0;
    for (let n = 0; n < 6; n++) {
      const s = mk(`mkt-min-${n}`);
      s.auto = true;
      const expected = new Map<number, boolean>();
      const got = new Map<number, number>();
      const exempt = new Set<number>();
      let before = '';
      for (let i = 0; i < 52 * 22 && !s.ended && !s.career.retired; i++) {
        step(s, {
          onDecision: (d) => {
            if (d.kind === 'offer' && d.ref === 'window' && d.text.includes('이적시장이 열렸다')) {
              const key = marketKey(at(s, d.w));
              if (!got.has(key)) got.set(key, d.offers.filter((o) => !o.loan).length);
            }
            return false;
          },
          beforeTick: (st) => {
            before = st.career.clubId;
            if (marketEligible(st) && windowIdx(st) >= 0) {
              const key = marketKey(st);
              if ((!st.career.mkt || st.career.mkt.key !== key) && !expected.has(key)) expected.set(key, windowIdx(st) === 0);
            }
          },
          afterTick: (st) => {
            if (st.career.clubId !== before) exempt.add(marketKey({ ...st, week: st.week - 1 } as GameState));
          }
        });
      }
      for (const [key, summer] of expected) {
        if (exempt.has(key)) continue;
        checked++;
        expect(got.get(key) ?? 0, `seed ${n} key ${key} ${summer ? 'summer' : 'winter'}`).toBeGreaterThanOrEqual(summer ? 2 : 1);
      }
    }
    expect(checked).toBeGreaterThan(20);
    setFast(false);
    setCosmetic(true);
  });

  it('최소 제안 수 표를 따른다', () => {
    const s = proState('mkt-table-1');
    s.career.contract!.endW = s.week + 200;
    s.career.transferReq = -1;
    const lvl = clubLvl(s, s.career.clubId);
    const base = curOvr(s.ab) >= 0 ? minOffers(s, true) : 0;
    expect(base === 2 || base === 3).toBe(true);
    s.career.contract!.endW = s.week + 60;
    expect(minOffers(s, true)).toBe(3);
    expect(minOffers(s, false)).toBe(2);
    s.career.contract!.endW = s.week + 200;
    s.career.transferReq = s.week;
    expect(minOffers(s, true)).toBe(3);
    expect(minOffers(s, false)).toBe(2);
    expect(lvl).toBeGreaterThanOrEqual(2);
  });

  it('국적 보정 계수는 오버롤 90 이상에서 사라진다', () => {
    setM('IN', 0.001);
    expect(effM('IN', 60)).toBeCloseTo(0.001, 8);
    expect(effM('IN', 75)).toBeCloseTo(0.001, 8);
    expect(effM('IN', 82.5)).toBeCloseTo(Math.sqrt(0.001), 6);
    expect(effM('IN', 90)).toBe(1);
    expect(effM('IN', 97)).toBe(1);
    expect(getCal().m.IN).toBe(0.001);
  });

  it('오버롤 90 이상 선수는 국적과 관계없이 여름 시장마다 수준 6 구단 제안을 받는다', () => {
    setFast(true);
    setCosmetic(false);
    for (const code of ['IN', 'PK', 'SA', 'VN', 'GB']) {
      setM(code, 0);
      const s = mk(`mkt-top-${code}`, code);
      expect(reachAdultPro(s, 20)).toBe(true);
      lock(s);
      expect(shownOvr(s.ab, ageAt(s.p.birth, s.week))).toBeGreaterThanOrEqual(90);
      const summers = new Map<number, Offer[]>();
      let seen = 0;
      for (let i = 0; i < 52 * 4 && !s.ended; i++) {
        lock(s);
        step(s, {
          onDecision: (d) => {
            if (d.kind === 'offer' && d.ref === 'window' && d.text.includes('이적시장이 열렸다') && windowIdx(at(s, d.w)) === 0) {
              const key = marketKey(at(s, d.w));
              if (!summers.has(key)) summers.set(key, d.offers);
            }
            return false;
          }
        });
        if (windowIdx(s) === 0 && marketEligible(s)) seen++;
      }
      expect(summers.size).toBeGreaterThanOrEqual(2);
      expect(seen).toBeGreaterThan(0);
      for (const [key, offers] of summers) {
        const six = offers.filter((o) => o.mode !== 'renew' && clubLvl(s, o.clubId) === 6);
        expect(six.length, `${code} ${key}`).toBeGreaterThanOrEqual(1);
      }
    }
    setFast(false);
    setCosmetic(true);
  });
});

describe('구단 간 합의', () => {
  it('바이아웃 이상 제안은 항상 구단 간 합의가 성립한다', () => {
    const s = proState('mkt-deal-1');
    const rng = new Rng(seedState('deal-77'));
    const con = s.career.contract!;
    con.loanFrom = '';
    con.buyout = 5000;
    s.career.transferReq = s.week;
    s.career.reqStance = 'refused';
    con.endW = s.week + 52 * 4;
    con.role = 'starter';
    const offers = buildBatch(s, rng, true, 4).filter((o) => o.mode === 'transfer');
    expect(offers.length).toBeGreaterThan(0);
    for (let i = 0; i < 300; i++) {
      const o = { ...offers[i % offers.length], fee: 5000 + i };
      const r = clubDeal(s, rng, o);
      expect(r.ok).toBe(true);
      expect(r.auto).toBe(true);
    }
  });

  it('바이아웃 미만이면 확률로 결정되고 결렬되기도 한다', () => {
    const s = proState('mkt-deal-2');
    const rng = new Rng(seedState('deal-78'));
    const con = s.career.contract!;
    con.loanFrom = '';
    con.buyout = 99999999;
    con.endW = s.week + 52 * 4;
    con.role = 'starter';
    s.career.transferReq = s.week;
    s.career.reqStance = 'refused';
    const offers = buildBatch(s, rng, true, 4).filter((o) => o.mode === 'transfer');
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < 400; i++) {
      const r = clubDeal(s, rng, { ...offers[0], fee: 1 });
      if (r.ok) ok++;
      else fail++;
    }
    expect(fail).toBeGreaterThan(0);
    expect(ok + fail).toBe(400);
  });
});

describe('계약 만료와 자유계약', () => {
  it('재계약 없이 계약 종료 주차가 되면 FA가 되고 시장이 닫혀 있어도 계약할 수 있다', () => {
    setFast(false);
    const s = proState('mkt-fa-1');
    const con = s.career.contract!;
    con.endW = (seasonOf(s.week) + 1) * 52;
    s.life.mil = 'none';
    let guard = 0;
    while (swOf(s.week) !== 51 && guard++ < 80) {
      declineAll(s);
      autoWeek(s);
      tickState(s);
      expect(s.career.clubId).not.toBe('');
    }
    declineAll(s);
    const club = s.career.clubId;
    expect(club).not.toBe('');
    expect(swOf(s.week)).toBe(51);
    s.life.mil = 'none';
    tickState(s);
    expect(s.career.clubId).toBe('');
    expect(s.career.contract).toBeNull();
    expect(s.career.freeAgentW).toBeGreaterThanOrEqual(0);
    const d = [s.decision, ...s.decQueue].find((x) => x && x.ref === 'free')!;
    expect(windowIdx(at(s, d.w))).toBe(-1);
    expect(s.log.some((l) => l.text.includes('계약 만료, 자유계약 선수가 됐다'))).toBe(true);
    expect(d).not.toBeNull();
    expect(d.kind).toBe('offer');
    expect(d.ref).toBe('free');
    expect(d.offers.length).toBeGreaterThanOrEqual(curOvr(s.ab) < 39 ? 1 : 2);
    for (const o of d.offers) {
      expect(o.mode).toBe('free');
      expect(o.fee).toBe(0);
      expect(o.signing).toBeGreaterThanOrEqual(Math.round(o.wage * 0.2) - 1);
      expect(o.signing).toBeLessThanOrEqual(Math.round(o.wage * 0.6) + 1);
    }
    declineAll(s);
    expect(s.career.clubId).toBe('');
    let guard2 = 0;
    while (windowNow(s) && guard2++ < 20) {
      declineAll(s);
      autoWeek(s);
      tickState(s);
    }
    declineAll(s);
    expect(s.career.clubId).toBe('');
    expect(windowNow(s)).toBe(false);
    const rng = new Rng(seedState('fa-closed'));
    const offers = freeOffers(s, rng, 2, s.week - s.career.freeAgentW);
    expect(offers.length).toBeGreaterThan(0);
    presentOffers(s, offers, 'free', '새 팀의 제안', 't', true);
    resolveDecision(s, 0, '', false);
    expect(s.career.clubId).not.toBe('');
    expect(s.career.contract).not.toBeNull();
    expect(s.career.freeAgentW).toBe(-1);
  });

  it('무적 기간이 26주를 넘으면 은퇴 압박 이벤트가 발생한다', () => {
    setFast(false);
    const s = proState('mkt-fa-2');
    s.life.mil = 'none';
    s.career.contract!.endW = (seasonOf(s.week) + 1) * 52;
    let guard = 0;
    while (s.career.clubId && guard++ < 400) {
      declineAll(s);
      autoWeek(s);
      tickState(s);
    }
    expect(s.career.clubId).toBe('');
    declineAll(s);
    let pressure = false;
    for (let i = 0; i < 40 && !s.career.retired && !s.career.clubId; i++) {
      if (s.decision && s.decision.ref === 'fa_pressure') {
        pressure = true;
        break;
      }
      declineAll(s);
      tickState(s);
    }
    expect(pressure || s.career.faPressureW >= 0 || s.career.retired).toBe(true);
  });
});

describe('사전 계약', () => {
  it('사전 계약 후 계약 종료 주차에 이적료 없이 새 구단으로 옮긴다', () => {
    setFast(false);
    const s = proState('mkt-pre-1');
    s.life.mil = 'none';
    s.career.contract!.endW = (seasonOf(s.week) + (swOf(s.week) > 30 ? 2 : 1)) * 52;
    s.career.contract!.loanFrom = '';
    let guard = 0;
    while (windowIdx(s) !== 1 && guard++ < 120) {
      declineAll(s);
      autoWeek(s);
      tickState(s);
      s.life.mil = 'none';
    }
    declineAll(s);
    expect(windowIdx(s)).toBe(1);
    expect(contractWeeksLeft(s)).toBeLessThanOrEqual(26);
    const rng = new Rng(seedState('pre-901'));
    let pre: Offer | undefined;
    for (let i = 0; i < 60 && !pre; i++) pre = buildBatch(s, rng, false, 8).find((o) => o.mode === 'pre');
    expect(pre).toBeDefined();
    const oldClub = s.career.clubId;
    const relBefore = s.people.coach.rel;
    presentOffers(s, [pre!], 'window', '이적 제안', '사전 계약 제안', true, '현 소속팀에 남는다');
    resolveDecision(s, 0, '', false);
    expect(s.career.pre).not.toBeNull();
    expect(s.career.clubId).toBe(oldClub);
    expect(s.people.coach.rel).toBeLessThan(relBefore);
    guard = 0;
    while (swOf(s.week) !== 51 && guard++ < 60) {
      declineAll(s);
      autoWeek(s);
      tickState(s);
      s.life.mil = 'none';
      expect(s.career.clubId).toBe(oldClub);
    }
    declineAll(s);
    expect(swOf(s.week)).toBe(51);
    const cashBefore = s.fin.cash;
    tickState(s);
    expect(s.career.clubId).toBe(pre!.clubId);
    expect(s.career.pre).toBeNull();
    expect(s.career.freeAgentW).toBe(-1);
    expect(s.career.contract!.wage).toBe(pre!.wage);
    expect(s.fin.cash).toBeGreaterThanOrEqual(cashBefore - 1);
    expect(s.log.some((l) => l.title === '계약 만료' && l.text.includes('사전 계약'))).toBe(true);
    expect(s.log.some((l) => l.text.includes('이적료 없음'))).toBe(true);
  });
});

describe('이적 요청 예약', () => {
  it('시장이 닫혀 있을 때 이적 요청을 하면 다음 시장 개장 주에 이적 요청 최소 제안 수만큼 제안이 생긴다', () => {
    setFast(false);
    const s = proState('mkt-req-1');
    s.life.mil = 'none';
    s.career.contract!.endW = s.week + 52 * 4;
    s.career.contract!.loanFrom = '';
    let guard = 0;
    while (windowNow(s) && guard++ < 80) {
      declineAll(s);
      autoWeek(s);
      tickState(s);
    }
    declineAll(s);
    expect(windowNow(s)).toBe(false);
    s.ev.actCd = {};
    s.career.contract!.endW = s.week + 52 * 4;
    const panel = actionInput(s, 'transfer_request');
    expect(panel).not.toBeNull();
    expect(s.career.transferReq).toBeGreaterThanOrEqual(0);
    expect(['accepted', 'refused']).toContain(s.career.reqStance);
    expect(s.decision === null || s.decision.kind !== 'offer').toBe(true);
    expect(s.log.some((l) => l.title === '이적 요청 접수' || l.title === '이적 요청 거절')).toBe(true);
    const openW = nextWindowW(s);
    const summer = windowIdx({ ...s, week: openW } as GameState) === 0;
    let batch: Decision | null = null;
    guard = 0;
    while (s.week <= windowCloseW({ ...s, week: openW } as GameState) && guard++ < 60) {
      if (s.decision && s.decision.kind === 'offer' && s.decision.ref === 'window' && s.decision.text.includes('이적시장이 열렸다') && !batch) batch = s.decision;
      declineAll(s);
      if (batch) break;
      autoWeek(s);
      tickState(s);
      s.career.contract!.endW = Math.max(s.career.contract!.endW, s.week + 52 * 4);
    }
    expect(batch).not.toBeNull();
    expect(batch!.offers.filter((o) => !o.loan).length).toBeGreaterThanOrEqual(summer ? 3 : 2);
    expect(s.career.transferReq).toBeGreaterThanOrEqual(0);
  });

  it('시장이 열려 있을 때 이적 요청을 하면 즉시 제안이 제시된다', () => {
    setFast(false);
    const s = proState('mkt-req-2');
    s.life.mil = 'none';
    let guard = 0;
    while (!windowNow(s) && guard++ < 120) {
      declineAll(s);
      autoWeek(s);
      tickState(s);
      s.career.contract!.endW = Math.max(s.career.contract!.endW, s.week + 52 * 4);
    }
    declineAll(s);
    expect(windowNow(s)).toBe(true);
    s.ev.actCd = {};
    const summer = windowIdx(s) === 0;
    const panel = actionInput(s, 'transfer_request');
    expect(panel).not.toBeNull();
    expect(s.decision).not.toBeNull();
    expect(s.decision!.kind).toBe('offer');
    expect(s.decision!.offers.filter((o) => !o.loan).length).toBeGreaterThanOrEqual(summer ? 3 : 2);
    declineAll(s);
    expect(s.career.transferReq).toBeGreaterThanOrEqual(0);
    s.ev.actCd = {};
    const w = actionInput(s, 'transfer_withdraw');
    expect(w).not.toBeNull();
    expect(s.career.transferReq).toBe(-1);
    expect(s.career.reqStance).toBe('');
  });
});
