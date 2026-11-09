# Silvanus: project charter

As of 2026-11-09, after planning rounds 1 to 5 and the review round. This file is the home of the plan. Settled choices are in `DECISIONS.md`; this file cites them by id and does not restate their reasons.

Silvanus is a single-player fantasy frontier-town management idle game for an Android phone. The player builds on open lots, steers residents into trades, equips and sends out adventurers, and sells what the town makes. The town of Ashwick stands under a writ from the Crown of Dunmere at the edge of the Skarthorn, a deep forest rich in magical materials and full of monsters.

## The session this game is built for

Morgan's words (round 5): "I want to see what resources were gathered and where quests are in their progress. I'd want to assign or give out any gear or items that had been created and maybe put other goods in a caravan to send off to some other town that buys certain goods for higher than normal and then I might want to start some upgrades or find promising recruits or see if I can build any special buildings to unlock new classes of adventurers or town functions or trade goods".

v0.1 passes when that check-in works end to end on the phone (D-016).

## Pillars

- **Decisions, not placement.** Building is choosing what takes the next open lot. No grid, roads or adjacency.
- **Idle with a pulse.** The town works while the app is closed. A check-in is: read what happened, hand things out, send things off, start something.
- **People are records, not agents.** Every resident is an individual with a trade, skills, traits, a family and a history, and one morale value. No needs, moods, schedules or movement are simulated (D-017).
- **The town has a direction.** Charters open and close buildings, trades and events.
- **Story falls out of the state.** The chronicle renders what the rules produced. Nothing is narrated that did not happen.

Non-goals through v1.0: town layout or a map view; played or shown fights (D-011); needs, moods or schedules for residents; runtime AI or any network call (D-003); multiplayer, accounts, cloud saves, monetization, an app-store release.

## Lineage

Read from the three repos on 2026-11-09. Silvanus overlaps all three and stays lighter than each (D-011).

- Story-Generator (built, playable): carried over are the chronicle that renders real event records, people who are born, marry, age and die, and its content tables (D-012). Left behind: world generation, history, the map, kingdoms.
- Adventure Manager (in build): carried over are the roster, quests and reports. Left behind: played fights, adventurer careers, rival guilds.
- Project-Vulcan (built, playable): carried over are indirect control, a deterministic engine in a Web Worker, named random streams and its phone lessons. Left behind: the tile map, pathfinding, real time with pause.
- Pantheon and the caravan concept: threat clocks, and caravans as timed trips to towns that pay more.

## Setting

- **Ashwick** is the town, founded under a writ from the **Crown of Dunmere**. The names are built from Story-Generator's syllable table (D-022).
- **The Skarthorn** is the forest. It has three depth bands, the Eaves, the Deepwood and the Heart, each richer and deadlier than the last. Sites inside a band are found by scouting.
- **The Crown** expects a yearly levy of forest goods and grants or withdraws favor. It arrives in M5.
- **Peoples** come from Story-Generator's table: Human, Elf, Dwarf, Fomori, Giant, Halfling, Goblin, Orc. v0.1 has humans and dwarves; v1.0 has four. A people gives leanings, never restrictions. All share one lifespan (D-013).
- **Magic is a craft.** Forest materials are high-tier resources; enchanters and alchemists are ordinary trades (D-008).
- **A forest faction** arrives with the Deepwood (D-014).

## Time

- 1 tick is 1 game hour and 60 s of real time. A game day is 24 minutes, a season is 7 game days, a game year is 11 h 12 min (D-002).
- Offline catch-up runs `min(elapsed, cap)` ticks through the same step function as live play. The cap is 480 ticks (8 h) at the start and 1,440 ticks (24 h) after civic upgrades. Elapsed time below zero counts as zero.
- **Decisions wait for the player (D-018).** Every decision's deadline is longer than the current catch-up cap, so each one is on screen at one check-in at least. A party that asks a question camps until it is answered or the deadline passes; then its risk posture answers.
- **Events queue.** At most 5 events wait for a decision. While 5 wait, no new event is drawn.
- No tap rewards. No hard loss: decline is recoverable (D-007).
- A resident comes of age at 16 game years (7 d 11 h real) and lives about 65 (30 d 8 h real). Both are tuning values.

