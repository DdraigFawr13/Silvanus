# Stage B: the whole top band (map x 0-1408, y 0-512) from three empty-ground tiles joined along
# least-difference cuts, then the buildings placed with the free passes from place.py.
# Usage: python3 stage_b.py <grown.png> <ground.png> [ground_override.png]
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(R / "art/pixellab/map3")); sys.path.insert(0, str(R / "art/pixellab/blocks"))
from compose import compose
import place
if len(sys.argv) > 3:
    ground = np.asarray(Image.open(sys.argv[3]).convert("RGB")).astype(float)
else:
    spec = {"base": "art/pixellab/map3/guide.png", "pieces": [
        ["art/pixellab/blocks/raw_t0.png", 0, 0, []],
        ["art/pixellab/blocks/raw_ground.png", 500, 0, [["left", 500, 512]]],
        ["art/pixellab/blocks/raw_mountain.png", 896, 0, [["left", 960, 1000]]]]}
    G, _ = compose(spec); ground = G[0:512].astype(float)
Image.fromarray(ground.clip(0, 255).astype(np.uint8)).save(sys.argv[2])
place.PLACES = [tuple(p) for p in json.load(open(R / "art/pixellab/blocks/stage_b_places.json"))]
Image.fromarray(place.place(ground, True).clip(0, 255).astype(np.uint8)).save(sys.argv[1])
