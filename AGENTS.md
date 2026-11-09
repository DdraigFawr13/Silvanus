# Agent instructions

Silvanus is a single-player fantasy frontier-town management idle sim, played on an Android phone as a PWA. It is Morgan's personal hobby project.

Shared rules come from AI-Master-Instructions and load through CLAUDE.md (`.claude/master/RULES.md`). This file holds only what is specific to this project. Keep it under 80 lines.

## Read first

1. `docs/HANDOFF.md`: current state and next step.
2. `docs/DECISIONS.md`: settled rules. Don't reopen them.
3. `docs/LESSONS.md`: entries for the area you are about to work in.
4. `docs/CHARTER.md`: design and scope. Open only the section the task needs; "Content targets" is the scope cap and "Milestones" has each exit criterion.

## Local checks (run before pushing)

- None yet: the repo has no code. M0 adds `npm run check` (types, lint, format check, Vitest, soak) and states its time budget here.
- Every push: `node .claude/master/sync.mjs --check`.

## What CI runs

- No project CI yet. M0 adds `ci.yml` from the master template with the `efficient-github-actions` skill, including the sync drift check.
- `prune-merged-branches.yml` (synced) deletes merged PR branches.

## Project rules

- One session takes one milestone and stops at its exit criterion in the charter. Why: earlier projects grew simulation depth before a playable loop.
- A feature outside the charter's content targets goes to `docs/parking.md`, not into code. Why: four parent projects each bring a full feature list.
- `packages/sim` has no DOM, no framework and integer arithmetic only. Why: offline catch-up must equal live play tick for tick (D-002).
- A new condition or effect type in the content schema needs a DECISIONS entry. Why: that set is the engine's real interface.
- No runtime network or LLM calls in the shipped game (D-003).
- Every change keeps the soak script passing once it exists.

## Overrides

Master rules this project deliberately changes. Each line names the rule id and the reason; the same entry is in `.ai-master.json` "overrides".

- None.
