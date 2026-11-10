# Handoff

Updated: 2026-11-10. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M1 Town is being built from `docs/specs/m1-town.md` (approved, D-030), five slices. S1 "Safe saves and updates" is merged (PR #5; Morgan: "Approved open s2 in a new session"). S2 "Stock, lots and the Town tab" is merged (PR #6; Morgan: "you have approval to merge and create the next slice"). S3 "Production methods and the away card" is merged (PR #8; Morgan: "Approved please merge the. Start a new session for s4"), with Morgan's change D-034 (a building buys a method once). The Town mock-up is `mockups/town.html` (https://claude.ai/artifact/6k9547asTCDNHmfobt6Hym); the phone is 412 px wide (Morgan). Next is S4, in a new session. M0 is done and passed on Morgan's phone.

## Plan map

- ✔ Planning and M0 Skeleton (D-001 to D-024); M0 audit merged (PR #3), all 19 findings accepted.
- ✔ M1 planning: round 1, review, taste board, style doc, spec (D-025 to D-030).
- ✔ M1 S1 Safe saves and updates (PR #5).
- ✔ M1 S2 Stock, lots and the Town tab (PR #6).
- ✔ M1 S3 Production methods and the away card (PR #8; D-034).
- ▶ S4 People: next, in a new session.
- ○ S5 Growth and the Village (then the M1 test, J14).
- ○ M2 in two sessions (D-033). Town half first: lots with a character, standing orders, forecast and ledger, a practised crew, push methods if the M1 test asks. Then the guild half: the guild, staged reports, the first raid (D-029) with its clock as a sign, the Palisade.
- ○ M3 Trade outlet, events, chronicle (v0.1), plus signs, deeds, named foes, gold hiring a second crew, three more town works (D-032, D-033).
- ○ M4a Families, plus foremen and apprentices and heirlooms · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 S3 session started on `m1/s3-methods-away` from `main` at `bbe90b1`. Deployed commit checked after S2: the live bundle at https://silvanus-xi.vercel.app carried `bbe90b1` and the manifest had its `id` (CI-05). `npm run check` passes on that commit.
- 2026-11-10 S3 built on `m1/s3-methods-away` (PR #8). Morgan approved the mock-up after one change: a building buys a method once, then switches quickly for free; a bought method belongs to its building (his answer). Recorded as D-034; saves are now schema 3 and older towns upgrade on load. `npm run check` passes (55 unit tests; first load 88,646 bytes gzipped); 20 browser tests pass. The fresh diff review found 0 high, 2 medium, 5 low, all fixed. The built screens match the mock-up pixel for pixel.
- 2026-11-10 S3 zero-decision check (fresh agent, 156,343 tokens): no gap for Morgan beyond wording; defaults in the spec's "Build notes", S3. `mockups/town.html` gained an S3 section of real-screen screenshots from a throwaway prototype, republished at https://claude.ai/artifact/6k9547asTCDNHmfobt6Hym (fresh check 141,047 tokens: 9 points, 6 fixed, 3 left with reasons; lint 0 warnings). S3's tests are written and fail on S2's code (5 engine, 2 browser); they wait uncommitted for the code.
- 2026-11-10 S2 built on `m1-s2-town`: schema 2 town, engine (build, queue, jobs, production by first methods, eating), Town tab, build and building sheets, soak pass 1. `npm run check` passes (47 unit tests; first load 86,152 bytes gzipped of 120,000) and so do the 17 browser tests. The 20 new engine and content tests were seen to fail on S1's engine first. Screens were looked at on a production build at 412 px and 360 px beside the mock-up. Choices are in the spec's "Build notes", S2.
- 2026-11-10 Fun ideas, two rounds in a separate session (docs only, PR #7). Morgan approved 6 additions in round 1 (D-032) and 7 town-management additions in round 2 (D-033). They change M2, M3 and M4a; M1 is untouched. The charter's first pillar, content targets and milestone lines are amended. Work is estimated at 10.5 slices in all, about two extra build sessions before v0.1.
- 2026-11-10 S2 session started. Deployed commit checked after S1: the live bundle at https://silvanus-xi.vercel.app carried `ed1ed3d` and the manifest had its `id` and three icons (CI-05). `mockups/town.html` drafted at 412 px and 360 px (lint: 0 warnings). The zero-decision check on S2 found no gap that needed Morgan; its defaults are in the spec's "Build notes", S2. The mock-up's fresh check found 9 points: 6 fixed, 3 left with reasons (the page's check record).
- 2026-11-10 S1 built in a new session. The zero-decision check on S1 found no gap that needed Morgan and about 17 small choices, recorded in the spec's "Build notes". `npm run check` passes (31 unit tests; first load 73,927 bytes gzipped of 120,000) and so do the 12 browser tests. Each new check was seen to fail first; the five that pass at once were each seen to fail under a planted bug. The worker-crash notice was checked by hand. A fresh review of the diff found 0 high, 2 medium and 5 low: 4 fixed, 3 declined (spec build notes).
- 2026-11-10 Deployed commit checked before S1: the live bundle carried `7c13532` (CI-05).
- 2026-11-10 M1 planned in one session. Morgan answered round 1, then delegated the review's and the audit's recommendations ("Go with your recommendations"), picked the Lantern look, placed raids in M2 and approved the spec in advance ("I approve the m1 spec once you are done"). He has not read the spec.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. S4 "People" from the spec, on a new branch from the latest `main`, in a new session (Morgan, 2026-11-10: "Start a new session for s4"). First the zero-decision check on S4 against what S3 merged (the spec's "Build notes", S3), then `mockups/people.html`, approved by Morgan before code. Write the slice's tests before its code. S4 makes the worker effect use skill and morale (`production.ts`'s `EFFECT`). `methods.test.ts` sets its residents to skill 50 and morale 50, an effect of 100, so its numbers hold. J9 pins the Workshop's short ticks (471, 555) from seed 1's real residents; S4 moves them, so read the new ticks from a probe and keep the assertion exact.
2. After S3 merged, check the Version line at https://silvanus-xi.vercel.app equals the merge commit (CI-05) and record it here, if this session did not.
3. After each slice merges, check the Version line at https://silvanus-xi.vercel.app equals the merge commit (CI-05), and give Morgan the slice's "Morgan tries" line. Still open from S1 and S2: Morgan's phone tests ("Update ready" and Reload after the S2 deploy; build a Woodcutter's camp, close the app, come back). Record his answers here.
4. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
5. M2's planning starts from D-032 and D-033 and the two pages under "Planning pages". The M1 test (J14) also answers three things for it: does the town feel mechanical (push methods), do shortages annoy (parked reserves), do 6 lots feel right.
6. S1 to S5 run in one build session while its context allows; after S5 comes Morgan's M1 test (J14), then offer an audit (VER-09).

## Open questions

- Whether gold pays for building from M3 (D-027, proposed).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-10 D-025 to D-034, see `docs/DECISIONS.md`. D-034 (methods bought once) amends D-025.
