import { carryOut, construct, refusal } from './build';
import { startDay } from './day';
import { assignJobs } from './jobs';
import { produce } from './production';
import { emptySummary, fold } from './summary';
import type { Command, Content, Event, State, Summary } from './types';
import { DAY_TICKS, draft } from './util';

function commands(s: State, list: Command[], content: Content, events: Event[]): void {
  for (const command of list) {
    const reason = refusal(s, command, content);
    if (reason === null) carryOut(s, command, content, events);
    else events.push({ type: 'rejected', command, reason });
  }
  if (s.jobsDirty) assignJobs(s, content);
}

// Commands only; the tick does not move. Never changes its input.
export function apply(
  state: State,
  list: Command[],
  content: Content,
): { state: State; events: Event[] } {
  const s = draft(state);
  const events: Event[] = [];
  commands(s, list, content, events);
  return { state: s, events };
}

// One tick: the commands, construction, the start of a game day, jobs, production, then
// retooling and tick + 1. Never changes its input.
export function step(
  state: State,
  list: Command[],
  content: Content,
): { state: State; events: Event[] } {
  const s = draft(state);
  const events: Event[] = [];
  commands(s, list, content, events);
  construct(s, content, events);
  if (s.tick > 0 && s.tick % DAY_TICKS === 0) startDay(s, content, events);
  if (s.jobsDirty) assignJobs(s, content);
  if ((s.tick + 1) % content.cycleTicks === 0) produce(s, content, events);
  for (const building of s.buildings) if (building.retoolLeft > 0) building.retoolLeft -= 1;
  s.tick += 1;
  return { state: s, events };
}

// The state that `ticks` calls of step(state, []) give, with what they did in total. Throws on
// a tick count that is not a whole number of 0 or more.
export function advance(
  state: State,
  ticks: number,
  content: Content,
): { state: State; summary: Summary } {
  if (!Number.isInteger(ticks) || ticks < 0) {
    throw new RangeError('advance: ticks must be a whole number of 0 or more');
  }
  let current = state;
  const summary = emptySummary();
  summary.ticks = ticks;
  for (let i = 0; i < ticks; i++) {
    const result = step(current, [], content);
    current = result.state;
    fold(summary, result.events, content);
  }
  return { state: current, summary };
}
