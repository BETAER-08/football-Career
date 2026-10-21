import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { Rng, seedState } from '../src/engine/rng';
import { ensureContent } from '../src/engine/content';
import { anchored, curOvr } from '../src/engine/attributes';
import { scaleToOvr } from '../src/engine/player';
import { clubStd } from '../src/engine/world';
import { ROLE_UP, negotiate, roleUpOdds } from '../src/engine/transfer';
import { presentOffers, resolveOffer } from '../src/engine/offers';
import type { GameState, Offer, Role } from '../src/engine/types';

ensureContent();

function mk(seed: string): GameState {
  const s = newGame({ seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });
  s.fin.agentSkill = 50;
  s.fame.dom = 0;
  s.fame.abroad = 0;
  return s;
}

function offerFor(s: GameState, role: Role): Offer {
  return {
    id: 9001, clubId: s.p.startClubId, role, wage: 100000, years: 3, signing: 0, appBonus: 0, goalBonus: 0, buyout: 5000000,
    loan: false, trial: false, exp: 99, coachName: 'x', coachStyle: 'y', first: false, fromAgent: false, tag: 't', mode: 'free', fee: 0
  };
}

function setGap(s: GameState, o: Offer, gap: number): void {
  const target = ROLE_UP[o.role] === 'starter' ? -1.5 : -5;
  scaleToOvr(s.ab.a, s.ab.pos, anchored(clubStd(s, o.clubId) + target + gap));
}

function acceptRate(s: GameState, o: Offer, n: number): number {
  let ok = 0;
  for (let i = 0; i < n; i++) {
    const r = negotiate(s, new Rng(seedState(`n${i}`)), o, { wage: false, role: true, buyout: false });
    if (r.items.length === 1 && r.items[0].ok) ok++;
  }
  return ok / n;
}

describe('역할 상향', () => {
  it('상향 순서는 한 단계씩이고 유망주로 올라가지 않는다', () => {
    expect(ROLE_UP).toEqual({ backup: 'rotation', prospect: 'rotation', rotation: 'starter', starter: null });
    const s = mk('role-a');
    for (const role of ['backup', 'prospect', 'rotation', 'starter'] as Role[]) {
      for (let i = 0; i < 80; i++) {
        const r = negotiate(s, new Rng(seedState(`m${role}${i}`)), offerFor(s, role), { wage: true, role: true, buyout: true });
        expect(r.offer.role === 'prospect' && role !== 'prospect').toBe(false);
        const expected = ROLE_UP[role];
        expect(r.offer.role === role || r.offer.role === expected).toBe(true);
      }
    }
  });

  it('주전 제안에는 역할 상향 요구를 할 수 없다', () => {
    const s = mk('role-b');
    const o = offerFor(s, 'starter');
    expect(roleUpOdds(s, o)).toBeNull();
    const r = negotiate(s, new Rng(seedState('z')), o, { wage: false, role: true, buyout: false });
    expect(r.items.length).toBe(0);
    expect(r.offer.role).toBe('starter');
  });

  it('부족분 −6에서는 수락률 5% 이하, +2에서는 85% 이상', () => {
    const s = mk('role-c');
    const o = offerFor(s, 'backup');
    setGap(s, o, -6);
    expect(roleUpOdds(s, o)!.gap).toBeCloseTo(-6, 0);
    expect(acceptRate(s, o, 1000)).toBeLessThanOrEqual(0.05);
    setGap(s, o, 2);
    expect(curOvr(s.ab)).toBeGreaterThan(0);
    expect(acceptRate(s, o, 1000)).toBeGreaterThanOrEqual(0.85);
  });

  it('역할 거절 시 철회가 아니면 원래 조건 재선택 결정이 생성된다', () => {
    let found = 0;
    for (let i = 0; i < 60 && found < 2; i++) {
      const s = mk(`ren${i}`);
      const o = offerFor(s, 'backup');
      setGap(s, o, -4);
      presentOffers(s, [o], 'free', 't', 'x', true);
      const d = s.decision!;
      s.decision = null;
      const res = resolveOffer(s, new Rng(seedState(`r${i}`)), d, 0, 'role');
      const nd = s.decQueue.length ? s.decQueue[0] : s.decision;
      if (nd && nd.offers.some((x) => x.renego)) {
        const re = nd.offers.find((x) => x.renego)!;
        expect(re.role).toBe('backup');
        expect(nd.choices.length).toBe(nd.offers.length + 1);
        expect(res.grade).toBe('bad');
        found++;
      }
    }
    expect(found).toBeGreaterThan(0);
  });
});
