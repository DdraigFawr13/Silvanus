# Handoff

Updated: 2026-11-09. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M0 Skeleton, building. Spec approved 2026-11-09 (D-024): `docs/specs/m0-skeleton.md`.

## Plan map

- ✔ Planning: charter, rounds 1 to 5, review, final page (D-001 to D-023).
- ✔ M0 spec approved; Vercel project `silvanus` created and linked (D-024).
- ▶ M0 slice S1, a ticking counter at a link.
- ○ M0 slice S2, it remembers · ○ M0 slice S3, install it and carry it
- ○ M1 Town · ○ M2 Guild · ○ M3 Trade outlet, events, chronicle (v0.1)
- ○ M4a Families · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-09 Spec approved and merged to `main`. `vercel.json` turns deployments off until S1 replaces it.
- 2026-11-09 Toolchain prototype (scratch, not committed): vite 8.3.7, react 19.3.1, vite-plugin-pwa 2.0.0, typescript 7.0.2 with npm workspaces and a worker install, type-check and build; bare first-load script 68.71 kB gzipped.

## Next

1. Build S1 on branch `m0/s1-counter` from the spec's S1 section. Before building, run the zero-decision check on the sections S1 touches: the spec's last fix pass was not read by a fresh check.
2. This session cannot open pull requests (no GitHub API access). Push the branch, show Morgan the check output and a phone-width screenshot in chat, and merge to `main` on his approval.
3. After the merge, read the Vercel deployment's state and send Morgan the link.

## Open questions

- The production address is known only after the first deployment.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe

## Decisions since the last plan update

- 2026-11-09 D-001 to D-024, see `docs/DECISIONS.md`.
