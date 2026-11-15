"""Test scene 3: the mine's mountain with cliff runs either side, the mine entrance in its gap, a track to it."""
import os
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"  # the art/ folder
import random
from PIL import Image
import numpy as np
import gpt_scene_b as sb

M = ROOT + "gpt/mountain/"
R = random.Random(4)
Q = lambda k: Image.open(f"{M}piece{k:02d}.png").convert("RGBA")

def scene():
    W, H = 480, 224
    mx0, base = 168, 150
    img = sb.ground(W, H, sb.mask(W, H, [
        lambda x, y, j: abs(x - (mx0 + 74) - (y - base) * 0.3) < 6 + j and y > base - 6,
        lambda x, y, j: abs(y - 205) < 8 + j]))
    gd = [sb.decor(sb.T[k], sb.T["00"]) for k in ("01", "02", "03")]
    for _ in range(30):
        img.alpha_composite(R.choice(gd), (R.randint(0, W - 16), R.randint(0, H - 16)))
    # left run ends in a right end tucked under the mountain; right run starts with a left end
    x = mx0 + 20 - Q(7).width
    img.alpha_composite(Q(7), (x, base - 8 - 67))
    while x > 0:
        p = Q(R.choice([3, 4, 5, 6])); x -= p.width; img.alpha_composite(p, (x, base - 8 - 67))
    x = mx0 + 124
    img.alpha_composite(Q(2), (x, base - 8 - 67)); x += Q(2).width
    while x < W:
        p = Q(R.choice([3, 4, 5, 6])); img.alpha_composite(p, (x, base - 8 - 67)); x += p.width
    mt = Q(0); img.alpha_composite(mt, (mx0, base - mt.height))
    ent = Q(1); img.alpha_composite(ent, (mx0 + 74 - ent.width // 2, base - ent.height + 2))
    for k, cx, by in [(5, 20, 214), (0, 60, 190), (16, 140, 170), (19, 330, 168), (11, 400, 180), (6, 450, 214), (9, 300, 192)]:
        sb.put(img, sb.P("props", k), cx, by, sh=k < 9)
    return img

if __name__ == "__main__":
    im = scene(); im.save("gpt/scene_c@1x.png")
    im.resize((im.width * 3, im.height * 3), Image.NEAREST).save("gpt/_scene_c.png"); print("ok")
