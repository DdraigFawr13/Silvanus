# Places the test buildings on the restyled empty ground with free passes only (no generations):
# the asset's own green ground patch dropped, a soft contact shadow under each building, then a gentle grade that moves each building's mean
# colour a quarter of the way toward the ground around it. Positions put each door on its path.
# Usage: python3 place.py <out_with_buildings.png> [<out_no_fix.png>]
import pathlib, sys
import numpy as np
from PIL import Image, ImageFilter
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
ground = np.asarray(Image.open(B / "raw_ground.png").convert("RGB")).astype(float)
PLACES = [("hall_fixed.png", 289, 74), ("raw_cottage_a.png", 142, 166), ("raw_cottage_b.png", 186, 393)]

def place(g, fix):
    g = g.copy(); H, W = g.shape[:2]
    for name, x0, y0 in PLACES:
        im = Image.open(B / name).convert("RGBA"); a = np.asarray(im).astype(float)
        h, w = a.shape[:2]
        x1, y1 = min(W, x0 + w), min(H, y0 + h); cw, ch = x1 - x0, y1 - y0
        if fix:
            # drop the asset's own ground patch: green pixels in the bottom 18% of its silhouette
            ys = np.where(a[..., 3].max(1) > 0)[0]; top, bot = ys.min(), ys.max()
            r, gg, b = a[..., 0], a[..., 1], a[..., 2]
            green = (gg > r + 6) & (gg >= b) 
            low = np.arange(h)[:, None] > bot - 0.18 * (bot - top)
            a = a.copy(); a[..., 3][green & low] = 0
        rgb, al = a[:ch, :cw, :3], a[:ch, :cw, 3:] / 255
        if fix:
            # contact shadow: the building's silhouette, shifted 4 px right and 3 px down, blurred, 45% dark
            sh = Image.fromarray((a[..., 3]).astype(np.uint8)).transform((w, h), Image.AFFINE, (1, 0, -4, 0, 1, -3)).filter(ImageFilter.GaussianBlur(3))
            s = np.asarray(sh).astype(float)[:ch, :cw, None] / 255 * 0.45
            g[y0:y1, x0:x1] *= (1 - s)
            # grade: move the building's mean colour a quarter of the way to the ground's mean around it
            ring = g[max(0, y0 - 16):min(H, y1 + 16), max(0, x0 - 16):min(W, x1 + 16)].reshape(-1, 3).mean(0)
            mine = (rgb * al).reshape(-1, 3).sum(0) / max(al.sum(), 1)
            rgb = np.clip(rgb + (ring - mine) * 0.25, 0, 255)
        g[y0:y1, x0:x1] = g[y0:y1, x0:x1] * (1 - al) + rgb * al
    return g

if __name__ == "__main__":
    Image.fromarray(place(ground, True).astype(np.uint8)).save(sys.argv[1])
    if len(sys.argv) > 2:
        Image.fromarray(place(ground, False).astype(np.uint8)).save(sys.argv[2])
