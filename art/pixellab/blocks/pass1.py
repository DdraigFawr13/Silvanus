# Improvement pass 1, free part (Claude's script): on the empty ground (full_ground_fx.png)
#  1. (lamps: see pass1_paid.py)
#  2. straight seams at every known repair-window edge softened: colour matched across the edge with a
#     32 px ramp each side, then the line broken by swapping pixels across it within 3 px.
# The new lamp asset is placed later with the buildings (LAMPS, base positions).
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
g = np.asarray(Image.open(B / "full_ground_fx.png").convert("RGB")).astype(float)
H, W = g.shape[:2]
rng = np.random.default_rng(303)
# lantern centre (x, y) and post base y, read at 3x from the ground; halo True where a light circle is painted
LAMPS = [(519, 150, 190, False), (850, 290, 323, False), (950, 489, 529, False), (286, 551, 587, True),
         (22, 636, 666, True), (208, 636, 666, True), (512, 640, 676, True), (860, 615, 653, True)]
yy, xx = np.mgrid[0:H, 0:W]
# (the old lamps and their light discs are repainted by inpainting in pass1_paid.py; two free tries left rings)
# seams: (axis, position, start, end) in map pixels; 'v' = a vertical line at x, 'h' = horizontal at y
SEAMS = [("v", 480, 0, 888), ("v", 536, 0, 888), ("v", 960, 0, 888), ("v", 1012, 0, 888),
         ("v", 1292, 0, 416), ("h", 416, 1152, 1408), ("h", 160, 0, 180), ("h", 150, 180, 395),
         ("h", 406, 0, 395), ("v", 395, 150, 406), ("v", 256, 160, 406), ("h", 135, 0, 128), ("h", 400, 0, 390),
         ("v", 505, 435, 590), ("v", 605, 435, 590), ("h", 435, 505, 605), ("h", 590, 505, 605),
         ("v", 935, 640, 765), ("v", 1025, 640, 765), ("h", 640, 935, 1025), ("h", 765, 935, 1025), ("h", 513, 1000, 1408)]
RAMP = 32
def soften(img, pos, a, b):
    """vertical seam at column pos, rows a..b of img (H x W x 3), in place"""
    ramp = np.linspace(1, 0, RAMP)[None, :, None]
    for s0 in range(a, b, 24):
        s1 = min(b, s0 + 24)
        L = img[s0:s1, max(0, pos - 16):pos].reshape(-1, 3).mean(0)
        Rr = img[s0:s1, pos:min(img.shape[1], pos + 16)].reshape(-1, 3).mean(0)
        d = (Rr - L) / 2
        lw = min(RAMP, pos); rw = min(RAMP, img.shape[1] - pos)
        img[s0:s1, pos - lw:pos] += (d * ramp[:, :lw][:, ::-1])
        img[s0:s1, pos:pos + rw] -= (d * ramp[:, :rw])
    # break the straight line: swap pixels across it at random within 3 px
    for y in range(a, b):
        for k in range(1, 4):
            if pos - k >= 0 and pos + k - 1 < img.shape[1] and rng.random() < 0.5 / k:
                img[y, pos - k], img[y, pos + k - 1] = img[y, pos + k - 1].copy(), img[y, pos - k].copy()
for ax, pos, a, b in SEAMS:
    if ax == "v":
        soften(g, pos, a, b)
    else:
        t = np.ascontiguousarray(g.transpose(1, 0, 2))
        soften(t, pos, a, b)
        g = np.ascontiguousarray(t.transpose(1, 0, 2))
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(B / "ground_p1.png")
print("ok")
