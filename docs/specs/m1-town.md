# M1 Town

- **Status:** Draft
- **Planned in:** round 1 (https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR), review (https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1), taste board (https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf), M0 audit (`docs/audit/2026-11-10-repo.md`), chat 2026-11-10. **Decisions:** D-025, D-026, D-027, D-028, D-029.

The build starts from the commit that merges this spec. "M0" below means the code at that commit.

## Problem

Morgan, round 1: "I want to collect whatever was gathered or crafted by the town. I want to manage buildings and funding and change outputs. Oh I want something like europa unversalis 5 where I can choose production methods and higher ones might require more of a resource that I have to keep supplied but they produce more or use different resources." And on trade-offs: "Having to make decisions that both might be good and bad but I need to choose and see how it pans out".

M0 is a counter: one number, one stepper, no people and nothing to decide. M1 makes it a town. The audit also found that M0's page can lose a save without saying so and that an installed app cannot take an update, and M1 changes the save format.

## Goals

- A town of lots, buildings, stock and named residents that runs the same live and in catch-up (D-002).
- Each check-in offers a choice with a cost: which building takes a lot, which production method runs, who works where.
- The Hamlet becomes a Village by the player's own act. A scripted player in the soak reaches it in 1,200 to 2,200 ticks; Morgan's playtest target is 2 to 3 real days of normal check-ins (D-026).
- A night away (480 ticks) cannot empty the town or stall it (D-025).
- The three audit findings marked "fix strongly recommended" are fixed before any M1 feature ships.

## Non-goals

- Herb garden, Smithy, Apothecary, Guild hall; herbs, forest materials, weapons, potions; gold; adventurers; raids (M2 and M3; D-026, D-029).
- Seasons changing yields, a stock forecast, renaming, a balance report page (after the first playtest, D-025).
- Families, births, ageing and deaths (M4a). Hall tier 3 and the Town tier (M4b).
- A map, a grid, a Collect tap, a light theme, any network call at run time.
- The Guild, Trade and Chronicle tabs. Only tabs that work are shown.

## Journeys and checks

Unit checks are Vitest tests; `seed 1` means `newGame(1, content)` with the real content. Browser checks are Playwright tests in `tests/browser/`, run at `?tickMs=50`.

### J1 A save cannot go backwards or fail silently (audit F1, F2, F4)

- **Given** a running town. **When** two saves are issued in one task, older state second-issued first. **Then** the stored record is the later-issued one. **Check:** `saves.test.ts` "writes land in call order".
- **When** two saves in a row are rejected. **Then** the page shows "Saving failed. Export a save." and clears it on the next good save. **Check:** browser test "a failed save is shown".
- **When** an import replaces a town. **Then** the old record is under key `previous`. **Check:** `saves.test.ts` "replace keeps the previous record".

### J2 An installed app can take an update (audit F3)

- **Given** a page controlled by an older service worker. **When** a new one is waiting. **Then** the page shows "Update ready" with a "Reload" button, and Reload activates it. **Check:** browser test "update prompt appears", which builds twice with different `VITE_VERSION` values.

### J3 An M0 save becomes a new town

- **Given** a schema 1 record. **When** it is loaded. **Then** the result is a schema 2 town at tick 0 with the same seed, 8 residents, a Hall, a Cottage and a Forager's hut. **Check:** `saves.test.ts` "schema 1 upgrades to a new town".

### J4 Building takes stock and time

- **Given** seed 1. **When** `build woodcutter` is sent. **Then** wood falls from 60 to 35 at once and the building works after 8 ticks. **Check:** `build.test.ts` "a build pays at once and finishes on time".
- **When** a fifth job is queued. **Then** it is rejected and nothing is paid. **Check:** `build.test.ts` "the queue holds one job under way and three waiting".
- **When** a seventh building is asked for in a Hamlet. **Then** it is rejected. **Check:** `build.test.ts` "no lot, no build".

### J5 A method short of an input falls back and recovers

