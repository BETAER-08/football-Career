import { describe, expect, it } from 'vitest';
import { newGame, autoStep, autoWeek, tickState } from '../src/engine/game';
import { ensureContent } from '../src/engine/content';
import { allEventDefs, render } from '../src/engine/events';
import { bindDef, bindTokens, defTokens, needsMet, narrativeStats } from '../src/engine/narrative';
import { stream } from '../src/engine/streams';
import type { GameConfig, GameState } from '../src/engine/types';

ensureContent();

const cfg = (seed: string): GameConfig => ({ seed, name: '', pos: 'random', mode: 'normal', code: '', lengthMin: 60 });

function game(seed: string, weeks: number): GameState {
  const s = newGame(cfg(seed));
  for (let i = 0; i < weeks && !s.ended; i++) {
    autoStep(s);
    autoWeek(s);
    if (!tickState(s)) autoStep(s);
  }
  return s;
}

describe('인물 결속', () => {
  it('배우자 토큰 이벤트는 해당 인물이 없으면 발생 조건을 통과하지 못한다', () => {
    const s = game('bind-1', 60);
    const defs = allEventDefs().filter((d) => defTokens(d).includes('partner'));
    expect(defs.length).toBeGreaterThan(0);
    const partner = s.people.partner;
    delete s.people.partner;
    for (const d of defs) expect(needsMet(s, d)).toBe(false);
    if (partner) {
      s.people.partner = partner;
      for (const d of defs) expect(needsMet(s, d)).toBe(true);
    }
  });

  it('같은 결속으로 렌더링하면 본문과 선택지에서 같은 이름이 쓰인다', () => {
    const s = game('bind-2', 120);
    const def = allEventDefs().find((d) => defTokens(d).includes('mate1') && needsMet(s, d));
    expect(def).toBeDefined();
    if (!def) return;
    const bind = bindDef(s, def);
    const name = bind.mate1.n;
    const texts = [...def.text, ...(def.choices ?? []).map((c) => c.label)].filter((t) => t.includes('{mate1'));
    for (const t of texts) expect(render(s, t, bind)).toContain(name);
  });

  it('상속된 결속은 인물이 남아 있는 동안 유지된다', () => {
    const s = game('bind-3', 120);
    const rng = stream('bind-rng', 'a', 0);
    const first = bindTokens(s, ['mate1'], rng);
    const second = bindTokens(s, ['mate1'], stream('bind-rng', 'b', 0), first);
    expect(second.mate1).toEqual(first.mate1);
  });

  it('기자는 없으면 자동 생성된다', () => {
    const s = game('bind-4', 30);
    delete s.people.media;
    const before = narrativeStats.autoReporter;
    const b = bindTokens(s, ['reporter'], stream('bind-rng', 'rep', 0));
    expect(b.reporter.n.length).toBeGreaterThan(0);
    expect(s.people.media).toBeDefined();
    expect(narrativeStats.autoReporter).toBe(before + 1);
  });
});
