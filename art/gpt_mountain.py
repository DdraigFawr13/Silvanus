"""Mountain sheet (D-046): clean at pixel 6, split into mountain (00), mine entrance (01) and the six cliff pieces
(02 left end, 03-06 middles, 07 right end), measure the gap and the cliff joins."""
import os
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"  # the art/ folder
from PIL import Image
import numpy as np
from gpt_clean_grid import clean
from gpt_clean_sheet import components

O = ROOT + "gpt/mountain/"
img = clean(O + "sheet.png", 6); img.save(O + "snapped@1x.png")
px = np.asarray(img); H, W = px.shape[:2]
comps = [c for c in components(px[..., 3] > 0) if len(c) >= 3]
top = [c for c in comps if c[:, 0].mean() < H * 0.48]
bot = [c for c in comps if c[:, 0].mean() >= H * 0.48]
groups = [[c for c in top if c[:, 1].mean() < W * 0.66], [c for c in top if c[:, 1].mean() >= W * 0.66]]
cl = sorted(sorted(bot, key=len, reverse=True)[:6], key=lambda c: c[:, 1].mean())
cg = [[c] for c in cl]
for c in bot:
    if any(c is b for b in cl):
        continue
    k = min(range(6), key=lambda i: abs(cl[i][:, 1].mean() - c[:, 1].mean())); cg[k].append(c)
groups += cg

def save(k, grp):
    pts = np.concatenate(grp); y0, x0 = pts.min(0); y1, x1 = pts.max(0)
    piece = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), dtype=np.uint8)
    piece[pts[:, 0] - y0, pts[:, 1] - x0] = px[pts[:, 0], pts[:, 1]]
    Image.fromarray(piece, "RGBA").save(f"{O}piece{k:02d}.png")
    return piece

ps = [save(k, g) for k, g in enumerate(groups)]
for k, p in enumerate(ps):
    print(k, (p.shape[1], p.shape[0]))
m = ps[0][..., 3] > 0
row = m[-3]; xs = np.nonzero(~row[20:-20])[0] + 20
print("gap columns", xs.min(), xs.max(), "gap top row", max(y for y in range(m.shape[0]) if m[y, (xs.min() + xs.max()) // 2]) if False else
      next(y for y in range(m.shape[0] - 1, 0, -1) if m[y, (xs.min() + xs.max()) // 2]))
for k in range(2, 8):  # opaque height of the left and right edge columns (joins)
    a = ps[k][..., 3] > 0
    print(k, "left col", int(a[:, 0].sum()), "right col", int(a[:, -1].sum()), "h", a.shape[0])