- **Given** a Workshop on "Forge tools" with ore 0. **When** a production cycle runs. **Then** it produces by "Mend and make do", its `short` flag is true and one log line says so. **When** ore arrives. **Then** the next cycle forges and the flag clears. **Check:** `methods.test.ts` "a short input drops to the basic method and comes back".
- **When** the method is changed. **Then** the building produces nothing for 24 ticks. **Check:** `methods.test.ts` "retooling costs a game day".

### J6 People fill jobs the same way every time

- **Given** seed 1. **When** jobs are assigned twice from the same state. **Then** both results are equal, pinned residents are in their buildings, and no building has more workers than its open slots. **Check:** `jobs.test.ts` "assignment is stable and respects pins and open slots".
- **When** a resident works 3 game days in one job. **Then** that job's skill rises by 1. **Check:** `jobs.test.ts` "skills grow by working".

### J7 The town grows and cannot collapse overnight

- **Given** a free bed and food of at least 2 per resident at the start of a game day. **Then** one settler arrives and a log line names them. **Check:** `growth.test.ts` "a settler arrives".
- **Given** a town of 20 with food 0 and no food buildings. **When** 480 ticks run. **Then** at most 3 residents have left and the town still has more than 8. **Check:** `growth.test.ts` "a hungry night costs at most three".
- **Given** a town of 8 at morale 0. **When** 480 ticks run. **Then** nobody leaves. **Check:** `growth.test.ts` "nobody leaves a town of eight".

### J8 The Hall makes the Village

- **Given** 20 residents and wood 180, stone 180, tools 45. **When** `upgradeHall` is sent and 96 ticks pass. **Then** `hallTier` is 2, the town has 10 lots and the catch-up cap is 960. **Check:** `build.test.ts` "the Hall upgrade makes a Village".

### J9 Live play equals catch-up, with commands between

- **Given** seed 1 and a fixed list of commands at fixed ticks. **Then** stepping tick by tick and advancing in chunks of 7, 480 and 1 give equal states. **Check:** `determinism.test.ts` "chunks and steps agree with commands between" (audit F9).

### J10 The soak proves reach and recovery (audit F11)

- **Then** `npm run soak` runs three passes and exits 0: a random bot for 10,000 ticks with every invariant in "Soak" below; a scripted bot that reaches the Village in 1,200 to 2,200 ticks and prints the tick; a starved town that is back to its starting population within 2,000 ticks of food returning. **Check:** `npm run soak`.

### J11 The Town tab (browser)

- **Given** a new town at 412 px. **Then** the stock bar shows Food, Wood, Stone, Ore and Tools; the lots list shows the Cottage, the Forager's hut and 4 open lots; nothing scrolls sideways. **Check:** browser test "the town tab shows stock and lots".
- **When** an open lot is tapped and "Woodcutter's camp" is chosen. **Then** the lot shows "Building, 8 game hours left" and Wood shows 35. **Check:** browser test "building from an open lot".

### J12 The People tab (browser)

- **Then** the People tab lists 8 residents with trade and morale; the "Idle" filter shows only idle ones; a resident's sheet shows skills, traits and each morale reason with its number. **Check:** browser test "people list, filter and sheet".
- **When** a resident is pinned to a building from the sheet. **Then** the sheet shows the morale cost before confirming and the job after. **Check:** browser test "pinning shows its cost".

### J13 The away summary (browser)

- **Given** a stored town whose anchor is 100 ticks old. **When** the page opens. **Then** a summary card lists what was made per resource, who arrived or left, what was finished and which buildings ran short. **Check:** browser test "away summary after catch-up".

### J14 The M1 test (device check, Morgan)

- About 20 minutes of play in total over check-ins across 2 or 3 days, reaching the Village, with at least one choice he found hard. His findings are recorded in HANDOFF (GAME-06).

## Decisions

