# Builds the target picture round 1 review page from the images and target1_scores.json.
import base64, json, html, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[3]
out = pathlib.Path(sys.argv[1])
def uri(p): return "data:image/png;base64," + base64.b64encode((root / p).read_bytes()).decode()
d = json.load(open(root / "docs/workshop/pages/target1_scores.json"))
cap = {
 "a": "Seed 101. Hall with clock tower right of centre, a round cobbled square with a well and stalls below it. Straight dirt streets in a grid, cottages in rows. Two lit timber gates into the forest at the top left with the woodcutter's logs between them. Grey cliffs off the top right with a mine tunnel and cart, a plank bridge over the river, a stone bridge lower down. Fenced field and crows at the lower right. Dense pines down the left edge.",
 "b": "Seed 202. Hall right of centre, flagstone walkway to a square with a well and two stalls. A lit stone gatehouse at the top, woodcutter's logs and a fire to its left. Rows of matching cottages on straight streets. Mountain and mine top right with a jetty, a misty pool right of the river, fenced gardens lower right. A pine row closes the whole bottom edge.",
 "c": "Seed 303. Hall right of centre, a lamp-lit cobbled walkway straight down to a square with a well and three stalls. Curving dirt streets with warm lamp pools; cottages at uneven spacing with gardens. A stone arch with two lanterns at the top left, the road through it, the woodcutter's sawhorse and logs beside it. Cliffs off the top right, mine with a cart, a plank bridge over the river, a jetty and a stone bridge. A stray stream at the upper left. Pines fill the bottom middle; roads leave at two points.",
}
names = {"m": "met", "p": "partly", "x": "missed"}
tot = {k: {c: 0 for c in "mpx"} for k in "abc"}
rows = []
for iid, v in d.items():
    cells = ""
    for i, k in enumerate("abc"):
        s, r = v[1 + 2 * i], v[2 + 2 * i]
        tot[k][s] += 1
        cells += f'<li><span class="chip {s}">{k.upper()} {names[s]}</span> {html.escape(r)}</li>'
    chips = "".join(f'<span class="dot {v[1+2*i]}" title="{k.upper()}">{k.upper()}</span>' for i, k in enumerate("abc"))
    rows.append(f'<details><summary><b>{iid}</b> <span class="it">{html.escape(v[0])}</span><span class="dots">{chips}</span></summary><ul>{cells}</ul></details>')
def card(k, title):
    t = tot[k]
    return f'''<figure id="cand-{k}"><h3>{title}</h3><img class="px" src="{uri(f"art/pixellab/target1/raw_{k}.png")}" alt="Candidate {k.upper()}">
<figcaption>{cap[k]}</figcaption><p class="score"><span class="chip m">{t["m"]} met</span> <span class="chip p">{t["p"]} partly</span> <span class="chip x">{t["x"]} missed</span> of 55</p></figure>'''
page = f'''<title>Silvanus target picture</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width; pictures at 412 px, scores below. Lantern colours (D-028). */
:root {{ --bg:#141c17; --panel:#1d2820; --fg:#e6e2d3; --mute:#a9ae9c; --amber:#e8b04a; --ok:#7fb069; --part:#d9a441; --miss:#c46a5a; color-scheme:dark;
 --body:"Inter",system-ui,sans-serif; --head:"Space Grotesk","Inter",system-ui,sans-serif; }}
body {{ background:var(--bg); color:var(--fg); font:15px/1.5 var(--body); padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; }}
main {{ max-width:440px; margin:0 auto; display:grid; gap:22px; }}
h1,h2,h3 {{ font-family:var(--head); text-wrap:balance; margin:0; }} h1 {{ font-size:24px; color:var(--amber); }} h2 {{ font-size:19px; }} h3 {{ font-size:16px; margin-bottom:8px; }}
p {{ margin:0; }} .mute {{ color:var(--mute); font-size:13px; }}
figure {{ margin:0; background:var(--panel); padding:12px; border-radius:6px; display:grid; gap:8px; }}
img.px {{ width:100%; max-width:412px; image-rendering:pixelated; display:block; }}
figcaption {{ font-size:14px; }}
.chip {{ display:inline-block; padding:1px 7px; border-radius:10px; font-size:12px; font-weight:600; color:#141c17; }}
.chip.m,.dot.m {{ background:var(--ok); }} .chip.p,.dot.p {{ background:var(--part); }} .chip.x,.dot.x {{ background:var(--miss); }}
details {{ border-bottom:1px solid #2d3a30; padding:6px 0; }} summary {{ cursor:pointer; display:flex; gap:6px; align-items:baseline; }}
summary .it {{ flex:1; min-width:0; font-size:14px; }} .dots {{ display:flex; gap:3px; }}
.dot {{ font-size:10px; font-weight:700; color:#141c17; width:18px; text-align:center; border-radius:3px; }}
ul {{ margin:6px 0 0; padding-left:0; list-style:none; display:grid; gap:4px; font-size:13px; }}
.rec {{ border-left:3px solid var(--amber); padding-left:10px; }}
ol {{ margin:0; padding-left:20px; display:grid; gap:4px; }}
</style>
<main>
<header style="display:grid;gap:8px"><h1>Target picture, round 1</h1>
<p>Three whole-town tries in mock-up 1's mood, shown at 412 px wide, the width of your phone. Each is scored on all 55 checklist items before you see it. 3 PixelLab generations used (<code>create_image_pixen</code>, 588 × 444, mock-up 1's wording plus the D-047 layout); 1,878 left.</p>
<p class="mute">Lots, the pale and gold glows, day one and the phone frame are not drawn yet. They come in round 2, on the one you pick, which is why P1–P4, P7 and S2–S5 score "missed" on all three.</p></header>
<figure><h3>Mock-up 1, the approved look</h3><img class="px" src="{uri("art/pixellab/mock_hd/raw_1_heart.png")}" alt="Mock-up 1"><figcaption>512 × 512, the town heart only. Houses are drawn bigger here than in the whole-town tries.</figcaption></figure>
{card("a","A")}
{card("b","B")}
{card("c","C")}
<section class="rec" style="display:grid;gap:8px"><h2>Recommendation: C</h2>
<p>C scores best: 21 met, against 16 for A and 15 for B. It is the only one with curving streets (T6, T7), the lantern gate and woodcutter where you asked (M6) and the Hall, walkway and square in line with lamps. What C still gets wrong: no swamp (M9), no fisher's lot (M10), pines across the bottom middle (M11), a stray stream at the upper left, and houses smaller than mock-up 1's (L3).</p>
<p><b>Round 2 on your pick:</b></p>
<ol><li>Fix the south edge and add the swamp and fisher's lot by masked repaint (<code>inpaint_image_pro_flash</code>, 9 generations a window, about 3 windows, about 27).</li>
<li>Make day one: the same picture with most houses repainted as open grass (about 3–4 windows, 27–36).</li>
<li>Free, drawn in code: lot outlines, the pale glow on empty lots, the gold glow on one tapped lot, the Build marker, and the phone frame (header, now bar, tab bar) at 412 px.</li></ol>
<p class="mute">Estimate for round 2: about 54–63 generations (my estimate from the 9-per-window price; I'll ask before any of it).</p></section>
<section style="display:grid;gap:4px"><h2>All 55 items</h2><p class="mute">Tap an item for the reason behind each score.</p>{"".join(rows)}</section>
</main>'''
out.write_text(page)
print(tot)
