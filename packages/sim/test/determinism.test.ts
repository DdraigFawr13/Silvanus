import { expect, test } from 'vitest';
import { advance, apply, newGame, step } from '../src/index';
import type { Command, State } from '../src/index';
import { content } from './town';

// Seed 1's ids: residents 1 to 8, the Cottage 9, the Forager's hut 10, then buildings as built.
// Later slices append to this script.
const SCRIPT: { tick: number; command: Command }[] = [
  { tick: 0, command: { type: 'build', kind: 'woodcutter' } }, // 11, free
  { tick: 0, command: { type: 'build', kind: 'mine' } }, // 12
  { tick: 5, command: { type: 'build', kind: 'tavern' } }, // refused: no stone
  { tick: 40, command: { type: 'setOpen', buildingId: 10, count: 2 } },
  { tick: 60, command: { type: 'pin', residentId: 1, buildingId: 12 } },
  { tick: 150, command: { type: 'build', kind: 'cottage' } }, // 13
  { tick: 151, command: { type: 'build', kind: 'storehouse' } }, // refused: no stone
  { tick: 152, command: { type: 'cancelJob', index: 1 } }, // refused: nothing is waiting
  { tick: 300, command: { type: 'upgrade', buildingId: 10 } }, // refused: no tools
  { tick: 500, command: { type: 'pin', residentId: 1, buildingId: null } },
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
  let rejected = 0;
  for (let tick = 0; tick < TICKS; tick++) {
    const result = step(stepped, at(tick), content);
    stepped = result.state;
    rejected += result.events.filter((event) => event.type === 'rejected').length;
  }
  expect(stepped.tick).toBe(TICKS);
  // the script did something, and some of it was refused
  expect(rejected).toBeGreaterThanOrEqual(2);
  expect(SCRIPT.length - rejected).toBeGreaterThanOrEqual(6);
  expect(stepped.buildings.map((b) => b.kind)).toEqual([
    'cottage',
    'forager',
    'woodcutter',
    'cottage',
  ]);
  for (const longest of [7, 480, 1]) {
    expect(chunked(start, longest), `chunks of ${longest}`).toEqual(stepped);
  }
  expect(start.tick).toBe(0);
});
