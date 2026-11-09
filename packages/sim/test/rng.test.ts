import { describe, expect, test } from 'vitest';
import { draw, nextU32 } from '../src/index';
import type { RngState } from '../src/index';

describe('rng', () => {
  test('streams are independent', () => {
    const afterSpare = (yieldDraws: number): number[] => {
      let rng: RngState = {};
      for (let i = 0; i < yieldDraws; i++) rng = draw(rng, 'yield', 1, 1000).rng;
      const out: number[] = [];
      for (let i = 0; i < 5; i++) {
        const d = draw(rng, 'spare', 1, 1000);
        rng = d.rng;
        out.push(d.value);
      }
      return out;
    };
    const none = afterSpare(0);
    expect(afterSpare(50)).toEqual(none);
    expect(new Set(none).size).toBeGreaterThan(1);
  });

  test('known values', () => {
    expect(nextU32(99)).toEqual({ value: 1118692146, state: 1831565912 });
    let rng: RngState = {};
    const raw: number[] = [];
    for (let i = 0; i < 3; i++) {
      const d = draw(rng, 'yield', 1, 4294967296);
      rng = d.rng;
      raw.push(d.value);
    }
    expect(raw).toEqual([3691527598, 2949923741, 463591088]);
  });

  test('draw rejects a bad range and does not change its input', () => {
    const rng: RngState = { yield: 5 };
    for (const n of [0, -1, 1.5, NaN]) expect(() => draw(rng, 'yield', 1, n)).toThrow(RangeError);
    draw(rng, 'yield', 1, 10);
    expect(rng).toEqual({ yield: 5 });
    expect(draw({}, 'yield', 1, 1).value).toBe(0);
  });
});
