# Builds the ChatGPT clean-up comparison page (with download buttons). Usage: python3 build_page.py <out.html>
import base64, pathlib, sys
R = pathlib.Path(__file__).resolve().parents[2]
H = R / "art/handoff_chatgpt"
def b64(p): return base64.b64encode(pathlib.Path(p).read_bytes()).decode()
def fig(t, src, cap): return f'<section><h2>{t}</h2><img src="data:image/png;base64,{b64(src)}" alt="{t}"><p>{cap}</p></section>'
figs = "".join([
 fig("ChatGPT version, with our buildings back on it", H / "result_1_grown.png", "ChatGPT cleaned the ground; I pulled its colours toward mock-up 1 (it came back greener and brighter) and put the same buildings, lamps and sites back. It kept the layout: 49 of 63 sample blocks match the old map within 2 px, so every building still sits on its plot."),
 fig("River and bridge (top: mine, bottom: ChatGPT)", H / "cmp_river.png", "The straight-sided river column is gone: a natural river with banks, rocks and reeds flows down under the bridge."),
 fig("Town middle (top: mine, bottom: ChatGPT)", H / "cmp_town.png", "The rectangle and road seams are gone; lanes and plots read as one painting."),
 fig("North-west (top: mine, bottom: ChatGPT)", H / "cmp_west.png", "The darker blocks in the forest corner are gone. The fringe is brighter and more even than mock-up 1's moodier ground."),
])
data, data2 = b64(H / "result_1_grown.png"), b64(H / "result_1_graded.png")
page = f'''<meta charset="utf-8"><title>ChatGPT map clean-up</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
/* One column at phone width. Lantern colours (D-028). */
:root {{ --bg:#162120; --panel:#1f2e2c; --line:#2f4541; --ink:#e6e3d6; --head:#f0d9a4; --muted:#9fb0a4; --act:#d9a441; --act-ink:#1a1608; color-scheme:dark; }}
body {{ background:var(--bg); color:var(--ink); font:15px/1.5 system-ui,sans-serif; padding-left:max(16px,env(safe-area-inset-left,0px)); padding-right:max(16px,env(safe-area-inset-right,0px)); padding-block:20px 40px; margin:0; }}
main {{ max-width:440px; margin:0 auto; display:grid; gap:16px; }}
h1,h2 {{ font-family:Georgia,serif; color:var(--head); margin:0; text-wrap:balance; }} h1 {{ font-size:24px; }} h2 {{ font-size:17px; }}
p {{ margin:0; }} .mute {{ color:var(--muted); font-size:13px; }} code {{ font-size:13px; word-break:break-all; }}
section {{ background:var(--panel); border:1px solid var(--line); padding:12px; border-radius:10px; display:grid; gap:10px; }}
img {{ width:100%; display:block; image-rendering:pixelated; border-radius:6px; }}
button {{ min-height:48px; border:0; border-radius:10px; background:var(--act); color:var(--act-ink); font:700 16px system-ui,sans-serif; }}
table {{ border-collapse:collapse; font-size:13px; font-variant-numeric:tabular-nums; width:100%; }} td,th {{ padding:4px 6px; border-bottom:1px solid var(--line); text-align:left; }}
ol,ul {{ margin:0; padding-left:20px; display:grid; gap:6px; }} .rec {{ border-left:3px solid var(--act); }}
.msg {{ font-size:14px; color:var(--muted); min-height:1em; }}
</style>
<main>
<header style="display:grid;gap:8px"><h1>ChatGPT's clean-up</h1>
<p><b>Answer first:</b> it's the best version yet. The seams and the river are fixed and the layout held, so I could put every building straight back. It came out greener and brighter than mock-up 1, and I graded it back. <b>Your computer:</b> I can't use PhotoCraft from here yet, because no folder on your PC is connected to this session (how to connect it is below).</p></header>
{figs}
<section><h2>Measured</h2><table><tr><th>Picture</th><th>Brightness</th><th>Saturation</th><th>Texture</th></tr>
<tr><td>Mock-up 1</td><td>55</td><td>0.37</td><td>0.263</td></tr><tr><td>My map</td><td>51</td><td>0.33</td><td>0.198</td></tr>
<tr><td>ChatGPT as returned (ground)</td><td>58</td><td>0.46</td><td>0.196</td></tr><tr><td>ChatGPT graded, with buildings</td><td>51</td><td>0.39</td><td>0.237</td></tr></table>
<p class="mute">Texture is the share of neighbouring pixels that differ by more than 12 levels. The graded ChatGPT map is the closest to mock-up 1 on all three.</p></section>
<section><h2>Download</h2><button data-n="silvanus_map_chatgpt_with_buildings.png" data-k="a">Map with buildings</button><button data-n="silvanus_map_chatgpt_ground.png" data-k="b">Ground only (for more editing)</button><p class="msg" id="m"></p></section>
<section><h2>Using PhotoCraft on your PC</h2>
<p>This session runs in the cloud. To let me edit with PhotoCraft on your PC, connect a folder from it:</p>
<ul><li><b>Easiest:</b> start a new Claude Code session in the Claude Desktop app on your PC, in your <code>CraftWork\\silvanus-art</code> folder. It can work there directly.</li>
<li><b>Or connect it to this session:</b> in the Claude Desktop app on your PC, go to Settings, Claude Code, Remote Control, and add that folder. Then tell me, and I'll ask to connect it. Using a folder from a cloud session isn't available to everyone yet.</li></ul>
<p class="mute">Even connected, whether I can drive PhotoCraft's own buttons depends on the app having a scripting or command line; your earlier scene scripts suggest it does, but I haven't checked.</p></section>
<section class="rec"><h2>What next</h2><ol>
<li><b>Recommended: take the ChatGPT version as the target picture.</b> List what's still not right in your words, and I'll fix those spots here for free, or in PhotoCraft once your PC is connected.</li>
<li><b>Another ChatGPT round</b> on the ground (download it above) with your notes added to the prompt.</li>
<li><b>Connect your PC first</b> and work in PhotoCraft.</li></ol></section>
</main>
<script>
const D={{a:"{data}",b:"{data2}"}};
function bytes(s){{const t=atob(s),a=new Uint8Array(t.length);for(let i=0;i<t.length;i++)a[i]=t.charCodeAt(i);return a;}}
let dl=null;(async()=>{{try{{dl=await claude.use('downloads');}}catch(e){{dl=null;}}}})();
document.querySelectorAll('button[data-k]').forEach(b=>b.addEventListener('click',async()=>{{const m=document.getElementById('m');
 if(!dl){{m.textContent='Download not available here: press and hold the picture above to save it.';return;}}
 try{{await dl.save({{filename:b.dataset.n,data:new Blob([bytes(D[b.dataset.k])],{{type:'image/png'}})}});m.textContent='Saved.';}}catch(e){{m.textContent=(e&&e.code)==='declined'?'Not saved.':'Could not save ('+((e&&e.code)||'error')+').';}}}}));
</script>'''
pathlib.Path(sys.argv[1]).write_text(page)
