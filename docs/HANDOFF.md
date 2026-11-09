# Handoff

Updated: 2026-11-09. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

Plan approved on 2026-11-09 (D-023). M0 Skeleton is being specified; no code exists yet.

## Plan map

- ✔ Planning: charter, rounds 1 to 5, review, final page (D-001 to D-023).
- ▶ M0 Skeleton: spec written and checked (`docs/specs/m0-skeleton.md`, branch `spec/m0-skeleton`); waiting for Morgan's approval (collection `spec-m0`): https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe
- ○ M0 build, one slice per session step.
- ○ M1 Town · ○ M2 Guild · ○ M3 Trade outlet, events, chronicle (v0.1)
- ○ M4a Families · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-09 Plan approved; `plan/round5` merged to `main`.
- 2026-11-09 Toolchain prototype in a scratch folder (not committed): npm workspaces, a Web Worker, vite 8.3.7, react 19.3.1, vite-plugin-pwa 2.0.0 and typescript 7.0.2 install, type-check and build; the bare app's first-load script is 68.71 kB gzipped.

## Next

1. When Morgan says "spec done", read collection `spec-m0`: `host`, `mock`, `worker`, `approve`, `changes`. On approval set the spec's Status to Approved, record the hosting and mock-up answers in DECISIONS, merge `spec/m0-skeleton`.
2. Build M0 in a fresh session, slice S1 first. Run the zero-decision check on the slice's sections before building: the last fix pass was not read by a fresh check.

## Open questions

- Hosting on Vercel is Proposed (D-022); asked in the M0 spec approval.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv

## Decisions since the last plan update

- 2026-11-09 D-001 to D-023, see `docs/DECISIONS.md`.
