# Handoff

Updated: 2026-11-10. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M1 Town is being built from `docs/specs/m1-town.md` (approved, D-030), five slices. S1 "Safe saves and updates" is merged (PR #5; Morgan: "Approved open s2 in a new session"). S2 is under way on branch `m1-s2-town`: its mock-up `mockups/town.html` is drafted and waits for its fresh check and Morgan's approval; no S2 code exists. M0 is done and passed on Morgan's phone.

## Plan map

- ✔ Planning and M0 Skeleton (D-001 to D-024); M0 audit merged (PR #3), all 19 findings accepted.
- ✔ M1 planning: round 1, review, taste board, style doc, spec (D-025 to D-030).
- ✔ M1 S1 Safe saves and updates (PR #5).
- ▶ M1 S2 Stock, lots and the Town tab: mock-up drafted, not yet approved; no code.
- ○ S3 Production methods and the away card · ○ S4 People · ○ S5 Growth and the Village (then the M1 test, J14).
- ○ M2 Guild, with the first raid (D-029) · ○ M3 Trade outlet, events, chronicle (v0.1)
- ○ M4a Families · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 S2 session started. Deployed commit checked after S1: the live bundle at https://silvanus-xi.vercel.app carried `ed1ed3d` and the manifest had its `id` and three icons (CI-05). `mockups/town.html` drafted at 412 px and 360 px (lint: 0 warnings); the zero-decision check on S2 and the mock-up's fresh check were started.
- 2026-11-10 S1 built in a new session. The zero-decision check on S1 found no gap that needed Morgan and about 17 small choices, recorded in the spec's "Build notes". `npm run check` passes (31 unit tests; first load 73,927 bytes gzipped of 120,000) and so do the 12 browser tests. Each new check was seen to fail first; the five that pass at once were each seen to fail under a planted bug. The worker-crash notice was checked by hand. A fresh review of the diff found 0 high, 2 medium and 5 low: 4 fixed, 3 declined (spec build notes).
- 2026-11-10 Deployed commit checked before S1: the live bundle carried `7c13532` (CI-05).
- 2026-11-10 M1 planned in one session. Morgan answered round 1, then delegated the review's and the audit's recommendations ("Go with your recommendations"), picked the Lantern look, placed raids in M2 and approved the spec in advance ("I approve the m1 spec once you are done"). He has not read the spec.
- 2026-11-10 Spec checked by fresh agents: paraphrase, critic and zero-decisions, then a critic and a zero-decisions re-check after the first fix pass. 4 high findings fixed (inputs taken from an empty store, four departures in one night, old jobs forgotten in the jobs pass, a wood dead end). The second fix pass was not re-read by any check.
- 2026-11-10 Numbers sized on a scratch model (not in the repo): a scripted player reached the Village at tick 1,536 with workers at 90%, 1,376 at 100%, 1,708 at 80%.
- 2026-11-10 Deployed commit checked after PR #3: the live page showed "Version 644ed4f" (CI-05).
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. S2 "Stock, lots and the Town tab" from the spec, on a new branch from the latest `main`. First run the zero-decision check on S2 against what S1 merged (the spec's "Build notes" list S1's choices). S1's phone test is still open: Morgan opens the installed app after the S1 deploy, then again after S2's deploy; "Update ready" appears and Reload works.
2. After each slice merges, check the Version line at https://silvanus-xi.vercel.app equals the merge commit (CI-05), and give Morgan the slice's "Morgan tries" line.
3. S2 starts with `mockups/town.html` (`ui-mockups`), approved by Morgan before code. Ask him then to confirm the phone width: `docs/UI_STYLE.md` assumes 412 px first and 360 px second.
4. S1 to S5 run in one build session while its context allows; after S5 comes Morgan's M1 test (J14), then offer an audit (VER-09).

## Open questions

- The phone's width (above). Whether gold pays for building from M3 (D-027, proposed).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf

## Decisions since the last plan update

- 2026-11-10 D-025 to D-031, see `docs/DECISIONS.md`.
