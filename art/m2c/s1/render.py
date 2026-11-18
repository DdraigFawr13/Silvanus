# M2c S1 mock-up (2026-11-18): draws what S1 ships for a save record: the ground (result_3_graded.png), the scenery,
# the Hall and one piece per building on the spot the spec's rule gives it (sites first, then plots nearest the square).
# S1 draws pieces only: no glows, Build markers, smoke, scaffolding or walkers (S2 to S4). A tier-0 building is drawn
# at 45% (the m2cview1 preview's ghost). Usage: python3 -B art/m2c/s1/render.py <record.json> <out.png>. Not game code.
import json, math, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw
R = pathlib.Path(__file__).resolve().parents[3]; B = R / 'art/pixellab/blocks'
sys.path.insert(0, str(B)); import place
G = np.asarray(Image.open(R / 'art/handoff_chatgpt/result_3_graded.png').convert('RGB')).astype(float)
items = json.load(open(B / 'pass2_items.json'))
size = lambda f: Image.open(B / f).size
SITES = {'raw_woodcutter.png': 'woodcutter', 'raw_forager.png': 'forager', 'raw_farmhouse.png': 'farm', 'raw_mine_entrance.png': 'mine'}
SQ = (894, 478)  # the square's centre (the well), as art/m2c/preview.py
hall = next(i for i in items if i[0] == 'hall_fixed.png')
sites = {SITES[f]: (f, x, y) for f, x, y in items if f in SITES}
plots = [(f, x, y) for f, x, y in items if 'cottage' in f]
centre = lambda f, x, y: (x + size(f)[0] / 2, y + size(f)[1] / 2)
plots.sort(key=lambda p: (math.dist(centre(*p), SQ), p[1]))
scenery = [tuple(i) for i in items if i[0] != 'hall_fixed.png' and i[0] not in SITES and 'cottage' not in i[0]]
STAND_IN = {'workshop': 'raw_cottage_b.png', 'storehouse': 'raw_cottage_c.png', 'tavern': 'raw_cottage_e.png'}  # D-057 Q3

def spots(buildings):
    taken, free, out = set(), list(plots), []
    for b in buildings:
        k = b['kind']
        if k in sites and k not in taken: taken.add(k); out.append((b, sites[k]))
        else: out.append((b, free.pop(0)))
    return out, free

def anchored(f, spot):
    pf, px, py = spot; pw, ph = size(pf); w, h = size(f)
    return int(px + pw / 2 - w / 2), int(py + ph - h)

def put(g, f, x, y, alpha=1.0):
    place.PLACES = [(f, x, y)]; p = place.place(g, True)
    return p if alpha == 1.0 else g * (1 - alpha) + p * alpha

def sign(d, f, x, y, kind):
    w, h = size(f); sx, sy = int(x + w * 0.72), int(y + h * 0.55); c = (230, 220, 190)
    d.rectangle((sx, sy, sx + 15, sy + 11), fill=(120, 84, 44), outline=(30, 20, 12))
    if kind == 'workshop': d.rectangle((sx + 4, sy + 3, sx + 11, sy + 5), fill=c); d.rectangle((sx + 7, sy + 5, sx + 8, sy + 9), fill=c)
    if kind == 'storehouse': d.rectangle((sx + 4, sy + 3, sx + 11, sy + 8), outline=c); d.line((sx + 4, sy + 3, sx + 11, sy + 8), fill=c)
    if kind == 'tavern': d.rectangle((sx + 4, sy + 3, sx + 9, sy + 9), outline=c); d.rectangle((sx + 10, sy + 4, sx + 11, sy + 7), fill=c)

rec = json.load(open(sys.argv[1]))['state']
placed, free = spots(rec['buildings'])
g = G.copy()
draw = [(f, x, y, 1.0, None) for f, x, y in scenery] + [(*hall, 1.0, None)]
for b, spot in placed:
    f, x, y = spot; k = b['kind']
    if k in STAND_IN: f = STAND_IN[k]; x, y = anchored(f, spot)
    elif k == 'cottage' and spot[0] == 'raw_cottage_a.png' and b['tier'] >= 2:
        f = f'raw_cottage_a_t{b["tier"]}.png'; x, y = anchored(f, spot)
    draw.append((f, x, y, 0.45 if b['tier'] == 0 else 1.0, k if k in STAND_IN else None))
draw.sort(key=lambda d: d[2] + size(d[0])[1])  # by bottom edge (depth)
signs = []
for f, x, y, a, k in draw:
    g = put(g, f, x, y, a)
    if k: signs.append((f, x, y, k))
im = Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)); d = ImageDraw.Draw(im)
for s in signs: sign(d, *s)
im.save(sys.argv[2])
print(json.dumps({'placed': [(b['id'], b['kind'], b['tier'], s[0], s[1], s[2]) for b, s in placed], 'empty': [(p[0], p[1], p[2]) for p in free[:max(0, (6 if rec['hallTier'] == 1 else 10) - len(placed))]]}))
