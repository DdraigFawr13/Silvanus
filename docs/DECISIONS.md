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
- **Why:** Morgan's choices. The review found v0.1 then has no population inflow; see HANDOFF.
