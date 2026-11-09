import { content } from '@silvanus/content';
import { advance, apply } from '@silvanus/sim';
import type { Command, State } from '@silvanus/sim';

export type WorkerIn =
  | { type: 'load'; state: State; anchorMs: number }
  | { type: 'advance'; ticks: number; anchorMs: number }
  | { type: 'command'; command: Command };

export type Snapshot = {
  type: 'snapshot';
  state: State;
  anchorMs: number;
  ticks: number;
  produced: number;
  lost: number;
};

// The worker holds the state and has no timer; the page decides when ticks are due.
const ctx = self as unknown as DedicatedWorkerGlobalScope;
let state: State | null = null;
let anchorMs = 0;

ctx.onmessage = (event: MessageEvent<WorkerIn>) => {
  const message = event.data;
  let ticks = 0;
  let produced = 0;
  let lost = 0;
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
    produced = result.produced;
    lost = result.lost;
  } else {
    state = apply(state, [message.command], content).state;
  }
  const out: Snapshot = { type: 'snapshot', state, anchorMs, ticks, produced, lost };
  ctx.postMessage(out);
};
