import { afterAll, describe, expect, it } from 'vitest';
import { newGame, tickState, autoWeek, resolveDecision } from '../src/engine/game';
import { autoDecide } from '../src/engine/auto';
import { Rng, seedState } from '../src/engine/rng';
import { rngOf, clubLvl } from '../src/engine/world';
import { ensureContent } from '../src/engine/content';
import { ageAt, swOf } from '../src/engine/time';
import { shownOvr, anchored } from '../src/engine/attributes';
import { ALL_ATTRS } from '../src/engine/types';
import { forcedOrigin, originRng } from '../src/engine/headless';
import { setFast } from '../src/engine/log';
import { setCosmetic } from '../src/engine/flags';
import { getCal } from '../src/engine/calibration';
import { createState, scaleToOvr, START_MAX } from '../src/engine/player';
import { START_MIN } from '../src/engine/attributes';
import { getClub, getCountry, allCountries, leaguesOf } from '../src/engine/data';
import { buildBatch, firstContractOffers, freeOffers, marketEligible, youthOffers } from '../src/engine/market';
import { pickStats, foreignAllowed, originCountry, targetLevel, genOffers } from '../src/engine/transfer';
import { upperClubPick } from '../src/engine/upper';
import { natSelect, selComps, STYLE_LABEL, ensureNatCoach } from '../src/engine/natsel';
import { intlWindow } from '../src/engine/season';
import { INTL_WINDOWS } from '../src/data/competitions';
import type { Decision, GameState, Offer } from '../src/engine/types';

ensureContent();

const savedM = { ...getCal().m };

afterAll(() => {
  getCal().m = { ...savedM };
});

const cfgOf = (seed: string) => ({ seed, name: '', pos: 'random' as const, mode: 'normal' as const, code: '', lengthMin: 60 as const });

function mk(seed: string, country?: string, level?: number): GameState {
  if (!country) return newGame(cfgOf(seed));
  return newGame(cfgOf(seed), forcedOrigin(originRng(seed), country, level));
}

function setRaw(s: GameState, raw: number): void {
  scaleToOvr(s.ab.a, s.ab.pos, anchored(raw));
}

function setShown(s: GameState, shown: number): void {
  const age = ageAt(s.p.birth, s.week);
  const t = Math.min(1, Math.max(0, (24 - age) / 7));
  scaleToOvr(s.ab.a, s.ab.pos, shown - (s.ab.dispAdj ?? 0) * t);
}

function declineAll(s: GameState): void {
  let guard = 0;
  while (s.decision && guard++ < 12 && !s.ended) {
    const d = s.decision;
    if (d.kind === 'offer') resolveDecision(s, d.offers.length, '', false);
    else {
      const { idx, demands } = autoDecide(s, rngOf(s), d);
      resolveDecision(s, idx, demands, false);
    }
  }
}

function step(s: GameState, on?: (d: Decision) => void): void {
  let guard = 0;
  while (s.decision && guard++ < 12 && !s.ended) {
    const d = s.decision;
    on?.(d);
    const { idx, demands } = autoDecide(s, rngOf(s), d);
    resolveDecision(s, idx, demands, false);
  }
  autoWeek(s);
  tickState(s);
}

function toPro(seed: string, country = 'GB', power = 13): GameState {
  const s = mk(seed, country);
  s.auto = true;
  for (let i = 0; i < 52 * 8 && !s.career.retired; i++) {
    if (s.phase === 'pro' && marketEligible(s)) return s;
    for (const k of ALL_ATTRS) s.ab.a[k] = Math.max(s.ab.a[k], power);
    step(s);
  }
  return s;
}

function adult19(seed: string, code: string, shown: number, pot = 93): GameState {
  const s = mk(seed, code, 4);
  s.p.birth = { y: s.p.birth.y, m: 6, d: 28 };
  s.week = 52 * 5 + 30;
  setShown(s, shown);
  s.ab.pot = Math.max(s.ab.pot, pot);
  s.career.youthStage = 'U19';
  return s;
}

