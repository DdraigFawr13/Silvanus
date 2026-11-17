# Empty-ground guide for the building-block test (Claude's hand edit): the Hall-area tile of the
# stage 1 guide (map x 500-1012, y 0-512) with its three buildings removed. Pines are cloned over
# their upper parts; bare earth plots are painted where they stood (D-047 day one: open lots).
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
g = np.asarray(Image.open(R / "art/pixellab/map3/in_T1.png").convert("RGB")).astype(int).copy()
rng = np.random.default_rng(303)
EARTH = np.median(g[300:330, 120:180].reshape(-1, 3), axis=0)   # the dirt road below the cottage
def earth(x0, y0, x1, y1):
    n = rng.integers(-9, 10, (y1 - y0, x1 - x0, 1))
    g[y0:y1, x0:x1] = np.clip(EARTH + n, 0, 255)
def clone(x0, y0, x1, y1, dx, dy):
    g[y0:y1, x0:x1] = g[y0 + dy:y1 + dy, x0 + dx:x1 + dx].copy()
clone(288, 60, 504, 190, -216, -60)   # Hall: pines behind
earth(286, 190, 512, 284)             # Hall plot (wall edges included)
clone(376, 0, 424, 60, -216, 0)       # spire tip and its smoke
clone(142, 148, 258, 200, 0, -60)     # mossy cottage: pines behind
earth(146, 200, 256, 290)             # its plot
earth(188, 398, 278, 512)             # bottom cottage plot
Image.fromarray(g.astype(np.uint8)).save(R / "art/pixellab/blocks/empty_guide.png")
