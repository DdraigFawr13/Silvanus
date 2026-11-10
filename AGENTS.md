# Agent instructions

Silvanus is a single-player fantasy frontier-town management idle sim, played on an Android phone as a PWA. It is Morgan's personal hobby project.

Shared rules come from AI-Master-Instructions and load through CLAUDE.md (`.claude/master/RULES.md`). This file holds only what is specific to this project. Keep it under 80 lines.

## Read first

1. `docs/HANDOFF.md`: current state and next step.
2. `docs/DECISIONS.md`: settled rules. Don't reopen them.
3. `docs/LESSONS.md`: entries for the area you are about to work in.
4. `docs/UI_STYLE.md`: the look, tokens and the new-screen checklist. Read before any screen work.
5. `docs/CHARTER.md`: design and scope. Open only the section the task needs; "Content targets" is the scope cap and "Milestones" has each exit criterion.

## Local checks (run before pushing)

- `npm run check` (about 5 s measured on 2026-11-10, target under 60 s). In order: master sync drift check, test-traps, Prettier check, types (`tsc` on sim, content, web, root), engine purity, Vitest, soak, build, bundle size (gzipped entry at most 80,000 bytes). No lint (see the M0 spec).
- `npm run test:browser` before a PR is marked ready (about 15 s, 8 Playwright tests; not in CI). In cloud sessions set `PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium` if the session hook left it unset.
- Under a different default Node, prefix with `npm exec --yes --package=node@24.19.0 --package=npm@11.9.0 --`.

## What CI runs

- `.github/workflows/ci.yml`: one job, `npm ci` then `npm run check`, skipped on draft PRs, not run for changes under `docs/` only.
- `prune-merged-branches.yml` (synced) deletes merged PR branches.

## Project rules

- One session takes one milestone and stops at its exit criterion in the charter. Why: each milestone ends with a test Morgan runs on the phone.
- A feature outside the charter's content targets goes to `docs/parking.md`, not into code. Why: three parent games each bring a full feature list.
- `packages/sim` has no DOM, no framework, integer arithmetic only and a named random stream per system. Why: offline catch-up must equal live play tick for tick (D-002).
- A new condition or effect type in the content schema needs a DECISIONS entry. Why: that set is the engine's real interface.
- No runtime network or LLM calls in the shipped game (D-003).
- Every change keeps the soak script passing once it exists.

## Overrides

Master rules this project deliberately changes. Each line names the rule id and the reason; the same entry is in `.ai-master.json` "overrides".

- None.
