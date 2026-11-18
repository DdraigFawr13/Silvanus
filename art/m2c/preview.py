# M2c preview (2026-11-18): renders the town view's proposal (day one and a grown Village) from result_3_graded.png and the
# target picture's own pieces, for Morgan's picture page https://claude.ai/artifact/NmYqCjBmGsQJS8yuNwjrX6. Not game code.
# Usage: python3 -B art/m2c/preview.py <out_dir>  (writes full_day1.png and full_grown.png; the phone and zoom views were cropped from them)
import json, math, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = pathlib.Path(__file__).resolve().parents[2]; B = R / 'art/pixellab/blocks'; OUT = pathlib.Path(sys.argv[1])
sys.path.insert(0, str(B)); import place
G = np.asarray(Image.open(R / 'art/handoff_chatgpt/result_3_graded.png').convert('RGB')).astype(float)
items = json.load(open(B / 'pass2_items.json'))
size = lambda f: Image.open(B / f).size
SITES = {'raw_woodcutter.png': 'woodcutter', 'raw_forager.png': 'forager', 'raw_farmhouse.png': 'farm', 'raw_mine_entrance.png': 'mine'}
SQ = (894, 478)  # the square's centre, read off the map (the well)
hall = next(i for i in items if i[0] == 'hall_fixed.png')
sites = {SITES[f]: (f, x, y) for f, x, y in items if f in SITES}
plots = [(f, x, y) for f, x, y in items if 'cottage' in f]
def centre(f, x, y): w, h = size(f); return (x + w / 2, y + h / 2)
plots.sort(key=lambda p: (math.dist(centre(*p), SQ), p[1]))
scenery = [tuple(i) for i in items if i[0] != 'hall_fixed.png' and i[0] not in SITES and 'cottage' not in i[0]]
print('plot order', [(p[0], p[1], p[2]) for p in plots])

def put(g, f, x, y, alpha=1.0):
    place.PLACES = [(f, x, y)]
    if alpha == 1.0: return place.place(g, True)
    return g * (1 - alpha) + place.place(g, True) * alpha

def anchored(f, plot):  # another piece standing where the plot's piece stands (bottom centre)
    pf, px, py = plot; pw, ph = size(pf); w, h = size(f)
    return int(px + pw / 2 - w / 2), int(py + ph - h)

def overlay(g, draw_fn):
    im = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).convert('RGBA')
    lay = Image.new('RGBA', im.size, (0, 0, 0, 0)); draw_fn(ImageDraw.Draw(lay), lay)
    return np.asarray(Image.alpha_composite(im, lay).convert('RGB')).astype(float)

AMBER = (217, 164, 65)
def pale_glow(d, lay, f, x, y):
    w, h = size(f); cx, cy = x + w / 2, y + h * 0.72
    glow = Image.new('L', lay.size, 0); ImageDraw.Draw(glow).ellipse((cx - w * .42, cy - h * .2, cx + w * .42, cy + h * .2), fill=110)
    glow = glow.filter(ImageFilter.GaussianBlur(7)); white = Image.new('RGBA', lay.size, (235, 240, 225, 0)); white.putalpha(glow)
    lay.alpha_composite(white)
    # Build marker: a small amber stake sign with a plus
    sx, sy = int(cx), int(cy - 6)
    d.rectangle((sx - 1, sy, sx, sy + 12), fill=(90, 62, 30, 255))
    d.rectangle((sx - 8, sy - 14, sx + 7, sy + 1), fill=AMBER + (255,), outline=(26, 22, 8, 255))
    d.rectangle((sx - 1, sy - 11, sx, sy - 2), fill=(26, 22, 8, 255)); d.rectangle((sx - 5, sy - 7, sx + 4, sy - 6), fill=(26, 22, 8, 255))
def gold_glow(d, lay, f, x, y):
    w, h = size(f); cx, cy = x + w / 2, y + h * 0.62
    glow = Image.new('L', lay.size, 0); ImageDraw.Draw(glow).ellipse((cx - w * .6, cy - h * .45, cx + w * .6, cy + h * .45), fill=150)
    glow = glow.filter(ImageFilter.GaussianBlur(10)); gold = Image.new('RGBA', lay.size, AMBER + (0,)); gold.putalpha(glow)
    lay.alpha_composite(gold)
def smoke(d, x, y, n=4):
    for i in range(n):
        r = 3 + i * 1.6; d.ellipse((x - r + i * 2, y - i * 9 - r, x + r + i * 2, y - i * 9 + r), fill=(200, 205, 210, 150 - i * 30))
