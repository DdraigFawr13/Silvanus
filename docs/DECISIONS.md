# Decisions

Settled rules for this project. Not a changelog: an entry stays while the rule is in force. Change a rule here in the same change that changes the behaviour. Mark ideas Proposed until the owner approves them; mark retired entries SUPERSEDED with a pointer, never delete them.

All entries below were chosen by Morgan in the planning workshop of 2026-11-09 unless marked Proposed.

## D-001 Platform: Android PWA

- **Status:** Accepted (2026-11-09)
- **Decision:** TypeScript, React and Vite, installed from the browser on an Android phone. No app store.
- **Why:** The game is text, lists and numbers with no map. Morgan plays on Android.

## D-002 Time model

- **Status:** Accepted (2026-11-09)
- **Decision:** 1 tick is 1 game hour and 60 s of real time. Offline catch-up runs min(elapsed, cap) ticks through the same step function as live play.
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

- **Status:** Accepted (2026-11-09)
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

- **Status:** Accepted (2026-11-09, delegated)
- **Decision:** The tick stays at 60 s. Every decision's deadline is longer than the current offline cap. At most 5 events wait; while 5 wait, none is drawn.
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

- **Status:** Accepted (2026-11-10; round 1 answers, then delegated)
- **Decision:** M0's exit test passed on Morgan's phone. M1's rules:
  - Homes are buildings on lots. The Hall takes no lot, stands from day 1 and cannot be cleared. Day 1 has 8 founders, the Hall, a Cottage and a Forager's hut.
  - Building and upgrading cost stock and game hours. One job is under way at a time, with a queue of up to 3. A lot can be cleared with no refund, after a confirm on the page.
  - Production methods are the one production system. Each workplace has a basic method with no inputs and up to two higher methods that need a supplied input; tier 2 unlocks the second and tier 3 the third. A workplace short of an input drops to its basic method and never stops. Changing method costs 1 game day of output. There is no separate upkeep.
  - The Mine makes ore or stone by method. No Quarry.
  - Jobs fill automatically; the player sets open slots per building with a stepper and can pin a resident. Skills grow slowly in the skill a job uses. Humans and dwarves arrive at even odds.
  - Settlers join without a choice and the log says who came. Stock banks itself; there is no Collect tap.
  - Morale is moved by food stock, job fit, a crowded home, a tavern and idleness. It changes output mildly, and at very low morale residents leave: at most one per season, and none when the town has 8 or fewer. Both numbers are tuning values.
  - The player starts the Village by upgrading the Hall, at a population and a cost.
  - In M1: the "while you were away" summary, the resident sheet, sort and filter on the people list, a plain dated log. After the first playtest: seasons changing yields, stock forecast, renaming, a balance report page.
  - The soak gains a scripted bot that reports ticks to Village against a target of 2 to 3 real days, and a run that starves the town and checks it recovers.
- **Why:** Morgan's round 1 answers (https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR). On the review page's findings and questions (https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1) he said in chat: "Go with your recommendations". Those items are Claude's recommendations, adopted on that instruction. Production methods are his own request: "something like europa unversalis 5 where I can choose production methods".

## D-026 v0.1 caps and the M1 test

- **Status:** Accepted (2026-11-10; resources by Morgan's answer, the rest delegated as D-025)
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

- **Status:** Accepted (2026-11-10)
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

- **Status:** Accepted (2026-11-10)
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

- **Status:** Accepted (2026-11-10) by Morgan, during the S3 mock-up review. The rule and its owner are his. The prices and the 4 game hours are Claude's proposal on the mock-up, waiting for his approval.
- **Decision:** A method a building has not had before costs stock once, paid when it is chosen, plus 1 game day to set up (`retoolTicks`). After that the building owns it: switching back to an owned method is free and takes 4 game hours (`switchTicks`, one production cycle). What a building owns belongs to that building alone; clearing its lot loses it. Every building owns its methods with no inputs from the start. Content gains a `cost` on each method; a building record gains `owned`, so saves move to schema 3 and an older town's buildings own their free methods and the one they run. Amends D-025's "changing method costs 1 game day".
- **Why:** Morgan, in chat: "I want there to be a cost as well as time to change to a different production method that you didn't have before. Once you have "purchased" a production method, switching takes much less time and you don't have to pay again to do so." Asked whether the town or the building owns a bought method, he chose the building.
