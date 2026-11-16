# Builds the building-block test page (ground painted empty, buildings as separate assets).
# Usage: python3 docs/workshop/pages/build_blocks.py <out.html>
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
B = "art/pixellab/blocks/"
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/blocks_scores.json"))
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {c: 0 for c in "mpx"}; rows = []
for iid, v in d.items():
    tot[v[1]] += 1
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="chip {v[1]}">{names[v[1]]}</span></summary><p class="why">{html.escape(v[2])}</p></details>')
def fig(title, src, cap, cls="px"):
    return f'<figure><h3>{title}</h3><img class="{cls}" src="{uri(src)}" alt="{html.escape(title)}"><figcaption>{cap}</figcaption></figure>'
figs = "".join([
 fig("Mock-up 1, the approved look", "art/pixellab/mock_hd/raw_1_heart.png",
  "The reference. Brightness 55, edge share 0.263."),
 fig("Before: one painted picture (stage 1's Hall tile)", "art/pixellab/map3/raw_T1.png",
  "Buildings painted into the ground. Mist, crows, mossy roofs, small lamp glows. Brightness 51, edge share 0.219. The buildings can't be added, upgraded or tapped separately."),
 fig("Day one: the ground alone", B + "raw_ground.png",
  "The same corner restyled with no buildings: dense pines along the top with a mist line, two plots of worn earth with stones and debris, dirt paths, fences, lamps, the woodcutter's sign board, the walkway and the well. No light discs on the ground. Two straight lines left from my guide paste show along y 400 and x 112. Brightness 48, edge share 0.181."),
 fig("The three buildings, made separately", B + "assets_row.png",
  "Each made from a mock-up 1 crop. Hall: stone, mossy slate, clock tower and a second clock over the door, lit arched windows, hanging lanterns; a cross on the spire and a small gravestone at its foot. Cottage A: mossy slate, timber front, two lit windows with flower boxes. Cottage B: half-timbered plaster gable, wall lantern."),
 fig("Grown: the buildings placed on the ground", B + "placed.png",
  "Hall door on the walkway, cottage A's door on its path, cottage B by the lane. Free passes only: each asset's own ground patch dropped, a soft contact shadow, a light colour grade. Cottage A is narrower than its plot, so bare earth shows either side. Brightness 48, edge share 0.225."),
 fig("At 2×: the Hall's base", B + "crop2x_hall.png",
  "The steps meet the walkway; the painted ground shows under the walls with no patch edge. The gravestone is mostly hidden by the patch removal; the cross on the spire stays."),
 fig("At 2×: cottage A", B + "crop3x_cottage.png",
  "Sits on its earth plot with a shadow; two small yellow-green corners remain at its base; earth either side because the cottage is narrower than the plot."),
])
page = f'''<meta charset="utf-8"><title>Silvanus block test</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width; images, then measures, price, decision, scores. Lantern colours (D-028). */
:root {{ --bg:#141c17; --panel:#1d2820; --fg:#e6e2d3; --mute:#a9ae9c; --amber:#e8b04a; --ok:#7fb069; --part:#d9a441; --miss:#c46a5a; color-scheme:dark;
 --body:"Inter",system-ui,sans-serif; --head:"Space Grotesk","Inter",system-ui,sans-serif; }}
body {{ background:var(--bg); color:var(--fg); font:15px/1.5 var(--body); padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; margin:0; }}
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
<header style="display:grid;gap:8px"><h1>Building blocks: test</h1>
<p>You asked to try building blocks again: paint the ground, add the buildings as separate PixelLab assets, then smooth the janky spots. This tests it on the Hall corner. 47 generations (about 45 approved); 1,747 left.</p>
<p><b>Answer first:</b> it works better than the painted picture. The buildings match mock-up 1 closely, sit on the ground without visible patches, and the same art gives day one (empty plots) and grown. Left to fix: a cross and gravestone on the Hall, cottage A narrower than its plot, two straight lines in the ground from my paste.</p></header>
{figs}
<section style="display:grid;gap:8px"><h2>Measured</h2>
<div style="overflow-x:auto"><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Edge share</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr>
<tr><td>Painted picture (stage 1 Hall tile)</td><td>51</td><td>0.35</td><td>0.219</td></tr>
<tr><td>Ground alone</td><td>48</td><td>0.36</td><td>0.181</td></tr>
<tr><td>Ground with buildings</td><td>48</td><td>0.37</td><td>0.225</td></tr></table></div>
<p class="mute">Same method as the earlier rounds: brightness is the mean of R, G, B; edge share is the share of neighbouring pixel pairs that differ by more than 12 levels.</p></section>
<section style="display:grid;gap:8px"><h2>Whole map this way (my estimate)</h2>
<ul><li>Empty-ground guide: I remove the buildings from stage 1's guide for free, then pixflux redraws the plots: <b>about 12</b>.</li>
<li>Ground restyle: 6 tiles at 25: <b>150</b>. Stage 1's two tiles have buildings painted in, so they are redone.</li>
<li>Ground joins: up to 14 windows at 9: <b>90–126</b>. The ground has fewer hard edges than buildings, so likely fewer.</li>
<li>Buildings for the target picture: the Hall and 2 cottages are done; about 4 more cottage types, the mine entrance, woodcutter's camp, farm, fisher's hut and a workshop at 6–9 each: <b>about 60</b>.</li>
<li>Base repairs where the free passes aren't enough: <b>0–27</b>.</li></ul>
<p><b>Total: about 310–375 more.</b> So far today: 25 (round 3) + 56 (stage 1) + 47 (this test) = 128.</p></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: build the target picture this way, capped at 375, in stages.</b> First stage: the ground for the top-middle and top-right tiles and their join, plus the mine entrance as an asset (about 77), with the Hall and cottages placed. I show you that before the rest, and I fix the cross, the gravestone and cottage A's size there for free.</li>
<li><b>Keep the painted picture</b> (stage 1's join, about 18) for the target, and make buildings as assets later for the game.</li>
<li><b>Also write the Codex brief</b> alongside either, at no generation cost.</li></ol>
<p>Reply in chat with a number.</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items: the test patch</h2>
<p class="mute">One patch, so most of the map's items are out of its frame and scored missed.</p>
<p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>'''
out.write_text(page)
print(tot)
