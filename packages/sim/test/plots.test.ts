import { describe, expect, test } from 'vitest';
import { apply, assignJobs, boostOf, newGame, plotsFor, refusal } from '../src/index';
import type { Building, Command, Plot, State } from '../src/index';
import { byKind, content, finished, rich, run, steady } from './town';

const send = (state: State, ...commands: Command[]) => apply(state, commands, content);
const town = (s: State) => s.plots.filter((p) => p.ground === null);
const sites = (s: State) => s.plots.filter((p) => p.ground !== null);

describe('plots', () => {
  test("a new town's plots", () => {
    const s = newGame(1, content);
    expect(s.plots).toHaveLength(31);
    s.plots.forEach((plot, i) => expect(plot.id).toBe(i));
    // 16 town lots first: 6 open at tier 1, 4 at tier 2, 6 at tier 3, the Tangle closed
    const lots = town(s);
    expect(lots).toEqual(s.plots.slice(0, 16));
    expect(lots.map((p) => p.tier)).toEqual([1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3]);
    expect(lots.map((p) => p.open)).toEqual(lots.map((p) => p.tier === 1));
    // the deck: 3 of each feature and 4 plain
    const count = (f: string | null) => lots.filter((p) => p.feature === f).length;
    for (const feature of content.features) expect(count(feature.id)).toBe(3);
    expect(count(null)).toBe(4);
    // then 3 sites per ground in content order, tiers 1, 2, 3, with no feature
    const expected = content.grounds.flatMap((g) =>
      [1, 2, 3].map((tier) => ({ ground: g.id, feature: null, tier, open: tier === 1 })),
    );
    expect(
      sites(s).map(({ ground, feature, tier, open }) => ({ ground, feature, tier, open })),
    ).toEqual(expected);
    // the Cottage on the first open town lot, the Forager's hut on the open woods site
    expect(byKind(s, 'cottage').plot).toBe(0);
    const woods = s.plots.find((p) => p.ground === 'woods' && p.tier === 1)!;
    expect(byKind(s, 'forager').plot).toBe(woods.id);
    for (const b of s.buildings) {
      expect(b.shutLeft).toBe(0);
      expect(b.shutBy).toBeNull();
    }
  });

  test('the six open lots hold at least two features on every seed', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const open = town(newGame(seed, content)).filter((p) => p.open);
      expect(open.filter((p) => p.feature !== null).length, `seed ${seed}`).toBeGreaterThanOrEqual(
        2,
      );
    }
  });

  test('plots come from the seed', () => {
    const order = (seed: number) => town(newGame(seed, content)).map((p) => p.feature);
    expect(order(1)).not.toEqual(order(2));
    expect(newGame(1, content).plots).toEqual(newGame(1, content).plots);
    // the deck is drawn on its own stream
    expect(Object.keys(newGame(1, content).rng)).toContain('lots');
  });
});

// The first open town lot with no feature that is free, for a test that must not be boosted.
const plainLot = (s: State): Plot =>
  s.plots.find(
    (p) =>
      p.ground === null &&
      p.open &&
      p.feature === null &&
      !s.buildings.some((b) => b.plot === p.id),
  )!;
const lotWith = (s: State, feature: string): Plot =>
  s.plots.find((p) => p.ground === null && p.feature === feature)!;

