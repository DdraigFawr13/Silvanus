# Builds the building-block map stage A page. Usage: python3 docs/workshop/pages/build_stage_a.py <out.html>
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
B = "art/pixellab/blocks/"
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/stage_a_scores.json"))
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {c: 0 for c in "mpx"}; rows = []
for iid, v in d.items():
    tot[v[1]] += 1
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="chip {v[1]}">{names[v[1]]}</span></summary><p class="why">{html.escape(v[2])}</p></details>')
def fig(title, src, cap):
    return f'<figure><h3>{title}</h3><img class="px" src="{uri(src)}" alt="{html.escape(title)}"><figcaption>{cap}</figcaption></figure>'
scroll = f'''<figure><h3>Grown, at 1× (scroll sideways)</h3><div class="scroll"><img src="{uri(B + "stage_a.png")}" alt="Stage A at 1x" width="908" height="512" style="image-rendering:pixelated;display:block;max-width:none"></div>
<figcaption>The same picture at full size, 908 × 512, as the map will scroll on the phone.</figcaption></figure>'''
figs = "".join([
 fig("Mock-up 1, the approved look", "art/pixellab/mock_hd/raw_1_heart.png", "The reference. Brightness 55, edge share 0.263."),
 fig("Stage A grown: ground plus four buildings", B + "stage_a.png",
  "Map x 500–1408, the top of the town. Left: pines, the woodcutter's sign board, cottage A, the Hall on its walkway, the well, cottage B. Right: grey cliffs with ivy, the timber mine entrance in the cliff with rails onto the cart track, the cart, an empty earth plot with a lamp, the dark river under mist, grey cliffs beyond. Brightness 46, edge share 0.197."),
 scroll,
 fig("Stage A day one: the ground alone", B + "stage_a_ground_final.png",
  "The same ground with no buildings: three earth plots where the Hall and cottages stand when built, the cave mouth in the cliff where the mine entrance goes. Brightness 47, edge share 0.168."),
 fig("The four buildings, made separately", B + "assets_row_a.png",
  "The Hall (cross on the spire cut to a plain spike), cottage A, cottage B, and the new mine entrance: timber frame, mossy slate roof, a lantern, rails."),
 fig("At 2×: the join between the two tiles", B + "stage_a_join2x.png",
  "Pines give way to the cliff after the repair. Still visible: a faint vertical edge in the grass along x 1010, and a straight line across the cliff top at y 60 from my paste."),
 fig("At 2×: the mine entrance", B + "stage_a_mine2x.png",
  "The entrance sits in the cave mouth; its rails meet the cart track."),
])
page = f'''<meta charset="utf-8"><title>Silvanus map stage A</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width; pictures, measures, price, decision, scores. Lantern colours (D-028). */
:root {{ --bg:#141c17; --panel:#1d2820; --fg:#e6e2d3; --mute:#a9ae9c; --amber:#e8b04a; --ok:#7fb069; --part:#d9a441; --miss:#c46a5a; color-scheme:dark;
 --body:"Inter",system-ui,sans-serif; --head:"Space Grotesk","Inter",system-ui,sans-serif; }}
body {{ background:var(--bg); color:var(--fg); font:15px/1.5 var(--body); padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; margin:0; }}
main {{ max-width:440px; margin:0 auto; display:grid; gap:22px; }}
h1,h2,h3 {{ font-family:var(--head); text-wrap:balance; margin:0; }} h1 {{ font-size:24px; color:var(--amber); }} h2 {{ font-size:19px; }} h3 {{ font-size:16px; }}
p {{ margin:0; }} .mute {{ color:var(--mute); font-size:13px; }}
figure {{ margin:0; background:var(--panel); padding:12px; border-radius:6px; display:grid; gap:8px; min-width:0; }}
img.px {{ width:100%; max-width:412px; image-rendering:pixelated; display:block; }}
.scroll {{ overflow-x:auto; max-width:100%; }}
figcaption {{ font-size:14px; }}
table {{ border-collapse:collapse; font-size:13px; font-variant-numeric:tabular-nums; width:100%; }} td,th {{ padding:4px 6px; border-bottom:1px solid #2d3a30; text-align:left; }}
.chip {{ display:inline-block; padding:1px 7px; border-radius:10px; font-size:12px; font-weight:600; color:#141c17; white-space:nowrap; }}
.chip.m {{ background:var(--ok); }} .chip.p {{ background:var(--part); }} .chip.x {{ background:var(--miss); }}
details {{ border-bottom:1px solid #2d3a30; padding:6px 0; }} summary {{ cursor:pointer; display:flex; gap:6px; align-items:baseline; }}
summary .it {{ flex:1; min-width:0; font-size:14px; }} .why {{ font-size:13px; margin-top:4px; }}
.rec {{ border-left:3px solid var(--amber); padding-left:10px; }}
ol,ul {{ margin:0; padding-left:20px; display:grid; gap:6px; }}
</style>
<main>
<header style="display:grid;gap:8px"><h1>Building-block map: stage A</h1>
<p>Stage A is the top of the town, built from blocks: the ground painted empty in two tiles, joined, then the Hall, two cottages and a new mine entrance placed on it. 75 generations (about 77 approved); 1,672 left.</p>
<p><b>Answer first:</b> it holds together. The town side reads like mock-up 1, the mine entrance fits its cave, and the same ground gives day one. Still to fix: a faint edge where the two tiles join, a straight line across the cliff top, a faint line in the left tile, and cottage A's plot is wider than the cottage. Building the rest will likely cost more than the 375 cap (below).</p></header>
{figs}
<section style="display:grid;gap:8px"><h2>Measured</h2>
<div style="overflow-x:auto"><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Edge share</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr>
<tr><td>Stage A grown</td><td>46</td><td>0.36</td><td>0.197</td></tr>
<tr><td>Stage A ground only</td><td>47</td><td>0.35</td><td>0.168</td></tr></table></div>
<p class="mute">Brightness across the join (left / right, by 100-row band from the top): 33/40, 52/40, 48/48, 50/51, 65/47. The first two bands and the last compare different things (pines against cliff, the lamp-lit well against grass).</p></section>
<section style="display:grid;gap:8px"><h2>What happened on the way</h2>
<ul><li>The empty ground for the left tile was reused from the test, which saved 25.</li>
<li>The right tile's first restyle came out bright and plain (brightness 66), the same as stage 1's river tile. A retry with another seed and firmer wording worked (25 more). Tiles with a lot of river and cliff restyle weakly about half the time so far.</li>
<li>The join repair (18) blended the pines into the cliff; a free script then removed a 1 px line it left and evened the brightness.</li></ul></section>
<section style="display:grid;gap:8px"><h2>The rest of the map (my estimate)</h2>
<ul><li>4 more ground tiles at 25 (top-left, and the bottom row of 3): <b>100</b>, plus about 2 retries for the river tiles: <b>50</b>.</li>
<li>Guides: <b>about 8</b>. Joins: about 12 windows at 9: <b>about 108</b>.</li>
<li>Buildings: woodcutter's camp, 3 more cottage types, farm, fisher's hut, a workshop, two stalls: <b>about 55</b>.</li>
<li>Fixes (the cliff-top line, the left tile's line, cottage A): <b>about 27</b>.</li></ul>
<p><b>About 300–350 more.</b> With the 75 spent on stage A that is about 375–425, so over the 375 cap. My earlier count missed the river-tile retries and some joins.</p></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: carry on in stages with a new cap of 350 more.</b> Next stage: the top-left tile (forest gate, woodcutter's camp as an asset) and its join, plus the two straight-line fixes (about 60). I show you after each stage.</li>
<li><b>Carry on within the old cap</b> (300 more): I'd drop the bottom-row retries and leave weaker river tiles as they come.</li>
<li><b>Pause and try Codex</b> with a brief I write, then compare.</li></ol>
<p>Reply in chat with a number.</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items: stage A</h2>
<p class="mute">Two tiles of six, so items for the rest of the map are scored missed.</p>
<p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>'''
out.write_text(page)
print(tot)
