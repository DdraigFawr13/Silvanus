import { content } from '../../content/src/index';
import { newGame, plotBoost, plotsFor, step } from '../src/index';
import type { Building, Command, Plot, State } from '../src/index';

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

// The free plot a test builds a kind on: a plain lot first, then one whose feature does not
// boost the kind, so pinned output numbers hold (spec, "Callers of build"); a boosted one last.
export function testPlot(state: State, kind: string): Plot | undefined {
  const free = plotsFor(state, kind, content);
  return (
    free.find((p) => p.feature === null) ??
    free.find((p) => plotBoost(content, p, kind) === 0) ??
    free[0]
  );
}

// A build of `kind` on its test plot; plot -1 (refused `unknown`) when none is free.
export const build = (state: State, kind: string): Command => ({
  type: 'build',
  kind,
  plot: testPlot(state, kind)?.id ?? -1,
});

// A finished tier 1 building of a kind, as the engine would have left it, on its test plot.
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
    owned: content.methods
      .filter((m) => m.building === kind && Object.keys(m.cost).length === 0)
      .map((m) => m.id),
    plot: testPlot(state, kind)!.id,
    shutLeft: 0,
    shutBy: null,
  };
  return { ...state, nextId: state.nextId + 1, buildings: [...state.buildings, building] };
}

// Every resident at skill 50 and morale 50, an effect of 100 (spec, "Journeys"), until the
// first game day moves their morale.
export function steady(state: State): State {
  const residents = state.residents.map((r) => ({
    ...r,
    morale: 50,
    skills: Object.fromEntries(Object.keys(r.skills).map((id) => [id, 50])),
  }));
  return { ...state, residents };
}

// The town with copies of its residents added until it holds `total`, each with its own id and
// name, so a test can reach 20 without waiting for settlers.
export function crowd(state: State, total: number): State {
  const residents = state.residents.slice();
  let nextId = state.nextId;
  for (let i = 0; residents.length < total; i++) {
    const model = state.residents[i % state.residents.length];
    residents.push({
      ...model,
      id: nextId++,
      name: `${model.name} ${i + 2}`,
      jobId: null,
      pinnedTo: null,
    });
  }
  return { ...state, residents, nextId, jobsDirty: true };
}
