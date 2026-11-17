# Builds the target picture round 3 (reference restyle test) page from the tiles and target3_scores.json.
# Usage: python3 docs/workshop/pages/build_target3.py <out.html>
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
T = "art/pixellab/target3/"
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/target3_scores.json"))
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {c: 0 for c in "mpx"}
rows = []
for iid, v in d.items():
    tot[v[1]] += 1
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="chip {v[1]}">{names[v[1]]}</span></summary><p class="why">{html.escape(v[2])}</p></details>')
def fig(title, src, cap, alt=None):
    return f'<figure><h3>{title}</h3><img class="px" src="{uri(src)}" alt="{html.escape(alt or title)}"><figcaption>{cap}</figcaption></figure>'
figs = "".join([
 fig("Mock-up 1, the approved look", "art/pixellab/mock_hd/raw_1_heart.png",
  "The reference. Town heart at dusk: a stone Hall with a clock, a cobbled square with a well and two striped stalls, timber cottages with mossy slate roofs, lamp posts with small glows, mist between the trees, crows. Brightness 55, edge share 0.263."),
 fig("Round 2: the pixflux mine tile (the input)", "art/pixellab/target2/raw_mine.png",
  "A timber mine entrance cut into a tall cliff of smooth, bright blue rock with a grassy top and pines; a rutted track runs down-left; a shed lower right; a cart; the river top right. Plain green grass, no mist, no crows. Brightness 65, edge share 0.199."),
 fig("Round 3: the same tile restyled with mock-up 1 as the reference", T + "raw_mine_ref.png",
  "Same layout: building corner left, cliff, mine entrance, track, cart, shed, water top right, no bridge. The rock is now grey-blue and cracked with ivy and moss; mist lies over the cliff top and the water; seven crows, one on the mine roof; the shed gained a fenced flower garden and chimney smoke. The cliff top is a flat grassy plateau, so it reads as a mesa more than a mountain. Two small grassy islands in the water have plank sides. Brightness 54, edge share 0.233."),
 fig("At 3×: the mine entrance", T + "crop3x_mine_ref.png",
  "Slate roof with moss, timber posts with a gold trim line, a lantern box on each post, a dark opening, the track running in. Cracks, ivy and moss on the rock at mock-up 1's level of detail."),
 fig("At 3×: lamp, cart and track (bottom left)", T + "crop3x_ref.png",
  "Two defects. The lamp throws a large flat yellow disc over the grass and track, which mock-up 1 doesn't have, and which could be mistaken for a lot glow. A faint mark repeats evenly across the grass like a stamp."),
])
page = f'''<meta charset="utf-8"><title>Silvanus restyle test</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width; images in order mock-up 1, input, result, close-ups; then measures, decision, scores. Lantern colours (D-028). */
:root {{ --bg:#141c17; --panel:#1d2820; --fg:#e6e2d3; --mute:#a9ae9c; --amber:#e8b04a; --ok:#7fb069; --part:#d9a441; --miss:#c46a5a; color-scheme:dark;
 --body:"Inter",system-ui,sans-serif; --head:"Space Grotesk","Inter",system-ui,sans-serif; }}
body {{ background:var(--bg); color:var(--fg); font:15px/1.5 var(--body); padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; }}
main {{ max-width:440px; margin:0 auto; display:grid; gap:22px; }}
h1,h2,h3 {{ font-family:var(--head); text-wrap:balance; margin:0; }} h1 {{ font-size:24px; color:var(--amber); }} h2 {{ font-size:19px; }} h3 {{ font-size:16px; }}
p {{ margin:0; }} .mute {{ color:var(--mute); font-size:13px; }}
figure {{ margin:0; background:var(--panel); padding:12px; border-radius:6px; display:grid; gap:8px; }}
img.px {{ width:100%; max-width:412px; image-rendering:pixelated; display:block; }}
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
<header style="display:grid;gap:8px"><h1>Restyle test: the mine tile</h1>
<p>Round 2's pixflux tiles kept the layout but came out brighter and plainer than mock-up 1. This round tests <code>edit_image</code> in reference mode: it keeps a picture's layout and copies a reference picture's look onto it. Input: round 2's mine tile. Reference: mock-up 1. 25 generations, approved; 1,850 left.</p>
<p><b>Answer first:</b> it worked. The tile kept its layout and took on mock-up 1's grey rock, mist, crows and dusk grade; brightness and saturation now match mock-up 1. Two defects remain (flat lamp discs, a repeating grass mark), and joins between tiles are untested.</p></header>
{figs}
<section style="display:grid;gap:8px"><h2>Measured</h2>
<div style="overflow-x:auto"><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Edge share</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr>
<tr><td>Pixflux mine tile (round 2)</td><td>65</td><td>0.39</td><td>0.199</td></tr>
<tr><td>Restyled mine tile (round 3)</td><td>54</td><td>0.37</td><td>0.233</td></tr></table></div>
<p class="mute">Brightness: mean of R, G, B (0–255). Saturation: mean HSV saturation. Edge share: share of neighbouring pixel pairs (right and down) whose grey value differs by more than 12 levels, a rough measure of texture. Same method as round 2; it reproduces round 2's numbers exactly.</p></section>
<section style="display:grid;gap:8px"><h2>Whole map price (my estimate)</h2>
<p>About 1408 × 888, built in three passes. Prices are from PixelLab's tool docs, read today; the counts are my estimate.</p>
<ul><li>Layout guides: <code>create_image_pixflux</code>, 1 each, up to 400 × 400. 12 cover the map; 3 exist. 9 new plus redos: <b>about 15</b>.</li>
<li>Restyle: <code>edit_image</code> reference mode, 25 each, up to 512 × 512. 6 tiles (3 across, 2 down, overlapping). 150, plus 2 redos: <b>150–200</b>.</li>
<li>Join repairs: <code>inpaint_image_pro_flash</code>, 9 a 256 px window. 3 joins, about 14 windows: <b>about 126</b>.</li>
<li>Spot fixes (lamp discs, grass mark, islands, swamp, fisher's lot): <b>0–45</b>. I'd first try fixing the discs and the grass mark in the restyle wording, which costs nothing extra.</li></ul>
<p><b>Total: about 290–390 generations</b> of the 1,850 left (my earlier guess was 300–350). Then lots, glows, day one and the phone frame, which are free overlays.</p></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: build the whole map this way, in stages, capped at 390.</b> First stage: the top two neighbouring tiles and their join, about 75 generations, all reused in the map. I show you that join before spending the rest, because joins are the main risk.</li>
<li><b>One more single-tile test first</b> (25): the same restyle with wording to drop the lamp discs and the grass mark, before committing.</li>
<li><b>Accept the pixflux look</b> with a free colour grade: about 60–100, but plainer than mock-up 1 (round 2).</li>
<li><b>Keep C's scale</b> and only widen it: about 50; houses stay half mock-up 1's size.</li></ol>
<p>Reply in chat with a number, or anything else.</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items: the restyled tile</h2>
<p class="mute">One tile, so most town and lot items are out of its frame and scored missed. On the look items (L1–L10): this tile 5 met, 5 partly; round 2's three tiles 4 met, 6 partly.</p>
<p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>'''
out.write_text(page)
print(tot)
