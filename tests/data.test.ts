import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../src/data/countries';
import { LEAGUES_BY_COUNTRY } from '../src/data/leagues';
import { CITIES } from '../src/data/cities';
import { NAME_POOLS } from '../src/data/names';
import { ALL_EVENTS } from '../src/data/events';
import { ALL_ACTIONS } from '../src/data/actions';
import { EventSchema } from '../src/data/schema';
import { countClubs, leaguesOf } from '../src/engine/data';
import { ensureContent } from '../src/engine/content';
import { allEventDefs } from '../src/engine/events';
import { allActions } from '../src/engine/actions';

describe('데이터 검증', () => {
  it('34개국과 국가별 리그 피라미드가 있다', () => {
    expect(COUNTRIES.length).toBe(34);
    for (const c of COUNTRIES) {
      const ls = LEAGUES_BY_COUNTRY[c.code];
      expect(ls.length).toBeGreaterThanOrEqual(2);
      const lvls = new Set<number>();
      for (const l of ls) {
        lvls.add(l.lvl);
        if (l.elite) lvls.add(l.lvl + 1);
        expect(l.clubs.split(';').length).toBeGreaterThanOrEqual(10);
      }
      expect(Math.max(...lvls)).toBe(c.top);
      for (let L = 2; L <= c.top; L++) expect(lvls.has(L)).toBe(true);
    }
  });
  it('국가별 도시 6~12개, 이름 풀 100개 이상', () => {
    for (const c of COUNTRIES) {
      expect(CITIES[c.code].length).toBeGreaterThanOrEqual(6);
      expect(CITIES[c.code].length).toBeLessThanOrEqual(12);
      expect(NAME_POOLS[c.code].given.length).toBeGreaterThanOrEqual(100);
      expect(NAME_POOLS[c.code].surname.length).toBeGreaterThanOrEqual(100);
      for (const [en, ko] of NAME_POOLS[c.code].given.slice(0, 20)) {
        expect(en.length).toBeGreaterThan(0);
        expect(/[가-힣]/.test(ko)).toBe(true);
      }
    }
  });
  it('구단 수 집계', () => {
    let total = 0;
    for (const c of COUNTRIES) total += countClubs(c.code).clubs;
    expect(total).toBeGreaterThan(1500);
    expect(leaguesOf('GB')[0].clubIds.length).toBe(20);
  });
  it('이벤트와 행동이 스키마와 효과 문법을 통과한다', () => {
    for (const e of ALL_EVENTS) EventSchema.parse(e);
    ensureContent();
    expect(allEventDefs().length).toBe(ALL_EVENTS.length);
    expect(allActions().length).toBe(ALL_ACTIONS.length);
    for (const e of allEventDefs()) expect(e.text.length).toBeGreaterThanOrEqual(2);
  });
  it('최소 콘텐츠 수를 충족한다', () => {
    ensureContent();
    const defs = allEventDefs();
    const count = (f: (e: (typeof defs)[number]) => boolean) => defs.filter(f).length;
    const pl = (e: (typeof defs)[number]) => e.phase.includes('youth') || e.phase.includes('pro');
    const hasC = (e: (typeof defs)[number]) => !!(e.choices && e.choices.length);
    expect(count((e) => e.kind === 'passive' && pl(e))).toBeGreaterThanOrEqual(80);
    expect(count((e) => e.kind === 'choice' && pl(e))).toBeGreaterThanOrEqual(90);
    expect(count((e) => e.kind === 'moment')).toBeGreaterThanOrEqual(12);
    expect(count((e) => e.kind === 'passive' && e.phase.includes('coach'))).toBeGreaterThanOrEqual(30);
    expect(count((e) => e.kind === 'choice' && e.phase.includes('coach'))).toBeGreaterThanOrEqual(45);
    expect(count((e) => e.kind === 'passive' && e.phase.includes('postcareer'))).toBeGreaterThanOrEqual(20);
    expect(count((e) => e.kind === 'choice' && e.phase.includes('postcareer'))).toBeGreaterThanOrEqual(15);
    const chains: Record<string, number> = {};
    for (const e of defs) if (e.kind === 'chain-step' && e.chain) chains[e.chain] = (chains[e.chain] ?? 0) + 1;
    expect(Object.keys(chains).length).toBeGreaterThanOrEqual(14);
    for (const v of Object.values(chains)) expect(v).toBeGreaterThanOrEqual(3);
    expect(count((e) => e.kind === 'chain-step' && hasC(e))).toBeGreaterThan(10);
  });
});
