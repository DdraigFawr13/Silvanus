# Builds the review page for fix 1 (the Hall's walkway into the square). Usage: python build_page.py <out.html>
import base64, pathlib, sys
F = pathlib.Path(__file__).resolve().parent
def b64(p): return base64.b64encode(pathlib.Path(p).read_bytes()).decode()
def img(name, alt): return f'<img src="data:image/png;base64,{b64(F / name)}" alt="{alt}">'
def pair(t, a, b, cap):
    return f'<section><h2>{t}</h2><div class="pair"><figure>{img(a, "Before")}<figcaption>Before</figcaption></figure><figure>{img(b, "After")}<figcaption>After</figcaption></figure></div><p>{cap}</p></section>'
score = [
 ("T2", "Hall, walkway and square line up", "Met (was partly)", "The walkway now runs straight from the Hall's steps onto the square's paving, ending 8 rows above the well's rim. Walkway centre x 893, Hall door x 893; the square's paving spans about x 831 to 959 (read off the 4× crop), so its centre is about x 895."),
 ("L4", "Grounded", "Met", "The Hall's path now leads somewhere: into the square, not to a fence."),
 ("L9", "Walls, fences and trees drawn well", "Met", "The fence stops at a post on each side of the walkway. Both posts are copied from the same fence. The old gate's rail and post under the walkway's foot are gone."),
 ("R3", "Joins line up", "Met at this spot", "Slab rows keep their 11-row spacing, and the last row meets the paving's top course at y 431. No seam shows at 4×."),
 ("L1, L8", "Mood, one colour and light", "No change", "Every new pixel is copied from the map itself. Nothing was painted or regraded."),
]
rows = "".join(f'<tr><td>{a}</td><td>{b}</td><td><b>{c}</b></td><td>{d}</td></tr>' for a, b, c, d in score)
page = f'''<title>Hall Walkway Fix</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width. Lantern colours (D-028), dark only like the game. */
:root {{ --bg:#162120; --panel:#1f2e2c; --line:#2f4541; --ink:#e6e3d6; --head:#f0d9a4; --muted:#9fb0a4; --act:#d9a441; color-scheme:dark; }}
body {{ background:var(--bg); color:var(--ink); font:15px/1.5 system-ui,sans-serif; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; margin:0; }}
main {{ max-width:460px; margin:0 auto; display:grid; gap:16px; }}
h1,h2 {{ font-family:Georgia,serif; color:var(--head); margin:0; text-wrap:balance; }} h1 {{ font-size:24px; }} h2 {{ font-size:17px; }}
p {{ margin:0; }} .mute {{ color:var(--muted); font-size:13px; }}
section {{ background:var(--panel); border:1px solid var(--line); padding:12px; border-radius:10px; display:grid; gap:10px; min-width:0; }}
img {{ width:100%; display:block; image-rendering:pixelated; border-radius:6px; }}
.pair {{ display:grid; grid-template-columns:1fr 1fr; gap:8px; }} figure {{ margin:0; display:grid; gap:4px; }} figcaption {{ font-size:13px; color:var(--muted); }}
.tbl {{ overflow-x:auto; }} table {{ border-collapse:collapse; font-size:13px; width:100%; }} td {{ padding:6px; border-bottom:1px solid var(--line); vertical-align:top; }}
ul {{ margin:0; padding-left:20px; display:grid; gap:6px; }} .rec {{ border-left:3px solid var(--act); }}
</style>
<main>
<h1>The Hall's walkway now enters the square</h1>
<p class="mute">Fix 1 on the target map (D-055). Free pixel edit, 0 PixelLab generations used. About 1,265 left (HANDOFF figure).</p>
{pair("Hall to square, 2× zoom", "hall_square_2x_before.png", "hall_square_2x_after.png", "Before: the flagstone walkway stopped at a fence across the top of the square, so it led to a gate. After: the fence is opened for the walkway's width, and the slabs run on to the square's paving.")}
{pair("The join, 4× zoom", "gate_4x_before.png", "gate_4x_after.png", "Before: a fence row and an old gate rail crossed the walkway's foot. After: the fence ends at a post on each side, and the paving runs clear to the well.")}
<section><h2>Whole map after the fix</h2>{img("../result_2_grown.png", "The whole target map after the fix")}<p>Nothing else on the map moved. Outside the walkway, 10 pixels differ from the old map by more than 2 levels of 255. That comes from rounding when the buildings are graded, and it can't be seen.</p></section>
<section><h2>Checklist, items this fix touches</h2><div class="tbl"><table>{rows}</table></div><p class="mute">The other items are scored as before. The last full scoring was of the map before ChatGPT's clean-up (38 met, 16 partly, 1 missed).</p></section>
<section class="rec"><h2>Next: which partly met item?</h2><ul>
<li><b>Recommended: dressed yards (P5, T7).</b> Most yards are still bare. PixelLab yard pieces (vegetable beds, washing lines, woodpiles) for about 6 cottages. About 35 to 45 generations (my estimate).</li>
<li>The missing special sites (M14): sunken bog, salt spring, bat caves. About 15 to 20 generations (my estimate).</li>
<li>A cobbled High Street and hedgerows (T5, T9). Inpainting along the street, about 25 to 35 generations (my estimate).</li>
</ul><p>I will ask before every paid call, with its cost (R6).</p></section>
<p class="mute">Files: art/handoff_chatgpt/fix_hall_path.py makes result_2_graded.png (the ground) and result_2_grown.png (with buildings) from result_1_graded.png.</p>
</main>'''
pathlib.Path(sys.argv[1]).write_text(page, encoding="utf-8")