describe('시작 오버롤 범위', () => {
  it('수준별 2,000명의 시작 오버롤이 범위 안에서 고르게 퍼지고 잠재력은 시작 오버롤 + 8 이상이다', () => {
    const codes = ['GB', 'US', 'BR', 'JP', 'KR', 'NG', 'ES', 'DE'];
    for (const level of [2, 3, 4, 5, 6]) {
      const vals: number[] = [];
      const byLevel = new Map<number, number[]>();
      let lv = level;
      for (let i = 0; i < 2000; i++) {
        const seed = `start-${level}-${i}`;
        const origin = forcedOrigin(originRng(seed), codes[i % codes.length], level);
        lv = origin.level;
        const { state } = createState(cfgOf(seed), origin);
        const shown = shownOvr(state.ab, 14);
        vals.push(shown);
        if (!byLevel.has(origin.level)) byLevel.set(origin.level, []);
        byLevel.get(origin.level)!.push(shown);
        expect(state.ab.pot).toBeGreaterThanOrEqual(state.p.startOvr + 8);
        expect(state.p.startOvr).toBeGreaterThanOrEqual(START_MIN[origin.level] - 0.01);
        expect(state.p.startOvr).toBeLessThanOrEqual(START_MAX + 0.01);
        expect(Math.abs(shown - state.p.startOvr)).toBeLessThan(1.6);
      }
      void lv;
      for (const [grp, list] of byLevel) {
        if (list.length < 300) continue;
        const lo = START_MIN[grp];
        const min = Math.min(...list);
        const max = Math.max(...list);
        const mean = list.reduce((a, b) => a + b, 0) / list.length;
        expect(min).toBeGreaterThanOrEqual(lo - 1.6);
        expect(max).toBeLessThanOrEqual(START_MAX + 1.6);
        expect(mean).toBeGreaterThan((lo + START_MAX) / 2 - 3);
        expect(mean).toBeLessThan((lo + START_MAX) / 2 + 3);
        const bins = [0, 0, 0, 0];
        for (const v of list) bins[Math.min(3, Math.floor(((v - lo) / (START_MAX - lo)) * 4))]++;
        for (const b of bins) expect(b).toBeGreaterThan(list.length / 8);
      }
    }
  });

  it('같은 시드면 같은 시작 오버롤이 나온다', () => {
    const a = createState(cfgOf('start-same'), forcedOrigin(originRng('start-same'), 'GB', 4)).state;
    const b = createState(cfgOf('start-same'), forcedOrigin(originRng('start-same'), 'GB', 4)).state;
    expect(a.p.startOvr).toBe(b.p.startOvr);
    expect(a.ab.pot).toBe(b.ab.pot);
  });
});

