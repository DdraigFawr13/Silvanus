# Seam scan: straight steps 128 px or longer (mean grey step across 3 rows above 9 levels, and the
# boundary's own difference 2.2x its neighbours'), horizontal and vertical. Usage: seamscan.py a.png [b.png]
import sys
import numpy as np
from PIL import Image
def scan(arr):
    d = np.abs(arr[1:] - arr[:-1]); out = []
    for y in range(2, d.shape[0] - 2):
        for x0 in range(0, arr.shape[1] - 64, 32):
            v = d[y, x0:x0 + 64].mean(); ref = (d[y - 2, x0:x0 + 64].mean() + d[y + 2, x0:x0 + 64].mean()) / 2
            step = abs(arr[y - 2:y + 1, x0:x0 + 64].mean() - arr[y + 1:y + 4, x0:x0 + 64].mean())
            if step > 9 and v > 2.2 * max(ref, 1): out.append((y + 1, x0))
    out.sort(); g = []
    for y, x in out:
        if g and g[-1][0] == y and x <= g[-1][2] + 32: g[-1][2] = x + 64
        else: g.append([y, x, x + 64])
    return [e for e in g if e[2] - e[1] >= 128]
for p in sys.argv[1:]:
    a = np.asarray(Image.open(p).convert("RGB")).astype(float).mean(2)
    h, v = scan(a), scan(a.T)
    print(p, "horizontal", len(h), "vertical", len(v), "total length", sum(e[2] - e[1] for e in h + v), "px")
