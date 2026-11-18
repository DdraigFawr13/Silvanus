import { draw } from './rng';
import type { Building, Content, Plot, State } from './types';
import { kindOf } from './util';

// A town's plots (D-058): the town lots by Hall tier, their features a shuffled deck on the
// `lots` stream, then for each ground one site per Hall tier. Only tier 1 plots start open.
// Draws on `s.rng` and nothing else.
export function makePlots(s: State, content: Content): Plot[] {
  const deck: (string | null)[] = [];
  for (const feature of content.features) {
    for (let i = 0; i < feature.count; i++) deck.push(feature.id);
  }
  for (let i = 0; i < content.plainLots; i++) deck.push(null);
  // Fisher-Yates, from the last card down
  for (let i = deck.length - 1; i >= 1; i--) {
    const pick = draw(s.rng, 'lots', s.seed, i + 1);
    s.rng = pick.rng;
    [deck[i], deck[pick.value]] = [deck[pick.value], deck[i]];
  }
  const plots: Plot[] = [];
  let card = 0;
  content.townLots.forEach((count, i) => {
    for (let n = 0; n < count; n++) {
      const tier = i + 1;
      plots.push({ id: plots.length, ground: null, feature: deck[card++], tier, open: tier === 1 });
    }
  });
  for (const ground of content.grounds) {
    for (let tier = 1; tier <= content.townLots.length; tier++) {
      plots.push({ id: plots.length, ground: ground.id, feature: null, tier, open: tier === 1 });
    }
  }
  return plots;
}

// What a plot adds to a kind's output, in percent: rules.boostPct when its feature boosts the
// kind, else 0.
export function plotBoost(content: Content, plot: Plot, kindId: string): number {
  const feature = content.features.find((f) => f.id === plot.feature);
  return feature && feature.boosts.includes(kindId) ? content.rules.boostPct : 0;
}

// What a building's plot adds to its output, in percent (the screens read it, GAME-02).
export function boostOf(state: State, building: Building, content: Content): number {
  const plot = state.plots[building.plot];
  return plot ? plotBoost(content, plot, building.kind) : 0;
}

// The open plots no building stands on (a building still queued counts) whose ground is the
// kind's `site`, or town lots for a kind with none: lots that boost the kind first, then the
// rest, each group in id order. [] for an unknown kind.
export function plotsFor(state: State, kindId: string, content: Content): Plot[] {
  const kind = kindOf(content, kindId);
  if (!kind) return [];
  const ground = kind.site ?? null;
  const taken = new Set(state.buildings.map((b) => b.plot));
  const free = state.plots.filter((p) => p.open && p.ground === ground && !taken.has(p.id));
  const boosted = free.filter((p) => plotBoost(content, p, kindId) > 0);
  return [...boosted, ...free.filter((p) => plotBoost(content, p, kindId) === 0)];
}
