# Round 2's measures, reproduced: brightness = mean of R, G, B over all pixels (0-255);
# edge share = share of right and down neighbour pairs whose grey value (mean of R, G, B) differs by more than 12.
# Saturation = mean HSV saturation. Usage: python3 measure.py a.png b.png ...
import sys
from PIL import Image
import numpy as np
for p in sys.argv[1:]:
    im = Image.open(p).convert("RGB")
    a = np.asarray(im).astype(float)
    g = a.mean(axis=2)
    dx = np.abs(g[:, 1:] - g[:, :-1]) > 12
    dy = np.abs(g[1:] - g[:-1]) > 12
    e = (dx.sum() + dy.sum()) / (dx.size + dy.size)
    s = np.asarray(im.convert("HSV"))[..., 1].mean() / 255
    print(f"{p}: brightness {a.mean():.0f} saturation {s:.2f} edge {e:.3f}")
