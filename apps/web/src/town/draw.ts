// Drawing the draw list on the canvas (M2c spec, "Drawing"). Pieces come from pieces.png; glows and the
// Build marker are drawn here in code as plain art pixels until PixelLab pieces exist (S2), so every shape
// is whole art pixels scaled by the zoom step and stays crisp.
import type { Camera } from './camera';
import type { BuildMarker, Glow, Item } from './layout';
import { PIECES } from './pieces';

type Rgb = [number, number, number];
// --ink and --act (D-028): a pale glow on an empty lot, a gold one on the lot whose sheet is open
const TONES: Record<Glow['tone'], { rgb: Rgb; core: number; rim: number }> = {
  pale: { rgb: [0xe6, 0xe3, 0xd6], core: 0.14, rim: 0.34 },
  gold: { rgb: [0xd9, 0xa4, 0x41], core: 0.3, rim: 0.85 },
};
const BG: Rgb = [0x16, 0x21, 0x20]; // --bg
const ACT: Rgb = [0xd9, 0xa4, 0x41]; // --act

function sprite(w: number, h: number, paint: (x: number, y: number) => [Rgb, number] | null) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = paint(x, y);
      if (!px) continue;
      const i = (y * w + x) * 4;
      image.data.set([...px[0], Math.round(px[1] * 255)], i);
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

const sprites = new Map<string, HTMLCanvasElement>();
const cached = (key: string, make: () => HTMLCanvasElement) => {
  let found = sprites.get(key);
  if (!found) sprites.set(key, (found = make()));
  return found;
};

// An oval in four bands, faint in the middle and brightest at the rim, so it reads as light on the ground.
function glowSprite(tone: Glow['tone'], w: number, h: number) {
  return cached(`glow:${tone}:${w}x${h}`, () => {
    const { rgb, core, rim } = TONES[tone];
    return sprite(w, h, (x, y) => {
      const dx = (x + 0.5 - w / 2) / (w / 2);
      const dy = (y + 0.5 - h / 2) / (h / 2);
      const d = dx * dx + dy * dy;
      if (d >= 1) return null;
      const band = Math.min(3, Math.floor(d * 4)); // 0 in the middle, 3 at the rim
      return [rgb, core + ((rim - core) * band) / 3];
    });
  });
}

// The Build marker: a round dark plate with a gold rim and a gold plus, 11 x 11 cells of 4 art px.
const CELL = 4;
const CELLS = 11;
export const MARKER_SIZE = CELL * CELLS;
function markerSprite() {
  return cached('marker', () =>
    sprite(MARKER_SIZE, MARKER_SIZE, (x, y) => {
      const cx = Math.floor(x / CELL) - 5;
      const cy = Math.floor(y / CELL) - 5;
      const r = Math.hypot(cx, cy);
      if (r > 5.4) return null;
      if (r > 4.4) return [ACT, 1];
      const plus = (cx === 0 && Math.abs(cy) <= 2) || (cy === 0 && Math.abs(cx) <= 2);
      return plus ? [ACT, 1] : [BG, 0.85];
    }),
  );
}

const glowFrame = (g: Glow) => ({
  image: glowSprite(g.tone, g.w, g.h),
  x: Math.round(g.x - g.w / 2),
  y: Math.round(g.y - g.h / 2),
});
const markerFrame = (m: BuildMarker) => ({
  image: markerSprite(),
  x: Math.round(m.x - MARKER_SIZE / 2),
  y: Math.round(m.y - MARKER_SIZE / 2),
});

// Every item in the camera's part of the map, in list order, at whole art pixels times the zoom.
export function drawItems(
  ctx: CanvasRenderingContext2D,
  pieces: HTMLImageElement,
  items: Item[],
  cam: Camera,
  zoom: number,
) {
  const { art: a, offset } = cam;
  for (const item of items) {
    let image: CanvasImageSource = pieces;
    let fx = 0;
    let fy = 0;
    let w: number;
    let h: number;
    let x: number;
    let y: number;
    if (item.type === 'piece') {
      [fx, fy, w, h] = PIECES[item.name].frame;
      ({ x, y } = item);
    } else {
      const frame = item.type === 'glow' ? glowFrame(item) : markerFrame(item);
      ({ image, x, y } = frame);
      w = frame.image.width;
      h = frame.image.height;
    }
    if (x + w < a.x || x > a.x + a.w || y + h < a.y || y > a.y + a.h) continue;
    ctx.globalAlpha = item.type === 'piece' ? item.alpha : 1;
    const dx = (x - a.x) * zoom + offset.x;
    const dy = (y - a.y) * zoom + offset.y;
    ctx.drawImage(image, fx, fy, w, h, dx, dy, w * zoom, h * zoom);
  }
  ctx.globalAlpha = 1;
}
