"""Clean a loose sheet of objects (D-046) with the shared cleaner, then group fragments whose boxes lie within D
snapped pixels of each other (chickens with their coop, stumps in a pair), reading order. Usage: <sheet> <out> <P> <D>"""
import sys
from PIL import Image
import numpy as np
from gpt_clean_grid import clean
from gpt_clean_sheet import components

src, out, P, D = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
img = clean(src, P); px = np.asarray(img)
comps = [c for c in components(px[..., 3] > 0) if len(c) >= 3]
box = [[c[:, 0].min(), c[:, 1].min(), c[:, 0].max(), c[:, 1].max()] for c in comps]
par = list(range(len(comps)))
def find(i):
    while par[i] != i: par[i] = par[par[i]]; i = par[i]
    return i
for i in range(len(comps)):
    for j in range(i + 1, len(comps)):
        a, b = box[i], box[j]
        if a[0] - D <= b[2] and b[0] - D <= a[2] and a[1] - D <= b[3] and b[1] - D <= a[3]:
            par[find(i)] = find(j)
groups = {}
for i, c in enumerate(comps):
    groups.setdefault(find(i), []).append(c)
gs = [np.concatenate(g) for g in groups.values()]
gs = [g for g in gs if len(g) > 40]
rowh = 12
gs.sort(key=lambda g: (int(g[:, 0].max() // rowh), g[:, 1].min()))
for k, pts in enumerate(gs):
    y0, x0 = pts.min(0); y1, x1 = pts.max(0)
    piece = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), dtype=np.uint8)
    piece[pts[:, 0] - y0, pts[:, 1] - x0] = px[pts[:, 0], pts[:, 1]]
    Image.fromarray(piece, "RGBA").save(f"{out}piece{k:02d}.png")
    print(k, (int(x0), int(y1)), (int(x1 - x0 + 1), int(y1 - y0 + 1)))
