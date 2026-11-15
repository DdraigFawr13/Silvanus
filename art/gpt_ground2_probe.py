"""Probe the retried ground sheet: find the 4x4 tile boxes, snap each to 16x16, print grass/dirt masks and seam scores."""
from PIL import Image
import numpy as np
a = np.asarray(Image.open(__import__("os").path.dirname(__import__("os").path.abspath(__file__)) + "/gpt/ground2/sheet.png").convert("RGB")).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
mag = (r > 170) & (b > 170) & (g < 110)
def runs(v):
    out, s = [], None
    for i, x in enumerate(v):
        if x and s is None: s = i
        if not x and s is not None: out.append((s, i)); s = None
    if s is not None: out.append((s, len(v)))
    return [o for o in out if o[1] - o[0] > 100]
cols = runs((~mag).mean(0) > 0.5); rows = runs((~mag).mean(1) > 0.5)
print("cols", cols); print("rows", rows)
