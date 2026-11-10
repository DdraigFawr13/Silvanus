import type { Summary } from '@silvanus/sim';
import type { Snapshot } from './worker';

// The latest snapshot from the worker and the last summary that covered any ticks. Screens read
// both with `useSyncExternalStore`; nothing here computes a rule.
let snapshot: Snapshot | null = null;
let lastSummary: Summary | null = null;
const listeners = new Set<() => void>();

export function publish(next: Snapshot): void {
  snapshot = next;
  if (next.ticks > 0) lastSummary = next.summary;
  for (const listener of listeners) listener();
}

// For a new worker: the page starts again with nothing to show.
export function reset(): void {
  snapshot = null;
  lastSummary = null;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export const current = (): Snapshot | null => snapshot;
export const summary = (): Summary | null => lastSummary;
