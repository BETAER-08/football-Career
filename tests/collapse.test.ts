import { describe, expect, it } from 'vitest';
import { newGame } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { getEvent, fireEvent } from '../src/engine/events';
import { applyFx } from '../src/engine/fx';
import { forcedOrigin, originRng } from '../src/engine/headless';
import { rngOf } from '../src/engine/world';
import { recordFee } from '../src/engine/transfer';
import { LEAGUE_FEE_RECORD } from '../src/data/feeRecords';
import type { GameConfig } from '../src/engine/types';

ensureContent();

const cfgOf = (seed: string): GameConfig => ({ seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });

describe('구단 간 협상 결렬 이벤트', () => {
  it('프로 선수 전용과 유스 전용 이벤트로 나뉘고 선택지를 갖는다', () => {
    const pro = getEvent('deal_collapse_pro');
    const youth = getEvent('deal_collapse_youth');
    expect(pro.phase).toEqual(['pro']);
    expect(youth.phase).toEqual(['youth']);
    expect((pro.choices ?? []).length).toBeGreaterThanOrEqual(4);
    expect((youth.choices ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it('이벤트가 결정으로 올라오고 압박 효과가 이적 요청을 접수시킨다', () => {
    const seed = 'collapse-1';
    const s = newGame(cfgOf(seed), forcedOrigin(originRng(seed), 'GB', 4));
    const rng = rngOf(s);
    fireEvent(s, rng, getEvent('deal_collapse_youth'));
    expect(s.decision?.ref).toBe('deal_collapse_youth');
    expect(s.career.transferReq).toBe(-1);
    applyFx(s, { rng }, 'fx:reqPush=soft');
    expect(s.career.transferReq).toBe(s.week);
  });

  it('벌금은 주급 기준으로 현금에서 빠진다', () => {
    const seed = 'collapse-2';
    const s = newGame(cfgOf(seed), forcedOrigin(originRng(seed), 'GB', 4));
    const rng = rngOf(s);
    s.career.contract = { ...s.career.contract!, wage: 5200 };
    const before = s.fin.cash;
    applyFx(s, { rng }, 'fx:fine=3');
    expect(before - s.fin.cash).toBe(300);
  });

  it('리그 최고 이적료 기록은 실제 기록에서 시작한다', () => {
    const seed = 'collapse-3';
    const s = newGame(cfgOf(seed), forcedOrigin(originRng(seed), 'GB', 6));
    const club = 'GB:Arsenal';
    recordFee(s, club, 1000000);
    expect(s.wld.feeRec.league.GB1).toBe(LEAGUE_FEE_RECORD.GB1);
    recordFee(s, club, LEAGUE_FEE_RECORD.GB1 + 1);
    expect(s.wld.feeRec.league.GB1).toBe(LEAGUE_FEE_RECORD.GB1 + 1);
  });
});
