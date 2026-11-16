# Improvement pass 2, free (Claude's script), on pass 1's ground (pass1_ground.png):
#  1. seams left after pass 1: the old road meeting the new at y 512, the top-left corner blocks;
#  2. the river above the bridge: the pale flat band of mist recoloured to the water below the bridge
#     (each water pixel's brightness and colour mapped to the lower river's mean and spread);
#  3. the grey slab beside the river covered with the grass beside it.
import pathlib, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
g = np.asarray(Image.open(B / "pass1_ground.png").convert("RGB")).astype(float)
H, W = g.shape[:2]
# reuse pass 1's seam softener without rerunning pass 1
src = (B / "pass1.py").read_text()
ns = {"np": np, "rng": np.random.default_rng(404)}
exec(src[src.index("RAMP = 32"):src.index("for ax, pos, a, b in SEAMS:")], ns)
soften = ns["soften"]
SEAMS = [("h", 512, 370, 520), ("v", 104, 0, 150), ("h", 150, 100, 210)]
for ax, pos, a, b in SEAMS:
    if ax == "v": soften(g, pos, a, b)
    else:
        t = np.ascontiguousarray(g.transpose(1, 0, 2)); soften(t, pos, a, b); g = np.ascontiguousarray(t.transpose(1, 0, 2))
# 2. river band: water pixels (blue above green) in the band above the bridge
y0, y1, x0, x1 = 300, 575, 1225, 1408
reg = g[y0:y1, x0:x1]
water = (reg[..., 2] > reg[..., 1] + 4) & (reg[..., 2] > reg[..., 0] + 8)
low = g[650:880, 1170:1290]; lw = (low[..., 2] > low[..., 1] + 4) & (low[..., 2] > low[..., 0] + 8)
tm, ts = low[lw].mean(0), low[lw].std(0)
bm, bs = reg[water].mean(0), reg[water].std(0)
new = (reg - bm) * (ts / np.maximum(bs, 1)) + tm
m = Image.fromarray((water * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
a = (np.asarray(m).astype(float) / 255)[..., None]
yy = np.arange(y0, y1)[:, None, None]
a *= np.clip((yy - y0) / 20, 0, 1) * np.clip((y1 - yy) / 20, 0, 1)     # fade in and out at the band's ends
g[y0:y1, x0:x1] = reg * (1 - a) + new * a
print("river: band mean", np.round(bm), "-> lower river mean", np.round(tm))
# 3. the grey slab
sm = Image.new("L", (W, H)); ImageDraw.Draw(sm).polygon([(1196, 396), (1236, 386), (1262, 402), (1258, 448), (1200, 452)], fill=255)
sm = (np.asarray(sm.filter(ImageFilter.GaussianBlur(2))).astype(float) / 255)[..., None]
shifted = np.roll(g, 80, axis=1)                                         # the grass 80 px to the left
g = g * (1 - sm) + shifted * sm
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(B / "ground_p2.png")
print("ok")
