# Empty-ground guide for the top-left tile (map x 0-512, y 0-512; Claude's hand edit, init only).
# The left 300 px held a lake mirrored from C's stray stream (not in D-047): painted over as a dark
# pine mass along the top (the Skarthorn, M4) thinning to grass with scattered tree shapes (the
# sparse fringe, M5). An earth plot west of the gate road for the woodcutter's camp (M16); the
# cottages along the bottom become three earth plots. Piece A's gate and road stay.
import pathlib
import numpy as np
from PIL import Image, ImageDraw
R = pathlib.Path(__file__).resolve().parents[3]
g = np.asarray(Image.open(R / "art/pixellab/map3/guide.png").convert("RGB").crop((0, 0, 512, 512))).astype(int).copy()
rng = np.random.default_rng(303)
pine = g[20:120, 300:380].reshape(-1, 3); PINE = np.median(pine, axis=0)
t1 = np.asarray(Image.open(R / "art/pixellab/blocks/raw_ground.png").convert("RGB")).astype(int)
gr = t1[330:400, 230:300].reshape(-1, 3); GRASS = np.median(gr[gr[:, 1] > gr[:, 0]], axis=0)
EARTH = np.median(t1[300:330, 120:180].reshape(-1, 3), axis=0)
def fill(c, mask, amp=10):
    n = np.clip(c + rng.integers(-amp, amp + 1, (512, 512, 1)), 0, 255); g[mask] = n[mask]
yy, xx = np.mgrid[0:512, 0:512]
edge = 230 + 40 * np.sin(xx / 37.0) + 25 * np.sin(xx / 13.0 + 1)    # wavy forest edge
left = xx < 300
fill(PINE, left & (yy < edge))
fill(GRASS, left & (yy >= edge))
im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im)
for _ in range(14):                                                  # scattered trees and bushes in the fringe
    x = int(rng.integers(10, 290)); y = int(rng.integers(290, 500)); r = int(rng.integers(8, 20))
    d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(v) for v in PINE))
g = np.asarray(im).astype(int).copy()
plots = [(300, 200, 390, 290), (250, 450, 300, 512), (305, 440, 385, 512), (395, 420, 505, 512)]
fill(GRASS, (xx >= 240) & (yy >= 400) & (xx < 512))                  # the bottom cottages' ground
for x0, y0, x1, y1 in plots:
    fill(EARTH, (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1), 9)
g[:, 500:512] = t1[:, 0:12]                                           # the 12 px shared with the test tile
Image.fromarray(g.astype(np.uint8)).save(R / "art/pixellab/blocks/empty_guide0.png")
