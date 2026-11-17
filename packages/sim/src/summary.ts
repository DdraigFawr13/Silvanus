import type { Amounts, Content, Event, Summary } from './types';
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

const addTo = (into: Amounts, amounts: Amounts) => {
  for (const [id, n] of Object.entries(amounts)) into[id] = (into[id] ?? 0) + n;
};

// Adds one tick's events to a summary. Changes the summary it is given. Goods a reward, a
// delivery or a trip put into stock count as made, so the away card shows them.
export function fold(summary: Summary, events: Event[], content: Content): void {
  for (const event of events) {
    if (event.type === 'goalDone') addTo(summary.made, event.paid);
    else if (event.type === 'tripBack') addTo(summary.made, event.finds);
    else if (event.type === 'delivered') addTo(summary.made, { [event.resource]: event.amount });
    else if (event.type === 'made' || event.type === 'used' || event.type === 'lost') {
      const into = summary[event.type];
      into[event.resource] = (into[event.resource] ?? 0) + event.amount;
    } else if (event.type === 'fellBack') {
      summary.shortCycles[event.buildingId] = (summary.shortCycles[event.buildingId] ?? 0) + 1;
    } else if (event.type === 'capLost') {
      summary.lost[event.resource] = (summary.lost[event.resource] ?? 0) + event.amount;
    } else if (event.type === 'village') {
      summary.finished.push(`The Hall: now a ${content.hall.tiers[event.tier - 1].name}`);
    } else if (event.type === 'arrived' || event.type === 'left') {
      summary[event.type].push(event.name);
    } else if (event.type === 'built' || event.type === 'upgraded') {
      summary.finished.push(
        `${kindOf(content, event.kind)?.name ?? event.kind}, tier ${event.tier}`,
      );
    }
  }
}
