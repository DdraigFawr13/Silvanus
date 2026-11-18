# M2c Town view

- **Status:** Draft (2026-11-18), waiting for Morgan's answers to the open questions.
- **Planned in:** the M2 re-plan (`m2final`, https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG, 2026-11-14) and the art workshop (D-047, D-048, D-055, the agreed checklist `docs/workshop/art-checklist.md`). No separate interview: every rule below comes from those decisions, and each choice they leave open is an open question. **Decisions:** D-037, D-047, D-048, D-055, D-033, D-028; D-041 is Proposed, and only the checklist items Morgan agreed (P1 to P4) are used from it.

## Problem

Morgan, M2 re-plan: "I'd like more graphically pleasing actual view of the town and people walking or moving around it. Kind of like project Vulcan", and "I just like seeing some animation showing things happening". On the art checklist: "i need to be able to click lots on the map. I want that to be the main way to like be able to interact with things" (P1). Today the Town tab is a list (Hall row, board, work queue, lots, log; `apps/web/src/ui/TownTab.tsx`). Nothing on screen moves, and nothing shows where anything is.

## Terms

- **Art pixel:** one pixel of the map picture. The map is 1408 × 888 art pixels (D-047, D-055).
- **Zoom step:** 1×, 2× or 3× device pixels per art pixel (D-047). Device pixels = CSS pixels × `devicePixelRatio`. Morgan's phone is about 2.6 (D-047's assumption; the prototype was checked at 2.625, `docs/workshop/m2b-dragonscape.md`, "Approach chosen"). At 2.625 and 412 CSS px wide the steps show 1082, 541 and 360 art pixels of the width.
- **Ground:** the target picture with the buildings off: `art/handoff_chatgpt/result_N_graded.png`, the newest one approved (`result_2_graded.png` on main; `result_3_graded.png` if PR #29 has merged when S1 starts).
- **Piece:** a separate cut-out picture drawn on the ground: a building, a lamp, a site. The pieces and their places in the target picture are listed in `art/pixellab/blocks/pass2_items.json` (30 entries: `[file, x, y]`, top-left in art pixels).
- **Spot:** a place on the map where a lot is drawn: a rectangle in art pixels and a door point.
- **Lot order:** `state.buildings` is in lot order (`packages/sim/src/types.ts:71`); clearing a lot removes its entry (`build.ts:181`), so later buildings move up one. A new town has a Cottage and a Forager's hut and 6 lots (`newGame.ts:34`, content `hall.tiers[0].lots`).

## Goals

- The Town tab shows the town as a drawn map: the ground, the scenery pieces, the Hall, and one piece per built lot, drawn only from the latest snapshot the worker sent (D-037).
- It scrolls both ways, opens centred on the Hall, and zooms in three whole steps, 1×, 2×, 3×, with crisp pixels (no smoothing).
- Every lot on the map is a tap target of at least 44 × 44 CSS px at every zoom step. A built lot opens its building sheet; an empty lot carries a soft pale glow and a Build marker and opens the build sheet (checklist P1, P2, P4). A tapped built lot glows gold while its sheet is open, and built lots show no glow otherwise (P3).
- The town moves: residents walk between a home, their work and the Hall; working buildings smoke and idle ones are still; builds show scaffolding; settlers walk in and out on the south road; stock piles by the Storehouse (D-037).
- The view uses its own cosmetic random numbers, never a game stream, and never changes the state (D-002, GAME-01, GAME-02). After time away it shows the present at once; nothing that happened during catch-up is replayed.
- It draws at 30 frames a second or less, only while the Town tab is shown and the page is visible, and draws nothing otherwise.
- It loads after the first screen: the view's code is a separate chunk that is not in the first load, which stays at or under 120,000 bytes gzipped (`scripts/check-bundle.mjs`). The map art is precached, so it works offline.

## Non-goals

- No game rules: no grid, roads, adjacency or placement in the sim (D-033). Spots are scenery. Lots as records with a character are M2d (D-038).
- No new PixelLab art. This milestone draws with the pieces that exist; M2b step 4's assets replace them by changing the art files, not the code.
- No dressed yards (P5), staked future lots (P6), surroundings that grow per tier (P7, P8), square stages (T4, D-042 Proposed), day and night, seasons or weather.
- No pinch zoom, no free zoom between the steps (D-047), no sound.
- No new Town tab header, stock icons or picture tab bar (checklist S2, S3) unless Morgan picks it in Q1.

## Journeys and checks

The build starts from main at the commit S1 branches from. Every named test is new, so it is missing there.

### J1 The map on the Town tab

- **Given** a new town (seed 1). **When** the app opens on the Town tab. **Then** an element `data-testid="town-view"` holds one `canvas`, the zoom row (`zoom-1`, `zoom-2`, `zoom-3`, 1× pressed), and the view is scrolled so the Hall's centre is in the middle of the window, within 1 art pixel, clamped at the map's edges. **Check:** `tests/browser/town-view.spec.ts` "the map opens on the Hall".
- **When** 2× is tapped. **Then** the canvas's backing pixels are drawn at 2 device pixels per art pixel, the same map point stays at the window's centre (within 1 art pixel), and `imageSmoothingEnabled` is false. **Check:** `town-view.spec.ts` "zoom keeps the centre"; `apps/web/test/town-camera.test.ts` "zoom steps and clamping" (the camera maths, no DOM).
- **Then** at 412 and 360 CSS px wide the page has no sideways scroll; only the view scrolls sideways. **Check:** `town-view.spec.ts` "no page scroll at 412 and 360"; screenshots at 412 px in the PR (VER-06), beside the approved mock-up (S1's first step).

### J2 Buildings stand on their spots

- **Given** a state's buildings in lot order. **When** `spotsFor(state)` runs. **Then** it returns one spot per building and one per empty lot (`hall.lots - buildings.length`), following the spot rule (Design, "Spots"); the same state always gives the same answer; no two lots share a spot. **Check:** `apps/web/test/town-layout.test.ts` "spots follow the rule" (cases: a new town; a second Mine; a cleared lot; the Village's 10 lots).
- **Given** a new town. **Then** the map shows the Hall, the scenery pieces, a Cottage and a Forager's hut on their spots, and 4 empty-lot glows. **Check:** `town-view.spec.ts` "a new town on the map" (counts read from the lot buttons, J3) and its screenshot.

### J3 Lots are tap targets

- **Given** a new town. **Then** the view holds one `button` per lot (`data-testid="map-lot"`), each labelled with the lot ("Cottage, tier 1"; "Empty lot, build here"), and each at least 44 × 44 CSS px at 1×, 2× and 3×. **Check:** `town-view.spec.ts` "lot buttons are big enough".
- **When** the Cottage's button is tapped. **Then** its building sheet opens (the same `BuildingSheet` as the list), and the spot glows gold until the sheet closes. **When** an empty lot's button is tapped. **Then** the build sheet opens. **Check:** `town-view.spec.ts` "tapping a lot opens its sheet".
- **When** a lot whose first build is waiting or under way (tier 0) is tapped. **Then** a line over the spot reads the list's text ("Building, 3 game hours left" or "Waiting in the work queue") for 3 s (assumption: the list's tier-0 rows open nothing either, `TownTab.tsx:141`). **When** the Hall is tapped. **Then** the page scrolls the Hall row into view. **Check:** `town-view.spec.ts` "tier 0 and the Hall answer".

