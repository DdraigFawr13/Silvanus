# M2d Ceiling and lots

- **Status:** Draft (2026-11-18), waiting for Morgan's approval. Not built.
- **Planned in:** the M2 re-plan (round 1 https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2, final https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG, 2026-11-14), fun round 2 (https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE), the sites forms (`sites1`, `special1`). **Decisions:** D-032 (push methods), D-033 (lots), D-038 (M2d), D-043 (sites, the Tangle), D-044; proposed here: D-057 to D-060.

## Problem

After the M1 test (D-035) Morgan found the town "a little mechanical", the choices "almost too straight forward", and asked for "more tiers and buildings" and longer chains (D-038). He wants "certain core buildings to have dedicated lots ... for basic resource gathering", and to be "surrounded by something that like gets removed to unlock more areas and like lots" (D-043).

Measured on today's code (`0e29f6e`, seed 1, the soak's pass 2 player kept running past the Village and building cottages, a Farm, a Storehouse, a Tavern and a second Mine, then upgrading everything; probe not committed): the Village at tick 1,536 (6.4 real hours), 60 residents (the Village's limit) at tick 2,977 (12.4 h), all 10 lots full and at tier 3 by hour 16, and from hour 16 to hour 40 nothing is left to build or upgrade while food, wood, stone and tools sit at their caps. That is the ceiling. Seeds 2 and 3 gave the same shape (60 residents at 11.4 h and 12.4 h).

## Terms

- **Tick, check-in, catch-up cap, value, soak passes 1 to 3:** as in `docs/specs/m2e-choices.md` "Terms". 240 ticks are a real hour; 24 a game day.
- **Plot:** a place a building can stand. Two types: a **town lot** (for most buildings) and a **site** (for a gathering building, D-043), each site of one **ground**: forest, mountain, fields, woods or river.
- **Feature:** a town lot's character (D-033): good soil, riverside, rock outcrop, forest edge, or none (plain). Sites have no feature.
- **The Tangle:** plots not yet open. Clearing one is a job in the work queue (D-043).
- **Push method:** a method that makes more and may shut its building for up to 2 game days (D-032).
- **Hall tiers:** 1 Hamlet, 2 Village, 3 Town (new).

## Goals

- **Lots with a character.** Every town has 16 town lots, each with a feature drawn from its seed; a feature raises named buildings' output. The build sheet asks where to build and shows what each free lot would add.
- **Sites.** The Woodcutter's camp, Mine, Farm, Forager's hut and the new Fisher's hut stand on sites, not town lots. One site of each ground is open at the start, a second clears from the Village and a third from the Town.
- **The Tangle.** Town lots and sites beyond the Hamlet's start in the Tangle. From the Hall tier that opens them, a clearing job (cost, a game day or two) opens one and yields goods. Its feature shows before clearing.
- **The Town tier.** Hall tier 3: 16 lots, 100 residents, needs 60 residents (a full Village) and goods only the new buildings make.
- **3 buildings, 2 goods.** Recommended: Fisher's hut (food, river site), Watermill (planks from wood), Brewery (ale from food). Ale cheers the town each game day it is drunk. Morgan picks the set on the mock-up (D-038).
- **Push methods.** 3: Mine "Deep seam", Fisher's hut "Far waters", Brewery "Strong brew". Each makes about 30 to 50% more while running, and each game day it runs has a chance to shut the building for 2 game days.
- **Measured test (soak pass 4).** The pass 2 town kept running past the Village: reaches the Town in the band Morgan picks (proposed 4,800 to 7,680 ticks, 20 to 32 real hours, an estimate to be measured); between the Village and the Town no stretch of more than 960 ticks (4 real hours) finishes nothing; at least 80% of check-ins have a **work choice** (a build, upgrade, clearing or method purchase the town can pay for); and the same town without push methods reaches the Town within 10% of the push town's tick, so pushing is not simply better.

## Non-goals

- No grid, roads or adjacency in the rules (D-033). The lot list is not a map; spots on the town view are M2c's (D-037).
- No raids: forest edge is "the first a raid reaches" only from M3 (D-029); M2d records the feature and nothing else.
- No special sites' buildings (tar pit, bog and the rest: D-044, after v0.1), no quest-reached ruins.
- No gold, prices or caravans (M3, D-027). No standing orders, practised crews or ledger (M3 or M4, D-035).
- No change to D-034's prices (F19 stays with Morgan's M2a test); new methods use the same scale.
- No City tier (M7). No new peoples, skills or traits.

