# The town view's art pack (M2c, docs/specs/m2c-town-view.md, "Parts"). Writes, for the game:
#   apps/web/src/town/art/ground.webp  the ground (result_3_graded.png), lossless
#   apps/web/src/town/art/pieces.png   every piece, cut and graded for the spot it stands on, on one sheet
#   apps/web/src/town/pieces.ts        each piece's frame in the sheet and its place on the map (never edit by hand)
# and runs the pack check (J2): drawing the target picture's 30 pieces from the sheet, as the game draws them
# (8-bit source-over, in depth order), must give result_3_grown.png within 1 colour level per channel.
# Each piece is graded exactly as art/pixellab/blocks/place.py grades it (its ground patch dropped, a contact
# shadow, its mean colour moved a quarter of the way to the ground around it); the shadow is baked into the
# sprite's alpha, so one draw gives the same pixels. Usage: python3 -B art/town_view_pack.py
import json, math, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = pathlib.Path(__file__).resolve().parents[1]; B = R / 'art/pixellab/blocks'; OUT = R / 'apps/web/src/town'
GROUND = R / 'art/handoff_chatgpt/result_3_graded.png'; GROWN = R / 'art/handoff_chatgpt/result_3_grown.png'
items = json.load(open(B / 'pass2_items.json'))
SITES = {'raw_woodcutter.png': 'woodcutter', 'raw_forager.png': 'forager', 'raw_farmhouse.png': 'farm', 'raw_mine_entrance.png': 'mine'}
SQ = (894, 478)  # the square's centre (the well), read off the map; plots are ordered by distance from it
STAND_IN = {'workshop': 'raw_cottage_b.png', 'storehouse': 'raw_cottage_c.png', 'tavern': 'raw_cottage_e.png'}  # D-057 Q3
size = lambda f: Image.open(B / f).size

def cut(g, f, x0, y0):
    """place.py's place() for one piece, returning the graded colour, its alpha and the shadow (float arrays)."""
    a = np.asarray(Image.open(B / f).convert('RGBA')).astype(float); h, w = a.shape[:2]
    H, W = g.shape[:2]; x1, y1 = min(W, x0 + w), min(H, y0 + h); cw, ch = x1 - x0, y1 - y0
    ys = np.where(a[..., 3].max(1) > 0)[0]; top, bot = ys.min(), ys.max()
    r, gg, b = a[..., 0], a[..., 1], a[..., 2]
    green = (gg > r + 6) & (gg >= b); low = np.arange(h)[:, None] > bot - 0.18 * (bot - top)
    a = a.copy(); a[..., 3][green & low] = 0
    rgb, al = a[:ch, :cw, :3], a[:ch, :cw, 3:] / 255
    sh = Image.fromarray(a[..., 3].astype(np.uint8)).transform((w, h), Image.AFFINE, (1, 0, -4, 0, 1, -3)).filter(ImageFilter.GaussianBlur(3))
    s = np.asarray(sh).astype(float)[:ch, :cw, None] / 255 * 0.45
    shaded = g.copy(); shaded[y0:y1, x0:x1] *= (1 - s)
    ring = shaded[max(0, y0 - 16):min(H, y1 + 16), max(0, x0 - 16):min(W, x1 + 16)].reshape(-1, 3).mean(0)
    mine = (rgb * al).reshape(-1, 3).sum(0) / max(al.sum(), 1)
    rgb = np.clip(rgb + (ring - mine) * 0.25, 0, 255)
    return rgb, al, s

def apply(g, rgb, al, s, x0, y0):
    ch, cw = al.shape[:2]; g = g.copy(); g[y0:y0 + ch, x0:x0 + cw] *= (1 - s)
    g[y0:y0 + ch, x0:x0 + cw] = g[y0:y0 + ch, x0:x0 + cw] * (1 - al) + rgb * al
    return g

def sprite(rgb, al, s):
    """One RGBA image that, drawn source-over, darkens by the shadow and then lays the piece: A = 1-(1-s)(1-al), C = rgb*al/A."""
    A = 1 - (1 - s) * (1 - al); C = np.where(A > 0, rgb * al / np.maximum(A, 1e-9), 0)
    return np.dstack([np.clip(np.rint(C), 0, 255), np.clip(np.rint(A * 255), 0, 255)]).astype(np.uint8)

def sign(im, kind, w, h):
    d = ImageDraw.Draw(im); sx, sy = int(w * 0.72), int(h * 0.55); c = (230, 220, 190, 255)
    d.rectangle((sx, sy, sx + 15, sy + 11), fill=(120, 84, 44, 255), outline=(30, 20, 12, 255))
    if kind == 'workshop': d.rectangle((sx + 4, sy + 3, sx + 11, sy + 5), fill=c); d.rectangle((sx + 7, sy + 5, sx + 8, sy + 9), fill=c)
    if kind == 'storehouse': d.rectangle((sx + 4, sy + 3, sx + 11, sy + 8), outline=c); d.line((sx + 4, sy + 3, sx + 11, sy + 8), fill=c)
    if kind == 'tavern': d.rectangle((sx + 4, sy + 3, sx + 9, sy + 9), outline=c); d.rectangle((sx + 10, sy + 4, sx + 11, sy + 7), fill=c)

ground = np.asarray(Image.open(GROUND).convert('RGB')).astype(float)
plots = sorted([(i, f, x, y) for i, (f, x, y) in enumerate(items) if 'cottage' in f],
               key=lambda p: (math.dist((p[2] + size(p[1])[0] / 2, p[3] + size(p[1])[1] / 2), SQ), p[2]))
