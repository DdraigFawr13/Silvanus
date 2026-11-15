"""The wide town map (D-047 as amended 2026-11-15): 60 x 30 tiles (960 x 480 px), scrolls left and right and opens on
the Hall. The Skarthorn forest runs along the north with the north road entering it through a lantern gate; the
mountain and the mine sit in the upper right, and the stream falls from the mountain beside the mine and runs down the
east side as a widening river. The High Street runs across the town; the cross street runs south and leaves the map
through an open south edge. Ground is the PixelLab grass-to-dirt Wang tileset (pixellab_town.wang_ground).
Writes gpt/town_wide_<state>@1x.png, 2x copies, and _town_wide_phone.png (the opening view on a 412 px phone)."""
import os, sys, random
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"
sys.argv = sys.argv[:1]
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import gpt_scene_b as sb
from gpt_town import piece, dark, water
from pixellab_town import wang_ground

B = ROOT + "gpt/"
W, H = 960, 480
CX, HY = 480, 300           # town spine and High Street
FOREST = 104                # the Skarthorn's edge along the north
MTN_X = 700                 # mountain and cliffs from here to the east edge

RIVER = [(902, 92), (908, 150), (892, 220), (912, 290), (924, 370), (936, 480)]


def river_dist(x, y):
    best, wid = 1e9, 0
    for (x0, y0), (x1, y1) in zip(RIVER, RIVER[1:]):
        dx, dy = x1 - x0, y1 - y0
        t = max(0, min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy)))
        d = np.hypot(x - x0 - t * dx, y - y0 - t * dy)
        if d < best:
            best, wid = d, 4 + max(0, (y0 + t * dy) - 100) * 0.03
    return best, wid


def in_town(x, y, grown):
    k = 1.08 if grown else 1.0
    nx, ny = (x - CX) / (400 * k), (y - 290) / (190 * k)
    return nx * nx + ny * ny + 0.05 * np.sin(x / 17.0) * np.cos(y / 13.0) < 1


def south_way(x, y):
    """The open south: no forest on the road out."""
    return abs(x - CX) < 120 and y > 330


