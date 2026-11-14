# Decisions

Settled rules for this project. Not a changelog: an entry stays while the rule is in force. Change a rule here in the same change that changes the behaviour. Mark ideas Proposed until the owner approves them; mark retired entries SUPERSEDED with a pointer, never delete them.

All entries below were chosen by Morgan in the planning workshop of 2026-11-09 unless marked Proposed.

## D-001 Platform: Android PWA

- **Status:** Accepted (2026-11-09)
- **Decision:** TypeScript, React and Vite, installed from the browser on an Android phone. No app store.
- **Why:** The game is text, lists and numbers with no map. Morgan plays on Android.

## D-002 Time model

- **Status:** Accepted (2026-11-09) Amended by D-036: a game hour is 15 s.
- **Decision:** 1 tick is 1 game hour and 60 s (15 s since D-036) of real time. Offline catch-up runs min(elapsed, cap) ticks through the same step function as live play.
- **Why:** Morgan chose this pacing; one step function keeps offline and live results identical.

## D-003 No runtime LLM

- **Status:** Accepted (2026-11-09, round 5)
- **Decision:** No runtime AI. The chronicle is rendered from templates drafted in build sessions. The shipped game makes no network calls.
- **Why:** Morgan's choice in round 5.

## D-004 Every resident is an individual, with full generations

- **Status:** Accepted (2026-11-09)
- **Decision:** No aggregate commoners. Residents marry, have children, age, die and inherit. Cap 150.
- **Why:** Morgan's choice over counts-plus-notables and households.

## D-005 Jobs: automatic with override

- **Status:** Accepted (2026-11-09)
- **Decision:** Residents fill quotas by skill and trait; any resident can be pinned by hand.
- **Why:** Morgan's choice; 150 residents can't be placed by hand on a phone.

## D-006 Adventurers and quests

- **Status:** Accepted (2026-11-09)
- **Decision:** Adventurers are outsiders and residents. The player writes quests. Parties ask for decisions mid-quest; the risk posture answers when the player doesn't.
- **Why:** Morgan's choices.

## D-007 Stakes and long game

- **Status:** Accepted (2026-11-09)
- **Decision:** Decline is recoverable and the town can't be lost. Each charter has a capstone goal; play is a sandbox afterwards.
- **Why:** Morgan's choices.

## D-008 Setting

- **Status:** Accepted (2026-11-09)
- **Decision:** A fresh world. A frontier town under a Crown writ (levies, favor) beside a deep, dangerous forest with three depth bands of scattered, scouted sites. A mixed town of several peoples. Magic is a normal craft built on forest materials.
- **Why:** Morgan's choices. Place and people names are placeholders.

## D-009 Presentation and focus

- **Status:** Accepted (2026-11-09) Amended by D-037: v0.1 has a town view.
- **Decision:** Text and icons for v0.1. Depth is balanced evenly across town, guild and characters.
- **Why:** Morgan's choices.

## D-010 Harness

- **Status:** Accepted (2026-11-09)
- **Decision:** AI-Master-Instructions v4.12.0, full profile, layers `core`, `stacks/node-web`, `project-types/game`. npm workspaces.
- **Why:** Morgan asked for the master instructions; WEB-02 requires npm.

## D-011 Relation to Morgan's other games

- **Status:** Accepted (2026-11-09, round 5)
- **Decision:** Silvanus is its own lighter, idle, phone game, not Story-Generator's steward mode. It is separate from Adventure Manager and keeps its guild thin; quests never show a fight. Small pieces of code may be copied once; no shared package. Silvanus becomes the main project.
- **Why:** Morgan's choices. His note: "I want some similarities but definitely no need for that level of simulated depth". What "thin" covers is open (review round).

## D-012 World content starts from Story-Generator's tables

- **Status:** Accepted (2026-11-09, round 5)
- **Decision:** Copy Story-Generator's peoples, cultures and names once, then change them freely. Two peoples in v0.1: humans and one other.
- **Why:** Morgan's choice; saves the largest block of writing. Narrows D-008's "fresh world" to setting and story, not tables.

## D-013 People rules

