import { expect, test } from 'vitest';
import { advance, newGame, step } from '../src/index';
import { content } from './fixtures';

test('advance equals repeated step', () => {
  const start = { ...newGame(7, content), foragers: 3 };
  let stepped = start;
  let produced = 0;
  let lost = 0;
  for (let i = 0; i < 500; i++) {
    const r = step(stepped, [], content);
    stepped = r.state;
    for (const e of r.log) {
      if (e.type === 'produced') produced += e.amount;
      if (e.type === 'lost') lost += e.amount;
    }
  }
  const advanced = advance(start, 500, content);
  expect(advanced.state).toEqual(stepped);
  expect(advanced.state.tick).toBe(500);
  expect(advanced.state.stock.food).toBeGreaterThan(0);
  expect(advanced.produced).toBe(produced);
  expect(advanced.lost).toBe(lost);
  expect(start.tick).toBe(0);
});
