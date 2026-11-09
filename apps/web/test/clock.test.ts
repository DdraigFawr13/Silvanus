import { describe, expect, test } from 'vitest';
import { CATCH_UP_CAP, TICK_MS, due, tickMsFrom } from '../src/clock';

describe('clock', () => {
  test('due ticks', () => {
    const anchor = 1_000_000_000;
    expect(due(anchor - 1, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 0,
      anchorMs: anchor - 1,
    });
    // 150,000 ms is 2 ticks and 30,000 ms is kept
    expect(due(anchor + 150_000, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 2,
      anchorMs: anchor + 120_000,
    });
    const later = anchor + 40 * 3_600_000;
    expect(due(later, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({ ticks: 480, anchorMs: later });
    // edges: just under one tick, exactly the cap, one past the cap
    expect(due(anchor + 59_999, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 0,
      anchorMs: anchor,
    });
    // exactly the cap keeps the remainder; the anchor resets only past the cap
    expect(due(anchor + 480 * TICK_MS + 30_000, anchor, TICK_MS, CATCH_UP_CAP)).toEqual({
      ticks: 480,
      anchorMs: anchor + 480 * TICK_MS,
    });
    expect(due(anchor + 481 * TICK_MS, anchor, TICK_MS, CATCH_UP_CAP).anchorMs).toBe(
      anchor + 481 * TICK_MS,
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
});
