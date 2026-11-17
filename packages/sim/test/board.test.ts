import { describe, expect, test } from 'vitest';
import { advance, apply, capsOf, goalProgress, newGame, rewardPreview, step } from '../src/index';
import type { Command, Event, Offer, State } from '../src/index';
import { content, finished, run } from './town';

// M2e S1, the board's goals (spec J1 and J2). A goal is set on the board by hand where a test
// needs a given one; the draw itself is J1's.

const goal = (id: string) => content.goals.find((g) => g.id === id)!;

// The town with these goals on offer and, if given, one of them active.
function offered(state: State, goals: string[], active: string | null = null): State {
  return { ...state, board: { ...state.board, goals, active, progress: 0 } };
}

const tickOf = (state: State, command: Command) => step(state, [command], content);
const done = (events: Event[]) => events.filter((e) => e.type === 'goalDone');

describe('goals', () => {
  test('a new town is offered three goals', () => {
    const start = newGame(1, content);
    expect(start.board.goals).toEqual([]);
    const { state } = step(start, [], content);
    const goals = state.board.goals;
    expect(goals).toHaveLength(3);
    expect(new Set(goals).size).toBe(3);
    expect(state.board.active).toBeNull();
    // each eligible: offered at the Hamlet, not already true, and a make goal fits its store
    const caps = capsOf(state, content);
    for (const id of goals) {
      const g = goal(id);
      expect(g.hall, id).toBe(1);
      if (g.when.type === 'make') {
        expect(state.stock[g.when.resource] + g.when.amount, id).toBeLessThanOrEqual(
          caps[g.when.resource],
        );
      } else if (g.when.type === 'residents') {
        expect(state.residents.length, id).toBeLessThan(g.when.count);
      } else {
        const when = g.when;
        expect(
          state.buildings.some((b) => b.kind === when.kind && b.tier >= when.tier),
          id,
        ).toBe(false);
      }
    }
    // the draw is the seed's: the same seed draws the same goals, and nothing else moves
    expect(step(newGame(1, content), [], content).state.board.goals).toEqual(goals);
    expect({ ...state.rng, goals: 0 }).toEqual({ ...start.rng, goals: 0 });
    expect(state.rng.goals).not.toBe(undefined);
  });

  test('a met goal is not offered, nor one that cannot fit, nor one past the Hall', () => {
    // every store full: no make goal fits; a Mine built: Open the quarry is already true
    const caps = capsOf(newGame(1, content), content);
    const full = { ...finished(newGame(1, content), 'mine'), stock: { ...caps } };
    const { state } = step(full, [], content);
    expect(state.board.goals).toHaveLength(3);
    for (const id of state.board.goals) {
      expect(goal(id).when.type, id).not.toBe('make');
      expect(id).not.toBe('quarry');
      expect(goal(id).hall, id).toBe(1);
    }
  });

  test('no goal can be offered: the board stays empty and draws nothing', () => {
    const none = { ...content, goals: [] };
    const { state } = step(newGame(1, none), [], none);
    expect(state.board.goals).toEqual([]);
    expect(state.rng).not.toHaveProperty('goals');
  });

  test('picking a goal', () => {
    const town = offered(newGame(1, content), ['stockpile', 'quarry', 'twelve']);
    const refused = (command: Command, s: State) =>
      apply(s, [command], content).events.find((e) => e.type === 'rejected');
    expect(refused({ type: 'pickGoal', id: 'harvest' }, town)).toMatchObject({ reason: 'unknown' });
    const picked = apply(town, [{ type: 'pickGoal', id: 'stockpile' }], content).state;
    expect(picked.board.active).toBe('stockpile');
    expect(picked.board.progress).toBe(0);
    expect(refused({ type: 'pickGoal', id: 'stockpile' }, picked)).toMatchObject({
      reason: 'same',
    });
    // another of the three: it becomes active and progress restarts
    const going = { ...picked, board: { ...picked.board, progress: 30 } };
    const other = apply(going, [{ type: 'pickGoal', id: 'quarry' }], content).state;
    expect(other.board.active).toBe('quarry');
    expect(other.board.progress).toBe(0);
    expect(other.board.goals).toEqual(['stockpile', 'quarry', 'twelve']);
  });
});