- Homes on lots; the Hall off the lots; build cost in stock and time; queue of 3; clearing with no refund (D-025).
- Production methods are the one production system; a short input drops to the basic method; changing method costs 1 game day (D-025).
- Leaving at most one per season and never at 8 or fewer (D-025).
- 9 resources and 13 buildings in v0.1; M1 ships 9 buildings and uses 5 resources (D-026).
- The look is Lantern at the forest edge, one theme (D-028). `docs/UI_STYLE.md` is the style doc.
- Proposed here, settled when this spec is approved (recorded as D-030):
  - A method names the tier that unlocks it. The Mine has two tier 1 methods and the Workshop's "Forge tools" unlocks at tier 1, because a Workshop that only mends cannot supply a Hamlet. This departs from D-025's "tier 2 unlocks the second".
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
- **A Quarry building**: rejected; the Mine's method choice gives stone without a 14th building.
- **Paying for a queued job when it starts**: rejected because the player would be refused later, while away. Paying when queued answers at once.
- **A state library (Redux, Zustand)**: rejected; one `useSyncExternalStore` store over the worker's snapshot is enough for two tabs. It would fail if tabs needed derived caches, which M2 can revisit.
- **Fonts from Google Fonts at run time**: rejected by D-003.
- **Keeping M0 saves' ticks**: rejected; an M0 save holds a counter, not a town.

## Risks

- The numbers are untested by a person → the scripted soak bot gives a floor, and J14 is the judge. Every number is in content, so retuning is a data change.
- 60 residents × assignment each game day in a 960-tick catch-up → assignment runs at most once per tick and only when marked dirty or at the start of a day; the soak prints ticks per second and fails under 20,000.
- The save grows (residents, log) → the log is capped at 100 lines; the soak prints the largest save's size in bytes.
- An old installed client meets a schema 2 save → J2 ships in S1, one release before schema 2 (S2).
- 6 lots feel cramped → that is the intended squeeze; Morgan can raise `lots` in content after the playtest.

## Design

### Versions and layout

No version changes. New runtime dependencies: `@fontsource/alegreya-sans` 5.3.0, `@fontsource/alegreya-sc` 5.3.0 in `apps/web`. New files:

```text
packages/sim/src/      types.ts (rewritten)  step.ts (rewritten)  build.ts  production.ts  jobs.ts  people.ts  day.ts  validate.ts  summary.ts
packages/sim/test/     build.test.ts  methods.test.ts  jobs.test.ts  growth.test.ts  purity.test.ts  (step, determinism rewritten)
packages/content/src/  index.ts (rewritten)  names.ts
packages/content/test/ content.test.ts
apps/web/src/          store.ts  ui/TownTab.tsx  ui/PeopleTab.tsx  ui/BuildingSheet.tsx  ui/ResidentSheet.tsx  ui/BuildSheet.tsx  ui/AwayCard.tsx  ui/Sheet.tsx  ui/format.ts  app.css (rewritten)
mockups/               town.html  people.html
scripts/               soak.ts (rewritten)
```

`vitest.config.ts` already includes `packages/*/test/**/*.test.ts`. `scripts/check-sim-purity.mjs` exports `findBanned`; `packages/sim/test/purity.test.ts` imports it by relative path.

### Content (`packages/content/src/index.ts`)

`version: 2`. All amounts are whole numbers. Rates are hundredths of a unit per worker per production cycle; a cycle is 4 ticks.

Resources, with base cap and starting stock: food 200 / 40, wood 200 / 60, stone 200 / 0, ore 100 / 0, tools 50 / 0. A resource's cap is its base cap × (1 + the sum of the tiers of finished Storehouses).

Hall tiers: tier 1 Hamlet, 6 lots, 25 residents, catch-up cap 480. Tier 2 Village, 10 lots, 60 residents, catch-up cap 960; costs wood 180, stone 180, tools 45; 96 ticks; needs 20 residents when ordered.

Buildings. Cost and ticks are for tier 1, then the upgrade to 2, then to 3.

