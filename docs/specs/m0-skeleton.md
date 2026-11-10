# M0 Skeleton

- **Status:** Approved 2026-11-09
- **Planned in:** final plan https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv, review https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ, round 5 https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG. **Decisions:** D-001, D-002, D-003, D-010, D-018, D-020, D-022, D-023.

## Problem

There is no game yet. Morgan's goal (round 5): "I want to see what resources were gathered and where quests are in their progress." Before any of that can exist, the phone has to hold a town that keeps working while the app is closed and is still there the next day. M0 builds only that: a number that grows by the game's clock, survives closing, and can be installed and carried as a file.

## Goals

- The app is installed on Morgan's Android phone from Chrome and starts with no network.
- A food counter grows by the engine's rules at 1 tick per 60 s, live and while closed, and both give the same state for the same number of ticks.
- Closing and reopening after `m` whole minutes advances the tick by `min(m, 480)`.
- A save can be exported to a file and imported again.
- `npm run check` passes locally and in CI in under 60 s (target; measured in S1).

## Non-goals

- Residents, buildings, lots, quests, trade, events, chronicle. `residents` is an empty list in M0.
- The real screens and look. M0 has one plain debug page; the style doc (`ui-style` skill) and mock-ups start with M1.
- Art beyond a placeholder app icon.
- Balance. The forager numbers below exist only to move a counter.

## Journeys and checks

At approval: no check below can pass at commit `422360b`: the repo has no `package.json` and no code.

### J1 The counter ticks by the rules

- **Given** a new game with seed 1 and 1 forager
- **When** 8 ticks pass
- **Then** the tick is 8 and food is 3: it rose by 1 at tick 4 and by 2 at tick 8 (the first `yield` draws for seed 1 are 0, 1, 0, 1, 1, 1; computed 2026-11-09). Separate tests cover the cap and a bad command. **Check:** `packages/sim/test/step.test.ts` "forager adds food every 4 ticks", "food over the cap is lost", "bad command is rejected"; `packages/sim/test/calendar.test.ts` "tick 672 is year 2".

### J2 Live play equals catch-up

- **Given** one state
- **When** it is stepped 500 times one tick at a time, and separately advanced by 500 in one call
- **Then** the two states are deeply equal. **Check:** `packages/sim/test/determinism.test.ts` "advance equals repeated step".

### J3 One system's draws do not move another's

- **Given** two streams, `yield` and `spare`
- **When** `yield` is drawn 0 times or 50 times
- **Then** the next 5 draws from `spare` are the same. **Check:** `packages/sim/test/rng.test.ts` "streams are independent", and "known values": `nextU32(99)` gives value 1118692146 and state 1831565912; the first three raw values of `yield` for seed 1 are 3691527598, 2949923741, 463591088.

### J4 The clock never runs backwards or past the cap

- **Given** an anchor time and a tick length of 60,000 ms
- **When** now is earlier than the anchor; 150,000 ms later; 40 hours later
- **Then** the ticks due are 0 (anchor reset to now); 2 (30,000 ms kept); 480 (anchor reset to now). **Check:** `apps/web/test/clock.test.ts` "due ticks".

### J5 It remembers

- **Given** the page opened with `?tickMs=200` has reached tick 20 or more, Foragers has been set to 3, the tick then read is `t`, and "Saved at tick" has reached `t` or more
- **When** the page is reloaded with `?tickMs=60000`
- **Then** Foragers shows 3 and the tick is from `t` to `t + 50`. A game that was not kept would show Foragers 1 and tick 0. **Check:** `tests/browser/smoke.spec.ts` "reload keeps the town".

### J6 A save the app cannot read is never overwritten

- **Given** a stored record with `schema: 2`, or one whose state fails the shape check
- **When** the app loads
- **Then** it shows "This save is from a newer version of the game." or "This save is damaged." with an Export button, starts no game, and the stored record is unchanged. **Check:** `apps/web/test/saves.test.ts` "too-new save is refused and kept", "damaged save is refused and kept" (on `parse` and `load`); `tests/browser/smoke.spec.ts` "unreadable save shows the refusal" (the test serves an empty page at `/seed.html` with `page.route`, opens it, writes a `schema: 2` record into `silvanus-test` there, then opens `/?tickMs=60000` and reads the message and the stored record).

