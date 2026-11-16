# Finishes the whole map: pastes the bottom-row join repairs into the composed ground, applies the
# free fixes (a pale 1 px line where a band's two windows meet; brightness ramps at the bands' right
# edges), then places the buildings with place.py's free passes.
# Usage: python3 full_final.py <grown.png> <ground.png>
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place
g = Image.open(B / "full_ground_v1.png").convert("RGB")
g.paste(Image.open(B / "raw_vL_w2.png").convert("RGB"), (384, 632))
g.paste(Image.open(B / "raw_vR_w2.png").convert("RGB"), (862, 632))
a = np.asarray(g).astype(float)
for x0, x1 in [(476, 540), (956, 1016)]:
    for y in (630, 631, 632, 633):
        if a[y, x0:x1].mean() > (a[y - 3, x0:x1].mean() + a[y + 3, x0:x1].mean()) / 2 + 25:
            a[y, x0:x1] = (a[y - 2, x0:x1] + a[y + 2, x0:x1]) / 2
ramp = np.linspace(1, 0, 100)[None, :, None]
for edge in (536, 1012):
    for y0 in range(376, 888, 32):
        y1 = min(888, y0 + 32)
        k = np.clip(a[y0:y1, edge - 22:edge - 2].mean() / max(a[y0:y1, edge + 2:edge + 22].mean(), 1), 0.85, 1.2)
        a[y0:y1, edge:edge + 100] *= 1 + (k - 1) * ramp
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(sys.argv[2])
place.PLACES = [tuple(p) for p in json.load(open(B / "full_places.json"))]
Image.fromarray(place.place(a, True).clip(0, 255).astype(np.uint8)).save(sys.argv[1])
