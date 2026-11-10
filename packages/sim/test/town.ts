import { content } from '../../content/src/index';
import { newGame, step } from '../src/index';
import type { Building, Command, State } from '../src/index';

export { content };

export function run(state: State, ticks: number, first: Command[] = []): State {
  let s = state;
  for (let i = 0; i < ticks; i++) s = step(s, i === 0 ? first : [], content).state;
  return s;
}

export const byKind = (state: State, kind: string): Building =>
  state.buildings.find((b) => b.kind === kind)!;

export const workers = (state: State, buildingId: number): number =>
  state.residents.filter((r) => r.jobId === buildingId).length;

// Seed 1 with every store at its cap.
export function rich(): State {
  const start = newGame(1, content);
  const stock = Object.fromEntries(content.resources.map((r) => [r.id, r.cap]));
  return { ...start, stock };
}

// A finished tier 1 building of a kind, as the engine would have left it.
export function finished(state: State, kind: string): State {
  const k = content.buildings.find((b) => b.id === kind)!;
  const method = content.methods.find((m) => m.building === kind);
  const building: Building = {
    id: state.nextId,
    kind,
    tier: 1,
    method: method ? method.id : null,
    open: k.tiers[0].slots,
    retoolLeft: 0,
    carry: {},
    debt: {},
    short: false,
  };
  return { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, building] };
}
