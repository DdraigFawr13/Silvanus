# Empty-ground guide for the top-right tile (map x 896-1408, y 0-512; Claude's hand edit):
# the left 116 px are the restyled empty ground of the test tile (map 896-1012), so the two tiles
# start alike; the mine entrance becomes rock with a dark cave mouth (the timber entrance is an
# asset); the shed becomes grass with an earth plot.
import pathlib
import numpy as np
from PIL import Image, ImageDraw
R = pathlib.Path(__file__).resolve().parents[3]
g = np.asarray(Image.open(R / "art/pixellab/map3/guide.png").convert("RGB").crop((896, 0, 1408, 512))).astype(int).copy()
t1 = np.asarray(Image.open(R / "art/pixellab/blocks/raw_ground.png").convert("RGB")).astype(int)
g[:, :116] = t1[:, 396:512]
rng = np.random.default_rng(303)
def fill(colour, x0, y0, x1, y1, amp=10):
    g[y0:y1, x0:x1] = np.clip(colour + rng.integers(-amp, amp + 1, (y1 - y0, x1 - x0, 1)), 0, 255)
cl = g[0:120, 130:330].reshape(-1, 3); ROCK = np.median(cl[cl[:, 2] > cl[:, 1] + 6], axis=0)   # blue-grey cliff pixels
fill(ROCK, 188, 122, 270, 224, 14)
mouth = Image.new("L", (512, 512)); ImageDraw.Draw(mouth).ellipse((206, 176, 252, 236), fill=255)
m = np.asarray(mouth) > 0; g[m] = (18, 20, 24)                        # dark cave mouth where the track ends
g[266:330, 266:332] = g[416:480, 266:332]                             # shed roof and walls -> grass from below
EARTH = np.median(g[340:400, 350:395].reshape(-1, 3), axis=0)        # the shed's earth patch
fill(EARTH, 266, 330, 334, 384, 9)                                    # its plot
Image.fromarray(g.astype(np.uint8)).save(R / "art/pixellab/blocks/empty_guide2.png")
Image.fromarray(g[60:460, 112:512].astype(np.uint8)).save(R / "art/pixellab/blocks/init_px2.png")