### J7 Export and import round-trip

- **Given** a save at tick `t`
- **When** it is exported to text and imported
- **Then** the imported state deeply equals the original; malformed text is rejected with a message and changes nothing. **Check:** `apps/web/test/saves.test.ts` "export then import", "import rejects bad files".

### J8 The soak holds its invariants

- **Given** seed 1 and a bot that changes foragers at random
- **When** 10,000 ticks run
- **Then** every stock is a whole number between 0 and its cap, the tick rises by 1 each step, `produced` is above 0, and the script exits 0 after printing produced, lost and ticks per second. **Check:** `npm run soak`.

### J10 Only one window runs the town

- **Given** the app is open in one tab
- **When** a second tab opens the same address
- **Then** the second tab shows "Silvanus is open in another window." in `notice` and has no `tick` element. By design it starts no worker and saves nothing. **Check:** `tests/browser/smoke.spec.ts` "second window stands down".

### J9 Installed and offline (device check, Morgan)

- **Given** the hosted build open in Chrome on the phone
- **When** Morgan adds it to the Home screen, turns on airplane mode and opens it
- **Then** it starts and shows the town. **Check:** Morgan's report; an agent cannot see the phone (VER-07).

## Decisions

- Android PWA, TypeScript, React, Vite, npm workspaces (D-001, D-010).
- 1 tick is 60 s; catch-up uses the live step function; cap 480 ticks (D-002).
- No network calls in the game (D-003).
- Decisions wait and events queue (D-018): not built in M0, but the clock in this spec is what they rely on.
- The save holds age and family fields from M0 (D-020).
- Hosting is Vercel, project `silvanus` (D-024).

## Alternatives rejected

- **No worker in M0, engine on the page's thread:** rejected because M1 adds per-resident work to every catch-up, and the cap later rises from 480 to 1,440 ticks (charter, "Time"), and the page-to-engine messages would be rewritten then. It would be the simpler choice if M0 were the whole game.
- **The worker owns a per-tick timer:** rejected because browsers slow or stop timers in hidden tabs, so live play and catch-up would be two code paths. It fails when the tab is in the background.
- **A closed-form catch-up (rate times time):** rejected because it cannot equal live play once anything is random (D-002).
- **localStorage for saves:** rejected because of its size limit of about 5 MB and string-only values. It fails when 150 residents and a chronicle are stored.
- **Asking the worker for the state when the page hides:** rejected because the page unloads and the worker is terminated before the reply (Project-Vulcan `docs/LESSONS.md:17`).
- **Service worker that updates itself at once (`autoUpdate`):** rejected because new code could meet a state loaded by old code in the same session.
- **A hand-written service worker:** rejected because hashed file names need a generated list of files to cache.
- **The `idb` package:** rejected because it is a runtime dependency for about 60 lines of code (SAFE-01).
- **ESLint in M0:** deferred. The engine's rules are enforced by its TypeScript `lib` setting and a purity script. It fails once the UI grows; revisit in M1.
- **Floating-point amounts:** rejected by D-002.

## Risks

- Android Chrome may not finish a write when the app is swiped away → the standby copy is also written when the page becomes hidden, which fires earlier, and autosave bounds the loss to 10 ticks.
- The browser may clear storage → the app asks for persistent storage and shows the answer; the Export button exists from S3 (S2 has it on the refused-save screens only). Not checked: how Android Chrome answers that request for an installed PWA.
- The installed app and a Chrome tab share one save → only one window runs the town (J10).
- A test tick length could write fast ticks into the real save → `?tickMs` uses its own database.
- TypeScript 7, Vite 8 and vite-plugin-pwa 2 are recent → a scratch prototype on 2026-11-09 installed, type-checked and built a workspace with a worker and the PWA plugin (HANDOFF "Just done"). Not prototyped: IndexedDB writes on `pagehide`; that pattern is copied from Project-Vulcan `src/persist/saves.ts:98-99`.

## Design

### Versions

