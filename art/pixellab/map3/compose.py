# Composes the 1408 x 888 map from pieces laid over a base, joining overlaps along least-difference cuts.
# A piece is (path, x, y, cuts). Each cut is (side, lo, hi) in map pixels: for "left", the old art keeps
# x < lo, the new piece takes x >= hi, and between them the seam follows the least-difference path;
# "top" does the same in y. Overlap with no cut on that side goes to the new piece.
# "clones" (optional) paint over stray features with nearby art (Claude's hand edit of the guide).
# Usage: python3 compose.py <pieces.json> <out.png>   (pieces.json: {"base": path, "pieces": [...]})
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]

def load(p): return np.asarray(Image.open(R / p).convert("RGB")).astype(np.int16)

def seam_mask(a, b):
    """For an overlap with a on the left and b on the right: True where b is taken, cut along
    the top-to-bottom path of least colour difference."""
    e = np.abs(a - b).sum(axis=2).astype(float)
    h, w = e.shape
    cost = e.copy(); back = np.zeros((h, w), int)
    for y in range(1, h):
        prev = cost[y - 1]
        stack = np.vstack([np.r_[np.inf, prev[:-1]], prev, np.r_[prev[1:], np.inf]])
        k = stack.argmin(0)
        cost[y] += stack[k, np.arange(w)]; back[y] = np.arange(w) + k - 1
    m = np.zeros((h, w), bool); x = int(cost[-1].argmin())
    for y in range(h - 1, -1, -1):
        m[y, x:] = True; x = back[y, x]
    return m

def compose(spec):
    G = load(spec["base"]).copy(); H, W = G.shape[:2]
    have = np.zeros((H, W), bool)
    seams = []
    for path, x0, y0, cuts in spec["pieces"]:
        t = load(path); h, w = t.shape[:2]
        reg = G[y0:y0 + h, x0:x0 + w]; hv = have[y0:y0 + h, x0:x0 + w]
        take = np.ones((h, w), bool)
        for side, lo, hi in cuts:
            if side == "left":
                a, b = lo - x0, hi - x0
                take[:, :a] &= ~hv[:, :a]
                m = seam_mask(reg[:, a:b], t[:, a:b])
                take[:, a:b] &= m | ~hv[:, a:b]
            elif side == "top":
                a, b = lo - y0, hi - y0
                take[:a] &= ~hv[:a]
                m = seam_mask(reg[a:b].transpose(1, 0, 2), t[a:b].transpose(1, 0, 2)).T
                take[a:b] &= m | ~hv[a:b]
        reg[take] = t[take]; hv[:] = True
        seams.append(path)
    # clone steps: [x0, y0, x1, y1, dx, dy] copies the art at (x + dx, y + dy) over x0..x1, y0..y1
    for x0, y0, x1, y1, dx, dy in spec.get("clones", []):
        G[y0:y1, x0:x1] = G[y0 + dy:y1 + dy, x0 + dx:x1 + dx].copy()
    return G, have

if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    G, have = compose(spec)
    Image.fromarray(G.clip(0, 255).astype(np.uint8)).save(sys.argv[2])
