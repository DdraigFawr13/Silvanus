# The whole map (1408 x 888) as empty ground: the top band (stage B plus the river fix) and the three
# bottom tiles (map y 376-888) joined along least-difference cuts; then a free grade that moves each
# bottom tile's mean brightness halfway to the top band's. Usage: python3 full_map.py <out.png>
import pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(R / "art/pixellab/map3"))
from compose import compose
B = "art/pixellab/blocks/"
top = np.asarray(Image.open(R / B / "stage_c_top_ground.png").convert("RGB")).astype(float)
target = top[376:512].mean()
def graded(name):
    a = np.asarray(Image.open(R / B / name).convert("RGB")).astype(float)
    k = 1 + (target / a[136:].mean() - 1) * 0.5
    out = R / B / ("_g_" + name); Image.fromarray(np.clip(a * k, 0, 255).astype(np.uint8)).save(out)
    return B + "_g_" + name
canvas = np.zeros((888, 1408, 3), np.uint8); canvas[0:512] = top.astype(np.uint8)
Image.fromarray(canvas).save(R / B / "_canvas.png")
spec = {"base": B + "_canvas.png", "pieces": [
    [B + "stage_c_top_ground.png", 0, 0, []],
    [graded("raw_bl.png"), 0, 376, [["top", 420, 500]]],
    [graded("raw_bm.png"), 500, 376, [["left", 500, 512], ["top", 420, 500]]],
    [graded("raw_br.png"), 896, 376, [["left", 960, 1000], ["top", 420, 500]]]]}
G, _ = compose(spec)
Image.fromarray(G.clip(0, 255).astype(np.uint8)).save(sys.argv[1])