| Kind id | Name | Role | Cost (tier 1 / 2 / 3) | Ticks |
| --- | --- | --- | --- | --- |
| `cottage` | Cottage | beds 8 / 12 / 16 | wood 30 / wood 50, stone 20 / wood 80, stone 50, tools 10 | 12 / 24 / 48 |
| `forager` | Forager's hut | work, skill husbandry | wood 20 / wood 40, tools 5 / wood 60, stone 30, tools 10 | 8 / 24 / 48 |
| `farm` | Farm | work, skill husbandry | wood 50, tools 5 / wood 60, stone 30, tools 10 / wood 90, stone 60, tools 20 | 24 / 36 / 48 |
| `woodcutter` | Woodcutter's camp | work, skill woodcraft | wood 25 / wood 40, tools 5 / wood 70, stone 30, tools 15 | 8 / 24 / 48 |
| `mine` | Mine | work, skill mining | wood 40 / wood 60, tools 10 / wood 90, stone 40, tools 20 | 24 / 36 / 48 |
| `workshop` | Workshop | work, skill crafting | wood 40, stone 20 / wood 60, stone 40 / wood 90, stone 60, tools 20 | 24 / 36 / 48 |
| `storehouse` | Storehouse | caps | wood 40, stone 20 / wood 70, stone 50 / wood 100, stone 80, tools 10 | 24 / 36 / 48 |
| `tavern` | Tavern | work, no skill | wood 50, stone 30 / wood 70, stone 50, tools 5 / wood 100, stone 80, tools 15 | 24 / 36 / 48 |

Worker slots by tier: 4 / 6 / 8 for forager, farm, woodcutter, mine and workshop; 1 / 2 / 3 for the tavern. The Hall is not in this table and takes no lot.

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

A new building starts on its first method. Each method with inputs names its `fallback` (the basic method it drops to): `cutstone` → `stone`; every other one → its building's first method.

Skills: `husbandry`, `woodcraft`, `mining`, `crafting`. Peoples: `human` leans husbandry and woodcraft; `dwarf` leans mining and crafting. Trades are labels from the job: Forager, Farmer, Woodcutter, Miner, Toolwright, Innkeeper, or "No trade" when idle.

Traits (6), each with `likes` and `dislikes` building kinds: Green-fingered (likes farm, forager), Woodwise (likes woodcutter), Deep-delver (likes mine; dislikes farm), Deft (likes workshop), Sociable (likes tavern; dislikes mine), Hearth-bound (likes workshop, tavern; dislikes forager).

Tuning values, all in content under `rules`: `eatPerDay` 1, `arrivalFoodPerHead` 2, `skillDays` 3, `retoolTicks` 24, `queueMax` 3, `leaveBelow` 15, `leaveFloor` 8, `moraleStep` 5, `tavernPerWorker` 4, `tavernMax` 12, `logMax` 100, `founders` 8.

`names.ts` holds `human: { starts, ends }` and `dwarf: { starts, ends }`, copied from Story-Generator `src/content/names.ts` at commit `221ee68` (`GWERIN_NAMES.givenStarts` 16 and `.givenEnds` 9; `DVERGAR_NAMES.givenStarts` 15 and `.givenEnds` 9). A file comment records the source; the repo is Morgan's own.

