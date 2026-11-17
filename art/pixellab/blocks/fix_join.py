# Free fixes after the paid join repair (Claude's script): the 1 px pale line where the two repair
# windows meet (stage y 256, x 460-510) is replaced by the mean of the rows above and below; the
# brightness step at the band's right edge (stage x 510) is ramped out over 100 px, row band by
# row band, scaling the right side toward the left side's mean brightness.
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
g = np.asarray(Image.open(R / "art/pixellab/blocks/stage_a_ground_joined.png").convert("RGB")).astype(float)
for y in (255, 256):
    g[y, 455:515] = (g[y - 2, 455:515] + g[y + 2, 455:515]) / 2
H = g.shape[0]; ramp = np.linspace(1, 0, 100)[None, :, None]
for y0 in range(0, H, 32):
    y1 = min(H, y0 + 32)
    left = g[y0:y1, 488:508].mean(); right = g[y0:y1, 512:532].mean()
    k = np.clip(left / max(right, 1), 0.85, 1.2)
    g[y0:y1, 510:610] *= 1 + (k - 1) * ramp
Image.fromarray(g.clip(0, 255).astype(np.uint8)).save(R / "art/pixellab/blocks/stage_a_ground_final.png")
