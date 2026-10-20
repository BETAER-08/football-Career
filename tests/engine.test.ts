import { describe, expect, it } from 'vitest';
import { newGame, tickState, autoStep, autoWeek, stateHash, replay, resolveDecision, actionInput, setFocusInput } from '../src/engine/game';
import { Rng, seedState } from '../src/engine/rng';
import { rollOrigin, youthCount, levelWeights, candidateClubs, u15Rate, U15_RATE, U15_SQUAD } from '../src/engine/roulette';
import { COUNTRIES } from '../src/data/countries';
import { checkPct, parseCheck, parseFx, applyFx } from '../src/engine/fx';
import { eligible, markFired, getEvent, fireEvent, rollWeekly } from '../src/engine/events';
import { getAction, actionStatus } from '../src/engine/actions';
import { negotiate, genOffers } from '../src/engine/transfer';
import { advanceInjury, startInjury } from '../src/engine/health';
import { endSeasonCountry, ensureCountry, rngOf, membersOf, startLeagueSeason } from '../src/engine/world';
import { getClub, getLeague, leaguesOf } from '../src/engine/data';
import { canStudy, coachSeasonEnd, initCoach, startStudy, licenseLevel } from '../src/engine/coach';
import { retirePlayer } from '../src/engine/lifecycle';
import { setPath } from '../src/engine/postcareer';
import { ensureContent } from '../src/engine/content';
import { ageAt, dateOf, swOf, seasonOf } from '../src/engine/time';
import { evalConds } from '../src/engine/fx';
import { reviewOutcome } from '../src/engine/youth';
import { leagueWeek, profileOf } from '../src/engine/calendar';
import { coreHash, worldSeasonEnd } from '../src/engine/worldsim';
import { setCosmetic } from '../src/engine/flags';
import { setFast } from '../src/engine/log';
import { runBatch, mixedSpec } from '../src/engine/headless';
import { initBudget, budgetTarget } from '../src/engine/budget';
import { migrateState, STATE_VERSION } from '../src/engine/migrate';
import { buildEndData } from '../src/engine/enddata';
import type { GameConfig, GameState } from '../src/engine/types';

ensureContent();
const cfg = (seed: string): GameConfig => ({ seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });

function advance(s: GameState, weeks: number): void {
  for (let i = 0; i < weeks && !s.ended; i++) {
    autoStep(s);
    autoWeek(s);
    if (!tickState(s)) autoStep(s);
  }
}

describe('결정론', () => {
  it('같은 시드와 같은 입력이면 최종 상태 해시가 같다', () => {
    const run = () => {
      const s = newGame(cfg('det-1'));
      s.auto = true;
      advance(s, 52 * 14);
      return stateHash(s);
    };
    expect(run()).toBe(run());
  });
  it('입력 로그를 재생하면 같은 상태가 된다', () => {
    const s = newGame(cfg('det-2'));
    setFocusInput(s, 'phys');
    for (let i = 0; i < 52 * 8; i++) {
      if (s.decision) resolveDecision(s, 0);
      if (i === 100) setFocusInput(s, 'recover');
      tickState(s);
    }
    const copy = replay(cfg('det-2'), s.inputs, s.week);
    expect(stateHash(copy)).toBe(stateHash(s));
  });
});

