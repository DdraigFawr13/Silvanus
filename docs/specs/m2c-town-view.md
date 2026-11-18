# M2c Town view

- **Status:** Draft (2026-11-18), waiting for Morgan's answers to the open questions.
- **Planned in:** the M2 re-plan (`m2final`, https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG, 2026-11-14) and the art workshop (D-047, D-048, D-055, the agreed checklist `docs/workshop/art-checklist.md`). No separate interview: every rule below comes from those decisions, and each choice they leave open is an open question. **Decisions:** D-037, D-047, D-048, D-055, D-033, D-028; D-041 is Proposed, and only the checklist items Morgan agreed on 2026-11-16 (P1 to P4) are used from it.

## Problem

Morgan, M2 re-plan: "I'd like more graphically pleasing actual view of the town and people walking or moving around it. Kind of like project Vulcan", and "I just like seeing some animation showing things happening". On the art checklist: "i need to be able to click lots on the map. I want that to be the main way to like be able to interact with things" (P1). Today the Town tab is a list (Hall row, board, work queue, lots, log; `apps/web/src/ui/TownTab.tsx`). Nothing on screen moves, and nothing shows where anything is.

## Terms

- **Art pixel:** one pixel of the map picture. The map is 1408 × 888 art pixels (D-047, D-055).
- **Zoom step:** 1×, 2× or 3× device pixels per art pixel (D-047). Device pixels = CSS pixels × `devicePixelRatio` (dpr). Morgan's phone is about 2.6 (D-047's assumption; the old prototype was checked at 2.625, `docs/workshop/m2b-dragonscape.md`, "Approach chosen"). At 2.625 and 412 CSS px wide the steps show 1082, 541 and 360 art pixels of the width, so even at 1× the map scrolls sideways; the town's built area fits, the map's far edges do not.
- **Ground:** the target picture with the buildings off: `art/handoff_chatgpt/result_N_graded.png`, the newest one Morgan approved when S1 starts (`result_2_graded.png` on main; `result_3_graded.png` if PR #29 has merged). D-055 named `result_1_grown.png`; fixes 1 and 2 are its approved edits.
- **Piece:** a separate cut-out picture drawn on the ground. The 30 pieces of the target picture and their places are `art/pixellab/blocks/pass2_items.json` (`[file, x, y]`, top-left in art pixels; the files are in `art/pixellab/blocks/`). Measured on 2026-11-18: placing them on `result_2_graded.png` with `art/pixellab/blocks/place.py` gives `result_2_grown.png` with 0 pixels different, so those places match the ground.
- **Spot:** a place on the map where a lot is drawn: a rectangle in art pixels, a tap rectangle and a door point.
- **Lot order:** `state.buildings` is in lot order (`packages/sim/src/types.ts:71`). Clearing a lot or cancelling a first build removes its entry (`build.ts:174`, `:181`), so later buildings move up one. A new town has a Cottage and a Forager's hut and 6 lots (`newGame.ts:34`, content `hall.tiers[0].lots`); the Village has 10.
- **Live and catch-up snapshots:** the worker sends a snapshot after every message (`apps/web/src/worker.ts`). Its `ticks` is the ticks that message advanced: 0 for `load` and `command`. A catch-up snapshot has `ticks` at or over `AWAY_MIN_TICKS` (40, `apps/web/src/store.ts:8`); every other snapshot is live.

## Goals

- The Town tab shows the town as a drawn map: the ground, the scenery, the Hall, and one piece per built lot, drawn only from the latest snapshot (D-037).
- It scrolls, opens centred on the Hall, and zooms in three whole steps, 1×, 2×, 3×, with crisp pixels (no smoothing, scroll snapped to whole device pixels).
- Every lot and the Hall on the map are tap targets of at least 44 × 44 CSS px at every zoom step, not overlapping. A built lot opens its building sheet; an empty lot carries a soft pale glow and a Build marker and opens the build sheet (checklist P1, P2, P4). A built lot glows gold while its sheet is open and shows no glow otherwise (P3).
- The town moves: residents walk between a home, their work and the Hall; working buildings smoke and idle ones are still; builds, the Hall's included, show scaffolding; settlers walk in and out on the south road; stock piles by the Storehouse (D-037).
- The view uses its own cosmetic random numbers, never a game stream, and never changes the state (D-002, GAME-01, GAME-02). After time away it shows the present at once; nothing that happened during catch-up is replayed.
- It draws at 30 frames a second or less, only while the Town tab is shown and the page is visible, and draws nothing otherwise.
- It loads after the first screen: the view's code is its own chunk, not in the first load, which stays at or under 120,000 bytes gzipped (102,491 measured on main, 2026-11-18). The map art is precached, so the map works offline. If the chunk or the art fails to load, the rest of the tab still works.

## Non-goals

- No game rules: no grid, roads, adjacency or placement in the sim (D-033). The sim, content and save schema do not change.
- No new PixelLab art. This milestone draws with the pieces that exist; M2b step 4's assets replace them by changing the art files, not the drawing code.
- No dressed yards (P5), staked future lots (P6), surroundings that grow per tier (P7, P8), square stages (T4, D-042 Proposed), day and night, seasons or weather.
- No pinch zoom, no zoom between the steps (D-047), no sound.
- No new Town tab header, stock icons or picture tab bar (checklist S2, S3) unless Morgan picks it in Q1.

## Journeys and checks

The build starts from main at the commit S1 branches from. Every named test is new. Browser tests run at 412 × 915 CSS px with `deviceScaleFactor` 2.625 (`test.use` in the new spec file), so the 2.625 maths holds; the offline test uses `serviceWorkers: 'allow'`, as `tests/browser/smoke.spec.ts:308` does. Each browser test first checks `town-view` exists, so none passes at the start commit.

### J1 The map on the Town tab (S1)

- **Given** a new town (seed 1). **When** the app opens on the Town tab. **Then** `data-testid="town-view"` holds a scroll box `town-scroll`, one `canvas`, and the zoom row `zoom-1`, `zoom-2`, `zoom-3` with `aria-pressed` true on 1×; the scroll is set so the Hall spot's centre is in the middle of the window, within 1 art pixel, clamped at the map's edges. **Check:** `tests/browser/town-view.spec.ts` "the map opens on the Hall".
- **When** 2× is tapped. **Then** the canvas's `data-zoom` is 2, the same map point stays at the window's centre (within 1 art pixel), and a 2 × 2 block of device pixels read from the canvas (`getImageData`) at an art pixel's corner is one colour (no smoothing). **Check:** `town-view.spec.ts` "zoom keeps the centre and the pixels crisp"; `apps/web/test/town-camera.test.ts` "zoom steps, clamping and whole device pixels" (the camera maths, no DOM).
- **When** the People tab is shown and then the Town tab again. **Then** the scroll and zoom are as they were. **Check:** `town-view.spec.ts` "the map keeps its place across tabs".
- **Then** at 412 and 360 CSS px wide the page has no sideways scroll; only `town-scroll` scrolls sideways. At 1× the view has no vertical scroll, so a vertical swipe on it scrolls the page. **Check:** `town-view.spec.ts` "no page scroll at 412 and 360"; screenshots at 412 px in the PR (VER-06), beside the approved mock-up (S1's first step).

### J2 Buildings stand on their spots (S1, S2)

- **Given** a state. **When** `spotsFor(state)` runs. **Then** it returns one spot per building and one per empty lot (`hall.lots - buildings.length`), following the spot rule (Design, "Spots"); the same state always gives the same answer; no two lots share a spot. **Check:** `apps/web/test/town-layout.test.ts` "spots follow the rule" (cases: a new town; a second Mine; a cleared lot; 10 lots none of them site kinds, which uses all 10 plots).
- **Given** the art pack. **Then** drawing every scenery piece, the Hall and a piece on every spot at the art's positions reproduces the ground's matching `result_N_grown.png` exactly (0 pixels different), so no spot has drifted from the picture. **Check:** `art/town_view_pack.py` fails if not (run once per art change; its output is in the S1 PR).
- **Given** a new town. **Then** the map shows the Hall, the scenery, a Cottage and a Forager's hut, and 4 empty lots. **Check:** `town-view.spec.ts` "a new town on the map" (S2: counted from the lot buttons, J3), with a screenshot.

### J3 Lots are tap targets (S2)

- **Given** a new town. **Then** the view holds one button per lot (`data-testid="map-lot"`) and one for the Hall (`map-hall`, not a `map-lot`). Labels: "Cottage, tier 1"; "Empty lot, build here"; for tier 0, "Cottage, being built". Each is at least 44 × 44 CSS px at 1×, 2× and 3×, and no two overlap. **Check:** `town-view.spec.ts` "lot buttons are big enough and apart".
- **When** the Cottage's button is tapped. **Then** its `BuildingSheet` opens, the same one as the list's, and the spot glows gold until it closes. **When** an empty lot's button is tapped. **Then** the build sheet opens. **Check:** `town-view.spec.ts` "tapping a lot opens its sheet".
- **Given** a town whose state has a tier-0 building (built in the test with the sim's `apply` and a `build` command, then saved with `townRecord`, `tests/browser/helpers.ts:13`). **When** its button is tapped. **Then** a line `map-note` over the spot reads the list's text ("Building, 3 game hours left" or "Waiting in the work queue", `TownTab.tsx:141`) for 3 s; another tap replaces it. **When** the Hall is tapped. **Then** the Hall row (`data-testid="hall"`) is scrolled into view. **Check:** `town-view.spec.ts` "tier 0 and the Hall answer".

### J4 Signs of work (S3)

- **Given** a building with at least one worker (`residents[].jobId`) and `retoolLeft` 0. **Then** `scene` lists a `smoke` item for it; with no workers, or while retooling, none. **Given** `queue[0]` targets a building or the Hall (a first build or an upgrade). **Then** `scene` lists a `scaffold` item on that spot; a tier-0 building further back in the queue lists `pegs` only. **Given** a Storehouse and stock. **Then** `scene` lists one `pile` item per resource by the Storehouse first in lot order, with `size` 0 to 3 by stock / cap (0, under a third, under two thirds, more); without a Storehouse, none. **Check:** `town-layout.test.ts` "smoke, scaffolding and piles follow the state". These test the draw list (Design, "Parts"), not pixels; each case also asserts the item is absent in its opposite state, so an empty list fails.

### J5 People walk (S4)

- **Given** a state and an empty memory. **Then** `scene` lists one `walker` per resident not on a trip (`board.trip`), each with a home and a work spot (Design, "Walkers") and a position on the road graph. **Check:** `town-layout.test.ts` "one walker per resident".
- **Given** the first snapshot after a load. **Then** no one walks in. **Given** a live snapshot with a new resident. **Then** that resident walks in from `edge` first; a resident who has gone walks out to `edge`. **Given** a catch-up snapshot. **Then** no one walks in or out: everyone is on their loop at once. Memory is updated on every snapshot, also while the view is hidden. **Check:** `town-layout.test.ts` "settlers walk in live, not after load or time away" (snapshots built in the test with `ticks` set).
- **Given** a Cottage is built or a resident changes job. **Then** no other resident's home changes, and the resident whose work changed walks on from where they were, not from a jump. **Check:** `town-layout.test.ts` "homes are stable and routes continue".
- **Then** every spot's door point is joined to the road graph, and the graph is one connected piece. **Check:** `town-layout.test.ts` "every door is on the roads".

### J6 The view never touches the game (S1)

- **Given** a state. **When** `spotsFor` and `scene` run 1,000 times at different times. **Then** the state is deep-equal to a copy taken before, `state.rng` included. **Check:** `town-layout.test.ts` "the view reads the state and changes nothing".
- **Then** `apps/web/src/town/` holds at least 5 source files, none imports from `@silvanus/sim` anything but types and the read-only helpers `kindOf`, `hallOf` and `capsOf`, and none calls `Math.random`. **Check:** `town-layout.test.ts` "the view uses its own random numbers" (reads the folder's sources; fails on an empty or missing folder).

### J7 It draws only when seen, at 30 frames a second or less (S3)

- **Given** the Town tab shown. **When** 2 s pass. **Then** the canvas's `data-frames` counter rose by 40 to 62. **When** the People tab is shown for 2 s. **Then** it rises by 0. **When** the page is hidden (the test redefines `document.visibilityState` as `hidden` and sends `visibilitychange`) for 2 s. **Then** it rises by 0, and it runs again when the page shows. **Check:** `town-view.spec.ts` "frames: at most 30 a second, none when hidden". The 2 s waits are wall-clock limits (VER-11): the test runs alone, not in a parallel lane.

### J8 It loads after the first screen and works offline (S1)

- **Given** `npm run build`. **Then** a chunk `TownView-*.js` exists, it is not in `index.html` (neither the entry nor a `modulepreload`), and the first load stays at or under 120,000 bytes gzipped. **Check:** `scripts/check-bundle.mjs` gains both assertions (the first fails at the start commit: no such chunk).
- **Then** the service worker's precache list in `apps/web/dist/sw.js` names the ground (`ground-*.webp`) and the piece sheet (`pieces-*.png`). **Check:** `check-bundle.mjs`. Why: Workbox skips any file over 2,097,152 bytes by default (`node_modules/workbox-build/build/types.d.ts:152`), and the ground as PNG is 2,332,279 bytes even re-saved (measured, `result_2_graded.png`), so a PNG ground would silently not be precached.
- **Given** the app was loaded once. **When** it reloads offline. **Then** the map draws: a pixel at the Hall's centre is not `--bg`. **Check:** `town-view.spec.ts` "the map draws offline".
- **Given** the chunk or the ground fails to load (the test aborts its request). **Then** the view shows "The map could not load." with a Retry button, and the Hall row, board and lots list below work. **Check:** `town-view.spec.ts` "a failed map leaves the tab working".

### J9 The M2c test (device check, Morgan)

- **Given** the build on the phone. **When** Morgan watches the town over a check-in (charter, Milestones, M2c). **Then** he says whether watching it is worth it, in his words, recorded in HANDOFF; and he taps a lot on the map to open it. Frame rate and smoothness on the phone count only with his word (VER-07).

## Decisions

- The view draws only from the latest snapshot, has its own cosmetic random numbers, jumps to the present after time away, draws at most 30 frames a second only while the Town tab is open, and is a plain canvas loaded after the first screen (D-037).
- Spots are scenery; the sim gains nothing (D-033). No new condition or effect type, no save upgrade.
- The map is 1408 × 888 art pixels with zoom steps 1×, 2×, 3× (D-047); the ground and pieces come from the target picture (D-055).
- Lots on the map are buttons; empty lots glow pale and carry a Build marker; built lots glow gold only while open (checklist P1 to P4).
- Defaults chosen here, not Morgan's (none changes what he sees; say if one is wrong): the ground ships as lossless WebP (1,832,492 bytes measured for `result_2_graded.png`, the same pixels, under Workbox's limit); taps are DOM buttons over the canvas; the canvas is the window's size, not the map's; walkers loop home, work, Hall with no daily schedule (day and night are M3 or M4, D-035); walk speed 20 art px a second and a 4 s stop at each place, tuning values in `map.ts` judged by eye.

## Alternatives rejected

- **Hit-testing taps on the canvas:** no DOM for Playwright or a screen reader, and every tap answer needs its own code. It would fail the first browser test that has to find a lot.
- **A canvas as big as the map at the zoom step:** at 3× it is 4224 × 2664 device pixels, about 45 MB, on a phone.
- **CSS-scaled `<img>` tags (the old prototype's way, `art/prototype/index.html`):** smoke and walkers become hundreds of moving elements, and D-037 asks for a canvas.
- **The ground as PNG with a raised precache limit:** works, but ships 0.5 MB more on every art update. **As lossy WebP** (420,422 bytes at quality 90, measured): changes the approved picture, which the AGENTS art rule forbids without asking.
- **Saving each building's spot:** the only way a spot never moves, but it is game state, and lots as records are M2d's job (D-038). It would be thrown away when M2d changes the lot model.
- **Homes by resident id modulo the Cottages:** simple, but every new Cottage would move half the town's homes at once (critic finding).
- **Walkers following game hours:** no rule for it exists; inventing one is WS-06.
- **Fixed door-to-Hall paths instead of a road graph** (critic's simpler option): fewer lines of code, but work trips (door to door) would need a path per pair, 105 for 15 spots. Declined.

## Risks

- **D-037 says "one fixed spot per lot", and no rule drawn from the state alone can keep that when a lot is cleared or a first build cancelled**, because lot order compacts (`build.ts:174`, `:181`). Under either Q2 option a later building can move to another spot then. → Named in Q2; fixed for good by M2d's lot records.
- **The map's art is not final.** → The art lives in data made by one script; the pack's 0-pixel check catches drift.
- **Morgan rejected the last canvas prototype's look** ("No that still sucks", workshop log, step 1, 2026-11-16). That was the old map; this view shows the approved target picture. → S1 starts with a mock-up from the real ground and pieces, scored against the art checklist, approved before code (AGENTS art rule).
- **Frame cost on the phone is unmeasured.** → S3 measures draw time per frame on a production build in the container and reports it; Morgan's phone decides (J9, Q5).
- **Scroll judder:** the browser scrolls the box at once, the canvas follows. → The canvas also redraws on every `scroll` event (outside the 30 fps loop) at the snapped offset, so it never lags a frame behind the buttons.
- **The target picture has 10 plot spots and 4 site spots.** Enough for v0.1's 10 lots; M2d's Town tier needs more (D-038). → M2d's spec adds spots.

## Design

### Parts

- `apps/web/src/town/map.ts` (data, hand-made from `pass2_items.json`): the map size; the Hall's spot; the **site spots** `woodcutter`, `forager`, `farm`, `mine` (the target's woodcutter, forager, farmhouse and mine-entrance places); the **plot spots** (the 10 cottage places, nearest the square's centre first); the **scenery** (every other entry: lamps, ruins, stones, tar pit, yard, stalls, fisher's hut); for each spot its tap rectangle (the piece's box grown to at least 44 CSS px at 1× and dpr 2.625, about 116 art px, kept apart from its neighbours) and its door point; the Storehouse pile offsets; from S4 the road graph (nodes in art pixels, edges, the south edge node `edge`) and the tuning values.
- `apps/web/src/town/pieces.ts` (made by the pack script): `{ [name]: { x, y, w, h, smoke?: [dx, dy] } }`, frames in `pieces.png`; which piece each kind draws at each tier (Q3); the walker frames (Q4).
- `apps/web/src/town/layout.ts` (pure, no DOM): `spotsFor(state): Spot[]`; `remember(memory, snapshot): Memory` (a new value; which ids it has seen, arrival and departure walks with their start ms, each walker's last route and position); `scene(state, memory, ms, open): Item[]`, where `open` is the building id whose sheet is open or null. `Item` is one of `piece`, `glow` (`pale` or `gold`), `build-marker`, `smoke`, `scaffold`, `pegs`, `pile`, `walker`, each with art-pixel `x`, `y` and a `depth` (bottom edge) for sorting.
- `apps/web/src/town/camera.ts` (pure): `camera(windowCss, zoom, dpr, scrollCss)` → the art rectangle to draw and the offsets snapped to whole device pixels; `centreOn(point, …)` and `rezoom(…)` keep a map point at the centre.
- `apps/web/src/town/cosmetic.ts`: a small seeded generator for the view only (walk phases, smoke drift), seeded from `state.seed` and an id.
- `apps/web/src/town/TownView.tsx` (lazy): `town-scroll` with a spacer the map's size at the zoom step in CSS px; a canvas the window's size, pinned with `position: sticky`; the lot and Hall buttons placed absolutely in the spacer; the zoom row; `map-note`; the frame loop. It subscribes to the store (`subscribe`, `current`, `apps/web/src/store.ts`) and calls `remember` on every snapshot, hidden or not.
- `apps/web/src/ui/TownTab.tsx`: loads `TownView` with `React.lazy` inside `Suspense` (a placeholder the view's height) and an error boundary (the J8 line and Retry, which retries the import); passes `hidden`, the sheet openers and a Hall callback that scrolls `data-testid="hall"` into view. The sheet state stays in `TownTab`, so the map and the list open the same sheets.
- `art/town_view_pack.py` (Pillow, already in `art/requirements.txt`): writes `apps/web/src/town/art/ground.webp` (lossless), `pieces.png` and `pieces.ts`, and runs the 0-pixel check (J2). Vite gives both art files hashed names when `TownView` imports them. Their source and licence go in `art/README.md` (SAFE-05): AI-generated with PixelLab by Claude for Morgan, the ground cleaned with ChatGPT by Morgan (D-055).
- `apps/web/vite.config.ts`: `webp` added to Workbox's `globPatterns`. `tests/browser/helpers.ts`: `.webp` added to `TYPES`.

### Spots

The Hall is always on its spot. Then, for each building in lot order: a Woodcutter's camp, Forager's hut, Farm or Mine takes its kind's site spot if no earlier building took it; every other building, and a second building of a site kind, takes the first free plot spot. Empty lots take the next free plot spots. (Q2 option A; option B is lot i on plot i.)

### Drawing

Each frame: the ground; scenery, the Hall, buildings and walkers sorted by `depth`; glows and Build markers; smoke, scaffolding and pegs; drawn only for the part of the map in the window, at the snapped offsets, with `imageSmoothingEnabled` false. The pale glow is a soft white oval under the spot at low opacity; the gold glow uses `--act` (`#d9a441`, D-028). Frames: `requestAnimationFrame`; the next frame is due 33.3 ms after the last one was due (the remainder is carried, so a 60 Hz screen gives 30 a second, not 20); the loop stops while `hidden` (the prop `App.tsx:382` passes when another tab is shown) is true or `document.visibilityState` is `hidden`, and starts on show. Each frame adds 1 to the canvas's `data-frames`. Before S3 the canvas draws once per snapshot, scroll, zoom or sheet change.

### Walkers

- Home: residents in id order fill the Cottages' beds (`tiers[].beds`) in Cottage id order, each keeping their Cottage while it stands and they live; those without a bed live at the Hall. A new Cottage takes only those without one. (Residents have no homes in the rules, `householdId` is null until M5a; this is cosmetic.)
- Loop: home → work (their job's building, tier 0 included) → the Hall → home, along the shortest path on the road graph, at the tuning speed with the tuning stop at each place, its start phase from `cosmetic.ts`. When a home or job changes, the walker walks from its last position to the new place, then goes on with the loop.
- A resident on a trip is not drawn. Arrivals and departures walk from or to `edge` only on live snapshots (J5).

## Slices

Each slice starts from main on a fresh branch and ends with `npm run check` and `npm run test:browser` green. They run in order: S2 and S3 both change `TownView.tsx`.

### S1 The map you can look at

- **First step:** a mock-up with `ui-mockups`: the Town tab at 412 px with the map (per Q1) from the real ground and pieces at 1×, 2× and 3×, a new town and a full Village, scored against the art checklist; Morgan approves before code.
- **Morgan tries:** opens the app: his own town on the map, the Hall in the middle, his buildings on their spots, scroll and the three zoom steps; offline too.
- **Checks that fail now:** J1, J2 "spots follow the rule" and the pack check, J6, J8; `town-camera.test.ts`.
- **Files:** `art/town_view_pack.py` and its outputs; `apps/web/src/town/` `map.ts` (spots, tap rectangles, door points, scenery), `pieces.ts`, `layout.ts` (`spotsFor`, `scene` with pieces only), `camera.ts`, `cosmetic.ts`, `TownView.tsx`; `TownTab.tsx` (lazy load, error boundary); `vite.config.ts`; `tests/browser/helpers.ts`; `scripts/check-bundle.mjs`; `art/README.md`.
- **Waits on:** Q1, Q2, Q3; the mock-up's approval.

### S2 Tap the map

- **Morgan tries:** taps a building to open its sheet, an empty lot to build, a building under way to read how long, the Hall to reach its row.
- **Checks that fail now:** J2 "a new town on the map", J3.
- **Files:** `TownView.tsx` (buttons, `map-note`); `layout.ts` (glows, Build markers); `TownTab.tsx` (shared sheet state, Hall callback); `tests/browser/town-view.spec.ts`.
- **Waits on:** S1.

### S3 The town at work

- **Morgan tries:** watches smoke from busy buildings, scaffolding on a build or the Hall's upgrade, stock piles by the Storehouse; switches to People and back.
- **Checks that fail now:** J4, J7.
- **Files:** `layout.ts` (smoke, scaffold, pegs, piles, drift from `cosmetic.ts`); `TownView.tsx` (the frame loop, visibility, `data-frames`); `pieces.ts` (smoke anchors per piece; smoke, scaffold, peg and pile frames drawn in code as plain pixel shapes until PixelLab pieces exist).
- **Also:** measure and report draw time per frame (median and worst of 300 frames) on `npm run preview`, Chromium with 4× CPU throttling, at 1× and 3×.
- **Waits on:** S2.

### S4 People walking

- **Morgan tries:** watches residents walk between homes, work and the Hall; a settler walking in on the south road.
- **Checks that fail now:** J5.
- **Files:** `map.ts` (road graph, tuning values); `layout.ts` (`remember`, walkers); `TownView.tsx` (`remember` on every snapshot); `pieces.ts` (walker frames per Q4).
- **Waits on:** S3 and Q4.

## Verification

- Every push: `npm run check`.
- Before a PR is marked ready: `npm run test:browser` (local, not in CI), with screenshots at 412 px in the PR.
- End to end: J9 on Morgan's phone, recorded in HANDOFF in his words.

## Open questions

Each changes what Morgan sees; the recommendation is marked. After approval each becomes a DECISIONS entry (write-spec §7).

- **Q1 Where the map sits on the Town tab.** (A, recommended) A map window at the top of the Town tab, as tall as the whole map at 1× (888 device px, about 338 CSS px at 2.625), with the Hall row, board, queue, lots list and log below as today; the list stays as the second way in. Cheapest, and every screen and test from M1 to M2e keeps working. It fails if Morgan wants the map to be the whole screen now. (B) The map fills the Town tab between a new compact header (stock icons, the "now" bar) and a picture tab bar (checklist S2, S3; D-041 Proposed); needs its own mock-up and moves the board and queue; about one more slice (Claude's estimate). (C) A "Map" button that opens the map full screen over the list.
- **Q2 Which spot a building takes.** (A, recommended) The rule in Design: the woodcutter, forager, farm and mine take their sites first, everything else the plots nearest the square (checklist M16). (B) Lot i on plot i: the Mine can stand by the square. Under both, clearing a lot or cancelling a first build can move a later building to another spot until M2d gives lots records; that departs from D-037's "one fixed spot per lot", which no view-only rule can keep.
- **Q3 Placeholder pieces for buildings with none.** Pieces exist for the Hall, cottages (cottage a at three tiers), the farmhouse, forager, woodcutter and mine entrance; none for the Workshop, Storehouse and Tavern. (A, recommended) The three use cottage pieces b, c and e with a small trade sign drawn in code, the same piece at every tier, until M2b step 4. (B) A plain labelled board on the plot. (C) Make the three in PixelLab first (about 3 to 6 generations, Claude's estimate; the last session's key was refused, PR #29).
- **Q4 Walker sprites until PixelLab characters exist.** (A, recommended) The ChatGPT villagers (`art/gpt/villagers/`, 8 villagers × 4 walk frames) as placeholders. D-048 keeps `art/gpt/` as reference, not game art, so this needs Morgan's yes as a stated exception until M2b step 4. (B) Tiny figures drawn in code. (C) Walkers made in PixelLab first (cost not estimated).
- **Q5 How many walkers.** (A, recommended) One per resident (up to 60 in v0.1). (B) At most 20 on screen, asked only if S3's frame numbers are slow.
