// The town map (M2c S1, S2; D-037, D-047, D-057): a scroll box the map's size at the zoom step, with a
// canvas the window's size pinned inside it, redrawn from the latest state on every snapshot, scroll, zoom,
// size or sheet change, and a button over every lot and the Hall. Loaded after the first screen (React.lazy
// in TownTab); the art is precached for offline play.
import { content } from '@silvanus/content';
import { hallOf, kindOf } from '@silvanus/sim';
import type { State } from '@silvanus/sim';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { firstBuildText } from '../ui/format';
import groundUrl from './art/ground.webp';
import piecesUrl from './art/pieces.png';
import { camera, centreOf, centreOn, mapCss, windowHeight } from './camera';
import type { Size } from './camera';
import { drawItems } from './draw';
import { emptyMemory, scene, spotsFor } from './layout';
import type { Item, Spot } from './layout';
import { boxOf } from './map';
import type { Point, Rect } from './map';
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
  drawItems(ctx, art.pieces, items, cam, zoom);
  canvas.dataset.zoom = String(zoom);
  canvas.dataset.smoothing = String(ctx.imageSmoothingEnabled);
}

// What a lot's button is called (M2c J3).
function labelOf(state: State, s: Spot): string {
  if (s.lot === null) return `Hall, ${hallOf(state, content).name}`;
  const building = s.buildingId === null ? null : state.buildings[s.lot];
  if (!building) return 'Empty lot, build here';
  const name = kindOf(content, building.kind)!.name;
  return building.tier === 0 ? `${name}, being built` : `${name}, tier ${building.tier}`;
}

// How long a note over a lot being built stays (M2c J3).
const NOTE_MS = 3000;
const NOTE_CSS = 200; // the note's widest, CSS px (app.css .map-note)

export default function TownView({
  state,
  hidden,
  open,
  onBuilding,
  onBuild,
  onHall,
}: {
  state: State;
  hidden: boolean;
  open: number | null; // the building whose sheet is open
  onBuilding: (id: number) => void;
  onBuild: () => void;
  onHall: () => void;
}) {
  const [art, setArt] = useState<Art | null>(null);
  const [failed, setFailed] = useState<unknown>(null);
  const [zoom, setZoom] = useState<Zoom>(place.zoom);
  const [win, setWin] = useState<Size>({ w: 0, h: 0 });
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const memory = useMemo(emptyMemory, []);
  const items = useMemo(() => scene(state, memory, 0, open), [state, memory, open]);
  const spots = useMemo(() => spotsFor(state), [state]);
  // the text of the moment a lot being built was tapped, over its spot for NOTE_MS
  const [note, setNote] = useState<{ lot: number; text: string; at: number } | null>(null);
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => setNote(null), NOTE_MS);
    return () => clearTimeout(timer);
  }, [note]);
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

  const tap = (s: Spot) => {
    if (s.lot === null) return onHall();
    if (s.buildingId === null) return onBuild();
    const building = state.buildings[s.lot];
    if (building.tier > 0) {
      if (open !== building.id) onBuilding(building.id);
      return;
    }
    // a new object each tap, so another tap restarts the 3 s
    setNote({ lot: s.lot, text: firstBuildText(state, building.id), at: Date.now() });
  };

  // a failed art load goes to the error boundary in TownTab, which offers Retry
  if (failed) throw failed;
  const map = mapCss(zoom, dpr);
  // art px to CSS px in the spacer
  const css = (v: number) => (v * zoom) / dpr;
  const noted = note && spots.find((s) => s.lot === note.lot);
  // the note's centre, kept inside the window so its text is never cut off (it is at most NOTE_CSS wide)
  const scrollLeft = box.current?.scrollLeft ?? 0;
  const noteLeft = noted
    ? Math.min(
        Math.max(css(noted.tap.x + noted.tap.w / 2), scrollLeft + NOTE_CSS / 2 + 4),
        scrollLeft + win.w - NOTE_CSS / 2 - 4,
      )
    : 0;
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
          {spots.map((s) => (
            <button
              key={s.name}
              type="button"
              className="map-lot"
              data-testid={s.lot === null ? 'map-hall' : 'map-lot'}
              aria-label={labelOf(state, s)}
              style={{
                left: `${css(s.tap.x)}px`,
                top: `${css(s.tap.y)}px`,
                width: `${css(s.tap.w)}px`,
                height: `${css(s.tap.h)}px`,
              }}
              onClick={() => tap(s)}
            />
          ))}
          {noted && (
            <div
              key={note.at}
              className="map-note"
              data-testid="map-note"
              role="status"
              style={{ left: `${noteLeft}px`, top: `${css(noted.tap.y)}px` }}
            >
              {note.text}
            </div>
          )}
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
