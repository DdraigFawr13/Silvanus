# M2e Choices

- **Status:** Draft
- **Planned in:** round 1 (https://claude.ai/artifact/HdpkiWhhZkeEPV2FLgAFKg, `play1`), review and round 2 (https://claude.ai/artifact/2zZSib54mLApaC8wtUfJXG, `play2`), final (https://claude.ai/artifact/FJuq2TKb8gmPAfcEbdymhQ, `playfinal`), all 2026-11-14. **Decisions:** D-040; new entries D-049 to D-053 (Proposed until Morgan approves this spec).

## Problem

Morgan, starting the M2a test town: "There is nothing I can actively just do", pointing at DragonScape Idle. On the forms he wanted "something at every check-in", a board to pick from, "sending people off on trips and seeing what they bring", collecting and upgrading, and lots to look at. It must not become "endless tapping", "a pushy mobile-game feel (pop-ups, nagging)" or "annoyingly slow progress". Today a check-in offers only build, upgrade, method and pin choices, and between steps there is often nothing to decide.

## Terms

- **Tick:** one game hour, 15 s real (D-036). 240 ticks are a real hour, 24 a game day.
- **Check-in:** Morgan opening the app. The soak models one as the first 20 ticks of each 240-tick hour (`scripts/soak.ts`, pass 2).
- **Hamlet, Village:** Hall tiers 1 and 2. Their **catch-up caps** (the most ticks one absence catches up, D-018) are 1,920 and 3,840 ticks (`content.hall.tiers[].catchUpCap`). A **store cap** is the most of a resource the stores hold (`capsOf`); base caps are food, wood and stone 200, ore 100, tools 50.
- **Value:** amount × the resource's `value` (D-053), used only to size swaps and rewards.
- **Soak passes:** pass 1 is a random bot over 10,000 ticks that checks invariants and replays; pass 2 is a scripted player checking in hourly, which must reach the Village in 1,440 to 2,400 ticks (the band); pass 3 is a hungry night.
- **Rules 1 to 5** are the engine's existing per-tick rules (`packages/sim/src/step.ts`); this spec adds rule 6, the board.

## Goals

- A **board** section on the Town tab holds three kinds of card: goals, trader offers and a forage trip.
- **Goals:** three on offer; the player picks one; its progress shows; finishing it pays goods worth about a real hour of the town's work, split across the stores that have room; then three new goals are drawn.
- **Trader:** a new swap offer every 240 ticks, at most 3 waiting, each lasting longer than the catch-up cap in force (D-018), also after the Hall grows. Accepting takes the goods at once; the payment arrives 24 ticks later. Declining costs nothing.
- **Forage trip:** the player sends 2 residents of their choice for 24 ticks; they leave their jobs (free residents may take the open slots); they come back with a random mix of goods.
- **Pins:** a pin label by each pinned resident's name and a Pinned filter on the People tab.
- **Measured test:** on soak pass 2, every check-in after the first has a real choice, judged at the check-in's first tick (`tick % 240 == 0`), before the player acts: an offer the town can pay for, a goal to pick, or a build or upgrade the town can pay for. A trip alone does not count (it is always there). The first check-in (tick 0) is excluded because it is judged before the first goals and offer are drawn. The board's own share is printed too.

## Non-goals

- No gold, prices or caravans (M3, D-027). No energy or tap-for-reward actions (D-025 stays).
- No events with choices (right after M2e, D-040).
- No timers that punish absence: no card expires inside the catch-up cap in force; goals never expire.
- No notifications, pulsing badges, pop-ups or sounds.
- No town view, art or new buildings (M2b to M2d). No trip destinations: one, "the forest edge" (sites come with M3).

## Journeys and checks

The build starts from `56a08b1` (main after PR #17). Every named test is new or a new case, so it is missing or fails there; checks marked **guard** pass there and must keep passing. Tick numbers are `state.tick` after the step that did the work (`step` adds 1 last, `step.ts:45`): "at tick 24" means the step that starts with `tick` 24.

### J1 Three goals, pick one

- **Given** `newGame(1, content)`. **When** 1 tick runs. **Then** `board.goals` holds 3 distinct goal ids, each eligible (Design, rule 6c), and `board.active` is null. **Check:** `packages/sim/test/board.test.ts` "a new town is offered three goals".
- **When** `pickGoal` names one. **Then** `active` is that id and `progress` 0. An id not on offer is refused `unknown`; the active one again is refused `same`. **When** another of the three is picked. **Then** it becomes active and progress restarts at 0. **Check:** `board.test.ts` "picking a goal".

### J2 A goal pays when met

- **Given** an active `make` goal of 80 wood. **When** production makes 80 wood after the pick (`made` events from rule 5 only: rewards, deliveries and finds have their own events and do not count; `progress` stops at `amount`). **Then** in that tick the reward is paid (Design, "Paying a reward"), a `goalDone` event and the log line "Goal met: <name>. <amounts> added to the stores." are written, `active` is null and 3 new goals are offered. **Check:** `board.test.ts` "a make goal pays".
- **Given** active `building` (a finished building of the kind at that tier or higher; tier 0 does not count) and `residents` goals. **When** the condition holds after production. **Then** each pays as above. A goal on offer whose condition came true before it was picked pays in the tick it is picked. **Check:** `board.test.ts` "a building goal and a residents goal pay".
- **Given** a reward of value 1,200 and stores where only ore has room (40 of 100). **Then** 60 ore are added, the rest is lost, and the log line ends "(stores full: the rest was lost)". **Given** empty stores. **Then** the reward is split across all five resources, less than 15 value (the dearest unit) is left over, and the log line has no "(stores full" ending. **Check:** `board.test.ts` "a reward fills the stores with room".
- **Given** content. **Then** every goal with `hall` 1 has a reward value of 900 to 1,600 and every goal with `hall` 2 one of 1,800 to 2,800. **Check:** `packages/content/test/content.test.ts` new case "goal rewards are about an hour of work". The bands are the soak measurement (Design, Content), so this only guards against typos.

### J3 The trader comes every real hour

- **Given** `newGame(1, content)`. **Then** after `advance(…, 13)` one offer waits (drawn at tick 12); after 253 two; after 493 three; after 733 still three (none drawn while 3 wait), and `nextOfferTick` is 972. **Check:** `board.test.ts` "an offer an hour, three at most".
- **Then** each offer's `give` is one of the two resources with the most stock for their cap, its `get` one of the two with the least that is below 80% of its cap and is not `give`, and `get.amount = max(1, floor(give.amount × value(give) / value(get)))`. When no resource is below 80%, no offer is drawn that hour. **Check:** `board.test.ts` "an offer swaps plenty for short".
- **Then** an offer drawn at tick t at the Hamlet has `until` t + 2,160. When the Hall reaches the Village, every waiting offer's `until` becomes at least the upgrade tick + 3,840 + 240. At `until`, the offer is dropped and the log says "The trader moved on." **Check:** `board.test.ts` "an offer outlasts the catch-up cap".

### J4 Accept and decline

- **Given** an offer of 40 wood for 13 tools and 50 wood. **When** `acceptOffer` names it at tick t. **Then** wood is 10 at once, the offer is gone, and `board.deliveries` holds 13 tools at t + 24. At that tick tools rise by up to 13 (any excess a `lost` event), with the log line "The trader's 13 tools arrived." **Check:** `board.test.ts` "an accepted swap pays a day later".
- **Given** 30 wood. **Then** `acceptOffer` is refused `noStock`. **When** `declineOffer` names it. **Then** it is gone, stock is unchanged and nothing is logged. An id with no offer is refused `unknown` by both. **Check:** `board.test.ts` "a swap the town cannot pay; declining".

### J5 A forage trip

- **Given** seed 1's founders. **When** `sendTrip` names 2 residents at tick 30. **Then** both have `jobId` null and `assignJobs` places neither until tick 54. At the game day at tick 48 each counts the morale reason `trip` (0) in place of `idle` and gets no skill day; they still eat and count for beds. Sent at tick 24, the day at tick 24 counts `trip` and the day at 48 does not (the return comes first). **Check:** `board.test.ts` "a trip takes two from work" (both cases).
- **When** tick t + 24 runs. **Then** the finds (Design, rule 6b) go into stock up to the caps, the log says "<A> and <B> came back from the forest edge with <amounts>.", a `tripBack` event is written, and both have jobs again after that step (the return comes before rule 4's job pass). While they were out, free residents may have taken their slots (`jobs.ts:28-48`); on return they are placed like anyone else, without the +10 for their old job (`jobs.ts:39`), and their `workDays` restart at 0 (`jobs.ts:50`). A pinned member gets their pinned slot back if it is open. **Check:** `board.test.ts` "a trip brings back finds".
- **Then** `sendTrip` is refused `busy` while a trip is out, `unknown` for an id that is not a resident, and `range` unless it names exactly 2 distinct ids. **Check:** `board.test.ts` "trip refusals".
- **Given** a member leaves the town during the trip. **Then** their id is removed from `trip.residentIds` when they leave; the trip returns with the other, the log names only them, and the finds are drawn as usual. If both leave, `trip` becomes null and no finds are drawn. (With `leaveGapTicks` 672 against a 24-tick trip, both can only leave in a hand-built state; the test builds one.) **Check:** `board.test.ts` "a trip whose member left".

### J6 Same seed, same board; catch-up equals live play

- **Given** seed 1 and a script of board commands. **Then** stepping tick by tick and `advance` in chunks between commands give identical states (D-002). **Check:** `packages/sim/test/determinism.test.ts` new case "the board replays in chunks"; soak pass 1's replay with the new commands.
- Resident and building ids do not change: offers number from `board.nextOfferId`, not `nextId`. **Check:** existing `determinism.test.ts` and `growth.test.ts` pinned values (**guard**).

### J7 Saves carry the board

- **Given** a schema 3 save. **When** it loads. **Then** it is schema 4 with an empty board (`goals: []`, `active: null`, `progress: 0`, `offers: []`, `nextOfferId: 1`, `nextOfferTick: tick + 12`, `deliveries: []`, `trip: null`), and the next tick draws goals. **Check:** `apps/web/test/saves.test.ts` "a schema 3 town gains a board".
- **Given** a schema 4 save with an offer of an unknown resource, an active goal not in `goals`, a trip naming a missing resident, a resident on a trip with a job, or two offers sharing an id. **Then** it loads as damaged. **Check:** `saves.test.ts` "unsafe numbers are damaged" gains these cases (at the start commit a schema 4 save loads as `tooNew`, so they fail).

### J8 The board on screen (browser)

- **Given** seed 1 after 25 ticks, its board set to the goals `stockpile`, `quarry`, `twelve` (seeded with `townRecord` and `seedRecord`, `tests/browser/helpers.ts:13` and `:60`). **Then** the Town tab shows a section `data-testid="board"` headed "Board", after the Hall and before the work queue, with 3 `goal` cards each with a "Pick" button. **When** Pick is tapped on "Lay in timber". **Then** that card shows "0 of 80 wood" and the others show "Pick instead". **Check:** `tests/browser/board.spec.ts` "the board offers three goals" (S1).
- **Then** 1 `offer` card with "Accept" and "Decline". **Check:** `board.spec.ts` "the trader's offer" (S2). And a `trip` card with "Send two": `board.spec.ts` "sending a trip" below (S3).
- **When** "Send two" is tapped. **Then** a sheet lists every resident not on a trip as a toggle (`data-testid="trip-pick"`); "Send" is enabled at exactly 2; after it the card reads "<A> and <B> are out at the forest edge, <time> left" and the People tab shows both as "On a trip". **Check:** `board.spec.ts` "sending a trip".
- **Given** a pinned resident. **Then** the People row shows a `span.pin` reading "Pinned" after the name, and a chip `chip-pinned` ("Pinned"), shown while anyone is pinned, filters to pinned residents only. **Check:** `tests/browser/people.spec.ts` "pinned residents are labelled and filtered".
- At 412 px, light and dark, no sideways scroll. **Check:** screenshot in the PR (VER-06). Browser tests run locally, not in CI (D-013 style; `AGENTS.md`).

### J9 The M2e test (device check, Morgan)

- **Given** the build on the phone. **When** Morgan checks in over two days. **Then** every check-in offers at least one real choice, and he says whether he wants to keep playing. Recorded in HANDOFF in his words.

### J10 The soak proves a choice every check-in

- Pass 1's bot also sends `pickGoal`, `acceptOffer`, `declineOffer` and `sendTrip` (weight 2 each; ids from the board when it has any, else 0, which is refused; `sendTrip` names 2 random residents), and each is carried out at least once.
- Pass 2's scripted player, at each check-in, after its existing rules: picks the first goal on offer when none is active (in the sitting's first tick); accepts each offer it can pay whose `give` stock is above half its cap; sends a trip when none is out, of the 2 residents with the highest ids whose `pinnedTo` is null. Each check-in is judged at its first tick, before the player's commands. It prints `checkins=`, `no_choice=`, `board_choice=` (check-ins with a payable offer or a goal to pick), `goals_met=`, `offers_taken=`, `trips=` and `reward_lost=` (value lost: units lost from deliveries and finds × their value, plus a reward's value that found no room). It fails if `no_choice` > 0 after the first check-in, from S1 on (S1 counts goals and builds; S2 adds offers). Counters a slice has not fed yet print 0. The soak writes its own board invariant checks, as it does for the rest of the state (`scripts/soak.ts` `check`); it does not import `apps/web`.
- Pass 2's band (1,440 to 2,400 ticks) still holds (**guard**: it passes now; the board's goods may move it). The lever is `rules.rewardPct` (every goal reward × rewardPct / 100, default 100): if the band fails, the slice measures the Village tick at 100, 75 and 50, reports all three to Morgan and keeps 100 until he picks.
- **Check:** `npm run soak`.

