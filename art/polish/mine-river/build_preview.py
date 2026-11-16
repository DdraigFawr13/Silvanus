"""Build an image-first portable phone review page, without external requests."""
import base64
import html
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]

def uri(p):
    return 'data:image/png;base64,' + base64.b64encode(p.read_bytes()).decode()

images = {'after': uri(HERE/'full-view.png'), 'before': uri(ROOT/'art/polish/stage-b/grown.png')}
scores = json.loads((HERE/'scores.json').read_text())
names = {'m':'Met','p':'Partly','x':'Not met'}
rows = ''.join(f'<details><summary>{key} · {html.escape(v[0])} — {names[v[1]]}</summary><p>{html.escape(v[2])}</p></details>' for key,v in scores.items())
page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Silvanus — mine and river</title>
<style>
:root{color-scheme:dark;--bg:#162120;--panel:#1f2e2c;--ink:#e6e3d6;--muted:#9fb0a4;--head:#f0d9a4;--line:#2f4541;--act:#d9a441;--act-ink:#1a1608}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}header,main{padding:12px;max-width:1100px;margin:auto}h1{font-size:22px;margin:0 0 8px;color:var(--head)}h2{font-size:20px;color:var(--head)}p{margin:8px 0}button,select{font:inherit;min-height:44px;border:1px solid var(--muted);border-radius:6px;padding:6px 10px;background:var(--panel);color:var(--ink)}button:focus-visible,select:focus-visible,#viewport:focus-visible{outline:2px solid var(--act)}label{display:flex;gap:6px;align-items:center}.controls{display:flex;gap:8px;flex-wrap:wrap}#viewport{overflow:auto;width:100%;max-height:74svh;background:var(--panel)}#scene{display:block;width:100%;max-width:none;height:auto;image-rendering:pixelated}figure{margin:18px 0}figure img{max-width:100%;height:auto;image-rendering:pixelated}figcaption,.note{font-size:14px;color:var(--muted)}details{border-bottom:1px solid var(--line);padding:8px 0}summary{cursor:pointer;min-height:44px}a{color:var(--head)}.compare{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:16px}
</style>
<header><h1>Silvanus · mine & river</h1><div class="controls"><label>View <select id="version"><option value="after">After</option><option value="before">Before</option></select></label><label>Zoom <select id="zoom"><option value="fit">Full view</option><option value="1">1×</option><option value="2">2×</option><option value="3">3×</option></select></label><button id="mine">Mine & river</button></div></header>
<div id="viewport" tabindex="0" aria-label="Town map. Swipe to pan when zoomed."><img id="scene" alt="Full town band with repaired mine exit and river"></div>
<main><p class="note">Swipe to pan when zoomed. Turn your phone sideways for a larger full view. This shows all current artwork; the lower town is still unfinished.</p>
<p>The mine has a clear tunnel mouth and continuous curved rails. The river has flowing water and irregular stone banks; the stray grey slab is removed.</p>
<h2>Closer look</h2><div class="compare"><figure><img src="BEFORE" alt="Previous mine exit and river"><figcaption>Before: abrupt rail turn, straight bank and isolated slab.</figcaption></figure><figure><img src="AFTER" alt="Repaired mine exit and river"><figcaption>After: connected rails, open tunnel and a more natural riverbank.</figcaption></figure></div>
<h2>Style reference</h2><figure><img src="TARGET" alt="Approved PixelLab town-heart reference"><figcaption>Mock-up 1, D-048. The repair is slightly smoother at close zoom.</figcaption></figure>
<h2>Recommendation</h2><p>Use these optional mine and river repairs while the rest of the map develops. The lower river outlet now curves farther west; connect future lower-map artwork to this bank if you keep it. Each repair can be replaced separately.</p>
<h2>Checks and remaining work</h2><p>Only pixels inside the two repair masks changed. The rest of the previous cleanup is retained. The mountain’s larger block-like shapes and unrelated map seams remain. These are workshop overlays, not finished gameplay assets.</p>
<details><summary>All 55 art requirements</summary>ROWS</details>
<script>const images=IMAGES;const scene=document.querySelector('#scene'),viewport=document.querySelector('#viewport'),version=document.querySelector('#version'),zoom=document.querySelector('#zoom');function render(){scene.src=images[version.value];scene.alt=(version.value==='after'?'Repaired':'Previous')+' full town band';scene.style.width=zoom.value==='fit'?'100%':(1408*Number(zoom.value)/devicePixelRatio)+'px';}version.addEventListener('change',render);zoom.addEventListener('change',()=>{render();if(zoom.value==='fit'){viewport.scrollLeft=0;viewport.scrollTop=0;}});document.querySelector('#mine').addEventListener('click',()=>{zoom.value='3';render();requestAnimationFrame(()=>{const scale=3/devicePixelRatio;viewport.scrollLeft=1200*scale-viewport.clientWidth/2;viewport.scrollTop=260*scale-viewport.clientHeight/2;});});window.addEventListener('resize',render);render();</script></main></html>'''
page=page.replace('BEFORE',uri(HERE/'detail-before.png')).replace('AFTER',uri(HERE/'detail-after.png')).replace('TARGET',uri(ROOT/'art/pixellab/mock_hd/raw_1_heart.png')).replace('ROWS',rows).replace('IMAGES',json.dumps(images))
(HERE/'preview.html').write_text(page)
print('Built phone review:',len(scores),'checklist items')
