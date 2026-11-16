# Assembles an improvement pass: the softened ground (ground_p1.png) with the paid repair windows pasted
# in, the free paths laid, then every building, lamp and site placed in depth order (by the base line,
# so what stands lower on the map is drawn in front) with place.py's free passes.
# Usage: python3 assemble.py <pass name> ; reads <pass>_spec.json, writes <pass>_ground.png and <pass>_grown.png
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place, paths
name = sys.argv[1]
spec = json.load(open(B / f"{name}_spec.json"))
g = Image.open(B / spec["ground"]).convert("RGB")
for f, x, y in spec["windows"]:
    g.paste(Image.open(B / f).convert("RGB"), (x, y))
a = np.asarray(g).astype(float)
for p in spec["paths"]:
    a = paths.lay(a, [tuple(q) for q in p["pts"]], p["width"], tuple(p["tex"]))
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(B / f"{name}_ground.png")
items = [tuple(i) for i in spec["items"]]
LAMP = Image.open(B / "raw_lamp.png").size
items += [("raw_lamp.png", cx - LAMP[0] // 2, base - 48) for cx, base in spec["lamps"]]
def base_of(it):
    w, h = Image.open(B / it[0]).size
    return it[2] + h
items.sort(key=base_of)
place.PLACES = items
Image.fromarray(np.clip(place.place(a, True), 0, 255).astype(np.uint8)).save(B / f"{name}_grown.png")
json.dump(items, open(B / f"{name}_items.json", "w"), indent=0)
print(name, len(items), "items")
