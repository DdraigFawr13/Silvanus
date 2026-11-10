import { content } from '@silvanus/content';
import { calendar } from '@silvanus/sim';
import type { Amounts, Reason } from '@silvanus/sim';

// Every conversion from the engine's units to words. Display only: no rule lives here (GAME-02).

const DAY = 24;
const plural = (n: number, word: string) => `${n} game ${word}${n === 1 ? '' : 's'}`;

// "8 game hours", "1 game day", "1 game day, 12 game hours". Ticks are never shown.
export function duration(ticks: number): string {
  const days = Math.floor(ticks / DAY);
  const hours = ticks % DAY;
  if (days === 0) return plural(hours, 'hour');
  return hours === 0 ? plural(days, 'day') : `${plural(days, 'day')}, ${plural(hours, 'hour')}`;
}

// "Year 1, season 1, day 1, hour 0"
export function dateText(tick: number): string {
  const when = calendar(tick);
  return `Year ${when.year}, season ${when.season + 1}, day ${when.day}, hour ${when.hour}`;
}
// the same inside a sentence
export const dateInline = (tick: number) => dateText(tick).replace('Year', 'year');

const resourceName = (id: string) =>
  (content.resources.find((r) => r.id === id)?.name ?? id).toLowerCase();

// "40 wood, 5 tools", in the content's resource order
export function amountsText(amounts: Amounts): string {
  return content.resources
    .filter((r) => amounts[r.id] !== undefined)
    .map((r) => `${amounts[r.id]} ${resourceName(r.id)}`)
    .join(', ');
}

export const needsText = (missing: Amounts) => `Needs ${amountsText(missing)}`;

// Only these reasons can be reached from the screens.
const REASONS: Partial<Record<Reason, string>> = {
  noLot: 'No empty lot',
  queueFull: 'The work queue is full',
  noStock: 'Not enough stock',
  busy: 'Work is under way here',
  tooFew: 'Not enough residents',
};
export const reasonText = (reason: Reason) => REASONS[reason] ?? 'That cannot be done now';