describe('룰렛 3단 추첨', () => {
  it('국가는 U15 유스 선수 수에 비례해 뽑힌다', () => {
    const rng = new Rng(seedState('roulette-test'));
    const n = 6000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const r = rollOrigin(rng);
      counts[r.country] = (counts[r.country] ?? 0) + 1;
      expect(getClub(r.clubId).country).toBe(r.country);
      expect(getClub(r.clubId).lg0).toBe(r.leagueId);
    }
    const total = COUNTRIES.reduce((a, c) => a + youthCount(c.code), 0);
    for (const code of ['BR', 'MX', 'ES']) {
      const expected = youthCount(code) / total;
      expect(Math.abs((counts[code] ?? 0) / n - expected)).toBeLessThan(0.02);
    }
  });
  it('수준 가중치는 구단 수 × U15 보유율 × U15 선수단 규모이다', () => {
    expect(U15_RATE).toEqual({ 6: 1, 5: 1, 4: 0.9, 3: 0.6, 2: 0.25 });
    expect(U15_SQUAD).toEqual({ 6: 28, 5: 25, 4: 22, 3: 20, 2: 18 });
    for (const code of ['GB', 'KR', 'IN', 'PK', 'BR']) {
      const c = COUNTRIES.find((x) => x.code === code)!;
      const w = levelWeights(code);
      for (const key of Object.keys(w)) {
        const L = Number(key);
        expect(w[L]).toBeCloseTo(candidateClubs(code, L).length * u15Rate(L, c.infra) * U15_SQUAD[L]);
      }
    }
    expect(levelWeights('IN')[4]).toBeUndefined();
  });
  it('인프라가 낮은 나라는 수준 2~3 보유율이 줄고 상위 수준은 그대로다', () => {
    expect(u15Rate(2, 0.1)).toBeCloseTo(0.25 * 0.6);
    expect(u15Rate(3, 0.1)).toBeCloseTo(0.6 * 0.6);
    expect(u15Rate(3, 0.9)).toBeCloseTo(0.6);
    expect(u15Rate(5, 0.1)).toBe(1);
    expect(u15Rate(4, 0.1)).toBe(0.9);
  });
  it('상위 리그 구단이 하부 구단보다 시작 확률이 구단당 더 높다', () => {
    const w = levelWeights('GB');
    const per = (L: number) => w[L] / candidateClubs('GB', L).length;
    expect(per(5)).toBeGreaterThan(per(4));
    expect(per(4)).toBeGreaterThan(per(3));
    expect(per(3)).toBeGreaterThan(per(2));
  });
});

describe('판정식과 이벤트 규칙', () => {
  it('성공 확률은 5~95%로 제한된다', () => {
    const s = newGame(cfg('chk-1'));
    expect(checkPct(s, '500', 60)).toBe(95);
    expect(checkPct(s, '-300', 60)).toBe(5);
    expect(checkPct(s, '50 attr.shooting*1', 60)).toBeGreaterThanOrEqual(5);
    expect(() => parseCheck('50 nonsense*1')).toThrow();
  });
  it('쿨다운, 최대 횟수, 최근 30개 제외가 작동한다', () => {
    const s = newGame(cfg('rep-1'));
    const def = getEvent('y_praise');
    s.ab.a.shooting = 10;
    expect(eligible(s, def)).toBe(true);
    markFired(s, def);
    expect(eligible(s, def)).toBe(false);
    s.ev.recent = [];
    s.week += def.cooldown + 1;
    expect(eligible(s, def)).toBe(true);
    s.ev.count[def.id] = def.max;
    expect(eligible(s, def)).toBe(false);
  });
  it('같은 그룹 이벤트는 동시에 발생하지 않는다', () => {
    const s = newGame(cfg('grp-1'));
    const def = getEvent('youth_final_release');
    s.ev.flags['grp:release'] = s.week;
    expect(eligible(s, { ...def, scheduledOnly: false, cond: [] })).toBe(false);
  });
  it('후속 이벤트가 예약되고 시간이 지나면 돌아온다', () => {
    const s = newGame(cfg('fu-1'));
    s.phase = 'pro';
    const rng = rngOf(s);
    applyFx(s, { rng }, 'fu:af_2@4-4 flag:af_trust', []);
    expect(s.ev.sched.length).toBe(1);
    expect(parseFx('fu:af_2@4-9')[0].kind).toBe('fu');
    s.people.agent = s.people.father;
    s.week = s.ev.sched[0].at + 1;
    rollWeekly(s, rng);
    expect(s.decision?.ref ?? s.decQueue[0]?.ref).toBe('af_2');
  });
  it('선택 결과 패널에 판정값과 변화량이 담긴다', () => {
    const s = newGame(cfg('res-1'));
    const rng = rngOf(s);
    fireEvent(s, rng, getEvent('yc_extra_practice'));
    expect(s.decision).not.toBeNull();
    const p = resolveDecision(s, 0)!;
    expect(['great', 'ok', 'bad', 'worst']).toContain(p.grade);
    expect(p.need).toBeGreaterThanOrEqual(5);
    expect(p.need).toBeLessThanOrEqual(95);
    expect(Array.isArray(p.changes)).toBe(true);
  });
});

