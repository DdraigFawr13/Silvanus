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
  [
    'a method price above a base cap',
    /^method hammer costs more tools than a base store holds$/,
    (c) => {
      c.methods.find((m) => m.id === 'hammer')!.cost = { tools: 51 };
    },
  ],
  [
    'a fallback with inputs',
    /^method cutstone falls back to stone, which has a price$/,
    (c) => {
      const stone = c.methods.find((m) => m.id === 'stone')!;
      stone.uses = { wood: 1 };
      stone.cost = { wood: 5 };
      stone.fallback = 'ore';
    },
  ],
  [
    'a kind that starts on a method with a price',
    /^workshop starts on forge, which has a price$/,
    (c) => {
      // Forge tools listed first: a new Workshop would start on a method it does not own
      const [mend, forge, hammer] = c.methods.filter((m) => m.building === 'workshop');
      c.methods = [...c.methods.filter((m) => m.building !== 'workshop'), forge, mend, hammer];
    },
  ],
  [
    'a method with no inputs and a price',
    /^method forge has no inputs but a price$/,
    (c) => {
      c.methods.find((m) => m.id === 'forge')!.uses = {};
    },
  ],
  [
    'a method with inputs and no price',
    /^method forge has inputs but no price$/,
    (c) => {
      c.methods.find((m) => m.id === 'forge')!.cost = {};
    },
  ],
  // references between content entries (M1 audit F8)
  [
    'a building with an unknown skill',
    /^mine names an unknown skill, digging$/,
    (c) => {
      c.buildings.find((b) => b.id === 'mine')!.skill = 'digging';
    },
  ],
  [
    'a trait that likes an unknown building',
    /^trait \w+ names an unknown building, quarry$/,
    (c) => {
      c.traits[0].likes = ['quarry'];
    },
  ],
  [
    'a method of an unknown building',
    /^method axes2 belongs to an unknown building, sawmill$/,
    (c) => {
      // a new basic method, so no other method's fallback moves with it
      const axes = c.methods.find((m) => m.id === 'axes')!;
      c.methods.push({ ...axes, id: 'axes2', building: 'sawmill' });
    },
  ],
  [
    'a people with no names table',
    /^people dwarf has no names table$/,
    (c) => {
      delete c.names.dwarf;
    },
  ],
  [
    'a people leaning to an unknown skill',
    /^people human leans to an unknown skill, sailing$/,
    (c) => {
      c.peoples.find((p) => p.id === 'human')!.leans = ['sailing'];
    },
  ],
  [
    'a start above the cap',
    /^food starts above its cap$/,
    (c) => {
      c.resources.find((r) => r.id === 'food')!.start = 201;
    },
  ],
  [
    'fewer than two traits',
    /^there must be at least 2 traits$/,
    (c) => {
      c.traits = c.traits.slice(0, 1);
    },
  ],
  [
    'no food resource',
    /^the engine needs a resource with id food$/,
    (c) => {
      c.resources = c.resources.filter((r) => r.id !== 'food');
      // keep every other reference sound, so only this rule is broken
      for (const kind of c.buildings) for (const t of kind.tiers) delete t.cost.food;
      for (const m of c.methods) {
        delete m.makes.food;
        delete m.uses.food;
        delete m.cost.food;
      }
      for (const t of c.hall.tiers) delete t.cost.food;
    },
  ],
  [
    'no forager',
    /^the engine needs a building kind with id forager$/,
    (c) => {
      c.buildings = c.buildings.filter((b) => b.id !== 'forager');
      c.methods = c.methods.filter((m) => m.building !== 'forager');
      for (const t of c.traits) {
        t.likes = t.likes.filter((k) => k !== 'forager');
        t.dislikes = t.dislikes.filter((k) => k !== 'forager');
      }
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
    // the real content runs: the foragers make food, and the store is what was made less 3 days
    // of 8 eaten (the day at tick 96 has not started). The new town's shape is saves.test.ts's.
    const start = newGame(1, content);
    const { state, summary } = advance(start, 96, content);
    expect(state.tick).toBe(96);
    expect(summary.made.food).toBeGreaterThan(0);
    expect(state.stock.food).toBe(40 + summary.made.food - 24);
  });
});