Pinned exactly: Node 24.19.0 (`.nvmrc`), npm 11.9.0 (`packageManager`), as Morgan's other repos. `vite` 8.3.7, `react` and `react-dom` 19.3.1, `@vitejs/plugin-react` 6.3.0, `vite-plugin-pwa` 2.0.0, `typescript` 7.0.2, `vitest` 5.1.0, `prettier` 3.9.10, `tsx` 4.23.15, `@playwright/test` 1.65.0, `fake-indexeddb` 6.2.8. Only `react` and `react-dom` are runtime dependencies. `@types/react`, `@types/react-dom` (newest 19.x) and `@types/node` (newest 24.x): the version at install time, then pinned. Development dependencies sit in the root `package.json`. Workspace edges: `@silvanus/content` depends on `@silvanus/sim`; `@silvanus/web` depends on both and on `react` and `react-dom`.

### Layout

```text
package.json            workspaces: packages/*, apps/*; scripts below
.nvmrc  .npmrc          24.19.0; engine-strict=true
.prettierrc.json        { "printWidth": 100, "singleQuote": true }
tsconfig.json           extends the base; includes scripts, tests and every *.config.ts; lib ["ES2022","DOM"]; types ["node"]
.prettierignore         existing lines kept; S1 adds /apps/web/dist/, /.claude/, /docs/ and package-lock.json
tsconfig.base.json      strict, target ES2022, module ESNext, moduleResolution Bundler, noEmit
vitest.config.ts        include packages/*/test/**/*.test.ts and apps/*/test/**/*.test.ts
playwright.config.ts    S2. As Project-Vulcan's: testDir tests/browser, 1 worker, 0 retries, baseURL http://127.0.0.1:4173,
                        webServer "npm run build && npm run preview -- --port 4173 --strictPort", one project, chromium, devices['Desktop Chrome'], reporter list,
                        launchOptions.executablePath from PLAYWRIGHT_CHROMIUM_PATH when it is set
vercel.json             only if hosting is Vercel (S1)
packages/sim/           name @silvanus/sim; tsconfig.json extends the base, lib ["ES2022"], types [], include ["src","test"]
  src/types.ts  rng.ts  calendar.ts  step.ts  newGame.ts  index.ts
  test/
packages/content/       name @silvanus/content; depends on @silvanus/sim for types; tsconfig.json as sim's
  src/index.ts
apps/web/               name @silvanus/web; tsconfig.json extends the base, lib ["ES2022","DOM","WebWorker"], jsx react-jsx, include ["src","test"]
  index.html  vite.config.ts  public/icon-192.png  public/icon-512.png
  src/main.tsx  App.tsx  clock.ts  worker.ts  saves.ts  app.css
  test/
scripts/soak.ts  check-sim-purity.mjs  check-bundle.mjs  make-icons.mjs
tests/browser/smoke.spec.ts
```

Each package's `exports` points at `./src/index.ts`; nothing is built except the web app.

### Engine (`packages/sim`)

```ts
type StreamName = "yield" | "spare";
type RngState = Record<string, number>; // stream name -> unsigned 32-bit state; a stream is added on its first draw

type Resident = {
  // unused in M0; holds the age and family fields (D-020). M1 adds trade, skills, traits and morale with schema 2 and an upgrade step
  id: number;
  name: string;
  people: string;
  bornTick: number;
  motherId: number | null;
  fatherId: number | null;
  spouseId: number | null;
  householdId: number | null;
};

type State = {
  contentVersion: number; // from Content.version; set to the running content's version on load
  seed: number;
  tick: number; // whole game hours since the start
  rng: RngState;
  stock: { food: number };
  foragers: number; // M0 only, 0..content.camp.maxForagers
  residents: Resident[]; // [] in M0
};

type Content = {
  version: number;
  resources: { food: { cap: number } };
  camp: {
    everyTicks: number;
    maxForagers: number;
    yieldMin: number;
    yieldMax: number;
  };
};

type Command = { type: "setForagers"; count: number };
type LogEntry =
  | { tick: number; type: "produced"; amount: number }
  | { tick: number; type: "lost"; amount: number } // over the cap
  | { tick: number; type: "foragersSet"; count: number }
  | { tick: number; type: "rejected"; command: Command };

function newGame(seed: number, content: Content): State;
function apply(
  state: State,
  commands: Command[],
  content: Content,
): { state: State; log: LogEntry[] }; // commands only; the tick does not move
function step(
  state: State,
  commands: Command[],
  content: Content,
): { state: State; log: LogEntry[] };
function advance(
  state: State,
  ticks: number,
  content: Content,
): { state: State; produced: number; lost: number };
function draw(
  rng: RngState,
  stream: StreamName,
  seed: number,
  n: number,
): { value: number; rng: RngState }; // whole number in [0, n)
function nextU32(state: number): { value: number; state: number }; // one mulberry32 step
function calendar(tick: number): {
  year: number;
  season: 0 | 1 | 2 | 3;
  day: number;
  hour: number;
};
```