plot_of = {p[0]: n for n, p in enumerate(plots)}
names = []
for i, (f, x, y) in enumerate(items):
    if f == 'hall_fixed.png': names.append('hall')
    elif f in SITES: names.append('site_' + SITES[f])
    elif i in plot_of: names.append(f'plot{plot_of[i]}')
    else: names.append(f'scenery{i}')

# the target's 30 pieces, cut in the file's order, as place.py made result_3_grown.png
sprites, g = {}, ground.copy()
for (f, x, y), name in zip(items, names):
    rgb, al, s = cut(g, f, x, y); g = apply(g, rgb, al, s, x, y)
    sprites[name] = (sprite(rgb, al, s), x, y)
# the other pieces a plot can hold: cottage a's tiers 2 and 3, and the three stand-ins with their trade signs,
# each anchored at the plot's bottom centre and graded against the town without that plot's own piece
base = ground.copy()
for (f, x, y), name in zip(items, names):
    if not name.startswith('plot'): rgb, al, s = cut(base, f, x, y); base = apply(base, rgb, al, s, x, y)
for n, (i, f, px, py) in enumerate(plots):
    pw, ph = size(f); extra = {k: v for k, v in STAND_IN.items()}
    if f == 'raw_cottage_a.png': extra.update(t2='raw_cottage_a_t2.png', t3='raw_cottage_a_t3.png')
    for k, ef in extra.items():
        w, h = size(ef); x, y = int(px + pw / 2 - w / 2), int(py + ph - h)
        rgb, al, s = cut(base, ef, x, y); im = Image.fromarray(sprite(rgb, al, s), 'RGBA')
        if k in STAND_IN: sign(im, k, w, h)
        sprites[f'plot{n}_{k}'] = (np.asarray(im), x, y)

# pack the sheet: rows of pieces, tallest first, 1024 px wide, 1 px apart
order = sorted(sprites, key=lambda k: (-sprites[k][0].shape[0], k))
frames, cx, cy, row = {}, 0, 0, 0
for k in order:
    h, w = sprites[k][0].shape[:2]
    if cx + w > 1024: cx, cy, row = 0, cy + row + 1, 0
    frames[k] = (cx, cy, w, h); cx += w + 1; row = max(row, h)
sheet = Image.new('RGBA', (1024, cy + row), (0, 0, 0, 0))
for k, (fx, fy, w, h) in frames.items(): sheet.paste(Image.fromarray(sprites[k][0], 'RGBA'), (fx, fy))

# the pack check: draw the 30 target pieces from the sheet in depth order (bottom edge), 8-bit, as a canvas does
sh = np.asarray(sheet).astype(float); canvas = np.asarray(Image.open(GROUND).convert('RGB')).astype(float)
for k in sorted(names, key=lambda k: (sprites[k][2] + frames[k][3], names.index(k))):
    fx, fy, w, h = frames[k]; x, y = sprites[k][1], sprites[k][2]
    H, W = canvas.shape[:2]; cw, ch = min(w, W - x), min(h, H - y)
    src = sh[fy:fy + ch, fx:fx + cw]; a = src[..., 3:] / 255
    canvas[y:y + ch, x:x + cw] = np.rint(src[..., :3] * a + canvas[y:y + ch, x:x + cw] * (1 - a))
grown = np.asarray(Image.open(GROWN).convert('RGB')).astype(float)
# result_3_grown.png is place.py's exact render with each colour cut down to a whole level (the spec measured 718
# pixels off by 1), and a canvas rounds, so the check is in two steps that together tie the sheet to the picture:
# the sheet drawn as the game draws it against the exact render, and the exact render against the PNG.
d1 = np.abs(canvas - np.rint(g)); d2 = np.abs(np.floor(g) - grown)
worst = int(max(d1.max(), d2.max()))
print(f'pack check: drawn from the sheet vs the exact render: {int((d1.max(2) > 0).sum())} pixels differ, worst by {int(d1.max())} level(s)')
print(f'pack check: the exact render vs {GROWN.name}: {int((d2.max(2) > 0).sum())} pixels differ, worst by {int(d2.max())} level(s)')

Image.open(GROUND).convert('RGB').save(OUT / 'art/ground.webp', lossless=True, method=6)
sheet.save(OUT / 'art/pieces.png', optimize=True)
lines = ['// Made by art/town_view_pack.py from the target picture (D-055); never edit by hand.',
         '// name: [frame x, frame y, w, h] in pieces.png, then [x, y] of its top-left on the map, in art pixels.',
         'export const PIECES: Record<string, { frame: [number, number, number, number]; at: [number, number] }> = {']
for k in sorted(frames, key=lambda k: (k.rstrip('0123456789_abcdefghijklmnopqrstuvwxyz') , k)):
    fx, fy, w, h = frames[k]; lines.append(f"  {k}: {{ frame: [{fx}, {fy}, {w}, {h}], at: [{sprites[k][1]}, {sprites[k][2]}] }},")
lines.append('};'); lines.append('')
(OUT / 'pieces.ts').write_text('\n'.join(lines))
for p in ('art/ground.webp', 'art/pieces.png'): print(p, (OUT / p).stat().st_size, 'bytes')
if worst > 1: print('pack check FAILED: a piece has drifted from the picture'); sys.exit(1)