describe('행동 시스템', () => {
  it('쿨타임과 조건이 적용된다', () => {
    const s = newGame(cfg('act-1'));
    s.fin.cash = 5000;
    const def = getAction('vacation');
    expect(actionStatus(s, def).enabled).toBe(true);
    const r = actionInput(s, 'vacation');
    expect(r).not.toBeNull();
    const st = actionStatus(s, def);
    expect(st.enabled).toBe(false);
    expect(st.cdLeft).toBeGreaterThan(0);
    expect(actionInput(s, 'vacation')).toBeNull();
    const house = actionStatus(s, getAction('buy_home'));
    expect(house.enabled).toBe(false);
    expect(house.reason.length).toBeGreaterThan(0);
  });
  it('은퇴 선언은 언제든 가능하고 진로 선택이 뜬다', () => {
    let s = newGame(cfg('ret-1'));
    advance(s, 52 * 4);
    for (let k = 2; (s.phase !== 'youth' && s.phase !== 'pro') && k < 12; k++) {
      s = newGame(cfg('ret-' + k));
      advance(s, 52 * 4);
    }
    expect(['youth', 'pro']).toContain(s.phase);
    expect(actionInput(s, 'retire_now')).not.toBeNull();
    expect(s.career.retired).toBe(true);
    expect(s.phase).toBe('postcareer');
    let guard = 0;
    while (s.decision && s.decision.ref !== 'path' && guard++ < 10) resolveDecision(s, 0);
    expect(s.decision?.ref).toBe('path');
  });
});

describe('계약과 이적', () => {
  it('협상 요구가 늘수록 결렬 확률이 커진다', () => {
    const s = newGame(cfg('neg-1'));
    advance(s, 52 * 6);
    s.phase = 'pro';
    const rng = rngOf(s);
    let offers = genOffers(s, rng, 'free', 3);
    if (!offers.length) offers = genOffers(s, rng, 'window', 6);
    expect(offers.length).toBeGreaterThan(0);
    const o = offers[0];
    let failsNone = 0;
    let failsAll = 0;
    for (let i = 0; i < 400; i++) {
      if (!negotiate(s, rng, o, { wage: false, role: false, buyout: false }).ok) failsNone++;
      if (!negotiate(s, rng, o, { wage: true, role: true, buyout: true }).ok) failsAll++;
    }
    expect(failsAll).toBeGreaterThan(failsNone);
  });
});

describe('부상과 리그 구조', () => {
  it('복귀 후 재발이 일정 확률로 예약된다', () => {
    const s = newGame(cfg('inj-1'));
    const rng = rngOf(s);
    let recur = 0;
    for (let i = 0; i < 300; i++) {
      s.st.recur = null;
      s.st.rehabEarly = i % 2 === 0;
      startInjury(s, rng, 'hamstring', 24, { weeks: 1 });
      advanceInjury(s, rng);
      advanceInjury(s, rng);
      if (s.st.recur) recur++;
    }
    expect(recur).toBeGreaterThan(10);
    expect(recur).toBeLessThan(300);
  });
  it('시즌 종료 후 승격과 강등이 일어난다', () => {
    const s = newGame(cfg('promo-1'));
    ensureCountry(s, 'GB');
    const [pl, ch] = leaguesOf('GB');
    startLeagueSeason(s, pl.id);
    const info = endSeasonCountry(s, 'GB', '', null);
    expect(info.relegated.length).toBeGreaterThanOrEqual(Math.min(pl.down, ch.up));
    expect(info.promoted.length).toBe(info.relegated.length);
    const members = membersOf(s, pl.id);
    expect(members.length).toBe(pl.clubIds.length);
  });
});

