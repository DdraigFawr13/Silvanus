import type { Summary } from '@silvanus/sim';
import type { Snapshot } from './worker';
import { TICK_MS } from './clock';

// A catch-up this long or longer gets the away card. Live play advances a tick or so at a time,
// so it never replaces the card.
// 10 real minutes
export const AWAY_MIN_TICKS = 600_000 / TICK_MS;

// The latest snapshot from the worker and the summary of the last catch-up of AWAY_MIN_TICKS or
// more, until it is dismissed. Screens read both with `useSyncExternalStore`; nothing here
// computes a rule.
let snapshot: Snapshot | null = null;
let lastSummary: Summary | null = null;
const listeners = new Set<() => void>();
const tell = () => {
  for (const listener of listeners) listener();
};

// `away` false: the snapshot is of a town being replaced, so it sets no away card.
export function publish(next: Snapshot, away = true): void {
  snapshot = next;
  if (away && next.ticks >= AWAY_MIN_TICKS) lastSummary = next.summary;
  tell();
}

// For a new worker: the page starts again with nothing to show.
export function reset(): void {
  snapshot = null;
  lastSummary = null;
  tell();
}

export function dismissSummary(): void {
  lastSummary = null;
  tell();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const current = (): Snapshot | null => snapshot;
export const summary = (): Summary | null => lastSummary;
