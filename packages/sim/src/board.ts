import { draw } from './rng';
import type { Amounts, Command, Content, Event, Goal, Offer, Reason, State } from './types';
import { addLog, amountsLine, capsOf, hallOf } from './util';

// Rule 6, the board (M2e, D-049 to D-053): goals (S1), the trader (S2) and forage trips (S3).

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

export function boardRefusal(state: State, command: Command, content: Content): Reason | null {
  if (command.type === 'pickGoal') {
    if (!state.board.goals.includes(command.id)) return 'unknown';
    return state.board.active === command.id ? 'same' : null;
  }
  if (command.type === 'sendTrip') {
    if (state.board.trip !== null) return 'busy';
    const ids = command.residentIds;
    if (!Array.isArray(ids) || ids.length !== content.trips.size) return 'range';
    if (new Set(ids).size !== ids.length) return 'range';
    return ids.every((id) => state.residents.some((r) => r.id === id)) ? null : 'unknown';
  }
  if (command.type === 'acceptOffer' || command.type === 'declineOffer') {
    const offer = state.board.offers.find((o) => o.id === command.id);
    if (!offer) return 'unknown';
    if (command.type === 'declineOffer') return null;
    return state.stock[offer.give.resource] >= offer.give.amount ? null : 'noStock';
  }
  return 'unknown';
}

export function boardCarryOut(s: State, command: Command, content: Content): void {
  const board = s.board;
  if (command.type === 'pickGoal') {
    board.active = command.id;
    board.progress = 0;
  } else if (command.type === 'acceptOffer') {
    const offer = board.offers.find((o) => o.id === command.id)!;
    s.stock[offer.give.resource] -= offer.give.amount;
    board.deliveries.push({ ...offer.get, at: s.tick + content.rules.deliveryTicks });
    board.offers = board.offers.filter((o) => o.id !== offer.id);
    const sent = amountsLine({ [offer.give.resource]: offer.give.amount }, content);
    addLog(s, content, 'sent', `Sent ${sent} to the trader.`);
  } else if (command.type === 'declineOffer') {
    board.offers = board.offers.filter((o) => o.id !== command.id);
  } else if (command.type === 'sendTrip') {
    // they leave their jobs and keep their pins; rule 4 skips them until they are back
    board.trip = { residentIds: command.residentIds.slice(), back: s.tick + content.trips.ticks };
    for (const resident of s.residents) {
      if (command.residentIds.includes(resident.id)) resident.jobId = null;
    }
    s.jobsDirty = true;
  }
}