## Systems

### Lots and buildings

- The town is a list of lots. A Hamlet has 6 lots and up to 25 residents; a Village has 10 and 60; a Town 16 and 100; a City 24 and 150. Hamlet and Village are in v0.1.
- A building has a category, tiers, worker slots, recipes (inputs, outputs, ticks, governing skill) and upkeep. Tier 3 is a permanent branch point, from M4b.
- Special buildings unlock an adventurer class, a town function or a trade good. v0.1 has one, which unlocks a fourth class.

### Economy and gear

- Resources are integers in three layers: raw (food, wood, stone, ore, herbs, forest materials), goods (tools, weapons, potions, cloth, ale) and abstract (gold, renown).
- Stock is capped by storage; overflow is lost.
- **Gear (D-019).** Common gear is stock that a party draws from. Fine and magical pieces are named items with a maker and a quality. The player hands a named item to an adventurer, who has 3 gear slots.

### Residents

- Each resident has a name, a people, an age, a trade and rank, skills on a 0 to 100 scale, 2 to 3 traits, family ties, one morale value and a history.
- **Arrivals (D-020).** Once per game day a settler arrives if a home is free and food is in surplus. Births arrive in M4a.
- **Jobs (D-005).** Residents fill building quotas by skill and trait. Any resident can be pinned. A bad fit costs morale and can become an event (D-013).
- **Recruits.** A list shows residents and arrivals whose skills and traits suit adventuring.
- **Families, from M4a (D-004).** Marriage, children, aging, death and inheritance. The inbox asks about notable matches and heirs (D-013). The save holds age and family fields from M0.

### Adventurers and quests

- Adventurers are residents who took up arms, and outsiders who lodge at the tavern (D-006). Each has a class, skills, traits, 3 gear slots, a condition and a rank.
- **Rank** is a label from 1 to 5 derived from skill. It adds nothing by itself in v0.1; whether ranks get bigger jumps is revisited after the first playtest (D-021).
- **The player writes the quest:** a site, an objective (scout, clear, gather in v0.1), provisions and a risk posture.
- **Staffing.** v0.1 has one way: the player picks the party (D-019). Posted bounties come later.
- **Resolution** runs off-screen in stages: travel, 2 to 4 encounters, return. No fight is shown (D-011). Each stage is a check on the quest's own random stream.
- **Reports** list loot, injuries, deaths and discoveries, and go into the chronicle.
- An ignored site escalates. An overrun site fills a threat clock; a full clock means a raid.

### Trade

- v0.1 has one buyer town. It pays a fixed premium for some goods. A caravan is a timed trip that carries goods out and gold back.
- M5 adds more partners, prices that react, rumours, escorts, and the Crown's levies and favor.

### Events and chronicle

- An event is data: conditions, a weight, 2 to 4 choices, outcomes and a deadline answer. v0.1 has 12, drawn about once per 3 game days, and none repeats within a game year.
- Known weak point: played without a break, a real week draws about 140 events, 11.7 per event (computed). More events arrive from M4b.
- Every significant state change emits a typed record. Templates render records to prose. Full entries are kept for 20 game years, then one digest line per year (proposed tuning value).

### Town paths, from M4b

- v1.0 has two charters, Guild and March (D-015). Market, Forge, Arcane and Faith come after v1.0.
- Capstones: the Guild's is a party that reaches a Heart site and returns. The March's is holding the wall through a great raid with no one lost. Play continues after a capstone.

## Content targets

These counts are the scope cap.

- Buildings: 12 in v0.1, 45 in v1.0. Special buildings: 1, then 8.
- Resources: 8, then 20. Trades: 8, then 30. Skills: 6, then 12. Traits: 12, then 40.
- Peoples: 2, then 4. Resident cap: 60, then 150.
- Adventurer classes: 3 plus 1 unlocked, then 8. Quest objectives: 3, then 6.
- Forest bands: 1, then 3. Sites: 6, then 25.
- Events: 12, then 120. Chronicle templates: 40, then 300.
- Trade partners: 1, then 5. Charters: 0, then 2. Policies: 0, then 6.

