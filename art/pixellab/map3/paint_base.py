# Rough base for the 1408 x 888 guide (Claude's hand edit, only an init image for pixflux):
# C at 2x with 116 px margins; the river moved to run down the east side past the mine
# (D-047: mine on the town's side, no bridge to it), grey cliffs beyond the river at the top
# right (the mountain runs off the right edge), a swamp east of the river lower down.
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
W, H, PAD = 1408, 888, 116
c = np.asarray(Image.open(R / "art/pixellab/target2/c_x2.png").convert("RGB"))
mine = np.asarray(Image.open(R / "art/pixellab/target2/raw_mine.png").convert("RGB"))
G = np.zeros((H, W, 3), np.uint8)
G[:, PAD:PAD + 1176] = c
G[:, :PAD] = G[:, PAD:2 * PAD][:, ::-1]
rng = np.random.default_rng(303)
def med(a): return np.median(a.reshape(-1, 3), axis=0)
def fill(colour, mask, amp=10):
    n = rng.integers(-amp, amp + 1, (H, W, 1))
    G[mask] = np.clip(colour + n, 0, 255)[mask].astype(np.uint8)
m2 = mine.reshape(-1, 3).astype(int); GRASS = np.median(m2[(m2[:, 1] > m2[:, 0] + 12) & (m2[:, 1] > m2[:, 2] + 12)], axis=0)
WATER = med(c[700:748, 1050:1098])  # GRASS: green pixels of the mine tile
ROCK = med(c[60:140, 1100:1170]); MUD = (GRASS * 0.6 + WATER * 0.4)
yy, xx = np.mgrid[0:H, 0:W]
# river centre line (map px) and half width
pts = np.array([(0, 1262), (150, 1330), (300, 1345), (420, 1330), (520, 1270), (620, 1215), (888, 1220)], float)
cx = np.interp(yy, pts[:, 0], pts[:, 1]); half = np.interp(yy, [0, 888], [40, 55])
east = xx > cx + half
river = np.abs(xx - cx) <= half
region = ((yy >= 380) & (xx >= 1100)) | (xx >= PAD + 1176)   # only below the mine tile and in the right margin
fill(GRASS, region & ~river & ~east)
fill(WATER, region & river, 6)
fill(ROCK, region & east & (yy < 430), 14)
# swamp: murky ground with low-frequency pools
lo = np.asarray(Image.fromarray(rng.integers(0, 255, (H // 24 + 1, W // 24 + 1), dtype=np.uint8)).resize((W + 24, H + 24), Image.BICUBIC))[:H, :W]
sw = region & east & (yy >= 430)
fill(MUD, sw & (lo < 140), 12); fill(WATER * 0.8, sw & (lo >= 140), 6)
# C's stone bridge to the swamp (D-047 keeps a bridge) still spans the moved river at map y 570..680: put it back
G[570:680, PAD + 1000:PAD + 1150] = c[570:680, 1000:1150]
Image.fromarray(G).save(R / "art/pixellab/map3/base_paint.png")