describe('상위 유스 구단 접근 이벤트', () => {
  const IDS = ['yc_scout_contact', 'ys_poach_up', 'ys_top_scout', 'yc_trial_abroad'];

  it('수준 6 구단 유스에서 시작한 커리어에서는 상위 구단 접근 이벤트가 0회 발생한다', () => {
    setFast(true);
    setCosmetic(false);
    for (let i = 0; i < 12; i++) {
      const s = mk(`up6-${i}`, i % 2 ? 'GB' : 'ES', 6);
      expect(clubLvl(s, s.career.clubId)).toBe(6);
      s.auto = true;
      for (let w = 0; w < 52 * 4 && s.phase === 'youth' && !s.career.retired; w++) step(s);
      if (s.career.clubsHist.length === 1) for (const id of IDS) expect(s.ev.count[id] ?? 0).toBe(0);
    }
    setFast(false);
    setCosmetic(true);
  });

  it('이벤트에 나오는 구단은 실제로 더 위인 구단이고 U15·U17 단계에서만 발생한다', () => {
    setFast(true);
    setCosmetic(false);
    let seen = 0;
    for (let i = 0; i < 40; i++) {
      const s = mk(`upx-${i}`, ['GB', 'DE', 'BR', 'JP', 'US', 'KR'][i % 6], 3);
      s.auto = true;
      for (let w = 0; w < 52 * 5 && s.phase === 'youth' && !s.career.retired; w++) {
        step(s, (d) => {
          if (!IDS.includes(d.ref) && !IDS.some((id) => d.title && d.uid && s.ev.count[id] && false)) return;
        });
        for (const id of IDS) {
          if ((s.ev.count[id] ?? 0) > 0 && s.decision && s.decision.ref === id) {
            seen++;
            expect(['U15', 'U17']).toContain(s.career.youthStage);
            expect(ageAt(s.p.birth, s.decision.w)).toBeLessThanOrEqual(16);
            const abroad = id === 'yc_trial_abroad';
            const at = { ...s, week: s.decision.w } as GameState;
            const pick = upperClubPick(at, abroad);
            expect(pick).not.toBe('');
            const cur = clubLvl(s, s.career.clubId);
            const c = getClub(pick);
            const better = clubLvl(s, pick) > cur || (clubLvl(s, pick) === cur && c.acad >= getClub(s.career.clubId).acad + 10);
            expect(better).toBe(true);
            expect(cur).toBeLessThan(6);
          }
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
    setFast(false);
    setCosmetic(true);
  });
});

describe('유스 이적 제안과 해외 제한', () => {
  it('17세 이상·U19 단계의 유스 이동은 제안 카드로만 일어나고 실력이 기준보다 높을 때만 온다', () => {
    setFast(true);
    setCosmetic(false);
    let cards = 0;
    for (let i = 0; i < 24; i++) {
      const s = mk(`yoff-${i}`, ['GB', 'DE', 'ES', 'FR'][i % 4], 3);
      s.auto = true;
      for (let w = 0; w < 52 * 6 && !s.career.retired && s.phase === 'youth'; w++) {
        for (const k of ALL_ATTRS) s.ab.a[k] = Math.max(s.ab.a[k], 13);
        step(s, (d) => {
          if (d.kind === 'offer' && d.offers.some((o) => o.yth)) {
            cards++;
            const st = s.career.youthStage;
            expect(ageAt(s.p.birth, s.week) >= 17 || st === 'U19' || st === 'RES').toBe(true);
            expect(s.career.signed).toBe(false);
            expect(d.offers.length).toBeLessThanOrEqual(2);
            for (const o of d.offers) {
              expect(['youth', 'scholar', 'pro']).toContain(o.yth);
              expect(o.note).toBeTruthy();
              expect(getClub(o.clubId).acad).toBeGreaterThan(0);
              expect(d.choices[d.choices.length - 1].label).toBe('현 소속팀에 남는다');
            }
          }
        });
      }
    }
    expect(cards).toBeGreaterThan(0);
    setFast(false);
    setCosmetic(true);
  });

  it('18세 미만 선수에게 해외 구단 제안이 오지 않는다 (EU·EEA 16세 이상 예외)', () => {
    setFast(true);
    setCosmetic(false);
    let checked = 0;
    for (let i = 0; i < 30; i++) {
      const code = ['GB', 'DE', 'KR', 'JP', 'BR', 'FR', 'NG', 'IR', 'ES', 'PT'][i % 10];
      const s = mk(`fx-${i}`, code, 4);
      s.auto = true;
      for (let w = 0; w < 52 * 5 && !s.career.retired; w++) {
        for (const k of ALL_ATTRS) s.ab.a[k] = Math.max(s.ab.a[k], i % 2 ? 15 : 12);
        step(s, (d) => {
          if (d.kind !== 'offer') return;
          const age = ageAt(s.p.birth, s.week);
          if (age >= 18) return;
          const from = originCountry(s);
          for (const o of d.offers) {
            const to = getClub(o.clubId).country;
            checked++;
            if (to === from || to === s.p.country) continue;
            const eu = ['FR', 'DE', 'IT', 'ES', 'NL', 'PT', 'HR'];
            expect(eu.includes(from) && eu.includes(to) && age >= 16).toBe(true);
          }
        });
      }
    }
    expect(checked).toBeGreaterThan(0);
    const s = mk('fx-rule', 'KR', 4);
    expect(foreignAllowed(s, 'JP', 17)).toBe(false);
    expect(foreignAllowed(s, 'JP', 18)).toBe(true);
    const e = mk('fx-rule2', 'DE', 4);
    expect(foreignAllowed(e, 'ES', 16)).toBe(true);
    expect(foreignAllowed(e, 'ES', 15)).toBe(false);
    expect(foreignAllowed(e, 'GB', 17)).toBe(false);
    setFast(false);
    setCosmetic(true);
  });
});

describe('첫 프로 계약과 제안 수준', () => {
  it('19세 오버롤 85 선수 100명은 평균 3개 이상, 모두 수준 6 구단 제안을 받는다', () => {
    const codes = allCountries().map((c) => c.code);
    let total = 0;
    let withSix = 0;
    for (let i = 0; i < 100; i++) {
      const s = adult19(`first85-${i}`, codes[i % codes.length], 85);
      const rng = new Rng(seedState(`first85rng-${i}`));
      const offers = firstContractOffers(s, rng);
      total += offers.length;
      expect(offers.length).toBeGreaterThanOrEqual(3);
      expect(offers.some((o) => o.clubId === s.career.clubId)).toBe(true);
      const top = Math.max(...offers.map((o) => clubLvl(s, o.clubId)));
      if (top === 6) withSix++;
      for (const o of offers) {
        const c = getClub(o.clubId);
        expect(getCountry(c.country).top).toBeGreaterThanOrEqual(clubLvl(s, o.clubId));
        expect(o.first).toBe(true);
      }
      const best = offers.reduce((a, b) => (clubLvl(s, b.clubId) > clubLvl(s, a.clubId) ? b : a));
      expect(getCountry(getClub(best.clubId).country).top).toBe(6);
    }
    expect(total / 100).toBeGreaterThanOrEqual(3);
    expect(withSix).toBe(100);
  });

  it('18세 미만에게는 국내 또는 EU·EEA 구단만 첫 계약 제안으로 온다', () => {
    for (let i = 0; i < 20; i++) {
      const s = adult19(`first17-${i}`, ['KR', 'GB', 'DE', 'BR', 'IR'][i % 5], 80);
      s.week = 52 * 3 + 30;
      const age = ageAt(s.p.birth, s.week);
      expect(age).toBeLessThan(18);
      const offers = firstContractOffers(s, new Rng(seedState(`first17r-${i}`)));
      for (const o of offers) {
        const to = getClub(o.clubId).country;
        const from = originCountry(s);
        if (to === from || to === s.p.country) continue;
        expect(['FR', 'DE', 'IT', 'ES', 'NL', 'PT', 'HR']).toContain(to);
        expect(['FR', 'DE', 'IT', 'ES', 'NL', 'PT', 'HR']).toContain(from);
      }
    }
  });

  it('모든 제안 경로가 같은 선택 함수를 쓴다', () => {
    const s = adult19('path-1', 'GB', 80);
    const rng = new Rng(seedState('path-rng'));
    let c = pickStats.calls;
    firstContractOffers(s, rng);
    expect(pickStats.calls).toBeGreaterThan(c);
    const p = toPro('path-2');
    expect(marketEligible(p)).toBe(true);
    c = pickStats.calls;
    buildBatch(p, rng, true, 3);
    expect(pickStats.calls).toBeGreaterThan(c);
    c = pickStats.calls;
    freeOffers(p, rng, 2, 0);
    expect(pickStats.calls).toBeGreaterThan(c);
    c = pickStats.calls;
    genOffers(p, rng, 'window', 2);
    expect(pickStats.calls).toBeGreaterThan(c);
    const y = mk('path-3', 'GB', 3);
    y.week = 52 * 4;
    y.career.youthStage = 'U19';
    setShown(y, 60);
    c = pickStats.calls;
    youthOffers(y, rng, 2, new Set([y.career.clubId]));
    expect(pickStats.calls).toBeGreaterThan(c);
  });

  it('오버롤이 높을수록 제안 수준 분포가 위로 올라간다', () => {
    const mean: number[] = [];
    for (const ovr of [60, 70, 80, 90]) {
      let sum = 0;
      let n = 0;
      for (let i = 0; i < 30; i++) {
        const s = adult19(`dist-${ovr}-${i}`, ['GB', 'ES', 'BR', 'JP', 'KR', 'DE'][i % 6], ovr, ovr);
        const offers = firstContractOffers(s, new Rng(seedState(`distr-${ovr}-${i}`)));
        for (const o of offers) {
          sum += clubLvl(s, o.clubId);
          n++;
        }
      }
      mean.push(sum / n);
    }
    expect(mean[2]).toBeGreaterThan(mean[0]);
    expect(mean[3]).toBeGreaterThan(mean[1]);
    expect(mean[3]).toBeGreaterThanOrEqual(mean[2] - 0.05);
    expect(targetLevel(90, 95, 25)).toBe(6);
  });
});

describe('프로 계약 후 소속', () => {
  it('프로 계약 이후에는 유스 리그 기록이 늘지 않고 1군 선수단·리저브로 처리된다', () => {
    setFast(true);
    setCosmetic(false);
    let converted = 0;
    let reserveGames = 0;
    for (let i = 0; i < 24; i++) {
      const s = mk(`pro-${i}`, ['GB', 'DE', 'ES', 'KR'][i % 4], 4);
      s.auto = true;
      let frozen: { apps: number; seasons: number } | null = null;
      for (let w = 0; w < 52 * 8 && !s.career.retired; w++) {
        for (const k of ALL_ATTRS) s.ab.a[k] = Math.max(s.ab.a[k], 12);
        step(s);
        if (s.career.signed && s.phase === 'pro') {
          if (!frozen) {
            frozen = { apps: s.career.yCur.apps, seasons: s.career.ySeasons.length };
            converted++;
            expect(s.yt).toBeNull();
            expect(s.career.entry.step).toBe(2);
          } else {
            expect(s.career.yCur.apps).toBe(frozen.apps);
            expect(s.career.ySeasons.length).toBe(frozen.seasons);
            expect(s.yt).toBeNull();
          }
        }
      }
      reserveGames += s.career.resSeasons.reduce((a, r) => a + r.avail, 0) + s.career.resCur.avail;
      if (frozen) expect(s.phase === 'pro' || s.phase === 'coach' || s.phase === 'postcareer').toBe(true);
    }
    expect(converted).toBeGreaterThan(5);
    expect(reserveGames).toBeGreaterThan(0);
    setFast(false);
    setCosmetic(true);
  });

  it('21세 이하이고 1군 출전이 적으면 현 소속보다 낮은 수준의 임대 제안이 온다', () => {
    const s = toPro('loan-1', 'GB', 12);
    const rng = new Rng(seedState('loan-r'));
    s.career.contract!.role = 'backup';
    s.career.contract!.loanFrom = '';
    s.p.birth = { y: s.p.birth.y + (20 - ageAt(s.p.birth, s.week)), m: 1, d: 1 };
    s.career.cur.avail = 12;
    s.career.cur.apps = 1;
    const cur = clubLvl(s, s.career.clubId);
    let found: Offer | undefined;
    for (let i = 0; i < 60 && !found; i++) found = buildBatch(s, rng, true, 3).find((o) => o.loan);
    if (cur >= 3) {
      expect(found).toBeDefined();
      expect(clubLvl(s, found!.clubId)).toBeLessThan(cur);
    }
  });
});

describe('국가대표 선발', () => {
  function natState(seed: string): GameState {
    const s = toPro(seed, 'GB', 13);
    ensureNatCoach(s, rngOf(s));
    s.nat.coachStyle = 'attack';
    s.st.injury = null;
    s.nat.injEndW = -99;
    return s;
  }

  function rate(s: GameState, n: number, tweak: () => void): number {
    let ok = 0;
    for (let i = 0; i < n; i++) {
      tweak();
      const r = natSelect(s, new Rng(seedState(`nr-${s.cfg.seed}-${i}-${s.nat.mins10.length}-${s.career.clubId}`)), 'A');
      if (r.stage === 'called' || r.stage === 'starter') ok++;
    }
    return ok / n;
  }

  it('같은 오버롤이라도 소속 수준 6 주전이 수준 3 백업보다 소집 비율이 높다', () => {
    const s = natState('nat-1');
    const base = getCountry(s.p.country).natBase;
    setRaw(s, base - 4 + 2);
    const ids6 = leaguesOf('GB').flatMap((l) => l.clubIds).filter((id) => clubLvl(s, id) === 6);
    const ids3 = leaguesOf('GB').flatMap((l) => l.clubIds).filter((id) => clubLvl(s, id) === 3);
    s.st.sharp = 80;
    s.st.form = [6.8, 6.8, 6.8, 6.8, 6.8];
    s.career.clubId = ids6[0];
    const hi = rate(s, 120, () => { s.nat.mins10 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; });
    s.career.clubId = ids3[0];
    const lo = rate(s, 120, () => { s.nat.mins10 = [0, 0, -1, -1, -1, 0, -1, -1, 0, -1]; });
    expect(hi - lo).toBeGreaterThan(0.2);
  });

  it('소속팀 출전 비율이 높을수록 소집 비율이 높다', () => {
    const s = natState('nat-2');
    const base = getCountry(s.p.country).natBase;
    setRaw(s, base - 4 + 1);
    s.st.sharp = 80;
    s.st.form = [6.8, 6.8, 6.8, 6.8, 6.8];
    s.nat.mins10 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    const a = rate(s, 120, () => { s.nat.mins10 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; });
    const b = rate(s, 120, () => { s.nat.mins10 = [0.5, 0.5, 0.4, 0.5, 0.4, 0.5, 0.4, 0.5, 0.4, 0.5]; });
    const c = rate(s, 120, () => { s.nat.mins10 = [-1, -1, -1, 0, -1, -1, 0, -1, -1, -1]; });
    expect(a).toBeGreaterThanOrEqual(b);
    expect(b).toBeGreaterThanOrEqual(c);
    expect(a - c, JSON.stringify({ a, b, c })).toBeGreaterThan(0.2);
  });

  it('부상 중이면 선발될 수 없고 33세 이상은 나이 감점이 쌓이며 감독 성향이 비중을 20% 바꾼다', () => {
    const s = natState('nat-3');
    setRaw(s, 88);
    s.st.injury = { id: 'x', ko: '테스트', part: 'ankle', weeksLeft: 3, total: 3, early: false } as never;
    expect(natSelect(s, new Rng(seedState('inj')), 'A').stage).toBe('none');
    s.st.injury = null;
    const base = { ovr: 70, center: 70, lvl: 4, abroadTop: false, role: 0, form: 7.4, hist: 1, body: 0, age: 28 };
    const young = selComps(base, 'attack');
    const old = selComps({ ...base, age: 35 }, 'attack');
    expect(old.age).toBe(-3);
    expect(young.age).toBe(0);
    const neutral = selComps(base, 'defense');
    expect(young.form / neutral.form).toBeCloseTo(1.2 / 0.8, 5);
    expect(selComps({ ...base, lvl: 6 }, 'defense').club / selComps({ ...base, lvl: 6 }, 'attack').club).toBeCloseTo(1.2, 5);
    expect(Object.keys(STYLE_LABEL).length).toBe(4);
  });

  it('대표팀 소집 이벤트가 새 선발 결과와 연결되고 탈락 이유가 기록된다', () => {
    setFast(false);
    const s = natState('nat-4');
    const base = getCountry(s.p.country).natBase;
    setRaw(s, base + 8);
    s.st.sharp = 90;
    s.st.injury = null;
    s.nat.mins10 = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    s.nat.lastCallW = -99;
    const w = INTL_WINDOWS[0];
    s.week = Math.floor(s.week / 52) * 52 + w + (Math.floor(s.week / 52) * 52 + w < s.week ? 52 : 0);
    declineAll(s);
    intlWindow(s, rngOf(s), w);
    expect(['called', 'starter']).toContain(s.nat.stage);
    expect(s.decision).not.toBeNull();
    expect(['nat_first_call', 'nat_call']).toContain(s.decision!.title ? s.decision!.ref : '');
    declineAll(s);
    setRaw(s, base - 30);
    s.nat.mins10 = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
    s.nat.lastCallW = -99;
    s.week += 52;
    intlWindow(s, rngOf(s), w);
    expect(s.nat.stage).toBe('none');
    expect(s.log.some((l) => l.title === '대표팀 탈락')).toBe(true);
    expect(s.nat.lastWhy.length).toBeGreaterThan(0);
    expect(s.nat.lastWhy.length).toBeLessThanOrEqual(2);
  });

  it('국가별 대표팀 후보 풀은 시즌마다 나이를 먹고 포지션별 4~6명을 유지한다', () => {
    const s = natState('nat-5');
    const r = natSelect(s, new Rng(seedState('p1')), 'A');
    expect(r.rank).toBeGreaterThan(0);
    const before = s.nat.pool.A!.map((m) => m.age).reduce((a, b) => a + b, 0) / s.nat.pool.A!.length;
    s.week += 52 * 3;
    natSelect(s, new Rng(seedState('p2')), 'A');
    const pool = s.nat.pool.A!;
    for (const pos of ['GK', 'CB', 'LB', 'RB', 'DM', 'CM', 'AM', 'LW', 'RW', 'ST']) {
      const n = pool.filter((m) => m.pos === pos).length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(6);
    }
    const after = pool.reduce((a, m) => a + m.age, 0) / pool.length;
    expect(Math.abs(after - before)).toBeLessThan(4);
    expect(swOf(0)).toBe(0);
  });
});
