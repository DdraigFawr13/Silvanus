import { content } from '@silvanus/content';
import { YEAR_TICKS, calendar } from '@silvanus/sim';
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

export const resourceName = (id: string) =>
  (content.resources.find((r) => r.id === id)?.name ?? id).toLowerCase();

// "40 wood, 5 tools", in the content's resource order
export function amountsText(amounts: Amounts): string {
  return content.resources
    .filter((r) => amounts[r.id] !== undefined)
    .map((r) => `${amounts[r.id]} ${resourceName(r.id)}`)
    .join(', ');
}

export const needsText = (missing: Amounts) => `Needs ${amountsText(missing)}`;

// Hundredths of a unit as "1.5 tools, 0.6 wood", one decimal, in the content's resource order.
export function perDayText(amounts: Amounts): string {
  return content.resources
    .filter((r) => amounts[r.id] !== undefined)
    .map((r) => `${(amounts[r.id] / 100).toFixed(1)} ${resourceName(r.id)}`)
    .join(', ');
}

// Production cycles as game time: "4 game days, 4 game hours".
export const cyclesText = (cycles: number) => duration(cycles * content.cycleTicks);

// Only these reasons can be reached from the screens.
const REASONS: Partial<Record<Reason, string>> = {
  noLot: 'No empty lot',
  queueFull: 'The work queue is full',
  noStock: 'Not enough stock',
  busy: 'Work is under way here',
  tooFew: 'Not enough residents',
};
export const reasonText = (reason: Reason) => REASONS[reason] ?? 'That cannot be done now';

// "+10", "−10" (a minus sign, not a hyphen), "0"
export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0');

// Morale reason labels, by the engine's reason id.
const REASON_LABELS: Record<string, string> = {
  food: 'Food',
  fit: 'Skill for the job',
  likes: 'Likes the work',
  dislikes: 'Dislikes the work',
  idle: 'No work',
  crowded: 'Crowded home',
  tavern: 'The tavern',
};
export const reasonLabel = (id: string) => REASON_LABELS[id] ?? id;

// "Dislikes the work −10 · Skill for the job −10", or `none` for an empty list
export const reasonsText = (reasons: { id: string; amount: number }[], none: string) =>
  reasons.length === 0
    ? none
    : reasons.map((r) => `${reasonLabel(r.id)} ${signed(r.amount)}`).join(' · ');

// "the Workshop", "the Workshop and the Tavern", "the Farm, the Mine and the Tavern"
export function theList(names: string[]): string {
  const each = names.map((name) => `the ${name}`);
  if (each.length <= 1) return each.join('');
  return `${each.slice(0, -1).join(', ')} and ${each[each.length - 1]}`;
}

// Age in whole game years.
export const ageOf = (tick: number, bornTick: number) => Math.floor((tick - bornTick) / YEAR_TICKS);
