import { describe, expect, it } from 'vitest';
import { ensureContent } from '../src/engine/content';
import { allEventDefs } from '../src/engine/events';
import { outcomeTexts } from '../src/data/schema';
import { QUOTES } from '../src/data/quotes';
import { runBot } from '../src/engine/game';
import { forcedOrigin, mixedSpec, originRng } from '../src/engine/headless';
import { setFast } from '../src/engine/log';
import { setCosmetic } from '../src/engine/flags';
import { narrativeStats, tokensIn, defTokens } from '../src/engine/narrative';
import { personaOf } from '../src/engine/quotes';
import type { GameConfig } from '../src/engine/types';

ensureContent();

const SPELL = /(은\(는\)|이\(가\)|을\(를\)|과\(와\)|와\(과\)|\(으\)로|[가-힣]\((은|는|이|가|을|를|과|와|로)\))/;

describe('문장 변형', () => {
  const defs = allEventDefs();

  it('본문 변형 수가 최대 발생 횟수 기준을 충족한다', () => {
    const lacking: string[] = [];
    for (const d of defs) {
      const need = d.max >= 6 ? 6 : d.max >= 3 ? 4 : 2;
      if (d.text.length < need) lacking.push(`${d.id}:${d.text.length}/${need}`);
    }
    expect(lacking).toEqual([]);
  });

  it('결과 문장은 3개 이상이다 (최대 3회 이상 발생 이벤트)', () => {
    const lacking: string[] = [];
    for (const d of defs) {
      if (d.max < 3 || !d.choices) continue;
      d.choices.forEach((c, ci) => {
        for (const g of ['great', 'ok', 'bad', 'worst'] as const) {
          const o = c[g];
          if (o && outcomeTexts(o.t).length < 3) lacking.push(`${d.id}.${ci}.${g}`);
        }
      });
    }
    expect(lacking).toEqual([]);
  });

  it('병기 표기가 남아 있지 않다', () => {
    const bad: string[] = [];
    for (const d of defs) {
      const all = [...d.text, ...(d.textBad ?? []), ...(d.choices ?? []).flatMap((c) => [c.label, ...[c.ok, c.bad, c.great, c.worst].flatMap((o) => (o ? outcomeTexts(o.t) : []))])];
      for (const t of all) if (SPELL.test(t)) bad.push(`${d.id}: ${t.slice(0, 30)}`);
    }
    expect(bad).toEqual([]);
  });

  it('변형 문장의 인물 토큰은 이벤트 공통 토큰 집합 안에 있다', () => {
    for (const d of defs) {
      const base = new Set(defTokens(d));
      for (const t of d.text) for (const k of tokensIn(t)) expect(base.has(k)).toBe(true);
    }
  });
});

describe('인물 대사', () => {
  it('대사는 300개 이상이고 상황 태그는 30개 이상이다', () => {
    expect(QUOTES.length).toBeGreaterThanOrEqual(300);
    expect(new Set(QUOTES.map((q) => q[0])).size).toBeGreaterThanOrEqual(30);
  });

  it('모든 화자에게 범용 대사가 있고 토큰은 name, club뿐이다', () => {
    const whos = new Set(QUOTES.map((q) => q[1]));
    for (const w of whos) expect(QUOTES.some((q) => q[1] === w && q[0] === 'general')).toBe(true);
    for (const q of QUOTES) {
      for (const m of q[3].matchAll(/\{(\w+)(?::[가-힣]+)?\}/g)) expect(['name', 'club']).toContain(m[1]);
      expect(SPELL.test(q[3])).toBe(false);
    }
  });

  it('성격은 이름에 대해 안정적이다', () => {
    expect(personaOf('김민준')).toBe(personaOf('김민준'));
    expect(['w', 's', 't', 'c']).toContain(personaOf('박서연'));
  });
});

describe('헤드리스 경력 문장 품질', () => {
  it('200개 경력에서 병기·미치환·연속 반복이 없고 대사 부착률이 70% 이상이다', () => {
    narrativeStats.events = 0;
    narrativeStats.quoted = 0;
    let spell = 0;
    let braces = 0;
    let consecutive = 0;
    for (let i = 0; i < 200; i++) {
      const sp = mixedSpec(i, 'nq');
      const cfg: GameConfig = { seed: sp.seed, name: '', pos: sp.pos, mode: 'normal', code: '', lengthMin: 60 };
      setFast(false);
      setCosmetic(true);
      const s = runBot(cfg, forcedOrigin(originRng(sp.seed), sp.country), (st) => st.career.retired || st.ended);
      let prev = '';
      for (const e of s.log) {
        const t = `${e.title}\n${e.text}\n${e.pick ?? ''}\n${e.result ?? ''}`;
        if (SPELL.test(t)) spell++;
        if (/\{\w+(:[가-힣]+)?\}/.test(t)) braces++;
        const key = e.text.split('\n')[0];
        if (e.kind === 'passive' && key === prev) consecutive++;
        prev = e.kind === 'passive' ? key : '';
      }
    }
    setFast(true);
    setCosmetic(false);
    expect(spell).toBe(0);
    expect(braces).toBe(0);
    expect(consecutive).toBe(0);
    expect(narrativeStats.quoted / Math.max(1, narrativeStats.events)).toBeGreaterThanOrEqual(0.7);
  }, 600000);
});
