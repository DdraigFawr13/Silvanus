# Handoff

Updated: 2026-11-10. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M0 Skeleton is built, merged and deployed; its exit test on Morgan's phone is outstanding. M1 Town is in planning on branch `m1-town-plan`: round 1 form published 2026-11-10, waiting for Morgan's answers. No M1 spec and no M1 code yet. Spec approved 2026-11-09 (D-024): `docs/specs/m0-skeleton.md`.

## Plan map

- ✔ Planning: charter, rounds 1 to 5, review, final page (D-001 to D-023).
- ✔ M0 spec approved; Vercel project `silvanus` created and linked (D-024).
- ✔ M0 slice S1 merged and deployed (373c7c9) at https://silvanus-xi.vercel.app; Morgan's phone check outstanding.
- ✔ M0 slice S2, it remembers: approved by Morgan 2026-11-09 and merged (PR #1); his phone check is outstanding.
- ✔ M0 slice S3, install it and carry it: approved by Morgan 2026-11-10 and merged (PR #2); his phone check (J9) is outstanding.
- ▶ M1 Town: planning. Round 1 form out; then round 2 (taste board, mock-ups), review, spec, Morgan's approval, build slices.
- ○ M2 Guild · ○ M3 Trade outlet, events, chronicle (v0.1)
- ○ M4a Families · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 M1 session started. Deployed commit checked (CI-05): Vercel's newest production deployment is READY at 4f80ea0, and the live page shows "Version 4f80ea0" with no console errors. Round 1 form published; it asks for the M0 phone results, the audit answer and the town's rules. It raises three conflicts in the charter: the M1 test ("20 minutes") is 20 ticks, under one game day; v0.1's 8 resources cannot hold everything M1 to M3 need; the 12 buildings must leave room for M2's guild buildings.
- 2026-11-10 S3 built in the main session: the PWA plugin (manifest, service worker), two icons from `scripts/make-icons.mjs`, `importText`, `storageAnswer`, Export and Import with the in-page confirm on the main page and the refused-save screens, the Storage line. `npm run check` passes in about 5 s (20 tests, entry script 71,102 bytes gzipped); `npm run test:browser` passes 8 tests in 15 s; the 4 new ones failed before the code, and 3 planted bugs each failed a test. The zero-decision check found no question for Morgan; the small defaults taken are in the spec's "S3 build notes". No fresh reviewer has read the diff. Morgan approved it on 2026-11-10 and asked for M1 to start in a new session.
- 2026-11-09 S2 built in the main session: `saves.ts` (IndexedDB, `parse`, `load`, `save`, `exportText`), the one-window lock, load at start, autosave, save on hide, the two refused-save screens. `npm run check` passes in about 3 s (17 tests, entry script 70,388 bytes gzipped); `npm run test:browser` passes 4 tests in 12 s, and all 4 failed with three planted bugs. Deviations are in the spec's "S2 build notes". A fresh reviewer read the diff: 3 fixes taken (refused lock request, "Saved at tick" after a load and out-of-order writes), 4 findings left as accepted by the spec.
- 2026-11-09 S1 built by the `implementer` agent and reviewed: `npm run check` passes in 4.7 s (10 tests, soak 10,000 ticks, entry script 69,080 bytes gzipped against 80,000); phone-width run at `?tickMs=200` showed tick 25, food 7, no console errors. CI and the Vercel build have not run yet.
- 2026-11-09 Spec approved and merged to `main`. `vercel.json` turns deployments off until S1 replaces it.
- 2026-11-09 Toolchain prototype (scratch, not committed): vite 8.3.7, react 19.3.1, vite-plugin-pwa 2.0.0, typescript 7.0.2 with npm workspaces and a worker install, type-check and build; bare first-load script 68.71 kB gzipped.

## Next

1. When Morgan says "round 1 done": read collection `m1round1` on the round 1 page (`ArtifactData` list, limit 200), every note with its answer. Record his M0 phone results here (ids `m0_s1`, `m0_s2`, `m0_j9a`, `m0_j9b`, `m0_storage`, `m0_swipe`) and act on `m0_audit`; don't run the audit unasked.
2. Then the `planning-interview` flow: adversarial review and review page, round 2 with the taste board (`ui-style`) and mock-ups (`ui-mockups`), final approval page, DECISIONS entries, then `write-spec` from its step 3. No build slice before Morgan approves the spec.
3. Charter edits wait for his answers: the M1 test wording, the 8 resources, the building count in M1.
4. Not checked: how Android Chrome answers the persistent-storage request for an installed PWA, and whether swiping the installed app away counts as closing it (asked on the form).

## Open questions

- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR

## Decisions since the last plan update

- 2026-11-09 D-001 to D-024, see `docs/DECISIONS.md`.
