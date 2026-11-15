"""Villagers (D-046): 8 people x 4 walk frames cleaned at pixel 8 (gpt_clean_grid), each frame re-anchored
bottom-centre on a common canvas so the walk doesn't jitter; a strip, a walk GIF and a street test."""
import os
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"  # the art/ folder
import sys
from PIL import Image
import numpy as np
sys.argv = ["x"]
import gpt_scene_b as sb

V = ROOT + "gpt/villagers/"
fr = [[Image.open(f"{V}piece{r * 4 + c:02d}.png").convert("RGBA") for c in range(4)] for r in range(8)]
CW = max(p.width for row in fr for p in row); CH = max(p.height for row in fr for p in row)

def framed(p):  # bottom-centre on a CW x CH canvas
    c = Image.new("RGBA", (CW, CH)); c.alpha_composite(p, ((CW - p.width) // 2, CH - p.height)); return c

frames = [[framed(p) for p in row] for row in fr]
for r, row in enumerate(frames):
    strip = Image.new("RGBA", (CW * 4, CH))
    for c, f in enumerate(row):
        strip.alpha_composite(f, (c * CW, 0))
    strip.save(f"{V}walk{r}.png")
print("frame", CW, CH)

def street(t):
    img = sb.scene().crop((40, 170, 440, 336))
    xs = [30, 80, 125, 170, 215, 255, 300, 345]
    for r, x in enumerate(xs):
        f = frames[r][(t + r) % 4]
        sb.shadow(img, x + CW // 2, 127, CW - 4); img.alpha_composite(f, (x, 128 - CH))
    return img

if __name__ == "__main__":
    shots = [street(t).resize((1200, 498), Image.NEAREST) for t in range(4)]
    shots[0].save("gpt/_villagers_street.png")
    shots[0].save("gpt/_villagers.gif", save_all=True, append_images=shots[1:], duration=180, loop=0, disposal=2)
    sheet = Image.new("RGBA", (CW * 4 + 6, CH * 8 + 16), (31, 46, 44, 255))
    for r, row in enumerate(frames):
        for c, f in enumerate(row):
            sheet.alpha_composite(f, (c * CW + 3, r * CH + 8))
    sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST).save("gpt/_villagers.png")
