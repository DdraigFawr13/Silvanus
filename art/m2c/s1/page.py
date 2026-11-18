# Builds the M2c S1 mock-up form (mockups/m2c-s1-map.html) from the planning-interview form template and the screenshots
# shots.mjs took. Usage: python3 -B art/m2c/s1/page.py <shots dir> <check record html file>
import base64, json, pathlib, sys
R = pathlib.Path(__file__).resolve().parents[3]; S = pathlib.Path(sys.argv[1])
rec = pathlib.Path(sys.argv[2]).read_text()
img = lambda n, alt: f'<img src="data:image/webp;base64,{base64.b64encode((S / f"w_{n}.webp").read_bytes()).decode()}" alt="{alt}" style="width:100%;border-radius:6px;display:block">'
def card(title, n, alt, cap): return {"type": "info", "html": f"<h3>{title}</h3>{img(n, alt)}<p class='why'>{cap}</p>"}
CONFIG = {
 "round": "m2cs1", "heading": "M2c S1: the map you can look at",
 "intro": [
  "This is slice S1 of the town view (spec <code>docs/specs/m2c-town-view.md</code>, D-057, all five recommended answers). S1 only puts the map on the Town tab: the ground, the Hall and your buildings on their spots, scrolling, and the 1×, 2×, 3× zoom. Tapping lots (S2), smoke and scaffolding (S3) and people walking (S4) come in later slices, each in its own session.",
  "Every picture but 7 (360 px) is the real Town tab at 412 px, on the phone's 2.625 pixel ratio, with the map drawn from the approved ground (<code>result_3_graded.png</code>) and the target picture's own pieces. Tap a picture to zoom.",
  "<b>Check the line at the top says “Synced with Claude” before you answer.</b> Then answer on the last tab: Approve, Change or Rethink, with notes.",
 ],
 "sections": [
  {"id": "pics", "title": "The pictures", "notes": False, "items": [
   card("1. A new town, 1×", "day1_1x", "Town tab with the map at 1x on a new town",
        "Seed 1, day one: the Hall, one Cottage just west of the square, and the scenery. At 1× the window shows 1,082 of the map's 1,408 art pixels; it opens on the Hall with the map scrolled to its right edge, which leaves the Hall just right of centre, so the Forager's hut on the far west is off screen until you scroll left. The four empty lots show nothing yet: their pale glow and Build marker arrive in S2."),
   card("2. A new town, 2×", "day1_2x", "Town tab with the map at 2x on a new town",
        "2× keeps the Hall in the middle. The window stays the same height, so the map now scrolls up and down as well as sideways."),
   card("3. A new town, 3×", "day1_3x", "Town tab with the map at 3x on a new town",
        "3×: the Hall fills the window; windows, clock and walkway read."),
   card("4. A full Village, 1×", "village_1x", "Town tab with the map at 1x on a full Village",
        "A Village with all 10 lots used: the Farm and the Mine on their sites, the Woodcutter's camp cut off at the window's left edge and the Forager's hut off screen to the left (scroll to see them); the first Cottage at tier 2 (its plot's piece b, the same at every tier); the Workshop, a second Cottage, the Storehouse and the Tavern on the plots nearest the square; a third Cottage still being built, drawn faded (until S3's scaffolding). The Workshop, Storehouse and Tavern use cottage pieces b, c and e with a small trade sign (D-057)."),
   card("5. A full Village, 2×", "village_2x", "Town tab with the map at 2x on a full Village",
        "2× on the Village: the Hall, the Cottage on the plot west of the Hall, and the mine track."),
   card("6. A full Village, 3×", "village_3x", "Town tab with the map at 3x on a full Village",
        "3× on the Village."),
   card("7. 360 px wide, 1×", "day1_1x_360", "Town tab at 360 px wide",
        "At 360 px the stock cells get narrower and the map window shows less width; the page itself never scrolls sideways (measured, see the check record)."),
   {"type": "info", "html": f"<h3>8. The whole tab under the map</h3><p class='why'>The Hall row, board, work queue, lots list and log stay below the map, unchanged (D-057, Q1 A).</p>{img('village_full', 'The whole Town tab on a full Village')}"},
  ]},
  {"id": "picks", "title": "What I picked", "notes": False, "items": [
   {"type": "info", "html": "<p>The spec leaves these open; I picked defaults. Say on the answer tab if one is wrong.</p><ul>"
    "<li><b>The map runs edge to edge</b> under the stock bar, with no side gutter, so it shows as much land as it can.</li>"
    "<li><b>The zoom row sits under the map</b>: three 44 px buttons, the chosen one lit in a lighter green with gold text. Not lamp-amber, which the style keeps for taps that change the town.</li>"
    "<li><b>A building being built is drawn faded</b> on its spot until S3 brings scaffolding.</li>"
    "<li><b>The Hall's chimney smoke is already in the approved picture</b> (pictures 1, 3, 5), so it already smokes in S1; S3 will not add a second smoke on the Hall.</li>"
    "<li><b>Empty lots show nothing</b> in S1. S2 adds the pale glow and the Build marker.</li>"
    "<li><b>Plots fill nearest the square's well first</b> (10 plots; picture 4 shows the first six in use).</li></ul>"},
   {"type": "info", "html": "<h3>Scored against the art checklist</h3><ul>"
    "<li>L1–L10 the look: kept. The ground and every piece are the approved target picture's, unchanged; only the faded Cottage and three trade signs are new.</li>"
    "<li>M1, M2 seamless map, 1408 × 888, three zoom steps: yes. M3 opens on the Hall: yes; at 1× the map stops at its right edge, so the Hall sits just right of centre.</li>"
    "<li>M16 gathering buildings on their own sites: yes (Forager's hut, Woodcutter's camp, Farm, Mine).</li>"
    "<li>T1 the Hall stands out: yes. P7 day one is open: yes, day one only (growing surroundings are an M2c non-goal). P10 the land is one picture, buildings separate pieces: yes.</li>"
    "<li>P1–P4 tappable lots, glows, Build markers: not in S1; S2. P11 movement: S3 and S4.</li>"
    "<li>S1 412 px upright: yes. S4 lantern colours: yes. S2, S3 (picture header and tab bar): not in M2c (spec non-goal).</li>"
    "<li>P5, P6, P8 dressed yards, staked lots, upgrades that show: not in M2c (spec non-goals).</li>"
    "<li>M4–M12, M14, T2–T9, P9 the land, the town's layout and lots apart: the ground is the approved target unchanged (D-055, fix 2 in PR #29), scored then; nothing here changes it. S5 board card headers: not in M2c.</li><li>R4 finished art in place at phone size: yes. R5 no look swapped for an easier method: yes.</li></ul>"},
  ]},
  {"id": "answer", "title": "Your answer", "items": [
   {"type": "single", "id": "verdict", "q": "Build S1 like this?", "why": "Approve and I build it; Change and I redo the mock-up with your notes; Rethink and we go back a step.",
    "opts": [{"t": "Approve", "rec": 1}, "Change (say what)", "Rethink"]},
   {"type": "text", "id": "change", "q": "What to change, or anything else"},
  ]},
  {"id": "record", "title": "Check record", "notes": False, "items": [{"type": "info", "html": rec}]},
 ],
}
t = (R / '.claude/skills/planning-interview/assets/form.html').read_text()
# the Lantern tokens (docs/UI_STYLE.md) for the form's colours; one theme only (D-028)
lantern = "--bg: #162120; --surface: #1f2e2c; --ink: #e6e3d6; --muted: #9fb0a4; --line: #2f4541; --accent: #d9a441; --accent-ink: #1a1608; --brass: #f0d9a4; --chip: #2f4541; --now: #8fbf8a; --soon: #9fb0a4; --later: #9fb0a4; --no: #9fb0a4; --bad: #ef8a62; --warn: #ef8a62; color-scheme: dark;"
import re
t = re.sub(r':root \{\n  --bg: #e9ece6;[^}]*?--warn: #9a6b1f;', ':root {\n  ' + lantern, t, count=1)
t = re.sub(r'@media \(prefers-color-scheme: dark\) \{ :root:not\(\[data-theme="light"\]\) \{[^}]*\} \}', '', t, count=1)
t = re.sub(r':root\[data-theme="dark"\] \{[^}]*\}', '', t, count=1)
t = t.replace('font-size: .7rem', 'font-size: .75rem').replace('font-size: .68rem', 'font-size: .75rem')
t = t.replace('%%TITLE%%', 'Town map S1').replace('%%CONFIG%%', json.dumps(CONFIG))
(R / 'mockups/m2c-s1-map.html').write_text(t)
print(len(t))
