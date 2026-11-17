# Builds the rescore page: the target map after fix 1 (result_2_grown.png) scored against all 55 checklist items
# (docs/workshop/pages/result2_scores.json: item name, new status, note, status before the clean-up). Usage: python build_page.py <out.html>
import base64, html, io, json, pathlib, sys
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
H = R / "art/handoff_chatgpt"
d = json.load(open(R / "docs/workshop/pages/result2_scores.json", encoding="utf-8"))
grown = Image.open(H / "result_2_grown.png").convert("RGB")
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
secs = "".join(f'<figure>{img(grown.crop(b), t)}<figcaption>{t}</figcaption></figure>' for t, b in SECS)
page = f'''<title>Target Map Rescore</title>
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
<h1>The target map, rescored</h1>
<p class="mute">The map after fix 1 (ChatGPT's clean-up with the PixelLab buildings, the Hall's walkway into the square), scored against all 55 checklist items. The last full scoring was of the map before the clean-up. 0 PixelLab generations used.</p>
<section><div class="tally"><div><b class="m">{count["m"]}</b>Met</div><div><b class="p">{count["p"]}</b>Partly</div><div><b class="x">{count["x"]}</b>Missed</div><div><b class="c">{count["c"]}</b>Carried</div></div>
<p class="mute">Before the clean-up: 38 met, 16 partly, 1 missed. "Carried" means met on the old map with pieces (glows, Build markers, staked lots, tiers, the phone screen) that are not yet redrawn on this ground. Moved up: L1, L8, R3. Moved down: M10, M16, T3, R4 (things I missed or that the clean-up dropped).</p></section>
<section><h2>The whole map</h2>{img(grown, "The whole target map")}<p class="mute">Brightness 51, saturation 0.39, edge share 0.237; mock-up 1 is 55, 0.37, 0.263.</p></section>
<section><h2>Six sections, 2× on a phone</h2>{secs}</section>
{tables}
<section class="rec"><h2>Next</h2><ul>
<li><b>Recommended: fix 2, free spots, 0 generations.</b> Put a notice board in the square (T3), clear the two loose slabs and add paths to the doors that lack them (T7), and see whether the fisher's hut fits on the far bank (M10).</li>
<li>Then dressed yards for about 6 cottages (P5, T7): about 35 to 45 generations (my estimate).</li>
<li>Later: the missing special sites (M14, about 15 to 20), crop fields by the farm (M16), a cobbled High Street and hedgerows (T5, T9, about 25 to 35), and redrawing day one and the phone screen on this ground (the Carried items, free).</li>
</ul><p>I will ask before every paid call, with its cost (R6).</p></section>
<p class="mute">Scores: docs/workshop/pages/result2_scores.json. Page: art/handoff_chatgpt/rescore/build_page.py.</p>
</main>'''
pathlib.Path(sys.argv[1]).write_text(page, encoding="utf-8")
