# Dressed yards on the target map (checklist P5; also T7, L4, M10). Claude's script, 2026-11-18.
# Input: ../result_3_graded.png (ground, buildings off) and the building list ../../pixellab/blocks/pass2_items.json.
# Output: ../result_4_graded.png (the ground, unchanged from result_3_graded.png: the yards and the hut are all separate pieces)
#         ../result_4_grown.png  (that ground + buildings + yard props, all placed with place.py so each piece stays replaceable)
# Props: PixelLab candidates cleaned by props.py (sources in raw/*.job.txt). The fisher's hut moves from the town bank
# (raw_fisher.png at 1090,678) to the far bank by the bridge, at the same 128 px scale (props/fisher_far.png: its own pond cut,
# so its jetty and boat sit on the backwater). The 64 px hut (props/fisher_small.png) was too small beside the others (Morgan).
# Usage: python3 art/handoff_chatgpt/yards/yards.py
import json, pathlib, sys
import numpy as np
from PIL import Image
D = pathlib.Path(__file__).resolve().parent
R = D.parents[2]
H = R / "art/handoff_chatgpt"
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place, paths

P = "../../handoff_chatgpt/yards/props/"     # place.py reads B / name, so props are named relative to blocks/
YARDS = [  # (prop, x, y) top-left of the prop's canvas on the map; the yard it dresses
    ("butt_bench.png", 620, 282),    # north cottage by the Hall (cottage_a at 642,166): water butt, bench, pots, front left
    ("washing.png", 716, 280),       # same cottage: washing line, front right
    ("barrow.png", 1000, 716),       # farmhouse (925,612): wheelbarrow, sack and bucket in front of the barn
    ("garden.png", 1052, 598),       # farmhouse: vegetable bed in a wattle fence, north-east of the barn
    ("woodshed.png", 256, 512),      # big cottage north of the High Street (cottage_d at 293,459): woodshed in its west yard
    ("chop.png", 35, 648),           # fenced cottage (cottage_d at 75,607): chopping block inside the fence
    ("logs.png", 246, 700),          # small cottage (cottage_c at 256,649): log stack in its west yard
    ("butt_bench2.png", 736, 690),   # cottage on the cross street (cottage_a at 730,578): water butt, bench, pots, front left
    ("fisher_far.png", 1248, 606),   # fisher's hut on the far bank between river and backwater; jetty and boat on the backwater
]

g = np.asarray(Image.open(H / "result_3_graded.png").convert("RGB")).astype(float).copy()
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(H / "result_4_graded.png")

items = [tuple(p) for p in json.load(open(B / "pass2_items.json")) if p[0] != "raw_fisher.png"]
place.PLACES = items + [(P + n, x, y) for n, x, y in YARDS]
Image.fromarray(np.clip(place.place(g, True), 0, 255).astype(np.uint8)).save(H / "result_4_grown.png")
print("wrote result_4_graded.png and result_4_grown.png;", len(YARDS), "pieces added")
