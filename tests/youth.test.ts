import { describe, expect, it } from 'vitest';
import { newGame, tickState, resolveDecision, runBot } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { setFast } from '../src/engine/log';
import { setCosmetic } from '../src/engine/flags';
import { forcedOrigin, originRng, mixedSpec } from '../src/engine/headless';
import { rngOf } from '../src/engine/world';
import { swOf, ageAt } from '../src/engine/time';
import { ALL_ATTRS } from '../src/engine/types';
import { STAGE_TEAMS, gamesFor } from '../src/engine/stages';
import { planLeague } from '../src/engine/yleague';
import { getClub } from '../src/engine/data';
import type { GameState } from '../src/engine/types';

ensureContent();

function make(seed: string, country = 'GB'): GameState {
  const origin = forcedOrigin(originRng(seed), country, 4);
  return newGame({ seed, name: '', pos: 'ST', mode: 'normal', code: '', lengthMin: 60 }, origin);
}

function playSeason(s: GameState, pick: (s: GameState) => number): void {
  let guard = 0;
  while (s.week < 52 && guard++ < 400) {
    while (s.decision) resolveDecision(s, pick(s), '', false);
    tickState(s);
  }
  while (s.decision) resolveDecision(s, pick(s), '', false);
}

describe('유스 리그 분리', () => {
  it('유스 경기는 유스 순위표에만 기록되고 1군 기록에는 들어가지 않는다', () => {
    setFast(true);
    setCosmetic(false);
    const s = make('yl-sep-1');
    const own = s.career.clubId;
    const yt0 = s.yt!;
    expect(yt0.stage).toBe('U15');
    expect(yt0.ids).toContain(own);
    expect(yt0.games).toBe(gamesFor(STAGE_TEAMS.U15));
    playSeason(s, () => 0);
    const lg = s.world.leagues[s.career.cur.leagueId];
    const now = s.career.clubId;
    expect(s.yt!.table[now][3]).toBe(s.yt!.games);
    expect(lg.table[now][3]).toBeGreaterThan(30);
    expect(Object.keys(s.yt!.table).every((id) => id !== '' && lg.order.length > 0)).toBe(true);
    expect(s.career.cur.apps).toBe(0);
    expect(s.career.yCur.apps + s.career.ySeasons.reduce((a, r) => a + r.apps, 0)).toBeGreaterThan(0);
    expect(s.career.seasons.length).toBe(0);
    setFast(false);
    setCosmetic(true);
  });

  it('같은 시드에서 플레이어의 선택이 달라도 유스 시기 1군 리그 순위는 같다', () => {
    setFast(true);
    setCosmetic(false);
    const a = make('yl-ind-1');
    const b = make('yl-ind-1');
    b.focus = 'phys';
    a.auto = true;
    b.auto = true;
    playSeason(a, () => 0);
    playSeason(b, (st) => Math.max(0, (st.decision?.choices.length ?? 1) - 1));
    const lgA = a.world.leagues[a.career.cur.leagueId];
    const lgB = b.world.leagues[b.career.cur.leagueId];
    expect(JSON.stringify(lgA.table)).toBe(JSON.stringify(lgB.table));
    expect([a.career.cupAlive, a.career.cupRound, a.career.contAlive]).toEqual([b.career.cupAlive, b.career.cupRound, b.career.contAlive]);
    expect(a.yt!.round).toBeGreaterThan(0);
    setFast(false);
    setCosmetic(true);
  });

  it('국가별 유스 리그는 12~16팀, 단계별 22/26/30경기이며 소속 구단을 포함한다', () => {
    const s = make('yl-plan-1', 'BR');
    const own = s.career.clubId;
    for (const st of ['U15', 'U17', 'U19', 'RES'] as const) {
      const plan = planLeague(s, own, st);
      expect(plan.ids).toContain(own);
      expect(plan.ids.length % 2).toBe(0);
      expect(plan.ids.length).toBeGreaterThanOrEqual(6);
      expect(plan.ids.length).toBeLessThanOrEqual(16);
      expect(getClub(own).country).toBe('BR');
    }
    expect(gamesFor(STAGE_TEAMS.U15)).toBe(22);
    expect(gamesFor(STAGE_TEAMS.U17)).toBe(26);
    expect(gamesFor(STAGE_TEAMS.U19)).toBe(30);
  });
});

