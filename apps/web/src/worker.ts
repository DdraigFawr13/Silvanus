import { content } from '@silvanus/content';
import { advance, apply, emptySummary, validateContent } from '@silvanus/sim';
import type { Command, State, Summary } from '@silvanus/sim';

// Every message carries the protocol version; one that does not match is ignored (audit F13).
export const PROTOCOL = 2;

export type WorkerIn = { v: typeof PROTOCOL } & (
  | { type: 'load'; state: State; anchorMs: number }
  | { type: 'advance'; ticks: number; anchorMs: number }
  | { type: 'command'; command: Command }
);

export type Snapshot = {
  type: 'snapshot';
  v: typeof PROTOCOL;
  state: State;
  anchorMs: number;
  ticks: number;
  summary: Summary;
};

// Content with a fault stops the worker, which the page shows as "The town stopped."
const faults = validateContent(content);
if (faults.length > 0) throw new Error(`The content is not sound: ${faults.join('; ')}`);

// The worker holds the state and has no timer; the page decides when ticks are due.
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let state: State | null = null;
let anchorMs = 0;

ctx.onmessage = (event: MessageEvent<WorkerIn>) => {
  const message = event.data;
  if (message.v !== PROTOCOL) return;
  let ticks = 0;
  let summary = emptySummary();
  if (message.type === 'load') {
    state = message.state;
    anchorMs = message.anchorMs;
  } else if (state === null) {
    return;
  } else if (message.type === 'advance') {
    const result = advance(state, message.ticks, content);
    state = result.state;
    anchorMs = message.anchorMs;
    ticks = message.ticks;
    summary = result.summary;
  } else {
    state = apply(state, [message.command], content).state;
  }
  const out: Snapshot = { type: 'snapshot', v: PROTOCOL, state, anchorMs, ticks, summary };
  ctx.postMessage(out);
};
