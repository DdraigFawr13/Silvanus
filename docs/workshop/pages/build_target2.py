# Builds the target picture round 2 (3-tile scale test) page from the tiles and target2_scores.json.
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
T = "art/pixellab/target2/"
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/target2_scores.json"))
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {c: 0 for c in "mpx"}
rows = []
for iid, v in d.items():
    tot[v[1]] += 1
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="chip {v[1]}">{names[v[1]]}</span></summary><p class="why">{html.escape(v[2])}</p></details>')
tiles = [
 ("mine", "Mine corner", "Guide: C blown up 2×, with the cliff moved over the river, a dirt track painted from the mine to the town and the river moved to the right edge (rough, made by me).",
  "Result: a timber-framed mine entrance cut into a tall blue-grey cliff, a rutted track running down-left to the Hall's corner, a cart on its side and a small cart on the track, a small lit shed lower right, the river at the top right beyond the cliff. No bridge. Cliffs are smooth and bright blue, unlike mock-up 1's grey rock. Strength 80 (keeps the composition only)."),
 ("hall", "Hall and square", "Guide: C blown up 2×, Hall to well.",
  "Result: the Hall with a clock, lit windows and a walkway straight down to the well; lamps with yellow light pools. The Hall's stones gained a yellow rim that reads like a glowing outline. The pines behind the Hall became a dark grey smudge. Two stalls became one pink umbrella. Strength 110."),
 ("sw", "South-west lane", "Guide: C blown up 2×, the bottom-left corner.",
  "Result: five cottages with mossy roofs and blue walls facing curving lanes, lamps with large orange light pools, a dead tree, a fence, pines along the bottom. Cleanest of the three, but roofs are two-tone blobs and walls are flat. Strength 110."),
]
figs = ""
for k, title, gcap, rcap in tiles:
    figs += f'''<figure><h3>{title}</h3><img class="px" src="{uri(T+f"tile_{k}_guide.png")}" alt="{title} guide"><figcaption class="mute">{gcap}</figcaption>
<img class="px" src="{uri(T+f"raw_{k}.png")}" alt="{title} result"><figcaption>{rcap}</figcaption></figure>'''
page = f'''<title>Silvanus target scale test</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width; each tile's guide over its result, scores below. Lantern colours (D-028). */
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
ol {{ margin:0; padding-left:20px; display:grid; gap:6px; }}
</style>
<main>
<header style="display:grid;gap:8px"><h1>Twice the size: tile test</h1>
<p>You picked C and asked for it about twice as big and wider (about 1408 × 888), with the mine on the town's side of the river and no bridge to it. This tests one way to get there: blow C up 2× and redraw it tile by tile with <code>create_image_pixflux</code>, which redraws a picture you give it. 3 generations, approved; 1,875 left.</p>
<p><b>Answer first:</b> the mine fix worked, but the tiles drifted from mock-up 1's look. They are brighter, with less texture and no mist, so I don't recommend building the whole map this way.</p></header>
<figure><h3>Mock-up 1, the approved look</h3><img class="px" src="{uri("art/pixellab/mock_hd/raw_1_heart.png")}" alt="Mock-up 1"></figure>
{figs}
<section style="display:grid;gap:8px"><h2>Measured</h2>
<div style="overflow-x:auto"><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Edge share</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr><tr><td>C</td><td>53</td><td>0.38</td><td>0.290</td></tr>
<tr><td>Mine tile</td><td>65</td><td>0.39</td><td>0.199</td></tr><tr><td>Hall tile</td><td>67</td><td>0.38</td><td>0.213</td></tr><tr><td>South-west tile</td><td>59</td><td>0.41</td><td>0.191</td></tr></table></div>
<p class="mute">Brightness: mean of R, G, B (0–255). Edge share: share of neighbouring pixel pairs that differ by more than 12 levels, a rough measure of texture.</p></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: test the pro restyle tool.</b> <code>edit_image</code> in reference mode keeps a picture's layout and copies another picture's look onto it. Input: the mine tile above (its layout is right). Reference: mock-up 1. Cost: 25 generations. If it holds mock-up 1's texture, the whole map would be about 10–12 tiles at 25 each plus seam repairs, roughly 300–350 generations (my estimate). I'd ask before that.</li>
<li><b>Accept this look.</b> I grade the colours down to mock-up 1's for free and build the rest with this tool: about 12 more tiles at 1 each plus seam repairs at 9 each, roughly 60–100 generations. It's cheaper but plainer than mock-up 1.</li>
<li><b>Keep C's scale.</b> Fix the mine and add width at both sides by masked repaint at 9 generations a window, about 50. Houses stay half mock-up 1's size.</li></ol></section>
<section style="display:grid;gap:4px"><h2>All 55 items: the three tiles</h2><p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>'''
out.write_text(page)
print(tot)