- **Status:** Accepted (2026-11-09, round 5)
- **Decision:** One shared lifespan for all peoples through v1.0. Family life is steered lightly: the inbox asks about notable matches and heirs. A pinned resident complies, but a bad fit costs morale and can become an event.
- **Why:** Morgan's choices.

## D-014 Forest faction

- **Status:** Accepted (2026-11-09, round 5)
- **Decision:** One forest faction, added with the Deepwood band.
- **Why:** Morgan's choice.

## D-015 Capstones and v0.1 scope, as answered in round 5

- **Status:** Accepted (2026-11-09, round 5); the review round proposes changes
- **Decision:** Capstones kept for the Guild and March charters; Market, Forge, Arcane and Faith after v1.0. v0.1 keeps lots and 12 buildings, individual residents, automatic jobs with pin, two peoples, quest writing, mid-quest decisions, residents becoming adventurers, 30 events, the chronicle and save export. Migration, two contract modes and biography pages come after v0.1.
- **Why:** Morgan's choices. The review found v0.1 then has no population inflow; D-020 resolved it.

## D-016 v0.1 passes on the described check-in

- **Status:** Accepted (2026-11-09, delegated)
- **Decision:** v0.1's test is the check-in Morgan described in round 5 (quoted at the top of the charter), end to end on the phone. One buyer town, gear hand-out and one class-unlocking building move into v0.1. Events drop from 30 to 12.
- **Why:** Morgan, 2026-11-09, after the review round: "go with what you recommend knowing the goal". These are Claude's recommendations, adopted on that instruction. The review found the old test (a chronicle worth reading) built a different game from the session described.

## D-017 A resident is a record with one morale value

- **Status:** Accepted (2026-11-09, delegated)
- **Decision:** A resident has a trade, skills, traits, family, history and one morale value. No needs, moods, schedules or movement. Narrows D-004 without changing it.
- **Why:** Delegated as D-016. Reconciles D-004 with Morgan's note that he does not want Story-Generator's depth.

## D-018 Decisions wait; events queue

- **Status:** Accepted (2026-11-09, delegated) Its cap figures move with D-036.
- **Decision:** The tick stays at 60 s (15 s since D-036). Every decision's deadline is longer than the current offline cap. At most 5 events wait; while 5 wait, none is drawn.
- **Why:** Delegated as D-016. At 60 s a quest lasts 24 min to 4 h real and an 8 h absence draws 20 events, so decisions timed out unseen.

## D-019 Gear and staffing

- **Status:** Accepted (2026-11-09, delegated)
- **Decision:** Common gear is stock; fine and magical pieces are named items the player hands to an adventurer. v0.1 staffs a quest one way: the player picks the party.
- **Why:** Delegated as D-016. Morgan asked to hand out made items; a record for every item would be a second inventory game.

## D-020 Growth before families

- **Status:** Accepted (2026-11-09, delegated)
- **Decision:** Settlers arrive when a home is free and food is in surplus, from M1. Hamlet to Village is in M1. Families move to their own milestone, M4a; the save holds age and family fields from M0.
- **Why:** Delegated as D-016. Amends D-015, under which v0.1's population could only fall.

## D-021 Ranks are a label in v0.1

- **Status:** Accepted (2026-11-09, delegated); revisit after the first playtest
- **Decision:** Adventurer rank 1 to 5 is a label derived from skill and adds nothing by itself.
- **Why:** Morgan chose "no big jumps" and noted he might want bigger jumps. This is the reversible default; the playtest decides.

## D-022 Names, second people, charters, hosting

- **Status:** Accepted (2026-11-09, delegated) for names, people and charters; hosting settled by D-024
- **Decision:** The town is Ashwick, the forest the Skarthorn, the backer the Crown of Dunmere. The second people in v0.1 is the Dwarf. v1.0 ships the Guild and March charters only. Hosting is Vercel (D-024).
- **Why:** Delegated as D-016. The names and the people had no recommendation on the form; they are Claude's picks and cheap to change. Amends D-015.

## D-023 Plan approved

- **Status:** Accepted (2026-11-09)
- **Decision:** Morgan approved the plan in `docs/CHARTER.md`: "Approved, start building" on the final page (https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv) and "Approved" in chat. Adventure Manager pauses now; nothing in its repo is changed from here.
- **Why:** The owner's approval covers the platform, the stack and the step order (WS-02). Hosting is asked again at M0 (D-022).

