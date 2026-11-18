# M2d Ceiling and lots

- **Status:** Approved 2026-11-18 (Morgan on the review form (`m2dspec`, https://claude.ai/artifact/1hdoqGcMCifpeQHN7pR8dB, 2026-11-18): "Approved, start with the mock-up"). S0 mock-up approved 2026-11-18 (`m2dmock1`, https://claude.ai/artifact/KepHEDRaPdVpwFcftLppRH); S1 is next.
- **Planned in:** the M2 re-plan (round 1 https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2, final https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG, 2026-11-14), fun round 2 (https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE), the sites forms (`sites1`, `special1`). **Decisions:** D-032 (push methods), D-033 (lots), D-038 (M2d), D-043 (sites, the Tangle), D-044; proposed here: D-058 to D-061.
- **Order of approval:** the spec and its six questions are answered (below); the S0 mock-up is approved next, then S1 starts.

## Problem

After the M1 test (D-035) Morgan found the town "a little mechanical", the choices "almost too straight forward", and asked for "more tiers and buildings" and longer chains (D-038). He wants "certain core buildings to have dedicated lots ... for basic resource gathering", and to be "surrounded by something that like gets removed to unlock more areas and like lots" (D-043).

Measured on today's code (`0e29f6e`, main after PR #28; seed 1; the soak's pass 2 player kept running past the Village and building cottages, a Farm, a Storehouse, a Tavern and a second Mine, then upgrading everything; the probe is not committed, its rules are in the PR body): the Village at tick 1,536 (6.4 real hours), 60 residents (the Village's `residents` limit in `packages/content/src/index.ts`) at tick 2,977 (12.4 h), all 10 lots full and at tier 3 by hour 16, and from hour 16 to hour 40 nothing is left to build or upgrade while food, wood, stone and tools sit at their caps. That is the ceiling. Seeds 2 and 3 gave the same shape (60 residents at 11.4 h and 12.4 h).

## Terms

- **Tick, check-in, catch-up cap, value, soak passes 1 to 3:** as in `docs/specs/m2e-choices.md` "Terms". 240 ticks are a real hour; 24 a game day.
- **Rules 1 to 6:** the engine's per-tick rules in `packages/sim/src/step.ts`: 1 commands, 2 construction, 3 the start of a game day (`day.ts`: eating, skills, morale, leaving, arrival), 4 jobs, 5 production (`production.ts`), 6 the board (M2e).
- **Effect:** in production, the sum over a building's workers of `effectOf(skill, morale)` (percent; 100 for skill 50 and morale 50, `production.ts:5`); a cycle makes `rate × effect / 10000` units, the remainder kept in `carry`.
- **Plot:** a place a building can stand. Two types: a **town lot** (for most buildings) and a **site** (a "dedicated site", D-043, for a gathering building), each site of one **ground**: forest, mountain, fields, woods or river. Not the charter's "Sites: 6" content target, which counts M3's Eaves quest sites.
- **Feature:** a town lot's character (D-033): good soil, riverside, rock outcrop, forest edge, or none (plain). Sites have no feature.
- **The Tangle:** plots not yet open. Clearing one is a job in the work queue (D-043).
- **Push method:** a method that makes more while running and may shut its building for up to 2 game days (D-032).
- **Hall tiers:** 1 Hamlet, 2 Village, 3 Town (new).

## Goals

- **Lots with a character.** Every town has 16 town lots, each with a feature drawn from its seed; a feature raises named buildings' output by 25%. The build sheet asks where to build and shows what each free lot would add.
- **Sites.** The Woodcutter's camp, Mine, Farm, Forager's hut and the new Fisher's hut stand on sites, not town lots. One site of each ground is open at the start, a second clears from the Village and a third from the Town.
- **The Tangle.** The 4 Village lots, the 6 Town lots and the later sites start in the Tangle. From the Hall tier a plot belongs to, a clearing job (a cost and a game day or two) opens it and yields goods. Its feature shows before clearing.
- **The Town tier.** Hall tier 3: 16 lots, needs 60 residents (a full Village) and goods only the new buildings make. Its resident limit is 100; the charter's v0.1 cap rises to 100 (D-060).
- **3 buildings, 2 goods.** Recommended: Fisher's hut (food, river site), Watermill (planks from wood), Brewery (ale from food). Ale cheers the town each game day it is drunk. Morgan picks the set on the mock-up (D-038).
- **Push methods.** 3: Mine "Deep seam", Fisher's hut "Far waters", Brewery "Strong brew". Each makes about 25 to 50% more while running; each game day it runs has a 1 in 10 chance to shut the building for 2 game days, so over many days it comes out about even (0 to +10%). Pushing pays when a good is needed soon, and costs when the shut lands at a bad time.
- **Measured test (soak pass 4).** The pass 2 town kept running past the Village: reaches the Town in Morgan's band, 7,680 to 11,520 ticks (32 to 48 real hours of hourly check-ins); between the Village and the Town no stretch of more than 960 ticks (4 real hours) finishes nothing; at least 80% of check-ins have a **work choice** (a build, upgrade, clearing or method purchase the town can pay for). These test that there is something to decide; whether the choices are not obvious is Morgan's J9.

## Non-goals

- No grid, roads or adjacency in the rules (D-033). The lot list is not a map; spots on the town view are M2c's (D-037).
- No raids: forest edge is "the first a raid reaches" only from M3 (D-029); M2d records the feature and nothing else.
- No special sites' buildings (tar pit, bog and the rest: D-044, after v0.1), no quest-reached ruins.
- No gold, prices or caravans (M3, D-027). No standing orders, practised crews or ledger (M3 or M4, D-035).
- No change to D-034's prices (F19 stays with Morgan's M2a test); new methods use the same scale.
- No City tier (M7). No new peoples, skills or traits.

## Journeys and checks

The build starts from `0e29f6e` (main after PR #28). Every named test is new or a new case, so it is missing or fails there; checks marked **guard** pass there and must keep passing.

### J1 A town has plots (S1)

- **Given** `newGame(1, content)`. **Then** `state.plots` has 31 entries: 16 town lots (6 open at tier 1, 4 Tangle at tier 2, 6 Tangle at tier 3) then 15 sites (for each ground in `content.grounds` order: one open at tier 1, then tier 2, then tier 3). The 16 lots' features are 3 of each feature and 4 plain, in an order drawn on the `lots` stream; with 4 plain, the 6 open lots always hold at least 2 features. The Cottage stands on the first open town lot and the Forager's hut on the open woods site. **Check:** `packages/sim/test/plots.test.ts` "a new town's plots".
- **Given** seeds 1 and 2. **Then** their feature orders differ, and `newGame` twice with seed 1 gives the same plots. **Check:** `plots.test.ts` "plots come from the seed". Drawing plots moves no other stream: existing `determinism.test.ts` and `growth.test.ts` pinned values (**guard**).

### J2 Build on a chosen plot (S1)

- **Given** a town. **When** `build` names a kind and a plot. **Then** the building stands on that plot. Refused in this order: `unknown` (no such kind), `noLot` (no free open plot the kind may use), `unknown` (no such plot), `notReady` (Tangle), `busy` (taken, also by a building still queued), `notAllowed` (a site kind on a town lot, a town kind on a site, or the wrong ground), `queueFull`, `noStock`. A Hamlet with 6 town buildings and 2 site buildings is legal. **Check:** `plots.test.ts` "building on a plot".
- **Given** a Workshop on a rock outcrop lot and one on a plain lot with the same workers on `forge`, in a hand-built state with stock seeded (`newGame(1)` starts with 0 stone). **Then** over 24 ticks the first makes `floor(effect × 125 / 100)` worth per cycle: 25% more tools, within 1 unit. Uses are not raised. **Check:** `plots.test.ts` "a feature raises output".
- **When** `clear` removes a building. **Then** its plot is free and stays open. **Check:** `plots.test.ts` "clearing frees the plot".

### J3 Clear the Tangle (S2)

- **Given** a Hamlet. **When** `clearTangle` names a tier 2 plot. **Then** it is refused `notAllowed`. **Given** a Village with 10 tools. **Then** it is queued with the tier 2 Tangle cost and ticks; when it finishes the plot is open, its yields go into stock up to the caps (the rest `lost` events), a `tangleCleared` event is written, and the log says "The Tangle was cleared: a riverside lot is open." (plain: "a plain lot"; a site: "a forest site"), with " <amounts> added to the stores." (`amountsLine`) when anything fitted, and " (stores full: the rest was lost)" when some did not, as M2e's deliveries do. An open plot is refused `same`; one with a clearing job `busy`; `queueFull` and `noStock` as for builds. `cancelJob` refunds it like a build. **Check:** `plots.test.ts` "clearing the Tangle".

### J4 The Town tier (S3)

- **Given** a Village with 60 residents, a Storehouse at tier 1 and the Town's cost in stock. **When** `upgradeHall`. **Then** after 144 ticks `hallTier` is 3, the log says the Hall is now a Town, the catch-up cap is 5,760, waiting offers are stretched (D-050), and tier 3 plots can be cleared. With 59 residents it is refused `tooFew`; at the Town `upgradeHall` is refused `notAllowed`. **Check:** `packages/sim/test/growth.test.ts` new case "the Hall becomes a Town".
- **Given** content. **Then** a third Hall tier exists with lots 16, `catchUpCap` 5,760, `needResidents` 60, and a cost naming planks and ale, each amount at most its resource's base cap × 2 (one Storehouse tier). **Check:** `packages/content/test/content.test.ts` "the Town tier".

### J5 New buildings and goods (S3)

- **Given** content. **Then** it has 11 building kinds (the Hall counted apart, as today) and 7 resources; `fisher` has `site: 'river'`; each new kind's first method has no inputs (D-025). At `0e29f6e` it has 8 kinds and 5 resources, so this fails. **Check:** `content.test.ts` "M2d buildings and goods".
- **Given** a Brewery on `malt` and food. **Then** it turns food into ale; short of food it falls back to `smallbeer` (the existing fallback rule). **Check:** `packages/sim/test/methods.test.ts` new case "the Brewery makes ale".
- **Given** 20 residents, 2 ale and a game day starting. **Then** after eating, 2 ale are drunk (1 per 10 residents, rounded up) and every resident's reasons gain `{ id: 'ale', amount: 10 }` right after `food`. With 1 ale, none is drunk and no one gets `ale`. **Check:** `growth.test.ts` new case "ale cheers the town".

### J6 Push methods (S4)

- **Given** a Mine at tier 3 on `deepseam` with workers. **When** game days start. **Then** each day it is running (tier > 0, at least 1 worker, `retoolLeft` 0, `shutLeft` 0; on its fallback or not) it draws once on the `push` stream; on a hit `shutLeft` becomes 48, the log says "A cave-in shut the Mine for 2 game days.", a `shut` event is written, and it makes and uses nothing for the next 48 ticks (12 production cycles), starting that tick. Its workers keep their jobs. At 0 the log says "The Mine is working again." (no event). A building on a method with no `risk` draws nothing. **Check:** `packages/sim/test/push.test.ts` "a push method can shut its building".
- **Given** content. **Then** at least 3 methods have `risk`; each has `shutTicks` 24 or 48, and its long-run gain over its building's best safe method making the same resource, `makes × R / safe − 1`, where the running share `R = (100 − dayPct) × 24 / ((100 − dayPct) × 24 + dayPct × shutTicks)` (a hit day is itself shut, so at 10% and 48 ticks a building runs 9 days in 11), is between 0% and 10%. Fails at `0e29f6e` (no method has `risk`). **Check:** `content.test.ts` "push methods come out about even".
- **Given** seed 1 and a script that builds a Mine to tier 3 and sets `deepseam` (by a hand-built state, as `board.test.ts` does). **Then** at least one `shut` event occurs in 2,400 ticks (100 game days; a run of no hits has odds 0.9¹⁰⁰, and the seed is fixed), and stepping tick by tick and `advance` in chunks give the same state (D-002). **Check:** `determinism.test.ts` new case "push methods replay in chunks".

### J7 Saves move to schema 5 (S1, the Tangle job cases in S2)

- **Given** a schema 4 Hamlet save with 6 buildings (Cottage, Forager's hut, Woodcutter's camp, Cottage, Mine, Workshop). **When** it loads. **Then** it is schema 5, `plots` are the seed's plots (J1), each building stands on a plot (gatherers on their ground's sites, the rest on town lots in order), stock, residents, jobs and owned methods are unchanged. A schema 4 Village with two Mines puts the second on the tier 2 mountain site, opened. **Check:** `apps/web/test/saves.test.ts` "a schema 4 town gains plots".
- **Given** a schema 5 save with two buildings on one plot, a building on a Tangle plot, a site kind on a town lot, a `shutLeft` above 48, or a feature not in content. **Then** it loads as damaged. A Hamlet with 8 buildings (6 lots, 2 sites) loads. S2 adds: a `tangle` job on an open plot, or two on one plot. **Check:** `saves.test.ts` "unsafe numbers are damaged" gains these cases.

### J8 On screen (browser)

- **S1. Given** seed 1 with stone seeded (`seedRecord`). **When** "Build" is tapped and a Workshop chosen. **Then** a lot picker lists the free open town lots, each with its feature and what it adds ("Rock outcrop: Workshop +25%"), lots that add nothing for this kind after the rest; choosing one queues the build there. A kind with exactly one free plot (a Woodcutter's camp with one forest site) skips the picker. **Check:** `tests/browser/town.spec.ts` "building asks where".
- **S2. Given** a Village. **Then** a "The Tangle" section on the Town tab lists clearable plots with their feature, cost and a "Clear" button. **Check:** `town.spec.ts` "clearing the Tangle".
- **S4. Given** a Mine at tier 3. **Then** "Deep seam" in its methods says "Makes more. Each game day: 1 in 10 chance of a cave-in that shuts the Mine for 2 game days." and a shut building's row reads "Shut: cave-in, <time> left". **Check:** `town.spec.ts` "a push method says its risk".
- At 412 px, light and dark, no sideways scroll. **Check:** screenshots in the PR (VER-06; not automated).

### J9 The M2d test (device check, Morgan)

- **Given** the build on the phone, his own town. **When** he plays past the Village over a few days. **Then** the town keeps growing with choices that aren't obvious (charter, Milestones). Recorded in HANDOFF in his words.

### J10 The soak proves the ceiling is gone

- **Pass 1 (S1, S2):** the bot names a random plot id (0 to 30) on `build` and sends `clearTangle` (weight 2, a random plot id). `build` with a plot is carried out at least once; `clearTangle` is refused `notAllowed` at least once (pass 1 counts refusals by command and reason; its bot never upgrades the Hall, `upgradeHall:0` in its report, so pass 4 proves clearing is carried out). `check` gains the plot invariants of J7 and drops `buildings.length > hall.lots` for "each building on its own open plot". The 20,000 ticks a second floor holds (**guard**).
- **Pass 2 (S1):** its player names a plot on each build: `plotsFor(state, kind, content)[0]`, and skips the build that tick when the list is empty. Its band, 1,440 to 2,400 ticks, holds (**guard**: 1,536 now).
- **Pass 4 (new, S3; S4 adds the push run):** the pass 2 town continues, with the same `state` and `ordered`, from its Village tick under the late rules (Design, "Soak pass 4") until the Town or tick 14,000 (a stop so a failing run ends). It runs right after pass 2 and before pass 3, which replaces `state`. It prints `town_tick=`, `town_real_hours=`, `checkins=`, `work_choice=` (the share of check-ins with a work choice, judged at the check-in's first tick before the player acts), `quiet_max=` (the longest run of ticks with no `built`, `upgraded`, `tangleCleared` or `village` event), `residents=`, `cleared=` and `ale_short_days=` (game days, once a Brewery stands, after which no resident has the `ale` reason). It fails when the Town is outside the band, `quiet_max` > 960, `work_choice` < 80%, or `cleared` = 0. S4 adds `shuts=` and a second run with `risk` methods barred to the player (`town_tick_safe=`), failing when `shuts` = 0 or the two Town ticks differ by more than 10% of the later one (a guard that pushing is not a large sure win; it cannot show the choice is interesting). At `0e29f6e` pass 4 does not exist.
- **Check:** `npm run soak`.

## Decisions

- **D-058 (Accepted)** Plots: 16 town lots with features from a shuffled deck on the `lots` stream, sites by ground for gathering kinds, the Tangle by Hall tier, `build` names a plot, `clearTangle` is a queued job. Adds one condition type, a lot's feature, and its one effect, `boostPct` on named kinds' output (D-033 named the condition).
- **D-059 (Accepted)** Push methods: an effect type `risk { dayPct, shutTicks, what }` on a method, drawn once per running game day on the `push` stream, shut at most 48 ticks, long-run gain 0 to 10%. Amends D-030's "no randomness in production".
- **D-060 (Accepted)** The Town tier: 16 lots, catch-up cap 5,760 (24 real hours, closes F18), needs 60 residents and planks and ale; pace band 7,680 to 11,520 ticks (32 to 48 real hours) on soak pass 4; resident limit 100.
- **D-061 (Accepted)** The three buildings and two goods (Fisher's hut, Watermill, Brewery; planks, ale), and ale's daily cheer: an effect type `cheer { perHeads, morale }` on a resource, drunk at the start of a game day when there is enough for everyone.
- Content version 4 becomes 5; save schema 4 becomes 5 (GAME-05). Plot ids are plot indexes; building ids keep coming from `nextId`.

## Alternatives rejected

- **Lots stay a count; features attach to buildings at random when built:** no choice of place, which is the point of D-033. Fails at the first build: nothing to weigh.
- **Each lot's feature drawn independently (25% plain):** a seed can open with six plain lots (0.25⁶ ≈ 0.02%, computed) and more often with one feature only. The deck makes at least 2 of the first 6 featured on every seed.
- **The Hall tier opens Village and Town lots by itself; the Tangle opens only sites** (critic's simpler option): one gate per lot. Rejected because D-043 says clearing "opens new town lots, dedicated sites and special sites". The cost: upgrading to the Village opens no lot until a clearing job (24 ticks each) finishes.
- **Town tier costed in today's goods only:** measured: costs of 400 to 800 wood and stone and 100 to 200 tools reach the Town at 16.6 to 25.6 real hours, but the town spends hours 16 onwards with every store full and nothing to do (Problem). It fails J10's `quiet_max`.
- **Weaver and cloth in place of the Watermill and planks** (the charter lists cloth as a good): cloth has no input the town has in surplus, so its basic method would be the whole chain. Planks turn the wood that sits at its cap from hour 2 into a Town-tier good; ale does the same for food (full from hour 5). Morgan picked planks and ale on the review form.
- **Push methods with a clear long-run gain (the first draft's 14 to 17%):** a min-maxer always pushes, and away for a night the gain averages in, so it is no bet (critic). Held to 0 to 10%: the burst is the reason to push.
- **A shut building frees its workers:** they would drift to other jobs and back, moving morale and skills; more rules for a 2-day event. They wait at their posts.
- **Ale as a cost only:** the Brewery would run only until the Town tier is paid. Ale's cheer gives it a reason to keep running and a real claim on food (Morgan: "Yes: +10 morale with 1 ale per 10 residents").
- **A Hall tier needed before a kind can be built:** a new condition type for one purpose. Costs (planks) gate the new buildings well enough.

## Risks

- **The Village pace moves.** Gatherers leaving the town lots frees Hamlet lots. Pass 2's player builds only 6 buildings by the Village, so its guard should hold (inference); a human may grow faster. → Pass 2's band is a guard; if it fails, S1 reports the tick and changes no number (D-036's pace is Morgan's). Morgan kept 6 Hamlet lots ("Keep 6"); a smaller Hamlet stays the lever if the guard fails, and it is his to pick.
- **The Town band is Morgan's, the cost is not yet measured.** He picked 32 to 48 real hours ("a longer middle game") over the recommended 20 to 32. The starting cost below is sized for the shorter band (estimate), so S3 will likely raise the Town's cost and its `ticks` and measure pass 4 against 7,680 to 11,520; it tunes cost and `LATE`, never the band. A longer middle game also makes `quiet_max` ≤ 960 harder to hold: if it fails, S3 reports where the quiet stretches fall before changing any gate.
- **The lot choice is thin at the Hamlet.** Of the Hamlet's town-lot kinds only the Workshop gains from a feature (rock outcrop, forest edge); good soil and riverside matter from the Village (Brewery, Watermill), and in S1 and S2 boost nothing yet. M3's Herb garden and Smithy are expected to add to soil and rock (assumption, M3's planning). → J9 judges it; Morgan can ask for Hamlet kinds in the boost lists at the mock-up.
- **The soak cannot judge "not obvious".** Pass 4 checks there is always something to do and that pushing is no large sure win; the scripted player follows a fixed list. → J9 is the real test.
- **Push risk runs while away.** 8 real hours away are 80 game days, so a 10% daily risk shuts a building about 7.3 times a night (computed: 80 days / 11 days a cycle). Offline equals live (D-002), by design; the away card counts shuts. A shut makes nothing, but when the building's stores are full it would have made nothing anyway (`production.ts:48`), so a full store makes the shut free and the burst useless.
- **Ale all or nothing.** The whole town gains or loses 10 morale on one stock line, so a shut Brewery (Strong brew) is felt town-wide, a wider reach than D-032's "kept local" shut itself. 1 ale per 10 residents keeps the need at 6 a day at 60 residents against about 14 a day from a tier 3 Brewery on `malt` at 100% effect (40 × 6 cycles × 6 workers / 100, computed). → `ale_short_days` printed; if it passes 20% of days, S3 reports it.
- **The Town needs a Storehouse.** Its cost (wood and stone 400, tools 100) is above the base caps (200, 200, 50), so the town needs Storehouse tier 1 (caps × 2, `util.ts:30`). Intended; the Town row's missing line says "Needs store room: a Storehouse" when a cost is above the caps.
- **Tangle yields are often lost.** Wood is at its cap from hour 2, so the 40 wood often finds no room (D-052 keeps it lost and logged). Accepted: the yield is a small extra, the plot is the reward.
- **Morgan's save.** Schema 4 → 5 places his buildings on plots (Design, Saves). Logged once: "Your town was laid out on plots."
- **Numbering.** Other slice sessions run in parallel; if another PR takes D-058 to D-061 first, this one renumbers.
- **Soak speed.** Plots add a lookup per production cycle; S1 records ticks per second (95,530 to 103,816 measured on 2026-11-18 at `0e29f6e`).

## Design

### Content (`packages/content/src/index.ts`, `packages/sim/src/types.ts`)

All numbers are starting values (D-030 style); S3 and S4 tune them against J10 and report every change.

- `version: 5` (S1).
- **Grounds (S1):** `grounds: { id: string; name: string }[]` = forest "Forest", mountain "Mountain", fields "Fields", woods "Woods", river "River", in that order. `BuildingKind` gains `site?: string` (a ground id): woodcutter forest, mine mountain, farm fields, forager woods (S1); fisher river (S3). A kind with no `site` stands on town lots.
- **Town lots (S1):** `townLots: number[]` = `[6, 4, 6]`, how many town lots each Hall tier lets be cleared. Validated: `sum = features' counts + plainLots`, and for each existing Hall tier i, its `lots` = the sum of the first i entries. No rule reads Hall `lots` any more; the Hall row shows used of open town lots (Rules, Building).
- **Features (S1):** `features: { id: string; name: string; count: number; boosts: string[] }[]`, `plainLots: 4`, `rules.boostPct: 25`.

  | id | name | count | boosts from S1 | added in S3 |
  | --- | --- | --- | --- | --- |
  | `soil` | Good soil | 3 | (none yet) | brewery |
  | `river` | Riverside | 3 | (none yet) | watermill, brewery |
  | `rock` | Rock outcrop | 3 | workshop | |
  | `edge` | Forest edge | 3 | workshop | watermill |

  Validated: every boosted kind exists, has no `site`, and has a method that makes something; `boosts` may be empty.
- **Tangle:** `tangle: { tier: number; cost: Amounts; ticks: number; yields: Amounts }[]`: tier 2 (S2) tools 10, 24 ticks, yields wood 40; tier 3 (S3) tools 20 and planks 10, 48 ticks, yields wood 60 and stone 20. Validated: tiers are Hall tiers 2 and up; a plot of a tier with no row cannot be cleared (`notAllowed`).
- **Resources (S3)** gain planks (cap 100, start 0, value 12) and ale (cap 100, start 0, value 14, `cheer: { perHeads: 10, morale: 10 }`). Values are estimates in D-053's spirit: inputs (60 wood into 40 planks is 7.5 a plank; 60 food into 40 ale is 6 an ale) plus work, rounded; only the trader and rewards read them.
- **Hall tier 3 (S3):** `{ name: 'Town', lots: 16, residents: 100, catchUpCap: 5760, cost: { wood: 400, stone: 400, tools: 100, planks: 80, ale: 60 }, ticks: 144, needResidents: 60 }`.
- **New kinds (S3)** (tier rows: cost; ticks; slots; beds 0):

  | kind | trade, skill | tier 1 | tier 2 | tier 3 |
  | --- | --- | --- | --- | --- |
  | `fisher` Fisher's hut, site river | Fisher, husbandry | wood 30; 8; 3 | wood 50, tools 5; 24; 5 | wood 80, stone 30, planks 10; 48; 6 |
  | `watermill` Watermill | Miller, woodcraft | wood 80, stone 40, tools 10; 36; 3 | wood 100, stone 60, tools 15; 48; 4 | wood 140, stone 90, tools 25, planks 20; 72; 6 |
  | `brewery` Brewery | Brewer, husbandry | wood 60, stone 40; 24; 3 | wood 90, stone 60, tools 10; 36; 4 | wood 120, stone 80, tools 20, planks 20; 48; 6 |

  `trade` and `skill` are the existing string fields.
- **New methods** (`makes`, `uses` per worker per cycle in hundredths; `cost` to own; `risk` as dayPct, shutTicks, what). S3 adds the rows without `risk`; S4 adds the three with it:

  | building | id, name | tier | makes | uses | fallback | cost | risk |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | fisher | `lines` Lines | 1 | food 60 | | | | |
  | fisher | `nets` Nets | 2 | food 100 | tools 2 | lines | wood 30, tools 5 | |
  | fisher | `farwaters` Far waters | 3 | food 125 | tools 3 | lines | wood 50, stone 20, tools 10 | 10, 48, "storm" |
  | watermill | `split` Split boards | 1 | planks 10 | | | | |
  | watermill | `saw` Water saw | 1 | planks 40 | wood 60 | split | wood 30, stone 20 | |
  | brewery | `smallbeer` Small beer | 1 | ale 10 | | | | |
  | brewery | `malt` Malt and mash | 1 | ale 40 | food 60 | smallbeer | wood 30, stone 10 | |
  | brewery | `strong` Strong brew | 3 | ale 50 | food 70 | smallbeer | wood 60, stone 30, tools 10 | 10, 48, "burst vat" |
  | mine | `deepseam` Deep seam | 3 | ore 70 | wood 10, tools 2 | ore | wood 60, stone 30, tools 15 | 10, 48, "cave-in" |

  Gains by J6's formula (R = 2,160 / 2,640 = 9/11, computed): Far waters 125 × 9/11 / 100 = +2%, Strong brew 50 × 9/11 / 40 = +2%, Deep seam 70 × 9/11 / 55 (`shafts`, `content/src/index.ts:177`) = +4%.
- **Goals (S3)** gain, Village (`hall` 2, reward 2,000 to 2,400, inside today's band): `millrace` "A mill on the race" building watermill 1 (2,200), `brewhouse` "A brewhouse" building brewery 1 (2,200), `boards` "Boards for the Town" make planks 40 (2,000), `firstbrew` "The first brew" make ale 30 (2,000), `riverfolk` "River folk" building fisher 1 (2,100). Town (`hall` 3, reward 3,000 each as a start): `deepmine3` "The deep seam" building mine 3, `millworks` "Mill works" make planks 80, `cellar` "A full cellar" make ale 80. S3 measures an hour of the Town's work on pass 4 and sets these rewards to it, and `content.test.ts` gains a hall 3 band of ±25% around it.
- `validateContent` gains (each in the slice that adds the data): grounds unique; each `site` a ground; the `townLots` sums; `boosts`; Tangle rows; `risk.dayPct` 1 to 99, `shutTicks` 24 or 48, `what` non-empty; `cheer.perHeads` and `morale` positive; a Hall cost at most each resource's base cap × 2 (one Storehouse tier).

### State (`packages/sim/src/types.ts`; every field lands in S1 so S1's save check covers schema 5)

```ts
type Plot = {
  id: number; // its index in state.plots
  ground: string | null; // null: a town lot; else a ground id (a site)
  feature: string | null; // town lots only; null is plain
  tier: number; // the Hall tier from which it can be cleared; 1 = open from the start
  open: boolean;
};
```

- `State` gains `plots: Plot[]`. `draft` copies it.
- `Building` gains `plot: number`, `shutLeft: number` (ticks, 0..48) and `shutBy: string | null` (the risk's `what` while shut).
- `Job` becomes `{ target: 'hall' | 'tangle' | number; toTier: number; ticksLeft: number; cost: Amounts; plot?: number }`; a `tangle` job has `plot` and `toTier` = the plot's tier (shown only).
- `StreamName` gains `'lots' | 'push'`; streams start lazily (`rng.ts`), stored in `state.rng` like the others. S1 adds `'tangle'` to `Job.target`'s type, so every reader of `job.target` handles it from S1 (`saves.ts:179-185`, `TownTab.tsx:17` and `:109`, `soak.ts:234`, `build.ts:6` and `:173`); no `tangle` job can exist until S2.
- Commands: `build` becomes `{ type: 'build'; kind: string; plot: number }` (required); new `{ type: 'clearTangle'; plot: number }`.
- Events gain `{ type: 'tangleCleared'; plot: number; yields: Amounts }` (yields kept after caps) and `{ type: 'shut'; buildingId: number; ticks: number }`. The existing `cleared` stays a building's.
- `Summary` gains `shuts: Record<number, number>` (building id → shuts) and Tangle clearings in `finished` ("Cleared: a riverside lot").
- `Reason` is unchanged.

### Rules

- **Plots at the start (`plots.ts`, new, S1):** `makePlots(s: State, content): Plot[]` builds the deck (each feature `count` times in content order, then `plainLots` nulls), shuffles it Fisher–Yates on `lots` (for i from 15 down to 1, `j` = `draw(s.rng, 'lots', s.seed, i + 1)`'s `value`, swap; `s.rng` = its `rng`, `rng.ts:22`), and lays out town lots by tier from `townLots`, then for each ground one site at tiers 1, 2 and 3. `newGame` calls it before the founders arrive (the `lots` stream is separate, so `arrivals` is unchanged), then puts the Cottage on the first open town lot and the Forager's hut on the open woods site.
- **`plotsFor(state, kindId, content): Plot[]`** (S1): free open plots the kind may use (no building and no queued build on it; ground equals `kind.site ?? null`), lots whose feature boosts the kind first, then the rest, each group in id order. Exported with `boostOf(state, building, content): number` (0 or `boostPct`) for the screens (GAME-02).
- **Building (rule 1, `build.ts`, S1):** refusal order as J2. The old checks `state.buildings.length >= hallOf(...).lots` (`build.ts:40`), `saves.ts:161` and `soak.ts:148` go; one building per open plot replaces them. `TownTab.tsx:84` and `HallRow.tsx:39` read Hall `lots` for display: the Hall row shows "<used> of <open> lots" (open town lots), and the empty-lot count is open town lots with no building.
- **Clearing (`clearTangle`, S2):** refusal: `unknown` plot, `same` (open), `busy` (a job names it), `notAllowed` (plot tier > Hall tier, or no Tangle row for its tier), `queueFull`, `noStock`. `jobCost` returns the row's cost. `cancelJob` refunds it and, unlike a first build (`build.ts:173`, `toTier === 1 && target !== 'hall'`), removes no building: the exclusion becomes `target === 'hall' || target === 'tangle'`. Carried out: pays, queues `{ target: 'tangle', plot, toTier: plot.tier, ticksLeft: row.ticks, cost }`. `construct` gains a `tangle` branch beside the Hall's (`build.ts:244-253`): sets `open`, pays `yields` up to caps (`lost` events for the rest), logs (J3), writes `tangleCleared`.
- **Production (rule 5, S1):** a building with `shutLeft > 0` is skipped like one retooling. A building whose lot boosts its kind uses `floor(effect × (100 + boostPct) / 100)` in place of `effect`; uses are unchanged.
- **Ale (rule 3, S3):** after eating, for each resource with `cheer` in content order: need `ceil(residents / perHeads)`; if stock ≥ need, it is used (a `used` event) and each resident's terms gain `{ id: <resource id>, amount: morale }` right after `food`; else nothing.
- **Push (rule 3, S4):** after arrival, for each building in `state.buildings` order that is running (J6) on a method with `risk`: `draw('push', 100) < dayPct` → `shutLeft = shutTicks`, `shutBy = what`, log "A <what> shut the <kind name> for <shutTicks / 24> game day(s).", `shut` event. `shutLeft` counts down with `retoolLeft` at the end of `step`; reaching 0 sets `shutBy` null and logs "The <kind name> is working again."
- **Hall tier 3 (S3):** `upgradeHall` works as for the Village; the comment "the Village is the last tier in M1" (`build.ts:55`) goes.

### Saves (`apps/web/src/saves.ts`)

- **S1:** `SCHEMA = 5`. The 4 → 5 step runs `makePlots` on the state (it has no `lots` stream yet), then places buildings in array order. A gathering kind goes on the first free site of its ground with tier ≤ the Hall's tier, else the first free site of its ground (opened, whatever its tier), else the first free plot of any kind (opened). Any other kind goes on the first free open town lot, else the first free town lot with tier ≤ the Hall's (opened), else any free town lot (opened). "Opened" sets `open: true`. Each building gains `shutLeft: 0`, `shutBy: null`. One log line: "Your town was laid out on plots." A gathering building with no site of its ground left (a fourth of one kind) goes on a town lot by the same order as other kinds, marked `moved: true`, works there with no bonus, and logs "Your extra <kind> was moved to a town lot; it gets no site bonus."; `shapeOk` accepts a moved gatherer on a town lot and nowhere else (D-058 amended 2026-11-18, Morgan: "Keep it, no bonus").
- **S1 `shapeOk`:** `plots.length` equals the content's plot count, ids equal indexes, grounds and features known, `tier` 1 to `townLots.length` (3, though the Hall has 2 tiers until S3); each building's `plot` exists, is open and is unique among buildings; ground matches the kind's `site`; `shutLeft` whole 0..48 and `shutBy` null exactly when it is 0. The `buildings.length > hall.lots` check (`saves.ts:161`) goes.
- **S2 `shapeOk`:** a `tangle` job names a closed plot with tier ≤ the Hall's tier, at most one job per plot; in the job checks at `saves.ts:177-188` its key in `targets` is the string `tangle:<plot>`, so it collides neither with another plot's job nor with a building id.

### Web

Screens follow the mock-up S0 approves; the facts below are what the engine offers.

- `BuildSheet.tsx` (S1): each kind's row is enabled when `plotsFor` is non-empty and `refusal` passes for `build` on `plotsFor(...)[0]` (its cost line as today); after choosing a kind, the lot picker from `plotsFor` (J8): town lots "Rock outcrop: Workshop +25%", "Good soil: nothing here gains yet", "Plain"; sites "Forest site". Exactly one free plot skips the picker; none disables the kind with "No free forest site" (its ground) or "No free town lot", the approved mock-up's wording (S1 build). The picker shows the list again if its last free plot is taken.
- `TownTab.tsx` (S1): the lot rows become one row per open town lot (an empty one reads "Empty lot" with its feature; tapping it opens the build sheet with that lot chosen and only town kinds listed, so no picker), then a "Sites" group with one row per open site. A new town shows 6 lot rows, 5 of them empty (the Forager's hut is now on a site), so `town.spec.ts:30-34,40,106,156` and `smoke.spec.ts:233` change their expected counts. A building row shows its plot's feature (S1) and "Shut: <what>, <time> left" (S4). "The Tangle" section after the work queue (S2): clearable plots, cost, "Clear" (`refusal`-driven like the Upgrade row). Plots of a tier above the Hall's are listed as "Opens at the <tier name>" only when that Hall tier exists in content.
- `Methods.tsx` (S4): a method with `risk` adds its risk line (J8).
- `HallRow.tsx` (S3): the Town row works like the Village row, with the store-room line (Risks); test ids stay `village-*` (they name the Hall's upgrade row).
- `AwayCard.tsx` (S2, S4): Tangle clearings and "The Mine was shut twice" from `summary.shuts`.
- `docs/UI_STYLE.md` tokens only; buttons at least 44 px.

### Callers of `build` to update in S1

`packages/sim/test/town.ts` (`finished()`, `rich()`) and every sim test that sends `build`, `scripts/soak.ts` (passes 1 and 2), `apps/web` (`BuildSheet.tsx`, the store), `tests/browser/*.spec.ts` and `helpers.ts` seed states: each names a plot. Test helpers choose the first free plot whose feature does not boost the kind (a plain lot first), so pinned output numbers (`methods.test.ts:74-134`) hold; only plot tests use boosted lots. Pass 2's player takes boosted lots (`plotsFor(...)[0]`), which may move its Village tick: the guard then reports it (Risks).

### Soak pass 4 (`scripts/soak.ts`, S3)

The pass 2 town, same `state` and `ordered`, stepped tick by tick from its Village tick with check-ins as pass 2 (20 ticks each hour). Each sitting tick the player runs pass 2's rules (its `upgradeHall` now aims at the Town), then, in order:

1. **Clear:** if no `tangle` job is queued, `clearTangle` the first clearable plot in id order.
2. **Build:** `want` starts as `['watermill', 'brewery', 'fisher', 'cottage', 'cottage', 'storehouse', 'tavern', 'cottage', 'cottage', 'mine', 'farm', 'cottage', 'cottage', 'woodcutter', 'cottage']`. When the queue is empty, build the first kind in `want` that has a free plot, on `plotsFor(...)[0]`, and remove it from `want`.
3. **Methods:** Watermill on `saw` while wood ≥ 100, else `split`; Brewery on `malt` while food ≥ half its cap, else `smallbeer`; Farms on `ploughs` at tier 2 and up. S4's push run: Mine to `deepseam`, Fisher to `farwaters`, Brewery to `strong` (in place of `malt`) once owned or payable; the safe run never sets a `risk` method.
4. **Upgrade:** when the queue is empty, `upgrade` each building in order.

A check-in has a **work choice** when, before the player acts, any of these passes `refusal`: `upgradeHall`; `build` of any kind on `plotsFor(...)[0]`; `upgrade` of any building; `clearTangle` of any plot; `setMethod` of any building to a method it does not own. S3 may change `want` and the Town's cost to meet the band and reports each change with the measured result; it changes no gate.

## Slices

### S0 Mock-up (no game code)

- **Morgan sees:** the build sheet's lot picker, the Tangle section, a building row with a feature and a shut line, the Deep seam method row, the Hall's Town row, at 412 px from `docs/UI_STYLE.md` (the `ui-mockups` skill). It shows the set Morgan picked on the review form (D-038's "chosen in M2d's mock-up" was answered there).
- **Waits on:** this spec's approval.
- **Approved 2026-11-18** by Morgan on the mock-up form (`m2dmock1`, https://claude.ai/artifact/KepHEDRaPdVpwFcftLppRH, `mockups/m2d-lots.html`, PR #35): Approve on all four screens (where to build, lots, sites and the Tangle, the Town row, the push method); "Both: the Build button picks a lot, an empty lot picks a building"; the Tangle "One row per plot, as drawn"; the D-061 set "Keep it". No notes. S1 builds to these pictures, including the parts the mock-up added: a Build button at the head of Lots, an empty lot's line naming what it boosts, the build list's "Town lot · n free · +25% on …" line, and the store-room line naming what the stores hold.

### S1 Plots and sites

- **Morgan tries:** build a Workshop and choose its lot by what the lot adds; the Woodcutter's camp goes to the forest site; his old town opens laid out on plots.
- **Checks that fail now:** J1, J2, J7 (S1 cases), J8 "building asks where", J10 pass 1 (`build` with plots) and the pass 2 guard.
- **Accepted in S1:** a Village has only its 6 open town lots until S2 adds clearing; sites still free room.
- **Files:** `packages/sim/src/{types,plots (new),newGame,build,production,util,validate,index}.ts`; content (version 5, grounds, `townLots`, features with S1 boosts, `boostPct`, `site` on four kinds); `apps/web/src/saves.ts`; `BuildSheet.tsx`, `TownTab.tsx`, `HallRow.tsx`, `app.css`; the `build` callers above; tests `plots.test.ts`, `content.test.ts`, `saves.test.ts`, `town.spec.ts`; `scripts/soak.ts`.
- **Waits on:** S0.

### S2 The Tangle

- **Morgan tries:** at the Village, clear a riverside lot and a second forest site, choosing which first; build on them.
- **Checks that fail now:** J3, J7 (S2 cases), J8 "clearing the Tangle", J10 pass 1 (`clearTangle` refused `notAllowed`).
- **Files:** `build.ts` (`clearTangle`, `jobCost`, `construct`, `cancelJob`), `plots.ts`, `validate.ts`, content `tangle` (tier 2 row), `summary.ts`, `saves.ts`, `TownTab.tsx`, `AwayCard.tsx`, tests, `scripts/soak.ts` (pass 1's bot, per-reason refusal counts, `check` for `tangle` jobs at `soak.ts:234`).
- **Waits on:** S1.

### S3 The Town tier, three buildings, two goods

- **Morgan tries:** build a Watermill and a Brewery, see the town cheer on ale, gather planks and ale, and raise the Hall to a Town.
- **Checks that fail now:** J4, J5, J10 pass 4 (band, `quiet_max`, `work_choice`, `cleared`).
- **Files:** content (resources, Hall tier 3, Tangle tier 3 row, kinds, methods without `risk`, feature boosts, goals), `day.ts` (ale), `build.ts` (third tier), `validate.ts`, `HallRow.tsx`, tests (`growth.test.ts`, `methods.test.ts`, `content.test.ts`), soak pass 4.
- **Waits on:** S2.

### S4 Push methods

- **Morgan tries:** put the Mine on Deep seam, come back after a night, read in the log and away card how often it shut, and decide whether it was worth it.
- **Checks that fail now:** J6, J8 "a push method says its risk", J10 pass 4's `shuts` and safe-run gates.
- **Files:** content (the three `risk` methods), `day.ts`, `production.ts`, `step.ts` (count down `shutLeft`), `summary.ts`, `Methods.tsx`, `TownTab.tsx`, `AwayCard.tsx`, tests (`push.test.ts`, `determinism.test.ts`, `content.test.ts`, `town.spec.ts`), soak.
- **Waits on:** S3. S1 to S4 ship in one PR (as M2e did), so J9 tests all of it.

## Verification

- Every push: `npm run check`.
- Before ready: `npm run test:browser`.
- End to end: J9 on Morgan's phone after merge and deploy.

## Answered questions

All six answered by Morgan on the review form (`m2dspec`, https://claude.ai/artifact/1hdoqGcMCifpeQHN7pR8dB, 2026-11-18):

1. The Town's pace: "32 to 48 hours (a longer middle game)" (not the recommended 20 to 32).
2. F18, the Town's catch-up cap: "24 real hours".
3. The buildings and goods: "Fisher's hut, Watermill, Brewery; planks and ale". The S0 mock-up shows this set; it does not ask again.
4. Ale's cheer: "Yes: +10 morale with 1 ale per 10 residents".
5. Hamlet lots: "Keep 6".
6. The Town's resident limit: "100, and raise the v0.1 cap to 100" (`docs/CHARTER.md` "Content targets" changed in the same PR).
