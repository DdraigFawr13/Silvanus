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

// The smallest tap target, CSS px each way (UI_STYLE; M2c J3).
export const TAP_CSS = 44;
const overlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// The tap boxes the view places at a zoom step on a screen of `dpr` device px per CSS px, art px: each spot's
// box (`taps`, in the same order) grown about its centre to at least TAP_CSS CSS px each way; two that
// would overlap are pushed apart, half each, along the axis their centres are further apart on. On Morgan's
// phone (dpr 2.625) no box grows; at dpr 3 and 1x plot0 and plot1 (121 art px apart) are pushed 5.5 px each.
export function tapBoxes(taps: Rect[], zoom: number, dpr: number): Rect[] {
  const least = (TAP_CSS * dpr) / zoom;
  const boxes = taps.map((t) => {
    const w = Math.max(t.w, least);
    const h = Math.max(t.h, least);
    return { x: t.x + t.w / 2 - w / 2, y: t.y + t.h / 2 - h / 2, w, h };
  });
  for (let round = 0; round < 20; round++) {
    let moved = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        if (!overlap(a, b)) continue;
        const dx = b.x + b.w / 2 - (a.x + a.w / 2);
        const dy = b.y + b.h / 2 - (a.y + a.h / 2);
        const onX = Math.abs(dx) >= Math.abs(dy);
        const push = onX ? (a.w + b.w) / 2 - Math.abs(dx) : (a.h + b.h) / 2 - Math.abs(dy);
        const sign = (onX ? dx : dy) >= 0 ? 1 : -1;
        const half = (push / 2) * sign;
        if (onX) {
          a.x -= half;
          b.x += half;
        } else {
          a.y -= half;
          b.y += half;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }
  return boxes;
}
