# Fix 1 on the target map (D-055): the Hall's walkway ran into the fence across the top of the square, so it led to a gate,
# not into the square. Free pixel edit, no generations: the fence is opened for the walkway's width, the walkway's own slab rows
# continue down to the square's paving, and a fence post from the same fence caps each cut end.
# Input: result_1_graded.png (the ground, buildings off). Output: result_2_graded.png and result_2_grown.png (buildings placed as before).
# Usage: python fix_hall_path.py
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[2]
H = R / "art/handoff_chatgpt"
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place

g = np.asarray(Image.open(H / "result_1_graded.png").convert("RGB")).astype(float).copy()
WX0, WX1 = 868, 919          # walkway columns, its dark outlines included (measured: dark at x 868 and 918)
END, SQ = 398, 431           # last walkway row + 1 (dark slab line at y 397); first row of the square's paving
SLAB = 11                    # slab period in rows (dark lines at y 341, 352, 364, 374, 386, 397)
n = SQ - END                 # 33 rows = 3 slabs
# fence post (map x 883-892, y 408-431, the free-standing post left of the old gap) caps each cut end; copied before the paste covers it
post = g[408:SQ, 883:893].copy()
src = g[END - SLAB * 3 : END - SLAB * 3 + n, WX0:WX1].copy()   # the three slabs just above the walkway's end
g[END:SQ, WX0:WX1] = src
green = (post[..., 1] > post[..., 0] + 4) & (post[..., 1] >= post[..., 2])   # the grass round the post stays the target's
for x0 in (WX0 - 10, WX1):
    tgt = g[408:SQ, x0 : x0 + 10]
    tgt[~green] = post[~green]
# the old gate's bottom rail and its end post ran on under the walkway's foot (map x 866-883, y 431-440): repaint it with the
# paving 14 rows below (two brick courses; course lines measured at y 438, 445, 451, 458, 465)
g[431:441, 866:877] = g[445:455, 866:877]
g[431:439, 877:884] = g[431:439, 937:944]   # the same rows of clean paving right of the well (rows below hold its rim)
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(H / "result_2_graded.png")
place.PLACES = [tuple(p) for p in json.load(open(B / "pass2_items.json"))]
Image.fromarray(np.clip(place.place(g, True), 0, 255).astype(np.uint8)).save(H / "result_2_grown.png")
