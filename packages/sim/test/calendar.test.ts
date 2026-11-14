import { expect, test } from 'vitest';
import { content } from '@silvanus/content';
import { DAY_TICKS, SEASON_TICKS, YEAR_TICKS, calendar, newGame } from '../src/index';

test('tick 672 is year 2', () => {
  expect(calendar(672)).toEqual({ year: 2, season: 0, day: 1, hour: 0 });
  expect(calendar(671)).toEqual({ year: 1, season: 3, day: 7, hour: 23 });
  expect(calendar(0)).toEqual({ year: 1, season: 0, day: 1, hour: 0 });
  expect(calendar(168)).toEqual({ year: 1, season: 1, day: 1, hour: 0 });
});

// One home for the lengths, so leaving, ages and the date the player sees stay in step (M1 audit F9).
test('the day, season and year lengths come from the calendar', () => {
  expect(calendar(DAY_TICKS)).toEqual({ year: 1, season: 0, day: 2, hour: 0 });
  expect(calendar(SEASON_TICKS)).toEqual({ year: 1, season: 1, day: 1, hour: 0 });
  expect(calendar(YEAR_TICKS)).toEqual({ year: 2, season: 0, day: 1, hour: 0 });
  // a new town may lose a resident on its first day (D-039)
  expect(content.rules.leaveGapTicks).toBe(672);
  expect(newGame(1, content).lastLeftTick).toBe(-content.rules.leaveGapTicks);
});
