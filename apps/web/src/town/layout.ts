// What the map shows, from the state alone (no DOM): where each lot stands, and the draw list. It reads the
// state and never changes it (D-002, GAME-02): no game rule lives here.
import { content } from '@silvanus/content';
import { kindOf } from '@silvanus/sim';
import type { Plot, State } from '@silvanus/sim';
import { pieceFor } from './kinds';
import { PLOTS, SCENERY, SITE_KINDS, boxOf, doorOf, tapOf } from './map';
import type { Point, Rect } from './map';
import { PIECES } from './pieces';

export type Spot = {
  plot: number | null; // its plot's id in state.plots; null for the Hall
  buildingId: number | null; // null for the Hall and an empty plot
  kind: string | null;
  name: string; // the spot's own piece: 'hall', 'site_<kind>' or 'plot<n>'
  rect: Rect;
  tap: Rect;
  door: Point;
};

export type Piece = {
  type: 'piece';
  name: string; // a frame in pieces.png
  x: number; // top-left, art px
  y: number;
  depth: number; // the bottom edge: items are drawn in rising depth
  alpha: number;
};
// Light on a lot (checklist P2, P3; Morgan's "Earlier look", 2026-11-18, art/pixellab/blocks/overlays.py):
// pale, a soft oval on an empty lot, centred on `x`, `y`, `w` x `h` art px; gold, a soft ring that follows
// the outline of the piece `piece` (top-left `x`, `y`) on the lot whose sheet is open, drawn just under it.
export type Glow =
  | {
      type: 'glow';
      tone: 'pale';
      plot: number;
      x: number;
      y: number;
      w: number;
      h: number;
      depth: number;
    }
  | {
      type: 'glow';
      tone: 'gold';
      plot: number;
      piece: string;
      x: number;
      y: number;
      depth: number;
    };
// The Build marker on an empty lot (P4), centred on `x`, `y`.
export type BuildMarker = {
  type: 'build-marker';
  plot: number;
  x: number;
  y: number;
  depth: number;
};
export type Item = Piece | Glow | BuildMarker;

// S4 fills this (who has been seen, walks under way); S1 draws no walkers.
export type Memory = Record<string, never>;
export const emptyMemory = (): Memory => ({});

const spot = (
  name: string,
  plot: number | null,
  buildingId: number | null,
  kind: string | null,
): Spot => {
  const rect = boxOf(name);
  return { plot, buildingId, kind, name, rect, tap: tapOf(rect, name), door: doorOf(rect) };
};

// The site spot each ground's first site stands on: the ground of the kind the target picture drew there.
const SITE_SPOT = new Map<string, string>(
  SITE_KINDS.map((k) => [kindOf(content, k)!.site!, `site_${k}`]),
);

// The map spot of a plot (D-058's records, so a lot keeps its spot, D-037): town lot n on `plot<n>`; the
// first site of a ground on that ground's site spot. Other plots (town lots past the 10 spots, later sites,
// the river) have no spot yet: M2b step 4 adds them.
function spotName(state: State, plot: Plot): string | null {
  if (plot.ground === null) return plot.id < PLOTS ? `plot${plot.id}` : null;
  const first = state.plots.find((p) => p.ground === plot.ground);
  return first === plot ? (SITE_SPOT.get(plot.ground) ?? null) : null;
}

// The Hall first; then every open plot that has a spot, in plot order, with the building on it if any. The
// same state always gives the same spots, and a building keeps its spot while it stands.
export function spotsFor(state: State): Spot[] {
  const spots = [spot('hall', null, null, null)];
  for (const plot of state.plots) {
    if (!plot.open) continue;
    const name = spotName(state, plot);
    if (!name) continue;
    const building = state.buildings.find((b) => b.plot === plot.id);
    spots.push(spot(name, plot.id, building?.id ?? null, building?.kind ?? null));
  }
  return spots;
}

const piece = (name: string, x: number, y: number, alpha = 1): Piece => ({
  type: 'piece',
  name,
  x,
  y,
  depth: y + PIECES[name].frame[3],
  alpha,
});

// A building being built is drawn faded until S3's scaffolding (approved on the S1 mock-up).
const BUILDING_ALPHA = 0.45;

// A pale glow lies on the ground at the foot of the spot's piece, as wide as its tap box (S2).
const GLOW_H = 0.4;
const paleGlow = (s: Spot): Glow => {
  const h = Math.round(s.tap.w * GLOW_H);
  const y = s.door.y - h / 2;
  return {
    type: 'glow',
    tone: 'pale',
    plot: s.plot!,
    x: s.door.x,
    y,
    w: s.tap.w,
    h,
    depth: s.door.y,
  };
};

// The draw list at `ms` (performance.now) with `open` the building whose sheet is open: the pieces sorted
// by depth (the open building's gold ring just before its piece), then the pale glows and Build markers
// over them (spec, "Drawing"). `memory` and `ms` are used from S3 on.
export function scene(state: State, _memory: Memory, _ms: number, open: number | null): Item[] {
  const items: Item[] = SCENERY.map((name) => piece(name, PIECES[name].at[0], PIECES[name].at[1]));
  const marks: Item[] = [];
  for (const s of spotsFor(state)) {
    if (s.plot === null) {
      items.push(piece('hall', s.rect.x, s.rect.y));
      continue;
    }
    if (s.buildingId === null) {
      // the marker sits in the middle of its glow, as on the earlier map
      const pale = paleGlow(s);
      marks.push(pale);
      marks.push({ type: 'build-marker', plot: s.plot, x: pale.x, y: pale.y, depth: s.door.y });
      continue;
    }
    const building = state.buildings.find((b) => b.id === s.buildingId)!;
    const { name, native } = pieceFor(building.kind, building.tier, s.name);
    const [, , w, h] = PIECES[name].frame;
    const [x, y] = native
      ? PIECES[name].at
      : [Math.round(s.rect.x + s.rect.w / 2 - w / 2), s.rect.y + s.rect.h - h];
    const drawn = piece(name, x, y, building.tier === 0 ? BUILDING_ALPHA : 1);
    if (s.buildingId === open) {
      items.push({
        type: 'glow',
        tone: 'gold',
        plot: s.plot,
        piece: name,
        x,
        y,
        depth: drawn.depth - 0.5,
      });
    }
    items.push(drawn);
  }
  items.sort((a, b) => a.depth - b.depth || a.x - b.x);
  return [...items, ...marks];
}
