# Hall asset hand edit (free): the cross on the spire becomes a plain spike finial (Morgan's town
# hall, not a church): rows above the spire tip keep only the central stem; nothing above row 8.
import pathlib
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
a = np.asarray(Image.open(R / "art/pixellab/blocks/raw_hall.png").convert("RGBA")).copy()
xs = np.arange(a.shape[1])
a[:8, :, 3] = 0
a[8:17, (xs < 103) | (xs > 106), 3] = 0
Image.fromarray(a).save(R / "art/pixellab/blocks/hall_fixed.png")
