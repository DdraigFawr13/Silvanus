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
- **Decision:** The town is Ashwick, the forest the Skarthorn, the backer the Crown of Dunmere. The second people in v0.1 is the Dwarf. v1.0 ships the Guild and March charters only. Hosting on Vercel is proposed; the project is created only with Morgan's approval at M0.
- **Why:** Delegated as D-016. The names and the people had no recommendation on the form; they are Claude's picks and cheap to change. Amends D-015.

## D-023 Plan approved

- **Status:** Accepted (2026-11-09)
- **Decision:** Morgan approved the plan in `docs/CHARTER.md`: "Approved, start building" on the final page (https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv) and "Approved" in chat. Adventure Manager pauses now; nothing in its repo is changed from here.
- **Why:** The owner's approval covers the platform, the stack and the step order (WS-02). Hosting is asked again at M0 (D-022).

## D-024 M0 spec approved; hosting on Vercel

- **Status:** Accepted (2026-11-09)
- **Decision:** Morgan approved `docs/specs/m0-skeleton.md` ("Approved, start building", https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe). Hosting is Vercel; at his request Claude created the project `silvanus` (id `prj_wddGMCfTiMi9txEVpWxadbxtlUmD`, team `golden-goose-engineering-group`), linked to this repo, production branch `main`. M0's one page needs no mock-up; mock-ups start with M1. The Web Worker stays in M0.
- **Why:** Morgan's answers on the spec page. The address must not change later because saves are tied to it.
