"""The town map (D-047), 30 x 30 tiles, built from the cleaned ChatGPT pieces on the plan both layout concepts share.
Two states from one plan: 'day1' (open: Hall tier 1, square stage 1, a few buildings, plots glowing, Tangle close)
and 'grown' (every lot built and upgraded, each house with its garden, the Tangle cut back)."""
import os
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"  # the art/ folder
import sys, random
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
sys.argv = sys.argv[:1]
import gpt_scene_b as sb

B = ROOT + "gpt/"
W = H = 480
CX = 240            # town spine: Hall, walkway, square, cross street
HY = 300            # High Street


def piece(d, k):
    return Image.open(f"{B}{d}/piece{k:02d}.png").convert("RGBA")


def dark(p, f=0.66):
    """Trees deep in the Tangle: darker and cooler, so the ring reads as old, dim forest."""
    a = np.asarray(p).astype(float)
    a[..., 0] *= f * 0.92; a[..., 1] *= f; a[..., 2] *= f * 1.05
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")


# the stream: polyline from the waterfall east under the cliffs, then south as a widening river
RIVER = [(30, 86), (110, 92), (200, 88), (300, 94), (390, 90), (418, 110), (424, 170), (414, 240), (426, 300),
         (440, 370), (448, 430), (452, 480)]


def river_dist(x, y):
    best, wid = 1e9, 0
    for (x0, y0), (x1, y1) in zip(RIVER, RIVER[1:]):
        dx, dy = x1 - x0, y1 - y0
        t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)))
        d = np.hypot(x - x0 - t * dx, y - y0 - t * dy)
        if d < best:
            best, wid = d, 5 + max(0, (y0 + t * dy) - 100) * 0.035
    return best, wid


def in_town(x, y, grown):
    k = 1.1 if grown else 1.0
    nx, ny = (x - 236) / (205 * k), (y - 262) / (190 * k)
    return nx * nx + ny * ny + 0.06 * np.sin(x / 17.0) * np.cos(y / 13.0) < 1 or y < 100


