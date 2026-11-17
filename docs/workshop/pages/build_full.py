# Builds the whole block map page (stage C). Usage: python3 docs/workshop/pages/build_full.py <out.html>
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
B = "art/pixellab/blocks/"
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/full_scores.json"))
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {c: 0 for c in "mpx"}; rows = []
for iid, v in d.items():
    tot[v[1]] += 1
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="chip {v[1]}">{names[v[1]]}</span></summary><p class="why">{html.escape(v[2])}</p></details>')
def fig(title, src, cap):
    return f'<figure><h3>{title}</h3><img class="px" src="{uri(src)}" alt="{html.escape(title)}"><figcaption>{cap}</figcaption></figure>'
scroll = f'''<figure><h3>Grown, at 1× (scroll both ways)</h3><div class="scroll" style="max-height:520px;overflow:auto"><img src="{uri(B + "full_map.png")}" alt="The whole map at 1x" width="1408" height="888" style="image-rendering:pixelated;display:block;max-width:none"></div>
<figcaption>The whole map at full size, 1408 × 888.</figcaption></figure>'''
figs = "".join([
 fig("Mock-up 1, the approved look", "art/pixellab/mock_hd/raw_1_heart.png", "The reference. Brightness 55, edge share 0.263."),
 fig("The whole map, grown", B + "full_map.png",
  "1408 × 888. Top: dense pines, the forest gate and road, the woodcutter's camp, the Hall on its walkway, the stepped mountain with the mine entrance and rails, the river flowing down past the mountain. Middle: cottages along the High Street and lanes, the square with its well. Bottom: more cottages, an open fringe of dead trees and pines, the south road leaving the map, field beds, the river under an arched stone bridge, the swamp east of it. Two cottage designs repeat. Brightness 52, edge share 0.190."),
 scroll,
 fig("Phone view at 2× zoom, on the Hall", B + "full_phone2x.png",
  "What the phone would show zoomed in (2 screen pixels per art pixel, 206 art pixels wide): cottage A, the Hall with its clock tower and lit windows, the walkway, lamps."),
 fig("The river now flows past the mountain", B + "full_river.png",
  "The river comes in from the top edge, runs down the mountain's right side under mist and on toward the bridge; the mine entrance sits in the mountain with rails toward the town."),
 fig("The south-west", B + "full_southwest.png",
  "Cottages along the High Street with lamps and fences, a fenced plot with bare trees, and the open south fringe of dead trees, pines and stumps. A faint straight line shows along y 512 on the left, where the top band meets the bottom row."),
 fig("Day one: the ground alone", B + "full_ground_final.png",
  "The same map with no buildings: earth plots where each building stands when built. Two buildings were painted into the ground by the restyle and need removing: a cottage left of the square's lane and a timber frame by the fields. Brightness 53, edge share 0.162."),
])
page = f'''<meta charset="utf-8"><title>Silvanus whole map</title>
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
<header style="display:grid;gap:8px"><h1>Building-block map: the whole town</h1>
<p>You liked the mine, asked for the river not to be cut off, and said to keep building. This stage freed the river, built the bottom row (west, middle, east) and joined everything into one map, then placed the buildings. 133 generations; 1,443 left; 181 left under the raised cap.</p>
<p><b>Answer first:</b> the whole town now exists as one map in mock-up 1's mood, with the river flowing past the mountain. Still wrong: only two cottage designs (they repeat), two buildings the restyle painted into the ground, a faint line on the left between the rows, and the top-left's collage lines. Lots, glows and the phone frame are not drawn yet.</p></header>
{figs}
<section style="display:grid;gap:8px"><h2>Measured</h2>
<div style="overflow-x:auto"><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Edge share</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr>
<tr><td>Whole map, grown</td><td>52</td><td>0.33</td><td>0.190</td></tr>
<tr><td>Whole map, ground only</td><td>53</td><td>0.33</td><td>0.162</td></tr></table></div></section>
<section style="display:grid;gap:8px"><h2>Spent this stage: 133</h2>
<ul><li>River fix: 2 masked repair windows (18).</li>
<li>Bottom row: 4 pixflux redraws of my guide (4) came out in a bright, flat farm-game style, so I didn't use them; the three tiles were restyled straight from my hand-edited guide instead (75).</li>
<li>Bottom-row joins: 4 repair windows (36), plus free fixes and a free grade.</li>
<li>Buildings placed again for free: the cottages reuse the two designs.</li></ul></section>
<section style="display:grid;gap:8px"><h2>To finish the target picture (my estimate)</h2>
<ul><li>Fixes: remove the two painted-in buildings (18), the line between the rows on the left (18), the top-left collage lines (27).</li>
<li>Buildings: 3 more cottage types (18), a farmhouse (9), a fisher's hut and jetty (11), two market stalls (10), a forager's hut (6).</li>
<li>Free: lot glows, the Build marker, staked future lots, the phone frame.</li></ul>
<p><b>About 117–130</b>, within the 181 left.</p></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: a finishing stage (about 125).</b> The fixes and new buildings above, then the free overlays, then I ask you to approve it as the target picture.</li>
<li><b>Approve it now as the target picture</b> and leave the finishing to the build sessions (step 4).</li>
<li><b>Pause here</b> and look at it on your phone first.</li></ol>
<p>Reply in chat with a number.</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items: the whole map</h2>
<p class="mute">The whole map; lots, glows and the screen are not drawn yet.</p>
<p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>'''
out.write_text(page)
print(tot)
