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
 <header style="display:grid;gap:8px"><h1>The target map, two fix passes</h1>
<p>You asked for two passes of small, specific fixes: the buildings and lots, the harsh seams, the lamp posts that didn't match, every road working along its whole length, and nothing overlapping. 32 generations, within the 35 left under your cap; 1,265 left.</p>
<p><b>Answer first:</b> every road now leads somewhere, all the lamps match mock-up 1's, nothing overlaps, and the worst seams are softened. Two things I couldn't fix for free: the river above the bridge still looks like a straight-sided column, and the north-west forest is a shade darker than the town. 38 of 55 items met, 16 partly, 1 missed.</p></header>
 <div class="mapview" data-left="700"><img src="{uri(B + "dayone.png")}" alt="Day one map" width="1408" height="888"></div>
 <nav class="tabs"><button class="tab on"><img src="{uri(B + "tab_town.png")}" alt="">Town</button><button class="tab"><img src="{uri(B + "tab_people.png")}" alt="">People</button></nav>
</div>
<figcaption>412 px wide. The header uses the game's own words (town Ashwick, Hamlet, the date line at the start, the starting stock and caps; empty stores marked as the game marks them). The map scrolls both ways and opens on the Hall; it is shown at 1 art pixel per screen pixel here. The tab bar is 76 px with a picture over each label; only Town and People exist today. Glows and Build markers are drawn into the picture, not yet tappable.</figcaption></figure>'''
card = f'''<figure><h3>A board card with a picture header (sample)</h3><div class="card"><img src="{uri(B + "card_pic.png")}" alt=""><div class="cbody"><b>Card title</b><p class="mute">The board's cards come with M2e; this shows only the picture header, cut from the map's square in the same art.</p></div></div></figure>'''
figs = "".join([
 fig("Mock-up 1, the approved look", "art/pixellab/mock_hd/raw_1_heart.png", "The reference. Brightness 55, edge share 0.263."),
 fig("The finished map, grown", B + "grown.png", "1408 × 888. The forest and its lantern gate, the woodcutter's camp, the forager's turf hut, the Hall, the mountain and mine, the river past the mountain and under the bridge, the swamp; cottages in five designs along the lanes; the square with its well and two stalls; the farmhouse by the fields; the fisher's hut with its jetty and boat. Toward the edges: ruins (top-left corner), standing stones (west), a tar pit (south-west). Brightness 51, edge share 0.198."),
 scrollfig("Grown, at full size (scroll both ways)", B + "grown.png", "1408 × 888, 1 art pixel per screen pixel.", 600),
 phone,
 fig("Before and after: lamps (top before, bottom after)", B + "ba_lamps.png", "Before: three different lamp designs, each standing in a large flat circle of orange light. After: one lamp design throughout, a dark iron post with a small warm lantern as in mock-up 1, and the circles repainted as plain ground. The fenced plot now holds a cottage that sits inside its fence."),
 fig("Before and after: the forest road", B + "ba_road.png", "Before: the road from the forest gate ended under a cottage. After: that cottage moved off it, and the road runs on down to the High Street."),
 fig("Before and after: the bridge", B + "ba_bridge.png", "Before: grass on both sides of the bridge, no way onto it. After: a dirt path from the square's lane onto the west end, and one off the east end along the swamp's edge."),
 fig("Before and after: the river above the bridge", B + "ba_river.png", "Before: a pale, flat band of mist with a grey slab beside it. After: the water darkened to match the river below the bridge, the slab covered with grass. It still reads as a straight-sided column."),
 fig("Before and after: the top-left corner", B + "ba_corner.png", "Softened block edges round the ruins; still slightly lighter than the forest beside it."),
 fig("Day one", B + "dayone.png", "The Hall, mine, woodcutter's camp and one cottage built. Every other plot has a soft pale glow and an amber Build marker; three south plots are staked with rope, posts and a sign. Brightness 54, edge share 0.174."),
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
<tr><td>Finished map, grown</td><td>51</td><td>0.33</td><td>0.198</td></tr>
<tr><td>Day one</td><td>54</td><td>0.32</td><td>0.174</td></tr></table></div></section>
<section style="display:grid;gap:8px"><h2>The two passes</h2>
<p><b>Pass 1 (32 generations):</b></p>
<ul><li>One new lamp design from mock-up 1's lamp (5). Four small repaints remove the old lamps and their circles of light (21). One repaint carries the forest road on to the High Street (6).</li>
<li>Free: the edges of every earlier repair window softened (colour matched across each edge, the straight line broken up). Dirt paths onto both ends of the bridge and from the mine track to the square's lane. The cottage on the road end moved off it, the yard moved behind a cottage, and everything drawn in depth order so nothing overlaps.</li></ul>
<p><b>Pass 2 (free):</b> the line where the old and new road meet, the top-left corner's block edges, the river above the bridge darkened to match the water below, the grey slab covered, and a cottage placed inside the fenced plot so no fence crosses its gate.</p>
<p class="mute">Seam scan (straight edges 128 px or longer): 9,024 px before, 7,936 px after. It also counts real edges such as walls and the walkway, so it is a rough guide only.</p></section>
<section style="display:grid;gap:8px"><h2>Still not right</h2>
<ul><li>The river above the bridge: straight-sided, a repaint would fix it (about 9).</li>
<li>The north-west forest is darker than the town below; a faint edge round the top-left ruins.</li>
<li>The town is still (P11, animation, for the build sessions); three special sites missing; one dressed yard; no cobbled High Street.</li></ul></section>
<section class="rec" style="display:grid;gap:8px"><h2>What next</h2>
<ol><li><b>Recommended: approve this as the target picture.</b> Step 2 ends; step 3 starts in a new session, with the list above as its starting point.</li>
<li><b>Fix the river first</b>, about 9 generations, over the cap by about 6: one repaint of the river above the bridge.</li>
<li><b>Change something else:</b> tell me what.</li></ol>
<p>Reply in chat with a number.</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items: the finished map</h2>
<p><span class="chip m">{tot["m"]} met</span> <span class="chip p">{tot["p"]} partly</span> <span class="chip x">{tot["x"]} missed</span></p>{"".join(rows)}</section>
</main>
<script>document.querySelectorAll('[data-left]').forEach(e=>{{e.scrollLeft=+e.dataset.left;e.scrollTop=20;}});</script>'''
out.write_text(page)
print(tot)
