import { describe, expect, test } from 'vitest';
import { advance, apply, newGame, step } from '../src/index';
import type { Command, State } from '../src/index';
import { byKind, content, run, steady } from './town';

// Seed 1 with every resident at an effect of 100, so a forager makes 0.5 food a cycle.
const even = () => steady(newGame(1, content));

describe('step', () => {
  test("the Forager's hut adds food every 4 ticks", () => {
    const start = even();
    // 4 foragers at 0.5 food each a cycle: +2 at tick 4 and at tick 8
    const food = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => run(start, n).stock.food);
    expect(food).toEqual([40, 40, 40, 40, 42, 42, 42, 42, 44]);
    expect(run(start, 8).tick).toBe(8);
  });

  test('the town eats once at the start of a game day', () => {
    const start = even();
    // 6 cycles of +2, then 8 residents eat 1 each in the step at tick 24
    expect(run(start, 24).stock.food).toBe(52);
    expect(run(start, 25).stock.food).toBe(44);
    const hungry: State = { ...start, tick: 24, stock: { ...start.stock, food: 3 } };
    expect(step(hungry, [], content).state.stock.food).toBe(0);
  });

  test('food over the cap is lost', () => {
    const start: State = { ...even(), tick: 3 };
    const near = step({ ...start, stock: { ...start.stock, food: 199 } }, [], content);
    expect(near.state.stock.food).toBe(200);
    expect(near.events).toEqual([
      { type: 'made', resource: 'food', amount: 1 },
      { type: 'lost', resource: 'food', amount: 1 },
    ]);
    // a full store: the hut does nothing, so nothing is made or lost
    const full = step({ ...start, stock: { ...start.stock, food: 200 } }, [], content);
    expect(full.state.stock.food).toBe(200);
    expect(full.events).toEqual([]);
  });

  test('a refused command changes nothing and says why', () => {
    const start = newGame(1, content);
    const hut = byKind(start, 'forager').id;
    const bad: [Command, string][] = [
      [{ type: 'build', kind: 'castle' }, 'unknown'],
      [{ type: 'build', kind: 'tavern' }, 'noStock'],
      [{ type: 'upgrade', buildingId: 999 }, 'unknown'],
      [{ type: 'setOpen', buildingId: hut, count: 5 }, 'range'],
      [{ type: 'setOpen', buildingId: hut, count: 1.5 }, 'range'],
      [{ type: 'setOpen', buildingId: hut, count: 4 }, 'same'],
      [{ type: 'cancelJob', index: 0 }, 'range'],
      [{ type: 'pin', residentId: 1, buildingId: byKind(start, 'cottage').id }, 'range'],
      [{ type: 'pin', residentId: 1, buildingId: null }, 'same'],
      [{ type: 'setMethod', buildingId: hut, method: 'snares' }, 'notAllowed'],
    ];
    for (const [command, reason] of bad) {
      const result = apply(start, [command], content);
      expect(result.state, JSON.stringify(command)).toEqual(start);
      expect(result.events).toEqual([{ type: 'rejected', command, reason }]);
    }
    // a command that is carried out leaves its input untouched
    const set = step(start, [{ type: 'setOpen', buildingId: hut, count: 1 }], content);
    expect(byKind(set.state, 'forager').open).toBe(1);
    expect(set.state.tick).toBe(1);
    expect(byKind(start, 'forager').open).toBe(4);
    expect(start.tick).toBe(0);
  });

  test('a command on a production tick applies before production', () => {
    // tick 3 is a production tick: closing the hut in it means nobody gathers in it
    const start: State = { ...even(), tick: 3 };
    const hut = byKind(start, 'forager').id;
    expect(step(start, [], content).state.stock.food).toBe(42);
    const closed = step(start, [{ type: 'setOpen', buildingId: hut, count: 0 }], content);
    expect(closed.state.stock.food).toBe(40);
    expect(closed.state.tick).toBe(4);
  });

  test('advance refuses a bad tick count', () => {
    const start = newGame(1, content);
    for (const ticks of [-1, 1.5, NaN, Infinity, -Infinity]) {
      expect(() => advance(start, ticks, content), String(ticks)).toThrow(
        new RangeError('advance: ticks must be a whole number of 0 or more'),
      );
    }
    expect(advance(start, 0, content).state).toEqual(start);
  });

  test('advance reports what the ticks made, used and finished', () => {
    const start = apply(even(), [{ type: 'build', kind: 'woodcutter' }], content);
    const { summary } = advance(start.state, 25, content);
    expect(summary.ticks).toBe(25);
    expect(summary.made.food).toBe(12);
    expect(summary.used.food).toBe(8);
    expect(summary.made.wood).toBeGreaterThan(0);
    expect(summary.finished).toEqual(["Woodcutter's camp, tier 1"]);
  });
});
