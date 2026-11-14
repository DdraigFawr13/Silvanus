# M2a Pace

- **Status:** Approved 2026-11-14 (https://claude.ai/artifact/REo95ymqF2GDq5MqtMpzTz, `m2aspec`)
- **Planned in:** M2 re-plan round 1 (https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2), review (https://claude.ai/artifact/2KcwbeGPg47mn2rZvEbVYx), final (https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG), all 2026-11-14. **Decisions:** D-035, D-036, D-039.

## Problem

Morgan, after the M1 test: "everything is a little slow and boring. I would rather have it go faster". What was slow: "Waiting for build". He "didn't find the upgrades" and did not reach the Village. He picked a 15 s game hour, "Both: a faster clock and retuned timers", "Keep the same real hours" away, and "About 8" real hours from a new town to the Village.

## Goals

- A game hour (1 tick) is 15 s of real time, not 60 s.
- Time away keeps its real hours: the catch-up cap is 1,920 ticks at the Hamlet and 3,840 at the Village (8 and 16 real hours).
- A scripted player who checks in once an hour for 5 minutes reaches the Village in 6 to 10 real hours (1,440 to 2,400 ticks). Measured on the planned soak with the leaving gap below: 1,776 ticks, 7.40 h (2026-11-14, prototype run, each tick stepped). The same player at 60 s took 1,236 ticks, 20.6 real hours.
- An 8-real-hour hungry night still costs a town of 20 at most 3 residents, as a 480-tick night did at 60 s. A 16-hour Village absence allows at most 6 (parity: 960 / 168 allowed 6 before).
- Every building row on the Town tab with a next tier shows an Upgrade button.

## Non-goals

- No change to any build time, cost, production rate or method. Measured below: at 15 s every job finishes inside an hour between check-ins (see Design, "Build times").
- No real-time clock text: durations stay in game hours and days (M1 spec, "Web"). Parked idea only if Morgan asks.
- No save migration: stored ticks are game hours (D-036). A town saved before the update catches up its real time away at 15 s on first open, up to its cap (1,920 or 3,840 ticks): correct by D-036, and said in J7.
- No decision deadlines: no decision that waits exists yet (D-018's rule applies when M3 or M4 adds one).
- No town view, art, new content or push methods (M2b to M2d).

## Journeys and checks

The build starts from `70eec4b` (main after PR #13). Every check below fails there unless it is marked a guard. Hamlet is Hall tier 1, Village Hall tier 2 (`content.hall.tiers`).

### J1 A game hour is 15 s

- **Given** the clock. **Then** `TICK_MS` is 15,000 and a page with no `?tickMs` advances 1 tick per 15 s; 8 real hours away at the Hamlet catches up 1,920 ticks. **Check:** `apps/web/test/clock.test.ts` "a game hour is 15 s and the Hamlet's cap is 8 real hours" (fails now: `TICK_MS` is 60,000 and the cap 480).
- **Given** `?tickMs=60000`. **Then** it is still a test tick length (test database, 60 s ticks), though longer than `TICK_MS`. **Check:** `clock.test.ts` "test tick lengths run from 50 ms to 60 s" and `saves.test.ts` `databaseName('?tickMs=60000')` is `silvanus-test`. These pass now and are guards: they fail if S1 ties the range to the new `TICK_MS`.

### J2 Caps keep their real hours

- **Given** content. **Then** the Hamlet's `catchUpCap` is 1,920 and the Village's 3,840. **Check:** `build.test.ts` "the Hall upgrade makes a Village" expects 3,840 (fails now: 960); new `build.test.ts` case "a Hamlet catches up 8 real hours" expects 1,920 on `newGame`.
- **Given** a Village closed for 3,000 game hours. **When** the page opens. **Then** the away card says "125 game days passed." (a Hamlet would stop at 1,920). **Check:** `tests/browser/town.spec.ts` "a Village catches up two nights" (fails now: 960 ticks are caught up).

### J3 An 8-hour hungry night costs at most three

- **Given** the starving town of 20 from `growth.test.ts`, from tick 100 and from tick 0. **When** 1,920 ticks run. **Then** 1 to 3 have left, at least 672 ticks apart. The margin is zero by design: with `lastLeftTick` at -672 and the `>=` test at `day.ts:91`, 1,920 ticks allow exactly 3. **Check:** `growth.test.ts` "a hungry night costs at most three" (fails now: 8 leave in 1,920 ticks, prototype run). The `starving(tick)` helper stays; only 480 becomes 1,920, and the 168-tick spacing at `growth.test.ts:205` becomes `content.rules.leaveGapTicks`.
- **Given** the town of 8 at morale 0. **When** 1,920 ticks run. **Then** nobody leaves. **Check:** `growth.test.ts` "nobody leaves a town of eight" (a guard: `leaveFloor` holds it now too).
- **Then** `newGame(1, content).lastLeftTick` is `-content.rules.leaveGapTicks` (-672). **Check:** `calendar.test.ts` (fails now: -168).

### J4 Autosave and the away card keep their real minutes

- **Then** `AUTOSAVE_TICKS * TICK_MS` and `AWAY_MIN_TICKS * TICK_MS` are each 600,000 ms (10 real minutes, as at 60 s). **Check:** `apps/web/test/clock.test.ts` "autosave and the away card wait 10 real minutes", importing `AUTOSAVE_TICKS` from `clock.ts` and `AWAY_MIN_TICKS` from `store.ts` (fails now: `AUTOSAVE_TICKS` does not exist). App's use of `AUTOSAVE_TICKS` is checked by review, not a test.

### J5 The soak proves the pace

- **Given** the soak. **Then** pass 2 plays check-ins (5 real minutes every 60) and reaches the Village in 1,440 to 2,400 ticks, printing `village_tick` and `village_real_hours`; pass 3 starves the town for 1,920 ticks, loses 1 to 3 and is back to 20 within 2,000 ticks. **Check:** `npm run soak` (fails on the start commit's engine: an 8-hour hungry night from the current soak's 20-resident town loses 8; prototype run).

### J6 Upgrade is on the row (browser)

- **Given** seed 1 with stock set to wood 200, stone 200, tools 50, a Woodcutter's camp built and finished, and a Mine sent to build. **Then** the Woodcutter's camp row has a button named "Upgrade Woodcutter's camp", at least 44 px tall, with the `btn` class (it can be paid for), and the row reads "Tier 2: 40 wood, 5 tools". With wood 45, stone 10, tools 5, the Cottage row reads "Tier 2: Needs 5 wood, 10 stone" beside a `btn second` Upgrade. **When** it is tapped. **Then** the building sheet opens and its first `h3.sheet-sec` reads "Upgrade to tier 2". The Mine's row (being built) has no Upgrade button; after the camp's upgrade is sent, its row has none either. **Check:** `tests/browser/town.spec.ts` "Upgrade is on the lot row" (fails now: no such button; its negative parts are guards).
- **Given** a building at tier 3 (seeded with `tier: 3`). **Then** its row has no Upgrade button. **Check:** the same test.

### J7 The M2a test (device check, Morgan)

- **Given** a new town on the phone. **When** Morgan checks in over a day. **Then** he reaches the Village in about 8 real hours and finds the building upgrades without help. Recorded in HANDOFF in his words. His current town, if he opens it first, jumps forward by up to 8 real hours of 15 s ticks; the M2a test starts a new town.

## Decisions

- 1 tick is 1 game hour and 15 s; caps 1,920 and 3,840 (D-036).
- Upgrade is easy to find on each building row (D-035).
- Approved by Morgan (D-039): a resident leaves at most once every 672 ticks (a game year, 2 h 48 min real), not once a season (168 ticks, 42 min real). It keeps D-025's "cannot collapse overnight" in real hours: at 60 s a season was 2 h 48 min real. It becomes `content.rules.leaveGapTicks`, a tuning value as D-025 says. Amends D-025's "at most one per season".
- Autosave every 40 ticks and the away card after 40 ticks: both stay 10 real minutes, as at 60 s (default chosen here, small fork; WS-02).
- Test tick lengths stay 50 ms to 60 s (default chosen here). Why: every browser test opens `?tickMs=60000` so that no tick falls inside a test and the texts it reads hold still (`tests/browser/town.spec.ts:6`); at 15 s a slow test could see a tick.
- Content version 2 becomes 3 (rules changed; GAME-01). A version 2 save loads as now: loading sets the running version (`apps/web/src/saves.ts:203`), so no migration.

## Alternatives rejected

- **Retune the engine slower so continuous play takes 8 hours** (continuous play reaches the Village at tick 1,216, 5.07 h): rejected because nobody plays 8 hours straight; Morgan's answer was "a day of check-ins". D-036 settled Morgan's "a faster clock and retuned timers" as the clock now and timers only if measured slow. It would fail when Morgan checks in hourly: hourly check-ins already take 7.40 h on today's engine (prototype run), so a slower engine would push them past 10 h (inference, not measured).
- **Keep the season gap for leaving**: rejected because a real night (1,920 ticks) then costs 8 of 20 residents and the town did not recover in 4,000 ticks (prototype run). Fails D-007 "decline is recoverable".
- **Shorter caps in real hours (keep 480 and 960 ticks)**: rejected by Morgan ("Keep the same real hours").
- **A one-tap upgrade on the row that sends the command**: rejected because the running job cannot be cancelled, so stock would be spent with no cost shown. It would fail on the first mis-tap.
- **The cost or shortfall on the row ("Upgrade · needs 5 tools")**: shown to Morgan as option B on the mock-up; the default is no extra line, because the row's second line already carries method, workers and queue state and a third line makes every row taller. It would fail if Morgan wants to judge upgrades without opening a sheet.
- **A badge ("Upgrade ready") on the row, button left in the sheet**: rejected because Morgan missed a labelled button; a badge is weaker. It would fail when the badge is read as status, not an action.
- **Retune build times now**: rejected by D-036 until measured slow; measured below.

## Risks

- The band rests on one scripted player who builds 4 buildings and upgrades a few; a human may build more and be faster. → J7 is Morgan's own test; the band is a guard against drift, not proof of fun.
- The band (6 to 10 h, from the final page) is deliberately loose: it guards against drift, and the soak sits mid-band at 1,776. A pin to the exact tick would fail on every tuning change.
- Fewer check-ins (two or three a day) are not measured; the soak plays hourly. → Morgan's J7 test covers how he really plays.
- The Hall upgrade can only be ordered at a check-in, so small tuning moves the Village tick in steps of up to 240 ticks. → The band is 4 check-ins wide.
- At 15 s an hour away is 220 game hours, 4 times what it was, so stores fill and food runs out more often between check-ins. Measured on the prototype (hourly check-ins, to the Village): 34 food, 2 stone, 2 tools, 2 wood lost to full stores and 66 game hours at zero food, against 46 food, 1 stone and 0 hours at 60 s. → The soak prints both; Morgan's J7 test judges them; no retune in M2a.
- Fewer departures change seed 1's pinned numbers in older tests. → S1 lists every test that reads departures (LESSONS 2026-11-10, S4 measure).

## Design

### Clock (`apps/web/src/clock.ts`)

- `TICK_MS = 15_000`. `CATCH_UP_CAP = 1_920` (the page's fallback before a snapshot; the town's own comes from its Hall's tier).
- New exported `MAX_TEST_TICK_MS = 60_000`: `testTickMs` accepts 50 to 60,000. Its comment changes to match.
- `clock.test.ts`'s existing cases are rewritten in `TICK_MS` and `CATCH_UP_CAP` terms, not literals (150,000 ms is 10 ticks at 15 s; `40 * 3_600_000` gives 1,920), keeping their names. Its `bad` list keeps `'60001'`.
- New `AUTOSAVE_TICKS = 600_000 / TICK_MS` (40), so it stays 10 real minutes if `TICK_MS` changes. `App.tsx` autosaves in live play when `next.state.tick % AUTOSAVE_TICKS === 0`, in place of `% 10`.
- `apps/web/src/store.ts` `AWAY_MIN_TICKS = 600_000 / TICK_MS` (40), importing `TICK_MS` from `clock.ts`.

### Content (`packages/content/src/index.ts`)

- `version: 3`. Hamlet `catchUpCap: 1920`, Village `catchUpCap: 3840`.
- `rules.leaveGapTicks: 672`, placed after `leaveFloor` in both `packages/content/src/index.ts` and `packages/sim/src/types.ts` (`leaveGapTicks: number; // ticks between two departures, at least`). `packages/sim/src/validate.ts:19` already checks every rule.

### Engine (`packages/sim`)

- `day.ts`: leaving waits `rules.leaveGapTicks` since `lastLeftTick`, in place of `SEASON_TICKS`. The comments at `day.ts:6` and `:89`, and `growth.test.ts:203` ("a season (168 ticks)"), change to the gap. `saves.test.ts:270`'s `lastLeftTick: -168` fixture stays (any whole number is a valid value).
- `newGame.ts`: `lastLeftTick: -content.rules.leaveGapTicks`. `types.ts` comment: "minus the leaving gap at start".
- An old save keeps its `lastLeftTick`; it only delays the next departure. No migration.

### Build times

At 15 s (from content, `packages/content/src/index.ts:47-126`): tier 1 builds take 8 to 24 ticks (2 to 6 real minutes), tier 2 take 24 to 36 (6 to 9), tier 3 take 48 (12), the Hall 96 (24). Every job finishes inside the 55 minutes between hourly check-ins, so none is retuned (D-036). Morgan's J7 test is the judge.

### Soak (`scripts/soak.ts`)

- Pass 2: a check-in loop of 240 ticks, all by `step`: the first 20 with the scripted player's commands (5 real minutes), the next 220 with none (55 minutes away), until `hallTier` is 2 or tick `BAND.to + 1000` (3,400, as now). Stepping every tick keeps the Village tick and `at20` exact; `advance` is pass 1's to prove. A `rejected` event still fails the soak. It also prints `lost` (units lost to full stores, summed from `lost` events) and `food_zero_ticks` (ticks ending with food 0), with no gate. `BAND = { from: 1440, to: 2400 }`. It prints `village_real_hours` as `village_tick * 15 / 3600`, two decimals. The scripted player's rules are unchanged; `check(state)` runs after each `step` and after each `advance`. `at20` is unchanged: the first state after a step with 20 or more residents (one settler arrives a day at most, so it holds exactly 20).
- Pass 3: `NIGHT = 1920`. Gates unchanged (1 to 3 leave; back to 20 within `RECOVER_TICKS = 2000`).
- Header comment updated to match.

### Web: Upgrade on the row (`apps/web/src/ui/TownTab.tsx`, `BuildingSheet.tsx`)

Morgan picked option B on the mock-up (https://claude.ai/artifact/7xmvYWD4xV6fu36M5X69BH, D-039).

- A built row becomes a `div.panel.lot` (keeping `data-testid="lot"`) holding two buttons: the row's main button `button.lot-main` with `data-testid="lot-open"` (name, tier, second line, and `›` only when there is no Upgrade button; opens the sheet) and, when the building has a next tier and no job of its own in the queue, a button labelled "Upgrade" with `aria-label="Upgrade <kind name>"`, at least 44 px tall. Nested buttons are not allowed, hence the split.
- The Upgrade button has class `btn` when `refusal(state, upgrade, content)` is null and `btn second` otherwise (including a full queue). Either opens the building sheet, whose Upgrade section says what is missing as now.
- Option B: a row with the Upgrade button gains a third `line2` reading "Tier <n>: <cost>" (`amountsText(jobCost(...))`), or, when the refusal is `noStock`, "Tier <n>: Needs <shortfall>" (`needsText(shortfall(...))`) in a `.w` span (ember). The sheet's own Upgrade section keeps its current rules.
- `tests/browser/helpers.ts`: `lot(page, name)` is unchanged; every test that opens a sheet by clicking a row (`smoke.spec.ts:32`, `town.spec.ts:82, 207, 306` and any other `lot(...).click()`) clicks `lot(page, name).getByTestId('lot-open')` instead. The Hall's `getByRole('button', { name: 'Upgrade', exact: true })` (`town.spec.ts:354`) stays exact, so the rows' "Upgrade <name>" labels do not match it.
- `BuildingSheet.tsx`: the Upgrade section moves above Methods for every opening (at `70eec4b` Methods is at line 50 and Upgrade at line 88), so the sheet's order is Upgrade, Methods, Open slots, Workers, Clear.

### Docs

- `docs/DECISIONS.md`: D-036 notes the leaving gap; D-025's status line notes the amendment (after Morgan approves it). D-002's and D-018's decision lines still say 60 s: they get "(15 s since D-036)" after the figure. D-025's "at most one per season" gets "(one per 672 ticks since M2a)", and its soak target "2 to 3 real days" gets "(6 to 10 real hours of hourly check-ins since D-036)".
- `docs/CHARTER.md`: no change; `grep -n "60 s\|one per season\|a season\|leave" docs/CHARTER.md` (2026-11-14) found no leaving-gap line.
- Browser test comments that say "a minute per tick" stay true (`?tickMs=60000`).

## Slices

### S1 Pace

- **Morgan tries:** open the app; a game hour passes every 15 s; leave it 8 hours and the away card says up to 80 game days.
- **Checks that fail now:** J1, J2 (unit), J3, J4, J5.
- **Files:** `apps/web/src/clock.ts`, `App.tsx`, `store.ts`: constants above. `packages/content/src/index.ts`: caps, version, `leaveGapTicks`. `packages/sim/src/{types,day,newGame}.ts`: the leaving gap. `scripts/soak.ts`: passes 2 and 3. Tests: `clock.test.ts`, `store.test.ts`, `build.test.ts`, `growth.test.ts`, `calendar.test.ts`, `tests/browser/town.spec.ts` ("a Village catches up two nights" to 3,000 ticks; "the away card names who arrived" from 30 to 40 ticks closed, re-reading `advance(state, 40, content)` as it does now). Tests that pin seed 1's departures, known: `determinism.test.ts:97` (`left` at 672 and 840), `growth.test.ts:213` (`lastLeftTick` 120, likely unchanged). New expected values are read from the engine after the change, as those tests already do in their comments; run `vitest` to find any other.
- **Waits on:** none.

### S2 Upgrade on the row

- **Morgan tries:** on the Town tab, every building that can grow shows Upgrade on its row.
- **Starts with:** a mock-up (`mockups/upgrade-row.html`, `ui-mockups` skill) approved by Morgan before code.
- **Checks that fail now:** J6.
- **Files:** `apps/web/src/ui/TownTab.tsx`, `BuildingSheet.tsx`, `apps/web/src/app.css` (row layout, from `docs/UI_STYLE.md` tokens), `tests/browser/town.spec.ts`.
- **Waits on:** S1 for the PR (both edit `town.spec.ts`; none in code). S1 and S2 ship in one PR, so J7 tests both.

## Verification

- Every push: `npm run check`.
- Before ready: `npm run test:browser`.
- End to end: J7 on Morgan's phone, after merge and deploy.

## Open questions

- None.