def sign(d, f, x, y, kind):
    w, h = size(f); sx, sy = int(x + w * 0.72), int(y + h * 0.55)
    d.rectangle((sx, sy, sx + 15, sy + 11), fill=(120, 84, 44, 255), outline=(30, 20, 12, 255))
    c = (230, 220, 190, 255)
    if kind == 'workshop': d.rectangle((sx + 4, sy + 3, sx + 11, sy + 5), fill=c); d.rectangle((sx + 7, sy + 5, sx + 8, sy + 9), fill=c)
    if kind == 'storehouse': d.rectangle((sx + 4, sy + 3, sx + 11, sy + 8), outline=c); d.line((sx + 4, sy + 3, sx + 11, sy + 8), fill=c)
    if kind == 'tavern': d.rectangle((sx + 4, sy + 3, sx + 9, sy + 9), outline=c); d.rectangle((sx + 10, sy + 4, sx + 11, sy + 7), fill=c)
def scaffold(d, f, x, y):
    w, h = size(f); x0, y0, x1, y1 = x + 10, y + 18, x + w - 10, y + h - 8
    for xx in range(int(x0), int(x1) + 1, 14): d.line((xx, y0, xx, y1), fill=(110, 78, 40, 255), width=2)
    for yy in range(int(y0), int(y1) + 1, 16): d.line((x0, yy, x1, yy), fill=(140, 100, 55, 255), width=2)
    d.line((x0, y1, x1, y0), fill=(110, 78, 40, 255), width=1)
def piles(d, x, y):
    for i, (col, s) in enumerate([((120, 82, 45), 3), ((140, 140, 135), 2), ((190, 160, 110), 3), ((110, 70, 60), 1)]):
        px = x + i * 14; r = 3 + s * 2
        d.ellipse((px - r, y - r, px + r, y + 2), fill=col + (255,), outline=(25, 20, 15, 255))

WALK = [Image.open(R / f'art/gpt/villagers/piece{i:02d}.png').convert('RGBA') for i in range(32)]
def walker(lay, v, f, x, y):
    s = WALK[v * 4 + f]; lay.alpha_composite(s, (int(x - s.width / 2), int(y - s.height)))

def town(kind):
    g = G.copy()
    for f, x, y in scenery: g = put(g, f, x, y)
    g = put(g, *hall)
    marks = []
    if kind == 'day1':
        cot = plots[0]; g = put(g, *cot); g = put(g, *sites['forager'])
        empties = plots[1:5]
        g = overlay(g, lambda d, lay: [pale_glow(d, lay, *p) for p in empties])
        return g
    # a grown Village, 10 lots: 4 sites, 3 cottages (one being built), workshop, storehouse, tavern
    for k in ('woodcutter', 'forager', 'farm', 'mine'): g = put(g, *sites[k])
    order = ['cottage', 'workshop', 'cottage3', 'storehouse', 'tavern', 'cottage0']
    PIECE = {'workshop': 'raw_cottage_b.png', 'storehouse': 'raw_cottage_c.png', 'tavern': 'raw_cottage_e.png'}
    placed = {}
    for k, p in zip(order, plots):
        if k in PIECE: f = PIECE[k]; x, y = anchored(f, p)
        elif k == 'cottage3' and p[0] == 'raw_cottage_a.png': f = 'raw_cottage_a_t3.png'; x, y = anchored(f, p)
        else: f, x, y = p
        placed[k] = (f, x, y)
        g = put(g, f, x, y, 0.45 if k == 'cottage0' else 1.0)
    def deco(d, lay):
        gold_glow(d, lay, *placed['workshop'])
        for k in ('workshop', 'storehouse', 'tavern'): sign(d, *placed[k], k)
        scaffold(d, *placed['cottage0'])
        for k in ('workshop', 'tavern'):
            f, x, y = placed[k]; w, h = size(f); smoke(d, x + w * 0.35, y + 8)
        for k in ('woodcutter', 'farm', 'mine', 'forager'):
            f, x, y = sites[k]; w, h = size(f); smoke(d, x + w * 0.4, y + 6, 3)
        f, x, y = placed['storehouse']; w, h = size(f); piles(d, x - 6, y + h + 4)
        for i, (wx, wy) in enumerate(WALKERS): walker(lay, i % 8, i % 4, wx, wy)
    return overlay(g, deco), placed

WALKERS = [(420, 597), (560, 600), (690, 588), (893, 650), (897, 730), (900, 560), (862, 520), (930, 470), (300, 600), (650, 400), (1040, 600), (180, 620), (760, 330), (820, 795)]

day1 = town('day1'); grown, placed = town('grown')
for name, g in (('day1', day1), ('grown', grown)):
    Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(OUT / f'full_{name}.png')
print('placed', placed)