describe('building on a plot', () => {
  test('the building stands on the plot named', () => {
    const s = rich();
    const lot = plainLot(s);
    const done = send(s, { type: 'build', kind: 'workshop', plot: lot.id });
    expect(done.events).toEqual([]);
    expect(byKind(done.state, 'workshop').plot).toBe(lot.id);
    // a site kind goes on its ground's site
    const forest = s.plots.find((p) => p.ground === 'forest' && p.open)!;
    const camp = send(s, { type: 'build', kind: 'woodcutter', plot: forest.id });
    expect(camp.events).toEqual([]);
    expect(byKind(camp.state, 'woodcutter').plot).toBe(forest.id);
  });

  test('refusals, in order', () => {
    const s = rich();
    const lot = plainLot(s);
    const closed = s.plots.find((p) => p.ground === null && !p.open)!;
    const closedForest = s.plots.find((p) => p.ground === 'forest' && !p.open)!;
    const forest = s.plots.find((p) => p.ground === 'forest' && p.open)!;
    const why = (state: State, kind: string, plot: number) =>
      refusal(state, { type: 'build', kind, plot }, content);
    expect(why(s, 'castle', lot.id)).toBe('unknown');
    expect(why(s, 'workshop', 99)).toBe('unknown');
    expect(why(s, 'workshop', 1.5)).toBe('unknown');
    expect(why(s, 'workshop', closed.id)).toBe('notReady');
    expect(why(s, 'woodcutter', closedForest.id)).toBe('notReady');
    // taken by a finished building, and by one still queued
    expect(why(s, 'workshop', 0)).toBe('busy');
    const queued = send(s, { type: 'build', kind: 'workshop', plot: lot.id }).state;
    expect(queued.buildings.find((b) => b.plot === lot.id)!.tier).toBe(0);
    expect(why(queued, 'tavern', lot.id)).toBe('busy');
    // a site kind on a town lot, a town kind on a site, the wrong ground
    expect(why(s, 'woodcutter', lot.id)).toBe('notAllowed');
    expect(why(s, 'workshop', forest.id)).toBe('notAllowed');
    const mountain = s.plots.find((p) => p.ground === 'mountain' && p.open)!;
    expect(why(s, 'woodcutter', mountain.id)).toBe('notAllowed');
    // no free plot for the kind at all comes first, even before the plot is looked at
    const camped = send(s, { type: 'build', kind: 'woodcutter', plot: forest.id }).state;
    expect(why(camped, 'woodcutter', 99)).toBe('noLot');
    // stock last; the queue before it
    const poor: State = { ...s, stock: { ...s.stock, stone: 0 } };
    expect(why(poor, 'workshop', lot.id)).toBe('noStock');
    const others = s.plots.filter(
      (p) => p.ground === null && p.open && !s.buildings.some((b) => b.plot === p.id),
    );
    let full = s;
    for (const p of others.slice(0, 4))
      full = send(full, { type: 'build', kind: 'cottage', plot: p.id }).state;
    expect(full.queue).toHaveLength(4);
    expect(why({ ...full, stock: poor.stock }, 'workshop', others[4].id)).toBe('queueFull');
  });

  test('a Hamlet with 6 town buildings and 3 on sites is legal', () => {
    let s = rich();
    for (const kind of ['woodcutter', 'mine']) {
      const plot = plotsFor(s, kind, content)[0];
      s = send(s, { type: 'build', kind, plot: plot.id }).state;
    }
    for (let i = 0; i < 5; i++) {
      s = run(s, 50);
      s = { ...s, stock: rich().stock };
      const plot = plotsFor(s, 'cottage', content)[0];
      s = send(s, { type: 'build', kind: 'cottage', plot: plot.id }).state;
      expect(s.buildings.filter((b) => b.kind === 'cottage')).toHaveLength(2 + i);
    }
    // the Forager's hut, the camp and the Mine on sites, more than the Hamlet's 6 lots in all
    expect(s.buildings).toHaveLength(9);
    expect(plotsFor(s, 'cottage', content)).toEqual([]);
    expect(refusal(s, { type: 'build', kind: 'tavern', plot: 3 }, content)).toBe('noLot');
  });

  test('plotsFor lists boosted lots first, then the rest, each in id order', () => {
    const s = newGame(1, content);
    const list = plotsFor(s, 'workshop', content);
    const boosted = list.filter((p) => p.feature === 'rock' || p.feature === 'edge');
    expect(list.slice(0, boosted.length)).toEqual(boosted);
    const ids = (ps: Plot[]) => ps.map((p) => p.id);
    expect(ids(boosted)).toEqual([...ids(boosted)].sort((a, b) => a - b));
    const rest = list.slice(boosted.length);
    expect(ids(rest)).toEqual([...ids(rest)].sort((a, b) => a - b));
    // open, free town lots only: 5 (the Cottage holds lot 0)
    expect(list).toHaveLength(5);
    expect(list.every((p) => p.open && p.ground === null && p.id !== 0)).toBe(true);
    // seed 7's open lots are plain, riverside, rock outcrop, plain, plain, good soil: the rock
    // outcrop lot comes before the lower ids
    const seven = newGame(7, content);
    expect(seven.plots.slice(0, 6).map((p) => p.feature)).toEqual([
      null,
      'river',
      'rock',
      null,
      null,
      'soil',
    ]);
    expect(ids(plotsFor(seven, 'workshop', content))).toEqual([2, 1, 3, 4, 5]);
    expect(ids(plotsFor(seven, 'cottage', content))).toEqual([1, 2, 3, 4, 5]);
    // a site kind gets its ground's open site
    expect(plotsFor(s, 'mine', content).map((p) => p.ground)).toEqual(['mountain']);
    expect(plotsFor(s, 'forager', content)).toEqual([]);
  });
});

