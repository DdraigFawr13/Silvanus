// The town map (M2c S1; D-037, D-047, D-057): a scroll box the map's size at the zoom step, with a canvas
// the window's size pinned inside it, redrawn from the latest state on every snapshot, scroll, zoom or size
// change. Loaded after the first screen (React.lazy in TownTab); the art is precached for offline play.
import type { State } from '@silvanus/sim';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import groundUrl from './art/ground.webp';
import piecesUrl from './art/pieces.png';
import { camera, centreOf, centreOn, mapCss, windowHeight } from './camera';
import type { Size } from './camera';
import { emptyMemory, scene } from './layout';
import type { Item } from './layout';
import { boxOf } from './map';
import type { Point, Rect } from './map';
import { PIECES } from './pieces';
import { ZOOMS } from './size';
import type { Zoom } from './size';

type Art = { ground: HTMLImageElement; pieces: HTMLImageElement };

function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.src = src;
  return image.decode().then(() => image);
}
let artPromise: Promise<Art> | null = null;
// One load per page; a failed load is dropped, so Retry loads again.
function loadArt(): Promise<Art> {
  artPromise ??= Promise.all([loadImage(groundUrl), loadImage(piecesUrl)])
    .then(([ground, pieces]) => ({ ground, pieces }))
    .catch((error: unknown) => {
      artPromise = null;
      throw error;
    });
  return artPromise;
}

// Kept across tab switches, remounts and resizes: the zoom step and the art point at the window's
// centre (a `display: none` box loses its scroll offset, and a CSS-px offset means another point
// once the window's size changes).
const place: { zoom: Zoom; centre: Point | null } = { zoom: 1, centre: null };

function draw(
  canvas: HTMLCanvasElement,
  art: Art,
  items: Item[],
  win: Size,
  zoom: number,
  scroll: Point,
) {
  const dpr = window.devicePixelRatio || 1;
  const cam = camera(win, zoom, dpr, scroll);
  if (canvas.width !== cam.canvas.w) canvas.width = cam.canvas.w;
  if (canvas.height !== cam.canvas.h) canvas.height = cam.canvas.h;
  // the CSS size is the backing size over dpr, so the browser never scales the canvas
  canvas.style.width = `${cam.canvas.w / dpr}px`;
  canvas.style.height = `${cam.canvas.h / dpr}px`;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { art: a, offset } = cam;
  ctx.drawImage(art.ground, a.x, a.y, a.w, a.h, offset.x, offset.y, a.w * zoom, a.h * zoom);
  for (const item of items) {
    const [fx, fy, w, h] = PIECES[item.name].frame;
    if (item.x + w < a.x || item.x > a.x + a.w || item.y + h < a.y || item.y > a.y + a.h) continue;
    ctx.globalAlpha = item.alpha;
    const dx = (item.x - a.x) * zoom + offset.x;
    const dy = (item.y - a.y) * zoom + offset.y;
    ctx.drawImage(art.pieces, fx, fy, w, h, dx, dy, w * zoom, h * zoom);
  }
  ctx.globalAlpha = 1;
  canvas.dataset.zoom = String(zoom);
  canvas.dataset.smoothing = String(ctx.imageSmoothingEnabled);
}

export default function TownView({ state, hidden }: { state: State; hidden: boolean }) {
  const [art, setArt] = useState<Art | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  const [zoom, setZoom] = useState<Zoom>(place.zoom);
  const [win, setWin] = useState<Size>({ w: 0, h: 0 });
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const memory = useMemo(emptyMemory, []);
  const items = useMemo(() => scene(state, memory, 0, null), [state, memory]);
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

  useEffect(() => {
    let live = true;
    loadArt().then(
      (loaded) => live && setArt(loaded),
      (error: unknown) => live && setFailed(error ?? new Error('map art')),
    );
    return () => {
      live = false;
    };
  }, []);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () =>
      setWin((old) =>
        old.w === el.clientWidth && old.h === el.clientHeight
          ? old
          : { w: el.clientWidth, h: el.clientHeight },
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Place the scroll: the Hall at the centre the first time the window has a size, else the point
  // that was at the centre; then keep the point the clamped scroll really centres.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el || hidden || win.w === 0) return;
    const scroll = centreOn(place.centre ?? centre(boxOf('hall')), win, zoom, dpr);
    el.scrollLeft = scroll.x;
    el.scrollTop = scroll.y;
    place.centre = centreOf({ x: el.scrollLeft, y: el.scrollTop }, win, zoom, dpr);
  }, [hidden, win, zoom, dpr]);

  const redraw = () => {
    const el = box.current;
    if (!art || !canvas.current || !el || win.w === 0 || hidden) return;
    draw(canvas.current, art, items, win, zoom, { x: el.scrollLeft, y: el.scrollTop });
  };
  useLayoutEffect(redraw);

  const onScroll = () => {
    const el = box.current;
    if (!el || hidden || win.w === 0) return;
    place.centre = centreOf({ x: el.scrollLeft, y: el.scrollTop }, win, zoom, dpr);
    redraw();
  };
  const pick = (next: Zoom) => {
    const el = box.current;
    if (next === zoom || !el) return;
    // the centre point stays; the layout effect scrolls the new spacer to it
    place.centre = centreOf({ x: el.scrollLeft, y: el.scrollTop }, win, zoom, dpr);
    place.zoom = next;
    setZoom(next);
  };

  // a failed art load goes to the error boundary in TownTab, which offers Retry
  if (failed) throw failed;
  const map = mapCss(zoom, dpr);
  return (
    <div className="town-view" data-testid="town-view">
      <div
        className={zoom === 1 ? 'town-scroll flat' : 'town-scroll'}
        data-testid="town-scroll"
        ref={box}
        style={{ height: `${windowHeight(dpr)}px` }}
        onScroll={onScroll}
      >
        <div className="town-spacer" style={{ width: `${map.w}px`, height: `${map.h}px` }}>
          <div className="town-pin" style={{ width: `${win.w}px`, height: `${win.h}px` }}>
            <canvas ref={canvas} aria-label="The town map" />
          </div>
        </div>
      </div>
      <div className="zoom-row">
        <span className="zoom-label">Zoom</span>
        <div className="zoom-seg">
          {ZOOMS.map((z) => (
            <button
              key={z}
              type="button"
              data-testid={`zoom-${z}`}
              aria-pressed={z === zoom}
              aria-label={`Zoom ${z}×`}
              onClick={() => pick(z)}
            >
              {z}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const centre = (r: Rect): Point => ({
  x: r.x + r.w / 2,
  y: r.y + r.h / 2,
});
