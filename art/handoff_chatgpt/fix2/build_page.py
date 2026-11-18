# Builds the fix 2 page: before/after of each spot, the target map after fix 2 (result_3_grown.png), and all 55 checklist items
# (docs/workshop/pages/result3_scores.json: item name, status, note, status after fix 1). Usage: python build_page.py <out.html>
import base64, html, io, json, pathlib, sys
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
H = R / "art/handoff_chatgpt"
d = json.load(open(R / "docs/workshop/pages/result3_scores.json", encoding="utf-8"))
grown = Image.open(H / "result_3_grown.png").convert("RGB")
old = Image.open(H / "result_2_grown.png").convert("RGB")
def pair(box, s):
    w, h = (box[2] - box[0]) * s, (box[3] - box[1]) * s
    im = Image.new("RGB", (w * 2 + 6, h), (22, 33, 32))
    im.paste(old.crop(box).resize((w, h), Image.NEAREST), (0, 0)); im.paste(grown.crop(box).resize((w, h), Image.NEAREST), (w + 6, 0))
    return im
SPOTS = [("Notice board on the square, left of the well (T3)", (816, 420, 940, 520), 3),
         ("Loose slabs south of the High Street, gone (T7)", (350, 740, 510, 800), 3),
         ("Cottage by the High Street: a path through its fence (T7)", (160, 520, 380, 610), 2),
         ("Fenced plot: a gate in the top fence (T7)", (0, 600, 140, 700), 3),
         ("Cottages round the square's green: steps to the lanes (T7)", (520, 540, 840, 780), 2),
         ("Farmhouse: door to the lane, under the mist (T7)", (880, 680, 1020, 770), 3)]
def b64(im):
    buf = io.BytesIO(); im.save(buf, "PNG"); return base64.b64encode(buf.getvalue()).decode()
def img(im, alt): return f'<img src="data:image/png;base64,{b64(im)}" alt="{html.escape(alt)}">'
SECS = [("North-west: ruins, forager, woodcutter, forest gate", (0, 0, 470, 444)), ("North: the Hall, its walkway, the High Street", (470, 0, 940, 444)),
        ("North-east: mountain, mine, river", (938, 0, 1408, 444)), ("South-west: cottages, tar pit", (0, 444, 470, 888)),
        ("South: cottages, square's stalls, road south", (470, 444, 940, 888)), ("South-east: farm, fisher, bridge, swamp", (938, 444, 1408, 888))]
NAME = {"m": "Met", "p": "Partly", "x": "Missed", "c": "Carried"}
GROUPS = [("The look", "L"), ("The land", "M"), ("The town", "T"), ("Lots and growth", "P"), ("The screen", "S"), ("How I show you", "R")]
count = {k: sum(1 for v in d.values() if v[1] == k) for k in NAME}
def row(k, v):
    name, st, note, old = v
    ch = "" if old == st else f' <span class="was">was {NAME[old]}</span>'
    return f'<tr><td>{k}</td><td>{html.escape(name)}</td><td><span class="st {st}">{NAME[st]}</span>{ch}</td><td>{html.escape(note)}</td></tr>'
