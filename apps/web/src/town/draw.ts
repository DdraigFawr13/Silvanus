// Drawing the draw list on the canvas (M2c spec, "Drawing"). Pieces come from pieces.png; glows are drawn
// here in code as whole art pixels, scaled by the zoom step, so they stay crisp. Their look is the earlier
// map's (Morgan, 2026-11-18, "Earlier look": art/pixellab/blocks/overlays.py).
import type { Camera } from './camera';
import type { Glow, Item } from './layout';
import { PIECES } from './pieces';

type Rgb = [number, number, number];
const ACT: Rgb = [0xd9, 0xa4, 0x41]; // --act, lamp amber (D-028)
const PALE: Rgb = [0xe6, 0xe3, 0xd6]; // --ink
const PALE_CORE = 0.14;
const PALE_RIM = 0.34;
// the gold ring: the piece's outline grown by a 7 x 7 max filter, blurred (sigma 3), --act at 0.75
const GROW = 3;
const SIGMA = 3;
const BLUR = 3 * SIGMA;
const RING_ALPHA = 0.75;
const MARGIN = GROW + BLUR;

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
      image.data.set([...px[0], Math.round(px[1] * 255)], (y * w + x) * 4);
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
function paleSprite(w: number, h: number) {
  return cached(`pale:${w}x${h}`, () =>
    sprite(w, h, (x, y) => {
      const dx = (x + 0.5 - w / 2) / (w / 2);
      const dy = (y + 0.5 - h / 2) / (h / 2);
      const d = dx * dx + dy * dy;
      if (d >= 1) return null;
      const band = Math.min(3, Math.floor(d * 4)); // 0 in the middle, 3 at the rim
      return [PALE, PALE_CORE + ((PALE_RIM - PALE_CORE) * band) / 3];
    }),
  );
}

// Separable passes over a w x h array, along rows (`dx` 1, `dy` 0) or columns (0, 1); outside is 0.
function maxPass(src: Float32Array, w: number, h: number, dx: number, dy: number) {
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = -GROW; k <= GROW; k++) {
        const sx = x + k * dx;
        const sy = y + k * dy;
        if (sx >= 0 && sx < w && sy >= 0 && sy < h) m = Math.max(m, src[sy * w + sx]);
      }
      out[y * w + x] = m;
    }
  }
  return out;
}
const KERNEL = Array.from({ length: 2 * BLUR + 1 }, (_, k) =>
  Math.exp(-((k - BLUR) ** 2) / (2 * SIGMA ** 2)),
);
const KERNEL_SUM = KERNEL.reduce((t, k) => t + k, 0);
function blurPass(src: Float32Array, w: number, h: number, dx: number, dy: number) {
  const out = new Float32Array(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let t = 0;
      for (let k = -BLUR; k <= BLUR; k++) {
        const sx = x + k * dx;
        const sy = y + k * dy;
        if (sx >= 0 && sx < w && sy >= 0 && sy < h) t += src[sy * w + sx] * KERNEL[k + BLUR];
      }
      out[y * w + x] = t / KERNEL_SUM;
    }
  }
  return out;
}

// The gold ring round a piece: its alpha grown and blurred, coloured --act; the piece drawn over it leaves
// the building itself unglowed. The sprite is MARGIN px bigger than the piece on every side.
function ringSprite(pieces: HTMLImageElement, name: string) {
  return cached(`ring:${name}`, () => {
    const [fx, fy, pw, ph] = PIECES[name].frame;
    const w = pw + 2 * MARGIN;
    const h = ph + 2 * MARGIN;
    const scratch = document.createElement('canvas');
    scratch.width = w;
    scratch.height = h;
    const sctx = scratch.getContext('2d')!;
    sctx.drawImage(pieces, fx, fy, pw, ph, MARGIN, MARGIN, pw, ph);
    const data = sctx.getImageData(0, 0, w, h).data;
    let a = new Float32Array(w * h);
    for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3] / 255;
    a = maxPass(maxPass(a, w, h, 1, 0), w, h, 0, 1);
    a = blurPass(blurPass(a, w, h, 1, 0), w, h, 0, 1);
    return sprite(w, h, (x, y) => {
      const v = a[y * w + x];
      return v > 0.004 ? [ACT, v * RING_ALPHA] : null;
    });
  });
}

function frameOf(pieces: HTMLImageElement, item: Glow) {
  if (item.tone === 'gold') {
    return { image: ringSprite(pieces, item.piece), x: item.x - MARGIN, y: item.y - MARGIN };
  }
  const image = paleSprite(item.w, item.h);
  return { image, x: Math.round(item.x - item.w / 2), y: Math.round(item.y - item.h / 2) };
}

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
    // the Build marker is a page element over the canvas, a fixed size at every zoom (TownView)
    if (item.type === 'build-marker') continue;
    if (item.type === 'piece') {
      [fx, fy, w, h] = PIECES[item.name].frame;
      ({ x, y } = item);
    } else {
      const frame = frameOf(pieces, item);
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