## Journeys and checks

The build starts from `0e29f6e` (main after PR #28). Every named test is new or a new case, so it is missing or fails there; checks marked **guard** pass there and must keep passing.

### J1 A town has plots

- **Given** `newGame(1, content)`. **Then** `state.plots` has 31 entries: 16 town lots (6 open at tier 1, 4 Tangle at tier 2, 6 Tangle at tier 3) then 15 sites (for each ground in content order: one open, one tier 2, one tier 3). The 16 lots' features are 3 of each feature and 4 plain, in an order drawn on the `lots` stream; the 6 open lots always hold at least 2 features. The Cottage stands on the first open town lot and the Forager's hut on the open woods site. **Check:** `packages/sim/test/plots.test.ts` "a new town's plots".
- **Given** seeds 1 and 2. **Then** their feature orders differ, and `newGame` twice with seed 1 gives the same plots. Drawing plots moves no other stream (`arrivals` state equal to today's). **Check:** `plots.test.ts` "plots come from the seed"; existing `determinism.test.ts` and `growth.test.ts` pinned values (**guard**).

### J2 Build on a chosen plot

- **Given** a town. **When** `build` names a kind and a plot. **Then** the building stands on that plot. Refused: `noLot` (no free open plot the kind may use anywhere), `unknown` (no such plot), `notReady` (Tangle), `busy` (taken, also by a building still queued), `notAllowed` (a site kind on a town lot, a town kind on a site, or the wrong ground). **Check:** `plots.test.ts` "building on a plot".
- **Given** a Workshop on a rock outcrop lot and one on a plain lot with the same workers. **Then** over 24 ticks the first makes 25% more tools (`features[].boostPct`, rounded down per cycle as `carry` does). Uses are not raised. **Check:** `plots.test.ts` "a feature raises output".
- **When** `clear` removes a building. **Then** its plot is free and open (it does not go back to the Tangle). **Check:** `plots.test.ts` "clearing frees the plot".

### J3 Clear the Tangle

- **Given** a Hamlet. **When** `clearTangle` names a tier 2 plot. **Then** it is refused `notAllowed`. **Given** a Village with 10 tools. **Then** it is queued as a job with the content's tier 2 cost and ticks; when it finishes the plot is open, its yields go into stock up to the caps (the rest a `lost` event), and the log says "The Tangle was cleared: a riverside lot is open. 40 wood added to the stores." An open plot is refused `same`; one with a clearing job `busy`; `queueFull` and `noStock` as for builds. `cancelJob` refunds it like a build. **Check:** `plots.test.ts` "clearing the Tangle".

### J4 The Town tier

- **Given** a Village with 60 residents and the Town's cost in stock. **When** `upgradeHall`. **Then** after the Town's ticks `hallTier` is 3, the log says the Hall is now a Town, the catch-up cap is 5,760, waiting offers are stretched (D-050), and tier 3 plots can be cleared. With 59 residents it is refused `tooFew`; at the Town `upgradeHall` is refused `notAllowed`. **Check:** `packages/sim/test/growth.test.ts` new case "the Hall becomes a Town".
- **Given** content. **Then** a third Hall tier exists with lots 16, residents 100, `catchUpCap` 5,760, `needResidents` 60, and a cost naming planks and ale. **Check:** `packages/content/test/content.test.ts` "the Town tier".

### J5 New buildings and goods

- **Given** content. **Then** it has 11 building kinds (the Hall counted apart, as today) and 7 resources; `fisher` has `site: 'river'`; each new kind's first method has no inputs (D-025). **Check:** `content.test.ts` "M2d buildings and goods".
- **Given** a Brewery on "Malt and mash" and food. **Then** it turns food into ale; short of food it falls back to "Small beer" (**the existing fallback rule**). **Check:** `packages/sim/test/methods.test.ts` new case "the Brewery makes ale".
- **Given** 20 residents, 4 ale and a game day starting. **Then** 4 ale are drunk (1 per 5 residents, rounded up) and every resident's morale reasons include `ale` +10. With 3 ale, none is drunk and no one gets `ale`. **Check:** `packages/sim/test/growth.test.ts` new case "ale cheers the town".

### J6 Push methods

- **Given** a Mine at tier 3 on "Deep seam" with workers. **When** game days start. **Then** each day it is running it draws once on the `push` stream; on a hit `shutLeft` becomes 48, the log says "A cave-in shut the Mine for 2 game days.", a `shut` event is written, and it makes nothing until `shutLeft` is 0. Its workers keep their jobs. A shut building draws nothing. A building on a safe method draws nothing. **Check:** `packages/sim/test/push.test.ts` "a push method can shut its building".
- **Given** content. **Then** every method with `risk` has `shutTicks` ≤ 48, and its long-run gain over its building's best safe method of the same output, `makes × 2400 / (2400 + dayPct × shutTicks) / safe − 1`, is between 5% and 20%. **Check:** `content.test.ts` "push methods are a gamble, not a sure win".
- **Given** seed 1 and a script with push methods. **Then** stepping tick by tick and `advance` in chunks give the same state (D-002). **Check:** `determinism.test.ts` new case "push methods replay in chunks".

### J7 Saves move to schema 5

- **Given** a schema 4 Hamlet save with 6 buildings (Cottage, Forager's hut, Woodcutter's camp, Cottage, Mine, Workshop). **When** it loads. **Then** it is schema 5, `plots` are the seed's plots (J1), each building stands on a plot (gatherers on their ground's sites, the rest on town lots in order), stock, residents, jobs and owned methods are unchanged. A schema 4 Village with two Mines puts the second on the tier 2 mountain site, opened. **Check:** `apps/web/test/saves.test.ts` "a schema 4 town gains plots".
- **Given** a schema 5 save with two buildings on one plot, a building on a Tangle plot, a site kind on a town lot, a `shutLeft` above 48, or a feature not in content. **Then** it loads as damaged. **Check:** `saves.test.ts` "unsafe numbers are damaged" gains these cases.

### J8 On screen (browser)

- **Given** seed 1. **When** "Build" is tapped and a Workshop chosen. **Then** a lot picker lists the free open town lots, each with its feature and what it adds ("Rock outcrop: Workshop +25%"), plain lots last; choosing one queues the build there. A Woodcutter's camp goes to its site with no picker when one site is free. **Check:** `tests/browser/town.spec.ts` "building asks where".
- **Given** a Village. **Then** a "The Tangle" section on the Town tab lists clearable plots with their feature, cost and a "Clear" button, and plots of the next tier as "Opens at the Town". **Check:** `town.spec.ts` "clearing the Tangle".
- **Given** a Mine at tier 3. **Then** "Deep seam" in its methods says "Makes more. Each game day: 1 in 10 chance of a cave-in that shuts the Mine for 2 game days." and a shut building's row reads "Shut: cave-in, <time> left". **Check:** `town.spec.ts` "a push method says its risk".
- At 412 px, light and dark, no sideways scroll. **Check:** screenshots in the PR (VER-06).

### J9 The M2d test (device check, Morgan)

- **Given** the build on the phone, his own town. **When** he plays past the Village over a few days. **Then** the town keeps growing with choices that aren't obvious (charter, Milestones). Recorded in HANDOFF in his words.

### J10 The soak proves the ceiling is gone

- **Pass 1:** the bot also sends `clearTangle` (weight 2, a random plot id) and names a random plot id on `build`; each is carried out at least once; `check` gains the plot invariants of J7. Its 20,000 ticks a second floor holds (**guard**).
- **Pass 2:** its player names a plot on each build (the first free plot the kind may use, preferring one whose feature boosts it). Its band, 1,440 to 2,400 ticks, holds (**guard**: passes now at 1,536).
- **Pass 4 (new), past the Village:** the pass 2 town continues from its Village tick with the late rules (Design, "Soak pass 4") until the Town or tick 12,000. It prints `town_tick=`, `town_real_hours=`, `checkins=`, `work_choice=` (share of check-ins, judged at the check-in's first tick before the player acts), `quiet_max=` (the longest run of ticks with no `built`, `upgraded`, `cleared` or `village` event), `residents=`, `shuts=`, and runs again with push methods barred to the player (`town_tick_safe=`). It fails when the Town is outside the band, `quiet_max` > 960, `work_choice` < 80%, `shuts` = 0, or `|town_tick − town_tick_safe| × 100 > 10 × max(town_tick, town_tick_safe)`. At `0e29f6e` it fails: there is no Town tier.
- **Check:** `npm run soak`.

## Decisions

- **D-057 (Proposed)** Plots: 16 town lots with features from a shuffled deck on the `lots` stream, sites by ground for gathering kinds, the Tangle by Hall tier, `build` names a plot, `clearTangle` is a queued job. Adds one condition type, a lot's feature, and one effect, `boostPct` on named kinds' output (D-033 named the condition).
- **D-058 (Proposed)** Push methods: `risk { dayPct, shutTicks, what }` on a method, drawn once per running game day on the `push` stream, shut at most 48 ticks. Amends D-030's "no randomness in production".
- **D-059 (Proposed)** The Town tier: 16 lots, 100 residents, catch-up cap 5,760 (24 real hours, closes F18), needs 60 residents and planks and ale; pace band 4,800 to 7,680 ticks on soak pass 4.
- **D-060 (Proposed)** The three buildings and two goods (Fisher's hut, Watermill, Brewery; planks, ale), and ale's daily cheer: a resource may carry `cheer { perHeads, morale }`, drunk at the start of a game day when there is enough for everyone. A new effect type.
- Content version 4 becomes 5; save schema 4 becomes 5 (GAME-05). Plot ids are plot indexes; building ids keep coming from `nextId`.

## Alternatives rejected

- **Lots stay a count; features attach to buildings at random when built:** no choice of place, which is the point of D-033. Fails at the first build: nothing to weigh.
- **Each lot's feature drawn independently:** a seed can open with six plain lots (probability 0.4⁶ ≈ 0.4% per town with 40% plain; computed). The deck guarantees 2 or more features in the first 6. It fails when a seed starts with nothing to choose.
- **The Hall's lot count limits buildings and clearing is optional:** two gates on one thing. Fails when a player clears lots they cannot use.
- **Town tier costed in today's goods only:** measured: costs of 400 to 800 wood and stone and 100 to 200 tools reach the Town at 16.6 to 25.6 real hours, but the town spends hours 16 onwards with every store full and nothing to do (Problem). It fails J10's `quiet_max`.
- **Weaver and cloth in place of the Watermill and planks** (the charter lists cloth as a good): cloth has no input the town has in surplus, so its basic method would be the whole chain. Planks turn the wood that sits at its cap from hour 2 into a Town-tier good; ale does the same for food (full from hour 5). Morgan may still pick cloth on the mock-up (open question 3).
- **Push methods that only add variance (a higher mean with risk):** a min-maxer always pushes. J6's 5 to 20% long-run gain band plus the cost of buying the method and output lost while away makes pushing a bet; J10's 10% gate checks it on a whole town.
- **A shut building frees its workers:** they would drift to other jobs and back, moving morale and skills; more rules for a 2-day event. Rejected for M2d; they wait at their posts.
- **Ale as a cost only:** the Brewery would run only until the Town tier is paid. Rejected: ale's cheer gives it a reason to keep running and a real claim on food.
- **A Hall tier needed before a kind can be built:** a new condition type for one purpose. The costs (planks) gate the new buildings well enough; a Hamlet that builds a Brewery early has chosen badly, which is a choice.

## Risks

- **The Village pace moves.** Gatherers leaving the town lots frees Hamlet lots. Pass 2's player builds only 6 buildings by the Village, so its guard should hold (inference); a human may grow faster. → Pass 2's band is a guard; if it fails, S1 reports the tick and changes no number (D-036's pace is Morgan's). Open question 5 offers fewer Hamlet lots as the lever.
- **The Town band is an estimate.** 20 to 32 real hours is Claude's proposal, a step past the Village's 6 to 10, not a measurement. → Morgan picks it (open question 1); S3 measures pass 4 and tunes the Town's cost, never the band.
- **Push risk runs while away.** At 15 s a game hour, 8 real hours away are 80 game days, so a 10% daily risk shuts a building about 6.7 times a night and keeps it shut about a sixth of the time (computed: 80 days × 0.1 × 1 / 1.2). Offline equals live (D-002), so this is by design; the away card counts shuts (S4).
- **Morgan's save.** Schema 4 → 5 places his buildings on plots. A town with 4 or more of one gathering kind has more than 3 sites' worth; the extra ones take the first free Tangle site of their ground regardless of tier, then any free plot, opened. Logged once: "Your town was laid out on plots." The test covers two Mines.
- **Numbering.** Other slice sessions run in parallel; if another PR takes D-057 to D-060 first, this one renumbers.
- **Soak speed.** Plots add a lookup per production cycle; S1 records ticks per second (103,816 measured on 2026-11-18 at `0e29f6e`).

## Design

### Content (`packages/content/src/index.ts`, `packages/sim/src/types.ts`)

All numbers are starting values (D-030 style); S3 and S4 tune them against J10 and report every change.

- `version: 5`.
- **Resources** gain planks (cap 100, start 0, value 12: a Water saw turns 60 wood into 40 planks, 1.5 × 5 + work) and ale (cap 100, start 0, value 14: 60 food into 40 ale, 1.5 × 4 + work; `cheer: { perHeads: 5, morale: 10 }`).
- **Grounds:** `grounds: { id: 'forest' | 'mountain' | 'fields' | 'woods' | 'river'; name: string }[]` in that order. `BuildingKind` gains `site?: string` (a ground id): woodcutter forest, mine mountain, farm fields, forager woods, fisher river. A kind with no `site` stands on town lots.
- **Features:** `features: { id: string; name: string; count: number; boostPct: number; boosts: string[] }[]`, plus `plainLots: 4`. Sum of counts + plain = 16 (validated against the last Hall tier's `lots`).

  | id | name | count | boosts (+25%) |
  | --- | --- | --- | --- |
  | `soil` | Good soil | 3 | brewery |
  | `river` | Riverside | 3 | watermill, brewery |
  | `rock` | Rock outcrop | 3 | workshop |
  | `edge` | Forest edge | 3 | workshop, watermill |

  Every boosted kind stands on town lots and has a method that makes something (validated). M3's Herb garden and Smithy are expected to join `soil` and `rock` (assumption, M3's planning).
- **Tangle:** `tangle: { tier: number; cost: Amounts; ticks: number; yields: Amounts }[]`: tier 2 tools 10, 24 ticks, yields wood 40; tier 3 tools 20 and planks 10, 48 ticks, yields wood 60 and stone 20.
- **Hall tier 3:** `{ name: 'Town', lots: 16, residents: 100, catchUpCap: 5760, cost: { wood: 400, stone: 400, tools: 100, planks: 120, ale: 80 }, ticks: 144, needResidents: 60 }`.
- **New kinds** (tier rows: cost, ticks, slots, beds):

  | kind | trade, skill | tier 1 | tier 2 | tier 3 |
  | --- | --- | --- | --- | --- |
  | `fisher` Fisher's hut, site river | Fisher, husbandry | wood 30; 8; 3 | wood 50, tools 5; 24; 5 | wood 80, stone 30, planks 10; 48; 6 |
  | `watermill` Watermill | Miller, woodcraft | wood 80, stone 40, tools 10; 36; 3 | wood 100, stone 60, tools 15; 48; 4 | wood 140, stone 90, tools 25, planks 20; 72; 6 |
  | `brewery` Brewery | Brewer, husbandry | wood 60, stone 40; 24; 3 | wood 90, stone 60, tools 10; 36; 4 | wood 120, stone 80, tools 20, planks 20; 48; 6 |

- **New methods** (`makes`, `uses` per worker per cycle in hundredths; cost to own):

  | building | id, name | tier | makes | uses | fallback | cost | risk |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | fisher | `lines` Lines | 1 | food 60 | | | | |
  | fisher | `nets` Nets | 2 | food 100 | tools 2 | lines | wood 30, tools 5 | |
  | fisher | `farwaters` Far waters | 3 | food 140 | tools 3 | lines | wood 50, stone 20, tools 10 | 10, 48, "a storm" |
  | watermill | `split` Split boards | 1 | planks 10 | | | | |
  | watermill | `saw` Water saw | 1 | planks 40 | wood 60 | split | wood 30, stone 20 | |
  | brewery | `smallbeer` Small beer | 1 | ale 10 | | | | |
  | brewery | `malt` Malt and mash | 1 | ale 40 | food 60 | smallbeer | wood 30, stone 10 | |
  | brewery | `strong` Strong brew | 3 | ale 56 | food 80 | smallbeer | wood 60, stone 30, tools 10 | 10, 48, "a burst vat" |
  | mine | `deepseam` Deep seam | 3 | ore 75 | wood 10, tools 2 | ore | wood 60, stone 30, tools 15 | 10, 48, "a cave-in" |

  Gains (J6 formula, computed): Far waters 140 / 1.2 / 100 = +17%, Strong brew 56 / 1.2 / 40 = +17%, Deep seam 75 / 1.2 / 55 = +14%.
- **Goals** gain, Village (`hall` 2, reward 2,000 to 2,400 as today's band): `millrace` building watermill 1, `alehouse2` building brewery 1, `boards` make planks 40, `firstbrew` make ale 30, `riverfolk` building fisher 1. Town (`hall` 3; reward 3,000 each, measured and set in S3 to about an hour of the Town's work on pass 4): `hundred` residents 80, `deepseam` building mine 3, `millworks` make planks 80, `cellar` make ale 80. Content test gains a hall 3 band once S3 has measured it.
- `validateContent` gains: grounds unique; each `site` a ground; features' counts + `plainLots` = the last tier's `lots`; `boosts` name town-lot kinds with a making method; Tangle tiers are Hall tiers 2 and up with positive ticks; `risk.dayPct` 1 to 99 and `shutTicks` 1 to 48; `cheer.perHeads` and `morale` positive.

### State (`packages/sim/src/types.ts`)

```ts
type Plot = {
  id: number; // its index in state.plots
  ground: string | null; // null: a town lot; else a ground id (a site)
  feature: string | null; // town lots only; null is plain
  tier: number; // the Hall tier from which it can be cleared; 1 = open from the start
  open: boolean;
};
```

`State` gains `plots: Plot[]`. `Building` gains `plot: number` and `shutLeft: number` (ticks, 0..48) and `shutBy: string | null` (the risk's `what`, for the row). `Job` gains an optional `plot: number` and `target` gains `'tangle'`. `StreamName` gains `'lots' | 'push'`. Commands: `build` gains `plot: number`; new `{ type: 'clearTangle'; plot: number }`. Events gain `cleared` with `plot` for a Tangle job (the existing `cleared` is a building's; name the new one `tangleCleared { plot; yields: Amounts }`) and `shut { buildingId; ticks }`. `Reason` is unchanged. `draft` copies `plots`.

### Rules

- **Plots at the start (`plots.ts`, new):** `makePlots(seed, content): { plots: Plot[]; rng: number }` builds the deck (each feature `count` times, then `plainLots` nulls), shuffles it Fisher–Yates on `lots` (as rule 6c's goal shuffle), and lays out town lots by tier (6 at 1, `lots[1] − lots[0]` at 2, `lots[2] − lots[1]` at 3), then for each ground one site at tiers 1, 2 and 3. `newGame` and the schema 5 step both call it. The Cottage takes the first open town lot, the Forager's hut the first open woods site.
- **Building (rule 1, `build.ts`):** refusal order: `unknown` kind; `noLot` when `plotsFor` is empty (no free open plot the kind may use); then for the named plot `unknown`, `notReady` (not open), `busy` (a building, also one still queued, on it), `notAllowed` (`kind.site ?? null` ≠ `plot.ground`); then `queueFull`, `noStock`. The building is created at tier 0 on the plot as today. The Hall's `lots` no longer limits builds directly: open town lots do.
- **Clearing (`clearTangle`):** refusal: `unknown` plot, `same` (open), `busy` (a job on it), `notAllowed` (plot tier > Hall tier), `queueFull`, `noStock` (the Tangle row of the plot's tier). Carried out: pays, queues `{ target: 'tangle', plot, toTier: plot.tier, ticksLeft, cost }`. `construct` finishing it sets `open`, pays `yields` up to caps (`lost` events for the rest), logs, `tangleCleared`.
- **Production (rule 5):** skips a building with `shutLeft > 0`. A building on a lot whose feature boosts its kind multiplies its summed `effect` by `(100 + boostPct) / 100`, floored, before `rate × effect` (uses are unchanged).
- **Push (rule 3, `day.ts`, after leaving and arrival):** for each building in order that is tier > 0, staffed, not retooling, `shutLeft` 0 and on a method with `risk`: `draw('push', 100) < dayPct` → `shutLeft = shutTicks`, `shutBy = what`, log "A <what> shut the <kind> for <n> game days.", `shut` event. `shutLeft` counts down with `retoolLeft` at the end of the step; at 0 the log says "The <kind> is working again."
- **Ale (rule 3, after eating):** for each resource with `cheer`: need `ceil(residents / perHeads)`; if stock ≥ need, it is used (a `used` event) and each resident's terms gain `{ id: <resource id>, amount: morale }`; else nothing.
- **Hall tier 3:** `upgradeHall` works as for the Village; the comment "the Village is the last tier" goes. `village` events already carry the tier.

`plots.ts` also exports `plotsFor(state, kindId, content): Plot[]` (free open plots the kind may use, feature lots that boost it first, then plain, in id order) and `boostOf(state, building, content): number`, both re-exported for the screens (GAME-02).

### Saves (`apps/web/src/saves.ts`)

- `SCHEMA = 5`; the 4 → 5 step calls `makePlots(state.seed, content)`, sets `rng.lots`, then places buildings in array order: a gathering kind on the first free site of its ground with tier ≤ the Hall's tier, else the first free site of its ground (opened), else the first free plot (opened); any other kind on the first free open town lot, else the first free town lot with tier ≤ the Hall's (opened), else any free town lot (opened). Each building gains `shutLeft: 0`, `shutBy: null`. One log line, "Your town was laid out on plots."
- `shapeOk` checks: 31 plots (the content's count), ids equal indexes, grounds and features known, `tier` a Hall tier; each building's `plot` exists, is open and is unique among buildings; ground matches the kind's `site`; `shutLeft` whole 0..48 and `shutBy` null exactly when it is 0; a `tangle` job names a closed plot of tier ≤ Hall tier, at most one job per plot.

### Web

Screens follow the mock-up S0 approves; the facts below are what the engine offers.

- `BuildSheet.tsx`: after choosing a kind, a lot picker from `plotsFor` (feature name and "Workshop +25%", or "Plain"); a site kind with one free site skips the picker.
- `TownTab.tsx`: a "The Tangle" section after the work queue: clearable plots ("Riverside lot", "Forest site"), cost, "Clear" (`refusal`-driven like the Upgrade row), and the next tier's as "Opens at the Town". A building row shows its lot's feature and "Shut: <what>, <time> left" when shut.
- `Methods.tsx`: a method with `risk` adds its risk line (J8).
- `HallRow.tsx`: the Town row works like the Village row; test ids stay `village-*` (they name the Hall's upgrade row, not the tier).
- `AwayCard.tsx` and `summary.ts`: shuts while away ("The Mine was shut twice") and Tangle clearings in `finished`.
- `docs/UI_STYLE.md` tokens only; buttons at least 44 px.

### Soak pass 4 (`scripts/soak.ts`)

The pass 2 town at its Village tick, stepped tick by tick with check-ins as pass 2 (20 ticks each hour). The player runs pass 2's rules, then, in order:

1. **Clear:** if no Tangle job is queued, `clearTangle` the first clearable plot in id order.
2. **Build** from `LATE = ['watermill', 'brewery', 'fisher', 'cottage', 'cottage', 'storehouse', 'tavern', 'cottage', 'cottage', 'mine', 'farm', 'cottage', 'cottage', 'woodcutter', 'cottage']` when the queue is empty, on `plotsFor(...)[0]`; skip a kind when no plot is free and come back to it.
3. **Methods:** Watermill on `saw` while wood ≥ 100, else `split`; Brewery on `malt` while food ≥ half its cap, else `smallbeer`; Farms on `ploughs` at tier 2 and up. Push run: Mine to `deepseam`, Fisher to `farwaters`, Brewery to `strong` (in place of `malt`) once owned or payable. Safe run: never a `risk` method.
4. **Upgrade:** when the queue is empty, each building in order, then the Hall.

S3 may change `LATE` and the Town's cost to meet the band and reports each change with the measured result; it changes no gate.

## Slices

### S0 Mock-up (no game code)

- **Morgan sees:** the build sheet's lot picker, the Tangle section, a building row with a feature and a shut line, the Deep seam method row, the Hall's Town row, at 412 px from `docs/UI_STYLE.md` (the `ui-mockups` skill). The page also asks him to pick the three buildings and two goods (D-038: "chosen in M2d's mock-up"), with this spec's set recommended.
- **Waits on:** this spec's approval.

### S1 Plots and sites

- **Morgan tries:** build a Workshop and choose its lot by what the lot adds; the Woodcutter's camp goes to the forest site; his old town opens laid out on plots.
- **Checks that fail now:** J1, J2, J7 (all cases), J8 "building asks where", J10 pass 1 (`build` with plots) and pass 2 guard.
- **Files:** `packages/sim/src/{types,plots (new),newGame,build,production,util,validate,index}.ts`; `packages/content/src/index.ts` (version 5, grounds, features, `site` on the four gathering kinds; the Tangle and new kinds wait for S2 and S3, but `types.ts` gets every new field now so S1's save check is the whole schema 5); `apps/web/src/saves.ts`; `BuildSheet.tsx`, `TownTab.tsx`, `app.css`; tests `plots.test.ts`, `content.test.ts`, `saves.test.ts`, `determinism.test.ts`, `town.spec.ts`; `scripts/soak.ts`.
- **Waits on:** S0.

### S2 The Tangle

- **Morgan tries:** at the Village, clear a riverside lot for the Watermill-to-be and a second forest site; watch the wood come in.
- **Checks that fail now:** J3, J8 "clearing the Tangle", J10 pass 1 (`clearTangle` carried out).
- **Files:** `build.ts` (`clearTangle`, `construct`), `plots.ts`, content `tangle`, `TownTab.tsx`, `summary.ts`, `AwayCard.tsx`, tests, soak.
- **Waits on:** S1.

### S3 The Town tier, three buildings, two goods

- **Morgan tries:** build a Watermill and a Brewery, see the town cheer on ale, gather planks and ale, and raise the Hall to a Town.
- **Checks that fail now:** J4, J5, J10 pass 4 without the push gates (`town_tick` in band, `quiet_max`, `work_choice`).
- **Files:** content (resources, Hall tier 3, kinds, methods without `risk`, goals), `day.ts` (ale), `build.ts` (third tier), `validate.ts`, `HallRow.tsx`, tests (`growth.test.ts` with the ale case, `methods.test.ts`, `content.test.ts`), soak pass 4.
- **Waits on:** S2 and Morgan's band (open question 1).

### S4 Push methods

- **Morgan tries:** put the Mine on Deep seam, come back after a night, read in the log and away card how often it shut, and decide whether it was worth it.
- **Checks that fail now:** J6, J8 "a push method says its risk", J10 pass 4's `shuts` and safe-run gates.
- **Files:** content (the three `risk` methods), `day.ts`, `production.ts`, `step.ts` (count down `shutLeft`), `summary.ts`, `Methods.tsx`, `TownTab.tsx`, `AwayCard.tsx`, tests (`push.test.ts`, `determinism.test.ts`, `content.test.ts`, `town.spec.ts`), soak.
- **Waits on:** S3. S1 to S4 ship in one PR (as M2e did), so J9 tests all of it.

## Verification

- Every push: `npm run check`.
- Before ready: `npm run test:browser`.
- End to end: J9 on Morgan's phone after merge and deploy.

## Open questions

1. **The Town's pace.** Recommended: soak pass 4 reaches the Town at 20 to 32 real hours of hourly check-ins (4,800 to 7,680 ticks). Other options: 12 to 20 hours (sooner, more like the Village's step); 32 to 48 hours (a longer middle game). Claude's estimate, not a measurement.
2. **F18: the Town's catch-up cap.** Recommended: 24 real hours (5,760 ticks), the step after 8 and 16. Other option: keep 16 (3,840), so a day away loses 8 hours of catch-up.
3. **The three buildings and two goods** (asked on the S0 mock-up). Recommended: Fisher's hut, Watermill and Brewery; planks and ale. Other option: Fisher's hut, Weaver and Brewery; cloth and ale.
4. **Ale cheers the town each day** (D-060). Recommended: yes, +10 morale when there is 1 ale per 5 residents. Other option: ale is only a cost for the Town tier.
5. **Hamlet lots once gatherers move to sites.** Recommended: keep 6 (the charter's number), since pass 2's Village guard should hold. Other option: 4, so lots stay tight at the Hamlet.