def build(state):
    R = random.Random(7)
    grown = state == "grown"
    roads = [
        lambda x, y, j: abs(y - HY) < 8 + j and 30 < x < 900,                               # High Street
        lambda x, y, j: abs(x - CX) < 7 + j and y > HY,                                     # cross street, south out
        lambda x, y, j: abs(x - CX) < 5 + j * 0.4 and 190 < y < 240,                        # Hall walkway
        lambda x, y, j: abs(x - CX) < 4 + j and y < 120,                                    # north road into the Skarthorn
        lambda x, y, j: abs(x - (150 + (y - 170) * 0.25)) < 4 + j and 170 < y < HY,         # lane to the woodcutter
        lambda x, y, j: abs(x - 820) < 4 + j and 112 < y < HY,                              # mine track
        lambda x, y, j: abs(y - 372) < 4 + j and 220 < x < CX or abs(y - 380) < 4 + j and CX < x < 740,  # back lanes
        lambda x, y, j: abs(x - 110) < 4 + j and HY < y < 380,                              # lane to the forager
    ]
    plots = [] if grown else [(380, 278), (590, 278), (270, 345), (660, 345), (230, 278), (720, 278)]
    plot_shapes = [(lambda px, py: (lambda x, y, j: ((x - px) / 15) ** 2 + ((y - py) / 9) ** 2 < 1 + j * 0.03))(px, py)
                   for px, py in plots]
    dirt = sb.mask(W, H, roads + plot_shapes)
    img = wang_ground(W, H, dirt)
    wm = np.zeros((H, W), bool)
    for y in range(80, H):
        for x in range(820, W):
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
    # mountain and cliffs in the upper right, the mine at the top of its track, the waterfall beside it
    img.alpha_composite(piece("mountain", 2), (MTN_X - 20, 30))
    x0 = MTN_X
    while x0 < W:
        img.alpha_composite(piece("mountain", R.choice([3, 4, 5, 6])), (x0, 30)); x0 += 27
    img.alpha_composite(piece("mountain", 0), (760, 22))
    img.alpha_composite(piece("mountain", 1), (820 - 19, 22 + 34 + 2))
    fall = Image.new("RGBA", (W, H)); fd = ImageDraw.Draw(fall)
    for i in range(10):
        fd.line((896 + i, 46, 898 + i, 96), fill=(112, 160, 170, 255) if i % 3 else (190, 214, 216, 255))
    img.alpha_composite(fall)
    # Hall, square, and the lantern gate where the north road enters the Skarthorn
    add(piece("hall", 2 if grown else 0), CX, 194)
    sq = piece("square", 2 if grown else 0)
    img.alpha_composite(sq, (CX - sq.width // 2, 290 - sq.height))
    for x in (CX - 12, CX + 12):
        add(piece("generic", 33), x, 112, False)

    def home(p, x, by, flip=False):
        add(p, x, by)
        if not grown:
            return
        s = -1 if flip else 1
        add(piece("generic", 15), x + s * (p.width // 2 + 14), by + 2, False)
        add(piece("generic", R.choice([8, 9, 10, 13, 14])), x + s * (p.width // 2 + 14), by - 10, False)
        add(piece("generic", 23), x - s * 8, by + 6, False)

    # High Street, both sides of the square
    if grown:
        home(piece("generic", 0), 170, 290, True); home(piece("generic", 3), 230, 290)
        home(piece("generic", 1), 300, 290); home(piece("buildings", 11), 380, 290)
        home(piece("generic", 2), 590, 290); home(piece("generic", 4), 660, 290)
        home(piece("buildings", 17), 730, 290)
    else:
        home(piece("generic", 0), 300, 290, True)
        add(piece("buildings", 9), 660, 290)
    # resource buildings on their own sites (D-043)
    add(piece("buildings", 2 if grown else 0), 150, 168)                                   # woodcutter, forest edge
    add(piece("buildings", 5 if grown else 3), 770, 432)                                   # farm, south-east
    fields = Image.new("RGBA", (W, H)); fd = ImageDraw.Draw(fields)
    for r in range(6 if grown else 3):
        y = 392 + r * 7
        fd.rectangle((660, y, 730, y + 4), fill=(96, 64, 40, 255))
        for x in range(662, 730, 4):
            fd.rectangle((x, y - 2, x + 2, y + 1), fill=(118, 150, 60, 255) if r % 2 else (196, 168, 70, 255))
    img.alpha_composite(fields)
    if grown:
        add(piece("generic", 10), 190, 174, False); add(piece("generic", 6), 112, 176, False)
        add(piece("buildings", 14), 860, 220)                                               # storehouse by the river
        add(piece("buildings", 8), 110, 400); add(piece("generic", 12), 146, 404, False)    # forager, west woods
        home(piece("generic", 5), 300, 362); home(piece("generic", 1), 600, 368)
        home(piece("generic", 3), 380, 362, True)
        for x in (660, 690, 720):
            add(piece("generic", 18), x, 440, False)
        for x, by in [(820, 380), (830, 330), (800, 350)]:
            add(piece("props", 12), x, by)                                                  # orchard
        for x in (200, 320, 640, 760):
            add(piece("props", 18), x, HY - 4, False)
        add(piece("generic", 25), CX + 18, HY + 22, False); add(piece("generic", 26), CX - 30, HY + 24, False)
        add(piece("props", 24), 400, 210, False); add(piece("props", 24), 560, 210, False)
    for x in (CX - 22, CX + 22):
        add(piece("props", 18), x, HY + 18, False)
    add(piece("props", 29), 905, HY + 8, False)                                             # High Street bridge
    add(piece("props", 30), 940, 250, False)                                                # jetty, far bank
    for y in range(130, H, 20):
        d_x = [x for x in range(820, W) if wm[y, x]]
        if d_x and R.random() < 0.6:
            add(piece("props", R.choice([16, 17])), min(d_x) - 6, y, False)
        if d_x and R.random() < 0.6:
            add(piece("props", R.choice([16, 17])), max(d_x) + 6, y, False)
    add(piece("sites", 0), 70, 456, False)                                                  # tar pit, west
    add(piece("sites", 3), 250, 470, False)                                                 # standing stones
    # the Skarthorn along the north and the Tangle round the sides; the mountain and the road out stay clear
    blocked = dirt | wm
    for gy in range(-6, H + 20, 13):
        for gx in range(-10, W + 10, 15):
            x, y = gx + R.randint(-5, 5), gy + R.randint(-4, 4)
            if not (0 <= x < W and 0 <= y < H + 8):
                continue
            north = y < FOREST + 6 * np.sin(x / 23.0)
            if not north and in_town(x, y, grown):
                continue
            if x > MTN_X - 30 and 22 < y < 112 or south_way(x, y):
                continue
            if blocked[max(0, y - 10):min(H, y + 4), max(0, x - 12):x + 12].any():
                continue
            if (30 < x < 110 and 430 < y < 480) or (210 < x < 290 and 446 < y < 490) or (650 < x < 800 and 376 < y < 452):
                continue
            k = R.choices([0, 1, 2, 5, 6, 7, 8, 14, 15], [3, 3, 2, 3, 3, 2, 3, 2, 2])[0]
            add(dark(piece("props", k)), x, y, k < 9)
    sprites.sort(key=lambda s: s[0])
    for _, p, cx, by, sh in sprites:
        sb.put(img, p, cx, by, sh)
    mist = Image.new("RGBA", (W, H)); md = ImageDraw.Draw(mist)
    for _ in range(60):
        x, y = R.randint(0, W), R.randint(0, H)
        if not in_town(x, y, grown) and not south_way(x, y) and not (x > MTN_X and y < 110):
            md.ellipse((x - 26, y - 6, x + 26, y + 6), fill=(200, 206, 210, 52))
    img.alpha_composite(mist.filter(ImageFilter.GaussianBlur(5)))
    return img


if __name__ == "__main__":
    for st in ("day1", "grown"):
        im = build(st)
        im.save(f"{B}town_wide_{st}@1x.png")
        im.resize((W * 2, H * 2), Image.NEAREST).save(f"{B}_town_wide_{st}.png")
        if st == "grown":
            # opening view on a 412 px phone at 1.5x (D-041): 274 map px wide, centred on the Hall
            v = im.crop((CX - 137, 40, CX + 137, H)).resize((274 * 3, 440 * 3), Image.NEAREST)
            v.resize((412 * 2, int(440 * 1.5 * 2)), Image.NEAREST).save(f"{B}_town_wide_phone.png")
        print(st, "ok")
