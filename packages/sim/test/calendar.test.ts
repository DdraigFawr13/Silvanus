import { expect, test } from 'vitest';
import { calendar } from '../src/index';

test('tick 672 is year 2', () => {
  expect(calendar(672)).toEqual({ year: 2, season: 0, day: 1, hour: 0 });
  expect(calendar(671)).toEqual({ year: 1, season: 3, day: 7, hour: 23 });
  expect(calendar(0)).toEqual({ year: 1, season: 0, day: 1, hour: 0 });
  expect(calendar(168)).toEqual({ year: 1, season: 1, day: 1, hour: 0 });
});
