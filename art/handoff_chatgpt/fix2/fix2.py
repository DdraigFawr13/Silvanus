# Fix 2 on the target map (D-055), free pixel edits, 0 generations (Claude's script, 2026-11-18):
#  1. a small notice board on the square's paving, left of the well (T3), built from the map's own sign panel (the plank sign
#     under the board at the road fork) on two posts, with three pinned notes;
#  2. the three loose grey slabs in the grass south of the High Street (x 364-493, y 753-774) repainted as grass;
#  3. paths to seven doors that had none (T7, L4), laid with the path brush from a patch of the map's own lane,
#     plus a gate in the fenced plot's top fence.
# Input: ../result_2_graded.png (ground, buildings off). Output: ../result_3_graded.png and ../result_3_grown.png.
# Usage: python3 art/handoff_chatgpt/fix2/fix2.py
import json, pathlib, sys
import numpy as np
from PIL import Image, ImageFilter
R = pathlib.Path(__file__).resolve().parents[3]
H = R / "art/handoff_chatgpt"
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place, paths

g = np.asarray(Image.open(H / "result_2_graded.png").convert("RGB")).astype(float).copy()
H_, W_ = g.shape[:2]

def soft(box, pad=2):
    """Alpha mask for a box with a feathered edge, full map size."""
    m = Image.new("L", (W_, H_)); x0, y0, x1, y1 = box
    m.paste(255, (x0, y0, x1, y1))
    return np.asarray(m.filter(ImageFilter.GaussianBlur(pad))).astype(float)[..., None] / 255

# --- 2. loose slabs -> grass. Source: the cleanest grass block nearby (x 302-342, y 832-848: all green, no pixel darker
# than 110 or lighter than 330 summed; found by search), tiled. A first try took the block under the slabs and repeated a dark rock.
grass = g[832:848, 302:342].copy(); gh, gw = grass.shape[:2]
yy, xx = np.mgrid[0:H_, 0:W_]
tiled = grass[(yy - 832) % gh, (xx - 302 + 13 * (yy // gh)) % gw]   # each tile row shifted 13 px, so the repeat does not line up
for box in [(363, 754, 414, 775), (426, 752, 462, 775), (468, 757, 495, 775)]:
    a = soft(box, 1.5)
    g = g * (1 - a) + tiled * a

# --- 3. door paths. Dirt texture: the High Street west of the big cottage (x 300-360, y 597-615), no stones in it.
TEX = (300, 597, 360, 615)
DOORS = [
    # (points, width, why)
    ([(197, 546), (197, 572), (199, 594)], 16, "cottage at (156,443): door to the High Street, through the fence in front of it"),
    ([(346, 582), (346, 598)], 14, "big cottage at (293,459): its steps meet the High Street"),
    ([(60, 618), (60, 646), (64, 672)], 18, "fenced cottage at (75,607): a gate in the top fence, road into the yard"),
    ([(716, 574), (700, 570), (668, 568)], 8, "cottage at (687,471): steps to the lane on the west"),
    ([(788, 697), (782, 712), (760, 718), (738, 718)], 10, "cottage at (730,578): steps to the lane on the west"),
    ([(592, 754), (570, 754), (546, 752)], 10, "cottage at (547,633): steps to the lane on the west"),
    ([(982, 731), (952, 740), (912, 742)], 10, "farmhouse at (925,612): door to the lane on the west"),
]
before = g.copy()
for pts, w, _ in DOORS:
    g = paths.lay(g, pts, w, TEX, seed=311 + int(pts[0][0]))
# mist lies over the paths: where the ground was mist (blue at least green, not dark), half the old pixel comes back
mist = ((before[..., 2] >= before[..., 1]) & (before.sum(2) > 200))[..., None]
g = np.where(mist, g * 0.45 + before * 0.55, g)

# --- 1. notice board on the square (posts, panel, notes). Base at paving x 836-868, y 446-478.
src = Image.open(H / "result_2_graded.png").convert("RGB")
panel = np.asarray(src.crop((566, 243, 607, 263))).astype(float)       # the plank sign under the fork board, 41 x 20
panel = np.concatenate([panel[:, :16], panel[:, 25:]], 1)               # cut a 9 px slice from the middle: 32 x 20
ph, pw = panel.shape[:2]
BX, BY = 837, 444                                                        # panel's top-left on the map

OUT = panel.reshape(-1, 3)[panel.sum(2).argmin()]
WOOD = panel[ph // 2, 3]                                                 # a mid plank pixel
POST_D = WOOD * 0.55
# contact shadow on the paving: the board's footprint shifted 3 right, 2 down, blurred, 40% dark
sh = Image.new("L", (W_, H_)); sh.paste(255, (BX + 3, BY + 4, BX + pw + 3, BY + ph + 14))
s = np.asarray(sh.filter(ImageFilter.GaussianBlur(2.5))).astype(float)[..., None] / 255 * 0.40
g *= 1 - s
# posts: 4 px wide (outline, wood, dark wood, outline), from under the panel to the paving
for px in (BX + 4, BX + pw - 8):
    for y in range(BY + ph - 2, BY + ph + 11):
        g[y, px] = OUT; g[y, px + 1] = WOOD; g[y, px + 2] = POST_D; g[y, px + 3] = OUT
    g[BY + ph + 11, px:px + 4] = OUT * 1.2
g[BY:BY + ph, BX:BX + pw] = panel
# three pinned notes in parchment (the stall awning's cream), 1 px outline, a pin pixel each
CREAM = np.asarray(Image.open(H / "result_2_grown.png").convert("RGB").getpixel((848, 496))).astype(float)   # the stall awning's cream stripe
for nx, ny, nw, nh in [(BX + 5, BY + 6, 7, 9), (BX + 14, BY + 5, 6, 7), (BX + 22, BY + 7, 6, 8)]:
    g[ny:ny + nh, nx:nx + nw] = OUT
    g[ny + 1:ny + nh - 1, nx + 1:nx + nw - 1] = CREAM * 0.92
    g[ny + 3:ny + nh - 2:2, nx + 2:nx + nw - 2] = CREAM * 0.6                # lines of writing
    g[ny + 1, nx + nw // 2] = (150, 40, 36)                                   # the pin

Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(H / "result_3_graded.png")
place.PLACES = [tuple(p) for p in json.load(open(B / "pass2_items.json"))]
Image.fromarray(np.clip(place.place(g, True), 0, 255).astype(np.uint8)).save(H / "result_3_grown.png")
print("wrote result_3_graded.png and result_3_grown.png")
