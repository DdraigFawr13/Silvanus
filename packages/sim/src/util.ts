import type { Amounts, Building, BuildingKind, Content, Method, State } from './types';

export { DAY_TICKS } from './calendar';

export function kindOf(content: Content, id: string): BuildingKind | undefined {
  return content.buildings.find((kind) => kind.id === id);
}

export function methodOf(content: Content, id: string | null): Method | undefined {
  return id === null ? undefined : content.methods.find((method) => method.id === id);
}

// The methods every building of a kind owns from the start: those with no cost (D-034).
export function freeMethods(content: Content, kind: string): string[] {
  return content.methods
    .filter((method) => method.building === kind && Object.keys(method.cost).length === 0)
    .map((method) => method.id);
}

// Worker slots at the building's tier; 0 while it is being built.
export function slotsOf(content: Content, building: Building): number {
  return building.tier === 0 ? 0 : kindOf(content, building.kind)!.tiers[building.tier - 1].slots;
}

export function hallOf(state: State, content: Content) {
  return content.hall.tiers[state.hallTier - 1];
}

// A store's cap is its base cap x (1 + the tiers of the finished storage buildings).
export function capsOf(state: State, content: Content): Amounts {
  let times = 1;
  for (const building of state.buildings) {
    if (kindOf(content, building.kind)?.storage) times += building.tier;
  }
  const caps: Amounts = {};
  for (const resource of content.resources) caps[resource.id] = resource.cap * times;
  return caps;
}

export function bedsOf(state: State, content: Content): number {
  let beds = 0;
  for (const building of state.buildings) {
    if (building.tier > 0) beds += kindOf(content, building.kind)!.tiers[building.tier - 1].beds;
  }
  return beds;
}

export function covers(stock: Amounts, cost: Amounts): boolean {
  return Object.entries(cost).every(([id, amount]) => (stock[id] ?? 0) >= amount);
}

// What a cost asks for beyond what is in stock; {} when the stock covers it.
export function shortfall(stock: Amounts, cost: Amounts): Amounts {
  const missing: Amounts = {};
  for (const [id, amount] of Object.entries(cost)) {
    const have = stock[id] ?? 0;
    if (have < amount) missing[id] = amount - have;
  }
  return missing;
}

// A copy the rules may change: every part a rule writes to is its own object. `plots` is shared:
// a rule that opens a plot replaces the array and the plot (M2d S2), never writes into them, so
// a tick does not copy 31 plots.
export function draft(state: State): State {
  return {
    ...state,
    rng: { ...state.rng },
    stock: { ...state.stock },
    buildings: state.buildings.map((b) => ({ ...b, carry: { ...b.carry }, debt: { ...b.debt } })),
    queue: state.queue.map((job) => ({ ...job })),
    residents: state.residents.map((r) => ({ ...r, skills: { ...r.skills } })),
    log: state.log.slice(),
    board: {
      ...state.board,
      goals: state.board.goals.slice(),
      offers: state.board.offers.map((o) => ({ ...o, give: { ...o.give }, get: { ...o.get } })),
      deliveries: state.board.deliveries.map((d) => ({ ...d })),
      trip: state.board.trip && {
        ...state.board.trip,
        residentIds: state.board.trip.residentIds.slice(),
      },
    },
  };
}

// "40 wood, 5 tools", in the content's resource order, for log lines. The same format as the
// web's `amountsText`, which the screens keep for themselves.
export function amountsLine(amounts: Amounts, content: Content): string {
  return content.resources
    .filter((r) => amounts[r.id] !== undefined)
    .map((r) => `${amounts[r.id]} ${r.name.toLowerCase()}`)
    .join(', ');
}

export function addLog(s: State, content: Content, type: string, text: string): void {
  s.log.push({ tick: s.tick, type, text });
  if (s.log.length > content.rules.logMax) s.log.splice(0, s.log.length - content.rules.logMax);
}