## Decisions

- **D-049 (Proposed)** Goal condition types: `make` (resource, amount, counted from the pick), `building` (kind, tier), `residents` (count). One effect type: `reward`, a value split across the stores that have room.
- **D-050 (Proposed)** The trader's swap: plenty for short by stock / cap, `get` only below 80% of its cap, sized at 20% of the `give` resource's base cap, paid value for value; payment 24 ticks later; an offer lasts the catch-up cap + 240 ticks and is stretched when the Hall grows.
- **D-051 (Proposed)** Forage trips: 2 residents the player chooses, 24 ticks, one trip at a time, 3 finds from a content table; morale counts `trip` 0 while out.
- **D-052 (Proposed)** Goods that do not fit when a reward, delivery or trip lands are lost and logged. Nothing waits to be collected (D-025: no Collect tap).
- **D-053 (Proposed)** Each resource has a whole-number `value` (food 4, wood 5, stone 5, ore 7, tools 15). It is not a price and is never shown.
- Content version 3 becomes 4; save schema 3 becomes 4 (GAME-05). First offer at tick 12, inside a new town's first 20-tick sitting (default chosen here).
- `make` goals can be offered again after another goal (they are things to do, not milestones); `building` and `residents` goals cannot, because a met one is never eligible. At the Village, unmet Hamlet goals stay eligible.

