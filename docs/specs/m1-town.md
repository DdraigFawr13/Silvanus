# M1 Town

- **Status:** Approved 2026-11-10
- **Planned in:** round 1 (https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR), review (https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1), taste board (https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf), M0 audit (`docs/audit/2026-11-10-repo.md`), chat 2026-11-10. **Decisions:** D-025, D-026, D-027, D-028, D-029; S3 adds D-034.

The build starts from the commit that merges this spec. "M0" below means the code at that commit.

## Problem

Morgan, round 1: "I want to collect whatever was gathered or crafted by the town. I want to manage buildings and funding and change outputs. Oh I want something like europa unversalis 5 where I can choose production methods and higher ones might require more of a resource that I have to keep supplied but they produce more or use different resources." And on trade-offs: "Having to make decisions that both might be good and bad but I need to choose and see how it pans out".

M0 is a counter: one number, one stepper, no people and nothing to decide. M1 makes it a town. The audit also found that M0's page can lose a save without saying so and that an installed app cannot take an update, and M1 changes the save format.

## Goals

- A town of lots, buildings, stock and named residents that runs the same live and in catch-up (D-002).
- Each check-in offers a choice with a cost: which building takes a lot, which production method runs, who works where.
- The Hamlet becomes a Village by the player's own act. A scripted player in the soak reaches it in 1,200 to 2,200 ticks; Morgan's playtest target is 2 to 3 real days of normal check-ins (D-026).
- A night away (480 ticks) cannot empty the town or stall it (D-025).
- Audit findings F1, F2 and F3 are fixed before any M1 feature ships.

## Non-goals

- Herb garden, Smithy, Apothecary, Guild hall; herbs, forest materials, weapons, potions; gold; adventurers; raids (M2 and M3; D-026, D-029).
- Seasons changing yields, a stock forecast, renaming, a balance report page (after the first playtest, D-025).
- Families, births, ageing and deaths (M4a). Hall tier 3 and the Town tier (M4b).
- A map, a grid, a Collect tap, a light theme, any network call at run time.
- The Guild, Trade and Chronicle tabs. Only tabs that work are shown.

## Journeys and checks

