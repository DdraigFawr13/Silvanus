// The camera maths (no DOM): which part of the map the window shows at a zoom step, snapped to whole device
// pixels so every art pixel is exactly `zoom` device pixels wide (crisp, D-047).
import { MAP_H, MAP_W } from './size';
import type { Point } from './map';

export type Size = { w: number; h: number };
export type Camera = {
  canvas: Size; // the canvas's backing size, device px
  art: { x: number; y: number; w: number; h: number }; // the map part to draw, art px
  offset: Point; // where the art part's top-left lands on the canvas, device px (0 or less)
};

// The map's size at a zoom step, in CSS px: the scroll box's spacer.
export const mapCss = (zoom: number, dpr: number): Size => ({
  w: (MAP_W * zoom) / dpr,
  h: (MAP_H * zoom) / dpr,
});
// The window is as tall as the whole map at 1x (D-057).
export const windowHeight = (dpr: number) => MAP_H / dpr;

export function camera(win: Size, zoom: number, dpr: number, scroll: Point): Camera {
  const canvas = { w: Math.ceil(win.w * dpr), h: Math.ceil(win.h * dpr) };
  const sx = Math.round(scroll.x * dpr);
  const sy = Math.round(scroll.y * dpr);
  const ax = Math.max(0, Math.floor(sx / zoom));
  const ay = Math.max(0, Math.floor(sy / zoom));
  const offset = { x: ax * zoom - sx, y: ay * zoom - sy };
  const w = Math.min(MAP_W - ax, Math.ceil((canvas.w - offset.x) / zoom));
  const h = Math.min(MAP_H - ay, Math.ceil((canvas.h - offset.y) / zoom));
  return { canvas, art: { x: ax, y: ay, w, h }, offset };
}

const clamp = (v: number, hi: number) => Math.min(Math.max(0, v), Math.max(0, hi));

// The scroll, in CSS px, that puts an art point in the window's centre, clamped at the map's edges.
export function centreOn(point: Point, win: Size, zoom: number, dpr: number): Point {
  const map = mapCss(zoom, dpr);
  return {
    x: clamp((point.x * zoom) / dpr - win.w / 2, map.w - win.w),
    y: clamp((point.y * zoom) / dpr - win.h / 2, map.h - win.h),
  };
}

// The art point at the window's centre.
export function centreOf(scroll: Point, win: Size, zoom: number, dpr: number): Point {
  return {
    x: ((scroll.x + win.w / 2) * dpr) / zoom,
    y: ((scroll.y + win.h / 2) * dpr) / zoom,
  };
}

// The scroll for another zoom step that keeps the same map point at the centre (as far as the edges allow).
export const rezoom = (scroll: Point, win: Size, from: number, to: number, dpr: number): Point =>
  centreOn(centreOf(scroll, win, from, dpr), win, to, dpr);