- `index.ts` exports every type above and `newGame`, `apply`, `step`, `advance`, `draw`, `nextU32`, `calendar`.
- `apply` and `step` never change their input; they return a new state.
- Order inside one `step`: `apply` the commands in order, then production, then `tick + 1`.
- `setForagers` with a count that is not a whole number from 0 to `maxForagers` is logged as `rejected` and changes nothing. A valid one is logged as `foragersSet` even when the count is unchanged.
- Production: when `(tick + 1) % everyTicks === 0`, for each forager in turn `{ value, rng } = draw(rng, 'yield', state.seed, yieldMax - yieldMin + 1)`; the returned `rng` feeds the next draw and the forager adds `yieldMin + value`. The foragers' food is summed, then capped once. `produced` is the food actually added after the cap; `lost` is the rest. A `produced` or `lost` entry is logged only when its amount is above 0.
- `advance(state, n)` gives the state that `n` calls of `step(state, [])` give.
- `nextU32(state)`: `state = (state + 0x6D2B79F5) >>> 0`; `t = Math.imul(state ^ (state >>> 15), state | 1)`; `t ^= t + Math.imul(t ^ (t >>> 7), t | 61)`; `value = (t ^ (t >>> 14)) >>> 0`. The state stored is the one after the addition.
- `draw` takes the stream's state from `rng`, or, when the stream is missing, starts it at the 32-bit FNV-1a hash of the name's character codes (offset 2166136261, prime 16777619, with `Math.imul`), XOR `seed >>> 0`. It calls `nextU32` once and returns the whole number `value % n`. `n` must be a whole number of 1 or more; otherwise `draw` throws a `RangeError`. The small bias of `% n` is accepted. `newGame` starts with `rng: {}`.
- Arithmetic allowed in the engine: `+`, `-`, `*`, `%`, bit operators, `Math.imul`, `Math.min`, `Math.max`, and `Math.floor(a / b)` for whole division.
- `calendar`: 24 hours a day, 7 days a season, 4 seasons a year; year and day start at 1; tick 672 is year 2, season 0, day 1, hour 0.
- New game: `tick` 0, `food` 0, `foragers` 1. The app's seed for a new game is one value from `crypto.getRandomValues(new Uint32Array(1))`, taken in `main.tsx` before the first render, not in the engine.
- Banned in `packages/sim/src` and `packages/content/src`, checked by `scripts/check-sim-purity.mjs` as whole words in the code with `//` and `/* */` comments removed: `Date`, `performance`, `Math.random`, `setTimeout`, `setInterval`, `window`, `document`, `Math.sin`, `Math.cos`, `Math.tan`, `Math.pow`, `Math.log`, `Math.exp`, `Math.sqrt`. The bare word `log` is allowed.

### Content (`packages/content`)

`content: Content = { version: 1, resources: { food: { cap: 200 } }, camp: { everyTicks: 4, maxForagers: 3, yieldMin: 1, yieldMax: 2 } }`.

### Clock (`apps/web/src/clock.ts`)

```ts
const TICK_MS = 60_000;
const CATCH_UP_CAP = 480;
function due(
  nowMs: number,
  anchorMs: number,
  tickMs: number,
  cap: number,
): { ticks: number; anchorMs: number };
```