// A Workshop on `plot` forging with the town's 8 founders at skill 50 and morale 50.
function forge(plot: number): State {
  let s = finished(steady(rich()), 'workshop');
  s = {
    ...s,
    buildings: s.buildings.map((b): Building =>
      b.kind === 'workshop' ? { ...b, plot, method: 'forge', owned: [...b.owned, 'forge'] } : b,
    ),
  };
  // the Forager's hut and the Cottage keep no one, so every founder can work at the Workshop
  s = {
    ...s,
    buildings: s.buildings.map((b): Building => (b.kind === 'forager' ? { ...b, open: 0 } : b)),
    stock: { ...s.stock, tools: 0 },
  };
  const out = JSON.parse(JSON.stringify(s)) as State;
  assignJobs(out, content);
  return out;
}

describe('a feature raises output', () => {
  test('a Workshop on a rock outcrop makes 25% more tools; uses are not raised', () => {
    const rock = lotWith(rich(), 'rock');
    const plain = plainLot(rich());
    // a hand-built state: production reads the lot's feature, not whether it was cleared
    const onRock = forge(rock.id);
    const onPlain = forge(plain.id);
    const shop = (s: State) => byKind(s, 'workshop');
    expect(boostOf(onRock, shop(onRock), content)).toBe(25);
    expect(boostOf(onPlain, shop(onPlain), content)).toBe(0);
    const a = run(onRock, 24);
    const b = run(onPlain, 24);
    const made = (s: State) => s.stock.tools * 10000 + (shop(s).carry.tools ?? 0);
    // 4 workers at effect 100 each: 400, boosted to floor(400 x 125 / 100) = 500, 6 cycles
    expect(made(b)).toBe(6 * 25 * 400);
    expect(made(a)).toBe(6 * 25 * 500);
    expect(a.stock.ore).toBe(b.stock.ore);
    expect(a.stock.wood).toBe(b.stock.wood);
  });
});

describe('clearing frees the plot', () => {
  test('a cleared building leaves its plot free and open', () => {
    const s = rich();
    const lot = plainLot(s);
    const built = run(send(s, { type: 'build', kind: 'cottage', plot: lot.id }).state, 12);
    const cottage = built.buildings.find((b) => b.plot === lot.id)!;
    expect(cottage.tier).toBe(1);
    const cleared = send(built, { type: 'clear', buildingId: cottage.id }).state;
    expect(cleared.buildings.some((b) => b.plot === lot.id)).toBe(false);
    expect(cleared.plots[lot.id].open).toBe(true);
    expect(plotsFor(cleared, 'cottage', content).map((p) => p.id)).toContain(lot.id);
  });
});