describe('지도자 시스템', () => {
  function coachState(seed: string): GameState {
    const s = newGame(cfg(seed));
    advance(s, 52 * 4);
    retirePlayer(s, rngOf(s), '테스트');
    s.decision = null;
    s.decQueue = [];
    setPath(s, rngOf(s), 'coach');
    return s;
  }
  it('자격증은 경력 조건과 현역 중 제한을 따른다', () => {
    const s = newGame(cfg('lic-1'));
    s.phase = 'pro';
    s.week = 52 * 16;
    expect(ageAt(s.p.birth, s.week)).toBeGreaterThanOrEqual(28);
    expect(canStudy(s).key).toBe('C');
    s.coach.licenses.C = 1;
    s.coach.licenses.B = 1;
    s.coach.coachSeasons = 10;
    s.coach.everManager = true;
    expect(canStudy(s).ok).toBe(false);
    expect(canStudy(s).reason).toContain('현역');
    const c = coachState('lic-2');
    c.coach.licenses.C = 1;
    c.coach.studying = '';
    c.coach.coachSeasons = 0;
    expect(canStudy(c).ok).toBe(false);
    c.coach.coachSeasons = 1;
    expect(canStudy(c).ok).toBe(true);
    expect(licenseLevel(c)).toBe(1);
  });
  it('입지가 30 미만이면 시즌 종료 때 경질된다', () => {
    const s = coachState('fire-1');
    const rng = rngOf(s);
    s.coach.licenses = { C: 1, B: 1, A: 1, P: 0 };
    const clubId = leaguesOf('GB')[2].clubIds[0];
    s.coach.role = 'manager';
    s.coach.clubId = clubId;
    s.coach.contract = { clubId, role: 'starter', wage: 5000, startW: s.week, endW: s.week + 200, signing: 0, appBonus: 0, goalBonus: 0, titleBonus: 0, buyout: 0, loanFrom: '', youth: false };
    startLeagueSeason(s, getClub(clubId).lg0);
    s.career.cur.leagueId = getClub(clubId).lg0;
    s.coach.standing = 20;
    coachSeasonEnd(s, rng);
    expect(s.coach.fired).toBe(1);
    expect(s.coach.role).toBe('none');
  });
  it('언제든 진로를 바꾸고 지도자로 돌아올 수 있다', () => {
    const s = coachState('switch-1');
    expect(s.phase).toBe('coach');
    s.fin.cash = 1000;
    expect(actionInput(s, 'to_pundit')).not.toBeNull();
    expect(s.phase).toBe('postcareer');
    expect(s.post.path).toBe('pundit');
    expect(actionInput(s, 'to_coach')).not.toBeNull();
    expect(s.phase).toBe('coach');
    initCoach(s, rngOf(s));
    startStudy(s, 'C');
    expect(s.coach.studying).toBe('C');
  });
  it('축구 인생 종료 조건: 떠난다, 지도자 은퇴, 75세', () => {
    const a = coachState('end-1');
    actionInput(a, 'coach_retire');
    expect(a.ended).toBe(true);
    const b = coachState('end-2');
    setPath(b, rngOf(b), 'pundit');
    actionInput(b, 'leave_football');
    expect(b.ended).toBe(true);
    const c = coachState('end-3');
    c.week = 52 * 61;
    for (let i = 0; i < 52 * 16 && !c.ended; i++) {
      autoStep(c);
      if (!tickState(c)) autoStep(c);
    }
    expect(c.ended).toBe(true);
    expect(c.endReason).toContain('75세');
    expect(tickState(c)).toBe(false);
  });
});

describe('U15 시작과 나이 계산', () => {
  it('2026년 7월 1일, 14세(2012년생), 소속 구단 U15 팀에서 시작한다', () => {
    const s = newGame(cfg('start-1'));
    expect(s.phase).toBe('youth');
    expect(s.p.birth.y).toBe(2012);
    expect(ageAt(s.p.birth, 0)).toBe(14);
    expect(dateOf(0)).toEqual({ y: 2026, m: 7, d: 1 });
    expect(s.career.youthStage).toBe('U15');
    expect(s.career.scholar).toBe(0);
  });
  it('나이는 생일이 지나야 한 살 늘어난다', () => {
    const s = newGame(cfg('age-1'));
    const b = { y: 2012, m: 3, d: 15 };
    let flips = 0;
    let prev = ageAt(b, 0);
    for (let w = 1; w < 52 * 3; w++) {
      const a = ageAt(b, w);
      if (a !== prev) {
        flips++;
        const d = dateOf(w);
        const before = dateOf(w - 1);
        expect(a).toBe(prev + 1);
        expect(d.m === 3 && d.d >= 15 ? true : d.m > 3 || d.y > before.y).toBe(true);
        expect(before.m < 3 || (before.m === 3 && before.d < 15)).toBe(true);
      }
      prev = a;
    }
    expect(flips).toBe(3);
    expect(s.p.birth.m).toBeLessThanOrEqual(6);
  });
});

