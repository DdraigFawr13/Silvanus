// What the map shows, from the state alone (no DOM): where each lot stands, and the draw list. It reads the
// state and never changes it (D-002, GAME-02): no game rule lives here.
import { content } from '@silvanus/content';
import { hallOf } from '@silvanus/sim';
import type { State } from '@silvanus/sim';
import { pieceFor } from './kinds';
import { PLOTS, SCENERY, SITE_KINDS, boxOf, doorOf, tapOf } from './map';
import type { Point, Rect } from './map';
import { PIECES } from './pieces';

export type Spot = {
  lot: number | null; // null for the Hall
  buildingId: number | null; // null for the Hall and an empty lot
  kind: string | null;
  name: string; // the spot's own piece: 'hall', 'site_<kind>' or 'plot<n>'
  rect: Rect;
  tap: Rect;
  door: Point;
};

export type Item = {
  type: 'piece';
  name: string; // a frame in pieces.png
  x: number; // top-left, art px
  y: number;
  depth: number; // the bottom edge: items are drawn in rising depth
  alpha: number;
};

// S4 fills this (who has been seen, walks under way); S1 draws no walkers.
export type Memory = Record<string, never>;
export const emptyMemory = (): Memory => ({});

const spot = (
  name: string,
  lot: number | null,
  buildingId: number | null,
  kind: string | null,
): Spot => {
  const rect = boxOf(name);
  return { lot, buildingId, kind, name, rect, tap: tapOf(rect, name), door: doorOf(rect) };
};

// The Hall first; then each building in lot order: a site kind takes its site if no earlier building took
// it, every other building (and a second of a site kind) the first free plot; then each empty lot the next
// free plot (spec, "Spots"; D-057 Q2 A). The same state always gives the same spots.
export function spotsFor(state: State): Spot[] {
  const spots = [spot('hall', null, null, null)];
  const sites = new Set<string>();
  let plot = 0;
  state.buildings.forEach((building, lot) => {
    const kind = building.kind;
    if ((SITE_KINDS as readonly string[]).includes(kind) && !sites.has(kind)) {
      sites.add(kind);
      spots.push(spot(`site_${kind}`, lot, building.id, kind));
    } else if (plot < PLOTS) {
      spots.push(spot(`plot${plot++}`, lot, building.id, kind));
    }
  });
  const lots = hallOf(state, content).lots;
  for (let lot = state.buildings.length; lot < lots && plot < PLOTS; lot++) {
    spots.push(spot(`plot${plot++}`, lot, null, null));
  }
  return spots;
}

const piece = (name: string, x: number, y: number, alpha = 1): Item => ({
  type: 'piece',
  name,
  x,
  y,
  depth: y + PIECES[name].frame[3],
  alpha,
});

// A building being built is drawn faded until S3's scaffolding (approved on the S1 mock-up).
const BUILDING_ALPHA = 0.45;

// The draw list at `ms` (performance.now) with `open` the building whose sheet is open, sorted by depth.
// S1: the scenery, the Hall and one piece per building; `memory`, `ms` and `open` are used from S2 on.
export function scene(state: State, _memory: Memory, _ms: number, _open: number | null): Item[] {
  const items = SCENERY.map((name) => piece(name, PIECES[name].at[0], PIECES[name].at[1]));
  for (const s of spotsFor(state)) {
    if (s.lot === null) {
      items.push(piece('hall', s.rect.x, s.rect.y));
      continue;
    }
    if (s.buildingId === null) continue;
    const building = state.buildings[s.lot];
    const { name, native } = pieceFor(building.kind, building.tier, s.name);
    const [, , w, h] = PIECES[name].frame;
    const [x, y] = native
      ? PIECES[name].at
      : [Math.round(s.rect.x + s.rect.w / 2 - w / 2), s.rect.y + s.rect.h - h];
    items.push(piece(name, x, y, building.tier === 0 ? BUILDING_ALPHA : 1));
  }
  return items.sort((a, b) => a.depth - b.depth || a.x - b.x);
}
