# M2a Pace

- **Status:** Draft
- **Planned in:** M2 re-plan round 1 (https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2), review (https://claude.ai/artifact/2KcwbeGPg47mn2rZvEbVYx), final (https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG), all 2026-11-14. **Decisions:** D-035, D-036; amends D-025's leaving gap (proposed, see Decisions).

## Problem

Morgan, after the M1 test: "everything is a little slow and boring. I would rather have it go faster". What was slow: "Waiting for build". He "didn't find the upgrades" and did not reach the Village. He picked a 15 s game hour, "Both: a faster clock and retuned timers", "Keep the same real hours" away, and "About 8" real hours from a new town to the Village.

## Goals

- A game hour (1 tick) is 15 s of real time, not 60 s.
- Time away keeps its real hours: the catch-up cap is 1,920 ticks at the Hamlet and 3,840 at the Village (8 and 16 real hours).
- A scripted player who checks in once an hour for 5 minutes reaches the Village in 6 to 10 real hours (1,440 to 2,400 ticks). Measured on the planned soak: 1,920 ticks, 8.00 h (2026-11-14, prototype run).
- An 8-real-hour hungry night still costs a town of 20 at most 3 residents, as a 480-tick night did at 60 s.
- Every building row on the Town tab with a next tier shows an Upgrade button.

## Non-goals

- No change to any build time, cost, production rate or method. Measured below: at 15 s every job finishes inside an hour between check-ins (see Design, "Build times").
- No real-time clock text: durations stay in game hours and days (M1 spec, "Web"). Parked idea only if Morgan asks.
- No save migration: stored ticks are game hours (D-036).
- No decision deadlines: no decision that waits exists yet (D-018's rule applies when M3 or M4 adds one).
- No town view, art, new content or push methods (M2b to M2d).

## Journeys and checks

Every check below fails at `70eec4b` (the build's start).

### J1 A game hour is 15 s

- **Given** the clock. **Then** `TICK_MS` is 15,000 and a page with no `?tickMs` advances 1 tick per 15 s; 8 real hours away at the Hamlet catches up 1,920 ticks. **Check:** `apps/web/test/clock.test.ts` "a game hour is 15 s and the Hamlet's cap is 8 real hours" (fails now: `TICK_MS` is 60,000 and the cap 480).
- **Given** `?tickMs=60000`. **Then** it is still a test tick length (test database, 60 s ticks), though longer than `TICK_MS`. **Check:** `clock.test.ts` "test tick lengths run from 50 ms to 60 s" and `saves.test.ts` `databaseName('?tickMs=60000')` is `silvanus-test`. These pass now and are guards: they fail if S1 ties the range to the new `TICK_MS`.

### J2 Caps keep their real hours

- **Given** content. **Then** the Hamlet's `catchUpCap` is 1,920 and the Village's 3,840. **Check:** `build.test.ts` "the Hall upgrade makes a Village" expects 3,840 (fails now: 960); new `build.test.ts` case "a Hamlet catches up 8 real hours" expects 1,920 on `newGame`.
- **Given** a Village closed for 3,000 game hours. **When** the page opens. **Then** the away card says "125 game days passed." (a Hamlet would stop at 1,920). **Check:** `tests/browser/town.spec.ts` "a Village catches up two nights" (fails now: 960 ticks are caught up).

### J3 An 8-hour hungry night costs at most three

- **Given** the starving town of 20 from `growth.test.ts`, from tick 100 and from tick 0. **When** 1,920 ticks run. **Then** 1 to 3 have left, at least 672 ticks apart. **Check:** `growth.test.ts` "a hungry night costs at most three" (fails now: 8 leave in 1,920 ticks, prototype run).
- **Given** the town of 8 at morale 0. **When** 1,920 ticks run. **Then** nobody leaves. **Check:** `growth.test.ts` "nobody leaves a town of eight".
- **Then** `newGame(1, content).lastLeftTick` is `-content.rules.leaveGapTicks` (-672). **Check:** `calendar.test.ts` (fails now: -168).

### J4 Autosave and the away card keep their real minutes

- **Then** `AUTOSAVE_TICKS * TICK_MS` and `AWAY_MIN_TICKS * TICK_MS` are each 600,000 ms (10 real minutes, as at 60 s). **Check:** `clock.test.ts` "autosave and the away card wait 10 real minutes" (fails now: `AUTOSAVE_TICKS` does not exist; the App saves every 10th tick).

### J5 The soak proves the pace

- **Given** the soak. **Then** pass 2 plays check-ins (5 real minutes every 60) and reaches the Village in 1,440 to 2,400 ticks, printing `village_tick` and `village_real_hours`; pass 3 starves the town for 1,920 ticks, loses 1 to 3 and is back to 20 within 2,000 ticks. **Check:** `npm run soak` (the new soak fails on the start commit's engine at pass 3: 8 leave; prototype run).

### J6 Upgrade is on the row (browser)

- **Given** a built Woodcutter's camp at tier 1. **Then** its row has a button named "Upgrade Woodcutter's camp", at least 44 px tall. **When** it is tapped. **Then** the building sheet opens with "Upgrade to tier 2" as its first section. A tier 3 row, a row being built and a row with a job in the queue have no Upgrade button. **Check:** `tests/browser/town.spec.ts` "Upgrade is on the lot row" (fails now: no such button).

### J7 The M2a test (device check, Morgan)

- **Given** a new town on the phone. **When** Morgan checks in over a day. **Then** he reaches the Village in about 8 real hours and finds the building upgrades without help. Recorded in HANDOFF in his words.

## Decisions

- 1 tick is 1 game hour and 15 s; caps 1,920 and 3,840 (D-036).
- Upgrade is easy to find on each building row (D-035).
- **Proposed, for Morgan:** a resident leaves at most once every 672 ticks (a game year, 2 h 48 min real), not once a season (168 ticks, 42 min real). It keeps D-025's "cannot collapse overnight" in real hours: at 60 s a season was 2 h 48 min real. It becomes `content.rules.leaveGapTicks`, a tuning value as D-025 says. Amends D-025's "at most one per season".
- Autosave every 40 ticks and the away card after 40 ticks: both stay 10 real minutes (default chosen here, small fork; WS-02).
- Test tick lengths stay 50 ms to 60 s (default chosen here: browser tests rely on no tick falling inside a test).
- Content version 2 becomes 3 (rules changed; GAME-01).

## Alternatives rejected

- **Retune the engine slower so continuous play takes 8 hours** (continuous play reaches the Village at tick 1,216, 5.07 h): rejected because nobody plays 8 hours straight; Morgan's answer was "a day of check-ins". It would fail when Morgan checks in hourly: hourly check-ins already take 7.40 h on today's engine (prototype run), so a slower engine would push them past 10 h (inference, not measured).
- **Keep the season gap for leaving**: rejected because a real night (1,920 ticks) then costs 8 of 20 residents and the town did not recover in 4,000 ticks (prototype run). Fails D-007 "decline is recoverable".
- **Shorter caps in real hours (keep 480 and 960 ticks)**: rejected by Morgan ("Keep the same real hours").
- **A one-tap upgrade on the row that sends the command**: rejected because the running job cannot be cancelled, so stock would be spent with no cost shown. It would fail on the first mis-tap.
- **A badge ("Upgrade ready") on the row, button left in the sheet**: rejected because Morgan missed a labelled button; a badge is weaker. It would fail when the badge is read as status, not an action.
- **Retune build times now**: rejected by D-036 until measured slow; measured below.

## Risks

- The band rests on one scripted player who builds 4 buildings and upgrades a few; a human may build more and be faster. → J7 is Morgan's own test; the band is a guard against drift, not proof of fun.
- Pass 2's Village tick falls on a check-in (every 240 ticks), so small tuning moves it by 240 ticks at a time (measured: 45 min gives 1,440, 60 min 1,920, 75 min 2,100). → The band is 4 check-ins wide.
- Fewer departures change seed 1's pinned numbers in older tests. → S1 lists every test that reads departures (LESSONS 2026-11-10, S4 measure).

## Design

### Clock (`apps/web/src/clock.ts`)

- `TICK_MS = 15_000`. `CATCH_UP_CAP = 1_920` (the page's fallback before a snapshot; the town's own comes from its Hall's tier).
- New `MAX_TEST_TICK_MS = 60_000`: `testTickMs` accepts 50 to 60,000. Its comment changes to match.
- New `AUTOSAVE_TICKS = 40`. `App.tsx` autosaves in live play when `next.state.tick % AUTOSAVE_TICKS === 0`, in place of `% 10`.
- `apps/web/src/store.ts` `AWAY_MIN_TICKS = 40`.

### Content (`packages/content/src/index.ts`)

- `version: 3`. Hamlet `catchUpCap: 1920`, Village `catchUpCap: 3840`.
- `rules.leaveGapTicks: 672`. `packages/sim/src/types.ts` `rules` gains `leaveGapTicks: number`; `validate.ts` already checks every rule is a whole number.

### Engine (`packages/sim`)

- `day.ts`: leaving waits `rules.leaveGapTicks` since `lastLeftTick`, in place of `SEASON_TICKS`. Comments that say "a season" change.
- `newGame.ts`: `lastLeftTick: -content.rules.leaveGapTicks`. `types.ts` comment: "minus the leaving gap at start".
- An old save keeps its `lastLeftTick`; it only delays the next departure. No migration.

### Build times

At 15 s (from content, `packages/content/src/index.ts:47-126`): tier 1 builds take 8 to 24 ticks (2 to 6 real minutes), tier 2 take 24 to 36 (6 to 9), tier 3 take 48 (12), the Hall 96 (24). Every job finishes inside the 55 minutes between hourly check-ins, so none is retuned (D-036). Morgan's J7 test is the judge.

### Soak (`scripts/soak.ts`)

- Pass 2: a check-in loop. Each check-in is 20 ticks of `step` with the scripted player's commands (5 real minutes), then `advance` of 220 ticks with no commands (55 minutes away), until `hallTier` is 2 or tick 3,400. `BAND = { from: 1440, to: 2400 }`. It prints `village_real_hours` as `village_tick * 15 / 3600`, two decimals. The scripted player's rules are unchanged; `check(state)` runs after each `step` and after each `advance`. `at20` is the first state seen with 20 or more residents, after a step or an advance.
- Pass 3: `NIGHT = 1920`. Gates unchanged (1 to 3 leave; back to 20 within `RECOVER_TICKS = 2000`).
- Header comment updated to match.

### Web: Upgrade on the row (`apps/web/src/ui/TownTab.tsx`, `BuildingSheet.tsx`)

The layout is fixed by the S2 mock-up; this is its starting point.

- A built row becomes a `div.panel.lot` (keeping `data-testid="lot"`) holding two buttons: the row's main button (name, tier, second line, opens the sheet) and, when the building has a next tier and no job of its own in the queue, a button labelled "Upgrade" with `aria-label="Upgrade <kind name>"`, at least 44 px tall. Nested buttons are not allowed, hence the split.
- The Upgrade button is a primary button when `refusal(state, upgrade)` is null, a second button otherwise. Either opens the building sheet with the Upgrade section first.
- `BuildingSheet.tsx`: the Upgrade section moves above Methods for every opening, so the sheet's order is Upgrade, Methods, Open slots, Workers, Clear.

### Docs

- `docs/DECISIONS.md`: D-036 notes the leaving gap; D-025's status line notes the amendment (after Morgan approves it).
- `docs/CHARTER.md`: no change; `grep -n "60 s\|one per season\|a season\|leave" docs/CHARTER.md` (2026-11-14) found no leaving-gap line.
- Browser test comments that say "a minute per tick" stay true (`?tickMs=60000`).

## Slices

### S1 Pace

- **Morgan tries:** open the app; a game hour passes every 15 s; leave it 8 hours and the away card says up to 80 game days.
- **Checks that fail now:** J1, J2 (unit), J3, J4, J5.
- **Files:** `apps/web/src/clock.ts`, `App.tsx`, `store.ts`: constants above. `packages/content/src/index.ts`: caps, version, `leaveGapTicks`. `packages/sim/src/{types,day,newGame}.ts`: the leaving gap. `scripts/soak.ts`: passes 2 and 3. Tests: `clock.test.ts`, `store.test.ts`, `build.test.ts`, `growth.test.ts`, `calendar.test.ts`, `tests/browser/town.spec.ts` ("a Village catches up two nights" to 3,000 ticks), and every test that pins seed 1's departures (list them first by running `vitest` after the engine change).
- **Waits on:** none.

### S2 Upgrade on the row

- **Morgan tries:** on the Town tab, every building that can grow shows Upgrade on its row.
- **Starts with:** a mock-up (`mockups/upgrade-row.html`, `ui-mockups` skill) approved by Morgan before code.
- **Checks that fail now:** J6.
- **Files:** `apps/web/src/ui/TownTab.tsx`, `BuildingSheet.tsx`, `apps/web/src/app.css` (row layout, from `docs/UI_STYLE.md` tokens), `tests/browser/town.spec.ts`.
- **Waits on:** S1 (none in code; the order keeps one PR reviewable).

## Verification

- Every push: `npm run check`.
- Before ready: `npm run test:browser`.
- End to end: J7 on Morgan's phone, after merge and deploy.

## Open questions

- Morgan approves the leaving gap of 672 ticks (proposed above).
