# Handoff

Updated: 2026-11-09. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Planning. No code exists. The plan is `docs/CHARTER.md`; it is not yet approved for building.

## Plan map

- ✔ Charter drafted and four workshop rounds answered (16 decisions, D-001 to D-009).
- ✔ Repo bootstrapped with AI-Master-Instructions v4.12.0 (D-010).
- ▶ Planning round 5 form published; waiting for Morgan's answers (collection `round5`).
- ○ Morgan approves the plan.
- ○ M0 Skeleton: npm workspace, tick loop, seeded generator, saves, PWA shell, soak script, CI.
- ○ M1 Town, M2 Guild, M3 Events and chronicle (v0.1), then M4 to M6 (v1.0).

## Just done

- 2026-11-09 Charter exported to `docs/CHARTER.md`; starter files written; first commit pushed to `main`.
- 2026-11-09 Read adventure-manager (gate 1, 233 decisions): it overlaps Silvanus's guild. How the two relate is the first question of round 5. The charter's Lineage row for it was a guess.
- 2026-11-09 Read Story-Generator and Project-Vulcan: both built and playable. Story-Generator plans a steward mode (its Phase 8); Vulcan copied its content tables (its V-008). Charter Lineage corrected; round 5 gained `sg_rel`, `world_src` and `tiers`.

## Next

1. When Morgan says "round 5 done", read the answers from https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG (collection `round5`), then run the adversarial review round (`planning-interview` skill).
2. After approval, write the M0 spec with the `write-spec` skill.

## Open questions

- Names for the town, the forest, the Crown and the peoples' cultures. Placeholders stand until chosen.
- Lifespans: one shared figure (assumed) or a span per people.
- Family life: observed only, or steered (matchmaking, naming heirs).
- The capstone goal for each of the six charters.
- Whether a resident can refuse a pinned job.
- Whether forest peoples or spirits exist as a faction.
- The charter's adventurer power tier 1 to 5 conflicts with Story-Generator's never-build list (round 5, `tiers`).
- The four peoples (humans, dwarves, elves, halflings) are an assumption (round 5, `world_src`).
- D-003 (no runtime LLM) is Proposed; confirm it.

## Decisions since the last plan update

- 2026-11-09 D-001 to D-010, see `docs/DECISIONS.md`.
