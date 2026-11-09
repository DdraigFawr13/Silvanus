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

- **Status:** Proposed (assumed from Project-Vulcan's no-API-cost rule; not asked in the workshop)
- **Decision:** The chronicle is rendered from templates. The shipped game makes no network calls.
- **Why:** API cost.

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