## D-024 M0 spec approved; hosting on Vercel

- **Status:** Accepted (2026-11-09)
- **Decision:** Morgan approved `docs/specs/m0-skeleton.md` ("Approved, start building", https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe). Hosting is Vercel; at his request Claude created the project `silvanus` (id `prj_wddGMCfTiMi9txEVpWxadbxtlUmD`, team `golden-goose-engineering-group`), linked to this repo, production branch `main`. M0's one page needs no mock-up; mock-ups start with M1. The Web Worker stays in M0.
- **Why:** Morgan's answers on the spec page. The address must not change later because saves are tied to it.

## D-025 M0 passed; M1 Town's rules

- **Status:** Accepted (2026-11-10; round 1 answers, then delegated). Its method-change rule is amended by D-034.
- **Decision:** M0's exit test passed on Morgan's phone. M1's rules:
  - Homes are buildings on lots. The Hall takes no lot, stands from day 1 and cannot be cleared. Day 1 has 8 founders, the Hall, a Cottage and a Forager's hut.
  - Building and upgrading cost stock and game hours. One job is under way at a time, with a queue of up to 3. A lot can be cleared with no refund, after a confirm on the page.
  - Production methods are the one production system. Each workplace has a basic method with no inputs and up to two higher methods that need a supplied input; tier 2 unlocks the second and tier 3 the third. A workplace short of an input drops to its basic method and never stops. Changing method costs 1 game day of output. There is no separate upkeep.
  - The Mine makes ore or stone by method. No Quarry.
  - Jobs fill automatically; the player sets open slots per building with a stepper and can pin a resident. Skills grow slowly in the skill a job uses. Humans and dwarves arrive at even odds.
  - Settlers join without a choice and the log says who came. Stock banks itself; there is no Collect tap.
  - Morale is moved by food stock, job fit, a crowded home, a tavern and idleness. It changes output mildly, and at very low morale residents leave: at most one per season (one per 672 ticks since D-039), and none when the town has 8 or fewer. Both numbers are tuning values.
  - The player starts the Village by upgrading the Hall, at a population and a cost.
  - In M1: the "while you were away" summary, the resident sheet, sort and filter on the people list, a plain dated log. After the first playtest: seasons changing yields, stock forecast, renaming, a balance report page.
  - The soak gains a scripted bot that reports ticks to Village against a target of 2 to 3 real days (6 to 10 real hours of hourly check-ins since D-036), and a run that starves the town and checks it recovers.
- **Why:** Morgan's round 1 answers (https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR). On the review page's findings and questions (https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1) he said in chat: "Go with your recommendations". Those items are Claude's recommendations, adopted on that instruction. Production methods are his own request: "something like europa unversalis 5 where I can choose production methods".

## D-026 v0.1 caps and the M1 test

