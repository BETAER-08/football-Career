import { describe, expect, it } from 'vitest';
import { newGame, tickState, autoWeek, resolveDecision, actionInput } from '../src/engine/game';
import { autoDecide } from '../src/engine/auto';
import { Rng, seedState } from '../src/engine/rng';
import { rngOf, clubLvl } from '../src/engine/world';
import { ensureContent } from '../src/engine/content';
import { anchored } from '../src/engine/attributes';
import { ALL_ATTRS } from '../src/engine/types';
import { forcedOrigin, originRng } from '../src/engine/headless';
import { scaleToOvr } from '../src/engine/player';
import { getClub, getCountry } from '../src/engine/data';
import { buildBatch, marketEligible, applyTransferRequest } from '../src/engine/market';
import { domesticP } from '../src/engine/transfer';
import { LEVEL_STARTER_OVR } from '../src/data/countries';
import { getAction, actionStatus } from '../src/engine/actions';
import type { GameState } from '../src/engine/types';

ensureContent();

function pro(seed: string, code: string): GameState {
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

const foreign = (s: GameState, id: string): boolean => getClub(id).country !== s.p.country;

describe('해외 제안', () => {
  it('국내 선택 확률 표를 따른다', () => {
    const s = pro('ab-p', 'KR');
    s.career.transferReq = -1;
    s.fame.abroad = 0;
    s.fin.agentSkill = 0;
    s.hid.adapt = 50;
    s.hid.family = 50;
    s.nat.matches = [];
    s.nat.ageRecs = [];
    const top = getCountry('KR').top;
    const low = LEVEL_STARTER_OVR[top] - 10;
    expect(domesticP(s, 3, low)).toBeCloseTo(0.55, 5);
    expect(domesticP(s, 5, low)).toBeCloseTo(0.35, 5);
    expect(domesticP(s, 3, LEVEL_STARTER_OVR[top] + 2)).toBeCloseTo(0.35, 5);
    s.fame.abroad = 30;
    expect(domesticP(s, 3, low)).toBeCloseTo(0.45, 5);
    s.fin.agentSkill = 70;
    s.hid.adapt = 70;
    expect(domesticP(s, 3, low)).toBeCloseTo(0.35, 5);
    expect(domesticP(s, 5, LEVEL_STARTER_OVR[top] + 2)).toBeCloseTo(0.15, 5);
    s.hid.family = 70;
    expect(domesticP(s, 3, low)).toBeCloseTo(0.45, 5);
    s.career.transferReq = s.week;
    s.career.reqDir = 'abroad';
    expect(domesticP(s, 3, low)).toBe(0);
    s.career.reqDir = '';
  });

  it('자국 최고 수준 주전 기준 +2 이상이면 여름 시장 제안에 해외 구단이 항상 포함된다', () => {
    for (const code of ['KR', 'JP', 'US', 'MX']) {
      const s = pro(`ab-s-${code}`, code);
      const top = getCountry(code).top;
      scaleToOvr(s.ab.a, s.ab.pos, anchored(LEVEL_STARTER_OVR[top] + 3));
      s.career.transferReq = -1;
      const rng = new Rng(seedState(`ab-r-${code}`));
      for (let i = 0; i < 40; i++) {
        const offers = buildBatch(s, rng, true, 2).filter((o) => !o.loan || !!o.optionFee);
        expect(offers.some((o) => foreign(s, o.clubId)), `${code} ${i}`).toBe(true);
      }
    }
  });

  it('조건을 만족하고 오버롤이 72−4 이상이면 해외 제안 중 하나는 수준 5 이상이다', () => {
    const s = pro('ab-l5', 'KR');
    scaleToOvr(s.ab.a, s.ab.pos, anchored(70));
    const rng = new Rng(seedState('ab-l5r'));
    let ok = 0;
    for (let i = 0; i < 40; i++) {
      const offers = buildBatch(s, rng, true, 2);
      if (offers.some((o) => foreign(s, o.clubId) && clubLvl(s, o.clubId) >= 5)) ok++;
    }
    expect(ok).toBe(40);
  });

  it('겨울 시장에서는 조건 충족 시 해외 제안이 60% 이상의 확률로 온다', () => {
    const s = pro('ab-w', 'JP');
    const top = getCountry('JP').top;
    scaleToOvr(s.ab.a, s.ab.pos, anchored(LEVEL_STARTER_OVR[top] + 3));
    const rng = new Rng(seedState('ab-wr'));
    let hit = 0;
    for (let i = 0; i < 300; i++) if (buildBatch(s, rng, false, 1).some((o) => foreign(s, o.clubId))) hit++;
    expect(hit / 300).toBeGreaterThan(0.55);
  });

  it('이적 요청 방향이 해외면 제안이 전부 해외 구단이고, 국내면 국내 구단 위주다', () => {
    const s = pro('ab-d', 'KR');
    s.career.contract!.role = 'starter';
    const rng = new Rng(seedState('ab-dr'));
    applyTransferRequest(s, rng, true, 'abroad');
    expect(s.career.reqDir).toBe('abroad');
    for (let i = 0; i < 30; i++) {
      const offers = buildBatch(s, rng, true, 3);
      expect(offers.length).toBeGreaterThan(0);
      for (const o of offers) expect(foreign(s, o.clubId)).toBe(true);
    }
    s.career.reqDir = 'dom';
    let dom = 0;
    let all = 0;
    for (let i = 0; i < 30; i++) {
      for (const o of buildBatch(s, rng, true, 3)) {
        all++;
        if (!foreign(s, o.clubId)) dom++;
      }
    }
    expect(dom / all).toBeGreaterThan(0.6);
  });

  it('이적 요청 행동에 방향 선택지가 있다', () => {
    const s = pro('ab-a', 'KR');
    s.career.contract!.endW = s.week + 52 * 4;
    for (const id of ['transfer_request', 'transfer_request_dom', 'transfer_request_abroad']) {
      expect(getAction(id)).toBeTruthy();
      expect(actionStatus(s, getAction(id)).reason).not.toBe('지금은 할 수 없다');
    }
    s.ev.actCd = {};
    const p = actionInput(s, 'transfer_request_abroad');
    expect(p).not.toBeNull();
    expect(s.career.reqDir).toBe('abroad');
    expect(actionStatus(s, getAction('transfer_request_dom')).enabled).toBe(false);
    s.ev.actCd = {};
    actionInput(s, 'transfer_withdraw');
    expect(s.career.reqDir).toBe('');
  });
});
