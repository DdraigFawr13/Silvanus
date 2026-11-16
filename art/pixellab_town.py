"""The town map (gpt_town.py) with PixelLab's grass-to-dirt Wang tileset as the ground, for the first PixelLab test.
Corner-based autotiling: each tile corner sits on the 16 px grid and is dirt when most of the dirt mask around it is
dirt; each tile is then the one whose four corners (NW, NE, SW, SE) match. Writes gpt/town_<state>_pl@1x.png,
2x copies, and _town_compare.png (old left, new right, both states)."""
import os, sys, json
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"
from PIL import Image
import numpy as np
import gpt_scene_b as sb
import gpt_town as gt

TS = ROOT + "pixellab/t1_grass_dirt/"
N = 16


def load_tiles():
    meta = json.load(open(TS + "raw_metadata.json"))
    sheet = Image.open(TS + "raw_sheet.png").convert("RGBA")
    tiles = {}
    for t in meta["tileset_data"]["tiles"]:
        c, b = t["corners"], t["bounding_box"]
        key = tuple(c[k] == "upper" for k in ("NW", "NE", "SW", "SE"))
        tiles[key] = sheet.crop((b["x"], b["y"], b["x"] + b["width"], b["y"] + b["height"]))
    assert len(tiles) == 16, len(tiles)
    # PixelLab's upper/lower labels can come back swapped from the prompt, so read which solid tile is the dirt
    # (redder) from its pixels and key every tile by "corner is dirt".
    red = lambda im: np.asarray(im)[..., 0].mean() - np.asarray(im)[..., 1].mean()
    if red(tiles[(True,) * 4]) < red(tiles[(False,) * 4]):
        tiles = {tuple(not v for v in k): im for k, im in tiles.items()}
    return tiles


TILES = load_tiles()


def wang_ground(W, H, dirt):
    cols, rows = W // N, H // N
    corner = np.zeros((rows + 1, cols + 1), bool)
    for j in range(rows + 1):
        for i in range(cols + 1):
            y0, y1 = max(0, j * N - N // 2), min(H, j * N + N // 2)
            x0, x1 = max(0, i * N - N // 2), min(W, i * N + N // 2)
            corner[j, i] = dirt[y0:y1, x0:x1].mean() > 0.18
    out = Image.new("RGBA", (W, H))
    for j in range(rows):
        for i in range(cols):
            key = (corner[j, i], corner[j, i + 1], corner[j + 1, i], corner[j + 1, i + 1])
            out.paste(TILES[key], (i * N, j * N))
    return out


if __name__ == "__main__":
    B = gt.B
    old_ground = sb.ground
    pairs = []
    for st in ("day1", "grown"):
        sb.ground = old_ground
        old = gt.build(st)
        sb.ground = lambda W, H, m: wang_ground(W, H, m)
        new = gt.build(st)
        new.save(f"{B}town_{st}_pl@1x.png")
        new.resize((gt.W * 2, gt.H * 2), Image.NEAREST).save(f"{B}_town_{st}_pl.png")
        pairs.append((old, new))
        print(st, "ok")
    W, H, g = gt.W, gt.H, 8
    cmp = Image.new("RGBA", (W * 2 + g, H * 2 + g), (20, 18, 24, 255))
    for r, (old, new) in enumerate(pairs):
        cmp.paste(old, (0, r * (H + g))); cmp.paste(new, (W + g, r * (H + g)))
    cmp.resize((cmp.width * 2, cmp.height * 2), Image.NEAREST).save(f"{B}_town_compare_pl.png")
    sheet = Image.open(TS + "raw_sheet.png")
    sheet.resize((sheet.width * 6, sheet.height * 6), Image.NEAREST).save(TS + "_sheet_6x.png")
