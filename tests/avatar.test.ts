import { describe, expect, it } from 'vitest';
import { allCountries } from '../src/engine/data';
import { AVATAR_SIZE, BEARD_KINDS, FACE_SHAPE_COUNT, HAIR_STYLE_COUNT, renderRgba, resolveLook, type OutfitSpec } from '../src/ui/pixel/avatar';
import { clubKit, countryColors } from '../src/ui/pixel/palette';
import { FACES, HAIR_STYLES, COLLARS } from '../src/ui/pixel/parts';

const kit: OutfitSpec = { kind: 'kit', kit: clubKit('x', 200) };

describe('avatar', () => {
  it('같은 입력이면 같은 픽셀', () => {
    const a = renderRgba(resolveLook({ seed: 42, country: 'KR', age: 30, morale: 50, outfit: kit }));
    const b = renderRgba(resolveLook({ seed: 42, country: 'KR', age: 30, morale: 50, outfit: kit }));
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(a.length).toBe(AVATAR_SIZE * AVATAR_SIZE * 4);
  });

  it('부위 종류 수가 사양 이상', () => {
    expect(HAIR_STYLE_COUNT).toBeGreaterThanOrEqual(10);
    expect(FACE_SHAPE_COUNT).toBe(3);
    expect(BEARD_KINDS).toBe(4);
    expect(Object.keys(COLLARS).length).toBeGreaterThanOrEqual(3);
  });

  it('부위 격자는 32x32 안에 들어온다', () => {
    const grids = [...FACES.flatMap((f) => [f.face, f.jaw]), ...HAIR_STYLES.flatMap((h) => [h.front, h.back]).filter((g) => g !== null)];
    for (const g of grids) {
      expect(g.x).toBeGreaterThanOrEqual(0);
      expect(g.y).toBeGreaterThanOrEqual(0);
      expect(g.x + Math.max(...g.rows.map((r) => r.length))).toBeLessThanOrEqual(AVATAR_SIZE);
      expect(g.y + g.rows.length).toBeLessThanOrEqual(AVATAR_SIZE);
    }
  });

  it('국가 안에서도 피부톤이 3종 이상 나온다', () => {
    for (const c of allCountries()) {
      const tones = new Set<number>();
      for (let s = 0; s < 300; s++) tones.add(resolveLook({ seed: s * 2654435761, country: c.code, age: 25, morale: 50, outfit: kit }).skin);
      expect(tones.size).toBeGreaterThanOrEqual(3);
    }
  });

  it('14세는 얼굴 털이 없고 모든 나이에서 렌더링된다', () => {
    for (let s = 0; s < 200; s++) {
      expect(resolveLook({ seed: s * 7919, country: 'DE', age: 14, morale: 50, outfit: kit }).beard).toBe(0);
    }
    for (const age of [12, 14, 17, 18, 20, 29, 30, 44, 45, 59, 60, 80]) {
      for (const outfit of [kit, { kind: 'suit' }, { kind: 'shirt' }, { kind: 'tee' }, { kind: 'jacket', kit: clubKit('j', 5) }, { kind: 'kit', kit: countryColors('BR') }] as OutfitSpec[]) {
        const px = renderRgba(resolveLook({ seed: 99 + age, country: 'NG', age, morale: 80, outfit }));
        expect(px.every((v) => Number.isFinite(v))).toBe(true);
      }
    }
  });

  it('사기에 따라 표정이 바뀐다', () => {
    const f = (m: number) => resolveLook({ seed: 1, country: 'KR', age: 25, morale: m, outfit: kit }).mood;
    expect([f(20), f(55), f(90)]).toEqual(['stern', 'neutral', 'smile']);
  });
});