tables = "".join(f'<section><h2>{t}</h2><div class="tbl"><table>{"".join(row(k, v) for k, v in d.items() if k[0] == p)}</table></div></section>' for t, p in GROUPS)
spots = "".join(f'<figure>{img(pair(b, sc), t)}<figcaption>{t}. Left before, right after.</figcaption></figure>' for t, b, sc in SPOTS)
secs = "".join(f'<figure>{img(grown.crop(b), t)}<figcaption>{t}</figcaption></figure>' for t, b in SECS)
page = f'''<title>Target Map Fix 2</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width. Lantern colours (D-028), dark only like the game. */
:root {{ --bg:#162120; --panel:#1f2e2c; --line:#2f4541; --ink:#e6e3d6; --head:#f0d9a4; --muted:#9fb0a4; --act:#d9a441; --ok:#7fb07a; --part:#d9a441; --miss:#d0705a; --carry:#8a9fb0; color-scheme:dark; }}
body {{ background:var(--bg); color:var(--ink); font:15px/1.5 system-ui,sans-serif; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; margin:0; }}
main {{ max-width:460px; margin:0 auto; display:grid; gap:16px; }}
h1,h2 {{ font-family:Georgia,serif; color:var(--head); margin:0; text-wrap:balance; }} h1 {{ font-size:24px; }} h2 {{ font-size:17px; }}
p {{ margin:0; }} .mute {{ color:var(--muted); font-size:13px; }}
section {{ background:var(--panel); border:1px solid var(--line); padding:12px; border-radius:10px; display:grid; gap:10px; min-width:0; }}
img {{ width:100%; display:block; image-rendering:pixelated; border-radius:6px; }}
figure {{ margin:0; display:grid; gap:4px; }} figcaption {{ font-size:13px; color:var(--muted); }}
.tally {{ display:grid; grid-template-columns:repeat(4,1fr); gap:8px; text-align:center; }} .tally b {{ display:block; font-size:22px; font-variant-numeric:tabular-nums; }}
.tbl {{ overflow-x:auto; }} table {{ border-collapse:collapse; font-size:13px; width:100%; }} td {{ padding:6px 4px; border-bottom:1px solid var(--line); vertical-align:top; }}
.st {{ font-weight:700; white-space:nowrap; }} .m {{ color:var(--ok); }} .p {{ color:var(--part); }} .x {{ color:var(--miss); }} .c {{ color:var(--carry); }}
.was {{ display:block; font-size:12px; color:var(--muted); white-space:nowrap; }}
ul {{ margin:0; padding-left:20px; display:grid; gap:6px; }} .rec {{ border-left:3px solid var(--act); }}
</style>
<main>
<h1>Target map, fix 2</h1>
<p class="mute">Free pixel edits on the target map, 0 PixelLab generations: a notice board in the square, the loose slabs cleared, and paths to seven doors. Scored against all 55 checklist items; only T3 moved.</p>
<section><div class="tally"><div><b class="m">{count["m"]}</b>Met</div><div><b class="p">{count["p"]}</b>Partly</div><div><b class="x">{count["x"]}</b>Missed</div><div><b class="c">{count["c"]}</b>Carried</div></div>
<p class="mute">After fix 1: 27 met, 17 partly, 1 missed, 10 carried. Up: T3 (notice board in the square). T7 stays Partly: the forager's hut and the woodcutter still have no track. 0.67% of the map's pixels changed, all at these spots. Brightness, saturation and edge share are unchanged (51, 0.39, 0.237).</p></section>
<section><h2>The spots, before and after</h2>{spots}</section>
<section><h2>Not done in this pass</h2><ul>
<li><b>The fisher's hut to the far bank (M10).</b> It does not fit: the far bank beside the bridge is about 65 px wide and the hut is 116 px. It needs a smaller hut made in PixelLab.</li>
<li><b>Paid work is blocked.</b> PixelLab refused this session's key ("Invalid API token"), so the dressed yards (P5) cannot start until the key is renewed in the connector settings.</li>
<li>The board is built from the map's own sign and the stall's cream; if you want it grander (a roof, a lantern), that is one PixelLab object, about 5 generations.</li>
</ul></section>
<section><h2>The whole map</h2>{img(grown, "The whole target map after fix 2")}</section>
<section><h2>Six sections, 2× on a phone</h2>{secs}</section>
{tables}
<section class="rec"><h2>Next</h2><ul>
<li><b>Recommended: approve fix 2</b>, then dressed yards for about 6 cottages (P5): about 35 to 45 generations (my estimate), once the PixelLab key works.</li>
<li>Also in that round: a smaller fisher's hut on the far bank (M10), about 5 to 10.</li>
</ul><p>I will ask before every paid call, with its cost (R6).</p></section>
<p class="mute">Scores: docs/workshop/pages/result3_scores.json. Page: art/handoff_chatgpt/fix2/build_page.py. Edit: art/handoff_chatgpt/fix2/fix2.py.</p>
</main>'''
pathlib.Path(sys.argv[1]).write_text(page, encoding="utf-8")
