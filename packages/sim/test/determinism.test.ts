import { expect, test } from 'vitest';
import { advance, apply, newGame, step } from '../src/index';
import type { Command, State } from '../src/index';
import { content } from './town';

// Seed 1's ids: residents 1 to 8, the Cottage 9, the Forager's hut 10, then buildings and
// settlers share the ids that follow (S5): the camp 11, the Mine 12, the second Cottage 13,
// settlers 14 to 16 at ticks 168, 192 and 216, the Workshop 17. Ids read from a probe run.
// Seed 1's plots (M2d S1): town lots 0 to 5 are plain, forest edge, good soil, plain, riverside,
// plain; sites 16 forest, 19 mountain. Builds go on plain lots so the pinned numbers hold.
// Later slices add to this script, in tick order: `chunked` finds the next tick by array order.
const SCRIPT: { tick: number; command: Command }[] = [
  { tick: 0, command: { type: 'build', kind: 'woodcutter', plot: 16 } }, // 11, free, the forest site
  { tick: 0, command: { type: 'build', kind: 'mine', plot: 19 } }, // 12, the mountain site
  { tick: 5, command: { type: 'build', kind: 'tavern', plot: 3 } }, // refused: no stone
  { tick: 40, command: { type: 'setOpen', buildingId: 10, count: 2 } },
  { tick: 60, command: { type: 'pin', residentId: 1, buildingId: 12 } },
  { tick: 100, command: { type: 'setMethod', buildingId: 12, method: 'stone' } },
  { tick: 101, command: { type: 'setMethod', buildingId: 12, method: 'shafts' } }, // refused: tier 2
  { tick: 102, command: { type: 'setMethod', buildingId: 12, method: 'stone' } }, // refused: same
  { tick: 150, command: { type: 'build', kind: 'cottage', plot: 3 } }, // 13, a plain lot
  { tick: 151, command: { type: 'build', kind: 'storehouse', plot: 5 } }, // refused: no stone
  { tick: 152, command: { type: 'cancelJob', index: 1 } }, // refused: nothing is waiting
  { tick: 200, command: { type: 'upgradeHall' } }, // refused: too few for a Village
  { tick: 300, command: { type: 'upgrade', buildingId: 10 } }, // refused: no tools
  { tick: 310, command: { type: 'build', kind: 'workshop', plot: 5 } }, // 17, a plain lot
  { tick: 340, command: { type: 'setMethod', buildingId: 17, method: 'forge' } }, // bought
  { tick: 341, command: { type: 'setMethod', buildingId: 17, method: 'hammer' } }, // refused: tier 2
  // S4: the Mine's workers move to the Workshop, which then forges through its ore
  { tick: 345, command: { type: 'setOpen', buildingId: 12, count: 0 } },
  { tick: 470, command: { type: 'setOpen', buildingId: 12, count: 4 } },
  // ore runs out at the Workshop, and comes back once the Mine digs ore again
  { tick: 480, command: { type: 'setMethod', buildingId: 12, method: 'ore' } },
  { tick: 500, command: { type: 'pin', residentId: 1, buildingId: null } },
  { tick: 560, command: { type: 'setMethod', buildingId: 17, method: 'mend' } }, // owned: free
  { tick: 600, command: { type: 'setOpen', buildingId: 11, count: 1 } },
  { tick: 700, command: { type: 'clear', buildingId: 12 } },
];
const TICKS = 1000;
const at = (tick: number) => SCRIPT.filter((entry) => entry.tick === tick).map((e) => e.command);

function chunked(start: State, longest: number): State {
  let state = start;
  while (state.tick < TICKS) {
    const commands = at(state.tick);
    if (commands.length > 0) state = apply(state, commands, content).state;
    const next = SCRIPT.map((e) => e.tick).find((tick) => tick > state.tick) ?? TICKS;
    const stop = Math.min(next, TICKS);
    while (state.tick < stop) {
      state = advance(state, Math.min(longest, stop - state.tick), content).state;
    }
  }
  return state;
}

