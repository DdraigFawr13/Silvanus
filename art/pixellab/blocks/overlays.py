# Free overlays for the target picture (Claude's script, no generations):
#  grown.png    the finished map plus a dressed yard and three special sites toward the edges (M14)
#  dayone.png   day one (D-047, P7): the ground with the Hall, woodcutter's camp, mine and one cottage;
#               every other plot empty with a soft pale glow (P2) and a Build marker (P4); three
#               south plots staked with rope, posts and a sign as future lots (P6)
#  tapped.png   the grown map with one built lot tapped: a gold glow round it (P3), colour --act
#  square_1/2/3 the square's stages (T4, D-042 Proposed): well only; stalls; stalls and a fountain
import json, pathlib, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
R = pathlib.Path(__file__).resolve().parents[3]
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place
ACT = np.array([0xd9, 0xa4, 0x41], float)     # --act, lamp-amber (docs/UI_STYLE.md)
ground = np.asarray(Image.open(B / "full_ground_fx.png").convert("RGB")).astype(float)
places = [tuple(p) for p in json.load(open(B / "full_places2.json"))]
EXTRA = [("raw_yard.png", 62, 622), ("raw_ruins.png", 4, 6), ("raw_stones.png", 18, 318), ("raw_tarpit.png", 30, 786)]
def render(g, pl):
    place.PLACES = pl
    return place.place(g, True)
def save(a, name):
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(B / name)
grown = render(ground, places + EXTRA)
save(grown, "grown.png")
# day one
DAY1 = {"hall_fixed.png", "raw_mine_entrance.png", "raw_woodcutter.png"}
day1 = [p for p in places if p[0] in DAY1] + [p for p in places if p[0] == "raw_cottage_a.png" and p[1] == 642]
empty = [p for p in places if p not in day1 and "stall" not in p[0]]
d1 = render(ground, day1 + [e for e in EXTRA if e[0] != "raw_yard.png"])
H, W = d1.shape[:2]
def plot_box(name, x, y):
    w, h = Image.open(B / name).size
    return x + w * 0.12, y + h * 0.55, x + w * 0.88, y + h * 0.98     # the building's footprint
staked = [p for p in empty if p[2] > 600][:3]
glow = Image.new("L", (W, H)); gd = ImageDraw.Draw(glow)
for p in empty:
    if p in staked: continue
    x0, y0, x1, y1 = plot_box(*p); gd.ellipse((x0, y0, x1, y1), fill=255)
glow = np.asarray(glow.filter(ImageFilter.GaussianBlur(7))).astype(float)[..., None] / 255
d1 = d1 * (1 - glow * 0.32) + np.array([232, 238, 225], float) * glow * 0.32   # soft pale glow
im = Image.fromarray(np.clip(d1, 0, 255).astype(np.uint8)); dr = ImageDraw.Draw(im)
for p in empty:
    x0, y0, x1, y1 = plot_box(*p); cx, cy = int((x0 + x1) / 2), int((y0 + y1) / 2)
    if p in staked:
        rope = (184, 156, 104); post = (58, 40, 26)
        dr.rectangle((x0, y0, x1, y1), outline=rope)
        for px_, py_ in [(x0, y0), (x1, y0), (x0, y1), (x1, y1)]:
            dr.rectangle((px_ - 1, py_ - 3, px_ + 1, py_ + 1), fill=post)
        dr.rectangle((cx - 7, y1 - 13, cx + 7, y1 - 6), fill=(122, 92, 58), outline=post)   # the sign board
        dr.line((cx, y1 - 6, cx, y1), fill=post)
    else:   # Build marker: an amber disc with a dark plus, outlined
        dr.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=tuple(int(v) for v in ACT), outline=(26, 22, 8))
        dr.rectangle((cx - 4, cy - 1, cx + 4, cy + 1), fill=(26, 22, 8)); dr.rectangle((cx - 1, cy - 4, cx + 1, cy + 4), fill=(26, 22, 8))
im.save(B / "dayone.png")
# tapped: gold glow round cottage A by the Hall
name, x, y = [p for p in places if p[0] == "raw_cottage_a.png" and p[1] == 642][0]
a = np.asarray(Image.open(B / name).convert("RGBA"))[..., 3]
m = Image.new("L", (W, H)); m.paste(Image.fromarray(a), (x, y))
ring = np.asarray(m.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(3))).astype(float)[..., None] / 255
inside = np.asarray(m).astype(float)[..., None] / 255
t = grown * (1 - ring * 0.75) + ACT * ring * 0.75
t = t * (1 - inside) + grown * inside
save(t, "tapped.png")
# square stages
sq = (800, 380, 990, 560)
st1 = render(ground, places + EXTRA)
for i, pl in enumerate([[p for p in places if "stall" not in p[0]], places,
                        places + [("raw_fountain.png", 864, 404)]], 1):
    save(render(ground, pl + EXTRA)[sq[1]:sq[3], sq[0]:sq[2]], f"square_{i}.png")
print("ok", len(empty), "empty plots,", len(staked), "staked")