- `anchorMs` is the wall-clock time at which the stored tick was true.
- `elapsed = nowMs - anchorMs`. If `elapsed < 0`: 0 ticks, anchor becomes `nowMs`. Else `n = floor(elapsed / tickMs)`. If `n > cap`: `cap` ticks, anchor becomes `nowMs`. Else `n` ticks, anchor becomes `anchorMs + n * tickMs`.
- The page runs `due` once a second and when it becomes visible, against the anchor of the last snapshot it received, and never while an advance is waiting for its snapshot. If ticks are due it sends them to the worker with the new anchor. Live play and catch-up are this one path.
- `?tickMs=<whole number from 50 to 60000>` in the address overrides `TICK_MS` for testing. The value must match `^[0-9]+$` and be in range; anything else is ignored. When it is set, the database name is `silvanus-test`, so a test never touches the real save.

### Worker (`apps/web/src/worker.ts`)

- In: `{ type: 'load', state, anchorMs }`, `{ type: 'advance', ticks, anchorMs }`, `{ type: 'command', command }`.
- Out, after every message: `{ type: 'snapshot', state, anchorMs, ticks, produced, lost }`. `anchorMs` is the last one the worker was given. `ticks`, `produced` and `lost` are 0 except after an `advance`.
- `advance` calls the engine's `advance`. `command` calls `apply(state, [command])` at once, so a tap shows in the next snapshot and is in the next save. Step logs are dropped in M0.
- The worker holds the state and has no timer.

### Saves (`apps/web/src/saves.ts`)

```ts
const SCHEMA = 1;
type SaveRecord = { schema: number; anchorMs: number; state: State };
type Loaded =
  | { kind: "none" }
  | { kind: "ok"; record: SaveRecord }
  | { kind: "tooNew"; raw: unknown }
  | { kind: "damaged"; raw: unknown }
  | { kind: "unavailable" };
function parse(raw: unknown): Loaded; // shared by load and importText
function load(): Promise<Loaded>;
function save(record: SaveRecord): Promise<void>; // ends with tx.commit()
function exportText(raw: unknown): string; // JSON, 2-space indent; also used for a refused record
function importText(text: string): SaveRecord; // throws Error with a readable message
```

- IndexedDB database `silvanus` (`silvanus-test` under `?tickMs`), version 1, object store `saves` with no key path; the one record is stored under the key `'main'`. The save's version is `SaveRecord.schema`; the state carries none.
- `parse` checks, in order: `raw` is an object with a whole-number `schema`, else `damaged`; `schema > SCHEMA` gives `tooNew`; the upgrade steps `upgrades: Record<number, (old: unknown) => unknown>` run from the stored schema up to `SCHEMA` (the table is empty in M0); then the shape check, else `damaged`.
- The shape check: `anchorMs` is a finite number; `state.seed`, `tick`, `contentVersion`, `stock.food` and `foragers` are whole numbers of 0 or more; `foragers` is at most `content.camp.maxForagers`; every value in `rng` is a whole number from 0 to 4294967295; `residents` is an array.
- `load` gives `unavailable` when IndexedDB cannot be opened. The page then shows "Saving is not available in this browser. The town will not be kept." and runs without saving.
- `tooNew` and `damaged` start no game and write nothing, on hide included (GAME-05). The page shows the J6 message and an Export button that downloads `raw` as `silvanus-save-unreadable.json`.
- A different `contentVersion` is not an error in M0: `parse` sets it to the running content's version after the shape check.
- The lock is held until the page closes; losing it is not handled in M0. `saves.test.ts` starts with `import 'fake-indexeddb/auto'`.
- `importText` throws "This file is not a Silvanus save." for text that is not JSON or parses as `damaged`, and "This save is from a newer version of the game." for `tooNew`. An imported record's `anchorMs` is replaced by the time of import, so a file never causes a catch-up.
- **One window.** At start the page asks for the Web Lock `silvanus-main` with `ifAvailable: true` and holds it while open. Without the lock it shows the J10 message, starts no worker and saves nothing. Where `navigator.locks` is missing, it runs as the only window.
- The standby copy is the state and `anchorMs` of the latest snapshot. The page calls `save` with it: after a snapshot whose `ticks` is 1 when the new tick is a multiple of 10; once after a snapshot whose `ticks` is above 1 (never per tick inside a catch-up); on `visibilitychange` to hidden; on `pagehide`.
- Export downloads the standby copy as `silvanus-save-<tick>.json` through a Blob and a link with `download`. Import reads a file from `<input type="file" accept="application/json">`, shows both ticks ("Replace tick 512 with tick 388?") with Replace and Cancel buttons in the page, and on Replace saves the record and loads it into the worker.

