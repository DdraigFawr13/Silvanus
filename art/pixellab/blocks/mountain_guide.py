# Guide for the redone top-right ground tile (map x 896-1408, y 0-512), after Morgan on stage A:
# "The mine cliffs still look a bit weird and the river cutting through the mountain doesn't look
# great I think it should be farther right". Claude's hand edit, an init image only:
# - left 116 px: the test's restyled empty ground (so the tile starts like its neighbour);
# - mountain: round 1's candidate A rock (its stepped cliffs and tunnel), 2x nearest neighbour,
#   rock pixels only, at map (1030, 0);
# - river: painted down the far right edge, curving left toward the bridge lower down;
# - grass elsewhere, and the cart track repainted from the town up to A's tunnel.
import pathlib
import numpy as np
from PIL import Image, ImageDraw
R = pathlib.Path(__file__).resolve().parents[3]
X0 = 896; W = H = 512
rng = np.random.default_rng(303)
cur = np.asarray(Image.open(R / "art/pixellab/blocks/raw_ground2b.png").convert("RGB")).astype(int)
t1 = np.asarray(Image.open(R / "art/pixellab/blocks/raw_ground.png").convert("RGB")).astype(int)
gr = cur[300:500, 150:300].reshape(-1, 3); GRASS = np.median(gr[gr[:, 1] > gr[:, 0]], axis=0)
wa = cur[100:400, 420:470].reshape(-1, 3); WATER = np.median(wa[wa[:, 2] > wa[:, 1]], axis=0)
EARTH = np.median(t1[300:330, 120:180].reshape(-1, 3), axis=0)
g = np.clip(GRASS + rng.integers(-10, 11, (H, W, 1)), 0, 255)
g[:, :116] = t1[:, 396:512]
# mountain from candidate A
a = np.asarray(Image.open(R / "art/pixellab/target1/raw_a.png").convert("RGB")).astype(int)[0:140, 440:588]
a2 = a.repeat(2, 0).repeat(2, 1)                                  # 280 x 296
r_, g_, b_ = a2[..., 0], a2[..., 1], a2[..., 2]
rock = (np.abs(r_ - g_) < 18) & (b_ - g_ < 22) & (a2.max(2) < 150) | (a2.max(2) < 40)
yy, xx = np.mgrid[0:280, 0:296]
rock &= ~((xx < 60) & (yy > 120))                                 # drop A's river, bottom left
rock &= ~(r_ > b_ + 12)                                          # drop A's bridge planks and cart (brown)
ox = 1030 - X0
sub = g[0:280, ox:ox + 296]; sub[rock] = a2[rock]
# river down the far right
ys = np.arange(H); pts = np.array([(0, 1372), (200, 1368), (330, 1350), (450, 1310), (512, 1290)], float)
cx = np.interp(ys, pts[:, 0], pts[:, 1]) - X0; half = np.interp(ys, [0, 512], [38, 45])
X = np.arange(W)[None, :]
river = np.abs(X - cx[:, None]) <= half[:, None]
g[river] = np.clip(WATER + rng.integers(-6, 7, (H, W, 1)), 0, 255)[river]
# track from the town (map ~1012, 330) up to A's tunnel mouth (about map 1217, 214)
im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im)
d.line([(1012 - X0, 335), (1080 - X0, 300), (1150 - X0, 262), (1205 - X0, 226)], fill=tuple(int(v) for v in EARTH), width=16)
im.save(R / "art/pixellab/blocks/mountain_guide.png")
