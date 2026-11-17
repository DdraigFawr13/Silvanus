# Stage A of the building-block map: the top-middle and top-right ground tiles joined along a
# least-difference cut, then the buildings placed with the free passes from place.py.
# Map pixels; the stage covers x 500-1408, y 0-512. Usage: python3 stage_a.py <out.png> <ground_only.png>
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(R / "art/pixellab/map3")); sys.path.insert(0, str(R / "art/pixellab/blocks"))
from compose import compose
spec = {"base": "art/pixellab/map3/guide.png", "pieces": [
    ["art/pixellab/blocks/raw_ground.png", 500, 0, []],
    ["art/pixellab/blocks/raw_ground2b.png", 896, 0, [["left", 960, 1000]]]]}
G, _ = compose(spec)
ground = G[0:512, 500:1408].astype(float)
Image.fromarray(ground.clip(0, 255).astype(np.uint8)).save(sys.argv[2])
import place
place.PLACES = [(n, x - 500, y) for n, x, y in json.load(open(R / "art/pixellab/blocks/stage_a_places.json"))]
Image.fromarray(place.place(ground, True).clip(0, 255).astype(np.uint8)).save(sys.argv[1])
