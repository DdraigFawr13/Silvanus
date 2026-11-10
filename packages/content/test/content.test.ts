import { advance, newGame, validateContent } from '@silvanus/sim';
import type { Content } from '@silvanus/sim';
import { describe, expect, test } from 'vitest';
import { content } from '../src/index';

// Each returns the real content with one fault planted in a copy.
const planted: [fault: string, message: RegExp, make: (c: Content) => void][] = [
  [
    'a missing fallback',
    /^method forge has no fallback$/,
    (c) => {
      c.methods.find((m) => m.id === 'forge')!.fallback = null;
    },
  ],
  [
    'a fallback in another building',
    /^method forge has no fallback$/,
    (c) => {
      c.methods.find((m) => m.id === 'forge')!.fallback = 'gather';
    },
  ],
  [
    'a cost in an unknown resource',
    /^mine tier 1's cost names an unknown resource, gold$/,
    (c) => {
      c.buildings.find((b) => b.id === 'mine')!.tiers[0].cost = { gold: 5 };
    },
  ],
  [
    'a tier with no ticks',
    /^farm tier 2 has no ticks$/,
    (c) => {
      c.buildings.find((b) => b.id === 'farm')!.tiers[1].ticks = 0;
    },
  ],
  [
    'a zero number',
    /^method axes's output has a zero or negative number for wood$/,
    (c) => {
      c.methods.find((m) => m.id === 'axes')!.makes = { wood: 0 };
    },
  ],
  [
    'a negative number',
    /^rule queueMax is a zero or negative number$/,
    (c) => {
      c.rules.queueMax = -1;
    },
  ],
  [
    'a Hall cost above a base cap',
    /^Hall tier 2 costs more tools than a base store holds$/,
    (c) => {
      c.hall.tiers[1].cost = { ...c.hall.tiers[1].cost, tools: 51 };
    },
  ],
];

describe('content', () => {
  test('validateContent names each planted fault', () => {
    for (const [fault, message, make] of planted) {
      const copy = JSON.parse(JSON.stringify(content)) as Content;
      make(copy);
      const found = validateContent(copy);
      expect(found, fault).toHaveLength(1);
      expect(found[0], fault).toMatch(message);
    }
  });

  test('the real content is valid and runs 96 ticks', () => {
    expect(validateContent(content)).toEqual([]);
    const start = newGame(1, content);
    expect(start.residents).toHaveLength(8);
    expect(start.buildings.map((b) => [b.kind, b.tier])).toEqual([
      ['cottage', 1],
      ['forager', 1],
    ]);
    const { state, summary } = advance(start, 96, content);
    expect(state.tick).toBe(96);
    // 24 cycles of +2 food, 3 days of 8 eaten (the day at tick 96 has not started)
    expect(summary.made.food).toBe(48);
    expect(state.stock.food).toBe(40 + 48 - 24);
  });
});
