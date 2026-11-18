import { expect, test } from 'vitest';
import { camera, centreOf, centreOn, mapCss, rezoom, windowHeight } from '../src/town/camera';

// Morgan's phone: 412 CSS px wide at dpr 2.625 (spec, Terms); the window is the whole map's height at 1x.
const DPR = 2.625;
const WIN = { w: 412, h: windowHeight(DPR) };
const HALL = { x: 897, y: 186 }; // hall_fixed.png, 216 x 224, at 789, 74

test('zoom steps, clamping and whole device pixels', () => {
  // the window shows 1082, 541 and 360 art px of the width (spec, Terms)
  for (const [zoom, shown] of [
    [1, 1082],
    [2, 541],
    [3, 361],
  ]) {
    expect(camera(WIN, zoom, DPR, { x: 0, y: 0 }).art.w).toBe(shown);
  }
  // at 1x the window is exactly the map's height: no vertical scroll
  expect(mapCss(1, DPR).h).toBeCloseTo(WIN.h, 9);
  expect(camera(WIN, 1, DPR, { x: 0, y: 0 }).canvas.h).toBe(888);

  // the Hall's centre is past what a centred view allows at 1x, so the scroll clamps at the right edge
  const s1 = centreOn(HALL, WIN, 1, DPR);
  expect((s1.x * DPR) / 1).toBeCloseTo(1408 - 412 * DPR, 6); // 326.5 art px
  expect(s1.y).toBe(0);
  // at 2x the Hall is in the middle across, and the top edge clamps
  const s2 = centreOn(HALL, WIN, 2, DPR);
  expect(Math.abs(centreOf(s2, WIN, 2, DPR).x - HALL.x)).toBeLessThan(1);
  expect(s2.y).toBe(0);

  // every art pixel is a whole number of device pixels: the offset is a whole number in (-zoom, 0]
  for (const zoom of [1, 2, 3]) {
    const most = mapCss(zoom, DPR);
    for (const share of [0, 0.003, 0.17, 0.5, 0.919, 1]) {
      const x = (most.w - WIN.w) * share;
      const y = (most.h - WIN.h) * share;
      const cam = camera(WIN, zoom, DPR, { x, y });
      for (const v of [cam.offset.x, cam.offset.y]) {
        expect(Number.isInteger(v)).toBe(true);
        expect(v).toBeLessThanOrEqual(0);
        expect(v).toBeGreaterThan(-zoom);
      }
      // the art drawn covers the canvas and stays on the map
      // the canvas is the window rounded up to whole device px; its last part-pixel column is clipped
      expect(cam.art.w * zoom + cam.offset.x).toBeGreaterThanOrEqual(cam.canvas.w - zoom);
      expect(cam.art.h * zoom + cam.offset.y).toBeGreaterThanOrEqual(cam.canvas.h - zoom);
      expect(cam.art.x + cam.art.w).toBeLessThanOrEqual(1408);
      expect(cam.art.y + cam.art.h).toBeLessThanOrEqual(888);
    }
  }
  expect(camera(WIN, 1, DPR, { x: 0, y: 0 }).canvas.w).toBe(Math.ceil(412 * DPR));

  // a zoom step keeps the map point at the centre, within 1 art pixel, away from the edges
  const mid = centreOn({ x: 700, y: 450 }, WIN, 2, DPR);
  for (const to of [1, 2, 3]) {
    const point = centreOf(rezoom(mid, WIN, 2, to, DPR), WIN, to, DPR);
    if (to > 1) expect(Math.abs(point.x - 700)).toBeLessThan(1);
    if (to > 1) expect(Math.abs(point.y - 450)).toBeLessThan(1);
  }
});
