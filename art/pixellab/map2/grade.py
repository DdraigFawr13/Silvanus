"""Colour-match parts of the town map to the village (centre 2), no new pixels drawn.

Usage: python3 grade.py IN.png OUT.png
Only plant colours (green hue: grass, leaves, pines) are changed: in each
region they are moved towards the village's plant colours (mean and spread of
L, a, b in CIELAB, the Reinhard method), at the strength given below. Water,
rock, roofs, paths and lights keep their colours. Region
masks are feathered so the change fades in over FEATHER px and draws no new
edge. Transparent (blank) pixels stay blank.
Regions are the boxes the pieces were made in (docs/workshop/m2b-dragonscape.md).
"""

import sys

import numpy as np
from PIL import Image, ImageFilter

FEATHER = 24
REF = (256, 0, 768, 480)  # the village, untouched
REGIONS = {
    # name: (box, strength of the match 0..1)
    "east": ((768, 0, 1024, 480), 0.85),
    "north-west forest": ((128, 0, 256, 256), 0.5),
    "south row": ((0, 480, 1024, 768), 0.6),
    "west piece above the row": ((104, 384, 256, 480), 0.6),
}


def srgb_to_lab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = c @ m.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def lab_to_srgb(lab):
    fy = (lab[..., 0] + 16) / 116
    fx = fy + lab[..., 1] / 500
    fz = fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], -1)
    xyz = np.where(f > 0.206893, f**3, (f - 16 / 116) / 7.787) * np.array([0.95047, 1.0, 1.08883])
    m = np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]])
    c = xyz @ m.T
    c = np.where(c <= 0.0031308, 12.92 * c, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)
    return np.clip(np.round(c * 255), 0, 255)


def plant_mask(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return (g >= r) & (g >= b) & (sat > 0.15) & (mx > 20)


def main(src, dst):
    im = Image.open(src).convert("RGBA")
    arr = np.asarray(im).astype(float)
    rgb, alpha = arr[..., :3], arr[..., 3]
    lab = srgb_to_lab(rgb)
    solid = alpha == 255
    x0, y0, x1, y1 = REF
    plant = plant_mask(rgb) & solid
    ref = lab[y0:y1, x0:x1][plant[y0:y1, x0:x1]]
    rmean, rstd = ref.mean(0), ref.std(0)
    out = lab.copy()
    for name, ((bx0, by0, bx1, by1), k) in REGIONS.items():
        sel = np.zeros(alpha.shape, bool)
        sel[by0:by1, bx0:bx1] = True
        px = lab[sel & plant]
        if len(px) == 0:
            continue
        mean, std = px.mean(0), px.std(0)
        matched = (lab - mean) / std * rstd + rmean
        target = lab + k * (matched - lab)
        mask = Image.fromarray((sel * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER / 2))
        w = (np.asarray(mask).astype(float) / 255 * plant)[..., None]
        out = out + w * (target - lab)
        print(f"{name}: L {mean[0]:.1f}->{rmean[0]:.1f}, a {mean[1]:.1f}->{rmean[1]:.1f}, b {mean[2]:.1f}->{rmean[2]:.1f}, strength {k}")
    rgb2 = lab_to_srgb(out)
    res = np.dstack([rgb2, alpha]).astype(np.uint8)
    Image.fromarray(res, "RGBA").save(dst)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
