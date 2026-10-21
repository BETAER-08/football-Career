import { describe, expect, it } from 'vitest';
import { newGame, tickState, autoWeek, resolveDecision } from '../src/engine/game';
import { autoDecide } from '../src/engine/auto';
import { Rng, seedState } from '../src/engine/rng';
import { rngOf, clubLvl } from '../src/engine/world';
import { ensureContent } from '../src/engine/content';
import { anchored, curOvr } from '../src/engine/attributes';
import { ALL_ATTRS } from '../src/engine/types';
import { forcedOrigin, originRng } from '../src/engine/headless';
import { scaleToOvr } from '../src/engine/player';
import { getClub } from '../src/engine/data';
import { marketValue, formatMarket, baseValue } from '../src/engine/finance';
import { buildBatch, marketEligible } from '../src/engine/market';
import { transferFee, capByBudget, feeCap, buyoutFor, compFee, makeOfferFor, recordFee, leftFeeF, sellerFeeF } from '../src/engine/transfer';
import { migrateState } from '../src/engine/migrate';
import type { GameState, Offer, Pos } from '../src/engine/types';

ensureContent();

function pro(seed: string, code = 'GB'): GameState {
  for (let k = 0; k < 6; k++) {
    const sd = k ? `${seed}-${k}` : seed;
    const s = newGame({ seed: sd, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 }, forcedOrigin(originRng(sd), code, 4));
    s.auto = true;
    for (let i = 0; i < 52 * 8 && !s.career.retired; i++) {
      if (s.phase === 'pro' && marketEligible(s)) {
        s.st.injury = null;
        return s;
      }
      for (const a of ALL_ATTRS) s.ab.a[a] = Math.max(s.ab.a[a], 13);
      let g = 0;
      while (s.decision && g++ < 12) {
        const { idx, demands } = autoDecide(s, rngOf(s), s.decision);
        resolveDecision(s, idx, demands, false);
      }
      autoWeek(s);
      tickState(s);
    }
  }
  throw new Error('no pro');
}

function setAge(s: GameState, age: number): void {
  const y = Math.floor(s.week / 52);
  const calYear = 2026 + y + (s.week % 52 > 25 ? 1 : 0);
  s.p.birth = { y: calYear - age - 1, m: 12, d: 28 };
}

function standard(s: GameState, shown: number, pos: Pos = 'CM'): void {
  s.ab.pos = pos;
  scaleToOvr(s.ab.a, pos, shown);
  setAge(s, 25);
  s.st.injury = null;
  s.fame.abroad = 0;
  s.career.contract!.endW = s.week + 52 * 4;
  s.career.seasons = [{ ...s.career.cur, apps: 30, ratingSum: 7 * 30, ratingN: 30 }];
}