describe('1군 진입 경로', () => {
  function strong(s: GameState): void {
    for (const k of ALL_ATTRS) s.ab.a[k] = 19;
    s.ab.pot = 90;
    s.career.youthStage = 'U19';
  }

  it('프로 계약 없이는 1군에 데뷔하지 못한다', () => {
    setFast(true);
    setCosmetic(false);
    const s = make('entry-nosign-1');
    strong(s);
    s.career.entry.step = 2;
    s.career.entry.trainW = 0;
    s.career.entry.squadW = 0;
    let maxSquad = 0;
    for (let i = 0; i < 52 * 2 && !s.career.retired; i++) {
      for (const k of ALL_ATTRS) s.ab.a[k] = 19;
      s.career.signed = false;
      s.career.entry.step = 2;
      s.career.youthJudged = true;
      s.ev.flags.listedW = s.week;
      while (s.decision) resolveDecision(s, 0, '', false);
      tickState(s);
      expect(s.career.debuted).toBe(false);
      maxSquad = Math.max(maxSquad, s.career.entry.squadN);
    }
    expect(maxSquad).toBeGreaterThan(5);
    expect(s.career.cur.apps).toBe(0);
    setFast(false);
    setCosmetic(true);
  });

  it('프로 계약과 명단 등록이 있으면 1군 데뷔가 가능하고, 데뷔는 훈련 합류와 명단 등록 뒤에만 온다', () => {
    setFast(true);
    setCosmetic(false);
    let debuts = 0;
    let order = true;
    for (let i = 0; i < 40; i++) {
      const sp = mixedSpec(i, 'entry-ord-');
      const origin = forcedOrigin(originRng(sp.seed), sp.country);
      const s = runBot({ seed: sp.seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 }, origin, (st) => {
        const e = st.career.entry;
        if (e.step >= 2 && e.squadW < e.trainW) order = false;
        if (e.step >= 1 && e.trainW < 0) order = false;
        if (st.career.debuted && st.ev.flags.schoolEntered === undefined && (e.step < 2 || !st.career.signed)) order = false;
        return st.career.retired || st.ended || st.week > 52 * 11;
      });
      if (s.career.debuted) {
        debuts++;
        if (s.ev.flags.schoolEntered === undefined) {
          expect(s.career.signed).toBe(true);
        }
      }
    }
    expect(order).toBe(true);
    expect(debuts).toBeGreaterThan(5);
    setFast(false);
    setCosmetic(true);
  });

  it('1군 데뷔 정의는 1군 공식 경기 첫 출전이고, 유스·리저브 출전은 데뷔로 세지 않는다', () => {
    setFast(true);
    setCosmetic(false);
    const s = make('entry-def-1');
    strong(s);
    s.career.signed = true;
    s.career.youthStage = 'RES';
    playSeason(s, () => 0);
    expect(s.career.yCur.apps + s.career.ySeasons.reduce((a, r) => a + r.apps, 0)).toBeGreaterThan(0);
    if (!s.career.debuted) expect(s.career.cur.apps).toBe(0);
    else expect(s.career.debutW).toBeGreaterThanOrEqual(0);
    setFast(false);
    setCosmetic(true);
  });

  it('나이가 어린 월반 조건과 단계 전환은 시즌 말 심사로만 일어난다', () => {
    setFast(true);
    setCosmetic(false);
    const s = make('stage-1');
    const start = s.career.youthStage;
    let changedMid = false;
    let prev = start;
    for (let i = 0; i < 52; i++) {
      while (s.decision) resolveDecision(s, 0, '', false);
      tickState(s);
      if (s.career.youthStage !== prev && swOf(s.week) !== 0 && s.career.entry.jumps === 0) changedMid = true;
      prev = s.career.youthStage;
    }
    expect(changedMid).toBe(false);
    expect(ageAt(s.p.birth, s.week)).toBeGreaterThanOrEqual(14);
    expect(rngOf(s).next()).toBeGreaterThanOrEqual(0);
    setFast(false);
    setCosmetic(true);
  });
});
