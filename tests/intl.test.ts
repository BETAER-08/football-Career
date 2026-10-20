import { describe, expect, it } from 'vitest';
import { ageEligibleYears, ageSchedule } from '../src/data/competitions';
import { SCHOOLS } from '../src/data/schools';
import { ensureContent } from '../src/engine/content';
import { newGame, tickState, resolveDecision } from '../src/engine/game';
import { ceremonyWeek } from '../src/engine/worldsim';
import { setFast } from '../src/engine/log';
import type { BallonRec } from '../src/engine/types';

ensureContent();

describe('연령별 국제대회 출전 가능 연도', () => {
  it('2012년생 한국 선수의 연도별 출전 가능 대회를 출생 연도 규정대로 계산한다', () => {
    const y = ageEligibleYears(2012, 'AFC', 2026, 2040);
    expect(y.U17WC).toEqual([2026, 2027, 2028, 2029]);
    expect(y.U20WC).toEqual([2027, 2029, 2031]);
    expect(y.OLY).toEqual([2028, 2032]);
    expect(y.ASIAD).toEqual([2026, 2030, 2034]);
    expect(y.UEFA_U17).toBeUndefined();
    expect(y.AFC_U17).toEqual([2027, 2029]);
  });
  it('대회 일정표는 U-17 매년, U-20 홀수 해, 올림픽·아시안게임 4년 주기를 따른다', () => {
    const rows = ageSchedule(2026, 2040);
    expect(rows.filter((r) => r.id === 'U17WC').length).toBe(15);
    expect(rows.filter((r) => r.id === 'U20WC').map((r) => r.year)).toEqual([2027, 2029, 2031, 2033, 2035, 2037, 2039]);
    expect(rows.filter((r) => r.id === 'OLY').map((r) => r.year)).toEqual([2028, 2032, 2036, 2040]);
    expect(rows.filter((r) => r.id === 'ASIAD').map((r) => r.year)).toEqual([2026, 2030, 2034, 2038]);
  });
});

describe('발롱도르 발표', () => {
  it('플레이어가 3위 밖이면 시상식 결정·토스트·로그가 생기지 않고, 3위 안이면 열린다', () => {
    setFast(false);
    const s = newGame({ seed: 'ballon-1', name: '', pos: 'ST', mode: 'normal', code: '', lengthMin: 60 });
    const top = [0, 1, 2].map((i) => ({ name: `스타${i}`, club: s.career.clubId, country: s.p.country }));
    const mk = (player: number): BallonRec => ({ s: -1, year: 2026, top, player, playerScore: 80, winnerIsPlayer: player === 1 });
    s.wld.ceremony = mk(7);
    s.wld.ceremonyDue = false;
    const logs = s.log.length;
    const toasts = s.toasts.length;
    ceremonyWeek(s);
    expect(s.wld.ceremonyDue).toBe(false);
    expect(s.log.length).toBe(logs);
    expect(s.toasts.length).toBe(toasts);
    s.wld.ceremony = mk(0);
    ceremonyWeek(s);
    expect(s.wld.ceremonyDue).toBe(false);
    s.wld.ceremony = mk(3);
    ceremonyWeek(s);
    expect(s.wld.ceremonyDue).toBe(true);
    expect(s.log.length).toBeGreaterThan(logs);
    while (s.decision) resolveDecision(s, 0, '', false);
    tickState(s);
  });
});

describe('학교 경로 데이터', () => {
  it('국가별 실존 학교 8~15개, 프로 산하 학교 제외, real·certain 표시가 있다', () => {
    for (const c of ['KR', 'JP']) {
      const real = SCHOOLS.filter((x) => x.country === c && x.kind === 'HS' && x.real);
      expect(real.length).toBeGreaterThanOrEqual(8);
      expect(real.length).toBeLessThanOrEqual(15);
    }
    const us = SCHOOLS.filter((x) => x.country === 'US' && x.kind === 'UNI' && x.real);
    expect(us.length).toBeGreaterThanOrEqual(8);
    expect(us.length).toBeLessThanOrEqual(15);
    for (const bad of ['매탄고', '현대고', '광양제철고', '오산고']) expect(SCHOOLS.some((x) => x.ko === bad)).toBe(false);
    expect(SCHOOLS.every((x) => typeof x.real === 'boolean' && typeof x.certain === 'boolean')).toBe(true);
    expect(SCHOOLS.filter((x) => !x.real).every((x) => !x.certain)).toBe(true);
    expect(new Set(SCHOOLS.map((x) => x.id)).size).toBe(SCHOOLS.length);
  });
});