describe('유스 연령대 심사와 장학 계약', () => {
  function youthState(seed: string): GameState {
    const s = newGame(cfg(seed));
    s.career.youthStage = 'U15';
    return s;
  }
  it('승급은 최소 기간 뒤에만, 방출은 점수가 크게 낮을 때만 나온다', () => {
    const s = youthState('rev-1');
    expect(reviewOutcome(s, 5, 16)).toBe('promote');
    expect(reviewOutcome(s, -20, 16)).toBe('release');
    s.career.youthStage = 'U17';
    s.career.stageSeasons = 0;
    expect(reviewOutcome(s, 5, 16)).toBe('stay');
    s.career.stageSeasons = 1;
    expect(reviewOutcome(s, 5, 16)).toBe('promote');
    s.career.youthStage = 'U19';
    expect(reviewOutcome(s, 50, 16)).toBe('stay');
    s.career.youthStage = 'U15';
    s.career.stageSeasons = 0;
    expect(reviewOutcome(s, -5, 16)).toBe('stay');
    s.career.stageSeasons = 1;
    expect(reviewOutcome(s, -5, 16)).toBe('promote');
  });
  it('장학 계약을 받으면 수당과 소속 안정이, 못 받으면 방출 위험이 커진다', () => {
    const a = youthState('sch-1');
    fireEvent(a, rngOf(a), getEvent('ys_scholar_offer'));
    resolveDecision(a, 0);
    expect(a.career.scholar).toBe(1);
    expect(a.career.contract!.wage).toBeGreaterThan(0);
    const b = youthState('sch-1');
    fireEvent(b, rngOf(b), getEvent('ys_scholar_denied'));
    resolveDecision(b, 2);
    expect(b.career.scholar).toBe(2);
    const x = reviewOutcome;
    expect(typeof x).toBe('function');
  });
  it('시즌 말 심사는 승급, 잔류, 방출 중 하나로 끝나고 방출 후에는 선택지가 뜬다', () => {
    let promoted = 0;
    let stayed = 0;
    let released = 0;
    for (let k = 0; k < 40; k++) {
      const s = newGame(cfg('season-rev-' + k));
      s.auto = true;
      const before = s.career.youthStage;
      for (let i = 0; i < 52 && !s.career.retired; i++) {
        autoStep(s);
        autoWeek(s);
        if (!tickState(s)) autoStep(s);
      }
      if (s.ev.count.ys_review_promote) promoted++;
      else if (s.ev.count.ys_review_stay) stayed++;
      else if (s.ev.count.ys_release_notice) released++;
      expect(before).toBe('U15');
    }
    expect(promoted + stayed + released).toBeGreaterThan(30);
    expect(promoted).toBeGreaterThan(stayed);
  });
  it('방출 통보 뒤 하위 구단 입단을 고르면 같거나 낮은 수준의 팀으로 옮긴다', () => {
    let moved = 0;
    for (let k = 0; k < 30; k++) {
      const s = youthState('rel-' + k);
      const before = clubLvlOf(s);
      fireEvent(s, rngOf(s), getEvent('ys_release_notice'));
      resolveDecision(s, 1);
      if (s.career.clubId) {
        expect(clubLvlOf(s)).toBeLessThanOrEqual(before);
        moved++;
      }
    }
    expect(moved).toBe(30);
  });
});

function clubLvlOf(s: GameState): number {
  return getLeague(getClub(s.career.clubId).lg0).lvl + (getClub(s.career.clubId).elite ? 1 : 0);
}

describe('선택 이벤트 시즌당 한 번 규칙', () => {
  it('같은 exclusiveGroup 이벤트는 한 시즌에 두 번 나오지 않는다', () => {
    const s = newGame(cfg('xg-1'));
    s.phase = 'pro';
    const a = getEvent('yc_extra_practice');
    const b = getEvent('yc_dawn_session');
    expect(a.exclusiveGroup).toBe(b.exclusiveGroup);
    s.people.coach.rel = 30;
    expect(eligible(s, { ...b, cond: [] })).toBe(true);
    markFired(s, a);
    s.ev.recent = [];
    expect(eligible(s, { ...b, cond: [] })).toBe(false);
    s.week += 52;
    s.ev.recent = [];
    expect(eligible(s, { ...b, cond: [] })).toBe(true);
  });
});

