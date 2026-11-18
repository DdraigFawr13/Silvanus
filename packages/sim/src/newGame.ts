import { assignJobs } from './jobs';
import { addSettler } from './people';
import { makePlots } from './plots';
import type { Building, Content, State } from './types';
import { freeMethods, kindOf } from './util';

// Day 1: the plots, the founders, the Hall, a Cottage on the first town lot and a Forager's hut on
// the woods site (D-025, D-058).
export function newGame(seed: number, content: Content): State {
  const s: State = {
    contentVersion: content.version,
    seed,
    tick: 0,
    rng: {},
    stock: {},
    hallTier: 1,
    nextId: 1,
    plots: [],
    buildings: [],
    queue: [],
    residents: [],
    lastLeftTick: -content.rules.leaveGapTicks,
    jobsDirty: false,
    log: [],
    board: {
      goals: [],
      active: null,
      progress: 0,
      offers: [],
      nextOfferId: 1,
      nextOfferTick: content.rules.firstOfferTick,
      deliveries: [],
      trip: null,
    },
  };
  // the lots stream is its own, so the founders draw as they did before plots
  s.plots = makePlots(s, content);
  for (let i = 0; i < content.rules.founders; i++) addSettler(s, content);
  for (const id of ['cottage', 'forager']) {
    const kind = kindOf(content, id)!;
    const ground = kind.site ?? null;
    const plot = s.plots.find((p) => p.open && p.ground === ground)!;
    const first = content.methods.find((method) => method.building === id);
    const building: Building = {
      id: s.nextId++,
      kind: id,
      tier: 1,
      method: first ? first.id : null,
      open: kind.tiers[0].slots,
      retoolLeft: 0,
      carry: {},
      debt: {},
      short: false,
      owned: freeMethods(content, id),
      plot: plot.id,
      shutLeft: 0,
      shutBy: null,
    };
    s.buildings.push(building);
  }
  for (const resource of content.resources) s.stock[resource.id] = resource.start;
  assignJobs(s, content);
  return s;
}
