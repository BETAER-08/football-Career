import { describe, expect, it } from 'vitest';
import { newGame, tickState, autoStep, autoWeek, stateHash, replay, resolveDecision, actionInput, setFocusInput } from '../src/engine/game';
import { Rng, seedState } from '../src/engine/rng';
import { rollOrigin, levelWeights } from '../src/engine/roulette';
import { COUNTRIES } from '../src/data/countries';
import { checkPct, parseCheck, parseFx, applyFx } from '../src/engine/fx';
import { eligible, markFired, getEvent, fireEvent, rollWeekly, P_CHOICE, P_PASSIVE } from '../src/engine/events';
import { getAction, actionStatus } from '../src/engine/actions';
import { negotiate, genOffers } from '../src/engine/transfer';
import { advanceInjury, startInjury } from '../src/engine/health';
import { endSeasonCountry, ensureCountry, rngOf, membersOf, startLeagueSeason } from '../src/engine/world';
import { getClub, leaguesOf } from '../src/engine/data';
import { canStudy, coachSeasonEnd, initCoach, startStudy, licenseLevel } from '../src/engine/coach';
import { retirePlayer } from '../src/engine/lifecycle';
import { setPath } from '../src/engine/postcareer';
import { ensureContent } from '../src/engine/content';
import { ageAt } from '../src/engine/time';
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
  it('국가는 현역 프로 선수 수에 비례해 뽑힌다', () => {
    const rng = new Rng(seedState('roulette-test'));
    const n = 6000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const r = rollOrigin(rng);
      counts[r.country] = (counts[r.country] ?? 0) + 1;
      expect(getClub(r.clubId).country).toBe(r.country);
      expect(getClub(r.clubId).lg0).toBe(r.leagueId);
    }
    const total = COUNTRIES.reduce((a, c) => a + c.pros, 0);
    for (const code of ['BR', 'MX', 'ES']) {
      const expected = COUNTRIES.find((c) => c.code === code)!.pros / total;
      expect(Math.abs((counts[code] ?? 0) / n - expected)).toBeLessThan(0.02);
    }
  });
  it('리그 수준 가중치는 하위 0.40/0.35/0.25와 빅리그 비율 기준이다', () => {
    const w = levelWeights('GB');
    expect(w[2]).toBeCloseTo(0.4);
    expect(w[3]).toBeCloseTo(0.35);
    expect(w[4]).toBeCloseTo(0.25);
    expect(w[5]).toBeCloseTo((250 / 4500) * 1.2);
    expect(w[6]).toBeCloseTo((250 / 4500) * 0.8);
    expect(levelWeights('IN')[4]).toBeUndefined();
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
  it('연간 선택 5~8개, 비선택 20~30개 수준의 밀도', () => {
    expect(P_CHOICE.v * 52).toBeGreaterThan(5);
    expect(P_PASSIVE.v * 52).toBeGreaterThan(20);
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
    const s = newGame(cfg('ret-1'));
    advance(s, 52 * 4);
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
    const rng = rngOf(s);
    startLeagueSeason(s, rng, pl.id);
    const info = endSeasonCountry(s, rng, 'GB', '', null);
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
    expect(ageAt(s.p.birth.y, s.week)).toBeGreaterThanOrEqual(28);
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
    startLeagueSeason(s, rng, getClub(clubId).lg0);
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
