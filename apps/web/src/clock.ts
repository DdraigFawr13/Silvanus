export const TICK_MS = 60_000;
export const CATCH_UP_CAP = 480;

const MIN_TICK_MS = 50;

// Ticks due since the anchor (the wall-clock time at which the stored tick was true).
export function due(
  nowMs: number,
  anchorMs: number,
  tickMs: number,
  cap: number,
): { ticks: number; anchorMs: number } {
  const elapsed = nowMs - anchorMs;
  if (elapsed < 0) return { ticks: 0, anchorMs: nowMs };
  const n = Math.floor(elapsed / tickMs);
  if (n > cap) return { ticks: cap, anchorMs: nowMs };
  return { ticks: n, anchorMs: anchorMs + n * tickMs };
}

// `?tickMs=<whole number from 50 to 60000>` overrides TICK_MS; anything else is ignored.
export function tickMsFrom(search: string): number {
  const value = new URLSearchParams(search).get('tickMs');
  if (value === null || !/^[0-9]+$/.test(value)) return TICK_MS;
  const n = Number(value);
  return n >= MIN_TICK_MS && n <= TICK_MS ? n : TICK_MS;
}
