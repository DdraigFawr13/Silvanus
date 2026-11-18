// The town map's size in art pixels (D-047, D-055) and its zoom steps (1x, 2x, 3x device pixels per art
// pixel). Kept apart from map.ts so the Town tab can size the view's placeholder without loading the art.
export const MAP_W = 1408;
export const MAP_H = 888;
export const ZOOMS = [1, 2, 3] as const;
export type Zoom = (typeof ZOOMS)[number];
// The zoom row under the window, in CSS px: 44 px buttons, 6 px above and 10 px below (UI_STYLE gaps).
export const ZOOM_ROW_CSS = 60;
