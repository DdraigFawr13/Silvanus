# Free path brush (Claude's script): lays a worn dirt path along a polyline with ragged edges, from a
# texture patch of an existing dirt lane on the same map, so every road reaches somewhere.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
def lay(g, pts, width, tex_box, seed=303):
    H, W = g.shape[:2]
    rng = np.random.default_rng(seed)
    x0, y0, x1, y1 = tex_box
    tex = g[y0:y1, x0:x1].copy()
    th, tw = tex.shape[:2]
    m = Image.new("L", (W, H)); d = ImageDraw.Draw(m)
    d.line(pts, fill=255, width=width, joint="curve")
    for (ax, ay) in pts: d.ellipse((ax - width // 2, ay - width // 2, ax + width // 2, ay + width // 2), fill=255)
    m = np.asarray(m.filter(ImageFilter.GaussianBlur(2.2))).astype(float) / 255
    noise = np.asarray(Image.fromarray(rng.integers(0, 255, (H // 3 + 1, W // 3 + 1), dtype=np.uint8)).resize((W + 3, H + 3), Image.BICUBIC))[:H, :W] / 255
    a = np.clip((m - 0.35 - (noise - 0.5) * 0.5) * 4, 0, 1)            # ragged edge
    yy, xx = np.mgrid[0:H, 0:W]
    fill = tex[(yy + 7) % th, (xx + 3) % tw]
    edge = np.clip(1 - np.abs(a - 0.5) * 2, 0, 1)                         # a darker rim where path meets grass
    out = g * (1 - a[..., None]) + fill * a[..., None]
    out *= (1 - 0.18 * edge[..., None])
    return out
