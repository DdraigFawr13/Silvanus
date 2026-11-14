import { assignJobs } from './jobs';
import { addSettler } from './people';
import type { Building, Content, State } from './types';
import { freeMethods, kindOf } from './util';

// Day 1: the founders, the Hall, a Cottage and a Forager's hut (D-025).
export function newGame(seed: number, content: Content): State {
  const s: State = {
    contentVersion: content.version,
    seed,
    tick: 0,
    rng: {},
    stock: {},
    hallTier: 1,
    nextId: 1,
    buildings: [],
    queue: [],
    residents: [],
    lastLeftTick: -content.rules.leaveGapTicks,
    jobsDirty: false,
    log: [],
  };
  for (let i = 0; i < content.rules.founders; i++) addSettler(s, content);
  for (const id of ['cottage', 'forager']) {
    const kind = kindOf(content, id)!;
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
    };
    s.buildings.push(building);
  }
  for (const resource of content.resources) s.stock[resource.id] = resource.start;
  assignJobs(s, content);
  return s;
}
