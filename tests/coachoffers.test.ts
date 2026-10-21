import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { genCoachOffers, coachScore, levelCap, hasTie, currentOfferRole } from '../src/engine/coach';
import { stream } from '../src/engine/streams';
import type { GameConfig, GameState } from '../src/engine/types';

ensureContent();

const cfg = (seed: string): GameConfig => ({ seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });

function coachState(seed: string, role: GameState['coach']['role'], fame: number, lic: 'C' | 'B' | 'A' | 'P'): GameState {
  const s = newGame(cfg(seed));
  const c = s.coach;
  c.licenses = { C: 1, B: lic === 'C' ? 0 : 1, A: lic === 'A' || lic === 'P' ? 1 : 0, P: lic === 'P' ? 1 : 0 };
  c.role = role;
  c.fame = fame;
  c.standing = 55;
  for (const k of Object.keys(c.skills) as (keyof typeof c.skills)[]) c.skills[k] = 50;
  return s;
}

function sample(s: GameState, rounds: number) {
  const out: ReturnType<typeof genCoachOffers> = [];
  for (let i = 0; i < rounds; i++) out.push(...genCoachOffers(s, stream(s.cfg.seed, 'co', i), 3));
  return out;
}

describe('지도자 제안', () => {
  it('감독에게 유스 코치 제안이 가지 않는다', () => {
    const s = coachState('co-1', 'manager', 50, 'P');
    const offers = sample(s, 120);
    expect(offers.length).toBeGreaterThan(0);
    expect(offers.some((o) => o.tag === 'youth')).toBe(false);
  });

  it('구단 수준이 점수 상한을 넘지 않는다', () => {
    for (const [role, fame, lic] of [['manager', 20, 'A'], ['assistant', 40, 'B'], ['manager', 70, 'P'], ['youthCoach', 10, 'C']] as const) {
      const s = coachState(`co-cap-${role}-${fame}`, role, fame, lic);
      const cur = currentOfferRole(s);
      for (const o of sample(s, 80)) {
        if (!o.cinfo || o.tag === 'national') continue;
        const r = o.tag as 'youth' | 'assistant' | 'manager';
        const cap = levelCap(coachScore(s, r).score, r, lic === 'C' ? 1 : lic === 'B' ? 2 : lic === 'A' ? 3 : 4);
        expect(o.cinfo.level).toBeLessThanOrEqual(cap);
      }
      expect(cur).not.toBeNull();
    }
  });

  it('연고 없는 나라의 제안은 전체의 10% 이하다', () => {
    const s = coachState('co-tie', 'assistant', 55, 'P');
    const offers = sample(s, 400).filter((o) => o.cinfo && !o.clubId.startsWith('NAT:'));
    const noTie = offers.filter((o) => !hasTie(s, o.cinfo!.country));
    expect(offers.length).toBeGreaterThan(100);
    expect(noTie.length / offers.length).toBeLessThanOrEqual(0.1);
  });

  it('대표팀 제안은 P 라이선스와 점수 65 이상이 필요하다', () => {
    const lowLic = coachState('co-nat1', 'manager', 90, 'A');
    expect(sample(lowLic, 200).some((o) => o.tag === 'national')).toBe(false);
    const lowScore = coachState('co-nat2', 'manager', 5, 'P');
    for (const k of Object.keys(lowScore.coach.skills) as (keyof typeof lowScore.coach.skills)[]) lowScore.coach.skills[k] = 5;
    lowScore.coach.standing = 5;
    expect(sample(lowScore, 200).some((o) => o.tag === 'national')).toBe(false);
  });

  it('제안 카드 정보가 채워진다', () => {
    const s = coachState('co-info', 'assistant', 50, 'P');
    for (const o of sample(s, 20)) {
      expect(o.cinfo).toBeDefined();
      expect(o.cinfo!.reason.length).toBeGreaterThan(0);
      expect(o.cinfo!.budget.length).toBeGreaterThan(0);
    }
  });
});
