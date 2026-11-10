# Handoff

Updated: 2026-11-10. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M0 Skeleton, last slice built and waiting for Morgan's approval. Spec approved 2026-11-09 (D-024): `docs/specs/m0-skeleton.md`.

## Plan map

- ✔ Planning: charter, rounds 1 to 5, review, final page (D-001 to D-023).
- ✔ M0 spec approved; Vercel project `silvanus` created and linked (D-024).
- ✔ M0 slice S1 merged and deployed (373c7c9) at https://silvanus-xi.vercel.app; Morgan's phone check outstanding.
- ✔ M0 slice S2, it remembers: approved by Morgan 2026-11-09 and merged (PR #1); his phone check is outstanding.
- ▶ M0 slice S3, install it and carry it: built on branch `m0-s3-install-and-carry`, draft PR #2 open (https://github.com/DdraigFawr13/Silvanus/pull/2), not approved yet.
- ○ M1 Town · ○ M2 Guild · ○ M3 Trade outlet, events, chronicle (v0.1)
- ○ M4a Families · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 S3 built in the main session: the PWA plugin (manifest, service worker), two icons from `scripts/make-icons.mjs`, `importText`, `storageAnswer`, Export and Import with the in-page confirm on the main page and the refused-save screens, the Storage line. `npm run check` passes in about 5 s (20 tests, entry script 71,102 bytes gzipped); `npm run test:browser` passes 8 tests in 15 s; the 4 new ones failed before the code, and 3 planted bugs each failed a test. The zero-decision check found no question for Morgan; the small defaults taken are in the spec's "S3 build notes". No fresh reviewer has read the diff.
- 2026-11-09 S2 built in the main session: `saves.ts` (IndexedDB, `parse`, `load`, `save`, `exportText`), the one-window lock, load at start, autosave, save on hide, the two refused-save screens. `npm run check` passes in about 3 s (17 tests, entry script 70,388 bytes gzipped); `npm run test:browser` passes 4 tests in 12 s, and all 4 failed with three planted bugs. Deviations are in the spec's "S2 build notes". A fresh reviewer read the diff: 3 fixes taken (refused lock request, "Saved at tick" after a load and out-of-order writes), 4 findings left as accepted by the spec.
- 2026-11-09 S1 built by the `implementer` agent and reviewed: `npm run check` passes in 4.7 s (10 tests, soak 10,000 ticks, entry script 69,080 bytes gzipped against 80,000); phone-width run at `?tickMs=200` showed tick 25, food 7, no console errors. CI and the Vercel build have not run yet.
- 2026-11-09 Spec approved and merged to `main`. `vercel.json` turns deployments off until S1 replaces it.
- 2026-11-09 Toolchain prototype (scratch, not committed): vite 8.3.7, react 19.3.1, vite-plugin-pwa 2.0.0, typescript 7.0.2 with npm workspaces and a worker install, type-check and build; bare first-load script 68.71 kB gzipped.

## Next

1. Morgan approves the S3 draft PR (or asks for changes). Then: write the merged state here, mark the PR ready, run `npm run test:browser` once more, turn on auto-merge, and check the deployed commit equals the merge commit (CI-05; the Version line shows it).
2. After the merge Morgan runs the M0 exit test on the phone at https://silvanus-xi.vercel.app (J9): add to Home screen, open in airplane mode; export a save, clear the site's data in Chrome, import the file. His S1 and S2 phone checks are also outstanding (S2: note the tick, close, wait 5 minutes, read "Caught up 5 ticks"). Record what he reports.
3. S3 ends M0. Offer an audit (`audit` skill, VER-09) before M1 starts. M1 begins with the style doc and mock-ups.
4. Not checked: how Android Chrome answers the persistent-storage request for an installed PWA, and whether swiping the installed app away counts as closing it (spec, "Risks" and "PWA").

## Open questions

- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq

## Decisions since the last plan update

- 2026-11-09 D-001 to D-024, see `docs/DECISIONS.md`.
