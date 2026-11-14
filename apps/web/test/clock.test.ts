import { describe, expect, test } from 'vitest';
import { AUTOSAVE_TICKS, CATCH_UP_CAP, TICK_MS, due, tickMsFrom } from '../src/clock';
import { AWAY_MIN_TICKS } from '../src/store';

const HOUR_MS = 3_600_000;

describe('clock', () => {
  test('a game hour is 15 s and the Hamlet cap is 8 real hours', () => {
    expect(TICK_MS).toBe(15_000);
    expect(CATCH_UP_CAP).toBe(1_920);
    expect(CATCH_UP_CAP * TICK_MS).toBe(8 * HOUR_MS);
    const anchor = 1_000_000_000;
    expect(due(anchor + 8 * HOUR_MS, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 1_920,
      anchorMs: anchor + 8 * HOUR_MS,
    });
  });

  test('autosave and the away card wait 10 real minutes', () => {
    expect(AUTOSAVE_TICKS * TICK_MS).toBe(600_000);
    expect(AWAY_MIN_TICKS * TICK_MS).toBe(600_000);
  });

  test('due ticks', () => {
    const anchor = 1_000_000_000;
    expect(due(anchor - 1, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 0,
      anchorMs: anchor - 1,
    });
    // two and a half ticks: 2 are due and the half is kept
    expect(due(anchor + 2.5 * TICK_MS, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 2,
      anchorMs: anchor + 2 * TICK_MS,
    });
    const later = anchor + 40 * HOUR_MS;
    expect(due(later, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: CATCH_UP_CAP,
      anchorMs: later,
    });
    // edges: just under one tick, exactly the cap, one past the cap
    expect(due(anchor + TICK_MS - 1, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 0,
      anchorMs: anchor,
    });
    // exactly the cap keeps the remainder; the anchor resets only past the cap
    expect(
      due(anchor + CATCH_UP_CAP * TICK_MS + TICK_MS / 2, anchor, TICK_MS, CATCH_UP_CAP),
    ).toEqual({
      ticks: CATCH_UP_CAP,
      anchorMs: anchor + CATCH_UP_CAP * TICK_MS,
    });
    expect(due(anchor + (CATCH_UP_CAP + 1) * TICK_MS, anchor, TICK_MS, CATCH_UP_CAP).anchorMs).toBe(
      anchor + (CATCH_UP_CAP + 1) * TICK_MS,
    );
  });

  test('tickMs from the address', () => {
    expect(tickMsFrom('')).toBe(TICK_MS);
    expect(tickMsFrom('?tickMs=200')).toBe(200);
    expect(tickMsFrom('?tickMs=50')).toBe(50);
    expect(tickMsFrom('?tickMs=60000')).toBe(60000);
    for (const bad of ['49', '60001', '1.5', '-200', '200ms', '', ' 200', '0x20', 'abc']) {
      expect(tickMsFrom(`?tickMs=${bad}`)).toBe(TICK_MS);
    }
  });

  // a test tick may be longer than a real one, so browser tests see no tick inside a test
  test('test tick lengths run from 50 ms to 60 s', () => {
    expect(tickMsFrom('?tickMs=15001')).toBe(15001);
    expect(tickMsFrom('?tickMs=60000')).toBe(60000);
  });
});
