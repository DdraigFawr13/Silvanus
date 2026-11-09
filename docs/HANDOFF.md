# Handoff

Updated: 2026-11-09. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M0 Skeleton, building. Spec approved 2026-11-09 (D-024): `docs/specs/m0-skeleton.md`.

## Plan map

- ✔ Planning: charter, rounds 1 to 5, review, final page (D-001 to D-023).
- ✔ M0 spec approved; Vercel project `silvanus` created and linked (D-024).
- ✔ M0 slice S1 merged and deployed (373c7c9) at https://silvanus-xi.vercel.app; Morgan's phone check outstanding.
- ▶ M0 slice S2, it remembers.
- ○ M0 slice S3, install it and carry it
- ○ M1 Town · ○ M2 Guild · ○ M3 Trade outlet, events, chronicle (v0.1)
- ○ M4a Families · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-09 S1 built by the `implementer` agent and reviewed: `npm run check` passes in 4.7 s (10 tests, soak 10,000 ticks, entry script 69,080 bytes gzipped against 80,000); phone-width run at `?tickMs=200` showed tick 25, food 7, no console errors. CI and the Vercel build have not run yet.
- 2026-11-09 Spec approved and merged to `main`. `vercel.json` turns deployments off until S1 replaces it.
- 2026-11-09 Toolchain prototype (scratch, not committed): vite 8.3.7, react 19.3.1, vite-plugin-pwa 2.0.0, typescript 7.0.2 with npm workspaces and a worker install, type-check and build; bare first-load script 68.71 kB gzipped.

## Next

1. S2 "It remembers" on a new branch from `main`, after a zero-decision check of the sections S2 touches.
2. Morgan's device check of S1 at https://silvanus-xi.vercel.app/?tickMs=1000 is outstanding; record what he reports.
3. This session cannot open pull requests; approval happens in chat. CI runs can be read with `gh api repos/DdraigFawr13/Silvanus/commits/<sha>/check-runs`.

## Open questions

- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe

## Decisions since the last plan update

- 2026-11-09 D-001 to D-024, see `docs/DECISIONS.md`.