describe('rewards', () => {
  test('a make goal pays', () => {
    // wood 0, so the goal fits and the reward has room everywhere; the camp makes the wood
    let town = { ...finished(newGame(1, content), 'woodcutter'), jobsDirty: true };
    town = offered({ ...town, stock: { ...town.stock, wood: 0 } }, [
      'stockpile',
      'quarry',
      'twelve',
    ]);
    town = apply(town, [{ type: 'pickGoal', id: 'stockpile' }], content).state;
    let made = 0;
    let paidAt = -1;
    let paid: State | null = null;
    for (let i = 0; i < 400 && paidAt < 0; i++) {
      const result = step(town, [], content);
      for (const e of result.events)
        if (e.type === 'made' && e.resource === 'wood') made += e.amount;
      if (done(result.events).length > 0) {
        paidAt = town.tick;
        paid = result.state;
        // the log line and the event
        const event = done(result.events)[0];
        expect(event).toMatchObject({ id: 'stockpile' });
        const line = result.state.log.at(-1)!;
        expect(line.type).toBe('goalDone');
        expect(line.text).toMatch(/^Goal met: Lay in timber\. .+ added to the stores\.$/);
        expect(line.text).not.toContain('stores full');
        // what it paid went into stock, beside what production made that tick
        const before = town.stock;
        for (const [id, n] of Object.entries(event.type === 'goalDone' ? event.paid : {})) {
          const producedNow = result.events
            .filter((e) => e.type === 'made' && e.resource === id)
            .reduce((sum, e) => sum + (e.type === 'made' ? e.amount : 0), 0);
          expect(result.state.stock[id] - before[id], id).toBe(n + producedNow);
        }
      } else {
        // progress counts production since the pick, and stops at the goal's amount
        expect(result.state.board.progress).toBe(Math.min(80, made));
      }
      town = result.state;
    }
    expect(paidAt).toBeGreaterThan(0);
    expect(made).toBeGreaterThanOrEqual(80);
    expect(paid!.board.active).toBeNull();
    expect(paid!.board.progress).toBe(0);
    // three new goals at once, and not the one just met
    expect(paid!.board.goals).toHaveLength(3);
    expect(paid!.board.goals).not.toContain('stockpile');
  });

  test('a building goal and a residents goal pay', () => {
    // a Mine finishes in the tick that runs the queue's last tick
    let town = offered(newGame(1, content), ['quarry', 'twelve', 'snug'], 'quarry');
    town = apply(town, [{ type: 'build', kind: 'mine' }], content).state;
    const ticks = content.buildings.find((b) => b.id === 'mine')!.tiers[0].ticks;
    town = run(town, ticks - 1);
    expect(town.board.active).toBe('quarry');
    const built = step(town, [], content);
    expect(built.events.some((e) => e.type === 'built')).toBe(true);
    expect(done(built.events)).toMatchObject([{ id: 'quarry' }]);
    expect(built.state.board.active).toBeNull();

    // twelve residents: true before the pick, so it pays in the tick it is picked
    const crowded = offered(newGame(1, content), ['quarry', 'twelve', 'snug']);
    const residents = Array.from({ length: 12 }, (_, i) => ({
      ...crowded.residents[i % 8],
      id: 100 + i,
    }));
    const twelve = { ...crowded, residents, nextId: 200 };
    const picked = tickOf(twelve, { type: 'pickGoal', id: 'twelve' });
    expect(done(picked.events)).toMatchObject([{ id: 'twelve' }]);
    expect(picked.state.log.at(-1)!.text).toMatch(/^Goal met: Twelve hearths\./);
    // a tier 0 Cottage (still being built) does not count for Snug cottages
    const snug = offered(newGame(1, content), ['snug'], 'snug');
    const cottage = snug.buildings.find((b) => b.kind === 'cottage')!;
    const waiting = { ...snug, buildings: [...snug.buildings, { ...cottage, id: 300, tier: 0 }] };
    expect(done(step(waiting, [], content).events)).toEqual([]);
    const tier2 = {
      ...snug,
      buildings: snug.buildings.map((b) => (b.kind === 'cottage' ? { ...b, tier: 2 } : b)),
    };
    expect(done(step(tier2, [], content).events)).toMatchObject([{ id: 'snug' }]);
  });

  test('a reward fills the stores with room', () => {
    // a goal worth 1,200: Open the quarry, met by a finished Mine
    const base = finished(newGame(1, content), 'mine');
    const caps = capsOf(base, content);
    const onlyOre = {
      ...offered(base, ['quarry'], 'quarry'),
      stock: { ...caps, ore: 40 },
    };
    expect(goal('quarry').reward).toBe(1200);
    const one = step(onlyOre, [], content);
    expect(done(one.events)).toEqual([{ type: 'goalDone', id: 'quarry', paid: { ore: 60 } }]);
    expect(one.state.stock).toEqual({ ...caps, ore: 100 });
    expect(one.state.log.at(-1)!.text).toBe(
      'Goal met: Open the quarry. 60 ore added to the stores. (stores full: the rest was lost)',
    );
    // empty stores: all five get some, less than the dearest unit (15) is left over
    const empty = {
      ...offered(base, ['quarry'], 'quarry'),
      stock: Object.fromEntries(content.resources.map((r) => [r.id, 0])),
    };
    const paid = done(step(empty, [], content).events)[0];
    if (paid.type !== 'goalDone') throw new Error('no goalDone');
    expect(Object.keys(paid.paid)).toEqual(content.resources.map((r) => r.id));
    const value = content.resources.reduce((sum, r) => sum + paid.paid[r.id] * r.value, 0);
    expect(1200 - value).toBeGreaterThanOrEqual(0);
    expect(1200 - value).toBeLessThan(15);
    expect(step(empty, [], content).state.log.at(-1)!.text).not.toContain('stores full');
    // the card's preview is the same split on the same stock
    expect(rewardPreview(empty, 'quarry', content)).toEqual(paid.paid);
    // tools with room for 2: their share passes to the others in the next rounds, so close to
    // the whole 1,200 is still paid
    const tight = { ...empty, stock: { ...empty.stock, tools: 48 } };
    const spread = done(step(tight, [], content).events)[0];
    if (spread.type !== 'goalDone') throw new Error('no goalDone');
    expect(spread.paid.tools).toBe(2);
    const spent = content.resources.reduce((sum, r) => sum + (spread.paid[r.id] ?? 0) * r.value, 0);
    expect(1200 - spent).toBeLessThan(15);
    // every store full: nothing is paid, and the log says so
    const full = { ...offered(base, ['quarry'], 'quarry'), stock: { ...caps } };
    const none = step(full, [], content);
    expect(done(none.events)).toEqual([{ type: 'goalDone', id: 'quarry', paid: {} }]);
    expect(none.state.log.at(-1)!.text).toBe(
      'Goal met: Open the quarry. The stores were full, so the reward was lost.',
    );
  });

  test('rewardPct scales every reward', () => {
    const base = finished(newGame(1, content), 'mine');
    const empty = Object.fromEntries(content.resources.map((r) => [r.id, 0]));
    const half = { ...content, rules: { ...content.rules, rewardPct: 50 } };
    const town = { ...offered(base, ['quarry'], 'quarry'), stock: empty };
    const value = (paid: Record<string, number>) =>
      content.resources.reduce((sum, r) => sum + (paid[r.id] ?? 0) * r.value, 0);
    const full = value(rewardPreview(town, 'quarry', content));
    const scaled = value(rewardPreview(town, 'quarry', half));
    expect(full).toBeGreaterThan(1185);
    expect(scaled).toBeGreaterThan(585);
    expect(scaled).toBeLessThanOrEqual(600);
  });

  test("the card's progress", () => {
    const town = newGame(1, content);
    expect(goalProgress(town, content)).toBeNull();
    const make = { ...offered(town, ['stockpile'], 'stockpile') };
    expect(goalProgress({ ...make, board: { ...make.board, progress: 12 } }, content)).toEqual({
      have: 12,
      need: 80,
    });
    expect(goalProgress(offered(town, ['twelve'], 'twelve'), content)).toEqual({
      have: 8,
      need: 12,
    });
    expect(goalProgress(offered(town, ['quarry'], 'quarry'), content)).toBeNull();
  });
});

