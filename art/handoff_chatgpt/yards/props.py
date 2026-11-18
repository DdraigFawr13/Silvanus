# Cleans the chosen PixelLab candidates into placeable props (free, Claude's script, 2026-11-18):
#  - keeps the largest connected opaque part (28 px candidates carry slivers of their neighbours at the edges);
#  - removes grass that touches the outside (flood fill from the transparent border through green-dominant pixels),
#    so the map's own grass shows; leaves enclosed by a fence or an outline stay;
#  - softens the remaining worn-earth patch edge: earth pixels next to transparency get half alpha.
# Usage: python3 props.py   (reads raw/, writes props/)
import pathlib
import numpy as np
from PIL import Image
from collections import deque
def label(m):
    """4-connected labels of a boolean mask (0 = background)."""
    lab = np.zeros(m.shape, int); n = 0; H, W = m.shape
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]: continue
        n += 1; lab[y0, x0] = n; q = deque([(y0, x0)])
        while q:
            y, x = q.popleft()
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; q.append((yy, xx))
    return lab, n
def dilate(m):
    p = np.pad(m, 1); return p[1:-1, 1:-1] | p[2:, 1:-1] | p[:-2, 1:-1] | p[1:-1, 2:] | p[1:-1, :-2]
D = pathlib.Path(__file__).resolve().parent
PICK = {  # prop name: (candidate file, what it is)
    "butt_bench": ("c3_10", "water butt, bench, two potted plants"),
    "butt_bench2": ("c3_24", "water butt, bench, two clay pots"),
    "washing": ("c3_11", "washing line on two posts, grey and cream cloths"),
    "garden": ("c3_07", "vegetable bed in a wattle fence"),
    "chop": ("c3_08", "chopping block with an axe, split logs"),
    "barrow": ("c3_04", "wheelbarrow with a sack and a bucket"),
    "woodshed": ("c2_45", "small open woodshed full of logs"),
    "logs": ("c2_36", "stack of split logs"),
    "fisher_small": ("hut1", "small fisher's hut, net frame, lantern post, barrel (not placed: too small beside the other buildings, Morgan 2026-11-18)"),
}
def fisher_far():
    """The map's own 128 px fisher's hut (art/pixellab/blocks/raw_fisher.png) for the far bank: its own pond (blue pixels in the
    lower part only, so the slate roof stays) and the rock rim below it are cut, so the jetty and boat sit on the map's backwater."""
    a = np.asarray(Image.open(D.parents[2] / "art/pixellab/blocks/raw_fisher.png").convert("RGBA")).copy()
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    a[..., 3][(b > r + 12) & (b >= g - 4) & (yy >= 76)] = 0
    a[..., 3][(yy > 112) | ((yy > 104) & (xx >= 60))] = 0
    return a
def clean(a):
    a = a.copy(); op = a[..., 3] > 0
    lab, n = label(op)
    if n > 1:
        keep = np.argmax(np.bincount(lab.ravel())[1:]) + 1
        a[..., 3][lab != keep] = 0; op = a[..., 3] > 0
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    grass = op & (g > r + 4) & (g >= b)
    lab, n = label(grass | ~op)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); outside = np.isin(lab, border[border > 0])
    a[..., 3][grass & outside] = 0; op = a[..., 3] > 0
    earth = op & (r > g) & (r - b > 12) & (r + g + b < 330)
    edge = op & dilate(~op)
    a[..., 3][edge & earth] = 128
    return a
if __name__ == "__main__":
    for name, (src, _) in PICK.items():
        a = np.asarray(Image.open(D / "raw" / f"{src}.png").convert("RGBA"))
        Image.fromarray(clean(a)).save(D / "props" / f"{name}.png")
    Image.fromarray(fisher_far()).save(D / "props" / "fisher_far.png")
    print("wrote", len(PICK) + 1, "props")
