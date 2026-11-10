import { draw } from './rng';
import type { Command, Content, LogEntry, State } from './types';

// Commands only; the tick does not move. Never changes its input.
export function apply(
  state: State,
  commands: Command[],
  content: Content,
): { state: State; log: LogEntry[] } {
  let foragers = state.foragers;
  const log: LogEntry[] = [];
  for (const command of commands) {
    const { count } = command;
    if (Number.isInteger(count) && count >= 0 && count <= content.camp.maxForagers) {
      foragers = count;
      log.push({ tick: state.tick, type: 'foragersSet', count });
    } else {
      log.push({ tick: state.tick, type: 'rejected', command });
    }
  }
  return { state: { ...state, foragers }, log };
}

// Order: apply the commands, then production, then tick + 1.
export function step(
  state: State,
  commands: Command[],
  content: Content,
): { state: State; log: LogEntry[] } {
  const applied = apply(state, commands, content);
  const log = applied.log;
  let { rng, stock } = applied.state;
  const tick = state.tick;

  if ((tick + 1) % content.camp.everyTicks === 0) {
    const { yieldMin, yieldMax } = content.camp;
    let gathered = 0;
    for (let i = 0; i < applied.state.foragers; i++) {
      const d = draw(rng, 'yield', state.seed, yieldMax - yieldMin + 1);
      rng = d.rng;
      gathered += yieldMin + d.value;
    }
    const room = content.resources.food.cap - stock.food;
    const produced = Math.max(0, Math.min(gathered, room));
    const lost = gathered - produced;
    stock = { ...stock, food: stock.food + produced };
    if (produced > 0) log.push({ tick, type: 'produced', amount: produced });
    if (lost > 0) log.push({ tick, type: 'lost', amount: lost });
  }

  return { state: { ...applied.state, rng, stock, tick: tick + 1 }, log };
}

// The state that `ticks` calls of step(state, []) give, with the totals. Throws on a tick count
// that is not a whole number of 0 or more.
export function advance(
  state: State,
  ticks: number,
  content: Content,
): { state: State; produced: number; lost: number } {
  if (!Number.isInteger(ticks) || ticks < 0) {
    throw new RangeError('advance: ticks must be a whole number of 0 or more');
  }
  let current = state;
  let produced = 0;
  let lost = 0;
  for (let i = 0; i < ticks; i++) {
    const result = step(current, [], content);
    current = result.state;
    for (const entry of result.log) {
      if (entry.type === 'produced') produced += entry.amount;
      else if (entry.type === 'lost') lost += entry.amount;
    }
  }
  return { state: current, produced, lost };
}