## Technical approach

- **Platform (D-001).** A PWA in TypeScript, React and Vite, installed from Chrome on Android. npm workspaces (D-010).
- **`packages/sim`** is pure TypeScript: no DOM, no clock, no `Math.random`, integers only. Its contract is `step(state, commands) -> { state, log }`. Each system draws from its own named random stream, so new content in one system does not shift another's draws.
- **`packages/content`** holds every building, trade, event, site and template as typed data checked at build time. The closed set of condition and effect types is the engine's real interface.
- **`apps/web`** has five tabs (Town, People, Guild, Trade, Chronicle), an inbox sheet that opens from any tab, a store holding the latest state, and a Web Worker that runs ticks.
- **Saves.** IndexedDB with a version and upgrade steps. Autosave every 10 ticks in live play and none during catch-up. The page keeps a standby copy and writes it when hidden, because a worker is terminated on unload before it can answer (Project-Vulcan lesson, 2026-10-18). The app asks the browser for persistent storage and refuses to load a save newer than its code. Export and import as a JSON file from M0.
- **Hosting.** One fixed address, because saves are tied to it. Vercel is proposed (D-022); creating the project needs Morgan's approval at M0.
- **Verification.** A headless soak plays 10,000 ticks with a random-policy bot, checks invariants and prints a balance report. From M4a it plays 100,000 ticks, which is 148.8 game years and more than two lifespans.

## Milestones

Each ends with a build on the phone and a test Morgan runs. One session takes one milestone.

1. **M0 Skeleton.** Workspace, tick loop, named random streams, saves with age and family fields, standby copy, clamp on elapsed time, persistent-storage request, export, PWA shell, hosting, soak, CI. Test: install on the phone; a counter survives closing with the right catch-up.
2. **M1 Town.** Lots, 12 buildings at 3 tiers, 8 resources, residents as records, 2 peoples, automatic jobs with pin, arrivals, Hamlet to Village. Test: 20 minutes of play with real trade-offs; the soak passes.
3. **M2 Guild.** Recruits list, 3 classes, 6 Eaves sites, quest writing, picked parties, gear, decisions that wait. Test: a quest resolves while the phone is closed and its report reads well.
4. **M3 Trade outlet, events, chronicle.** One buyer town and caravans, one class-unlocking building, 12 events, 40 templates. Test: the check-in at the top of this file, end to end. **This is v0.1.**
5. **M4a Families.** Marriage, children, aging, death, inheritance, heirs in the inbox, biography pages, the long soak.
6. **M4b Paths.** Guild and March charters, 6 policies, Town tier, building branches, the Deepwood and its faction, posted bounties.
7. **M5 Trade and Crown.** Partners, reactive prices, rumours, escorts, levies and favor.
8. **M6 Depth.** City tier, the Heart, capstones, content to v1.0 counts, art and sound. **This is v1.0.**

## Risks

- **Scope drift.** Three parent games each bring a full feature list. Control: the content targets, `docs/parking.md`, and v0.1 ending at M3.
- **A roster too large to manage.** 150 residents on a phone. Control: automatic jobs, list filters, the recruits list, and only residents who need a decision reaching the inbox.
- **The idle economy diverges.** Control: the soak and balance report from M0, storage caps, integers.
- **Flat prose.** Templates repeat. Control: trait and context slots, the one-year repeat rule, more events from M4b.
- **Save loss.** Control: export from M0, persistent storage, upgrade steps with a test each.
- **Generations pass too fast to follow.** Played without a break, a day is 2.14 game years. Control: judged at the M4a playtest; the tick length is the lever.

## Open

- What happens to Adventure Manager is Morgan's call; this repo changes nothing there.
- The other two peoples for v1.0.
- Whether ranks get bigger jumps (after the first playtest, D-021).
