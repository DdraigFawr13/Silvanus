"""Retried ground tiles (D-046 sheet 2b): snap each of the 4x4 tiles to 16x16 game pixels by block median, check the
fill tiles wrap without seams, classify grass vs dirt, and derive the inner corners the sheet lacks."""
import os
ROOT = os.path.dirname(os.path.abspath(__file__)) + "/"  # the art/ folder
from PIL import Image
import numpy as np
G = ROOT + "gpt/ground2/"
a = np.asarray(Image.open(G + "sheet.png").convert("RGB")).astype(int)
COLS = [(35, 307), (341, 614), (647, 920), (954, 1226)]
ROWS = [(35, 308), (340, 610), (642, 910), (941, 1211)]

def snap(y0, y1, x0, x1):
    t = np.zeros((16, 16, 3), dtype=np.uint8)
    ys, xs = np.linspace(y0, y1, 17).astype(int), np.linspace(x0, x1, 17).astype(int)
    for j in range(16):
        for i in range(16):
            blk = a[ys[j] + 3:ys[j + 1] - 3, xs[i] + 3:xs[i + 1] - 3].reshape(-1, 3)   # skip block borders
            t[j, i] = np.median(blk, axis=0)
    return t

T = {}
for ri, (y0, y1) in enumerate(ROWS):
    for ci, (x0, x1) in enumerate(COLS):
        T[f"{ri}{ci}"] = snap(y0, y1, x0, x1)
        Image.fromarray(T[f"{ri}{ci}"]).save(f"{G}t{ri}{ci}.png")

def seam(t):  # mean colour jump across the wrap vs inside the tile
    t = t.astype(int)
    inner = (np.abs(np.diff(t, axis=1)).mean() + np.abs(np.diff(t, axis=0)).mean()) / 2
    wrap = (np.abs(t[:, 0] - t[:, -1]).mean() + np.abs(t[0] - t[-1]).mean()) / 2
    return round(inner, 1), round(wrap, 1)

def grassy(t):
    t = t.astype(int); return t[..., 1] > t[..., 0] + 5

if __name__ == "__main__":
    for k in ("00", "01", "02", "03", "10", "11", "12", "13"):
        print(k, "inner/wrap", seam(T[k]))
    for k in ("20", "21", "22", "23", "30", "31", "32", "33"):
        m = grassy(T[k]); print(k); print("\n".join("".join("#" if v else "." for v in row) for row in m))