describe('시장가치 모델', () => {
  const s = pro('val-1');
  it('기준점에서 표 값과 ±1% 이내로 일치한다', () => {
    const table: [number, number][] = [[45, 500], [50, 3000], [55, 8000], [60, 20000], [65, 60000], [70, 200000], [75, 700000], [80, 2500000], [85, 7000000], [88, 11000000], [90, 15000000], [93, 22000000]];
    for (const [ovr, v] of table) {
      standard(s, ovr);
      expect(anchored(curOvr(s.ab))).toBeCloseTo(ovr, 3);
      const got = marketValue(s);
      expect(Math.abs(got - v) / v, `${ovr}`).toBeLessThan(0.01);
    }
    expect(baseValue(40)).toBe(500);
    expect(baseValue(97)).toBe(22000000);
    const mid = baseValue(72.5);
    expect(mid).toBeGreaterThan(200000);
    expect(mid).toBeLessThan(700000);
    expect(Math.abs(mid - Math.sqrt(200000 * 700000)) / mid).toBeLessThan(0.1);
  });

  it('나이, 잠재력, 포지션, 폼, 명성, 부상 배율을 따른다', () => {
    standard(s, 70);
    const base = marketValue(s);
    const ratio = () => marketValue(s) / base;
    const ages: [number, number][] = [[19, 1.4], [21, 1.3], [26, 1], [28, 0.75], [30, 0.5], [32, 0.3], [35, 0.15]];
    for (const [age, f] of ages) {
      standard(s, 70);
      setAge(s, age);
      s.ab.pot = 70;
      expect(ratio(), `age ${age}`).toBeCloseTo(f, 2);
    }
    standard(s, 70);
    setAge(s, 21);
    s.ab.pot = 85;
    expect(ratio()).toBeCloseTo(1.3 * (1 + 15 / 30), 2);
    setAge(s, 25);
    expect(ratio()).toBeCloseTo(1, 2);
    for (const [pos, f] of [['GK', 0.7], ['CB', 0.9], ['DM', 1], ['AM', 1], ['ST', 1.15], ['RW', 1.15]] as [Pos, number][]) {
      standard(s, 70, 'CM');
      const b = marketValue(s);
      s.ab.pos = pos;
      scaleToOvr(s.ab.a, pos, 70);
      expect(marketValue(s) / b, pos).toBeCloseTo(f, 2);
    }
    standard(s, 70);
    for (const [avg, f] of [[7.5, 1.2], [7.0, 1], [6.5, 0.9], [6.0, 0.8]]) {
      s.career.seasons = [{ ...s.career.cur, apps: 30, ratingSum: avg * 30, ratingN: 30 }];
      expect(ratio(), `${avg}`).toBeCloseTo(f, 2);
    }
    s.career.seasons = [];
    expect(ratio()).toBeCloseTo(0.85, 2);
    standard(s, 70);
    s.fame.abroad = 60;
    expect(ratio()).toBeCloseTo(1.3, 2);
    s.fame.abroad = 0;
    s.st.injury = { id: 'x', ko: 't', part: 'knee', weeksLeft: 14, total: 14, early: false } as never;
    expect(ratio()).toBeCloseTo(0.7, 2);
    s.st.injury = { id: 'x', ko: 't', part: 'knee', weeksLeft: 6, total: 14, early: false } as never;
    expect(ratio()).toBeCloseTo(1, 2);
    s.st.injury = null;
  });

  it('금액 표시 형식', () => {
    expect(formatMarket(3000)).toBe('3,000만 원');
    expect(formatMarket(20000)).toBe('2.0억 원');
    expect(formatMarket(125000)).toBe('12.5억 원');
    expect(formatMarket(10000000)).toBe('1,000억 원');
    expect(formatMarket(22000000)).toBe('2,200억 원');
  });
});

