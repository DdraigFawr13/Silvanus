# Blanks the garbled lettering on piece A's three sign boards (Claude's hand edit): each box is
# filled with its most common colour. Boxes in raw_A pixels, read at 4x.
from collections import Counter
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
a = np.asarray(Image.open(R / "art/pixellab/map3/raw_A.png").convert("RGB")).copy()
for x0, y0, x1, y1 in [(308, 191, 345, 200), (318, 215, 337, 223), (327, 308, 362, 330)]:
    box = a[y0:y1, x0:x1].reshape(-1, 3)
    mode = Counter(map(tuple, box)).most_common(1)[0][0]
    a[y0:y1, x0:x1] = mode
Image.fromarray(a).save(R / "art/pixellab/map3/raw_A_fix.png")
