# Builds the building-block map stage B page (the whole top band). Usage: python3 docs/workshop/pages/build_stage_b.py <out.html>
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
B = "art/pixellab/blocks/"
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/stage_b_scores.json"))
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {c: 0 for c in "mpx"}; rows = []
for iid, v in d.items():
    tot[v[1]] += 1
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="chip {v[1]}">{names[v[1]]}</span></summary><p class="why">{html.escape(v[2])}</p></details>')
def fig(title, src, cap):
    return f'<figure><h3>{title}</h3><img class="px" src="{uri(src)}" alt="{html.escape(title)}"><figcaption>{cap}</figcaption></figure>'
scroll = f'''<figure><h3>Grown, at 1× (scroll sideways)</h3><div class="scroll"><img src="{uri(B + "stage_b.png")}" alt="Stage B at 1x" width="1408" height="512" style="image-rendering:pixelated;display:block;max-width:none"></div>
<figcaption>The whole top band at full size, 1408 × 512, as the map will scroll on the phone.</figcaption></figure>'''
figs = "".join([
 fig("Mock-up 1, the approved look", "art/pixellab/mock_hd/raw_1_heart.png", "The reference. Brightness 55, edge share 0.263."),
 fig("The whole top band, grown", B + "stage_b.png",
  "Map x 0–1408, y 0–512. Left to right: dense pines along the top; a fringe of grass, scattered pines, stumps and stones; the woodcutter's camp beside the forest road and its stone lantern gate; cottage A, the Hall on its walkway, the well and cottage B; the stepped stone mountain with the mine entrance and rails; the river coming out from behind the mountain on the far right. Brightness 50, edge share 0.184."),
 scroll,
 fig("The mountain: stage A (before)", B + "stage_a_mountain_old.png",
  "Smooth blue-grey cliff slabs with a flat grassy top, the river cutting between them."),
 fig("The mountain: now", B + "stage_b_mountain.png",
  "A big stepped stone mountain running off the top and right edges, ledges with moss and small pines, the timber mine entrance in its tunnel, rails down toward the town, boulders on the foothills; the river comes out from behind it on the far right. The stone reads a little like stacked blocks."),
 fig("The west: gate, woodcutter and fringe", B + "stage_b_west.png",
  "The new woodcutter's camp (lean-to with a mossy roof, log piles, chopping block with an axe, sawhorse) beside the forest road and gate. Below the forest, the fringe has pines, stumps and stones, but the stumps repeat and straight lines from my collage show along x 390 and y 400."),
 fig("Day one: the ground alone", B + "stage_b_ground_final.png",
  "The same band with no buildings: earth plots for the Hall, cottages and woodcutter, the arched tunnel in the mountain where the mine entrance goes. Brightness 50, edge share 0.164."),
 fig("At 3×: the west join (x 500)", B + "stage_b_joinL3x.png", "The road and pines carry across with no straight line."),
 fig("At 3×: the east join (x 1010)", B + "stage_b_joinR3x.png", "The forest meets the mountain's foot; a soft edge remains where the stone wall starts."),
])
page = f'''<meta charset="utf-8"><title>Silvanus map stage B</title>
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
<header style="display:grid;gap:8px"><h1>Building-block map: the top band</h1>
<p>You asked for the mine cliffs and the river fixed, and approved more for expanding. This stage redid the top-right tile with a proper mountain and the river moved to the far right, added the top-left tile with the forest gate and a new woodcutter's camp, and joined all three. 96 generations; 1,576 left; 254 left of the 350 you approved after stage A.</p>
<p><b>Answer first:</b> the mountain now reads as a mountain and the river no longer cuts through it. The whole top of the town holds together. Still wrong: straight lines and repeated stumps in the top-left fringe, a cottage roof left over at the bottom of the middle tile, and the right join shows a soft edge.</p></header>
{figs}
<section style="display:grid;gap:8px"><h2>Measured</h2>
<div style="overflow-x:auto"><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Edge share</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr>
<tr><td>Top band, grown</td><td>50</td><td>0.34</td><td>0.184</td></tr>
<tr><td>Top band, ground only</td><td>50</td><td>0.34</td><td>0.164</td></tr>
<tr><td>Mountain tile alone</td><td>52</td><td>0.29</td><td>0.164</td></tr>
<tr><td>Top-left tile alone</td><td>49</td><td>0.35</td><td>0.156</td></tr></table></div></section>
<section style="display:grid;gap:8px"><h2>Spent this stage: 96</h2>
<ul><li>Mountain tile: guide from round 1 candidate A's stepped cliffs, 2 redraws (2), restyle (25).</li>
<li>Top-left tile: 2 redraws (2; the first drew the forest as a walled block, so I rebuilt it by collage), restyle (25).</li>
<li>Woodcutter's camp asset (6).</li>
<li>Two joins, 2 repair windows each (36), plus free fixes.</li></ul></section>
<section style="display:grid;gap:8px"><h2>The rest (my estimate)</h2>
<ul><li>Bottom row, 3 ground tiles at 25 (75), plus 1–2 retries for the river and swamp tile (25–50).</li>
<li>Joins: 2 vertical in the bottom row (36) and the long one between the rows, about 6 windows (54).</li>
<li>Buildings: 3 more cottage types, farm, fisher's hut, a workshop, two stalls: about 49.</li>
<li>Fixes: the top-left lines and the leftover roof: about 36.</li></ul>
<p><b>About 280–310 more</b>, against 254 left under the cap.</p></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: carry on with the bottom row and raise the cap by 60</b> (410 in all since stage A). Next stage: the three bottom ground tiles and their two vertical joins, with the river, bridge, swamp, south road and fields (about 130). I show you after it.</li>
<li><b>Stay within the 254 left:</b> I skip the top-left line fixes and any retries; some parts stay plainer.</li>
<li><b>Pause here</b> and look at it on your phone first.</li></ol>
<p>Reply in chat with a number.</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items: the top band</h2>
<p class="mute">The top band of the map, so items for the south half are scored missed.</p>
<p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>'''
out.write_text(page)
print(tot)