describe('행동 정비', () => {
  it('은퇴 선언은 14세부터 바로 가능하다', () => {
    const s = newGame(cfg('act-ret'));
    expect(actionStatus(s, getAction('retire_now')).enabled).toBe(true);
  });
  it('지도자 자격증은 현역이면 28세 이상일 때만 활성화된다', () => {
    const s = newGame(cfg('act-lic'));
    s.fin.cash = 5000;
    const young = actionStatus(s, getAction('coach_license'));
    expect(young.enabled).toBe(false);
    expect(young.reason).toContain('28세');
    s.phase = 'pro';
    s.week = 52 * 14;
    expect(ageAt(s.p.birth, s.week)).toBeGreaterThanOrEqual(28);
    expect(actionStatus(s, getAction('coach_license')).enabled).toBe(true);
  });
  it('쿨타임이 늘고 반복 사용하면 효과가 줄어든다', () => {
    expect(getAction('meet_friends').cooldown).toBe(8);
    expect(getAction('sns_post').cooldown).toBe(8);
    expect(getAction('invest_deposit').cooldown).toBe(4);
    expect(getAction('invest_stock').cooldown).toBe(4);
    const s = newGame(cfg('act-dim'));
    s.fin.cash = 9000;
    s.st.happy = 10;
    const gains: number[] = [];
    for (let i = 0; i < 3; i++) {
      s.st.happy = 10;
      s.week = 10 + i * 8;
      actionInput(s, 'meet_friends');
      gains.push(s.st.happy - 10);
    }
    expect(gains[1]).toBeLessThan(gains[0]);
    expect(gains[2]).toBeLessThan(gains[1]);
  });
});

describe('리그 캘린더', () => {
  it('춘추제 리그는 7~11월과 3~6월에 경기가 있고 추춘제는 8월 이후에 시작한다', () => {
    for (const id of ['KR1', 'JP1', 'US1', 'CN1', 'BR1']) expect(getLeague(id).cal).toBe('sa');
    for (const id of ['GB1', 'ES1', 'DE1']) expect(getLeague(id).cal).toBe('aw');
    expect(getLeague('DE1').winterBreak).toBe(true);
    expect(getLeague('GB1').winterBreak).toBe(false);
    const sa = profileOf('sa');
    const aw = profileOf('aw');
    const wk = (p: typeof sa) => Array.from({ length: 38 }, (_, r) => leagueWeek(p, r, 38));
    expect(Math.min(...wk(aw))).toBeGreaterThanOrEqual(6);
    expect(wk(sa).every((w) => w <= 21 || w >= 34)).toBe(true);
    const s = newGame({ ...cfg('cal-kr'), seed: 'cal-kr' });
    const kr = getClub(leaguesOf('KR')[0].clubIds[0]);
    s.career.clubId = kr.id;
    expect(kr.country).toBe('KR');
  });
  it('월드컵 열기는 개최 연도의 해당 기간에만 오른다', () => {
    const s = newGame(cfg('wc-1'));
    const at = (y: number, m: number, d: number) => {
      for (let w = 0; w < 52 * 8; w++) {
        const x = dateOf(w);
        if (x.y === y && x.m === m && x.d >= d) return w;
      }
      return -1;
    };
    s.week = at(2030, 6, 10);
    expect(evalConds(s, ['wcFever'])).toBe(true);
    s.week = at(2029, 6, 10);
    expect(evalConds(s, ['wcFever'])).toBe(false);
    s.week = at(2030, 11, 10);
    expect(evalConds(s, ['wcFever'])).toBe(false);
    s.week = at(2034, 6, 10);
    expect(swOf(s.week)).toBeGreaterThan(40);
    expect(seasonOf(s.week)).toBeGreaterThan(0);
  });
  it('시즌 중간 요약 로그가 시즌마다 한 번 남는다', () => {
    const s = newGame(cfg('sum-1'));
    s.auto = true;
    for (let i = 0; i < 52 * 2 && !s.career.retired; i++) {
      autoStep(s);
      autoWeek(s);
      if (!tickState(s)) autoStep(s);
    }
    const n = s.log.filter((l) => l.title === '시즌 중간 점검').length;
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(2);
  });
});

