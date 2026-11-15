# M2e Choices

- **Status:** Draft
- **Planned in:** round 1 (https://claude.ai/artifact/HdpkiWhhZkeEPV2FLgAFKg, `play1`), review and round 2 (https://claude.ai/artifact/2zZSib54mLApaC8wtUfJXG, `play2`), final (https://claude.ai/artifact/FJuq2TKb8gmPAfcEbdymhQ, `playfinal`), all 2026-11-14. **Decisions:** D-040; new entries D-049 to D-053 (Proposed until Morgan approves this spec).

## Problem

Morgan, starting the M2a test town: "There is nothing I can actively just do", pointing at DragonScape Idle. On the forms he wanted "something at every check-in", a board to pick from, "sending people off on trips and seeing what they bring", collecting and upgrading, and lots to look at. It must not become "endless tapping", "a pushy mobile-game feel (pop-ups, nagging)" or "annoyingly slow progress". Today a check-in has only build, upgrade, method and pin choices, and between Village steps there is often nothing to decide.

## Goals

- A **board** panel on the Town tab holds three kinds of card: goals, trader offers and a forage trip.
- **Goals:** three on offer; the player picks one; its progress shows; finishing pays a bundle of goods worth about a real hour of the town's work; then three new goals are drawn.
- **Trader:** a new swap offer every 240 ticks (one real hour), at most 3 waiting, each lasting longer than the catch-up cap in force (D-018). Accepting takes the goods at once; the payment arrives 24 ticks (a game day) later. Declining costs nothing.
- **Forage trip:** send 2 residents for 24 ticks; their jobs stand empty; they come back with a random mix of goods.
- **Pins:** a pin label by each pinned resident's name and a Pinned filter on the People tab.
- **Measured test:** on the soak's scripted player (pass 2), every hourly check-in after the first has at least one real choice on the board: an offer the town can pay for, or a goal to pick. Morgan's device test (J9) is the judge of fun.

## Non-goals

- No gold, prices or caravans (M3, D-027). No energy or tap-for-reward actions (D-025 stays).
- No events with choices (right after M2e, D-040).
- No timers that punish absence: no card expires inside the catch-up cap; goals never expire.
- No notifications, badges that pulse, pop-ups or sounds. The board is read when the player opens the Town tab.
- No town view, art or new buildings (M2b to M2d).
- No choice of where a trip goes: one destination, "the forest edge". Sites come with M3 (D-043, D-044).

## Journeys and checks

The build starts from `56a08b1` (main after PR #17). Every check fails there unless marked a guard. "Value" means the sum of amount × the resource's `value` (Design, Content).

### J1 Three goals, pick one

- **Given** `newGame(1, content)`. **When** one tick runs. **Then** `state.board.goals` holds 3 distinct goal ids, each one the town has not yet met, and `state.board.active` is null. **Check:** `packages/sim/test/board.test.ts` "a new town is offered three goals".
- **When** `pickGoal` names one of them. **Then** `active` is that id and `progress` is 0; `pickGoal` with an id not on offer is refused `unknown`; picking the active one again is refused `same`. **Check:** `board.test.ts` "picking a goal".
- **When** another of the three is picked. **Then** it becomes active and progress restarts at 0. **Check:** the same test.

### J2 A goal pays when met

- **Given** an active `make` goal of 60 wood. **When** the town makes 60 wood (from `made` events after the pick). **Then** in that tick the reward is added to stock up to the caps, any excess counted in a `lost` event, a `goalDone` event and a log line "Goal met: <name>. <reward text> added to the stores." are written, `active` is null and 3 new goals are offered (not the one just met). **Check:** `board.test.ts` "a make goal pays its bundle".
- **Given** active `building` and `residents` goals. **When** the condition holds at the end of a tick. **Then** each pays as above. **Check:** `board.test.ts` "a building goal and a residents goal pay".
- **Given** full stores. **When** a goal pays. **Then** stock stays at the caps and the log line ends "(<n> lost to full stores)". **Check:** `board.test.ts` "a reward into full stores".
- **Given** content. **Then** every Hamlet goal's reward value is 900 to 1,600 and every Village goal's 1,800 to 2,800 (an hour of work measured on the soak, Design). **Check:** `packages/content/test/content.test.ts` "goal rewards are about an hour of work" (new file; `vitest.config.ts` already includes `packages/*/test/**`).

### J3 The trader comes every real hour

- **Given** `newGame(1, content)`. **When** 24 ticks run. **Then** one offer waits; at tick 264 a second; at 504 a third; at 744 still three (none drawn while 3 wait). **Check:** `board.test.ts` "an offer an hour, three at most".
- **Then** each offer gives the town a resource it holds least of (by stock / cap) for one it holds most of, never the same resource, with `get.amount = floor(give.amount × value(give) / value(get))`, at least 1. **Check:** `board.test.ts` "an offer swaps plenty for short".
- **Then** an offer drawn at tick t at the Hamlet lasts until t + 1,920 + 240 = t + 2,160, longer than the Hamlet's cap, and at the Village until t + 3,840 + 240. Past it, the offer is gone and the log says "The trader moved on." **Check:** `board.test.ts` "an offer outlasts the catch-up cap".

### J4 Accept and decline

- **Given** an offer of 40 wood for 13 tools and 50 wood in stock. **When** `acceptOffer` names it. **Then** stock wood is 10 at once, the offer is gone, `state.board.deliveries` holds 13 tools due 24 ticks later; at that tick tools rise by 13 (up to the cap), with a log line "The trader's 13 tools arrived." **Check:** `board.test.ts` "an accepted swap pays a day later".
- **Given** 30 wood. **Then** `acceptOffer` is refused `noStock`. **When** `declineOffer` names it. **Then** it is gone and stock is unchanged. **Check:** `board.test.ts` "a swap the town cannot pay; declining".

### J5 A forage trip

- **Given** seed 1's founders. **When** `sendTrip` names 2 residents. **Then** both have `jobId` null and do not work until they return 24 ticks later; `assignJobs` places neither. Morale counts a `trip` reason of 0 for them, not `idle`. **Check:** `board.test.ts` "a trip takes two from work".
- **When** the trip returns. **Then** stock rises by the finds (3 draws from the `trips` stream, Design), up to the caps, with a log line "<A> and <B> came back from the forest edge with <finds>." Both rejoin jobs that tick. **Check:** `board.test.ts` "a trip brings back finds".
- **Then** `sendTrip` is refused `busy` while a trip is out, `tooFew` with other than 2 distinct living residents, and `unknown` for an id that is not a resident. **Check:** `board.test.ts` "trip refusals".
- **Given** a resident on a trip leaves the town (morale). **Then** the trip returns with the other alone and the finds unchanged. **Check:** `board.test.ts` "a trip whose member left".

### J6 Same seed, same board; catch-up equals live play

- **Given** seed 1 and a script of board commands. **Then** stepping tick by tick and `advance` in chunks between commands give identical states (D-002). **Check:** `packages/sim/test/determinism.test.ts` "the board replays in chunks"; the soak's pass 1 replay with the new commands in the bot.

### J7 Saves carry the board

- **Given** a schema 3 save. **When** it loads. **Then** it upgrades to schema 4 with an empty board (`goals: []`, `active: null`, `progress: 0`, `offers: []`, `deliveries: []`, `trip: null`, `nextOfferTick: tick + 24`); the first tick then draws goals. **Check:** `apps/web/test/saves.test.ts` "a schema 3 town gains a board".
- **Given** a schema 4 save with an offer for an unknown resource, an active goal not on offer, a trip naming a missing resident, or two offers sharing an id. **Then** it loads as damaged. **Check:** `saves.test.ts` "unsafe numbers are damaged" gains these cases.

### J8 The board on screen (browser)

- **Given** seed 1 at tick 24. **Then** the Town tab shows a "Board" section after the Hall and before the work queue, with 3 goal cards each with a "Pick" button, one trader card with "Accept" and "Decline", and a trip card with "Send two". **When** Pick is tapped. **Then** that card shows its progress ("12 of 60 wood") and the others show "Pick instead". **Check:** `tests/browser/board.spec.ts` "the board offers goals, a trade and a trip".
- **When** "Send two" is tapped. **Then** a sheet lists the residents with no trip; choosing two and "Send" closes it; the trip card reads "Out at the forest edge, <time> left"; the People tab shows both as "On a trip". **Check:** `board.spec.ts` "sending a trip".
- **Given** a pinned resident. **Then** the People row shows a pin label by the name and a "Pinned" chip filters to pinned residents only. **Check:** `tests/browser/people.spec.ts` "pinned residents are labelled and filtered".
- At 412 px, light and dark, the board fits with no sideways scroll. **Check:** screenshot in the PR (VER-06).

### J9 The M2e test (device check, Morgan)

- **Given** the build on the phone. **When** Morgan checks in over two days. **Then** every check-in offers at least one real choice, and he says whether he wants to keep playing. Recorded in HANDOFF in his words.

### J10 The soak proves a choice every check-in

- **Given** the soak. **Then** pass 1's bot also sends `pickGoal`, `acceptOffer`, `declineOffer` and `sendTrip`, each carried out at least once. Pass 2's scripted player picks the first goal on offer when none is active and accepts any offer it can pay whose `give` resource is above half its cap; it prints `checkins=`, `no_choice=`, `goals_met=`, `offers_taken=`, `trips=` and fails if `no_choice` > 0 after the first check-in. Pass 2's Village band (1,440 to 2,400 ticks) still holds. **Check:** `npm run soak`.

## Decisions

- The board's rules, counts and condition types as below (D-040; this spec).
- **D-049 (Proposed)** Goal condition types: `make` (resource, amount, counted from the pick), `building` (kind, tier), `residents` (count). Effect: `reward` adds goods up to the caps.
- **D-050 (Proposed)** The trader's swap: plenty for short by stock / cap, sized at `tradeSharePct` of the give resource's base cap, paid value for value by the content's `value` table; payment 24 ticks later; offers last catch-up cap + 240 ticks.
- **D-051 (Proposed)** Forage trips: 2 residents the player chooses, 24 ticks, one trip at a time, 3 finds drawn from a content table; morale counts `trip` 0 while out.
- **D-052 (Proposed)** Goods that do not fit the stores when a reward, delivery or trip lands are lost and the log says how many. Nothing waits to be collected (D-025: no Collect tap).
- **D-053 (Proposed)** Each resource gets a whole-number `value` (food 4, wood 5, stone 5, ore 7, tools 15), used only to size swaps and to check reward bundles. It is not a price and is never shown.
- Content version 3 becomes 4; save schema 3 becomes 4 (GAME-05).
- The first offer comes at tick 24, so a new town sees one in its first sitting (default chosen here; the rule is "every 240 ticks" from then).

## Alternatives rejected

- **Gold now** (round 2, Morgan's note "gold would be nice to have"): rejected by Morgan on the final page; gold needs something to buy (M3, D-027).
- **A Claim button for finished goals and arrived payments**: rejected because a tap that only pays is the Collect tap D-025 bans. It would fail at the first check-in with three things to claim and nothing to decide.
- **Rewards and deliveries wait in an outbox until there is room**: rejected because it is the same claim tap with a delay, and the outbox needs its own cap and save rules. It would fail when stores are full for hours (measured: by hour 7 of the soak every store but ore is full), and the outbox fills.
- **Reward = the goods the town made in the last 240 ticks**: scales itself, but needs a rolling production record in the save and pays a starving town nothing. It would fail on a town that just recovered from a hungry night, which needs the bundle most.
- **The trader picks residents' surplus at random, not by stock / cap**: rejected because an offer for a good the town is short of to give away is not a choice anyone takes. It would fail D-040's "paying in a good the town is short of".
- **The game picks the 2 trip residents** (for example the 2 idlest): one tap fewer, but then the only choice is "send or not" and there is no trade-off against jobs. It would fail Morgan's "make choices".
- **Goals expire after a while**: rejected; a goal waits as long as needed (no punishing timers; D-018 only allows deadlines longer than the cap, and nothing is gained by one here).
- **Several trips at once**: rejected for this step; with 8 founders two trips would empty the Forager's hut. It may come with guild quests (M3).

## Risks

- **Full stores swallow rewards.** Measured on the soak (seed 1, hourly check-ins): by hour 7 food, wood, stone and tools are all at 100% of their caps. A goal paying 60 stone into a full store pays nothing. → Rewards and finds are bundles across several goods; trader payments are, by rule, in the good the town has least of; the log names what was lost (D-052). The goal card shows the reward before it is picked, and Morgan judges it in J9. If the soak's `lost` grows past 100 units in pass 2 because of rewards, the slice reports it and does not retune silently.
- **The scripted player may reach the Village faster** once it takes goals and offers, leaving the 6 to 10 hour band. → J10 keeps the band; if it fails, the slice stops and reports the measured tick to Morgan (D-036's pace is his).
- **A check-in with no affordable offer and an active goal has only a trip to offer.** J10 counts a trip as no choice on purpose; if `no_choice` > 0, the slice reports which check-ins and why before changing any number.
- **Values are a hidden price list.** They decide every swap; a bad value makes one swap always right. → They are starting values (D-030 style), set from production rates (Design), and judged in J9.
- **PR #16 also proposes a D-041.** These entries start at D-049, after the art's D-048; if PR #16 merges first and renumbers to D-049, these move up by one in the same change.
- **More state per tick slows the soak.** Pass 1 needs 20,000 ticks per second (`scripts/soak.ts`). The board adds a few checks a tick; measured in S1.

## Design

### Content (`packages/content/src/index.ts`, `packages/sim/src/types.ts`)

- `version: 4`.
- `resources[].value`: food 4, wood 5, stone 5, ore 7, tools 15. Where they come from (D-053): a worker's basic rate per cycle is food 50, wood 40, stone 40, ore 30 hundredths, so value ≈ 200 / rate, rounded (food 4, wood 5, stone 5, ore 6.7 → 7); a forged tool takes 1 ore (7), 0.4 wood (2) and a worker's share (8 at 25 a cycle), about 17, rounded down to 15 because tools also come from Mend.
- `goals: Goal[]`, 12 entries (6 offered from the Hamlet, 6 from the Village). `Goal = { id; name; hall: number; when: GoalWhen; reward: Amounts }`, `GoalWhen = { type: 'make'; resource; amount } | { type: 'building'; kind; tier } | { type: 'residents'; count }`. A goal is offered only while the Hall's tier is at least `hall`, and only if it is not met already (a `building` or `residents` goal that already holds is not offered). The starting list, all starting values (D-030):

  | id | name | hall | when | reward (value) |
  | --- | --- | --- | --- | --- |
  | `stockpile` | Lay in timber | 1 | make 80 wood | food 100, stone 60, tools 20 (1,000) |
  | `quarry` | Open the quarry | 1 | building mine 1 | food 120, wood 80, tools 20 (1,180) |
  | `forge` | Light the forge | 1 | building workshop 1 | food 100, wood 60, stone 60, ore 40 (1,280) |
  | `harvest` | A good harvest | 1 | make 120 food | wood 80, stone 60, tools 25 (1,075) |
  | `twelve` | Twelve hearths | 1 | residents 12 | food 120, wood 60, tools 30 (1,230) |
  | `snug` | Snug cottages | 1 | building cottage 2 | food 80, stone 80, ore 30, tools 20 (1,230) |
  | `toolmaker` | A store of tools | 2 | make 40 tools | food 200, wood 150, stone 100 (2,050) |
  | `deepmine` | Deeper shafts | 2 | building mine 2 | food 200, wood 120, tools 50 (2,150) |
  | `thirty` | Thirty souls | 2 | residents 30 | wood 150, stone 150, tools 40 (2,100) |
  | `fields` | Fields to the river | 2 | building farm 2 | wood 150, stone 120, ore 50, tools 30 (2,150) |
  | `stores` | Full granaries | 2 | building storehouse 1 | food 200, ore 60, tools 50 (1,970) |
  | `stoneworks` | Stone for the Village | 2 | make 150 stone | food 200, wood 120, ore 40, tools 40 (2,280) |

  Builder: compute each value with the table and keep the J2 bands; amounts must not exceed a resource's base cap (`validateContent` checks it).
- `trips: { size: 2; ticks: 24; finds: { resource; min; max }[]; draws: 3 }`. `finds`: food 15 to 30, wood 10 to 25, stone 8 to 20, ore 6 to 15, tools 2 to 6. Three draws, each a find and an amount in [min, max]; the same resource can come twice (amounts add). Mean value 229 (3 × the table's mean find of 76, computed 2026-11-15; starting value; worth a quarter of an hour of the town's work, against the 2 workers' 24 food value of a day's gathering).
- `rules` gain: `goalsOffered: 3`, `offerEveryTicks: 240`, `offersMax: 3`, `firstOfferTick: 24`, `deliveryTicks: 24`, `tradeSharePct: 20`, `offerExtraTicks: 240`. `validateContent` already checks every rule is positive.
- `validateContent` gains: every goal's `hall` is a Hall tier, its resource or kind exists, a `building` tier exists for that kind, `amount`/`count` positive, reward amounts within base caps, goal ids unique, at least `goalsOffered` goals at Hall tier 1; trip finds name known resources with 1 ≤ min ≤ max; every resource has a positive `value`.

### State (`packages/sim/src/types.ts`)

```ts
type Offer = { id: number; give: { resource: string; amount: number }; get: { resource: string; amount: number }; until: number };
type Delivery = { resource: string; amount: number; at: number };
type Trip = { residentIds: number[]; back: number };
type Board = {
  goals: string[];        // on offer, goalsOffered long once drawn; [] until the first tick draws them
  active: string | null;  // one of `goals`
  progress: number;       // `make` goals: units made since the pick; 0 otherwise
  offers: Offer[];        // at most offersMax, oldest first
  nextOfferTick: number;
  deliveries: Delivery[]; // oldest first
  trip: Trip | null;
};
// State gains `board: Board`. Offer ids come from `nextId`.
```

`draft` copies `board` and its arrays (offers, deliveries, trip.residentIds).

### Commands and refusals (`build.ts` or a new `board.ts`)

- `{ type: 'pickGoal'; id: string }`: `unknown` if not in `goals`; `same` if active.
- `{ type: 'acceptOffer'; id: number }`: `unknown` if no such offer; `noStock` if stock < give.
- `{ type: 'declineOffer'; id: number }`: `unknown` if no such offer.
- `{ type: 'sendTrip'; residentIds: number[] }`: `busy` if a trip is out; `unknown` if an id is not a resident; `tooFew` unless exactly `trips.size` distinct ids. Carrying it out sets each named resident's `jobId` to null (keeping `pinnedTo`), sets `trip`, and marks `jobsDirty`.
- New event types: `goalDone { id }`, `delivered { resource; amount }`, `tripBack { finds: Amounts }`, `offerGone { id }`. Each writes a log line (texts in J2 to J5). `fold` adds reward, delivery and find goods to `summary.made`, so the away card counts them, and `lost` as today.

### Rule 6, the board, each tick (`board.ts`, called from `step` after production)

In this order:
1. **Make progress:** if the active goal is `make`, add this tick's `made` events for its resource to `progress`.
2. **Goal check:** if the active goal holds (`progress ≥ amount`; a building of `kind` at tier ≥ `tier`; residents ≥ `count`), pay its reward (stock up to caps, excess lost), log, set `active` null, `goals` [].
3. **Draw goals:** if `goals` is empty, draw `goalsOffered` distinct eligible goals from the `goals` stream (shuffle the eligible list in content order with `draw`, take the first 3); if fewer are eligible, offer those. The goal just met is not eligible in this draw.
4. **Deliveries:** pay every delivery with `at ≤ tick`.
5. **Trip:** at `tick ≥ back`, draw the finds from the `trips` stream (for each draw: a find index, then an amount), pay them, log, set `trip` null, mark `jobsDirty`. Residents who left are skipped in the log's names.
6. **Offers:** drop offers with `until ≤ tick` (log "The trader moved on."). Then if `tick ≥ nextOfferTick`: if fewer than `offersMax` wait, draw one; `nextOfferTick += offerEveryTicks` either way.
7. **Drawing an offer** (`trader` stream): rank resources by stock × 1000 / cap (ties in content order). `give` is drawn from the 2 highest, `get` from the 2 lowest that are not `give`. `give.amount = baseCap × tradeSharePct / 100` (40 food, wood or stone; 20 ore; 10 tools); `get.amount = max(1, floor(give.amount × value(give) / value(get)))`. `until = tick + catchUpCap + offerExtraTicks` (the cap of the Hall tier in force when drawn).

`assignJobs` skips residents named in `board.trip`. `startDay` gives a resident on a trip the `trip` reason (amount 0) in place of `idle`, and no skill day. `newGame` sets the empty board with `nextOfferTick: content.rules.firstOfferTick`.

Streams: `StreamName` gains `'goals' | 'trader' | 'trips'`.

### Saves (`apps/web/src/saves.ts`)

- `SCHEMA = 4`. Upgrade 3 → 4 adds the empty board (J7), `nextOfferTick: state.tick + firstOfferTick`.
- `shapeOk` checks the board: goals are known ids, distinct, at most `goalsOffered`; `active` null or in `goals`; `progress` whole; offers at most `offersMax`, ids distinct and below `nextId`, resources known, amounts whole and positive, `until` whole; deliveries' resources known and amounts whole; `trip` null or `residentIds` distinct living resident ids (1 or 2, since one may have left) with `back` whole, and no resident on a trip has a `jobId` (the pair rule, LESSONS 2026-11-10).

### Web

- `apps/web/src/ui/Board.tsx` (new): the "Board" section on the Town tab, after `HallRow` and before the work queue. Cards in order: goals, offers, trip. Every number shown comes from the engine's state or an exported helper (GAME-02): `goalProgress(state, content)` returns `{ have, need }` for the active goal; `refusal` decides each button's class (`btn` or `btn second`) and a refused Accept shows "Needs <shortfall>" as the Upgrade row does.
- Goal card: name, the condition ("Make 80 wood", "Build a Mine", "A Cottage at tier 2", "12 residents"), reward text (`amountsText`), and "Pick" (or "Pick instead" when another is active; the active one shows progress and no button).
- Offer card: "The trader offers <get> for <give>", "Leaves in <duration>", Accept and Decline. Deliveries under way show as one line each: "<amount> <resource> on the way, <time> left".
- Trip card: "Send two to the forest edge for a day" and "Send two" (opens `TripSheet.tsx`, built on `Sheet.tsx`: residents not on a trip, each a toggle showing trade and top skill, "Send" enabled at exactly 2). While out: "<A> and <B> are out at the forest edge, <time> left".
- `PeopleTab.tsx`: a pin label (a `pin` tag after the name, replacing the trailing " · Pinned") and a "Pinned" chip shown when anyone is pinned; residents on a trip read "On a trip" in place of their trade.
- Styles from `docs/UI_STYLE.md` tokens only; buttons at least 44 px.

### Soak (`scripts/soak.ts`)

- Pass 1: `TYPES` and `WEIGHTS` gain the four commands (weight 2 each); ids drawn from the board when it has any. `check` gains the board invariants of `shapeOk`.
- Pass 2: the scripted player's new rules (J10). A check-in is the first tick of each 240-tick hour; it has a choice when an offer waits that `refusal` passes, or no goal is active and goals are on offer. Printed and gated as J10 says.

## Slices

A mock-up of the board, the trip sheet and the People row (`mockups/board.html`, `ui-mockups` skill) is approved by Morgan before S1's code.

### S1 Goals

- **Morgan tries:** open the Town tab; pick one of three goals; watch its progress; when it is met, the stores rise and three new goals appear.
- **Checks that fail now:** J1, J2, J6 (goals part), J7 (board fields), J8 first case (goal cards only), J10 (goals part: `goals_met` > 0, pass 2 band).
- **Files:** `packages/sim/src/{types,util,step,newGame,summary,validate}.ts` and new `board.ts`: state, `pickGoal`, rule 6 steps 1 to 3. `packages/content/src/index.ts`: `version`, `value`, `goals`, the goal rules. `apps/web/src/saves.ts`: schema 4 with the whole board shape (offers and trip empty until S2 and S3). `apps/web/src/ui/Board.tsx`, `TownTab.tsx`, `app.css`. Tests: `board.test.ts`, `content.test.ts`, `saves.test.ts`, `determinism.test.ts`, `tests/browser/board.spec.ts`. `scripts/soak.ts`.
- **Waits on:** the mock-up.

### S2 The trader

- **Morgan tries:** an offer waits at the first sitting; accept it, and the payment arrives a game day later; decline another.
- **Checks that fail now:** J3, J4, J6 and J10 (offers), J8 (offer card).
- **Files:** `board.ts` (steps 4, 6, 7; accept and decline), `types.ts`, content rules, `saves.ts` checks for offers and deliveries, `Board.tsx`, tests, soak.
- **Waits on:** S1.

### S3 Trips and pins

- **Morgan tries:** send two residents to the forest edge; see them "On a trip" on the People tab; a game day later read what they found. Pin someone and filter by Pinned.
- **Checks that fail now:** J5, J6 and J10 (trips), J8 (trip and pin cases).
- **Files:** `board.ts` (step 5, `sendTrip`), `jobs.ts`, `day.ts`, content `trips`, `saves.ts` trip checks, `Board.tsx`, new `TripSheet.tsx`, `PeopleTab.tsx`, tests, soak.
- **Waits on:** S2 (one PR for S1 to S3, so J9 tests all three).

## Verification

- Every push: `npm run check`.
- Before ready: `npm run test:browser`.
- End to end: J9 on Morgan's phone after merge and deploy.

## Open questions

- None beyond the escalated items in the approval page.