// M2e S2, the trader (spec J3 and J4).
describe('trader', () => {
  const offer = (over: Partial<Offer> = {}): Offer => ({
    id: 1,
    give: { resource: 'wood', amount: 40 },
    get: { resource: 'tools', amount: 13 },
    until: 5000,
    ...over,
  });
  const withOffers = (state: State, offers: Offer[]): State => ({
    ...state,
    board: { ...state.board, offers, nextOfferId: Math.max(0, ...offers.map((o) => o.id)) + 1 },
  });

  test('an offer an hour, three at most', () => {
    const start = newGame(1, content);
    const after = (ticks: number) => advance(start, ticks, content).state.board;
    expect(after(12).offers).toHaveLength(0);
    expect(after(13).offers).toHaveLength(1);
    expect(after(253).offers).toHaveLength(2);
    expect(after(493).offers).toHaveLength(3);
    const full = after(733);
    expect(full.offers).toHaveLength(3);
    expect(full.offers.map((o) => o.id)).toEqual([1, 2, 3]);
    expect(full.nextOfferTick).toBe(972);
    expect(full.nextOfferId).toBe(4);
  });

  test('an offer swaps plenty for short', () => {
    const caps = capsOf(newGame(1, content), content);
    const value = (id: string) => content.resources.find((r) => r.id === id)!.value;
    // many seeds and stock levels: each offer obeys the rule it was drawn by
    let seen = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const start = newGame(seed, content);
      const stock = Object.fromEntries(
        content.resources.map((r, i) => [
          r.id,
          Math.floor((caps[r.id] * ((seed * (i + 3)) % 11)) / 10),
        ]),
      );
      const town = { ...start, stock, board: { ...start.board, nextOfferTick: 0 } };
      const { state } = step(town, [], content);
      const rank = (id: string) => Math.floor((stock[id] * 1000) / caps[id]);
      const byRank = content.resources.map((r) => r.id).sort((a, b) => rank(b) - rank(a));
      const shortOnes = byRank.filter((id) => stock[id] * 100 < caps[id] * 80).reverse();
      const o = state.board.offers[0];
      if (!o) continue;
      seen += 1;
      expect(byRank.slice(0, 2).map(rank), `seed ${seed}`).toContain(rank(o.give.resource));
      expect(stock[o.get.resource] * 100, `seed ${seed}`).toBeLessThan(caps[o.get.resource] * 80);
      expect(o.get.resource).not.toBe(o.give.resource);
      const lowest = shortOnes
        .filter((id) => id !== o.give.resource)
        .map(rank)
        .slice(0, 2);
      expect(lowest, `seed ${seed}`).toContain(rank(o.get.resource));
      expect(o.give.amount).toBe(
        Math.min(Math.floor(caps[o.give.resource] / 5), stock[o.give.resource]),
      );
      expect(o.get.amount).toBe(
        Math.max(1, Math.floor((o.give.amount * value(o.give.resource)) / value(o.get.resource))),
      );
    }
    expect(seen).toBeGreaterThan(20);
    // nothing below 80%: no offer, but the hour still passes
    const start = newGame(1, content);
    const rich = { ...start, stock: { ...caps }, board: { ...start.board, nextOfferTick: 0 } };
    const none = step(rich, [], content).state.board;
    expect(none.offers).toEqual([]);
    expect(none.nextOfferTick).toBe(240);
  });

  test('an offer outlasts the catch-up cap', () => {
    const drawn = advance(newGame(1, content), 13, content).state;
    expect(drawn.board.offers[0].until).toBe(12 + 1920 + 240);
    // the Hall reaches the Village: every waiting offer is stretched in that tick
    const hallJob = { target: 'hall' as const, toTier: 2, ticksLeft: 1, cost: {} };
    const growing = { ...withOffers(drawn, [offer({ until: 100 })]), queue: [hallJob] };
    const grown = step(growing, [], content).state;
    expect(grown.hallTier).toBe(2);
    expect(grown.board.offers[0].until).toBe(13 + 3840 + 240);
    // at `until` the offer is dropped and the log says so
    const leaving = withOffers(drawn, [offer({ until: 13 })]);
    const gone = step(leaving, [], content);
    expect(gone.state.board.offers).toEqual([]);
    expect(gone.events).toContainEqual({ type: 'offerGone', id: 1 });
    expect(gone.state.log.map((l) => l.text)).toContain('The trader moved on.');
  });

  test('an accepted swap pays a day later', () => {
    const town = withOffers(
      { ...newGame(1, content), stock: { ...newGame(1, content).stock, wood: 50, tools: 0 } },
      [offer({ give: { resource: 'wood', amount: 40 }, get: { resource: 'tools', amount: 13 } })],
    );
    const t = town.tick;
    const sent = step(town, [{ type: 'acceptOffer', id: 1 }], content);
    expect(sent.state.stock.wood).toBe(10);
    expect(sent.state.board.offers).toEqual([]);
    expect(sent.state.board.deliveries).toEqual([{ resource: 'tools', amount: 13, at: t + 24 }]);
    expect(sent.state.log.map((l) => l.text)).toContain('Sent 40 wood to the trader.');
    let s = run(sent.state, 23);
    expect(s.stock.tools).toBe(0);
    const arrives = step(s, [], content);
    expect(arrives.state.stock.tools).toBe(13);
    expect(arrives.events).toContainEqual({ type: 'delivered', resource: 'tools', amount: 13 });
    expect(arrives.state.log.at(-1)!.text).toBe("The trader's 13 tools arrived.");
    expect(arrives.state.board.deliveries).toEqual([]);
    // tools at 45 of 50: 5 fit, 8 are lost
    s = { ...s, stock: { ...s.stock, tools: 45 } };
    const over = step(s, [], content);
    expect(over.state.stock.tools).toBe(50);
    expect(over.events).toContainEqual({ type: 'lost', resource: 'tools', amount: 8 });
    expect(over.events).toContainEqual({ type: 'delivered', resource: 'tools', amount: 5 });
    expect(over.state.log.at(-1)!.text).toBe(
      "The trader's 13 tools arrived. (stores full: the rest was lost)",
    );
  });

  test('a swap the town cannot pay; declining', () => {
    const start = newGame(1, content);
    const town = withOffers({ ...start, stock: { ...start.stock, wood: 30 } }, [offer()]);
    const rejected = (command: Command) =>
      apply(town, [command], content).events.find((e) => e.type === 'rejected');
    expect(rejected({ type: 'acceptOffer', id: 1 })).toMatchObject({ reason: 'noStock' });
    expect(rejected({ type: 'acceptOffer', id: 9 })).toMatchObject({ reason: 'unknown' });
    expect(rejected({ type: 'declineOffer', id: 9 })).toMatchObject({ reason: 'unknown' });
    const declined = apply(town, [{ type: 'declineOffer', id: 1 }], content);
    expect(declined.state.board.offers).toEqual([]);
    expect(declined.state.stock).toEqual(town.stock);
    expect(declined.state.log).toEqual(town.log);
    expect(declined.events).toEqual([]);
  });
});
