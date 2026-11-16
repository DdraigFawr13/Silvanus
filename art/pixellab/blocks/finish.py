# The finished target map: the repaired ground (full_ground_fx.png: two painted-in buildings removed,
# the top-left fringe repainted) with every building placed by place.py's free passes.
# Usage: python3 finish.py <grown.png>
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place
g = np.asarray(Image.open(B / "full_ground_fx.png").convert("RGB")).astype(float)
place.PLACES = [tuple(p) for p in json.load(open(B / "full_places2.json"))]
Image.fromarray(place.place(g, True).clip(0, 255).astype(np.uint8)).save(sys.argv[1])