### J4 Signs of work

- **Given** a building with at least one worker (`residents[].jobId`) and `retoolLeft` 0. **Then** the scene lists smoke for it; with no workers, or while retooling, none. **Given** `queue[0]` targets a building (a first build or an upgrade). **Then** the scene lists scaffolding on that spot; a tier-0 building further back in the queue shows pegs only. **Given** a Storehouse and stock. **Then** the scene lists one pile per resource by the first Storehouse, sized in 4 steps by stock / cap (0, under a third, under two thirds, more); without a Storehouse, none. **Check:** `town-layout.test.ts` "smoke, scaffolding and piles follow the state". These are tested on `scene(state, ms)` (Design), not on pixels.

### J5 People walk

- **Given** a state. **Then** `scene` lists one walker per resident not on a trip (`board.trip`), with a home spot (Design, "Walkers"), a work spot (their job's building, or none), and a position on the road graph that depends only on the resident's id, the snapshot and the time in ms. **Check:** `town-layout.test.ts` "one walker per resident at home".
- **Given** two snapshots in live play (`snapshot.ticks` under `AWAY_MIN_TICKS`, `apps/web/src/store.ts:7`), where the second has a new resident. **Then** that resident walks in from the south edge first. Where a resident has gone, a walker leaves by the south edge. **Given** a catch-up snapshot (`ticks` at or over `AWAY_MIN_TICKS`). **Then** no one walks in or out: everyone is placed on their loop at once. **Check:** `town-layout.test.ts` "settlers walk in live, not after time away".
- **Then** every spot's door point is joined to the road graph, and the graph is one connected piece. **Check:** `town-layout.test.ts` "every door is on the roads".

### J6 The view never touches the game

- **Given** a state. **When** `spotsFor` and `scene` run 1,000 times at different times. **Then** the state is deep-equal to a copy taken before, and `state.rng` is unchanged. **Check:** `town-layout.test.ts` "the view reads the state and changes nothing".
- **Then** no file in `apps/web/src/town/` imports anything from `@silvanus/sim` except types and the read-only helpers `kindOf`, `hallOf` and `capsOf`, and none calls `Math.random`. **Check:** `town-layout.test.ts` "the view uses its own random numbers" (reads the folder's sources).

### J7 It draws only when seen, at 30 frames a second or less

- **Given** the Town tab shown. **When** 2 s pass. **Then** the canvas's `data-frames` counter rose by 40 to 62 (30 a second at most; the low bound proves it runs). **When** the People tab is shown for 2 s. **Then** it rises by 0. **When** the page is hidden (the test sets `document.visibilityState` to `hidden` and sends `visibilitychange`) for 2 s. **Then** it rises by 0, and it runs again when the page shows. **Check:** `town-view.spec.ts` "frames: at most 30 a second, none when hidden". The 2 s waits are wall-clock limits (VER-11): this test runs alone, not in a parallel lane.

### J8 It loads after the first screen and works offline

- **Given** `npm run build`. **Then** the view's code is its own chunk (`town-view-*.js`), it is not in `index.html` (neither as the entry nor as a `modulepreload`), and the first load stays at or under 120,000 bytes gzipped. **Check:** `scripts/check-bundle.mjs` gains both assertions (it fails at the start commit because the chunk does not exist).
- **Then** the service worker's precache list holds the ground and the piece sheet. **Check:** `check-bundle.mjs` reads `apps/web/dist/sw.js` for both file names. Background: Workbox skips any file over 2,097,152 bytes by default (`node_modules/workbox-build/build/types.d.ts:152`), and the ground as PNG is 2,332,279 bytes even after re-saving (measured on `result_2_graded.png`), so a PNG ground would silently not be precached.
- **Given** the app was loaded once. **When** it opens offline. **Then** the map draws. **Check:** `town-view.spec.ts` "the map draws offline" (the context goes offline, the page reloads, a pixel at the Hall's centre is not the background colour).

### J9 The M2c test (device check, Morgan)

- **Given** the build on the phone. **When** Morgan watches the town over a check-in (charter, Milestones, M2c). **Then** he says whether watching it is worth it, in his words, recorded in HANDOFF; and he taps a lot on the map to open it. The frame rate and smoothness on his phone count only with his word (VER-07).

## Decisions

- The view draws only from the latest snapshot, has its own cosmetic random numbers, jumps to the present after time away, draws at most 30 frames a second only while the Town tab is open, and is a plain canvas loaded after the first screen (D-037).
- Spots are scenery; the sim gains nothing (D-033). The sim, content and save schema are unchanged: no new condition or effect type, no save upgrade.
- The map is 1408 × 888 art pixels with zoom steps 1×, 2×, 3× (D-047); the ground and the pieces come from the target picture (D-055).
- Lots on the map are buttons; empty lots glow pale and carry a Build marker; built lots glow gold only while open (checklist P1 to P4, agreed 2026-11-16).
- Defaults chosen here (not Morgan's decisions; say if any is wrong): the ground ships as lossless WebP (1,832,492 bytes measured for `result_2_graded.png`, pixel for pixel the same picture, under Workbox's limit); taps are DOM buttons over the canvas; the canvas is the size of the window, not of the map; walkers loop home, work, Hall with no daily schedule (day and night are M3 or M4, D-035).

## Alternatives rejected

- **Hit-testing taps on the canvas itself:** no DOM to test with Playwright or read by a screen reader, and every tap answer would need its own code. DOM buttons over the canvas get focus, labels and `getByRole` for free. It would fail the first browser test that has to find a lot.
- **A canvas as big as the map at the zoom step:** at 3× it is 4224 × 2664 device pixels, about 45 MB of pixels, on a phone. The window-sized canvas redraws the visible part from a camera.
- **CSS-scaled `<img>` tags for the ground and pieces (the prototype's way, `art/prototype/index.html`):** smoke and walkers would be hundreds of moving elements, and D-037 asks for a canvas.
- **The ground as PNG with a raised precache limit:** works, but ships 0.5 MB more on every art update for no visible gain. **As lossy WebP** (420,422 bytes at quality 90, measured): changes the approved picture, which the AGENTS art rule forbids without asking.
- **Spots by lot index only (lot i on spot i):** simplest and never moves a building, but puts the Mine in a cottage plot and the Woodcutter by the square, against checklist M16 ("gathering buildings stand on their own sites"). Kept as option B of Q2.
- **Saving each building's spot:** the stable answer, but it is game state, and lots as records are M2d's job (D-038). It would fail when M2d changes the lot model a month later.
- **Walkers following game hours (to work at dawn):** no rule for it exists; inventing one is WS-06, and day and night are planned for M3 or M4.

## Risks

- **The map's art is not final.** The ground, the pieces and the spots change through M2b step 4. → The art lives in data (`apps/web/src/town/map.ts` and the art files) made by one script; new art changes those files, not the drawing code.
- **Morgan rejected the last canvas prototype's look** ("No that still sucks", workshop log, step 1, 2026-11-16). That was the old map; this view shows the approved target picture. → S1 starts with a mock-up made with `ui-mockups` from the real ground and pieces, scored against `docs/workshop/art-checklist.md`, approved by Morgan before code (AGENTS art rule, write-spec §8).
- **Frame cost on the phone is unmeasured.** → The scene is rebuilt per frame from plain arrays; S3 measures the draw time per frame on a production build in the container (Chromium, CPU throttled 4×) and reports it; Morgan's phone decides (J9).
- **Clearing a lot moves later buildings to other spots** under the spot rule, because lot order compacts. → Accepted until M2d; named in Q2.
- **A save at the Village has 10 lots, the target picture has 11 cottage plots and 4 sites.** Enough for v0.1's 10 lots; M2d's Town tier needs more spots (D-038). → M2d's spec adds spots.

## Design

### Parts

- `apps/web/src/town/map.ts` (data, hand-made from `pass2_items.json` and the ground): the map size; the Hall's spot; the **site spots** (`woodcutter`, `forager`, `farm`, `mine`: the target picture's woodcutter, forager, farmhouse and mine-entrance places); the **plot spots** (the 11 cottage places, in order of distance from the square's centre, nearest first); the **scenery** (every `pass2_items.json` entry that is not one of those spots: lamps, ruins, stones, tar pit, yard, stalls, fisher's hut); the **road graph** (nodes in art pixels and edges, along the High Street, the cross street, the lanes and the south road, with the south edge node named `edge`); each spot's tap rectangle and door point; the Storehouse pile offsets.
- `apps/web/src/town/pieces.ts` (data): which piece each kind draws at each tier (see Q3), and the walker frames (see Q4).
- `apps/web/src/town/layout.ts` (pure, no DOM): `spotsFor(state)` and `scene(state, ms, memory)`. `scene` returns a draw list: pieces with their art-pixel positions, glows, smoke, scaffolding, piles and walkers. `memory` holds the resident ids seen in the last snapshot and the arrival and departure walks under way; it is the view's own, never the store's.
- `apps/web/src/town/camera.ts` (pure): window size, zoom step, `devicePixelRatio` and scroll → the art-pixel rectangle to draw; clamping; keeping the centre on zoom.
- `apps/web/src/town/cosmetic.ts`: a small seeded generator for the view only (walk speeds, phase offsets, smoke drift), seeded from `state.seed` and the resident or building id. It never reads or writes `state.rng`.
- `apps/web/src/town/TownView.tsx` (lazy): a scroll box with a spacer the map's size at the zoom step (in CSS px), a canvas pinned to the window inside it, the lot buttons placed absolutely in the spacer, the zoom row, and the frame loop. It reads the snapshot with `useSyncExternalStore(subscribe, current)` (`store.ts`) like the rest of the page, and gets `send` and the sheet openers from `TownTab`.
- `apps/web/src/ui/TownTab.tsx`: loads `TownView` with `React.lazy` behind a `Suspense` placeholder of the same height, passes `hidden` down, and moves its sheet state so both the map and the list open the same sheets.
- `art/town_view_pack.py` (Pillow, already in `art/requirements.txt`): writes `apps/web/src/town/art/ground.webp` (lossless) from the ground, and one piece sheet `pieces.png` plus its frame table `pieces.ts` from the pieces used. Every art file's source and licence goes in `art/README.md` (SAFE-05): the ground and pieces are AI-generated with PixelLab by Claude for Morgan and cleaned with ChatGPT by Morgan (D-055).
- `apps/web/vite.config.ts`: `webp` added to Workbox's `globPatterns`.

### Spots

The Hall is always on its spot. Then, for each building in lot order: a Woodcutter's camp, Forager's hut, Farm or Mine takes its kind's site spot if no earlier building took it; every other building, and a second building of a site kind, takes the first free plot spot. Empty lots take the next free plot spots. (Proposed in Q2; option B is lot i on plot i.)

### Drawing

Each frame, in order: the ground; scenery, the Hall and buildings sorted by their bottom edge (so nearer things cover farther ones); glows and Build markers; smoke and scaffolding; walkers sorted with the buildings; the tier-0 line. A pale glow is a soft white oval under the spot at low opacity; the gold glow uses `--act` (`#d9a441`, the one action colour, D-028). Only the part of the map in the window is drawn. Frames: `requestAnimationFrame`, drawing only when 33 ms or more have passed since the last frame; the loop stops while `hidden` is true or `document.visibilityState` is `hidden`, and starts again on show. Each frame drawn adds 1 to the canvas's `data-frames`.

### Walkers

- Home: the plot spot of a Cottage, by `resident.id` modulo the number of Cottages, or the Hall when there are none. (Residents have no homes in the rules, `householdId` is null until M5a; this is cosmetic.)
- Loop: home → work (if they have a job) → the Hall → home, along the shortest path on the road graph, at a speed and start phase from `cosmetic.ts`, waiting a few seconds at each stop. Position = a function of the time in ms, so after a catch-up everyone is simply where their loop puts them.
- A resident on a trip is not drawn. Arrivals and departures walk from or to `edge` only in live play (J5).

## Slices

Each slice starts on a fresh branch from main and ends with `npm run check` and `npm run test:browser` green.

### S1 The map you can look at

- **First step:** a mock-up with `ui-mockups`: the Town tab at 412 px with the map window (per Q1's answer) from the real ground and pieces at 1×, 2× and 3×, a new town and a full Village, scored against the art checklist; Morgan approves before code.
- **Morgan tries:** opens the app: his own town on the map, the Hall in the middle, his buildings on their spots, empty lots glowing, scroll and the three zoom steps; works with the phone offline.
- **Checks that fail now:** J1 (all), J2, J6, J8; `town-camera.test.ts`, `town-layout.test.ts` "spots follow the rule", "the view reads the state and changes nothing", "the view uses its own random numbers".
- **Files:** `art/town_view_pack.py` and its outputs; `apps/web/src/town/` `map.ts` (spots and scenery, no road graph yet), `pieces.ts`, `layout.ts` (`spotsFor`, `scene` without life), `camera.ts`, `cosmetic.ts`, `TownView.tsx` (static drawing, redrawn on snapshot and scroll); `TownTab.tsx` (lazy load); `vite.config.ts` (webp); `scripts/check-bundle.mjs` (J8); `art/README.md` (sources).
- **Waits on:** Q1, Q2, Q3; the mock-up's approval.

### S2 Tap the map

- **Morgan tries:** taps a building on the map to open its sheet, an empty lot to build, a building under way to read how long, the Hall to reach its row.
- **Checks that fail now:** J3 (all); J2 "a new town on the map".
- **Files:** `TownView.tsx` (lot buttons, glows, Build markers, the tier-0 line); `TownTab.tsx` (shared sheet state); `tests/browser/town-view.spec.ts`.
- **Waits on:** S1.

### S3 The town at work

- **Morgan tries:** watches smoke from busy buildings, scaffolding on a build, stock piles by the Storehouse; switches to People and back.
- **Checks that fail now:** J4, J7.
- **Files:** `layout.ts` (smoke, scaffolding, piles); `TownView.tsx` (the frame loop, visibility, `data-frames`); `pieces.ts` (smoke, scaffold and pile frames, drawn in code as plain pixel shapes until PixelLab pieces exist).
- **Also:** measure and report the draw time per frame (median and worst of 300 frames) on `npm run preview`, Chromium with 4× CPU throttling, at 1× and 3×.
- **Waits on:** S1. Can run beside S2 if Morgan wants (it does not touch the lot buttons).

### S4 People walking

- **Morgan tries:** watches his residents walk between homes, work and the Hall; a settler walking in on the south road.
- **Checks that fail now:** J5 (all).
- **Files:** `map.ts` (the road graph, door points); `layout.ts` (walkers, arrivals and departures, `memory`); `pieces.ts` (walker frames per Q4).
- **Waits on:** S3 (the frame loop) and Q4.

## Verification

- Every push: `npm run check`.
- Before a PR is marked ready: `npm run test:browser` (local, not in CI), with screenshots at 412 px in the PR.
- End to end: J9 on Morgan's phone, recorded in HANDOFF in his words.

## Open questions

Each is a choice that changes what Morgan sees; the recommendation is marked. None is settled until Morgan answers; after approval each becomes a DECISIONS entry (write-spec §7).

- **Q1 Where the map sits on the Town tab.** (A, recommended) A map window at the top of the Town tab, as tall as the whole map at 1× (888 device px, about 338 CSS px at 2.625), with the Hall row, board, queue, lots list and log below it as today; the lots list stays as the second way in. Cheapest, and every M1 to M2e screen and test keeps working. It fails if Morgan wants the map to be the whole screen now. (B) The map fills the Town tab between a new compact header (stock icons, the "now" bar) and a picture tab bar (checklist S2, S3; D-041 Proposed). Needs its own mock-up and moves the board and queue elsewhere; about one more slice (Claude's estimate). (C) A ninth button, "Map", that opens the map full screen over the list.
- **Q2 Which spot a building takes.** (A, recommended) The rule in Design: the woodcutter, forager, farm and mine take their sites first, everything else the plots nearest the square. Matches checklist M16; clearing a lot can move later buildings to other plots until M2d. (B) Lot i on plot i: buildings never move, but the Mine can stand by the square.
- **Q3 Placeholder pieces for buildings with none.** There are pieces for the Hall, cottages (cottage a at three tiers), the farmhouse, forager, woodcutter and mine entrance; none for the Workshop, Storehouse and Tavern, and only cottage a has tier pieces. (A, recommended) The three take cottage pieces b, c and e with a small painted sign of their trade drawn in code, the same piece at every tier, until M2b step 4. (B) A plain labelled placeholder board on the plot. (C) Make the three in PixelLab first (about 3 to 6 generations, Claude's estimate; the last session's key was refused, PR #29).
- **Q4 Walker sprites until PixelLab characters exist.** (A, recommended) Use the ChatGPT villagers (`art/gpt/villagers/`, 8 villagers × 4 walk frames) as placeholders. D-048 keeps `art/gpt/` as reference, not game art, so this needs Morgan's yes as a stated exception until M2b step 4. (B) Tiny figures drawn in code (a 4 × 8 art-pixel body in a few colours). (C) Make walkers in PixelLab first (cost not estimated yet).
- **Q5 How many walkers.** (A, recommended) One per resident (up to 60 in v0.1). (B) A cap of 20 on screen if S3's frame measurement is slow. Asked only if S3's numbers say so.
