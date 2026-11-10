import type { Content, Event, Summary } from './types';
import { kindOf } from './util';

export function emptySummary(): Summary {
  return {
    ticks: 0,
    made: {},
    lost: {},
    used: {},
    arrived: [],
    left: [],
    finished: [],
    shortCycles: {},
  };
}

// Adds one tick's events to a summary. Changes the summary it is given.
export function fold(summary: Summary, events: Event[], content: Content): void {
  for (const event of events) {
    if (event.type === 'made' || event.type === 'used' || event.type === 'lost') {
      const into = summary[event.type];
      into[event.resource] = (into[event.resource] ?? 0) + event.amount;
    } else if (event.type === 'capLost') {
      summary.lost[event.resource] = (summary.lost[event.resource] ?? 0) + event.amount;
    } else if (event.type === 'built' || event.type === 'upgraded') {
      summary.finished.push(
        `${kindOf(content, event.kind)?.name ?? event.kind}, tier ${event.tier}`,
      );
    }
  }
}
