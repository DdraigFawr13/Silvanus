# Top-left tile guide by collage (Claude's hand edit, init only), after the loose pixflux pass drew
# the forest as a walled block: forest from the test's restyled pines with a wavy lower edge (M4),
# fringe from the pass's stones and stumps (M5), an earth plot for the woodcutter's camp (M16),
# the bottom plots from the second pass; piece A's gate and road on the right stay.
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
g = np.asarray(Image.open(B / "in_t0.png").convert("RGB")).astype(int).copy()
pines = np.asarray(Image.open(B / "raw_ground.png").convert("RGB")).astype(int)
t0a = np.asarray(Image.open(B / "raw_t0a.png").convert("RGB")).astype(int)
t1 = pines
rng = np.random.default_rng(303)
# fringe first: stones and stumps from the pass's lower left, tiled across x 0-390, rows 150-400
fr = t0a[258:400, 0:180]                 # below the pass's wall: grass, stones, stumps (142 rows)
for x0 in range(0, 390, 180):
    w = min(180, 390 - x0); g[258:400, x0:x0 + w] = fr[:, :w]
    g[140:258, x0:x0 + w] = fr[24:142, :w]
g[400:512, 0:112] = fr[30:142, 0:112]   # bottom-left corner (was flat paint)
# forest: rows 0-150 from the test pines, then a wavy edge down to about 230
g[0:135, 0:390] = pines[0:135, 0:390]   # stops above the test tile's lamp
xx = np.arange(390); edge = (195 + 30 * np.sin(xx / 31.0) + 15 * np.sin(xx / 11.0 + 2)).astype(int)
for x in range(390):
    e = edge[x]; g[135:e, x] = pines[15:15 + e - 135, x]
# woodcutter's plot west of the gate road
EARTH = np.median(t1[300:330, 120:180].reshape(-1, 3), axis=0)
g[215:290, 300:385] = np.clip(EARTH + rng.integers(-9, 10, (75, 85, 1)), 0, 255)
Image.fromarray(g.astype(np.uint8)).save(B / "in_t0c.png")
# a few pine clumps in the fringe (M5: scattered trees), cloned from the bottom-left pines
g = np.asarray(Image.open(B / "in_t0c.png").convert("RGB")).astype(int).copy()
src = np.asarray(Image.open(B / "in_t0.png").convert("RGB")).astype(int)[452:512, 112:162]
bg = np.median(np.r_[src[0], src[-1], src[:, 0], src[:, -1]], axis=0)
tree = np.abs(src - bg).sum(2) > 45      # the tree pixels only, not the grass behind them
for x, y in [(30, 270), (190, 300), (95, 340), (250, 215)]:
    reg = g[y:y + 60, x:x + 50]; reg[tree] = src[tree]
Image.fromarray(g.astype(np.uint8)).save(B / "in_t0c.png")