describe('이적료', () => {
  const s = pro('fee-1', 'GB');

  it('계약 잔여·판매 구단·협상 변동 배율을 따르고 FA는 0이다', () => {
    standard(s, 75);
    s.career.transferReq = -1;
    setAge(s, 26);
    const val = marketValue(s);
    const seller = sellerFeeF(clubLvl(s, s.career.clubId));
    const rng = new Rng(seedState('fee-r'));
    for (const [years, f] of [[4, 1], [2, 0.85], [1, 0.6], [0.4, 0.35]] as [number, number][]) {
      s.career.contract!.endW = s.week + Math.round(years * 52);
      expect(leftFeeF(years)).toBeCloseTo(f, 2);
      let lo = Infinity;
      let hi = 0;
      for (let i = 0; i < 400; i++) {
        const fee = transferFee(s, rng, 'GB:x');
        lo = Math.min(lo, fee);
        hi = Math.max(hi, fee);
      }
      const unit = val * f * seller;
      expect(lo / unit).toBeGreaterThan(0.895);
      expect(hi / unit).toBeLessThan(1.155);
      expect(hi / unit).toBeGreaterThan(1.08);
    }
    s.career.transferReq = s.week;
    s.career.contract!.endW = s.week + 52 * 4;
    let hi = 0;
    for (let i = 0; i < 300; i++) hi = Math.max(hi, transferFee(s, rng, 'GB:x'));
    expect(hi / (val * seller)).toBeLessThanOrEqual(1.0001);
    s.career.transferReq = -1;
    s.career.contract!.endW = s.week;
    expect(transferFee(s, rng, 'GB:x')).toBe(0);
    expect([6, 5, 4, 3, 2].map(sellerFeeF)).toEqual([1.15, 1, 0.85, 0.7, 0.6]);
  });

  it('예산 상한을 넘는 구단은 완전 이적 제안을 못 하고 임대(옵션) 제안만 한다', () => {
    const low = getClub('GB:Grimsby Town');
    expect(feeCap(low.id)).toBeLessThan(120000);
    const o = makeOfferFor(s, new Rng(seedState('cap-r')), low.id, 'window', { anyRole: true, mode: 'transfer' })!;
    o.fee = feeCap(low.id) * 3;
    const c = capByBudget(s, o);
    expect(c.loan).toBe(true);
    expect(c.mode).toBe('loan');
    expect(c.optionFee).toBe(o.fee);
    expect(c.fee).toBe(0);
    const o2: Offer = { ...o, fee: feeCap(low.id) - 1 };
    expect(capByBudget(s, o2).mode).toBe('transfer');
    standard(s, 88);
    s.career.contract!.endW = s.week + 52 * 4;
    const rng = new Rng(seedState('cap-b'));
    for (let i = 0; i < 40; i++) {
      for (const x of buildBatch(s, rng, true, 4)) if (x.mode === 'transfer' && !x.first) expect(x.fee!).toBeLessThanOrEqual(feeCap(x.clubId));
    }
  });

  it('바이아웃은 시장가치의 1.5~3배이고 구단 수준이 높을수록 높다', () => {
    standard(s, 75);
    const val = marketValue(s);
    const rng = new Rng(seedState('bo-r'));
    const lvl2 = getClub('GB:Grimsby Town').id;
    const top = leaguesTop(s);
    let sum2 = 0;
    let sum6 = 0;
    for (let i = 0; i < 200; i++) {
      const b2 = buyoutFor(s, rng, lvl2);
      const b6 = buyoutFor(s, rng, top);
      expect(b2 / val).toBeGreaterThanOrEqual(1.5);
      expect(b6 / val).toBeLessThanOrEqual(3.0001);
      sum2 += b2;
      sum6 += b6;
    }
    expect(sum6).toBeGreaterThan(sum2);
  });

  it('유스 보상금은 소속 시즌 수 × 수준별 단가다', () => {
    const y = newGame({ seed: 'comp-1', name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 }, forcedOrigin(originRng('comp-1'), 'GB', 6));
    const id = y.career.clubId;
    const lvl = clubLvl(y, id);
    const rate: Record<number, number> = { 6: 15000, 5: 10000, 4: 5000, 3: 2000, 2: 500 };
    expect(compFee(y)).toBe(rate[lvl]);
    y.career.ySeasons = [{ ...y.career.yCur, clubId: id, done: true }, { ...y.career.yCur, clubId: id, done: true }];
    expect(compFee(y)).toBe(3 * rate[lvl]);
  });

  it('최고 이적료 기록과 누적 이적료가 갱신되고 별표 로그가 남는다', () => {
    const t = pro('fee-rec');
    const clubId = 'GB:Arsenal';
    t.career.feeSum = 0;
    t.career.feeMax = 0;
    recordFee(t, clubId, 6000000);
    expect(t.career.feeSum).toBe(6000000);
    expect(t.career.feeMax).toBe(6000000);
    expect(t.log.some((l) => l.title === '구단 역대 최고 이적료')).toBe(true);
    expect(t.wld.feeRec.club[clubId]).toBe(6000000);
    expect(t.wld.feeRec.league[getClub(clubId).lg0]).toBe(6000000);
    const n = t.log.length;
    recordFee(t, clubId, 1000);
    expect(t.log.length).toBe(n);
    expect(t.career.feeSum).toBe(6001000);
    expect(t.career.feeMax).toBe(6000000);
  });

  it('이전 저장은 버전 7로 변환된다', () => {
    const t = newGame({ seed: 'mig-7', name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });
    const raw = JSON.parse(JSON.stringify(t));
    raw.v = 6;
    delete raw.career.feeSum;
    delete raw.career.feeMax;
    delete raw.wld.feeRec;
    raw.fame.value = 123;
    const m = migrateState(raw);
    expect(m.ok).toBe(true);
    if (m.ok) {
      expect(m.state.career.feeSum).toBe(0);
      expect(m.state.wld.feeRec.club).toEqual({});
      expect(m.state.fame.value).toBe(marketValue(m.state));
      expect(m.state.fame.peakValue).toBe(m.state.fame.value);
    }
  });
});

function leaguesTop(s: GameState): string {
  return s.career.clubId && clubLvl(s, s.career.clubId) === 6 ? s.career.clubId : 'GB:Arsenal';
}
