# Free fixes after the stage B join repairs (Claude's script): a pale 1 px line where a band's two
# repair windows meet (y 255) is replaced by the mean of the rows two above and two below; then
# the brightness step at each band's right edge is ramped out over 100 px, 32-row bands at a time.
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
g = np.asarray(Image.open(B / "stage_b_ground_j2.png").convert("RGB")).astype(float)
for x0, x1 in [(476, 540), (956, 1016)]:
    for y in (254, 255, 256):
        row = g[y, x0:x1].mean(); ref = (g[y - 3, x0:x1].mean() + g[y + 3, x0:x1].mean()) / 2
        if row > ref + 25:
            g[y, x0:x1] = (g[y - 2, x0:x1] + g[y + 2, x0:x1]) / 2
ramp = np.linspace(1, 0, 100)[None, :, None]
for edge in (536, 1012):
    for y0 in range(0, 512, 32):
        y1 = y0 + 32
        left = g[y0:y1, edge - 22:edge - 2].mean(); right = g[y0:y1, edge + 2:edge + 22].mean()
        k = np.clip(left / max(right, 1), 0.85, 1.2)
        g[y0:y1, edge:edge + 100] *= 1 + (k - 1) * ramp
Image.fromarray(g.clip(0, 255).astype(np.uint8)).save(B / "stage_b_ground_final.png")