- **Status:** Accepted (2026-11-10; resources by Morgan's answer, the rest delegated as D-025) Its counts are amended by D-038.
- **Decision:** v0.1 has 9 resources (food, wood, stone, ore, herbs, forest materials, tools, weapons, potions); gold and renown are counted apart. v0.1 has 13 buildings. M1 ships 9 of them: Cottage, Forager's hut, Farm, Woodcutter's camp, Mine, Workshop, Storehouse, Hall, Tavern. Herb garden, Smithy, Apothecary and Guild hall arrive in M2 with the guild. The M1 test is about 20 minutes of play in total, spread over check-ins across 2 or 3 days, with real trade-offs, reaching the Village; the soak passes. Amends the charter's content targets and its M1 and M2 lines.
- **Why:** Morgan chose set C for resources. One sitting of 20 minutes is 20 ticks, less than a game day. The four buildings moved have no use before the guild exists, and all 13 have one by M2.

## D-027 The whole loop stays the goal; gold funds building from M3

- **Status:** Accepted (2026-11-10) for the goal; the reading of "funding" is Claude's and is Proposed
- **Decision:** Moving buildings to M2 narrows M1, not the game. Morgan, 2026-11-10: "I want this to be a town simulator for like adventure and fantasy and caravans and all of that ties into getting materials and money to build the town and gear and adventurers and magic to defend it from raids from the forest". Proposed reading: M1 buildings cost stock only; once caravans pay gold (M3), gold also funds building. Raids and the town's defence are placed by D-029.
- **Why:** His words, so later sessions do not read the M1 cuts as a change of direction.

## D-028 The look: Lantern at the forest edge

- **Status:** Accepted (2026-11-10)
- **Decision:** The UI follows the taste board's look B, "Lantern at the forest edge": dark green, lamp-amber for what the player can act on, moss for what is fine. One theme only. Middle density: stock always visible, buildings scroll. The style doc is `docs/UI_STYLE.md`.
- **Why:** Morgan's taste board answers (https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf): Lantern Keep, Map table Keep, Woodcut print After, Steward's ledger Cut; then in chat, "Lantern leads".

## D-029 Raids arrive in M2

- **Status:** Accepted (2026-11-10) Amended by D-035: the first raid moves to M3.
- **Decision:** The threat clock and a first simple raid on the town are part of M2, with the guild. Amends the charter's M2 line. Their rules are settled in M2's planning.
- **Why:** Morgan, in chat: "Raids in m2". His loop ends on defending the town (D-027), and before this no milestone ahead of M4b built raids, so v0.1 would have shipped without them.

## D-030 M1 spec approved

- **Status:** Accepted (2026-11-10, approved in advance)
- **Decision:** `docs/specs/m1-town.md` is approved, with these choices the spec made:
  - A method names the tier that unlocks it. The Mine has two tier 1 methods and the Workshop's "Forge tools" opens at tier 1. Narrows D-025's "tier 2 unlocks the second".
  - A building's tier is not limited by the Hall's tier.
  - A kind marked `freeWhenNone` costs nothing to build while the town has none; only the Woodcutter's camp is marked.
  - The Tavern has no methods; each staffed worker adds 4 morale to everyone, up to 12.
  - Production has no randomness in M1. The `yield` stream is retired and `arrivals` is the only stream; stream names are `'arrivals'` or `test:<name>`.
  - The content schema gains one condition type: a trait's `likes` and `dislikes` lists of building kinds.
  - Two runtime dependencies: `@fontsource/alegreya-sans` 5.3.0 and `@fontsource/alegreya-sc` 5.3.0 (OFL-1.1), so the fonts ship inside the app.
  - Residents' names use Story-Generator's `GWERIN_NAMES` and `DVERGAR_NAMES` given-name tables (D-012).
  - Every cost, rate, cap and tuning value in the spec's "Content" section, as starting values for the playtest.
- **Why:** Morgan, in chat on 2026-11-10, before the spec was finished: "I approve the m1 spec once you are done". He has not read it; each item above was told to him in chat. Forge at tier 1 because a Workshop that only mends cannot supply a Hamlet; the free first camp because wood has one source and every building costs wood (D-007).

## D-031 The page may look for an update when it comes back to the front

- **Status:** Accepted (2026-11-10) with S1's approval. Morgan was offered "keep" (recommended) or "remove" and answered "Approved" without naming one, so the built option stands; he can still say remove.
- **Decision:** When the page becomes visible, it asks the service worker registration to look for a new version. This is one request for the app's own `sw.js`. D-003's rule against runtime network calls does not cover it.
- **Why:** An installed app left in the recents list is not opened again, so without this it would not see a deploy (audit F3).

## D-032 Fun round 1: six additions approved

- **Status:** Accepted (2026-11-10); push methods wait on the M1 test
- **Decision:** Morgan approved round 1 of the fun ideas as recommended (https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop). Each is specified in its milestone's planning, not here.
  - Quest reports open one stage at a time and say how close each check was and what tipped it; "Show all" skips the reveal (M2).
  - The stock forecast D-025 plans runs the real engine ahead on a copy, as far as the catch-up cap, and names the first troubles. It reads no random stream (after the M1 test, built with M2).
  - A big event carries a lead time of the catch-up cap plus one game day and a sign text. At most 2 signs show at once. The raid clock in M2 is the first; the rest arrive with events in M3.
  - Deeds: a resident or a named item earns a name from its chronicle records, a deed adds renown, and a named item gains one quality step once (M3; heirlooms pass to heirs in M4a).
  - Named foes: a monster that beats or wounds a party gets a name and a record, grows, and can lead a raid. At most 3 alive, one per site, on their own random stream (M3; the save holds the fields from M2). Thickens D-011's thin guild by this much and no more.
  - Push methods: a method that pays more and carries a daily risk, kept local to its building, which is shut for 2 game days at most. Built in M2 only if the M1 test finds the town mechanical; it would then amend D-030's "no randomness in production" and add an effect type under its own entry.
  - Not approved: feasts. Later: apprentices and party bonds (`docs/parking.md`).
- **Why:** Morgan, in chat: "Ok I like those and we can add them as recommended". The work figures on the page are Claude's estimates: 5 slices for the six.

## D-033 Fun round 2: seven town-management additions approved

- **Status:** Accepted (2026-11-10) Amended by D-035 and D-037: its town items move to M3 or M4 (lots stay in M2d); the map shows lot spots and a road as scenery.
- **Decision:** Morgan approved round 2 (https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE) by his answer on each idea. Each is specified in its milestone's planning, not here. M1 is not changed.
  - The lie of the land: each lot has a character drawn from the town's seed on its own random stream (good soil, riverside, rock outcrop, forest edge, or plain) that raises some buildings' output; a forest-edge lot is the first a raid reaches. A feature only adds and no method needs one, so no seed makes a dead end. Lots become records in the save and the build sheet gains a lot picker. Amends the charter's first pillar: the player chooses a place, still with no grid, roads or adjacency. Adds one condition type, a lot's feature (M2).
  - Standing orders: the Hall holds 1 town-wide order as a Hamlet and 2 as a Village, each with a gain and a cost (Short rations, Long days, Open gates), taking effect after 1 game day. Policies in v0.1 go from 0 to 3; M4b adds 3 more to reach the 6. Adds one effect type: an order changes a rule value (M2).
  - Town works: off-lot projects built in stages through the one build queue. A new content target, works: 4. The Palisade is the town's defence in the first raid (M2); the Well, the Watchtower and the Cart track follow (M3).
  - A practised crew: a crew that keeps its method gains output each game day up to a cap; choosing a new method resets it and a fallback does not. The cap is a tuning value (M2).
  - The ledger: a sheet per resource showing who makes it, who uses it, what is eaten, the net per game day and the time to empty or full (after the M1 test, built with the forecast of D-032).
  - Gold hires a second crew: once caravans pay gold, the Hall can pay an outside crew to run one job beside the town's own. Settles D-027's proposed part for building work and amends D-025's one job at a time from M3 (M3).
  - Foremen: a named lead worker's trait shapes the building, and the lead teaches. This takes in round 1's apprentices. Morgan answered Yes where Later was recommended; it is built in M4a, the milestone the page gave.
  - M2 is planned as two sessions, the town half first.
  - Later: reserves and serving order (`docs/parking.md`). Tier 3 branches stay in M4b.
- **Why:** Morgan, in chat: "none of these touch the town management as much as I would like", then "Ok I approve please add all these to the plan map". On the page he chose more to decide about each building, levers on the whole town, long projects and seeing why the numbers move. Work figures are Claude's estimates: 5.5 slices for the seven, 10.5 with D-032's six.

## D-034 A building buys a method once

- **Status:** Accepted (2026-11-10) by Morgan, during the S3 mock-up review. The rule and its owner are his. The prices and the 4 game hours are Claude's proposal on the mock-up; they are starting values, and the M1 test (J14) judges them (M1 audit F19, Morgan: "Do what you recommend for all").
- **Decision:** A method a building has not had before costs stock once, paid when it is chosen, plus 1 game day to set up (`retoolTicks`). After that the building owns it: switching back to an owned method is free and takes 4 game hours (`switchTicks`, one production cycle). What a building owns belongs to that building alone; clearing its lot loses it. Every building owns its methods with no inputs from the start. Content gains a `cost` on each method; a building record gains `owned`, so saves move to schema 3 and an older town's buildings own their free methods and the one they run. Amends D-025's "changing method costs 1 game day".
- **Why:** Morgan, in chat: "I want there to be a cost as well as time to change to a different production method that you didn't have before. Once you have "purchased" a production method, switching takes much less time and you don't have to pay again to do so." Asked whether the town or the building owns a bought method, he chose the building.

## D-035 M2 re-planned in four steps

- **Status:** Accepted (2026-11-14) by Morgan on the final page (https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG, "Approved, start building"), after round 1 (https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2) and a review he agreed in full (https://claude.ai/artifact/2KcwbeGPg47mn2rZvEbVYx).
- **Decision:** M2 becomes four steps, each with its own phone test: M2a Pace (D-036, plus an easy-to-find Upgrade on each building row), M2b Art workshop (taste board and a mock-up of the Town tab, no game code), M2c Town view (D-037), M2d Ceiling and lots (D-038). The guild becomes M3; trade, events and the chronicle become M4, which is now v0.1. Later milestones move one number on: M5a Families, M5b Paths, M6 Trade and Crown, M7 Depth (v1.0). Standing orders, the forecast and ledger, a practised crew, and day and night go to M3 or M4, decided at their planning. Project Phobos for residents is parked until Morgan sends an integration plan.
- **Why:** The M1 test (J14): "it felt a little mechanical", "a lot of clicking and watching numbers", "too lifeless", slow from "Waiting for build", choices "almost too straight forward"; he did not reach the Village or find the building upgrades. He chose a view of the town, a faster pace and a higher ceiling, in that order after pace. Session counts on the pages are Claude's estimates.

## D-036 A game hour is 15 s

- **Status:** Accepted (2026-11-14), final page. Amends D-002.
- **Decision:** 1 tick is 1 game hour and 15 s of real time. Catch-up caps keep their real hours: 1,920 ticks at the Hamlet and 3,840 at the Village (8 and 16 real hours). A new town reaches the Village in about 8 real hours of check-ins; the soak checks a band around it. Build times are retuned only if still slow after measuring. Saves need no change: stored tick counts are game hours. Decisions that wait (D-018) get deadlines longer than the cap in force, more than 3,840 ticks at the Village.
- **Why:** Morgan: "everything is a little slow and boring. I would rather have it go faster". He picked 15 s, a faster clock with retuned timers, the same real hours away, and "About 8" hours to the Village. At the M1 tuning the soak reached the Village at game hour 1,216, about 5 real hours at 15 s.

## D-037 v0.1 has a town view

- **Status:** Accepted (2026-11-14), final page. Amends D-009 and the charter's non-goal "town layout or a map view".
- **Decision:** The Town tab gains a drawn map with one fixed spot per lot. Residents walk between home, work and the Hall; working buildings show smoke, idle ones look quiet, builds show scaffolding, settlers come and go on the road, and stock piles by the Storehouse. Tapping a building opens its sheet. The view draws only from the latest state the engine sent, uses its own cosmetic random numbers (never a game stream), jumps to the present after time away, draws at 30 frames a second or less only while the Town tab is open and stops when hidden, and is a plain canvas loaded after the first screen. The road and lot spots are scenery: the rules still have no grid, roads or adjacency (D-033). Placeholder art starts from Kenney's Tiny Town (CC0) and free villager sprites, chosen and recoloured toward D-028's look in the M2b workshop; every pack's link and licence is recorded before use (SAFE-05).
- **Why:** Morgan: "I'd like more graphically pleasing actual view of the town and people walking or moving around it. Kind of like project Vulcan", "I just like seeing some animation showing things happening". He chose each part on round 1, and an art workshop first ("We will need to do a full workshop on this").

## D-038 M2d: the Town tier, more buildings, push methods

- **Status:** Accepted (2026-11-14), final page. Amends D-026's counts and moves the Town tier from M5b (was M4b).
- **Decision:** M2d adds lots with a character (D-033), the Town tier, 3 new buildings and 2 new goods (chosen in M2d's mock-up), and push methods (D-032). v0.1 content targets become 16 buildings and 11 resources.
- **Why:** Morgan asked for "more tiers and buildings" and longer chains, picked this size, and said yes to push methods after finding choices "almost too straight forward"; D-032 builds them when the M1 test finds the town mechanical.

## D-039 M2a spec approved: leaving gap and the Upgrade row

- **Status:** Accepted (2026-11-14) by Morgan on the spec page (https://claude.ai/artifact/REo95ymqF2GDq5MqtMpzTz, "Approved, start building"). Amends D-025's leaving rule.
- **Decision:** A resident leaves at most once every 672 ticks (`content.rules.leaveGapTicks`, 2 h 48 min real), not once a season. Each Town tab building row that can grow shows an Upgrade button and a line with the next tier's cost or, in ember, what is missing (option B); the button opens the building sheet, whose first section is the upgrade. Autosave and the away card stay at 10 real minutes (40 ticks). Test tick lengths stay 50 ms to 60 s. Spec: `docs/specs/m2a-pace.md`.
- **Why:** At 15 s an 8-hour hungry night is 1,920 ticks: with a season gap it cost 8 of 20 residents and the town did not recover; with 672 it costs 3 and recovers (prototype runs, 2026-11-14). Morgan picked "Yes, one per 672 game hours" and "B: the button and its cost" (mock-up https://claude.ai/artifact/7xmvYWD4xV6fu36M5X69BH).

## D-040 M2e Choices: always something to choose

- **Status:** Accepted (2026-11-14) by Morgan on the final page (https://claude.ai/artifact/FJuq2TKb8gmPAfcEbdymhQ, "Approved, start building"), after round 1 (https://claude.ai/artifact/HdpkiWhhZkeEPV2FLgAFKg) and a review with round 2 (https://claude.ai/artifact/2zZSib54mLApaC8wtUfJXG). Amends D-035 (a new step) and the charter's content targets.
- **Decision:** A new step, M2e Choices, is built now while Morgan runs the M2b art workshop. A board on the Town tab holds three kinds of card. Goals: three on offer, the player picks one, its progress shows, and finishing it pays a bundle of goods worth about an hour of the town's work, then three new goals appear. The trader: a new swap offer about every real hour (240 ticks), paying in a good the town is short of for one it has; at most 3 offers wait; each lasts longer than the catch-up cap in force (D-018); accepting sets the goods aside at once and the payment arrives a game day later; declining costs nothing. Forage trips: send 2 residents to the forest edge for a game day; their jobs stand empty and they bring back a random mix of goods. Pinned residents get a pin label by the name and a Pinned filter on the People tab. Gold waits for caravans in M3 (D-027). D-025 stays: energy-gated tap actions are dropped. Counts, rule types and screens are set in the M2e spec; each new condition or effect type gets its own entry. Events with choices come right after M2e. Test: over two days of check-ins, every check-in offers at least one real choice, and Morgan says whether he wants to keep playing.
- **Why:** Morgan, starting the M2a test town: "There is nothing I can actively just do", pointing at DragonScape Idle. On the forms he picked every kind of activity but kept D-025 ("things to do are choices, not taps"), wanted "something at every check-in", put goals and delivery requests first, and wants trips, collecting and upgrading, a board to pick from and lots to look at, but not "endless tapping", "a pushy mobile-game feel" or "annoyingly slow progress".


## D-041 The game's art: Kenney tiles in the Ashwick palette

- **Status:** Proposed (2026-11-14). Morgan approved the look on the M2b round 3 page ("Yes, with my palette pick"); this entry becomes Accepted when he approves the Design canvas (https://claude.ai/artifact/MS4YKVneBzq2RyfBSBPN9J), after which `mockups/town-art.html` is brought in line with it. Amends D-037 (the town view's layout and art).
- **Decision:** The town view, icons and board card pictures are built from Kenney's Tiny Town and Tiny Dungeon tiles (CC0), repainted colour for colour into the Ashwick palette: 70% Moss and 30% Faded ink (the table: `docs/workshop/ashwick-palette.json`). The Skarthorn's trees use a darker, colder table than the town's. The town view fills the Town screen and pans both ways, opening on the Hall and the square in front of it; lots sit close and organic around the square and down the south road, on gritty dirt roads, with the north road entering the Skarthorn through a lantern-lit gate. The square holds the notice board, which opens the board (D-040), and shows seasons and festivals. The mood is subtly haunted woods (mist, dead trees, crows, an old graveyard) under a duskier grade, and each building carries detail (ivy, moss, lanterns, trade signs, clutter). Built lots show no glow until tapped, then glow gold; empty lots carry a soft pale glow; the yards around built lots are dressed (doorsteps, paths and props particular to each building). Staked future lots show where the Village grows. The town is laid out like a real one: a High Street from the south up to the square, a cross street with lots fronting it, lanes to the edge lots, a stream with a bridge, hedgerows and low walls between plots, lamp posts, gardens and an orchard. Each building looks better at each tier: tier 2 adds a stone footing, window boxes, a fenced yard and a lean-to; tier 3 builds bigger with a garden, a hedge and lanterns. Tiles show at 1.5 times their size (24 px per tile on screen). The screens keep D-028's lantern colours (the slate set was cut). The Town tab runs: a compact header with the stock (an icon per good) and the "now" bar (the first job in the work queue with its progress), then the town view filling the rest, then the tab bar. Each board card kind has a picture header built from the same tiles. The map is the main way in: every lot on it is a button that opens its sheet, and an empty plot carries a Build marker that opens the build sheet; an "All lots" list below the board is the second way. The tab bar at the bottom uses picture buttons (an icon over a short label, 76 px tall). No AI-generated art. Every asset's source and licence is recorded before it ships (SAFE-05).
- **Why:** Morgan, M2b workshop rounds 1 to 3: cut all sketched icon styles ("I need to see higher quality mockups to choose"), "i like the kenney look but modified", daylight but "too bright" and "a new art style", "mix of moss and faded ink but mostly moss", the Hall "should stand out more", "still too crowded", "zoom out a little bit more", and "scrollable to the left and right to see the whole town and like the center would be the main building and then just buildings out left and right from there". He kept the lantern screens, the pinned now bar, the icons and the card pictures. After the mock-up: "i want the symbol buttons on the bottom. makes them easier to touch" and "i need to be able to click lots on the map. I want that to be the main way to like be able to interact with things"; shown on the Design canvas https://claude.ai/artifact/MS4YKVneBzq2RyfBSBPN9J.

## D-042 The Square as a town work

- **Status:** Proposed (2026-11-14). Not decided: Morgan asked for the square to be upgradable; the stages and costs are set at the planning of the milestone that builds town works.
- **Decision (proposed):** D-033's Well becomes the Square, keeping town works at 4. Stage 1: the well on packed earth. Stage 2: flagstones, lanterns, benches and the notice board (the board of D-040 opens from it). Stage 3: a fountain, market stalls and trees. Seasons and festivals show on the square. Shown on the Design canvas https://claude.ai/artifact/MS4YKVneBzq2RyfBSBPN9J (Upgrades).
- **Why:** Morgan: "I want upgrades to make things look nicer and I want the square to be upgradable as well for some reason". The well already stands in the square, so the Well work and an upgradable square are one thing.

## D-043 Dedicated sites and the Tangle

- **Status:** Accepted (2026-11-14) by Morgan on the sites form (`sites1`, https://claude.ai/artifact/3xXuw4Rf4Jdi5AQHjmLbpf). Amends D-033's lie of the land (kept for town lots only) and adds to M2d (D-038). Rules, counts and costs are set in the M2d spec; each new condition or effect type gets its own entry.
- **Decision:** Every building that gathers a basic resource stands on a dedicated site of its kind instead of a town lot: the Woodcutter's camp at the forest edge, the Mine in the mountain, the Farm on the fields, the Forager's hut in the woods, and a Fisher's hut on the river if M2d adds one. Sites do not count toward the Hall's lot limit; town lots are for everything else. A town has one site of each kind to start, and more open at the Village. Town lots keep D-033's character (good soil, riverside and so on); sites are their own thing. The town is ringed by the Tangle, overgrowth cleared by a job in the work queue (pay, wait, it opens; no tapping, D-025). Clearing opens new town lots, dedicated sites and special sites, and yields wood and other goods. The Tangle and clearing arrive in M2d; special sites' buildings come later with the tech and magic tree. The south stays clear: a road in and out.
- **Why:** Morgan: "I want certain core buildings to have dedicated lots to them. Like for basic resource gathering" and "Anything that gets a basic resource"; "I like being surrounded by something that like gets removed to unlock more areas and like lots and even like specific like tar pits ... niche specific sites like that with special buildings for helping advance in the tech tree / magic later"; "the bottom needs to be clear so there is a road in and out". He picked every recommended option.