## Alternatives rejected

- **Gold now** (Morgan's note "gold would be nice to have"): rejected by Morgan on the final page; gold needs something to buy (M3, D-027).
- **A Claim button for met goals and arrived payments**: the Collect tap D-025 bans. It would fail at the first check-in with three things to claim and nothing to decide.
- **A fixed bundle per goal, the overflow lost** (this spec's first draft): simpler to read on the card, but by hour 7 of the soak every store except ore is full, so most bundles would vanish (critic finding). It would fail Morgan's "annoyingly slow progress" the first time a goal pays nothing. **Escalated** to Morgan with the rule below.
- **Rewards wait in an outbox until there is room**: the claim tap with a delay, with its own cap and save rules. It fails when stores stay full for hours.
- **Reward = the goods made in the last 240 ticks**: needs a rolling production record, and pays a town recovering from hunger nothing.
- **Non-goods rewards (a store cap rise, a free resident)**: avoids full stores, but a cap rise competes with the Storehouse and a resident needs a bed. Possible later; not in D-040's answer ("a bundle of goods").
- **The trader ranks by plain stock**: offers ore for food when ore is short only because its cap is 100. Stock / cap compares like with like.
- **The game picks the 2 trip residents**: one tap fewer, but then the only choice is "send or not", with no trade-off against jobs.
- **Goals expire; several trips at once**: no punishing timers; with 8 founders two trips would empty the Forager's hut.
- **One timed-payment queue for deliveries and trips**: less save code, but a trip also holds residents and draws finds on return; two plain shapes read better (critic finding, declined).

## Risks

- **Full stores.** Measured on soak pass 2 (seed 1, hourly check-ins, 2026-11-15): by hour 7 food, wood, stone and tools are at 100% of their caps. → Rewards are split across the stores that have room; the trader pays only in goods below 80%; `make` goals are offered only when the goods fit (rule 6c). With full stores and the one-off goals met, the board may offer fewer than 3 goals, or none ("No goals until the town grows"); then the check-in's choices are building and upgrading, which J10 counts. If deliveries or finds fill a store under a picked `make` goal, its production stops and the card says "Stores full: use some <resource> to go on". `reward_lost` is printed; if it passes 500 value in pass 2, the slice reports it and changes no number.
- **The scripted player may reach the Village faster** once it takes goals and offers (a goal pays about an hour of work, so income may rise by half or more; estimate). → J10 keeps the band, with `rewardPct` as the lever Morgan picks (D-036's pace is his).
- **A check-in with an active goal, no payable offer and nothing to build** has no choice by J10's count. If `no_choice` > 0, the slice reports which check-ins and why before changing any number.
- **Values are a hidden price list.** They decide every swap. → Starting values (D-030 style), derived from production rates (Design); J9 judges them. J2's bands use the same values, so they only catch typos.
- **Numbering.** PR #16 (open) also writes a D-041 beside the art's D-041. These entries start at D-049; whichever PR merges second renumbers its entries.
- **Soak speed.** Pass 1 needs 20,000 ticks per second (`scripts/soak.ts`; 167,700 measured on 2026-11-15 at `56a08b1`). The board adds a few checks a tick; S1 records the new figure.

## Design

### Content (`packages/content/src/index.ts`, `packages/sim/src/types.ts`)

- `version: 4`. Resources gain `value` (D-053). Where they come from: a worker's basic rate per production cycle is food 50, wood 40, stone 40, ore 30 hundredths of a unit, so value ≈ 200 / rate (food 4, wood 5, stone 5, ore 6.7 → 7); a forged tool (`forge`: 25 tools from 25 ore and 10 wood per worker) costs 1 ore (7), 0.4 wood (2) and 8 of work, about 17, rounded down to 15 because the free `mend` method also makes tools.
- `goals: Goal[]`, `Goal = { id: string; name: string; hall: number; when: GoalWhen; reward: number }`, `GoalWhen = { type: 'make'; resource: string; amount: number } | { type: 'building'; kind: string; tier: number } | { type: 'residents'; count: number }`. `reward` is a value. The hour of work was measured on soak pass 2's town (seed 1) with these values: 941 to 1,999 an hour at the Hamlet (hours 1 to 7), 2,113 to 2,453 at the Village (hours 8 to 10). Starting list (D-030):

  | id | name | hall | when | reward |
  | --- | --- | --- | --- | --- |
  | `stockpile` | Lay in timber | 1 | make 80 wood | 1,000 |
  | `quarry` | Open the quarry | 1 | building mine 1 | 1,200 |
  | `forge` | Light the forge | 1 | building workshop 1 | 1,300 |
  | `harvest` | A good harvest | 1 | make 120 food | 1,100 |
  | `twelve` | Twelve hearths | 1 | residents 12 | 1,200 |
  | `snug` | Snug cottages | 1 | building cottage 2 | 1,200 |
  | `toolmaker` | A store of tools | 2 | make 30 tools | 2,000 |
  | `deepmine` | Deeper shafts | 2 | building mine 2 | 2,200 |
  | `thirty` | Thirty souls | 2 | residents 30 | 2,100 |
  | `fields` | Fields to the river | 2 | building farm 2 | 2,200 |
  | `stores` | Full granaries | 2 | building storehouse 1 | 2,000 |
  | `stoneworks` | Stone for the Village | 2 | make 120 stone | 2,300 |

- `trips: { size: number; ticks: number; draws: number; finds: { resource: string; min: number; max: number }[] }` = size 2, ticks 24, draws 3, finds food 15 to 30, wood 10 to 25, stone 8 to 20, ore 6 to 15, tools 2 to 6. Mean value 229 (computed 2026-11-15), about a fifth of an hour of the town's work.
- `rules` gain `rewardPct: 100`, `goalsOffered: 3`, `offerEveryTicks: 240`, `offersMax: 3`, `firstOfferTick: 12`, `deliveryTicks: 24`, `tradeSharePct: 20`, `tradeGetBelowPct: 80`, `offerExtraTicks: 240`.
- `validateContent` gains: goal ids unique; `hall` a Hall tier; the resource or kind exists; a `building` tier exists for the kind; `amount`, `count` and `reward` positive; a `make` amount at most the base cap; at least `goalsOffered` goals with `hall` 1; trip finds name known resources with 1 ≤ min ≤ max; `size`, `ticks`, `draws` positive; every resource has a positive `value`.

### State (`packages/sim/src/types.ts`)

```ts
type Offer = { id: number; give: { resource: string; amount: number }; get: { resource: string; amount: number }; until: number };
type Delivery = { resource: string; amount: number; at: number };
type Trip = { residentIds: number[]; back: number };
type Board = {
  goals: string[]; // on offer; [] until drawn
  active: string | null; // one of `goals`
  progress: number; // `make`: units made since the pick; 0 otherwise
  offers: Offer[]; // at most offersMax, oldest first
  nextOfferId: number; // offers number apart from nextId, so resident and building ids stay as they are
  nextOfferTick: number;
  deliveries: Delivery[]; // oldest first
  trip: Trip | null;
};
```

`State` gains `board: Board`. `StreamName` gains `'goals' | 'trader' | 'trips'`. `Reason` is unchanged (`busy`, `range`, `same`, `unknown`, `noStock` cover the new commands). `draft` copies `board`, its arrays and `trip.residentIds`. All of this, the new event types, every new rule, `Content.trips` and the trips data land in S1 (types and data only), so S1's save check is the whole board's; S2 and S3 add the rules that use them and their test cases.

### Commands (`packages/sim/src/board.ts`, new; `refusal` and `carryOut` in `build.ts` call into it)

- `{ type: 'pickGoal'; id: string }`: `unknown` if not in `goals`; `same` if active. Sets `active`, `progress` 0.
- `{ type: 'acceptOffer'; id: number }`: `unknown` if no such offer; `noStock` if stock < `give.amount`. Pays `give`, pushes a delivery at `tick + deliveryTicks`, removes the offer, logs "Sent <give> to the trader."
- `{ type: 'declineOffer'; id: number }`: `unknown` if no such offer. Removes it. Nothing is logged.
- Goods that do not fit from a delivery or trip are one `lost` event per resource, in content order.
- `{ type: 'sendTrip'; residentIds: number[] }`: `busy` if a trip is out; `range` unless exactly `trips.size` distinct ids; `unknown` if one is not a resident. Sets `trip` with `back = tick + trips.ticks`, each named resident's `jobId` null (`pinnedTo` kept), `jobsDirty` true. A `pin` command on a resident on a trip is allowed and takes effect on return.
- Events gain `goalDone { id; paid: Amounts }`, `delivered { resource; amount }`, `tripBack { finds: Amounts }`, `offerGone { id }`. Each writes the log line in J2 to J5. None is a `made` event, so none moves a `make` goal. Goods that do not fit are `lost` events (as `cancelJob` does, `build.ts:162`), not `capLost`. `fold` adds the goods each of `goalDone.paid`, `delivered` and `tripBack.finds` put into stock (after caps) to `summary.made`, so the away card counts them; S1 adds all three cases.
- Log amounts use a new sim helper `amountsLine(amounts, content)` in `util.ts`, the same format as the web's `amountsText` ("40 wood, 5 tools", content order); the web keeps its own.

### Rule 6, the board (`board.ts`), in two places in `step`

**6a, after `construct` and before the start of a game day** (so returns rejoin rule 4's job pass in the same step):

1. **Deliveries:** pay each delivery with `at ≤ tick`, oldest first.
2. **Trip (6b):** at `tick ≥ back`: for each of `draws` in turn, `i = draw('trips', finds.length)` (a value 0 to n − 1), then `amount = min + draw('trips', max − min + 1)`; add the finds (same resource adds), pay up to caps, log, `tripBack`, `trip` null, `jobsDirty` true. Members who left are left out of the names.
3. **Offers:** drop offers with `until ≤ tick` (log "The trader moved on.", `offerGone`). If `tick ≥ nextOfferTick`: if fewer than `offersMax` wait, draw one; then `nextOfferTick += offerEveryTicks`, whether or not an offer was drawn (a missed hour is not made up).
4. **Drawing an offer** (`trader` stream): rank resources by `floor(stock × 1000 / cap)` with `capsOf`'s caps, ties in content order. `give` = the top 2's entry at `draw('trader', 2)` (0 the higher, 1 the second); if its stock is 0, no offer. Then `get`: the candidates are the resources other than `give` below `tradeGetBelowPct`% of their cap, lowest rank first; none → no offer; one → it, with no draw; else the entry at `draw('trader', 2)` of the lowest 2. `give.amount = min(baseCap × tradeSharePct / 100, stock)` (at most 40 food, wood or stone; 20 ore; 10 tools), so an offer can be paid when it is drawn; stock may fall before the player sees it (Accept then shows what is missing). `get.amount` as in J3. `until = tick + catchUpCap + offerExtraTicks`. `id = nextOfferId++`.

**6c, after production** (it reads this tick's `made` events):

1. **Progress:** for an active `make` goal, add this tick's `made` amounts of its resource.
2. **Check:** if the active goal holds, pay its reward, log, `goalDone`, `active` null, `goals` [].
3. **Draw:** if `goals` is empty, list the eligible goals in content order: `hall` ≤ the Hall's tier; not the goal met this tick; `building` and `residents` goals not already holding; `make` goals only if stock + amount ≤ the store cap. Shuffle (Fisher–Yates): for i from length − 1 down to 1, `j = draw('goals', i + 1)` (0 to i), swap entries i and j; a list of 0 or 1 makes no draw. Take the first `goalsOffered`. Nothing eligible: `goals` stays [] and no draw is made; the card reads "No goals until the town grows".

**Hall upgrade** (the `village` event in `construct`, which runs before 6a, so the stretch comes before that tick's expiry check): every waiting offer's `until` becomes `max(until, tick + newCatchUpCap + offerExtraTicks)`.

**Paying a reward of value V** (`V = goal.reward × rewardPct / 100`, floored): the resources with room, in content order. Up to 3 rounds; each round reads room once at its start: `share = floor(V / k)` for the k resources with room; each gets `n = min(room, floor(share / value))` units, and V drops by `n × value`. Stop after 3 rounds, when no resource has room, or when `share` is below the smallest value among those with room. What is left is dropped. The log lists only resources paid more than 0, and ends "(stores full: the rest was lost)" when V left is 15 or more; any leftover of 15 or more counts in `reward_lost` (less is rounding). No `lost` event (no units were made). `rewardPreview(state, goalId, content)` runs the same split on the current stock, for the card.

**Rules 3 and 4:** `assignJobs` skips residents in `board.trip`. When `startDay` removes a leaver, it also removes their id from `board.trip.residentIds`; an empty trip becomes null. `startDay` gives them the reason `{ id: 'trip', amount: 0 }` in place of `idle` and no skill day. `newGame` sets the empty board with `nextOfferTick: rules.firstOfferTick`.

`board.ts` also exports `goalProgress(state, content): { have: number; need: number } | null` and `rewardPreview`, both re-exported from `packages/sim/src/index.ts` for the screens (GAME-02).

### Saves (`apps/web/src/saves.ts`)

- `SCHEMA = 4`; the 3 → 4 step adds the empty board (J7) with `nextOfferTick: state.tick + rules.firstOfferTick`.
- `shapeOk` checks: goals known, distinct, at most `goalsOffered`; `active` null or in `goals`; `progress` whole, at most a `make` goal's amount and 0 otherwise; offers at most `offersMax`, ids distinct and below `nextOfferId`, resources known, amounts whole and positive, `until` whole; deliveries' resources known, amounts and `at` whole; `trip` null or 1 to `trips.size` distinct ids of residents in the record (a leaver's id is removed, J5) with `back` whole, and none of them with a `jobId` (a pair rule, as LESSONS 2026-11-10 asks).

### Web

- `apps/web/src/ui/Board.tsx` (new), placed in `TownTab.tsx` after `HallRow` and before "Work queue": `h2.sec` "Board" and `data-testid="board"`; cards `data-testid="goal"`, `"offer"`, `"delivery"` (one line per delivery under way: "<amount> <resource> on the way, <time> left"), `"trip"`.
- Goal card: name; condition ("Make 80 wood"; "Build a Mine" for tier 1; "A Cottage at tier 2"; "12 residents"); "Worth about <rewardPreview amounts>"; "Pick" (`btn`) or, when another is active, "Pick instead" (`btn second`). The active card shows `goalProgress` ("12 of 80 wood", "8 of 12 residents"; a building goal shows "Not yet" or nothing) and no button.
- Offer card: "The trader offers <get> for <give>", "Leaves in <duration>", Accept (`btn` when `refusal` passes, else `btn second` with "Needs <shortfall>" as the Upgrade row does) and Decline (`btn second`).
- Trip card: "Send two to the forest edge for a day" and "Send two", which opens `TripSheet.tsx` (new, on `Sheet.tsx`): one toggle per resident not on a trip, showing name, trade and top skill; "Send" enabled at exactly 2. While out: "<A> and <B> are out at the forest edge, <time> left".
- `PeopleTab.tsx`: `span.pin` "Pinned" after the name, in place of the trailing " · Pinned"; chip `chip-pinned` shown while anyone is pinned; a resident on a trip reads "On a trip" in place of a trade and is not counted in "with no work" or the No work chip.
- `docs/UI_STYLE.md` tokens only; buttons at least 44 px.

### Soak (`scripts/soak.ts`)

As J10. `TYPES`, `WEIGHTS` and the `carried` gate gain each new command in the slice that adds it. `check` gains the board invariants of `shapeOk`. A check-in has a choice when, before the player acts, an offer waits that `refusal` passes for `acceptOffer`, or no goal is active and `goals` is not empty, or a `build` of some kind or an `upgrade` of some building (or the Hall) passes `refusal`.

## Slices

A mock-up of the board, the trip sheet and the People row (`mockups/board.html`, `ui-mockups` skill) is approved by Morgan before S1's code. If Morgan asks for changes, the mock-up and this spec change together before S1.

### S1 Goals

- **Morgan tries:** open the Town tab; pick one of three goals; watch its progress; when it is met, the stores rise and three new goals appear.
- **Checks that fail now:** J1, J2, J6, J7 (all its cases: S1 builds the whole board check), J8 "the board offers three goals", J10 (`goals_met` > 0, `pickGoal` carried out, `no_choice` gate).
- **Files:** `packages/sim/src/{types,util,step,newGame,summary,validate,build,index}.ts` and new `board.ts`: the whole `Board` state and types, `pickGoal`, rule 6c, `amountsLine`, `goalProgress`, `rewardPreview`. `packages/content/src/index.ts`: `version`, `value`, `goals`, all the new `rules`. `apps/web/src/saves.ts`: schema 4 and the whole board shape check. `apps/web/src/ui/Board.tsx`, `TownTab.tsx`, `app.css`. The away card and log need no change: log lines are plain text and `fold` puts paid goods in `made`. Tests: `packages/sim/test/board.test.ts`, `packages/content/test/content.test.ts`, `apps/web/test/saves.test.ts`, `packages/sim/test/determinism.test.ts`, `tests/browser/board.spec.ts`. `scripts/soak.ts`.
- **Waits on:** the mock-up.

### S2 The trader

- **Morgan tries:** an offer waits at the first sitting; accept it, and the payment arrives a game day later; decline another.
- **Checks that fail now:** J3, J4, J8 "the trader's offer", J10 (`offers_taken` > 0, accept and decline carried out).
- **Files:** `board.ts` (6a steps 1, 3, 4; the Hall stretch; accept and decline), `build.ts`, `Board.tsx`, tests (`board.test.ts`, `determinism.test.ts` with accept and decline in its script, `board.spec.ts`), soak.
- **Waits on:** S1.

### S3 Trips and pins

- **Morgan tries:** send two residents to the forest edge; see them "On a trip" on the People tab; a game day later read what they found. Pin someone and filter by Pinned.
- **Checks that fail now:** J5, J8 "sending a trip" and the pin case, J10 (`trips` > 0, `sendTrip` carried out).
- **Files:** `board.ts` (6a step 2, `sendTrip`), `build.ts`, `jobs.ts`, `day.ts` (the `trip` reason, pruning leavers), `determinism.test.ts` (a trip in its script), `Board.tsx`, new `TripSheet.tsx`, `PeopleTab.tsx`, `apps/web/src/ui/people.ts` if the trade text lives there, tests, soak.
- **Waits on:** S2. S1 to S3 ship in one PR, so J9 tests all three.

## Verification

- Every push: `npm run check`.
- Before ready: `npm run test:browser`.
- End to end: J9 on Morgan's phone after merge and deploy.

## Open questions

- Escalated to Morgan on the approval page: rewards as a value split across the stores with room (recommended) or a fixed bundle that may be lost; the player choosing the 2 trip residents; what to do if goals speed up the pace (`rewardPct`); the starting values (D-053).
