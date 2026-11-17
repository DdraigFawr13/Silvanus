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
      c.goals = c.goals.filter((g) => !(g.when.type === 'make' && g.when.resource === 'food'));
      c.trips.finds = c.trips.finds.filter((f) => f.resource !== 'food');
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
  // goods' values, goals and trips (M2e)
  [
    'a resource with no value',
    /^ore has no value$/,
    (c) => {
      c.resources.find((r) => r.id === 'ore')!.value = 0;
    },
  ],
  [
    'a goal listed twice',
    /^goal quarry is listed twice$/,
    (c) => {
      c.goals.push({ ...c.goals.find((g) => g.id === 'quarry')! });
    },
  ],
  [
    'a goal past the last Hall tier',
    /^goal toolmaker names no Hall tier$/,
    (c) => {
      c.goals.find((g) => g.id === 'toolmaker')!.hall = 3;
    },
  ],
  [
    'a goal of an unknown resource',
    /^goal stockpile names an unknown resource, gold$/,
    (c) => {
      c.goals.find((g) => g.id === 'stockpile')!.when = {
        type: 'make',
        resource: 'gold',
        amount: 5,
      };
    },
  ],
  [
    'a make goal past a base store',
    /^goal stockpile asks for more wood than a base store holds$/,
    (c) => {
      c.goals.find((g) => g.id === 'stockpile')!.when = {
        type: 'make',
        resource: 'wood',
        amount: 201,
      };
    },
  ],
  [
    'a goal of an unknown building',
    /^goal quarry names an unknown building, castle$/,
    (c) => {
      c.goals.find((g) => g.id === 'quarry')!.when = { type: 'building', kind: 'castle', tier: 1 };
    },
  ],
  [
    'a goal of a tier the building lacks',
    /^goal quarry names a tier mine does not have$/,
    (c) => {
      c.goals.find((g) => g.id === 'quarry')!.when = { type: 'building', kind: 'mine', tier: 4 };
    },
  ],
  [
    'a residents goal of 0',
    /^goal twelve has a zero or negative count$/,
    (c) => {
      c.goals.find((g) => g.id === 'twelve')!.when = { type: 'residents', count: 0 };
    },
  ],
  [
    'a goal with no reward',
    /^goal twelve has a zero or negative reward$/,
    (c) => {
      c.goals.find((g) => g.id === 'twelve')!.reward = 0;
    },
  ],
  [
    'too few Hamlet goals',
    /^there must be at least 3 goals at Hall tier 1$/,
    (c) => {
      c.goals = c.goals
        .filter((g) => g.hall !== 1)
        .concat(c.goals.filter((g) => g.hall === 1).slice(0, 2));
    },
  ],
  [
    'a trip find of an unknown resource',
    /^a trip find names an unknown resource, gold$/,
    (c) => {
      c.trips.finds[0].resource = 'gold';
    },
  ],
  [
    'a trip find with min above max',
    /^the trip find of wood needs 1 <= min <= max$/,
    (c) => {
      c.trips.finds[1].min = 30;
    },
  ],
  [
    'a trip of no one',
    /^trips size is a zero or negative number$/,
    (c) => {
      c.trips.size = 0;
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

  // The bands are the soak's measured hour of work (spec, "Content"); this only catches typos.
  test('goal rewards are about an hour of work', () => {
    for (const goal of content.goals) {
      const [from, to] = goal.hall === 1 ? [900, 1600] : [1800, 2800];
      expect(goal.reward, goal.id).toBeGreaterThanOrEqual(from);
      expect(goal.reward, goal.id).toBeLessThanOrEqual(to);
    }
    expect(content.goals.filter((g) => g.hall === 2)).toHaveLength(6);
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