test('chunks and steps agree with commands between', () => {
  const start = newGame(1, content);
  let stepped = start;
  const refused: string[] = [];
  for (let tick = 0; tick < TICKS; tick++) {
    const result = step(stepped, at(tick), content);
    stepped = result.state;
    for (const event of result.events) {
      if (event.type === 'rejected') refused.push(`${tick} ${event.command.type} ${event.reason}`);
    }
  }
  expect(stepped.tick).toBe(TICKS);
  // exactly the commands the script marks as refused, each for the reason it names (M1 audit F6)
  expect(refused).toEqual([
    '5 build noStock',
    '101 setMethod notAllowed',
    '102 setMethod same',
    '151 build noStock',
    '152 cancelJob range',
    '200 upgradeHall tooFew',
    '300 upgrade noStock',
    '341 setMethod notAllowed',
  ]);
  expect(stepped.buildings.map((b) => b.kind)).toEqual([
    'cottage',
    'forager',
    'woodcutter',
    'cottage',
    'workshop',
  ]);
  // the Workshop bought Forge tools, ran short of ore and was switched back for free
  const shop = stepped.buildings.find((b) => b.kind === 'workshop')!;
  expect(shop.owned).toEqual(['mend', 'forge']);
  expect(shop.method).toBe('mend');
  // short at tick 419, back on Forge once ore came, then short and back again until the switch
  // to Mend at 560: one line each time it turns short
  expect(stepped.log.filter((line) => line.type === 'short').map((line) => line.tick)).toEqual([
    419, 491, 499, 507, 523, 539, 555,
  ]);
  // three settlers came, and one left once their town of 11 was unhappy (the next may leave only
  // 672 ticks later, D-039, after this run)
  const growth = (type: string) =>
    stepped.log.filter((line) => line.type === type).map((line) => line.tick);
  expect(growth('arrived')).toEqual([168, 192, 216]);
  expect(growth('left')).toEqual([672]);
  for (const longest of [7, 480, 1]) {
    expect(chunked(start, longest), `chunks of ${longest}`).toEqual(stepped);
  }
  expect(start.tick).toBe(0);
});

// M2e J6: board commands between chunks of catch-up give the same town as stepping. The
// commands are read off the stepped town (what is on offer depends on the draws), then replayed.
test('the board replays in chunks', () => {
  const start = newGame(1, content);
  const script: { tick: number; command: Command }[] = [];
  const met: string[] = [];
  let delivered = 0;
  let trips = 0;
  let stepped = start;
  for (let tick = 0; tick < TICKS; tick++) {
    const commands: Command[] = [];
    const board = stepped.board;
    // every 50 ticks pick the first goal on offer when none is active; once, at 300, switch
    if (tick % 50 === 0 && board.goals.length > 0 && board.active === null) {
      commands.push({ type: 'pickGoal', id: board.goals[0] });
    }
    const other = board.goals.find((id) => id !== board.active);
    if (tick === 300 && board.active !== null && other) {
      commands.push({ type: 'pickGoal', id: other });
    }
    if (tick === 7) commands.push({ type: 'pickGoal', id: 'none' }); // refused: unknown
    // S2: at 25 past each 100 ticks take the oldest offer when the stock covers it; at 75 past,
    // decline it
    const oldest = board.offers[0];
    if (tick % 100 === 25 && oldest && stepped.stock[oldest.give.resource] >= oldest.give.amount) {
      commands.push({ type: 'acceptOffer', id: oldest.id });
    }
    if (tick % 100 === 75 && oldest) commands.push({ type: 'declineOffer', id: oldest.id });
    if (tick === 8) commands.push({ type: 'declineOffer', id: 99 }); // refused: unknown
    // S3: a trip of the two highest ids every 200 ticks, offset 10, when none is out
    if (tick % 200 === 10 && board.trip === null) {
      const ids = stepped.residents.slice(-2).map((r) => r.id);
      commands.push({ type: 'sendTrip', residentIds: ids });
    }
    for (const command of commands) script.push({ tick, command });
    const result = step(stepped, commands, content);
    for (const e of result.events) {
      if (e.type === 'goalDone') met.push(e.id);
      if (e.type === 'delivered') delivered += 1;
      if (e.type === 'tripBack') trips += 1;
    }
    stepped = result.state;
  }
  // the script did reach the board: at least one goal was met and paid, a swap was delivered
  expect(met.length).toBeGreaterThan(0);
  expect(delivered).toBeGreaterThan(0);
  expect(trips).toBeGreaterThan(0);
  expect(script.some((e) => e.command.type === 'declineOffer' && e.command.id !== 99)).toBe(true);
  for (const longest of [7, 480, 1]) {
    let state = start;
    let at = 0;
    while (state.tick < TICKS) {
      const now: Command[] = [];
      while (at < script.length && script[at].tick === state.tick) now.push(script[at++].command);
      if (now.length > 0) state = apply(state, now, content).state;
      const next = at < script.length ? script[at].tick : TICKS;
      state = advance(state, Math.min(longest, next - state.tick), content).state;
    }
    expect(state, `chunks of ${longest}`).toEqual(stepped);
  }
});