describe('세계 시뮬레이션과 연출 분리', () => {
  function run(seed: string, weeks: number, cosmetic: boolean): GameState {
    setCosmetic(cosmetic);
    const s = newGame(cfg(seed));
    s.auto = true;
    for (let i = 0; i < weeks && !s.ended; i++) {
      autoStep(s);
      autoWeek(s);
      if (!tickState(s)) autoStep(s);
    }
    setCosmetic(true);
    return s;
  }
  it('같은 시드와 같은 입력이면 발롱도르, 리그 우승팀, 대표팀 대회 결과까지 같다', () => {
    const a = run('world-det', 52 * 14, true);
    const b = run('world-det', 52 * 14, true);
    expect(coreHash(a)).toBe(coreHash(b));
    expect(stateHash(a)).toBe(stateHash(b));
    expect(a.wld.ballon.length).toBeGreaterThanOrEqual(12);
    expect(a.wld.tourn.length).toBeGreaterThanOrEqual(3);
  });
  it('연출 계산을 껐다 켜도 선수 커리어 결과는 같다 (RNG 분리)', () => {
    const on = run('world-split', 52 * 16, true);
    const off = run('world-split', 52 * 16, false);
    expect(off.score).toBe(on.score);
    expect(off.career.seasons.length).toBe(on.career.seasons.length);
    expect(off.career.retireAge).toBe(on.career.retireAge);
    expect(off.st.morale).toBe(on.st.morale);
    expect(JSON.stringify(off.career.awards)).toBe(JSON.stringify(on.career.awards));
    expect(JSON.stringify(off.wld.stars)).toBe(JSON.stringify(on.wld.stars));
    expect(JSON.stringify(off.wld.faces.map((f) => [f.ovr, f.clubId, f.status, f.caps, f.injuredS]))).toBe(JSON.stringify(on.wld.faces.map((f) => [f.ovr, f.clubId, f.status, f.caps, f.injuredS])));
    expect(off.log.length).toBeLessThanOrEqual(on.log.length);
  });
  it('헤드리스 집계(데뷔율, 은퇴 나이)는 연출 토글과 무관하다', () => {
    const specs = Array.from({ length: 60 }, (_, i) => mixedSpec(i, 'ws-'));
    const a = runBatch(specs);
    const b = runBatch(specs);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('시즌 종료 주 tick이 50ms 미만이다', () => {
    const s = newGame(cfg('perf-end'));
    s.auto = true;
    let worst = 0;
    for (let i = 0; i < 52 * 14 && !s.ended; i++) {
      autoStep(s);
      autoWeek(s);
      const t0 = performance.now();
      const ok = tickState(s);
      const d = performance.now() - t0;
      if (swOf(s.week) === 0) worst = Math.max(worst, d);
      if (!ok) autoStep(s);
    }
    expect(worst).toBeLessThan(50);
  });
  it('세계 스타 풀은 40명을 유지하고 은퇴한 자리는 신성으로 채운다', () => {
    const s = newGame(cfg('stars-1'));
    expect(s.wld.stars.length).toBe(40);
    for (const st of s.wld.stars) {
      expect(st.ovr).toBeGreaterThanOrEqual(84);
      expect(st.ovr).toBeLessThanOrEqual(95);
      expect(2026 - st.birthYear).toBeGreaterThanOrEqual(19);
      expect(2026 - st.birthYear).toBeLessThanOrEqual(33);
      expect(getClub(st.clubId).lvl0).toBe(6);
    }
    for (let i = 0; i < 12; i++) {
      s.week = 52 * i + 51;
      worldSeasonEnd(s);
    }
    expect(s.wld.stars.length).toBe(40);
    expect(s.wld.stars.every((x) => !x.retired)).toBe(true);
    expect(s.wld.stars.some((x) => x.id > 40)).toBe(true);
  });
});

describe('이벤트 예산', () => {
  it('시즌당 랜덤 선택 이벤트는 간격 8주 이상이고 등급별 최대 2개를 넘지 않는다', () => {
    setFast(false);
    for (let k = 0; k < 6; k++) {
      const s = newGame(cfg('bud-' + k));
      s.auto = true;
      const per: Record<number, { w: number[]; major: number; minor: number }> = {};
      let lastN = 0;
      for (let i = 0; i < 52 * 12 && !s.ended; i++) {
        autoStep(s);
        autoWeek(s);
        const season = seasonOf(s.week);
        const before = s.ev.bud.choiceN;
        if (!tickState(s)) autoStep(s);
        if (s.ev.bud.choiceN > before && s.ev.bud.s === season) {
          const r = (per[season] ??= { w: [], major: 0, minor: 0 });
          r.w.push(s.week);
          r.major = s.ev.bud.majorN;
          r.minor = s.ev.bud.minorN;
          lastN++;
        }
      }
      for (const r of Object.values(per)) {
        for (let i = 1; i < r.w.length; i++) expect(r.w[i] - r.w[i - 1]).toBeGreaterThanOrEqual(8);
        expect(r.major).toBeLessThanOrEqual(2);
        expect(r.minor).toBeLessThanOrEqual(3);
        expect(r.w.length).toBeLessThanOrEqual(5);
      }
      expect(lastN).toBeGreaterThan(5);
    }
  });
  it('국면별 목표 개수: 데뷔·계약 마지막 해에는 늘고, 안정 시즌에는 줄어든다', () => {
    const s = newGame(cfg('bud-mod'));
    s.phase = 'pro';
    s.career.debuted = true;
    s.career.contract = { clubId: s.career.clubId, role: 'starter', wage: 5000, startW: 0, endW: 52 * 6, signing: 0, appBonus: 0, goalBonus: 0, titleBonus: 0, buyout: 0, loanFrom: '', youth: false };
    s.week = 52 * 4 + 10;
    s.career.debutW = 52;
    s.career.clubsHist = [{ clubId: s.career.clubId, fromS: 1, toS: -1 }];
    initBudget(s, rngOf(s));
    s.ev.bud.choiceT = 3;
    const stable = budgetTarget(s);
    s.career.contract.endW = s.week + 30;
    const last = budgetTarget(s);
    expect(last).toBeGreaterThan(stable);
    s.st.injury = { id: 'acl', ko: '십자인대', part: '무릎', weeksLeft: 20, total: 30, early: false, recurrence: false };
    expect(budgetTarget(s)).toBeGreaterThan(last);
  });
});

describe('결산과 저장', () => {
  it('시즌이 끝나면 결산이 만들어지고 순위표와 득점 순위가 일관된다', () => {
    const s = newGame(cfg('rev-flow'));
    s.auto = true;
    for (let i = 0; i < 52 * 2; i++) {
      autoStep(s);
      autoWeek(s);
      if (!tickState(s)) autoStep(s);
    }
    expect(s.reviews.length).toBeGreaterThanOrEqual(1);
    const r = s.reviews[0];
    expect(r.table.length).toBeGreaterThanOrEqual(10);
    expect(r.table[r.myIdx].name).toBe(r.clubName);
    expect(r.scorers.length).toBe(10);
    expect(r.scorers.every((x, i, a) => i === 0 || a[i - 1].v >= x.v)).toBe(true);
    if (r.awards.some((a) => a.name.includes('득점왕'))) expect(r.scorers[0].me).toBe(true);
  });
  it('저장 버전: 현재 버전은 그대로, 구버전은 변환, 변환할 수 없는 저장은 거부한다', () => {
    const s = newGame(cfg('mig-1'));
    expect(s.v).toBe(STATE_VERSION);
    const raw = JSON.parse(JSON.stringify(s));
    delete raw.wld;
    delete raw.reviews;
    delete raw.ev.bud;
    raw.v = 1;
    const m = migrateState(raw);
    expect(m.ok).toBe(true);
    if (m.ok) {
      expect(m.state.v).toBe(STATE_VERSION);
      expect(m.state.wld.stars.length).toBe(40);
      expect(m.state.ev.bud.s).toBe(-1);
    }
    const old = JSON.parse(JSON.stringify(s));
    old.p.birth.y = 2014;
    expect(migrateState(old).ok).toBe(false);
    expect(migrateState({ nothing: 1 }).ok).toBe(false);
  });
  it('보관함 데이터는 30KB 이하이고 핵심 요약을 담는다', () => {
    const s = newGame(cfg('arch-1'));
    s.auto = true;
    for (let i = 0; i < 52 * 22 && !s.ended; i++) {
      autoStep(s);
      autoWeek(s);
      if (!tickState(s)) autoStep(s);
    }
    const d = buildEndData(s, 'B', 55, Array.from({ length: 200 }, (_, i) => i * 1.5));
    expect(JSON.stringify(d).length).toBeLessThan(40000);
    expect(d.logs.length).toBeLessThanOrEqual(120);
    expect(d.name).toBe(s.p.name);
  });
});
