"""Build a portable review page; all artwork is embedded, no network needed."""
import base64
import html
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]

def uri(path):
    return 'data:image/png;base64,' + base64.b64encode(path.read_bytes()).decode()

def figure(title, path, caption):
    return f'<figure><h3>{html.escape(title)}</h3><img src="{uri(path)}" alt="{html.escape(title)}"><figcaption>{html.escape(caption)}</figcaption></figure>'

scores = json.loads((HERE / 'scores.json').read_text())
names = {'m': 'Met', 'p': 'Partly', 'x': 'Not met'}
rows = ''.join(f'<details><summary>{key} · {html.escape(value[0])} — {names[value[1]]}</summary><p>{html.escape(value[2])}</p></details>' for key, value in scores.items())
images = { 'before-ground': uri(ROOT / 'art/pixellab/blocks/stage_b_ground_final.png'), 'before-grown': uri(ROOT / 'art/pixellab/blocks/stage_b.png'), 'after-ground': uri(HERE / 'ground.png'), 'after-grown': uri(HERE / 'grown.png') }
comparisons = ''.join(figure(title, HERE / path, caption) for title, path, caption in [
('Roof · before', 'roof-before.png', 'A cottage roof remains baked into the empty ground.'),
('Roof · after', 'roof-after.png', 'Grass replaces the stray roof; the fence and surrounding pines remain.'),
('Western grass · before', 'west-before.png', 'Hard horizontal collage seam and repeating stump texture.'),
('Western grass · after', 'west-after.png', 'The central seam is softened and the clearing is less regular. Some plot edges and the upper forest seam remain.')])
page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Silvanus · small art repairs</title>
<style>
:root{color-scheme:dark;--bg:#162120;--panel:#1f2e2c;--ink:#e6e3d6;--muted:#9fb0a4;--head:#f0d9a4;--line:#2f4541;--act:#d9a441;--act-ink:#1a1608}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}main{max-width:900px;margin:auto;padding:16px}h1,h2,h3{color:var(--head);line-height:1.2}h1{font-size:26px}h2{font-size:21px}h3{font-size:17px}p{margin:12px 0}figure{margin:16px 0;padding:12px;background:var(--panel);border:1px solid var(--line);border-radius:10px}img{display:block;max-width:100%;height:auto;image-rendering:pixelated}figcaption,.note{font-size:14px;color:var(--muted);margin-top:8px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}label{display:flex;gap:6px;align-items:center}select{font:inherit;min-height:44px;max-width:100%;background:var(--panel);color:var(--ink);border:1px solid var(--muted);border-radius:6px;padding:6px}select:focus-visible,.viewport:focus-visible{outline:2px solid var(--act)}.viewport{overflow:auto;max-height:65vh;background:var(--panel);border:1px solid var(--line)}#scene{max-width:none;width:100%}details{border-bottom:1px solid var(--line);padding:8px 0}summary{cursor:pointer;min-height:44px}details p{color:var(--muted)}.pair{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:12px}a{color:var(--head)}
</style><main><h1>Silvanus · small art repairs</h1>
<p>Two removable patches on Claude’s stage B: remove the leftover cottage roof and soften the western grass collage seams. Existing buildings, roads, forest gate, mountain and river retain their layout.</p>
<p class="note">Workshop candidate from m2b-target3 at 9afcc97. This is the partial top band, not finished game art. Empty ground is not a playable day-one state.</p>
<div class="controls"><label>Version <select id="version"><option value="after">After</option><option value="before">Before</option></select></label><label>Layers <select id="layers"><option value="grown">With buildings</option><option value="ground">Empty ground</option></select></label><label>Zoom <select id="zoom"><option value="fit">Fit</option><option value="1">1×</option><option value="2">2×</option><option value="3">3×</option></select></label></div>
<div class="viewport" tabindex="0" aria-label="Map preview. Scroll to inspect at full size."><img id="scene" alt="Repaired top band with buildings"></div><p class="note">Zoom uses screen pixels per art pixel, accounting for device pixel ratio. Swipe the map when zoomed in.</p>
<h2>Same areas, before and after</h2><div class="pair">COMPARISONS</div>
TARGET
<h2>Recommendation</h2><p>Keep these as optional repair layers while Claude continues the lower map. Replace either PNG independently if you prefer another treatment. The repair is slightly smoother at 3×; the upper forest seam, lower plot edges, east join, block-like rock and riverside slab still need work.</p>
<h2>Checks and scope</h2><p>REPORT. No gameplay or runtime code changed. Source images retained; one Image Gen edit, no PixelLab calls. Asset sources, terms and rebuild instructions are in README.md alongside this page.</p>
<h2>All 55 agreed requirements</h2><p class="note">Codex’s assessment, not owner approval. Unchanged stage B observations are labelled; incomplete gameplay items remain incomplete.</p>ROWS
<script>const images=IMAGES;const version=document.querySelector('#version'),layers=document.querySelector('#layers'),zoom=document.querySelector('#zoom'),scene=document.querySelector('#scene');function render(){scene.src=images[version.value+'-'+layers.value];scene.alt=(version.value==='after'?'Repaired':'Original')+' top band '+(layers.value==='grown'?'with buildings':'empty ground');scene.style.width=zoom.value==='fit'?'100%':(1408*Number(zoom.value)/window.devicePixelRatio)+'px';}for(const control of [version,layers,zoom])control.addEventListener('change',render);window.addEventListener('resize',render);render();</script></main></html>'''
report=json.loads((HERE/'verification.json').read_text())
report_text=f"Measured: {report['ground_percent_changed']}% of ground pixels changed; {report['pixels_changed_outside_assets']} changed outside the two patch masks. Original building assembly reproduced exactly"
page=page.replace('COMPARISONS',comparisons).replace('TARGET',figure('Approved style reference · mock-up 1',ROOT/'art/pixellab/mock_hd/raw_1_heart.png','D-048 style reference. The current band remains plainer than this target.')).replace('REPORT',report_text).replace('ROWS',rows).replace('IMAGES',json.dumps(images))
(HERE/'preview.html').write_text(page)
print('Built preview with',len(scores),'checklist items')