def water(W, H, R):
    """Smooth water in the sheet's colours: three close shades, soft noise, short light ripples."""
    base = np.array([58, 104, 120]); out = np.zeros((H, W, 3), dtype=np.uint8)
    n = np.asarray(Image.effect_noise((W, H), 40).filter(ImageFilter.GaussianBlur(1.2))).astype(float) / 255
    for y in range(H):
        for x in range(W):
            out[y, x] = np.clip(base + (n[y, x] - 0.5) * 30, 0, 255)
    for _ in range(W * H // 60):
        x, y = R.randrange(W - 4), R.randrange(H)
        out[y, x:x + R.randint(2, 4)] = (112, 160, 170)
    return out


def build(state):
    R = random.Random(7)
    grown = state == "grown"
    roads = [
        lambda x, y, j: abs(y - HY) < 8 + j,                                                # High Street
        lambda x, y, j: abs(x - CX) < 7 + j and y > HY,                                     # cross street, south out
        lambda x, y, j: abs(x - CX) < 5 + j * 0.4 and 190 < y < 240,                        # Hall walkway
        lambda x, y, j: abs(x - (64 + (y - 160) * 0.3)) < 4 + j and 160 < y < HY,           # lane to the woodcutter
        lambda x, y, j: abs(x - 150) < 4 + j and 104 < y < HY or abs(y - 104) < 4 + j and 150 < x < 244,  # mine track
        lambda x, y, j: abs(x - 244) < 4 + j and 80 < y < 106,
        lambda x, y, j: abs(x - 380) < 4 + j and 180 < y < HY,                              # lane to the storehouse
        lambda x, y, j: abs(y - 372) < 4 + j and 60 < x < CX or abs(y - 380) < 4 + j and CX < x < 400,   # back lanes
    ]
    plots = [] if grown else [(110, 278), (300, 278), (180, 345), (310, 345), (64, 360), (380, 170)]
    plot_shapes = [(lambda px, py: (lambda x, y, j: ((x - px) / 15) ** 2 + ((y - py) / 9) ** 2 < 1 + j * 0.03))(px, py)
                   for px, py in plots]
    dirt = sb.mask(W, H, roads + plot_shapes)
    img = sb.ground(W, H, dirt)
    wm = np.zeros((H, W), bool)
    for y in range(70, H):
        for x in range(0, W):
            d, w = river_dist(x, y)
            if d < w + sb.jag(x, y) * 0.35:
                wm[y, x] = True
    a = np.asarray(img).copy(); wt = water(W, H, R)
    a[wm, :3] = wt[wm]
    edge = wm & ~(np.roll(wm, 1, 0) & np.roll(wm, -1, 0) & np.roll(wm, 1, 1) & np.roll(wm, -1, 1))
    a[edge, :3] = (a[edge, :3] * 0.5).astype(np.uint8)
    img = Image.fromarray(a)
    sprites = []

    def add(p, cx, by, sh=True):
        sprites.append((by, p, int(cx), int(by), sh))

    glow = Image.new("RGBA", (W, H)); gd = ImageDraw.Draw(glow)
    for px, py in plots:
        gd.ellipse((px - 18, py - 11, px + 18, py + 11), fill=(236, 240, 214, 80))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(4)))
    for px, py in plots:
        for dx, dy in ((-13, -4), (13, -4), (-13, 6), (13, 6)):
            add(Image.new("RGBA", (2, 5), (92, 66, 44, 255)), px + dx, py + dy, False)
    # cliffs and mountain along the top, the mine in its gap
    x0 = -8
    while x0 < W:
        img.alpha_composite(piece("mountain", R.choice([3, 4, 5, 6])), (x0, 12)); x0 += 27
    mx = CX + 2 - 72
    img.alpha_composite(piece("mountain", 0), (mx, 80 - 75))
    img.alpha_composite(piece("mountain", 1), (mx + 74 - 19, 80 - 41 + 2))
    add(piece("props", 29), 244, 100, False)
    # Hall and square
    add(piece("hall", 2 if grown else 0), CX, 194)
    sq = piece("square", 2 if grown else 0)
    img.alpha_composite(sq, (CX - sq.width // 2, 290 - sq.height))

    def home(p, x, by, flip=False):
        """A building with the clutter it gains as it grows: garden fence, a yard piece, a flower box."""
        add(p, x, by)
        if not grown:
            return
        s = -1 if flip else 1
        add(piece("generic", 15), x + s * (p.width // 2 + 14), by + 2, False)
        add(piece("generic", R.choice([8, 9, 10, 13, 14])), x + s * (p.width // 2 + 14), by - 10, False)
        add(piece("generic", 23), x - s * 8, by + 6, False)

    # north side of the High Street, doors on the street
    if grown:
        home(piece("generic", 0), 60, 290, True); home(piece("generic", 3), 110, 290)
        home(piece("buildings", 11), 330, 290); home(piece("generic", 1), 384, 290)
    else:
        home(piece("generic", 0), 60, 290, True)
        add(piece("buildings", 9), 330, 290)
    # resource buildings at their own sites
    add(piece("buildings", 2 if grown else 0), 52, 160)                                    # woodcutter, west
    if grown:
        add(piece("generic", 10), 92, 166, False); add(piece("generic", 6), 20, 168, False)
        add(piece("buildings", 14), 380, 178)                                               # storehouse, by the river
        add(piece("buildings", 8), 64, 366); add(piece("generic", 12), 100, 372, False)     # forager, west edge
        add(piece("buildings", 17), 180, 360)                                               # tavern on the crossing
        add(piece("generic", 27), 214, 364, False); add(piece("generic", 13), 150, 364, False)
        home(piece("generic", 2), 300, 352); home(piece("generic", 4), 150, 432, True)
        home(piece("generic", 5), 190, 440)
    add(piece("buildings", 5 if grown else 3), 372, 432)                                   # farm, south-east
    fields = Image.new("RGBA", (W, H)); fd = ImageDraw.Draw(fields)
    for r in range(6 if grown else 3):
        y = 392 + r * 7
        fd.rectangle((300, y, 350, y + 4), fill=(96, 64, 40, 255))
        for x in range(302, 350, 4):
            fd.rectangle((x, y - 2, x + 2, y + 1), fill=(118, 150, 60, 255) if r % 2 else (196, 168, 70, 255))
    img.alpha_composite(fields)
    if grown:
        for x in (294, 322, 350):
            add(piece("generic", 18), x, 440, False)
        add(piece("generic", 11), 410, 448, False)
        for x, by in [(400, 400), (412, 352), (396, 330)]:
            add(piece("props", 12), x, by)                                                  # orchard
        for x in (140, 200, 280, 360):
            add(piece("props", 18), x, 296, False)
        add(piece("generic", 25), CX + 18, HY + 22, False); add(piece("generic", 26), CX - 30, HY + 24, False)
        add(piece("props", 24), 150, 210, False); add(piece("props", 24), 330, 210, False)
    for x in (CX - 22, CX + 22):
        add(piece("props", 18), x, HY + 18, False)
    add(piece("props", 30), 450, 232, False)                                                # jetty, far bank
    add(piece("props", 29), 427, HY + 8, False)                                             # High Street bridge
    for y in range(120, H, 20):
        d_x = [x for x in range(380, W) if wm[y, x]]
        if d_x and R.random() < 0.6:
            add(piece("props", R.choice([16, 17])), min(d_x) - 6, y, False)
        if d_x and R.random() < 0.6:
            add(piece("props", R.choice([16, 17])), max(d_x) + 6, y, False)
    add(piece("sites", 0), 70, 452, False)
    add(piece("sites", 3), 284, 494, False)                                                 # standing stones, half off the map
    blocked = dirt | wm
    for gy in range(84, H + 20, 13):
        for gx in range(-10, W + 10, 15):
            x, y = gx + R.randint(-5, 5), gy + R.randint(-4, 4)
            if not (0 <= x < W and 0 <= y < H) or in_town(x, y, grown):
                continue
            if blocked[max(0, y - 10):y + 4, max(0, x - 12):x + 12].any():
                continue
            if (30 < x < 110 and 425 < y < 480) or (246 < x < 326 and 446 < y < 480) or (296 < x < 412 and 376 < y < 452):
                continue
            k = R.choices([0, 1, 2, 5, 6, 7, 8, 14, 15], [3, 3, 2, 3, 3, 2, 3, 2, 2])[0]
            add(dark(piece("props", k)), x, y, k < 9)
    sprites.sort(key=lambda s: s[0])
    for _, p, cx, by, sh in sprites:
        sb.put(img, p, cx, by, sh)
    mist = Image.new("RGBA", (W, H)); md = ImageDraw.Draw(mist)
    for _ in range(36):
        x, y = R.randint(0, W), R.randint(100, H)
        if not in_town(x, y, grown):
            md.ellipse((x - 26, y - 6, x + 26, y + 6), fill=(200, 206, 210, 52))
    img.alpha_composite(mist.filter(ImageFilter.GaussianBlur(5)))
    return img


if __name__ == "__main__":
    for st in ("day1", "grown"):
        im = build(st)
        im.save(f"{B}town_{st}@1x.png")
        im.resize((W * 2, H * 2), Image.NEAREST).save(f"{B}_town_{st}.png")
        print(st, "ok")