Unit checks are Vitest tests: engine tests in `packages/sim/test/`, save tests in `apps/web/test/saves.test.ts`, content tests in `packages/content/test/`. `seed 1` means `newGame(1, content)` with the real content. A test that needs a worker at a known strength builds its own residents with skill 50 and morale 50, which is an effect of 100 in every slice. Browser checks are Playwright tests run at `?tickMs=50`, or at `?tickMs=60000` where a check reads a value that a tick would change (J11's build texts): S1's go in `tests/browser/smoke.spec.ts`, the town's in `tests/browser/town.spec.ts`, the people's in `tests/browser/people.spec.ts`. They seed a stored town with `seedRecord`, moved from `smoke.spec.ts` to `tests/browser/helpers.ts`.

### J1 A save cannot go backwards or fail silently (audit F1, F2, F4)

- **Given** a running town. **When** `save(a)` then `save(b)` are called in one task without awaiting. **Then** the stored record is `b`, in 20 runs of 20. **Check:** `saves.test.ts` "writes land in call order".
- **When** two saves in a row reject (the test replaces `indexedDB.open` in the page with one that fails). **Then** the page shows "Saving failed. Export a save." and clears it on the next good save. The count is kept in the page and starts at 0 on load. **Check:** browser test "a failed save is shown".
- **When** an import replaces a town. **Then** the old record is under key `previous`. **Check:** `saves.test.ts` "replace keeps the previous record".

### J2 An installed app can take an update (audit F3)

- **Given** a page controlled by an older service worker. **When** a new one is waiting. **Then** the page shows "Update ready" with a "Reload" button; after Reload the Version line shows the new build. **Check:** browser test "update prompt appears" in the `installed` describe (service workers allowed). `vite.config.ts`'s `commit()` returns `process.env.SILVANUS_VERSION` as given when it is set, ahead of `VERCEL_GIT_COMMIT_SHA`. The test calls `test.setTimeout(120_000)`, makes both builds in `test.beforeAll` and removes both folders in `test.afterAll`. The test runs `vite build --outDir dist-a` and `--outDir dist-b` in `apps/web` with two values, serves a temp folder on port 4174 with a small Node static server in `tests/browser/helpers.ts` (headers `Cache-Control: no-store`), loads the page from the first build's files, swaps the folder's files for the second build's, calls `registration.update()` in the page and waits for the notice.

### J3 An M0 save becomes a new town

- **Given** a schema 1 record. **When** it is loaded. **Then** the result is a schema 2 town at tick 0 with the same seed, 8 residents, a Hall, a Cottage and a Forager's hut. **Check:** `saves.test.ts` "schema 1 upgrades to a new town".

### J4 Building takes stock and time

- **Given** seed 1. **When** `build mine` is sent. **Then** wood is 20 after `apply`, and after 24 calls of `step` the building is at tier 1 with workers. **Check:** `build.test.ts` "a build pays at once and finishes on time".
- **Given** seed 1 with wood set to 0. **When** `build woodcutter` is sent. **Then** it is accepted at no cost; a second one is rejected with `noStock`. **Check:** `build.test.ts` "a town with no Woodcutter's camp gets one free".
- **Given** seed 1 with stock set to every cap. **When** four `build` commands fill the four empty lots (one job under way, three waiting) and then `upgrade` is sent for the Forager's hut. **Then** the upgrade is rejected with `queueFull` and nothing is paid. **Check:** `build.test.ts` "the queue holds one job under way and three waiting".
- **Given** a Hamlet state built by the test with 6 finished buildings, an empty queue and full stock. **When** `build` is sent. **Then** it is rejected with reason `noLot`. **Check:** `build.test.ts` "no lot, no build".

### J5 A method short of an input falls back and recovers

- **Given** a Workshop on "Forge tools" with 1 worker and ore 0. **When** a production cycle runs. **Then** it produces by "Mend and make do", its `short` flag is true and one log line says so. **When** ore arrives. **Then** the next cycle forges and the flag clears. **Check:** `methods.test.ts` "a short input drops to the basic method and comes back".
- **When** the method is changed. **Then** the building produces nothing for 24 ticks. **Check:** `methods.test.ts` "retooling costs a game day".
- **When** a method the building does not own is chosen (from S3, D-034). **Then** its cost is paid once and it takes 24 ticks; switching back to an owned method is free and takes 4; a short stock refuses it with `noStock`; clearing the lot loses it. **Check:** `methods.test.ts` "a method is bought once, then switching is quick and free".

### J6 People fill jobs the same way every time

- **Given** seed 1. **When** jobs are assigned twice from the same state. **Then** both results are equal, pinned residents are in their buildings, and no building has more workers than its open slots. **Check:** `jobs.test.ts` "assignment is stable and respects pins and open slots".
- **When** a resident works 3 game days in one job. **Then** that job's skill rises by 1. **Check:** `jobs.test.ts` "skills grow by working".

### J7 The town grows and cannot collapse overnight

- **Given** a free bed and, after the day's eating, food of at least 2 per resident. **Then** one settler arrives and a log line names them. **Check:** `growth.test.ts` "a settler arrives".
- **Given** a town of 20, all at morale 0, with food 0 and no food buildings, starting at tick 100 and again at tick 0. **When** 480 ticks run. **Then** in both runs at least 1 and at most 3 residents have left. **Check:** `growth.test.ts` "a hungry night costs at most three".
- **Given** a town of 8 at morale 0. **When** 480 ticks run. **Then** nobody leaves. **Check:** `growth.test.ts` "nobody leaves a town of eight".

### J8 The Hall makes the Village

- **Given** 20 residents and wood 180, stone 180, tools 45. **When** `upgradeHall` is sent and 96 ticks pass. **Then** `hallTier` is 2, the town has 10 lots and the catch-up cap is 960. **Check:** `build.test.ts` "the Hall upgrade makes a Village".

### J9 Live play equals catch-up, with commands between

- **Given** seed 1 and a fixed script of 12 commands, each with the tick it is sent at, over 1,000 ticks (the builder writes the script once from the command types its slice implements, with at least 2 that are rejected, and later slices append to it). **Then** four runs give equal states: `step` tick by tick with each command passed to its tick's `step`; and `apply` at each command's tick with `advance` between, no single `advance` longer than 7, then 480, then 1 tick. **Check:** `determinism.test.ts` "chunks and steps agree with commands between" (audit F9).

### J10 The soak proves reach and recovery (audit F11)

- **Then** `npm run soak` runs three passes and exits 0: a random bot for 10,000 ticks with every invariant in "Soak" below; a scripted bot that reaches the Village in 1,200 to 2,200 ticks and prints the tick; a starved town that is back to its starting population within 2,000 ticks of food returning. **Check:** `npm run soak`.

### J11 The Town tab (browser)

- **Given** a new town at 412 px. **Then** the stock bar shows Food, Wood, Stone, Ore and Tools; the lots list shows the Cottage, the Forager's hut and 4 rows reading "Empty lot"; nothing scrolls sideways. **Check:** browser test "the town tab shows stock and lots".
- **When** an empty lot is tapped and "Woodcutter's camp" is chosen. **Then** the lot shows "Building, 8 game hours left" and Wood still shows "60 / 200" (the town's first camp is free). **When** another empty lot is tapped and "Mine" is chosen. **Then** Wood shows "20 / 200". **Check:** browser test "building from an open lot".

### J12 The People tab (browser)

- **Then** the People tab lists 8 residents with trade and morale; the "Idle" filter shows only idle ones; a resident's sheet shows skills, traits and each morale reason with its number. **Check:** browser test "people list, filter and sheet".
- **When** a resident is pinned to a building from the sheet. **Then** the sheet shows the morale cost before confirming and the job after. **Check:** browser test "pinning shows its cost".

### J13 The away summary (browser)

- **Given** a stored town whose anchor is 100 ticks old. **When** the page opens. **Then** a summary card lists what was made per resource, what was finished and which buildings ran short. **Check:** browser test "away summary after catch-up" (S3). S5 adds "the away card names who arrived".

### J14 The M1 test (device check, Morgan)

- About 20 minutes of play in total over check-ins across 2 or 3 days, reaching the Village, with at least one choice he found hard. His findings are recorded in HANDOFF (GAME-06).

## Decisions

- Homes on lots; the Hall off the lots; build cost in stock and time; queue of 3; clearing with no refund (D-025).
- Production methods are the one production system; a short input drops to the basic method; changing method costs 1 game day (D-025).
- Leaving at most one per season and never at 8 or fewer (D-025).
- 9 resources and 13 buildings in v0.1; M1 ships 9 buildings and uses 5 resources (D-026).
- The look is Lantern at the forest edge, one theme (D-028). `docs/UI_STYLE.md` is the style doc.
- Settled with this spec's approval (D-030), each of them Claude's proposal that Morgan approved without reading:
  - A method names the tier that unlocks it. The Mine has two tier 1 methods and the Workshop's "Forge tools" unlocks at tier 1, because a Workshop that only mends cannot supply a Hamlet. This departs from D-025's "tier 2 unlocks the second".
  - A building's tier is not limited by the Hall's tier: a Hamlet can hold tier 3 buildings.
  - A building kind marked `freeWhenNone` costs nothing to build while the town has none of that kind, counting ones under construction. Only the Woodcutter's camp is marked. Wood has one source and every building costs wood, so without this a town that spent its wood could never recover (D-007).
  - The Tavern has no methods: each staffed worker adds 4 morale to everyone, up to 12.
  - Production has no randomness in M1. The `yield` stream is retired; `arrivals` is the only stream.
  - The content schema gains one condition type, a trait's `likes` and `dislikes` lists of building kinds.
  - Fonts ship in the app from `@fontsource/alegreya-sans` 5.3.0 and `@fontsource/alegreya-sc` 5.3.0 (both OFL-1.1): two new runtime dependencies.
  - Residents' names use Story-Generator's `GWERIN_NAMES` (humans) and `DVERGAR_NAMES` (dwarves) given-name starts and ends (D-012).

## Alternatives rejected

- **Separate upkeep, recipes and recipe choice**: rejected because they are three systems for one idea. It would fail when a building short of upkeep stops and stalls the chain overnight.
- **A building short of an input stops**: rejected; a night is 20 game days and nothing restarts it.
- **Production resolved once per game day**: rejected because live play would show nothing for 24 minutes. Cycles of 4 ticks keep M0's rhythm.
- **Floating-point rates**: rejected by the engine rule (integers only). Rates are hundredths of a unit with a carried remainder.
- **Random yields**: rejected for M1; fixed yields make the method choice readable. It would fail if the town felt mechanical, which the playtest judges.
- **Whole-unit batches per cycle, with no carried remainders** (the critic's simpler design): rejected because the smallest rate would then be 1 unit per worker per cycle, 6 a game day, and tools at 0.3 a day could not be written. It would be right if rates never needed to go below that.
- **A separate track for the Hall upgrade**: rejected; D-025 settles one job at a time, and a waiting Hall job can be cancelled for a full refund.
- **A Quarry building**: rejected; the Mine's method choice gives stone without a 14th building.
- **Paying for a queued job when it starts**: rejected because the player would be refused later, while away. Paying when queued answers at once.
- **A state library (Redux, Zustand)**: rejected; one `useSyncExternalStore` store over the worker's snapshot is enough for two tabs. It would fail if tabs needed derived caches, which M2 can revisit.
- **Fonts from Google Fonts at run time**: rejected by D-003.
- **Keeping M0 saves' ticks**: rejected; an M0 save holds a counter, not a town.

## Risks

- The numbers are untested by a person → the scripted soak bot gives a floor, and J14 is the judge. Every number is in content, so retuning is a data change.
- 60 residents × assignment each game day in a 960-tick catch-up → assignment runs at most twice per tick and only when marked dirty; the soak prints ticks per second and fails under 20,000.
- The save grows (residents, log) → the log is capped at 100 lines; the soak prints the largest save's size in bytes.
- An old installed client meets a schema 2 save → J2 ships in S1, one release before schema 2 (S2).
- 6 lots feel cramped → that is the intended squeeze; Morgan can raise `lots` in content after the playtest.

## Design

### Versions and layout

No tool version changes. New runtime dependencies: `@fontsource/alegreya-sans` 5.3.0, `@fontsource/alegreya-sc` 5.3.0 in `apps/web`. New files:

```text
packages/sim/src/      types.ts (rewritten)  step.ts (rewritten)  build.ts  production.ts  jobs.ts  people.ts  day.ts  validate.ts  summary.ts
packages/sim/test/     build.test.ts  methods.test.ts  jobs.test.ts  growth.test.ts  purity.test.ts  (step, determinism rewritten)
tests/browser/         helpers.ts  town.spec.ts  people.spec.ts  (smoke.spec.ts extended)
packages/content/src/  index.ts (rewritten)  names.ts
packages/content/test/ content.test.ts
apps/web/src/          store.ts  ui/TownTab.tsx  ui/PeopleTab.tsx  ui/BuildingSheet.tsx  ui/ResidentSheet.tsx  ui/BuildSheet.tsx  ui/AwayCard.tsx  ui/Sheet.tsx  ui/format.ts  app.css (rewritten)
mockups/               town.html  people.html
scripts/               soak.ts (rewritten)
```

`vitest.config.ts` already includes `packages/*/test/**/*.test.ts`. `scripts/check-sim-purity.mjs` exports `findBanned`; `packages/sim/test/purity.test.ts` imports it by relative path.

### Content (`packages/content/src/index.ts`)

`version: 2`. All amounts are whole numbers. Rates are hundredths of a unit per worker per production cycle; a cycle is 4 ticks.

Resources, with base cap and starting stock: food 200 / 40, wood 200 / 60, stone 200 / 0, ore 100 / 0, tools 50 / 0. A resource's cap is its base cap × (1 + the sum of the tiers of finished Storehouses). When a cap falls (a Storehouse is cleared), stock above it is cut to the cap at once and counted as lost.

Hall tiers: tier 1 Hamlet, 6 lots, 25 residents, catch-up cap 480. Tier 2 Village, 10 lots, 60 residents, catch-up cap 960; costs wood 180, stone 180, tools 45; 96 ticks; needs 20 residents when ordered.

Buildings. Cost and ticks are for tier 1, then the upgrade to 2, then to 3.

| Kind id | Name | Role | Cost (tier 1 / 2 / 3) | Ticks |
| --- | --- | --- | --- | --- |
| `cottage` | Cottage | beds 8 / 12 / 16 | wood 30 / wood 50, stone 20 / wood 80, stone 50, tools 10 | 12 / 24 / 48 |
| `forager` | Forager's hut | work, skill husbandry | wood 20 / wood 40, tools 5 / wood 60, stone 30, tools 10 | 8 / 24 / 48 |
| `farm` | Farm | work, skill husbandry | wood 50, tools 5 / wood 60, stone 30, tools 10 / wood 90, stone 60, tools 20 | 24 / 36 / 48 |
| `woodcutter` | Woodcutter's camp | work, skill woodcraft; `freeWhenNone` | wood 25 / wood 40, tools 5 / wood 70, stone 30, tools 15 | 8 / 24 / 48 |
| `mine` | Mine | work, skill mining | wood 40 / wood 60, tools 10 / wood 90, stone 40, tools 20 | 24 / 36 / 48 |
| `workshop` | Workshop | work, skill crafting | wood 40, stone 20 / wood 60, stone 40 / wood 90, stone 60, tools 20 | 24 / 36 / 48 |
| `storehouse` | Storehouse | caps | wood 40, stone 20 / wood 70, stone 50 / wood 100, stone 80, tools 10 | 24 / 36 / 48 |
| `tavern` | Tavern | work, no skill | wood 50, stone 30 / wood 70, stone 50, tools 5 / wood 100, stone 80, tools 15 | 24 / 36 / 48 |

Worker slots by tier: 4 / 6 / 8 for forager, farm, woodcutter, mine and workshop; 1 / 2 / 3 for the tavern; 0 for the cottage and the storehouse, whose `open` stays 0. The Hall is not in this table and takes no lot. A building under upgrade keeps working at its old tier.

Methods (16). The first method listed for a building is its basic method; the Mine's "Quarry stone" is the basic method for its stone methods, "Dig ore" for its ore methods.

| Building | Method id | Name | Tier | Makes | Uses |
| --- | --- | --- | --- | --- | --- |
| forager | `gather` | Gather | 1 | food 50 | |
| forager | `snares` | Snares and baskets | 2 | food 80 | tools 2 |
| forager | `smoke` | Smokehouse | 3 | food 110 | tools 2, wood 10 |
| farm | `plots` | Hand plots | 1 | food 70 | |
| farm | `ploughs` | Iron ploughs | 2 | food 120 | tools 4 |
| farm | `rotation` | Crop rotation | 3 | food 160 | tools 6 |
| woodcutter | `axes` | Hand axes | 1 | wood 40 | |
| woodcutter | `sawpit` | Saw pit | 2 | wood 70 | tools 3 |
| woodcutter | `coppice` | Managed coppice | 3 | wood 100 | tools 4 |
| mine | `ore` | Dig ore | 1 | ore 30 | |
| mine | `stone` | Quarry stone | 1 | stone 40 | |
| mine | `shafts` | Timbered shafts | 2 | ore 55 | wood 10 |
| mine | `cutstone` | Cut-stone quarry | 2 | stone 70 | tools 3 |
| workshop | `mend` | Mend and make do | 1 | tools 5 | |
| workshop | `forge` | Forge tools | 1 | tools 25 | ore 25, wood 10 |
| workshop | `hammer` | Water-wheel hammer | 2 | tools 45 | ore 40, wood 15 |

Method prices (D-034, from S3; Claude's estimates): a method with no inputs costs nothing. `forge` wood 20, stone 10; `snares` wood 20, tools 5; `ploughs` wood 30, tools 10; `sawpit` wood 30, tools 5; `shafts` wood 40, tools 5; `cutstone` wood 30, tools 10; `hammer` wood 40, stone 30, tools 10; `smoke` wood 50, stone 20, tools 10; `rotation` wood 60, stone 30, tools 15; `coppice` wood 60, stone 20, tools 15.

A new building starts on the first method listed for it (the Mine on `ore`). The Mine is the one building with two no-input methods. Each method with inputs names its `fallback` (the basic method it drops to): `cutstone` → `stone`; every other one → its building's first method.

Skills: `husbandry`, `woodcraft`, `mining`, `crafting`. Peoples: `human` leans husbandry and woodcraft; `dwarf` leans mining and crafting. Trades are labels from the job: Forager, Farmer, Woodcutter, Miner, Toolwright, Innkeeper, or "No trade" when idle.

Traits (6), each with `likes` and `dislikes` building kinds: Green-fingered (likes farm, forager), Woodwise (likes woodcutter), Deep-delver (likes mine; dislikes farm), Deft (likes workshop), Sociable (likes tavern; dislikes mine), Hearth-bound (likes workshop, tavern; dislikes forager).

Tuning values, all in content under `rules`: `eatPerDay` 1, `arrivalFoodPerHead` 2, `skillDays` 3, `retoolTicks` 24, `switchTicks` 4 (from S3, D-034), `queueMax` 3, `leaveBelow` 15, `leaveFloor` 8, `moraleStep` 5, `tavernPerWorker` 4, `tavernMax` 12, `logMax` 100, `founders` 8.

`packages/content/src/names.ts` is already in the repo (added with this spec). It holds `human: { starts, ends }` and `dwarf: { starts, ends }`, copied from Story-Generator `src/content/names.ts` at commit `221ee68` (`GWERIN_NAMES.givenStarts` 16 and `.givenEnds` 9; `DVERGAR_NAMES.givenStarts` 15 and `.givenEnds` 9). A file comment records the source; the repo is Morgan's own.

These numbers come from a scratch model run in the planning session: a scripted player that acts on every tick reached the Village at tick 1,536 with every worker at 90%, 1,376 at 100% and 1,708 at 80%, morale ignored (measured on the model with the input and carry rules below, not on this engine). The soak's band of 1,200 to 2,200 allows for the difference. The band is the floor for perfect play. The 2 to 3 real days are an estimate for a player who checks in about three times a day and queues at most 3 jobs each time; only J14 can confirm it.

### Engine types (`packages/sim/src/types.ts`)

```ts
export type StreamName = 'arrivals' | `test:${string}`;
export type Resident = {
  id: number; name: string; people: string; bornTick: number;
  motherId: number | null; fatherId: number | null; spouseId: number | null; householdId: number | null;
  skills: Record<string, number>; // 0..100 per content skill id
  traits: string[];               // 2 trait ids
  morale: number;                 // 0..100
  reasons: { id: string; amount: number }[]; // the terms of the last morale target, for the sheet
  jobId: number | null;           // a building id
  pinnedTo: number | null;        // a building id
  workDays: number;               // game days worked in the current job since the last skill point
  arrivedTick: number;
};
export type Building = {
  id: number; kind: string;
  tier: number;                   // 0 while its first build is queued or under way
  method: string | null;          // null for buildings without methods
  open: number;                   // open worker slots, 0..slots at this tier
  retoolLeft: number;             // ticks
  carry: Record<string, number>;  // ten-thousandths of a unit made and not yet whole, kept when the method changes
  debt: Record<string, number>;   // hundredths of a unit of input owed, kept when the method changes
  short: boolean;                 // ran by its fallback in the last cycle
  owned: string[];                // methods this building owns (from S3, D-034)
};
export type Job = { target: 'hall' | number; toTier: number; ticksLeft: number; cost: Record<string, number> };
export type LogLine = { tick: number; type: string; text: string };
export type State = {
  contentVersion: number; seed: number; tick: number; rng: RngState;
  stock: Record<string, number>;
  hallTier: number; nextId: number;
  buildings: Building[];          // in lot order; length <= lots
  queue: Job[];                   // [0] is under way; length <= 1 + queueMax
  residents: Resident[];
  lastLeftTick: number;           // tick of the last departure, -168 at start
  jobsDirty: boolean;
  log: LogLine[];                 // newest last, at most logMax
};
export type Command =
  | { type: 'build'; kind: string }
  | { type: 'upgrade'; buildingId: number }
  | { type: 'upgradeHall' }
  | { type: 'cancelJob'; index: number }      // 1..queue.length-1; refunds its cost
  | { type: 'clear'; buildingId: number }
  | { type: 'setMethod'; buildingId: number; method: string }
  | { type: 'setOpen'; buildingId: number; count: number }
  | { type: 'pin'; residentId: number; buildingId: number | null };
export type Summary = {
  ticks: number;
  made: Record<string, number>; lost: Record<string, number>; used: Record<string, number>;
  arrived: string[]; left: string[]; finished: string[]; // names and "Mine, tier 2"
  shortCycles: Record<number, number>;                    // building id -> production cycles run by a fallback
};
```

`motherId`, `fatherId`, `spouseId` and `householdId` stay `null` in M1 (D-020 keeps the fields). `Content` mirrors the Content section: `resources`, `hall.tiers`, `buildings` (with `tiers[]` of cost, ticks, slots or beds), `methods`, `skills`, `peoples`, `traits`, `rules`, `names`. `validateContent(content): string[]` returns one message per fault (a missing fallback, a cost in an unknown resource, a tier with no ticks, a zero or negative number, a Hall cost above a base cap) and `[]` when sound. The worker calls it on load and throws on a fault.

### Engine rules

Three entry points, none of which changes its input:

- `apply(state, commands, content): { state, events }` runs commands only (rule 1, then the jobs pass if `jobsDirty`); the tick does not move. The worker uses it for a `command` message, as in M0.
- `step(state, commands, content): { state, events }` is `apply` followed by rules 2 to 6.
- `advance(state, ticks, content): { state, summary }` loops `step(state, [])` and folds events with `summary.ts`; it throws `RangeError('advance: ticks must be a whole number of 0 or more')` otherwise.

`nextId` starts at 1 and is shared by residents and buildings. Events of the types listed under Texts each append one `LogLine`; other events (`made`, `used`, `lost`, `rejected`) do not. `events` are typed entries the summary and tests read. A rejected command changes nothing and emits `{ type: 'rejected', command, reason }`, with `reason` one of `unknown`, `noLot`, `queueFull`, `noStock`, `busy`, `notReady`, `tooFew`, `notAllowed`, `same`, `range`. Checks run in this order and the first failure gives the reason: an id or kind that does not exist (`unknown`); the target's state (`notReady` for tier 0, `busy` for a building or Hall that already has a job, `range` for an upgrade at tier 3, a `cancelJob` index of 0 or past the end, a `setOpen` count outside its range, or a `pin` to a building with no worker slots); `same` (a `setMethod` to the current method, a `setOpen` to the current count, a `pin` to the current pin); `notAllowed` (a method above the building's tier or of another building; `upgradeHall` at tier 2; any command type the slice has not implemented yet); `noLot`; `queueFull`; `tooFew`; `noStock`. Two helpers are exported for the screens, so the UI computes no rule (GAME-02): `perDay(content, methodId): { makes: Record<string, number>; uses: Record<string, number> }` in hundredths of a unit per worker per game day (rate × 6), and `pinPreview(state, residentId, buildingId, content): { id: string; amount: number }[]`, the `fit`, `likes` and `dislikes` reasons that job would give.

Order inside one tick at tick `t`:

1. **Commands**, in order, through a `switch` on `command.type` with a `never` default.
   - `build`: rejected if the kind is unknown or `hall` (`unknown`), if `buildings.length` equals the lots, counting tier 0 buildings (`noLot`), if the queue is full (`queueFull`) or if stock is short (`noStock`). A `freeWhenNone` kind with none in `buildings` costs nothing and its job's `cost` is empty. Else pay, append a building at tier 0 with its first method, `open` 0, and append a job.
   - `upgrade`: rejected if the building is at tier 0 or 3, already has a job, the queue is full or stock is short. Else pay and append a job.
   - `upgradeHall`: rejected if `hallTier` is 2, the Hall has a job, residents are fewer than the tier's need, the queue is full or stock is short.
   - `cancelJob`: only an index of 1 or more (`range` otherwise). Refund its cost up to the caps; any part that does not fit is lost, emitted as a `lost` event and counted in the summary; a cancelled first build removes its tier 0 building.
   - `clear`: rejected at tier 0 or while the building has a job (`busy`). Removes the building; its workers become idle, pins to it are cleared, and caps are recomputed (see Content).
   - `setMethod`: rejected if the method is not this building's, its tier is above the building's, or it is the current one. Rejected at tier 0 (`notReady`). Rejected with `noStock` when the building does not own it and stock does not cover its `cost` (D-034). Else, if not owned, pay its cost and add it to `owned` with `retoolLeft = retoolTicks`; if owned, `retoolLeft = switchTicks`. Set it, clear `short`, and keep `carry` and `debt` (both are keyed by resource, so nothing made or owed is dropped). A new building's `owned` is every method of its kind with an empty `cost`.
   - `setOpen`: a whole number from 0 to the slots at this tier.
   - `pin`: the building must have worker slots, or `null` to unpin.
   - `build`, `clear`, `setOpen` and `pin` set `jobsDirty`.
2. **Construction.** If the queue is not empty, `queue[0].ticksLeft -= 1`; this includes a job that reached the front in this same tick, so a job of 8 ticks sent to an empty queue at tick `t` is finished in the state whose tick is `t + 8`. At 0 the target takes `toTier`, the job is removed and `jobsDirty` is set. A building finishing tier 1 gets `open` = its slots. An upgrade raises `open` by the slots gained. A Hall finishing emits `village`.
3. **Start of a game day**, when `t % 24 === 0` and `t > 0`: `day.ts`, in this order.
   1. Eat: `need = residents × eatPerDay`. If food covers it, subtract and the town is fed; else food becomes 0 and the town is not fed.
   2. Skills: each resident with a job in a building with a skill gets `workDays += 1`; at `skillDays` the skill rises by 1 (to 100 at most) and `workDays` is 0.
   3. Morale: for each resident compute the target = 50 + the sum of the reasons below, clamped to 0..100; morale moves toward it by at most `moraleStep`; `reasons` is stored.
      - `food`, read after eating: −30 if the town was not fed today; else +10 if food ≥ 2 × residents; else −5 if food < residents; else 0. Example: 20 residents and food 25 before eating leaves 5; the town was fed, 5 < 20, so the reason is −5.
      - `fit`: with a job in a building that has a skill: +10 if that skill ≥ 60, −10 if < 30.
      - `likes`: +10 if at least one trait likes the job's building kind; `dislikes`: −10 if at least one dislikes it. Each counts once, and both can apply.
      - `idle`: −10 with no job.
      - `crowded`: −15 if residents exceed beds.
      - `tavern`: + `tavernPerWorker` × staffed tavern workers, at most `tavernMax`.
   4. Leaving: if residents exceed `leaveFloor`, `t - lastLeftTick >= 168` (one season), and some resident's morale is below `leaveBelow`, the one with the lowest morale (ties: lowest id) is removed, `lastLeftTick = t`, `jobsDirty` is set and a log line names them.
   5. Arrival: if beds exceed residents, residents are below the Hall tier's limit and food (after step 1's eating) ≥ `arrivalFoodPerHead` × residents, `people.ts` makes one settler. A log line names them. `jobsDirty` is set.
4. **Jobs**, when `jobsDirty`: `jobs.ts` reassigns and clears the flag. The same pass runs at the end of `apply`.
   1. Remember each resident's `jobId` as their old job, then clear every `jobId`. Place each pinned resident in their building while it has an open slot left (lowest id first); a pin that does not fit is kept but the resident is treated as unpinned this pass.
   2. For every remaining resident and every building with an open slot left, score = the building's skill value (0 for the tavern) + 15 per liking trait − 15 per disliking trait + 10 if this building is their old job.
   3. Sort the pairs by score, highest first; ties by resident id, then by lot order. Take pairs in order while the resident is free and the building has a slot.
   4. A resident whose job differs from their old job gets `workDays` 0.
5. **Production**, when `(t + 1) % 4 === 0`: `production.ts`, buildings in lot order. Skip a building at tier 0, with no method, with no workers or with `retoolLeft > 0`.
   - A worker's effect is `floor((50 + skill) × (80 + floor(morale × 2 / 5)) / 100)` percent, so skill 50 and morale 50 give 100.
   - Full stores first. If every resource the current method makes is at its cap, the building does nothing this cycle: no inputs are taken and nothing is made or lost.
   - Inputs next. For each input, `owed = debt + rate × workers` in hundredths (inputs ignore skill and morale). If `stock × 100 < owed` for any input, the building runs its `fallback` this cycle, `short` is true, debts are unchanged, and a log line is written only when `short` turns from false to true. Else subtract `floor(owed / 100)` whole units, keep `owed % 100` as `debt`, and `short` is false. Example: one worker on Forge tools with ore 0 owes 25, and 0 < 25, so the cycle is short.
   - Outputs, by the method that ran: `carry += rate × sum of the workers' effects` in ten-thousandths; `floor(carry / 10000)` whole units move to stock up to the cap and the remainder stays in `carry`; units over the cap are lost and counted.
6. `retoolLeft -= 1` where above 0. Then `tick + 1`.

`people.ts`: a settler draws from the `arrivals` stream, in this order: people (0 human, 1 dwarf), name start, name end, four skills in content order, each 20 + a draw of 31 (20 to 50), then two traits: the first an index from a draw of 6, the second from a draw of 5 that skips the first. The people's two leaning skills get +10. The name is the start followed by the end as written in the tables, with a letter tripled across the join collapsed to a double; a name already in the town redraws the end up to 5 times, then is kept. `newGame(seed, content)` makes `founders` settlers the same way at tick 0, with morale 50, then builds the Hall at tier 1, a Cottage and a Forager's hut at tier 1 (forager `open` 4), sets the starting stock and runs the jobs pass. Settlers arrive with morale 50 and `bornTick` = arrival tick − 20 × 672, where 672 is the ticks in a game year (age 20; an assumption until M4a sets ages). Age shown is `floor((tick − bornTick) / 672)`.

The town's name is fixed as Ashwick (D-022).

### Texts

Log lines, with `type` and `text`:

- `arrived`: "Brynoc, a human, has settled in Ashwick." ("a dwarf" for a dwarf)
- `left`: "Brynoc has left Ashwick."
- `built`: "The Mine is built." · `upgraded`: "The Mine is now tier 2." · `cleared`: "The Mine was cleared from its lot."
- `short`: "The Workshop ran short of ore and fell back to Mend and make do." (the first input found short, in the method's listed order)
- `capLost`: "12 wood was lost when storage shrank."
- `village`: "Ashwick is now a Village."

Morale reason labels: `food` "Food", `fit` "Skill for the job", `likes` "Likes the work", `dislikes` "Dislikes the work", `idle` "No work", `crowded` "Crowded home", `tavern` "The tavern". Each shows its signed amount.

Notices on the page: "Saving failed. Export a save."; "The town stopped. Export a save." with an "Export" button; "Update ready" with a "Reload" button; "That file is too large to be a save." for an import over the limit. Notices sit above the tab's content, under the stock bar (on the M0 page in S1, in the existing notice slot).

Screen wording: an unbuilt lot is "Empty lot"; a lot under its first build is "Building, N game hours left"; workers show as "Workers 3 / 4" (assigned / open slots); a disabled choice says what is missing as "Needs 20 wood, 5 tools"; a free build shows "Free: the town has none" in place of its cost; the Hall row says "Needs 20 residents" or the missing stock in the same form; a locked method says "Tier 2"; a retooling building says "Retooling, N game hours left"; rejected commands show their reason as `noLot` "No empty lot", `queueFull` "The work queue is full", `noStock` "Not enough stock", `busy` "Work is under way here", `tooFew` "Not enough residents"; other reasons cannot be reached from the screens. The date reads as M0's does, "Year 1, season 1, day 1, hour 0". A resident with no job has the trade "No trade".

### Soak (`scripts/soak.ts`)

Pass 1, random bot, 10,000 ticks: each tick, with odds 1 in 24, one random command of a random type with random valid-looking arguments. After every tick: every stock is a whole number from 0 to its cap; residents ≤ the Hall tier's limit; no building has more workers than `open`, and `open` ≤ its slots; every `jobId` and `pinnedTo` names a living building; every morale and skill is a whole number 0..100; every rng value is 0..4294967295; `queue.length` ≤ 4; `buildings.length` ≤ lots; `log.length` ≤ 100. At the end the recorded script (each command with its tick) replayed as `apply` at each command's tick with `advance` between, no `advance` longer than 97 ticks, must give an equal state. The bot draws from its own `nextU32` chain as M0's does: a command type by `value % n` over the `n` command types the slice has implemented (S2: all but `setMethod` and `upgradeHall`; S3 adds `setMethod`; S5 adds `upgradeHall`), then building and resident ids from the living ones, kinds and methods from content, and counts from 0 to 9, so some commands are rejected. It prints ticks per second (fails under 20,000) and the largest `JSON.stringify(state).length`.

Pass 2, scripted bot: build order Woodcutter's camp, Cottage, Mine, Workshop; Mine on stone until 190, else ore while ore is under 60 and tools under 45; Workshop on Forge once ore ≥ 10; upgrade the Forager's hut at tools 5 and switch it to Snares; upgrade the lowest-tier Cottage when beds equal residents and food ≥ 2 × residents; lower the Woodcutter's open slots to 1 when wood ≥ 195 and raise them back to its slots when wood < 100; order the Hall when it can. Fails unless the Village comes between tick 1,200 and 2,200. If the engine's first run falls outside the band, the builder stops and reports the tick to Morgan; the band is not widened to pass (VER-01).

Pass 3, starved town: the pass 2 state at the tick its 20th resident arrived, with the script setting food to 0 in the state and sending `setOpen` 0 to every forager and farm, then 480 ticks, then `setOpen` back to each one's slots. Fails if more than 3 leave in the 480 ticks, or if the population is not back to 20 within 2,000 ticks.

### Web

- **Worker protocol** (audit F13): every message carries `v: 2`. `load`, `advance` and `command` stay; the answer is `{ type: 'snapshot', v: 2, state, anchorMs, ticks, summary }`. The worker posts one snapshot per message it receives, as in M0, and ignores a message whose `v` is not 2. `worker.onerror` and `onmessageerror` on the page show "The town stopped. Export a save." with an Export button for the standby copy (F6). This one has no automated check: the builder throws inside the worker once by hand, screenshots the notice and puts the screenshot in the PR.
- **Clock:** from S5, the page passes `content.hall.tiers[state.hallTier - 1].catchUpCap` to `due()` as its cap; until then the cap stays `CATCH_UP_CAP`.
- **Store (`store.ts`):** holds the latest snapshot and the last non-empty summary; components read it with `useSyncExternalStore`. Lists keep stable keys so rows are updated in place.
- **Saves:** `SCHEMA = 2` (3 from S3: `upgrades[2]` gives each building `owned` = its kind's methods with an empty cost, plus its current method, and keeps the town's tick; D-034). M0's shape check is kept as `shapeOkV1`; `upgrades[1]` returns `{ schema: 2, anchorMs: now, state: newGame(old.state.seed, content) }` for a record that passes it, and a schema 1 record that fails it is `damaged` as before. `parse` reports `upgradedFrom: 1` on such a result, and the page then stores the raw old record under `previous` before its first schema 2 save. `save(record, { keepPrevious?: boolean })`: with `keepPrevious`, the record now under `main` (if any) is copied to `previous` in the same transaction, replacing an older `previous`; both import paths (`main.tsx` `onImport` and `replaceWith`) pass it. One connection is opened once and reused; writes go through one promise chain (F1). `shapeOk` checks every number with `Number.isSafeInteger` (0 or more, except `bornTick` and `lastLeftTick`, which may be negative), every stock key against content and its value against its cap, and each resident, building and job field by type, with: kinds, methods, trait and skill ids present in content; tier 0 to 3; `open` from 0 to the slots at its tier; `queue.length` ≤ 4; `buildings.length` ≤ the lots; ids unique and below `nextId`; every `jobId`, `pinnedTo` and job target naming a building in the record; morale and skills 0 to 100; `log.length` ≤ 100 (F5). Import refuses a file whose `file.size` is over 5,000,000 before reading it. A replace copies the old record to key `previous` in the same transaction (F4). `replaceWith` sets the anchor and the waiting flag before posting (F14).
- **PWA:** `registerType: 'prompt'` stays; `main.tsx` registers through `virtual:pwa-register` with `onNeedRefresh` setting an "Update ready" notice whose "Reload" button calls the returned update function with `true`. The manifest gains `id: '/'` and a third icon entry, `icon-512.png` with `purpose: 'maskable'`; `scripts/make-icons.mjs` draws the letter S as an SVG path the builder writes by hand (no font), within the middle 60% of the square so the maskable crop keeps it, and says so in a comment (F3, F18).
- **Fonts:** `main.tsx` imports `@fontsource/alegreya-sans/400.css`, `/500.css`, `/700.css` and `@fontsource/alegreya-sc/700.css`. The workbox `globPatterns` gain `woff2`.
- **Screens**, all from `docs/UI_STYLE.md`:
  - Header: "Ashwick", then "Hamlet" or "Village" and the date from `calendar()`. Under it the pinned stock bar: one cell per resource in content order, `amount / cap`, in `--warn` when the amount is 0 or at the cap.
  - Town tab: the away card (after a catch-up of 10 ticks or more, until dismissed); the Hall row with its tier and the "Upgrade to Village" button or what it still needs; the work queue with a cancel button on waiting jobs; then one row per lot. A built lot shows name, tier, method, workers `n / open` and a short flag. An unbuilt lot shows "Empty lot" and opens the build sheet. Last, the log's 20 newest lines. S2 builds the Hall row with its tier only and the log section; S5 adds the Village button.
  - Build sheet: every building kind with its cost; kinds that cannot be paid for are shown disabled with what is missing.
  - Building sheet: methods as a list with what each makes and uses per worker per game day (from `perDay`, shown as hundredths ÷ 100 with one decimal, by `toFixed(1)`), the current one marked, locked ones showing their tier; the open-slots stepper; the workers by name; "Upgrade" with cost and time; "Clear lot" with an in-sheet confirm.
  - People tab: filter chips All, Idle and one per trade present; sort by name, morale or top skill; rows of name, people, trade and morale.
  - Resident sheet: name, people, age in game years, trade, skills as numbers, traits with what each likes and dislikes, morale with every reason and its amount, and "Pin to…" listing buildings with the reasons `pinPreview` returns for each; choosing one shows those reasons and a "Pin" button before anything is sent.
  - Tab bar: Town and People.
  - At the foot of the Town tab, a "Save and app" block carries over the M0 page's lines: "Saved at year 1, season 1, day 1, hour 0" (the date of the last stored tick, `data-testid="saved-at"`), the Storage line, Export, Import with its in-page confirm, and the Version line.
  - Notices are a list in `apps/web/src/notices.ts`, a small external store that `main.tsx` and the screens write and every screen (the refused-save screens too) reads. They stack in this order: update ready, saving failed, the town stopped, then the import or storage message. Every call of `save` counts toward "two in a row", whatever triggered it, and any success resets the count.
  - Resource names on screen: Food, Wood, Stone, Ore, Tools. "1 game hour", "2 game hours"; "1 game day".
  - Time is shown in game hours and days, never ticks. `ui/format.ts` holds every such conversion; it is display only (GAME-02).
- **Bundle check** (F12): `check-bundle.mjs` reads `dist/index.html` and sums the gzipped sizes of its `<script type="module" src>`, every `<link rel="modulepreload" href>` and every file in `dist/assets/` whose name starts with `worker-`; the limit rises to 120,000 bytes for that total. S1 records the measured total; if it is over, the builder reports it instead of raising the limit.

### Docs and repo fixes (audit F15 to F17)

README's stale line; the charter's and D-022's "proposed" hosting; D-015's pointer; AGENTS.md "once it exists"; the M0 spec's baseline sentences marked "At approval"; `/.vercel/` in `.gitignore`; WEB-05 recorded as an override in AGENTS.md and `.ai-master.json` with the reason "the config only reads the session hook's browser path".

## Slices

Each slice is one PR from a branch cut from the latest `main`. A slice that adds or changes a screen starts with a mock-up Morgan approves (`ui-mockups`); S1 only adds two notices to the M0 page, which D-024 exempts.

### S1 Safe saves and updates

- **Morgan tries:** open the installed app after the S1 deploy, then again after the next deploy: "Update ready" appears and Reload works.
- **Checks that fail now:** J1 "a failed save is shown" and "replace keeps the previous record", J2; `purity.test.ts` "the purity check catches globalThis and string comments" (F8); `step.test.ts` "advance refuses a bad tick count"; `saves.test.ts` "an oversized import is refused" and "unsafe numbers are damaged"; the offline test's manifest assert, updated to three icons and `id`. J1 "writes land in call order" may pass under fake-indexeddb as it stands: the test wraps `indexedDB.open` so the first call resolves after the second, which fails on M0's code. Added and expected to pass at once, because they cover untested behaviour that is already right: browser test "hiding the page saves" (F7: change the foragers, set `document.visibilityState` to hidden with `Object.defineProperty` and dispatch `visibilitychange`, then read the stored record); `step.test.ts` "a command on a production tick applies before production" (F10); the offline test asserts the service worker's state is `activated`; the storage-line test runs twice with `navigator.storage.persist` stubbed to true and to false and asserts each line's text (F7). Each of these four is shown to fail once by breaking the code it covers, then restored from a copy (LESSONS, "tests").
- **Files:** `apps/web/src/saves.ts`: one connection, ordered writes, `previous`, safe-integer checks, import size limit. `apps/web/src/App.tsx`: failed-save notice, worker error notice, update notice, `replaceWith` anchor. `apps/web/src/main.tsx`, `vite.config.ts`: update hook, manifest `id`, maskable icon. `scripts/make-icons.mjs`: path-drawn letter. `scripts/check-sim-purity.mjs`: add `globalThis`, `crypto` and `Intl` to `BANNED`; the lookbehind becomes `(?<![\w$])`, so a banned word after a dot is flagged too; `stripComments` becomes a scanner that tracks `'`, `"` and backtick strings and blanks only real comments, so `//` inside a string hides nothing. Text inside strings is still checked as code, as M0's comment says. `scripts/check-bundle.mjs`: the summed total. `packages/sim/src/step.ts`: `advance` guards its tick count. Tests as named. Docs and repo fixes above. `docs/LESSONS.md` untouched unless a mistake is found.
- **Waits on:** none

### S2 Stock, lots and the Town tab

- **Morgan tries:** build a Woodcutter's camp on an open lot, close the app, come back: the wood is there and the lot is working.
- **Browser tests:** `smoke.spec.ts` is brought to schema 2 in this slice. Its "newer version" seeds use `schema: 3`. Its M0-state seeds become schema 2 towns made by a `townRecord(overrides)` helper in `tests/browser/helpers.ts`, and its reads of `tick`, `foragers` and `food` become reads of the stock bar and `saved-at`. "five minutes closed is caught up" asserts the stored tick rose by 5. No test is dropped (VER-01). `apps/web/test/saves.test.ts` keeps its schema 1 damaged cases, now through `shapeOkV1`, and gains schema 2 ones.
- **Checks that fail now:** J3, J4, J6 "assignment is stable and respects pins and open slots", J9, J11; `saves.test.ts` "a damaged schema 1 save stays damaged" is kept green; `content.test.ts` "validateContent names each planted fault" (one case per fault kind listed under Engine types); `content.test.ts` "the real content is valid and runs 96 ticks"; J10 pass 1. `npm run soak` runs only the passes that exist; S5 completes J10.
- **Files:** content rewritten with all of the Content section. Engine: types, `step`, `build.ts`, `production.ts` (first methods only: `setMethod` is rejected in this slice), `jobs.ts` (the full pass), `people.ts` (founders), `validate.ts`, `summary.ts`. Day block: eating only. Web: worker protocol v2, `store.ts`, schema 2 and its upgrade, fonts, tokens, header, stock bar, Town tab, build sheet, building sheet without methods (stepper, workers, upgrade, clear). `mockups/town.html` first. Soak pass 1.
- **Waits on:** S1

### S3 Production methods and the away card

- **Morgan tries:** switch the Mine from ore to stone and read what it costs; let the Workshop run out of ore overnight and read the away card.
- **Checks that fail now:** J5, J13; `saves.test.ts` "schema 2 upgrades to owned methods" (D-034).
- **Files:** `production.ts`: inputs, fallback, `short`; `step.ts`: `setMethod`, retooling. Method prices, `switchTicks` and `owned` with schema 3 (D-034). `BuildingSheet.tsx`: the methods list. `AwayCard.tsx`. `mockups/town.html` updated for the methods list and the card.
- **Waits on:** S2

### S4 People

- **Morgan tries:** open the People tab, filter to Idle, open a resident, pin them to a job they are bad at and read why their morale falls over the next game days.
- **Checks that fail now:** J6 "skills grow by working", J12; `growth.test.ts` (new in this slice) "morale moves toward its reasons by 5 a day". The `tavern` reason is 0 until S5.
- **Files:** `day.ts`: skills and morale; `production.ts`: the worker's effect uses skill and morale (S2 and S3 use 100). `PeopleTab.tsx`, `ResidentSheet.tsx`, the tab bar. `mockups/people.html` first.
- **Waits on:** S3

### S5 Growth and the Village

- **Morgan tries:** J14, the M1 test.
- **Checks that fail now:** J7, J8, J10 passes 2 and 3; browser tests "the Hall row offers the Village when it can be paid for" and "the away card names who arrived".
- **Files:** `day.ts`: leaving and arrival; `build.ts`: `upgradeHall`; the tavern's morale term; `clock.ts` cap from the Hall; the Village button on the Hall row in `TownTab.tsx`; soak passes 2 and 3. `mockups/town.html` updated for the Hall row first.
- **Waits on:** S4

## Verification

- Every push: `npm run check` (under the pinned Node and npm, see AGENTS.md).
- Before a PR is marked ready: `npm run test:browser`, and the style doc's new-screen checklist for each changed screen, with screenshots at 412 px and 360 px.
- End to end: J14 on Morgan's phone.

## Build notes

Small choices the builder took where the spec was silent, and places the build departs from it. Each was taken by Claude; none is Morgan's decision.

### S1 (2026-11-10)

- **J1's failing save.** The browser test makes every write fail by replacing `IDBDatabase.prototype.transaction` and `IDBFactory.prototype.open` in the page, not `indexedDB.open` alone: with one reused connection, a failing `open` is never called.
- **The connection.** `load` shares it. It is dropped when the browser closes it or a read or write fails, so the next call opens a new one. A failed write rejects its own call and does not hold up the next. `closeConnection()` is exported for that and for tests.
- **Names.** `PREVIOUS = 'previous'`, `IMPORT_MAX_BYTES = 5_000_000` (a file of exactly that size is read), `importFile(file)` for the size check, `closeConnection()`. `scripts/check-sim-purity.d.mts` gives the purity test its types.
- **`previous` holds the running town.** Before an import is sent to the worker, the page stores the town as it stands, so the copy kept is the town the player saw and not the last autosave.
- **`shapeOk` on schema 1.** Safe whole numbers for seed, tick, content version, food, foragers and rng values; `anchorMs` a safe integer; food at most its cap; each resident's M0 fields by type. The schema 2 list in "Saves" is S2's.
- **A new save field** means a check in `shapeOk` and, when a stored shape changes, an upgrade step (audit F5 asked for this line).
- **Notices.** `apps/web/src/notices.ts` is made in S1 and holds three: update ready, saving failed, the town stopped, in that order, with test ids `notice-update`, `notice-saveFailed` and `notice-stopped`. A screen's own import or storage message keeps `data-testid="notice"` and comes after them. They show on every M0 screen, the loading and refused-save ones included. The save count lives in `watchSaves`, which `main.tsx` wraps round `save`, so an import's save counts too.
- **The stopped notice** has its Export button only when a snapshot has arrived; before that there is nothing to export.
- **F14.** The waiting flag set by `replaceWith` is cleared when the imported town's snapshot comes back (a load answers with 0 ticks, which did not clear it). Snapshots of the replaced town that arrive in between leave the clock on the imported town's anchor.
- **J2.** Versions `build-a` and `build-b`; the served folder is under the system temp folder; `test.setTimeout(120_000)` is also called in `beforeAll`, where the builds run; the page is reloaded once so the first service worker controls it. `seedRecord` and `readRecord` moved to `tests/browser/helpers.ts` in this slice.
- **Looking for an update when the app comes back.** The page calls the service worker registration's `update()` when it becomes visible. An installed app left in the recents list is not opened again, so without this it would not see a deploy (the case F3 names). This is one request for the app's own `sw.js`, the same one the browser makes on each open. Accepted with S1's approval (D-031).
- **Purity check.** The dot is dropped from the lookbehind for every banned word, as the S1 text says (the audit named two). The scanner reads a template string's `${…}` as string text and does not understand a regex literal that holds a quote; neither appears in the engine.
- **Bundle.** The first load measured 73,927 bytes gzipped (entry 72,951, worker 976; limit 120,000). The update hook adds one lazy chunk, `workbox-window`, about 2,200 bytes gzipped; it is not preloaded, so the check does not count it. The check counts JavaScript only, as WEB-06 does (the audit also named the CSS, 210 bytes).
- **WEB-05 override.** Recording it meant running the master sync, which also wrote its block into `.prettierignore`.
- **After the fresh review of the diff** (0 high, 2 medium, 5 low). Fixed: a write that has not landed in 10 seconds (`WRITE_TIMEOUT_MS`) is given up as failed, so a database that never answers is counted and shown instead of holding every later save; a failed call closes only its own connection; a negative `anchorMs` is damaged; a failed Reload is caught. Declined: a blocked open that succeeds later (version 1 never upgrades); clearing the stopped notice if the worker answers again (the spec gives no rule, and a town that lost a message should still be exported); a chunk only the worker imports is not counted by the bundle check (none exists).
- **The worker check by hand.** A throw planted in the worker's command branch gave "The town stopped. Export a save." with a working Export at 412 px; the plant was removed.

### S2 (2026-11-10)

Taken before any code, from the zero-decision check on S2 against what S1 merged (one fresh agent, 130,238 tokens measured). It found no gap that needed Morgan. Its one "needs owner" item is the first line here, taken as a default because it changes no rule the player sees.

- **Why a tap is refused.** The snapshot carries no events, so the page cannot read a `rejected` event. The engine exports the check that `apply` itself runs, `refusal(state, command, content)`, which returns the reason or `null`, and `jobCost(state, command, content)` for a build's or upgrade's cost (empty for a free first camp). The screens call both on the snapshot's state, so no rule is computed twice (GAME-02).
- **Mock-up.** `mockups/town.html`, published at https://claude.ai/artifact/6k9547asTCDNHmfobt6Hym and approved by Morgan on 2026-11-10; he also confirmed the phone is 412 px wide. Its own choices: no tab bar until S4; the Hall row also shows "Residents 8 / 25"; a job that has not started reads "Waiting, takes 1 game day" and its lot "Waiting in the work queue"; the building sheet names the method in use; an empty queue reads "Nothing is being built."; an empty log reads "Nothing has happened yet."; a Cottage's row shows "Beds 8".
- **Worker effect** is 100 in S2 and S3 (the S4 slice line), not the skill and morale formula.
- **A job that reaches the front** gets its first decrement on the next tick: one decrement per tick.
- **Reject order** for `setOpen`, `pin` and `clear` on a tier 0 building: `notReady` first.
- **`validateContent`'s "zero or negative"** does not cover slots and beds, which are 0 for some kinds.
- **Time on screen.** Under 24 game hours reads in hours; a whole number of days reads in days; otherwise "1 game day, 12 game hours".
- **Weights.** Alegreya Sans has no 600 weight, so the style doc's 600 is written as 700, which is what a browser shows for it.
- **Tests.** "a damaged schema 1 save stays damaged" is a new test that passes when written; it is shown to fail once under a planted bug. `rng.test.ts` moves to `test:` stream names and `fixtures.ts` goes: engine tests import the real content by relative path. M0's `step.test.ts` cases are ported to the town's commands, none dropped. Browser tests read the live tick from a `data-tick` attribute on the date, which shows no tick to the player.
- **The first save after an upgrade** from schema 1 passes `keepPrevious`, since `main` still holds the old record.
- **`shapeOkV1`** keeps M0's limits as its own constants (food cap 200, foragers 3).
- **The import question** names dates, not ticks: "Replace this town with the one saved at year 1, season 1, day 2, hour 3?".
- **M0's "Caught up N ticks" line** is dropped; S3's away card replaces it.
- **Fonts.** The app imports the packages' `latin-400.css`, `latin-500.css`, `latin-700.css` files of the sans face and `latin-700.css` of the small-caps face, not the all-script ones the Web section names: the names and texts are plain Latin, and the offline cache then holds 4 font files instead of every script's.
- **Colours outside the page.** The manifest's and the page's theme colour move to `--bg` (`#162120`). The icon keeps its M0 ground.
- **Content fields the spec did not name.** `town`, `cycleTicks`, a kind's `trade`, `skill`, `freeWhenNone` and `storage` (the Storehouse's cap rule as data, GAME-04), a hall tier's `needResidents`. A person's skills and traits are made in full from S2, so saves need no change in S4.
- **Events** carry a kind id and tier (`built`, `upgraded`, `cleared`), a resource and amount (`made`, `used`, `lost`, `capLost`), or the command and reason (`rejected`). Eating emits `used`.
- **Engine exports for the screens:** `refusal`, `jobCost`, `shortfall` (what a cost asks beyond the stock, for "Needs 20 wood"), `capsOf`, `hallOf`, `kindOf`, `methodOf`, `slotsOf`, `bedsOf`.
- **An upgrade under way** shows on its lot as "Upgrading, N game hours left", and a waiting one as "Upgrade waiting". A workplace with open slots and nobody in them shows its workers line in ember.
- **J9 and the soak's replay** send one tick's commands in one `apply` call. The worker applies each command as it arrives, and each `apply` ends with the jobs pass.
- **Measured.** First load 86,152 bytes gzipped of 120,000 (S1: 73,927). Soak pass 1: 405 commands, 325 refused, largest save 7,007 bytes, 541,079 ticks per second on the cloud machine (floor 20,000). `npm run check` 5.5 s; browser tests 31 s for 17.
- **After the fresh review of the diff** (one agent, 155,484 tokens measured; 1 medium-high, 1 low-medium, 4 low; no engine, content or screen defect). Fixed: `shapeOk` now checks each job against its target (one tier up, one job per target, the Hall's next tier only), that a building not yet built has its job, two traits per resident and the Hall's resident limit, because a hand-edited file could otherwise crash the page on every open or strand a lot; a save that should have kept the record it replaces and failed leaves that copy owed to the next save (GAME-05); a job holds its own copy of its cost; the slot stepper's browser taps wait for each answer; log rows keep their keys once the log is full. Declined: a reason line under a stepper cell at its limit (the number beside it shows the limit); cancelling by queue position while a tick finishes the front job (the tap and the tick would have to land within one message).
- **Seen to fail first.** The 20 engine and content tests were run against S1's engine and all failed. "a damaged schema 1 save stays damaged" passes when written and failed under a planted bug. The four J11 browser tests were not run against S1's page; they read test ids it does not have.

### S3 (2026-11-10)

Taken before any code, from the zero-decision check on S3 against what S2 merged. It was one fresh agent, 156,343 tokens measured; a first run stopped at a rate limit before it reported. No gap needed Morgan except screen wording and layout, which the mock-up settles.

- **Events.** `short` `{ buildingId, resource }` is emitted, and writes the log line, only when a building's `short` turns from false to true. `fellBack` `{ buildingId }` is emitted on every cycle run by a fallback, writes no line, and `fold` counts it into `shortCycles`. Production emits `used` for each input when at least 1 whole unit is taken.
- **`short` on a skipped cycle.** A cycle skipped for tier 0, retooling, no workers or full stores leaves `short` as it was. Clearing it there would write the line again each time the building recovered.
- **`setMethod` refusals.** A method id not in content gives `unknown`. A building with no methods gives `notAllowed`. Order: unknown, notReady, same, notAllowed. It is allowed while the building has an upgrade job (it keeps working at its old tier). Sent again while retooling, it starts the 24 ticks again.
- **Full stores** are checked against the chosen method's outputs. Every fallback makes the same resource as its method, so the two cannot differ in M1's content.
- **`perDay`** lives in `production.ts`, uses `DAY_TICKS / cycleTicks` rather than a literal 6, and is exported from the package.
- **Retooling text** follows the S2 note "Time on screen": a bought method reads "Retooling, 1 game day left", a switch to an owned one "Retooling, 4 game hours left".
- **After D-034** (Morgan's change to the mock-up): "retooling costs a game day" buys Forge tools for a Workshop, because the Mine owns both its tier 1 methods from the start. The J9 script's Mine switches become 4-tick switches.
- **The away card keeps its summary.** `store.ts` keeps the last summary of 10 ticks or more (not every advance with ticks, which replaced it within a second at test speeds). Dismiss clears it, and the next such catch-up replaces it. It is not kept over a reload. J13 runs at `?tickMs=60000`.
- **A building that ran short and was cleared** before the card shows is named "A cleared building".
- **J5's checks** read `carry`, `debt` and `short` rather than whole stock, since one worker on Forge tools makes 0.25 of a tool a cycle. Their Workshop is built with `finished()`, set to `forge` with `open` 1 and residents at skill 50 and morale 50. "retooling costs a game day" goes through `setMethod`, so it fails at S2's code, which refuses it.
- **J9's script** gains its `setMethod` commands in tick order, because `chunked` finds the next command by array order.
- **Soak pass 1** adds `setMethod` to `TYPES`, which changes the bot's draws and so its printed numbers.

## Open questions

- Whether gold pays for building from M3 (D-027, proposed).
- AGENTS.md's count of browser tests is updated by each slice that adds some (17 after S2).
