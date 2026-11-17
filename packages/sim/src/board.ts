import { draw } from './rng';
import type { Amounts, Command, Content, Event, Goal, Reason, State } from './types';
import { addLog, amountsLine, capsOf } from './util';

// Rule 6, the board (M2e, D-049 to D-053). S1: goals. The trader and trips come in S2 and S3.

export const goalOf = (content: Content, id: string | null): Goal | undefined =>
  id === null ? undefined : content.goals.find((goal) => goal.id === id);

// Whether a goal's condition holds now. A `make` goal reads the progress since its pick, so
// only the active one can hold; a building counts once finished, at the tier asked or higher.
function holds(s: State, goal: Goal): boolean {
  const when = goal.when;
  if (when.type === 'make') return s.board.active === goal.id && s.board.progress >= when.amount;
  if (when.type === 'residents') return s.residents.length >= when.count;
  return s.buildings.some((b) => b.kind === when.kind && b.tier > 0 && b.tier >= when.tier);
}

// The units a reward of value `value` puts into stock with room, by the spec's split ("Paying a
// reward"): up to 3 rounds, each sharing what is left evenly across the resources with room.
// Returns the units per resource (only those above 0) and the value that found no room.
function split(
  stock: Amounts,
  caps: Amounts,
  value: number,
  content: Content,
): { paid: Amounts; left: number } {
  const paid: Amounts = {};
  let left = value;
  for (let round = 0; round < 3; round++) {
    const open = content.resources.filter((r) => stock[r.id] + (paid[r.id] ?? 0) < caps[r.id]);
    if (open.length === 0) break;
    const share = Math.floor(left / open.length);
    if (share < Math.min(...open.map((r) => r.value))) break;
    for (const resource of open) {
      const room = caps[resource.id] - stock[resource.id] - (paid[resource.id] ?? 0);
      const n = Math.min(room, Math.floor(share / resource.value));
      if (n === 0) continue;
      paid[resource.id] = (paid[resource.id] ?? 0) + n;
      left -= n * resource.value;
    }
  }
  return { paid, left };
}

const rewardValue = (goal: Goal, content: Content) =>
  Math.floor((goal.reward * content.rules.rewardPct) / 100);

// What a goal would pay into the stores now, for its card (GAME-02).
export function rewardPreview(state: State, goalId: string, content: Content): Amounts {
  const goal = goalOf(content, goalId);
  if (!goal) return {};
  return split(state.stock, capsOf(state, content), rewardValue(goal, content), content).paid;
}

// The active goal's progress for its card: units made or residents counted. null for a building
// goal (its card says "Not yet") and when no goal is active.
export function goalProgress(
  state: State,
  content: Content,
): { have: number; need: number } | null {
  const goal = goalOf(content, state.board.active);
  if (!goal) return null;
  if (goal.when.type === 'make') return { have: state.board.progress, need: goal.when.amount };
  if (goal.when.type === 'residents') {
    return { have: state.residents.length, need: goal.when.count };
  }
  return null;
}

// The value a reward left over that counts as lost: less than the dearest unit is rounding.
export const lostOf = (left: number, content: Content) =>
  left >= Math.max(...content.resources.map((r) => r.value)) ? left : 0;

export function boardRefusal(state: State, command: Command): Reason | null {
  if (command.type === 'pickGoal') {
    if (!state.board.goals.includes(command.id)) return 'unknown';
    return state.board.active === command.id ? 'same' : null;
  }
  return 'unknown';
}

export function boardCarryOut(s: State, command: Command): void {
  if (command.type === 'pickGoal') {
    s.board.active = command.id;
    s.board.progress = 0;
  }
}

function pay(s: State, goal: Goal, content: Content, events: Event[]): void {
  const { paid, left } = split(s.stock, capsOf(s, content), rewardValue(goal, content), content);
  for (const [id, n] of Object.entries(paid)) s.stock[id] += n;
  events.push({ type: 'goalDone', id: goal.id, paid });
  const text =
    Object.keys(paid).length === 0
      ? `Goal met: ${goal.name}. The stores were full, so the reward was lost.`
      : `Goal met: ${goal.name}. ${amountsLine(paid, content)} added to the stores.` +
        (lostOf(left, content) > 0 ? ' (stores full: the rest was lost)' : '');
  addLog(s, content, 'goalDone', text);
}

// The goals that may be offered now, in content order (spec, rule 6c step 3).
function eligible(s: State, content: Content, met: string | null): Goal[] {
  const caps = capsOf(s, content);
  return content.goals.filter((goal) => {
    if (goal.hall > s.hallTier || goal.id === met) return false;
    if (goal.when.type === 'make') {
      return s.stock[goal.when.resource] + goal.when.amount <= caps[goal.when.resource];
    }
    return !holds(s, goal);
  });
}

// Rule 6c, after production: the active goal's progress, its payment when met, and a new draw
// of goals when none are on offer.
export function goals(s: State, content: Content, events: Event[]): void {
  const board = s.board;
  const goal = goalOf(content, board.active);
  let met: string | null = null;
  if (goal) {
    if (goal.when.type === 'make') {
      const resource = goal.when.resource;
      let made = 0;
      for (const event of events) {
        if (event.type === 'made' && event.resource === resource) made += event.amount;
      }
      board.progress = Math.min(goal.when.amount, board.progress + made);
    }
    if (holds(s, goal)) {
      pay(s, goal, content, events);
      met = goal.id;
      board.active = null;
      board.progress = 0;
      board.goals = [];
    }
  }
  if (board.goals.length > 0) return;
  const list = eligible(s, content, met);
  // Fisher-Yates on the `goals` stream; a list of 0 or 1 makes no draw
  for (let i = list.length - 1; i >= 1; i--) {
    const result = draw(s.rng, 'goals', s.seed, i + 1);
    s.rng = result.rng;
    const j = result.value;
    [list[i], list[j]] = [list[j], list[i]];
  }
  board.goals = list.slice(0, content.rules.goalsOffered).map((g) => g.id);
}
