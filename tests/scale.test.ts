import { describe, expect, it } from 'vitest';
import { toNewScale, START_MIN } from '../src/engine/attributes';

describe('표시 오버롤 환산', () => {
  it('기존 표시 값이 요청한 값으로 바뀐다', () => {
    const pairs: [number, number][] = [[40, 30], [50, 40], [60, 50], [70, 60], [80, 70], [85, 80], [90, 90], [95, 100]];
    for (const [a, b] of pairs) expect(toNewScale(a)).toBeCloseTo(b, 6);
    expect(toNewScale(100)).toBe(100);
    expect(toNewScale(0)).toBe(0);
  });

  it('시작 오버롤 최솟값이 새 기준으로 환산된다', () => {
    expect(toNewScale(START_MIN[2])).toBeCloseTo(30, 6);
    expect(toNewScale(START_MIN[6])).toBeCloseTo(40, 6);
  });
});