### Page (`apps/web/src/App.tsx`)

One column, plain system font, no style doc. It shows, top to bottom:

- "Year Y, season S, day D, hour H" and "Tick N". The season is shown from 1 to 4.
- "Saved at tick N", the tick of the last completed save, or "Not saved yet" (S2).
- "Food F / 200".
- "Foragers" with − and + buttons (0 to `maxForagers`), each at least 44 px and disabled at its limit. The cap in "Food F / 200" is read from content.
- After an advance of more than 1 tick: "Caught up N ticks: +P food, L lost."
- "Storage: kept" or "Storage: the browser may clear this. Export a save." from `navigator.storage.persisted()`, after calling `navigator.storage.persist()` once at start; "Storage: unknown" where `navigator.storage` is missing (S3).
- Export and Import buttons (S3), `data-testid` `export` and `import`. The import confirm is `import-confirm` with buttons `replace` and `cancel`. Import errors show in `notice`. From S3 the refused-save screens also offer Import; its confirm then reads "Replace the unreadable save with tick N?".
- "Version" (S1) with the first 7 characters of the commit, injected at build as `__COMMIT__` by Vite's `define` from `process.env.VERCEL_GIT_COMMIT_SHA`, else `git rev-parse HEAD`, else `dev`. `declare const __COMMIT__: string` lives in `apps/web/src/env.d.ts`.

Each value's element holds the bare value (the number alone) and has a `data-testid`: `tick`, `food`, `foragers`, `saved-tick`, `caught-up`, `storage`, `notice` (the J6, J10 and unavailable messages).

### PWA (`apps/web/vite.config.ts`)

`VitePWA({ registerType: 'prompt', manifest: { name: 'Silvanus', short_name: 'Silvanus', display: 'standalone', start_url: '/', background_color: '#1c2526', theme_color: '#1c2526', icons: [192 and 512 PNG, purpose 'any'] }, workbox: { globPatterns: ['**/*.{js,css,html,png,webmanifest}'] } })`. The plugin is added in S3; `worker: { format: 'es' }` and the `define` are in the Vite config from S1. No update prompt is shown in M0: a new version takes over the next time the app is opened after all its windows close. Assumption, not checked: swiping the installed app away on Android counts as closing it; the Version line is how Morgan tells. Icons: a `#1c2526` square with a centred "S" in `#e3e8e2`, font `Georgia, serif`, letter height about 60% of the square, drawn by `scripts/make-icons.mjs` from an inline SVG through Playwright's screenshot at 192 and 512 px, and committed.

### Scripts

- `check`: `node .claude/master/sync.mjs --check && node .claude/skills/test-design/scripts/test-traps.mjs && prettier --check . && tsc -p packages/sim && tsc -p packages/content && tsc -p apps/web && tsc -p . && node scripts/check-sim-purity.mjs && vitest run && npm run soak && npm run build && node scripts/check-bundle.mjs`
- `soak`: `tsx scripts/soak.ts`. Seed 1; it calls `step` once per tick; the bot keeps its own state, starting at 99, and uses `nextU32`: each tick, if `value % 24 === 0`, it draws again and sends `setForagers` with `value % 4`. It prints one line, `ticks=10000 food=<n> produced=<n> lost=<n> ticks_per_s=<n>`, or the broken invariant and the tick, and exits 1.
- `build`: `vite build` in `apps/web`. `preview`: `vite preview --host 127.0.0.1` in `apps/web`.
- `test:browser` (added in S2 with `@playwright/test` and `playwright.config.ts`): `playwright test`, run before a PR is marked ready, not in CI.
- `check-bundle.mjs`: fails when the gzipped size of the script named by `<script type="module" src>` in `apps/web/dist/index.html` is over 80,000 bytes. The bare prototype measured 68.71 kB.

### CI

`.github/workflows/ci.yml` from the master's template (`core/templates/github/ci.yml`), adapted with the `efficient-github-actions` skill: one job, `npm ci` then `npm run check`, skipped on draft PRs.

### Hosting

