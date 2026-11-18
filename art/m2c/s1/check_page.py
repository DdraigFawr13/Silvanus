# The M2c S1 phone-check form (mockups/m2c-s1-check.html): the built screen's screenshots, the one difference
# from the mock-up, and what to check. Usage: python3 -B art/m2c/s1/check_page.py <dir with built *.png>
import base64, io, json, pathlib, re, sys
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[3]; S = pathlib.Path(sys.argv[1])
def img(n, alt):
    b = io.BytesIO(); Image.open(S / f'{n}.png').convert('RGB').save(b, 'WEBP', quality=82)
    return f'<img src="data:image/webp;base64,{base64.b64encode(b.getvalue()).decode()}" alt="{alt}" style="width:100%;border-radius:6px;display:block">'
card = lambda t, n, cap: {"type": "info", "html": f"<h3>{t}</h3>{img(n, t)}<p class='why'>{cap}</p>"}
CONFIG = {"round": "m2cs1check", "heading": "M2c S1: built, check on your phone",
 "intro": ["S1 is built: the map at the top of the Town tab, from a production build at 412 px. All checks pass; the PR (#33) stays a draft until you have looked.",
           "<b>Check the line at the top says “Synced with Claude” before you answer.</b>"],
 "sections": [
  {"id": "built", "title": "What was built", "notes": False, "items": [
   card("A new town, 1×", "day1_1x_412", "As on the mock-up: the map opens on the Hall, the map's right edge reached."),
   card("A full Village, 1×", "village_1x_412", "The Village from the mock-up, now drawn by the game."),
   card("A full Village, 3×", "village_3x_412", "The one difference: zooming in keeps the point in the middle of the window. At 1× that is the square just left of the Hall, so 3× shows the walkway and the well; scroll up for the Hall. The mock-up showed 2× and 3× on the Hall."),
   card("360 px wide", "day1_1x_360", "No sideways page scroll at 360 or 412 px (measured).")]},
  {"id": "answer", "title": "Your answer", "items": [
   {"type": "single", "id": "zoom", "q": "When you zoom in, where should the map go?", "why": "Keep the middle: the spec's rule, what is built. Jump to the Hall: every zoom step recentres on the Hall.",
    "opts": [{"t": "Keep the middle", "rec": 1}, "Jump to the Hall"]},
   {"type": "single", "id": "phone", "q": "On your phone: your town on the map, scroll and 1×/2×/3× crisp, People and back keeps its place, works in flight mode?",
    "opts": ["All good", "Something is wrong (say what)"]},
   {"type": "text", "id": "notes", "q": "Anything else"}]}]}
t = (R / '.claude/skills/planning-interview/assets/form.html').read_text()
lantern = "--bg: #162120; --surface: #1f2e2c; --ink: #e6e3d6; --muted: #9fb0a4; --line: #2f4541; --accent: #d9a441; --accent-ink: #1a1608; --brass: #f0d9a4; --chip: #2f4541; --now: #8fbf8a; --soon: #9fb0a4; --later: #9fb0a4; --no: #9fb0a4; --bad: #ef8a62; --warn: #ef8a62; color-scheme: dark;"
t = re.sub(r':root \{\n  --bg: #e9ece6;[^}]*?--warn: #9a6b1f;', ':root {\n  ' + lantern, t, count=1)
t = re.sub(r'@media \(prefers-color-scheme: dark\) \{ :root:not\(\[data-theme="light"\]\) \{[^}]*\} \}', '', t, count=1)
t = re.sub(r':root\[data-theme="dark"\] \{[^}]*\}', '', t, count=1)
t = t.replace('font-size: .7rem', 'font-size: .75rem').replace('font-size: .68rem', 'font-size: .75rem')
(R / 'mockups/m2c-s1-check.html').write_text(t.replace('%%TITLE%%', 'Town map check').replace('%%CONFIG%%', json.dumps(CONFIG)))
