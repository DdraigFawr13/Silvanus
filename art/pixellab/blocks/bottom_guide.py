# Empty-ground guide for the bottom row (map y 376-888, x 0-1408; Claude's hand edit, init only):
# every cottage becomes an earth plot (buildings are separate assets, P10); the lake mirrored from
# C's stray stream becomes grass; the pine block across the south edge becomes an open fringe of
# grass and scattered trees, keeping the south road leaving the map (M11, D-043); the swamp, the
# bridge, the river and C's garden beds (the farm's fields, M16) stay.
import pathlib
import numpy as np
from PIL import Image, ImageDraw
R = pathlib.Path(__file__).resolve().parents[3]
Y0 = 376
g = np.asarray(Image.open(R / "art/pixellab/map3/guide.png").convert("RGB")).astype(int)[Y0:888].copy()
t1 = np.asarray(Image.open(R / "art/pixellab/blocks/raw_ground.png").convert("RGB")).astype(int)
rng = np.random.default_rng(303)
gr = t1[330:400, 230:300].reshape(-1, 3); GRASS = np.median(gr[gr[:, 1] > gr[:, 0]], axis=0)
EARTH = np.median(g[600 - Y0:620 - Y0, 640:690].reshape(-1, 3), axis=0)   # the High Street's brown
PINE = np.median(g[400:500, 450:800].reshape(-1, 3), axis=0)     # the south pine block's colour
H, W = g.shape[:2]
def fill(c, x0, y0, x1, y1, amp=10):
    y0 -= Y0; y1 -= Y0
    g[y0:y1, x0:x1] = np.clip(c + rng.integers(-amp, amp + 1, (y1 - y0, x1 - x0, 1)), 0, 255)
# cottages -> plots (map coordinates, roof included; the building asset covers the plot)
for box in [(0, 476, 62, 571), (170, 476, 242, 571), (30, 631, 202, 731),
            (300, 446, 387, 571), (390, 451, 502, 571), (430, 391, 502, 456), (510, 446, 597, 571),
            (255, 636, 357, 761), (390, 636, 502, 761), (555, 626, 632, 761),
            (690, 396, 777, 571), (730, 591, 847, 706), (940, 596, 1010, 696), (240, 456, 300, 571)]:
    x0, y0, x1, y1 = box
    fill(GRASS, x0, y0, x1, y1)                                   # the house goes
    py0 = y0 + (y1 - y0) * 45 // 100                              # its plot: the lower part, inset
    fill(EARTH, x0 + 5, py0, x1 - 5, y1 - 4, amp=9)
fill(GRASS, 0, 376, 235, 430)                                     # the mirrored lake
# south edge: open fringe, the south road kept (x 860-940)
for x0, x1 in [(0, 860)]:                                        # C's garden beds at x 940-1100 stay (the farm's fields)
    fill(GRASS, x0, 762, x1, 888)
im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im)
for _ in range(22):
    x = int(rng.integers(5, 1095)); y = int(rng.integers(770, 880)) - Y0; r = int(rng.integers(7, 16))
    if 850 < x < 950 or x > 860: continue
    d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(v) for v in PINE))
im.save(R / "art/pixellab/blocks/bottom_guide.png")
# rows 376-512 come from the finished top band, so the bottom row starts out continuing it
top = np.asarray(Image.open(R / "art/pixellab/blocks/stage_b_ground_final.png").convert("RGB")).astype(int)
g = np.asarray(Image.open(R / "art/pixellab/blocks/bottom_guide.png").convert("RGB")).astype(int).copy()
g[0:136] = top[376:512]
Image.fromarray(g.astype(np.uint8)).save(R / "art/pixellab/blocks/bottom_guide.png")