// "Ceria", "Ceria and Llew", "A, B and C"
function namesLine(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// Rule 6b: the trip comes back with `draws` finds from the content's table (D-051).
function tripBack(s: State, content: Content, events: Event[]): void {
  const trip = s.board.trip!;
  const { finds, draws } = content.trips;
  const found: Amounts = {};
  for (let i = 0; i < draws; i++) {
    const at = draw(s.rng, 'trips', s.seed, finds.length);
    const find = finds[at.value];
    const amount = draw(at.rng, 'trips', s.seed, find.max - find.min + 1);
    s.rng = amount.rng;
    found[find.resource] = (found[find.resource] ?? 0) + find.min + amount.value;
  }
  const kept: Amounts = {};
  let full = false;
  for (const resource of content.resources) {
    const n = found[resource.id];
    if (n === undefined) continue;
    const landed = land(s, content, resource.id, n, events);
    if (landed > 0) kept[resource.id] = landed;
    if (landed < n) full = true;
  }
  const names = trip.residentIds.map((id) => s.residents.find((r) => r.id === id)!.name);
  events.push({ type: 'tripBack', finds: kept });
  const text =
    `${namesLine(names)} came back from the forest edge with ${amountsLine(found, content)}.` +
    (full ? ' (stores full: the rest was lost)' : '');
  addLog(s, content, 'tripBack', text);
  s.board.trip = null;
  s.jobsDirty = true;
}

// Rule 3's part: a resident who leaves the town during a trip leaves the trip too.
export function leaveTrip(s: State, residentId: number): void {
  const trip = s.board.trip;
  if (!trip) return;
  trip.residentIds = trip.residentIds.filter((id) => id !== residentId);
  if (trip.residentIds.length === 0) s.board.trip = null;
}

export const onTrip = (state: State, residentId: number): boolean =>
  state.board.trip?.residentIds.includes(residentId) ?? false;

// Goods arriving: as much as the store has room for; the rest is a `lost` event (D-052).
// Returns the units kept.
function land(s: State, content: Content, resource: string, amount: number, events: Event[]) {
  const room = capsOf(s, content)[resource] - s.stock[resource];
  const kept = Math.max(0, Math.min(amount, room));
  s.stock[resource] += kept;
  if (amount > kept) events.push({ type: 'lost', resource, amount: amount - kept });
  return kept;
}

// The trader's swap (D-050): plenty for short by stock / cap, paid value for value. null when
// no offer can be made this hour.
function drawOffer(s: State, content: Content): Offer | null {
  const caps = capsOf(s, content);
  const order = (id: string) => content.resources.findIndex((r) => r.id === id);
  const ranked = content.resources.map((r) => ({
    r,
    rank: Math.floor((s.stock[r.id] * 1000) / caps[r.id]),
  }));
  // highest first and lowest first, ties in content order
  const high = ranked.slice().sort((a, b) => b.rank - a.rank || order(a.r.id) - order(b.r.id));
  const pick = (n: number) => {
    const result = draw(s.rng, 'trader', s.seed, n);
    s.rng = result.rng;
    return result.value;
  };
  const give = high[pick(2)].r;
  if (s.stock[give.id] === 0) return null;
  const below = content.rules.tradeGetBelowPct;
  const short = ranked
    .filter(({ r }) => r.id !== give.id && s.stock[r.id] * 100 < caps[r.id] * below)
    .sort((a, b) => a.rank - b.rank || order(a.r.id) - order(b.r.id));
  if (short.length === 0) return null;
  const get = short.length === 1 ? short[0].r : short[pick(2)].r;
  const share = Math.floor((give.cap * content.rules.tradeSharePct) / 100);
  const amount = Math.min(share, s.stock[give.id]);
  return {
    id: s.board.nextOfferId++,
    give: { resource: give.id, amount },
    get: { resource: get.id, amount: Math.max(1, Math.floor((amount * give.value) / get.value)) },
    until: s.tick + hallOf(s, content).catchUpCap + content.rules.offerExtraTicks,
  };
}

// Rule 6a, after construction and before the start of a game day: deliveries land, a trip
// comes back (6b), then the trader's offers (expiry, then one new offer an hour, at most
// offersMax waiting). Returns come before rule 4's job pass in the same step.
export function trader(s: State, content: Content, events: Event[]): void {
  const board = s.board;
  const due = board.deliveries.filter((d) => d.at <= s.tick);
  board.deliveries = board.deliveries.filter((d) => d.at > s.tick);
  for (const delivery of due) {
    const kept = land(s, content, delivery.resource, delivery.amount, events);
    if (kept > 0) events.push({ type: 'delivered', resource: delivery.resource, amount: kept });
    const what = amountsLine({ [delivery.resource]: delivery.amount }, content);
    const full = kept < delivery.amount ? ' (stores full: the rest was lost)' : '';
    addLog(s, content, 'delivered', `The trader's ${what} arrived.${full}`);
  }
  if (board.trip && s.tick >= board.trip.back) tripBack(s, content, events);
  for (const offer of board.offers.filter((o) => o.until <= s.tick)) {
    events.push({ type: 'offerGone', id: offer.id });
    addLog(s, content, 'offerGone', 'The trader moved on.');
  }
  board.offers = board.offers.filter((o) => o.until > s.tick);
  if (s.tick >= board.nextOfferTick) {
    if (board.offers.length < content.rules.offersMax) {
      const offer = drawOffer(s, content);
      if (offer) board.offers.push(offer);
    }
    // a missed hour is not made up
    board.nextOfferTick += content.rules.offerEveryTicks;
  }
}

// The Hall reached a new tier: no waiting offer leaves inside the new catch-up cap (D-018).
export function stretchOffers(s: State, content: Content): void {
  const until = s.tick + hallOf(s, content).catchUpCap + content.rules.offerExtraTicks;
  for (const offer of s.board.offers) offer.until = Math.max(offer.until, until);
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
