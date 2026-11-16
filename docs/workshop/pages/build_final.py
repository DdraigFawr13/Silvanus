# Builds the finished target-picture page: the block map grown and on day one, the phone screen,
# tiers, the square's stages, special sites, and all 55 scores (final_scores.json).
# Usage: python3 docs/workshop/pages/build_final.py <out.html>
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
B = "art/pixellab/blocks/"
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/final_scores.json"))
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {c: 0 for c in "mpx"}; rows = []
for iid, v in d.items():
    tot[v[1]] += 1
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="chip {v[1]}">{names[v[1]]}</span></summary><p class="why">{html.escape(v[2])}</p></details>')
def fig(title, src, cap):
    return f'<figure><h3>{title}</h3><img class="px" src="{uri(src)}" alt="{html.escape(title)}"><figcaption>{cap}</figcaption></figure>'
def scrollfig(title, src, cap, left):
    return f'''<figure><h3>{title}</h3><div class="scroll" data-left="{left}"><img src="{uri(src)}" alt="{html.escape(title)}" width="1408" height="888" style="image-rendering:pixelated;display:block;max-width:none"></div><figcaption>{cap}</figcaption></figure>'''
# stock from packages/content/src/index.ts start values and caps; empty stock is marked as the game does
stock = [("food", "Food", 40, 200), ("wood", "Wood", 60, 200), ("stone", "Stone", 0, 200), ("ore", "Ore", 0, 100), ("tools", "Tools", 0, 50)]
cells = "".join(f'<div class="cell{" warn" if n == 0 else ""}"><span class="lab"><img src="{uri(B + "icon_" + k + ".png")}" alt="">{lab}{" · empty" if n == 0 else ""}</span><span class="num">{n} <small>/ {cap}</small></span></div>' for k, lab, n, cap in stock)
phone = f'''<figure><h3>The Town tab on the phone, day one</h3>
<div class="phone">
 <header class="top"><h1 class="town-name">Ashwick</h1><p class="town-sub"><b>Hamlet</b> · Year 1, season 1, day 1, hour 0</p><div class="stock">{cells}</div></header>
 <div class="mapview" data-left="700"><img src="{uri(B + "dayone.png")}" alt="Day one map" width="1408" height="888"></div>
 <nav class="tabs"><button class="tab on"><img src="{uri(B + "tab_town.png")}" alt="">Town</button><button class="tab"><img src="{uri(B + "tab_people.png")}" alt="">People</button></nav>
</div>
<figcaption>412 px wide. The header uses the game's own words (town Ashwick, Hamlet, the date line at the start, the starting stock and caps; empty stores marked as the game marks them). The map scrolls both ways and opens on the Hall; it is shown at 1 art pixel per screen pixel here. The tab bar is 76 px with a picture over each label; only Town and People exist today. Glows and Build markers are drawn into the picture, not yet tappable.</figcaption></figure>'''
card = f'''<figure><h3>A board card with a picture header (sample)</h3><div class="card"><img src="{uri(B + "card_pic.png")}" alt=""><div class="cbody"><b>Card title</b><p class="mute">The board's cards come with M2e; this shows only the picture header, cut from the map's square in the same art.</p></div></div></figure>'''
figs = "".join([
 fig("Mock-up 1, the approved look", "art/pixellab/mock_hd/raw_1_heart.png", "The reference. Brightness 55, edge share 0.263."),
 fig("The finished map, grown", B + "grown.png", "1408 × 888. The forest and its lantern gate, the woodcutter's camp, the forager's turf hut, the Hall, the mountain and mine, the river past the mountain and under the bridge, the swamp; cottages in five designs along the lanes; the square with its well and two stalls; the farmhouse by the fields; the fisher's hut with its jetty and boat. Toward the edges: ruins (top-left corner), standing stones (west), a tar pit (south-west). Brightness 52, edge share 0.196."),
 scrollfig("Grown, at full size (scroll both ways)", B + "grown.png", "1408 × 888, 1 art pixel per screen pixel.", 600),
 phone,
 fig("Day one", B + "dayone.png", "The Hall, mine, woodcutter's camp and one cottage built. Every other plot has a soft pale glow and an amber Build marker; three south plots are staked with rope, posts and a sign. Brightness 54, edge share 0.172."),
 fig("A built lot, tapped", B + "tapped.png", "Cottage A by the Hall, tapped: a lamp-amber glow round it. Untapped built lots show nothing."),
 fig("Upgrades: cottage A at tiers 1, 2 and 3", B + "tiers_row.png", "Tier 2: stone footing, window boxes, a lean-to, a fenced front yard. Tier 3: bigger, a second storey, a hedge, a garden, lanterns by the gate."),
 fig("The square's stages", B + "square_row.png", "Well only; then two striped stalls; then stalls and a fountain beside the well (D-042 is still Proposed)."),
 fig("Special sites toward the edges", B + "sites_row.png", "Old ruins, standing stones, a tar pit. Not made yet: the sunken bog, salt spring, bat caves."),
 card,
])
page = f'''<meta charset="utf-8"><title>Silvanus target map</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width. Page in the lantern colours; the phone mock uses docs/UI_STYLE.md tokens. */
:root {{ --bg:#162120; --panel:#1f2e2c; --line:#2f4541; --line-strong:#3d5853; --ink:#e6e3d6; --head:#f0d9a4; --muted:#9fb0a4; --act:#d9a441; --act-ink:#1a1608; --fine:#8fbf8a; --warn:#ef8a62; --r:10px; --r-page:14px;
 --ok:#7fb069; --part:#d9a441; --miss:#c46a5a; color-scheme:dark; --body:"Alegreya Sans","Inter",system-ui,sans-serif; --disp:"Alegreya SC",Georgia,serif; }}
body {{ background:var(--bg); color:var(--ink); font:15px/1.5 var(--body); padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; margin:0; }}
main {{ max-width:440px; margin:0 auto; display:grid; gap:22px; }}
h1,h2,h3 {{ font-family:var(--disp); text-wrap:balance; margin:0; color:var(--head); }} main>header h1 {{ font-size:24px; }} h2 {{ font-size:19px; }} h3 {{ font-size:16px; }}
p {{ margin:0; }} .mute {{ color:var(--muted); font-size:13px; }}
figure {{ margin:0; background:var(--panel); padding:12px; border-radius:6px; display:grid; gap:8px; min-width:0; }}
img.px {{ width:100%; max-width:412px; image-rendering:pixelated; display:block; }}
.scroll {{ overflow:auto; max-height:420px; max-width:100%; }}
figcaption {{ font-size:14px; }}
table {{ border-collapse:collapse; font-size:13px; font-variant-numeric:tabular-nums; width:100%; }} td,th {{ padding:4px 6px; border-bottom:1px solid var(--line); text-align:left; }}
.chip {{ display:inline-block; padding:1px 7px; border-radius:10px; font-size:12px; font-weight:700; color:#141c17; white-space:nowrap; }}
.chip.m {{ background:var(--ok); }} .chip.p {{ background:var(--part); }} .chip.x {{ background:var(--miss); }}
details {{ border-bottom:1px solid var(--line); padding:6px 0; }} summary {{ cursor:pointer; display:flex; gap:6px; align-items:baseline; }}
summary .it {{ flex:1; min-width:0; font-size:14px; }} .why {{ font-size:13px; margin-top:4px; }}
.rec {{ border-left:3px solid var(--act); padding-left:10px; }}
ol,ul {{ margin:0; padding-left:20px; display:grid; gap:6px; }}
.phone {{ width:100%; max-width:412px; height:760px; margin:0 auto; background:var(--bg); border:1px solid var(--line-strong); border-radius:var(--r-page); overflow:hidden; display:grid; grid-template-rows:auto 1fr 76px; }}
.phone .top {{ padding:10px 14px 8px; display:grid; gap:4px; border-bottom:1px solid var(--line); }}
.town-name {{ font-size:26px; letter-spacing:.03em; font-weight:700; }} .town-sub {{ font-size:14px; color:var(--muted); }} .town-sub b {{ color:var(--fine); font-weight:700; }}
.stock {{ display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-top:4px; }}
.cell {{ background:var(--panel); border:1px solid var(--line); border-radius:var(--r); padding:4px 6px; display:grid; min-width:0; }}
.cell .lab img {{ width:16px; height:16px; image-rendering:pixelated; vertical-align:-3px; margin-right:3px; }}
.cell .num {{ white-space:nowrap; }}
.cell .lab {{ font-size:12px; color:var(--muted); line-height:1.25; }} .cell .num {{ font-size:17px; font-weight:700; font-variant-numeric:tabular-nums; }}
.cell .num small {{ font-size:11px; color:var(--muted); font-weight:400; }} .cell.warn .lab, .cell.warn .num {{ color:var(--warn); }}
.mapview {{ overflow:auto; }} .mapview img {{ display:block; max-width:none; image-rendering:pixelated; }}
.tabs {{ display:grid; grid-template-columns:repeat(2,1fr); border-top:1px solid var(--line); background:var(--panel); }}
.tab {{ all:unset; display:grid; justify-items:center; align-content:center; gap:2px; font:700 15px var(--body); color:var(--muted); }}
.tab img {{ width:40px; height:40px; image-rendering:pixelated; object-fit:contain; }} .tab.on {{ color:var(--act); box-shadow:inset 0 3px 0 var(--act); }}
.card {{ border:1px solid var(--line); border-radius:var(--r); overflow:hidden; }} .card img {{ width:100%; display:block; image-rendering:pixelated; }} .cbody {{ padding:10px 12px; display:grid; gap:4px; }}
</style>
<main>
<header style="display:grid;gap:8px"><h1>The target map, finished</h1>
<p>You said to finish the map, then get more of the checklist ticked. This stage removed the two buildings the restyle had painted in, repainted the top-left fringe, added eleven new buildings and pieces, three special sites and the resource icons, and drew everything else free: day one with lot glows, Build markers and staked lots, a tapped glow, the square's stages, and the phone screen. 146 generations; 1,297 left; 35 left under the cap.</p>
<p><b>Answer first:</b> 38 of the 55 items are now met (24 before), 16 partly, 1 missed (the town doesn't move yet). If it looks right to you, this is the target picture, and step 2 ends with your approval.</p></header>
{figs}
<section style="display:grid;gap:8px"><h2>Measured</h2>
<div style="overflow-x:auto"><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Edge share</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr>
<tr><td>Finished map, grown</td><td>52</td><td>0.33</td><td>0.196</td></tr>
<tr><td>Day one</td><td>54</td><td>0.32</td><td>0.172</td></tr></table></div></section>
<section style="display:grid;gap:8px"><h2>Spent this stage: 146</h2>
<ul><li>Repairs, 4 inpaint windows (36): the painted-in cottage and timber frame removed; the top-left fringe repainted (its lines and repeated stumps gone).</li>
<li>Buildings (46): 3 cottage designs, a farmhouse, a fisher's hut with jetty, a forager's hut, two stalls.</li>
<li>More checklist items (39): cottage A at tiers 2 and 3, a dressed yard, standing stones, ruins, a tar pit, a fountain.</li>
<li>Resource icons (25): wood, food, stone, ore, tools.</li>
<li>Free: placing, glows, Build markers, staked lots, the tapped glow, the square's stages, the phone screen.</li></ul></section>
<section style="display:grid;gap:8px"><h2>Still not right</h2>
<ul><li>The town is still: residents walking, smoke and scaffolding are animation (P11), for the build sessions.</li>
<li>The north-west fringe is darker than the town below it; a faint seam where the river repair meets the mountain.</li>
<li>Three special sites missing (sunken bog, salt spring, bat caves); only one dressed yard; no cobbled High Street.</li>
<li>Ground plainer than mock-up 1 (edge share 0.172 on day one against 0.263).</li></ul></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: approve this as the target picture.</b> Step 2 ends; step 3 (testing two ways to build it into the game) starts in a new session, and the items above become its list.</li>
<li><b>One more art pass</b> within the 35 left: the three missing sites (about 15) and two more dressed yards (12).</li>
<li><b>Change something first:</b> tell me what.</li></ol>
<p>Reply in chat with a number.</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items: the finished map</h2>
<p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>
<script>document.querySelectorAll('[data-left]').forEach(e=>{{e.scrollLeft=+e.dataset.left;e.scrollTop=20;}});</script>'''
out.write_text(page)
print(tot)
