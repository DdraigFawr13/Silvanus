"""Test scene 2 for the D-046 style: retried ground (seamless fills, grass edge drawn from a mask in the sheet's own
colours), the stage-2 square, the anchor Hall, the six Sheet 4 buildings, props. Also contact sheets."""
import os
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"  # the art/ folder
import random
from PIL import Image, ImageDraw
import numpy as np
from gpt_ground2 import T, grassy

B = ROOT + "gpt/"
R = random.Random(11)
GR, DI = [T[k] for k in ("00",)], [T[k] for k in ("10",)]

def fill(tile, W, H):
    out = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(0, H, 16):
        for x in range(0, W, 16):
            t = np.rot90(tile, R.choice([0, 2])) if R.random() < 0.0 else tile
            out[y:y + 16, x:x + 16] = t[:min(16, H - y), :min(16, W - x)]
    return out

def decor(tile, base, thresh=60):
    t = tile.astype(int); o = np.zeros((16, 16, 4), dtype=np.uint8)
    d = np.abs(t - base.astype(int)).sum(2) > thresh
    o[d, :3] = tile[d]; o[d, 3] = 255
    return Image.fromarray(o, "RGBA")

# edge colours sampled from the sheet's own transition tile
e = T["20"].astype(int); gm = grassy(T["20"])
edge_g = [e[y, x] for y in range(16) for x in range(16) if gm[y, x] and (y + 1 < 16 and not gm[y + 1, x])]
TIP = np.array(sorted(edge_g, key=lambda c: -c.sum())[0])
dirt_px = [e[y, x] for y in range(16) for x in range(16) if not gm[y, x] and y > 0 and gm[y - 1, x]]
SHADE = np.array(sorted(dirt_px, key=lambda c: c.sum())[0])

def ground(W, H, dirt_mask):
    g, d = fill(T["00"], W, H), fill(T["10"], W, H)
    m = dirt_mask
    out = np.where(m[..., None], d, g).copy()
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if not m[y, x] and (m[y + 1, x] or m[y, x + 1] or m[y, x - 1]):
                out[y, x] = TIP                                         # lit grass lip
            elif m[y, x] and (not m[y - 1, x]):
                out[y, x] = SHADE                                       # grass overhang shadow on the dirt
            elif m[y, x] and (not m[y - 2, x] or not m[y, x - 1]) and (x + y) % 2:
                out[y, x] = (out[y, x].astype(int) * 0.85).astype(np.uint8)
    return Image.fromarray(out).convert("RGBA")

def jag(x, y):  # sawtooth grass tips like the sheet, plus a slow wobble
    return ((x * 7 + y * 3) % 5 - 2) * 0.6 + np.sin(x / 9.0 + y / 13.0) * 1.2

def mask(W, H, shapes):
    m = np.zeros((H, W), bool)
    for y in range(H):
        for x in range(W):
            j = jag(x, y)
            for s in shapes:
                if s(x, y, j):
                    m[y, x] = True; break
    return m

P = lambda d, k: Image.open(f"{B}{d}/piece{k:02d}.png").convert("RGBA")

def shadow(img, cx, by, w):
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((cx - w // 2, by - 4, cx + w // 2, by + 3), fill=(14, 12, 18, 70))
    img.alpha_composite(sh)

def put(img, p, cx, by, sh=True):
    if sh:
        shadow(img, cx, by - 1, int(p.width * 0.9))
    img.alpha_composite(p, (int(cx - p.width // 2), int(by - p.height)))

def scene():
    W, H = 480, 336
    shapes = [
        lambda x, y, j: abs(y - 290) < 9 + j,                                   # High Street
        lambda x, y, j: abs(x - 240) < 7 + j and 200 < y < 290,                 # cross street up to the square
        lambda x, y, j: abs(x - 240) < 5 + j * 0.5 and 96 < y < 160,           # walk from the Hall
        lambda x, y, j: abs(x - 96 - (y - 290) * 0.25) < 5 + j and y < 290 and y > 160,   # lane to the woodcutter
        lambda x, y, j: abs(x - 390 + (y - 290) * 0.2) < 5 + j and y < 290 and y > 170,   # lane to the forager
    ]
    img = ground(W, H, mask(W, H, shapes))
    gbase, dbase = T["00"], T["10"]
    GD = [decor(T[k], gbase) for k in ("01", "02", "03")]; DD = [decor(T[k], dbase) for k in ("12", "13")]
    for _ in range(70):
        x, y = R.randint(0, W - 16), R.randint(0, H - 16)
        img.alpha_composite(R.choice(GD), (x, y))
    for x in range(10, W - 20, 45):
        img.alpha_composite(R.choice(DD), (x + R.randint(0, 20), 282))
    sq = P("square", 1); put(img, sq, 240, 226, sh=False)
    put(img, P("A", 8), 240, 100)                                               # the Hall
    for d, k, cx, by in [("buildings", 1, 96, 168), ("buildings", 3, 160, 250), ("buildings", 10, 330, 250),
                         ("buildings", 8, 400, 176), ("buildings", 12, 120, 330), ("buildings", 17, 360, 334)]:
        put(img, P(d, k), cx, by)
    for k, cx, by in [(5, 16, 60), (6, 40, 40), (0, 30, 120), (7, 460, 70), (1, 450, 130), (5, 470, 230),
                      (2, 18, 230), (11, 200, 104), (13, 284, 102), (11, 470, 300), (18, 220, 290), (18, 268, 290),
                      (25, 432, 250), (26, 178, 330), (24, 60, 270), (24, 420, 272)]:
        put(img, P("props", k), cx, by, sh=k < 9)
    put(img, P("sites", 3), 150, 100, sh=False)   # standing stones
    put(img, P("sites", 0), 360, 110, sh=False)   # tar pit
    return img

def contact(d, n, cols, scale=3, pad=6):
    ps = [Image.open(f"{B}{d}/piece{k:02d}.png") for k in range(n)]
    cw, ch = max(p.width for p in ps) + pad, max(p.height for p in ps) + pad
    rows = (n + cols - 1) // cols
    s = Image.new("RGBA", (cols * cw, rows * ch), (31, 46, 44, 255))
    for k, p in enumerate(ps):
        s.alpha_composite(p, ((k % cols) * cw + (cw - p.width) // 2, (k // cols) * ch + ch - p.height - pad // 2))
    return s.resize((s.width * scale, s.height * scale), Image.NEAREST)

if __name__ == "__main__":
    im = scene(); im.save(B + "scene_b@1x.png")
    im.resize((im.width * 3, im.height * 3), Image.NEAREST).save(B + "_scene_b.png")
    contact("buildings", 18, 3).save(B + "_buildings.png")
    contact("square", 3, 3, 2).save(B + "_square.png")
    print("ok")
