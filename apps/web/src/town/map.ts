// The town map's places (M2c spec, "Parts"), in art pixels. Hand-kept; the pieces' boxes come from the
// generated pieces.ts, so a place is never written twice (SRC-01). Scenery: rules have no grid, roads or
// adjacency (D-033); these spots are only where things are drawn.
import { PIECES } from './pieces';

export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

// The well in the square, read off the map; plots are ordered nearest it first (ties by smaller x), as
// art/town_view_pack.py numbers them plot0 to plot9.
export const SQUARE: Point = { x: 894, y: 478 };
export const SITE_KINDS = ['woodcutter', 'forager', 'farm', 'mine'] as const;
export const PLOTS = 10;
// Every target piece that is not the Hall, a site or a plot, in the picture's order.
export const SCENERY = Object.keys(PIECES).filter((name) => name.startsWith('scenery'));

// A lot's tap box is 116 x 116 art px (44 CSS px at 1x and dpr 2.625) centred on its piece; the Hall's is
// its own box (216 x 224), larger. Measured 2026-11-18 (S1): no two spot centres are within 116 art px on
// both axes, so these never overlap; a lot's own box where larger would not (plot0's and plot1's overlap by
// 9 art px), so the spec's "or the piece's box if larger" holds for the Hall only.
const TAP = 116;

export function boxOf(name: string): Rect {
  const piece = PIECES[name];
  return { x: piece.at[0], y: piece.at[1], w: piece.frame[2], h: piece.frame[3] };
}
export function tapOf(rect: Rect, name: string): Rect {
  const w = name === 'hall' ? Math.max(TAP, rect.w) : TAP;
  const h = name === 'hall' ? Math.max(TAP, rect.h) : TAP;
  return { x: rect.x + rect.w / 2 - w / 2, y: rect.y + rect.h / 2 - h / 2, w, h };
}
// The door point: the bottom centre of the spot's own piece (S4 joins it to the road graph).
export const doorOf = (rect: Rect): Point => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h });
// Where smoke leaves a piece, as a share of its box (S3 tunes it by eye), and where the Storehouse's piles
// stand, from its box's bottom-left (S3).
export const SMOKE_ANCHOR = { x: 0.35, y: 0.06 };
export const PILE_OFFSET: Point = { x: -6, y: 4 };
