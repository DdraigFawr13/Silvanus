# Builds the dressed-yards page: before/after of each yard, the PixelLab pieces, the map after the yards (result_4_grown.png), and all 55
# checklist items (docs/workshop/pages/result4_scores.json: item name, status, note, status after fix 2). Usage: python build_page.py <out.html>
import base64, html, io, json, pathlib, sys
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]
H = R / "art/handoff_chatgpt"
d = json.load(open(R / "docs/workshop/pages/result4_scores.json", encoding="utf-8"))
grown = Image.open(H / "result_4_grown.png").convert("RGB")
old = Image.open(H / "result_3_grown.png").convert("RGB")
def pair(box, s):
    w, h = (box[2] - box[0]) * s, (box[3] - box[1]) * s
    im = Image.new("RGB", (w * 2 + 6, h), (22, 33, 32))
    im.paste(old.crop(box).resize((w, h), Image.NEAREST), (0, 0)); im.paste(grown.crop(box).resize((w, h), Image.NEAREST), (w + 6, 0))
    return im
SPOTS = [("Cottage by the Hall: water butt, bench and pots; washing line", (600, 160, 790, 330), 2),
         ("Farmhouse: wheelbarrow with sack and bucket by the barn; vegetable bed in a wattle fence", (900, 580, 1110, 780), 2),
         ("Big cottage on the High Street: a woodshed in its west yard", (230, 450, 400, 600), 3),
         ("Fenced cottage: chopping block with an axe and split logs", (20, 600, 210, 750), 2),
         ("Small cottage south of the High Street: a log stack", (230, 640, 350, 780), 3),
         ("Cottage on the cross street: water butt, bench and two pots", (720, 580, 870, 740), 2),
         ("Fisher's hut: from the town bank to the far bank at the same scale, its jetty and boat on the backwater", (1060, 560, 1408, 800), 1)]
PIECES = ["butt_bench", "butt_bench2", "washing", "garden", "barrow", "chop", "woodshed", "logs"]
def pieces():
    W = Image.new("RGBA", (len(PIECES) * 68, 68), (60, 84, 50, 255))
    for i, n in enumerate(PIECES): W.alpha_composite(Image.open(H / "yards/props" / f"{n}.png").convert("RGBA"), (i * 68 + 2, 2))
    return W.resize((W.width * 2, W.height * 2), Image.NEAREST).convert("RGB")

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
page = f'''<title>Dressed Yards</title>
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
<h1>Dressed yards</h1>
<p class="mute">Six cottage and farm yards dressed with PixelLab props, and the fisher's hut moved to the far bank at the same scale as the other buildings. 35 of the 45 approved generations used. Scored against all 55 checklist items.</p>
<section><div class="tally"><div><b class="m">{count["m"]}</b>Met</div><div><b class="p">{count["p"]}</b>Partly</div><div><b class="x">{count["x"]}</b>Missed</div><div><b class="c">{count["c"]}</b>Carried</div></div>
<p class="mute">After fix 2: 28 met, 16 partly. Up: M10 (the fisher's hut, jetty and boat now on the far bank). P5 (dressed yards) went from one dressed yard to seven, but five cottages are still bare, so it stays Partly. Brightness 51 and saturation 0.39 unchanged, edge share 0.239 (was 0.237); 2.6% of pixels changed, all at these spots.</p></section>
<section><h2>The yards, before and after</h2>{spots}</section>
<section><h2>The new pieces</h2>{img(pieces(), "The eight yard pieces")}<p class="mute">Left to right: water butt with bench and pots (two versions), washing line, vegetable bed, wheelbarrow, chopping block, woodshed, log stack. Each is its own file, placed by place.py, so any one can be swapped.</p></section>
<section><h2>Generations</h2><ul>
<li>Call 1, 10: 25 single props at 48 px. Good variety, but each prop came out twice the map's scale (a barrel 36 px tall; the map's are about 18). Not used: rescaling pixel art is against the guide.</li>
<li>Call 2, 10: 64 candidates at 28 px. Map scale, but all woodpiles; used the woodshed and the log stack.</li>
<li>Call 3, 10: 25 small clusters at 48 px, at map scale in five kinds; six used.</li>
<li>Call 4, 5: a 64 px fisher's hut. Not used: you found it too small beside the other buildings, so the map's own full-size hut moved to the far bank instead (0 generations).</li>
<li><b>35 used, 10 left</b> of the 45 cap; 1,230 left on the PixelLab plan.</li>
</ul></section>
<section><h2>Still wrong</h2><ul>
<li>Five cottages have no yard props yet: two north of the High Street, the one by the square, two south of it. Their yards are narrow (about 20 to 25 px beside the walls).</li>
<li>The hut's roof covers the bridge's east end, and no track runs from the bridge road to its door; a few planks of the old landing show on the town bank.</li>
</ul></section>
<section><h2>The whole map</h2>{img(grown, "The whole target map with dressed yards")}</section>
<section><h2>Six sections, 2× on a phone</h2>{secs}</section>
{tables}
<section class="rec"><h2>Approved</h2><p>You approved once the hut matched the others' scale ("After you fix that I approve"). Next, as offered: props for the five bare cottages from the pieces already made (free).</p></section>
<p class="mute">Scores: docs/workshop/pages/result4_scores.json. Page: art/handoff_chatgpt/yards/build_page.py. Placement: art/handoff_chatgpt/yards/yards.py.</p>
</main>'''
pathlib.Path(sys.argv[1]).write_text(page, encoding="utf-8")
