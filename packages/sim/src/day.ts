import type { Content, Event, State } from './types';

// Rule 3, the start of a game day. S2 has the eating only; skills, morale, leaving and arrival
// join it in S4 and S5.
export function startDay(s: State, content: Content, events: Event[]): void {
  const need = s.residents.length * content.rules.eatPerDay;
  const eaten = Math.min(need, s.stock.food);
  s.stock.food -= eaten;
  if (eaten > 0) events.push({ type: 'used', resource: 'food', amount: eaten });
}
