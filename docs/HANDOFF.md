# Handoff

Updated: 2026-11-10. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M1 Town is being built from `docs/specs/m1-town.md` (approved, D-030), five slices. S1 "Safe saves and updates" is merged (PR #5; Morgan: "Approved open s2 in a new session"). S2 "Stock, lots and the Town tab" is merged (PR #6; Morgan: "you have approval to merge and create the next slice"). Its mock-up is `mockups/town.html` (https://claude.ai/artifact/6k9547asTCDNHmfobt6Hym); the phone is 412 px wide (Morgan). Next is S3, in a new session. M0 is done and passed on Morgan's phone.

## Plan map

- ✔ Planning and M0 Skeleton (D-001 to D-024); M0 audit merged (PR #3), all 19 findings accepted.
- ✔ M1 planning: round 1, review, taste board, style doc, spec (D-025 to D-030).
- ✔ M1 S1 Safe saves and updates (PR #5).
- ✔ M1 S2 Stock, lots and the Town tab (PR #6).
- ▶ M1 S3 Production methods and the away card: not started; starts with `mockups/town.html` updated for the methods list and the card.
- ○ S4 People · ○ S5 Growth and the Village (then the M1 test, J14).
- ○ M2 in two sessions (D-033). Town half first: lots with a character, standing orders, forecast and ledger, a practised crew, push methods if the M1 test asks. Then the guild half: the guild, staged reports, the first raid (D-029) with its clock as a sign, the Palisade.
- ○ M3 Trade outlet, events, chronicle (v0.1), plus signs, deeds, named foes, gold hiring a second crew, three more town works (D-032, D-033).
- ○ M4a Families, plus foremen and apprentices and heirlooms · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 S2 built on `m1-s2-town`: schema 2 town, engine (build, queue, jobs, production by first methods, eating), Town tab, build and building sheets, soak pass 1. `npm run check` passes (47 unit tests; first load 86,152 bytes gzipped of 120,000) and so do the 17 browser tests. The 20 new engine and content tests were seen to fail on S1's engine first. Screens were looked at on a production build at 412 px and 360 px beside the mock-up. Choices are in the spec's "Build notes", S2.
- 2026-11-10 Fun ideas, two rounds in a separate session (docs only, PR #7). Morgan approved 6 additions in round 1 (D-032) and 7 town-management additions in round 2 (D-033). They change M2, M3 and M4a; M1 is untouched. The charter's first pillar, content targets and milestone lines are amended. Work is estimated at 10.5 slices in all, about two extra build sessions before v0.1.
- 2026-11-10 S2 session started. Deployed commit checked after S1: the live bundle at https://silvanus-xi.vercel.app carried `ed1ed3d` and the manifest had its `id` and three icons (CI-05). `mockups/town.html` drafted at 412 px and 360 px (lint: 0 warnings). The zero-decision check on S2 found no gap that needed Morgan; its defaults are in the spec's "Build notes", S2. The mock-up's fresh check found 9 points: 6 fixed, 3 left with reasons (the page's check record).
- 2026-11-10 S1 built in a new session. The zero-decision check on S1 found no gap that needed Morgan and about 17 small choices, recorded in the spec's "Build notes". `npm run check` passes (31 unit tests; first load 73,927 bytes gzipped of 120,000) and so do the 12 browser tests. Each new check was seen to fail first; the five that pass at once were each seen to fail under a planted bug. The worker-crash notice was checked by hand. A fresh review of the diff found 0 high, 2 medium and 5 low: 4 fixed, 3 declined (spec build notes).
- 2026-11-10 Deployed commit checked before S1: the live bundle carried `7c13532` (CI-05).
- 2026-11-10 M1 planned in one session. Morgan answered round 1, then delegated the review's and the audit's recommendations ("Go with your recommendations"), picked the Lantern look, placed raids in M2 and approved the spec in advance ("I approve the m1 spec once you are done"). He has not read the spec.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. S3 "Production methods and the away card" from the spec, on a new branch from the latest `main`, in a new session. First the zero-decision check on S3 against what S2 merged (the spec's "Build notes", S2), then the mock-up update, approved by Morgan before code. Write the slice's tests before its code (LESSONS, "spec" S2 measure).
2. After each slice merges, check the Version line at https://silvanus-xi.vercel.app equals the merge commit (CI-05), and give Morgan the slice's "Morgan tries" line. Still open from S1 and S2: Morgan's phone tests ("Update ready" and Reload after the S2 deploy; build a Woodcutter's camp, close the app, come back). Record his answers here.
3. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
4. M2's planning starts from D-032 and D-033 and the two pages under "Planning pages". The M1 test (J14) also answers three things for it: does the town feel mechanical (push methods), do shortages annoy (parked reserves), do 6 lots feel right.
5. S1 to S5 run in one build session while its context allows; after S5 comes Morgan's M1 test (J14), then offer an audit (VER-09).

## Open questions

- Whether gold pays for building from M3 (D-027, proposed).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-10 D-025 to D-033, see `docs/DECISIONS.md`.
