from PIL import Image
import numpy as np
for p in __import__("sys").argv[1:]:
    a = np.asarray(Image.open(p).convert("RGB")).astype(int)
    d = (np.abs(np.diff(a, axis=1)).sum(2) > 40).astype(float)
    prof = d.sum(0)
    best = []
    for P in range(4, 12):
        for off in range(P):
            s = prof[off::P].sum() / prof.sum() * P
            best.append((round(s, 2), P, off))
    best.sort(reverse=True); print(p, a.shape, best[:4])
