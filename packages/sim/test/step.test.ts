import { describe, expect, test } from 'vitest';
import { advance, apply, draw, newGame, step } from '../src/index';
import type { Command, Content, State } from '../src/index';
import { content } from './fixtures';

function run(state: State, ticks: number): State {
  let s = state;
  for (let i = 0; i < ticks; i++) s = step(s, [], content).state;
  return s;
}

describe('step', () => {
  test('forager adds food every 4 ticks', () => {
    const start = newGame(1, content);
    expect(start.foragers).toBe(1);
    expect(start.stock.food).toBe(0);
    // seed 1 yield draws are 0, 1, ...: +1 at tick 4, +2 at tick 8
    const food = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => run(start, n).stock.food);
    expect(food).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 3]);
    const end = run(start, 8);
    expect(end.tick).toBe(8);
  });

  test('food over the cap is lost', () => {
    const rich: Content = { ...content, camp: { ...content.camp, yieldMin: 2, yieldMax: 2 } };
    const start: State = { ...newGame(1, rich), foragers: 3, stock: { food: 195 }, tick: 3 };
    const result = step(start, [], rich);
    expect(result.state.stock.food).toBe(200);
    expect(result.log).toEqual([
      { tick: 3, type: 'produced', amount: 5 },
      { tick: 3, type: 'lost', amount: 1 },
    ]);
    // a full store loses everything and logs no produced entry
    const full = step({ ...start, stock: { food: 200 } }, [], rich);
    expect(full.state.stock.food).toBe(200);
    expect(full.log).toEqual([{ tick: 3, type: 'lost', amount: 6 }]);
  });

  test('bad command is rejected', () => {
    const start = newGame(1, content);
    const bad: Command[] = [-1, 4, 1.5, NaN].map((count) => ({ type: 'setForagers', count }));
    for (const command of bad) {
      const result = apply(start, [command], content);
      expect(result.state).toEqual(start);
      expect(result.log).toEqual([{ tick: 0, type: 'rejected', command }]);
    }
    // a valid command is logged even when the count is unchanged, and the input is untouched
    const same = apply(start, [{ type: 'setForagers', count: 1 }], content);
    expect(same.log).toEqual([{ tick: 0, type: 'foragersSet', count: 1 }]);
    const set = step(start, [{ type: 'setForagers', count: 3 }], content);
    expect(set.state.foragers).toBe(3);
    expect(set.state.tick).toBe(1);
    expect(start.foragers).toBe(1);
    expect(start.tick).toBe(0);
  });

  test('a command on a production tick applies before production', () => {
    // tick 3 is a production tick: the three foragers the command sets all gather in it
    const start: State = { ...newGame(1, content), tick: 3 };
    expect(start.foragers).toBe(1);
    const result = step(start, [{ type: 'setForagers', count: 3 }], content);
    let rng = start.rng;
    let gathered = 0;
    for (let i = 0; i < 3; i++) {
      const d = draw(rng, 'yield', start.seed, content.camp.yieldMax - content.camp.yieldMin + 1);
      rng = d.rng;
      gathered += content.camp.yieldMin + d.value;
    }
    expect(result.state.stock.food).toBe(gathered);
    expect(result.state.rng).toEqual(rng);
    expect(result.state.tick).toBe(4);
    // one forager could not have gathered this much
    expect(gathered).toBeGreaterThan(content.camp.yieldMax);
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
});
