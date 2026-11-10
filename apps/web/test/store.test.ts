import { content } from '@silvanus/content';
import { emptySummary, newGame } from '@silvanus/sim';
import { expect, test } from 'vitest';
import { AWAY_MIN_TICKS, dismissSummary, publish, reset, summary } from '../src/store';
import type { Snapshot } from '../src/worker';

const state = newGame(1, content);
const snapshot = (ticks: number, made = 0): Snapshot => ({
  type: 'snapshot',
  v: 2, // the worker's PROTOCOL; worker.ts itself only runs in a worker
  state,
  anchorMs: 0,
  ticks,
  summary: { ...emptySummary(), ticks, made: made > 0 ? { food: made } : {} },
});

test('the away card keeps the last catch-up of 10 ticks or more', () => {
  reset();
  publish(snapshot(100, 25));
  expect(summary()?.ticks).toBe(100);
  // live play, a tick or two at a time, does not replace it
  publish(snapshot(1, 1));
  publish(snapshot(AWAY_MIN_TICKS - 1, 2));
  expect(summary()?.ticks).toBe(100);
  // the next catch-up of 10 or more does
  publish(snapshot(AWAY_MIN_TICKS, 3));
  expect(summary()?.ticks).toBe(AWAY_MIN_TICKS);
  dismissSummary();
  expect(summary()).toBeNull();
  // a snapshot of a town being replaced sets no card
  publish(snapshot(200), false);
  expect(summary()).toBeNull();
  publish(snapshot(200));
  reset();
  expect(summary()).toBeNull();
});