These numbers come from a scratch model run in the planning session: a scripted player reached the Village at tick 1,540 with every worker at 90% and morale ignored (measured on the model, not on this engine). The soak's band of 1,200 to 2,200 allows for the difference.

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
  carry: Record<string, number>;  // hundredths made and not yet whole
  debt: Record<string, number>;   // hundredths of input owed
  short: boolean;                 // ran by its fallback in the last cycle
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
  lastLeftSeason: number;         // absolute season index of the last departure, -1 at start
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
  shortTicks: Record<number, number>;                     // building id -> ticks spent on a fallback
};
```

`Content` mirrors the Content section: `resources`, `hall.tiers`, `buildings` (with `tiers[]` of cost, ticks, slots or beds), `methods`, `skills`, `peoples`, `traits`, `rules`, `names`. `validateContent(content): string[]` returns one message per fault (a missing fallback, a cost in an unknown resource, a tier with no ticks, a zero or negative number, a Hall cost above a base cap) and `[]` when sound. The worker calls it on load and throws on a fault.

### Engine rules

`step(state, commands, content): { state, events }`, where `events` are typed entries the summary and tests read. `advance(state, ticks, content): { state, summary }` loops `step` and folds events with `summary.ts`; it throws a `RangeError` unless `ticks` is a whole number of 0 or more. A rejected command changes nothing and emits `{ type: 'rejected', command, reason }`.

Order inside one tick at tick `t`:

1. **Commands**, in order, through a `switch` on `command.type` with a `never` default.
   - `build`: rejected if the kind is unknown or `hall`, if `buildings.length` equals the lots, if the queue is full or if stock is short. Else pay, append a building at tier 0 with its first method, `open` 0, and append a job.
   - `upgrade`: rejected if the building is at tier 0 or 3, already has a job, the queue is full or stock is short. Else pay and append a job.
   - `upgradeHall`: rejected if `hallTier` is 2, the Hall has a job, residents are fewer than the tier's need, the queue is full or stock is short.
   - `cancelJob`: only an index of 1 or more. Refund its cost up to the caps; a cancelled first build removes its tier 0 building.
   - `clear`: rejected at tier 0 or while the building has a job. Removes the building; its workers become idle, pins to it are cleared.
   - `setMethod`: rejected if the method is not this building's, its tier is above the building's, or it is the current one. Else set it, `retoolLeft = retoolTicks`, clear `carry`, `debt` and `short`.
   - `setOpen`: a whole number from 0 to the slots at this tier.
   - `pin`: the building must have worker slots, or `null` to unpin.
   - `build`, `clear`, `setOpen` and `pin` set `jobsDirty`.
2. **Construction.** If the queue is not empty, `queue[0].ticksLeft -= 1`. At 0 the target takes `toTier`, the job is removed and `jobsDirty` is set. A building finishing tier 1 gets `open` = its slots. An upgrade raises `open` by the slots gained. A Hall finishing emits `village`.
3. **Start of a game day**, when `t % 24 === 0` and `t > 0`: `day.ts`, in this order.
   1. Eat: `need = residents × eatPerDay`. If food covers it, subtract; else food becomes 0.
   2. Skills: each resident with a job in a building with a skill gets `workDays += 1`; at `skillDays` the skill rises by 1 (to 100 at most) and `workDays` is 0.
   3. Morale: for each resident compute the target = 50 + the sum of the reasons below, clamped to 0..100; morale moves toward it by at most `moraleStep`; `reasons` is stored.
      - `food`: +10 if food ≥ 2 × residents; −15 if food < residents; −30 if food is 0; else 0.
      - `fit`: with a job in a building that has a skill: +10 if that skill ≥ 60, −10 if < 30.
      - `likes`: +10 if a trait likes the job's building kind; `dislikes`: −10 if one dislikes it. Both can apply.
      - `idle`: −10 with no job.
      - `crowded`: −15 if residents exceed beds.
      - `tavern`: + `tavernPerWorker` × staffed tavern workers, at most `tavernMax`.
   4. Leaving: if residents exceed `leaveFloor`, the current absolute season (`floor(t / 168)`) differs from `lastLeftSeason`, and some resident's morale is below `leaveBelow`, the one with the lowest morale (ties: lowest id) is removed, `lastLeftSeason` is set, `jobsDirty` is set and a log line names them.
   5. Arrival: if beds exceed residents, residents are below the Hall tier's limit and food ≥ `arrivalFoodPerHead` × residents, `people.ts` makes one settler. A log line names them. `jobsDirty` is set.
4. **Jobs**, when `jobsDirty`: `jobs.ts` reassigns and clears the flag.
   1. Clear every `jobId`. Place each pinned resident in their building while it has an open slot left (lowest id first); a pin that does not fit is kept but the resident is treated as unpinned this pass.
   2. For every remaining resident and every building with an open slot left, score = the building's skill value (0 for the tavern) + 15 per liking trait − 15 per disliking trait + 10 if this was their job before the pass.
   3. Sort the pairs by score, highest first; ties by resident id, then by lot order. Take pairs in order while the resident is free and the building has a slot.
   4. A resident whose job changed gets `workDays` 0.
5. **Production**, when `(t + 1) % 4 === 0`: `production.ts`, buildings in lot order. Skip a building at tier 0, with no method, with no workers or with `retoolLeft > 0`.
   - A worker's effect is `floor((50 + skill) × (80 + floor(morale × 2 / 5)) / 100)` percent, so skill 50 and morale 50 give 100.
   - Inputs first. For each input, `owed = debt + rate × workers` (inputs ignore skill and morale). If `floor(owed / 100)` is more than the stock of any input, the building runs its `fallback` this cycle, `short` is true, debts are unchanged, and a log line is written only when `short` turns from false to true. Else subtract the whole units, keep the remainder as `debt`, and `short` is false.
   - Outputs: `carry += floor(rate × sum of workers' effects / 100)`; whole units move to stock up to the cap; units over the cap are lost and counted.
6. `retoolLeft -= 1` where above 0. Then `tick + 1`.

`people.ts`: a settler draws from the `arrivals` stream, in this order: people (0 human, 1 dwarf), name start, name end, four skills each 20 + draw of 31, two distinct traits. The people's two leaning skills get +10. The name is start + end with a tripled letter collapsed to a double; a name already in the town redraws the end up to 5 times, then is kept. `newGame(seed, content)` makes `founders` settlers the same way at tick 0, with morale 50, then builds the Hall at tier 1, a Cottage and a Forager's hut at tier 1 (forager `open` 4), sets the starting stock and runs the jobs pass. Settlers arrive with morale 50 and `bornTick` = arrival tick − 20 × 672 (age 20; an assumption until M4a sets ages).

Log lines are written for: arrived, left, a build or upgrade finished, a lot cleared, a method dropped to its fallback, the Village. `text` is ready to show ("Brynoc, a human, has settled in Ashwick."). The town's name is fixed as Ashwick (D-022).

### Soak (`scripts/soak.ts`)

Pass 1, random bot, 10,000 ticks: each tick, with odds 1 in 24, one random command of a random type with random valid-looking arguments. After every tick: every stock is a whole number from 0 to its cap; residents ≤ the Hall tier's limit; no building has more workers than `open`, and `open` ≤ its slots; every `jobId` and `pinnedTo` names a living building; every morale and skill is a whole number 0..100; every rng value is 0..4294967295; `queue.length` ≤ 4; `buildings.length` ≤ lots; `log.length` ≤ 100. At the end the same commands replayed through `advance` in chunks of 97 must give an equal state. It prints ticks per second (fails under 20,000) and the largest `JSON.stringify(state).length`.

Pass 2, scripted bot: build order Woodcutter's camp, Cottage, Mine, Workshop; Mine on stone until 190, else ore while ore is under 60 and tools under 45; Workshop on Forge once ore ≥ 10; upgrade the Forager's hut at tools 5 and switch it to Snares; upgrade a Cottage when beds are full and food allows an arrival; lower the Woodcutter's open slots to 1 when wood ≥ 195; order the Hall when it can. Fails unless the Village comes between tick 1,200 and 2,200. If the engine's first run falls outside the band, the builder stops and reports the tick to Morgan; the band is not widened to pass (VER-01).

Pass 3, starved town: the pass 2 town at 20 residents, food set to 0 and every food building's `open` set to 0 for 480 ticks, then restored. Fails if more than 3 leave in the 480 ticks, or if the population is not back to 20 within 2,000 ticks.

### Web

- **Worker protocol** (audit F13): every message carries `v: 2`. `load`, `advance` and `command` stay; the answer is `{ type: 'snapshot', v: 2, state, anchorMs, ticks, summary }`. The worker posts one snapshot per message it receives, as in M0. `worker.onerror` and `onmessageerror` on the page show "The town stopped. Export a save." with an Export button for the standby copy (F6).
- **Clock:** `due()` takes the cap from `content.hall.tiers[state.hallTier - 1].catchUpCap`.
- **Store (`store.ts`):** holds the latest snapshot and the last non-empty summary; components read it with `useSyncExternalStore`. Lists keep stable keys so rows are updated in place.
- **Saves:** `SCHEMA = 2`. `upgrades[1]` returns `{ schema: 2, anchorMs: now, state: newGame(old.state.seed, content) }`. One connection is opened once and reused; writes go through one promise chain (F1). `shapeOk` checks every number with `Number.isSafeInteger`, every stock against its cap, and each resident, building and job field by type (F5). Import refuses a file over 5,000,000 bytes. A replace copies the old record to key `previous` in the same transaction (F4). `replaceWith` sets the anchor and the waiting flag before posting (F14).
- **PWA:** `registerType: 'prompt'` stays; `main.tsx` registers through `virtual:pwa-register` with `onNeedRefresh` setting an "Update ready" notice whose "Reload" button calls the returned update function with `true`. The manifest gains `id: '/'` and a third icon entry, `icon-512.png` with `purpose: 'maskable'`; `scripts/make-icons.mjs` draws the letter as an SVG path inside the safe zone and records that in a comment (F3, F18).
- **Fonts:** `main.tsx` imports `@fontsource/alegreya-sans/400.css`, `/500.css`, `/700.css` and `@fontsource/alegreya-sc/700.css`. The workbox `globPatterns` gain `woff2`.
- **Screens**, all from `docs/UI_STYLE.md`:
  - Header: "Ashwick", then "Hamlet" or "Village" and the date from `calendar()`. Under it the pinned stock bar: one cell per resource in content order, `amount / cap`, in `--warn` when the amount is 0 or at the cap.
  - Town tab: the away card (after a catch-up of 10 ticks or more, until dismissed); the Hall row with its tier and the "Upgrade to Village" button or what it still needs; the work queue with a cancel button on waiting jobs; then one row per lot. A built lot shows name, tier, method, workers `n / open` and a short flag. An open lot shows "Open lot" and opens the build sheet. Last, the log's 20 newest lines.
  - Build sheet: every building kind with its cost; kinds that cannot be paid for are shown disabled with what is missing.
  - Building sheet: methods as a list with what each makes and uses per worker per game day (rate × 6 ÷ 100, one decimal), the current one marked, locked ones showing their tier; the open-slots stepper; the workers by name; "Upgrade" with cost and time; "Clear lot" with an in-sheet confirm.
  - People tab: filter chips All, Idle and one per trade present; sort by name, morale or top skill; rows of name, people, trade and morale.
  - Resident sheet: name, people, age in game years, trade, skills as numbers, traits with what each likes and dislikes, morale with every reason and its amount, and "Pin to…" listing buildings with the `fit`, `likes` and `dislikes` terms that would apply.
  - Tab bar: Town and People.
  - Time is shown in game hours and days, never ticks. `ui/format.ts` holds every such conversion; it is display only (GAME-02).
- **Bundle check** (F12): `check-bundle.mjs` sums the gzipped entry, every `modulepreload` link and the worker file under `dist/assets/` whose name starts with `worker`; the limit rises to 120,000 bytes for that total. S1 records the measured total; if it is over, the builder reports it instead of raising the limit.

### Docs and repo fixes (audit F15 to F17)

README's stale line; the charter's and D-022's "proposed" hosting; D-015's pointer; AGENTS.md "once it exists"; the M0 spec's baseline sentences marked "At approval"; `/.vercel/` in `.gitignore`; WEB-05 recorded as an override in AGENTS.md and `.ai-master.json` with the reason "the config only reads the session hook's browser path".

## Slices

Each slice is one PR from a branch cut from the latest `main`. A slice that adds or changes a screen starts with a mock-up Morgan approves (`ui-mockups`); S1 only adds two notices to the M0 page, which D-024 exempts.

### S1 Safe saves and updates

- **Morgan tries:** open the installed app after the S1 deploy, then again after the next deploy: "Update ready" appears and Reload works.
- **Checks that fail now:** J1 (three checks), J2; `purity.test.ts` "the purity check catches globalThis and string comments" (F8); `step.test.ts` "a command on a production tick applies before production" (F10); browser test "hiding the page saves" (F7); the storage-line and offline tests gain real asserts (F7).
- **Files:** `apps/web/src/saves.ts`: one connection, ordered writes, `previous`, safe-integer checks, import size limit. `apps/web/src/App.tsx`: failed-save notice, worker error notice, update notice, `replaceWith` anchor. `apps/web/src/main.tsx`, `vite.config.ts`: update hook, manifest `id`, maskable icon. `scripts/make-icons.mjs`: path-drawn letter. `scripts/check-sim-purity.mjs`: ban `globalThis`, `crypto`, `Intl`; fix the lookbehind and string handling. `scripts/check-bundle.mjs`: the summed total. `packages/sim/src/step.ts`: `advance` guards its tick count. Tests as named. Docs and repo fixes above. `docs/LESSONS.md` untouched unless a mistake is found.
- **Waits on:** none

### S2 Stock, lots and the Town tab

- **Morgan tries:** build a Woodcutter's camp on an open lot, close the app, come back: the wood is there and the lot is working.
- **Checks that fail now:** J3, J4, J9, J11; `content.test.ts` "the real content is valid and runs 96 ticks"; J10 pass 1.
- **Files:** content rewritten with all of the Content section. Engine: types, `step`, `build.ts`, `production.ts` (first methods only: `setMethod` is rejected in this slice), `jobs.ts` (the full pass), `people.ts` (founders), `validate.ts`, `summary.ts`. Day block: eating only. Web: worker protocol v2, `store.ts`, schema 2 and its upgrade, fonts, tokens, header, stock bar, Town tab, build sheet, building sheet without methods (stepper, workers, upgrade, clear). `mockups/town.html` first. Soak pass 1.
- **Waits on:** S1

### S3 Production methods and the away card

- **Morgan tries:** switch the Mine from ore to stone and read what it costs; let the Workshop run out of ore overnight and read the away card.
- **Checks that fail now:** J5, J13.
- **Files:** `production.ts`: inputs, fallback, `short`; `step.ts`: `setMethod`, retooling. `BuildingSheet.tsx`: the methods list. `AwayCard.tsx`. `mockups/town.html` updated for the methods list and the card.
- **Waits on:** S2

### S4 People

- **Morgan tries:** open the People tab, filter to Idle, open a resident, pin them to a job they are bad at and read why their morale falls over the next game days.
- **Checks that fail now:** J6 "skills grow by working", J12; `growth.test.ts` "morale moves toward its reasons by 5 a day".
- **Files:** `day.ts`: skills and morale; `production.ts`: the worker's effect uses skill and morale (S2 and S3 use 100). `PeopleTab.tsx`, `ResidentSheet.tsx`, the tab bar. `mockups/people.html` first.
- **Waits on:** S3

### S5 Growth and the Village

- **Morgan tries:** J14, the M1 test.
- **Checks that fail now:** J7, J8, J10 passes 2 and 3; browser test "the Hall row offers the Village when it can be paid for".
- **Files:** `day.ts`: leaving and arrival; `build.ts`: `upgradeHall`; the tavern's morale term; `clock.ts` cap from the Hall; the Hall row and log section in `TownTab.tsx`; soak passes 2 and 3. `mockups/town.html` updated for the Hall row first.
- **Waits on:** S4

## Verification

- Every push: `npm run check` (under the pinned Node and npm, see AGENTS.md).
- Before a PR is marked ready: `npm run test:browser`, and the style doc's new-screen checklist for each changed screen, with screenshots at 412 px and 360 px.
- End to end: J14 on Morgan's phone.

## Open questions

- The phone's width: the style doc assumes 412 px first and 360 px second. Morgan to confirm or correct.
- Whether gold pays for building from M3 (D-027, proposed).