S1 replaces the interim `vercel.json` with Project-Vulcan's, changed in one place, the output folder:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm exec --yes --package=node@24.19.0 --package=npm@11.9.0 -- npm run build",
  "installCommand": "npm exec --yes --package=node@24.19.0 --package=npm@11.9.0 -- npm ci",
  "outputDirectory": "apps/web/dist",
  "git": { "deploymentEnabled": { "**": false, "main": true } }
}
```

Only `main` deploys (CI-05), so the link shows a slice after its PR merges. Morgan approves each slice's PR on the checks' output and a phone-width screenshot, then tries it at the link; a fault found there is fixed in the next PR. Morgan connects the repo in Vercel, or approves it being created for him.

## Slices

### S1 A ticking counter at a link

- **Morgan tries (after the merge):** opens the link on the phone with `?tickMs=1000` and watches the tick and food rise; taps + and − on Foragers. A reload starts over: nothing is remembered yet.
- **Checks that fail now:** J1, J2, J3, J4, J8.
- **Files:** root config files (`package.json`, `.nvmrc`, `.npmrc`, `.prettierrc.json`, `.prettierignore`, `tsconfig.json`, `tsconfig.base.json`, `vitest.config.ts`): the workspace. `packages/sim/**`, `packages/content/**`: the engine and its tests. `apps/web/index.html`, `vite.config.ts` (the React plugin, the `__COMMIT__` define, `worker: { format: 'es' }`), `src/env.d.ts`, `src/main.tsx`, `App.tsx`, `clock.ts`, `worker.ts`, `app.css`, `test/clock.test.ts`: the page without saves; the anchor starts at load time. `scripts/soak.ts`, `check-sim-purity.mjs`, `check-bundle.mjs`. `.github/workflows/ci.yml`. The host's config (`vercel.json` if Vercel). `AGENTS.md`: the "Local checks" line becomes the real `npm run check` steps (types, format check, purity, Vitest, soak, build, bundle size; no lint, see Alternatives) with the measured time, and "What CI runs" names `ci.yml`.
- **Waits on:** none.

#### S1 build notes

- `clock.ts` exports `TICK_MS`, `CATCH_UP_CAP`, `due` and `tickMsFrom(search: string): number`, which returns `TICK_MS` when the parameter is absent or invalid. `clock.test.ts` adds "tickMs from the address".
- Start-up in S1: `main.tsx` takes the seed, builds `newGame(seed, content)` and sends `load` with `anchorMs` set to `Date.now()`. `worker.ts` imports `content` itself. Until the first snapshot the page shows "Loading…".
- The S1 page leaves out the lines marked S2 or S3.
- J3's raw values are read with `draw(rng, 'yield', 1, 4294967296)`.
- Soak, per tick: one `nextU32`; if its value `% 24 === 0`, a second `nextU32`, and the command goes into that tick's `step`.
- S1 installs every development dependency except `@playwright/test` and `fake-indexeddb` (S2) and `vite-plugin-pwa` (S3), and commits `package-lock.json`.
- `tsconfig.base.json` sets `skipLibCheck: true`. `apps/web/tsconfig.json` has `types: ["vite/client"]`. Tests import `test` and `expect` from `vitest`.
- `.gitignore` gains `/apps/web/dist/`. `.prettierignore` also gains any synced file that fails the format check (`.ai-master.json`, `.ai-master.lock`, `.github/workflows/prune-merged-branches.yml`); synced files are never reformatted (SRC-06).

### S2 It remembers

- **Morgan tries:** notes the tick, closes the tab, waits 5 minutes, reopens: "Caught up 5 ticks".
- **Checks that fail now:** J5, J6, J10.
- **Files:** `apps/web/src/saves.ts` (`parse`, `load`, `save`, `exportText`, upgrades table), `test/saves.test.ts`: saves. `App.tsx`, `main.tsx`: the one-window lock, load at start, autosave, standby copy on hide, the refused-save screens with their Export button (`parse` and `exportText` land here). `playwright.config.ts`, `tests/browser/smoke.spec.ts`, `package.json` (`@playwright/test`, `test:browser`): the browser checks.
- **Waits on:** S1.

#### S2 build notes

- `clock.ts` adds `testTickMs(search): number | null`; `tickMsFrom` is built on it. `saves.ts` exports `databaseName(search)`, `STORE` and `KEY`, and picks the database from `location.search` itself, so `load` and `save` keep the signatures above.
- The root `preview` script ends with `--` (`npm run preview -w @silvanus/web --`). Without it npm kept `--port 4173 --strictPort` for itself and the Playwright web server never came up.
- `App` takes the `load` message as a prop and sends it after it starts listening, so the first snapshot cannot arrive before the page listens.
- J5's test waits for "Saved at tick" above `t`, not `t` or more: a save at exactly `t` can be older than the taps.
- "Saved at tick" starts at the loaded save's tick, and never goes back when two writes finish out of order. A refused Web Lock request is treated as locks being missing.
- One browser check more than planned: "five minutes closed is caught up as 5 ticks" stores a record whose anchor is 320,000 ms old and reads "Caught up 5", tick and "Saved at tick".
- `saves.test.ts` adds "save then load", "a good record parses, at the edges of the shape check", "no IndexedDB gives unavailable", "a test tick length has its own database" and "export text is indented JSON of the record".
- In this cloud container the browser checks run with `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:browser`.

### S3 Install it and carry it

- **Morgan tries:** adds the app to the Home screen; opens it in airplane mode; exports a save, clears the site's data in Chrome, imports the file.
- **Checks that fail now:** J7; J9 on the device.
- **Files:** `apps/web/vite.config.ts`: the PWA plugin. `public/icon-192.png`, `icon-512.png`, `scripts/make-icons.mjs`: the icon. `saves.ts`: `importText`. `App.tsx`: Export, Import with its in-page confirm, the storage line. `test/saves.test.ts`: J7. `AGENTS.md`: the check time, measured again.
- **Waits on:** S2.

#### S3 build notes

- `vite-plugin-pwa` 2.0.0 is the one new development dependency. It injects `registerSW.js` and the manifest link into the built page; the app imports nothing from it. `npm audit` lists 6 advisories (2 low, 4 moderate) in its build-time tree (`deepmerge`, `glob`, `minimatch`); none ships in the page.
- `index.html` names `/icon-192.png` as the page icon. S2's one 404 does not show any more: a phone-width run of the built page logged no failed request.
- `saves.ts` adds `storageAnswer(storage)`, which calls `persist()` once, then `persisted()`, and gives `'kept'`, `'mayClear'` or `'unknown'` (also when either call fails). The page shows no Storage line until the answer is in.
- The Import button opens a hidden file input, `data-testid` `import-file`. The confirm sits under the Export and Import row.
- An imported record's anchor is set by `importText` and again at the Replace tap, so time spent on the confirm is not caught up either.
- On the running page, Replace sends the record to the worker and saves it when its snapshot comes back, so the save and the standby copy are one path. "Saved at tick" is then set to the imported tick even when it is lower, and the "Caught up" line is cleared. Snapshots of the replaced town that are still on their way are shown but not autosaved.
- On a refused-save screen, Replace saves the record and starts the game from it in the same page, with no reload. If that write fails the imported town still starts and its autosave tries again.
- One `notice` element per screen: an import error is shown in place of the screen's own message until the next file is chosen.
- `playwright.config.ts` blocks service workers by default, because an active one answers `/seed.html` itself. One test group allows them.
- Four browser checks more than planned: "export and import carry the town", "an import replaces an unreadable save", "the storage line shows an answer", and "installed: starts with no network", which reads the manifest and its two icons, waits for the service worker, goes offline and opens the page again. It is the agent's part of J9; the phone is still Morgan's.
- `saves.test.ts` adds "storage answer" beside the two J7 tests.
- The icons were drawn in this container, which has no Georgia: the "S" is in the fallback serif (the container lists DejaVu Serif, FreeSerif and Liberation Serif).

## Verification

- Every push: `npm run check`.
- Before a PR is marked ready: `npm run test:browser`.
- End to end: J9 and the three "Morgan tries" steps, on Morgan's phone.

## Open questions

None. Hosting is Vercel, project `silvanus` (D-024). The mock-up is waived for M0's page (D-024). Until S1 lands, `vercel.json` turns every deployment off; S1 replaces it with the file under "Hosting".
