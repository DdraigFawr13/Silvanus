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
- ▶ S4 People: mock-up drafted, waiting for Morgan.
- ○ S5 Growth and the Village (then the M1 test, J14).
- ○ M2 in two sessions (D-033). Town half first: lots with a character, standing orders, forecast and ledger, a practised crew, push methods if the M1 test asks. Then the guild half: the guild, staged reports, the first raid (D-029) with its clock as a sign, the Palisade.
- ○ M3 Trade outlet, events, chronicle (v0.1), plus signs, deeds, named foes, gold hiring a second crew, three more town works (D-032, D-033).
- ○ M4a Families, plus foremen and apprentices and heirlooms · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 S4 session started on `m1/s4-people` from `main` at `bdf7f73`. Deployed commit checked after S3: the live bundle at https://silvanus-xi.vercel.app carried `bdf7f73` and the manifest had its `id` (CI-05). `npm run check` passes on that commit.
- 2026-11-10 S4 zero-decision check (fresh agent, 174,050 tokens): no gap needs Morgan beyond what the mock-up settles. It found that S4 moves seed 1's pinned production numbers beyond J9 (step, content and methods tests); those tests now use residents at skill 50 and morale 50, or exact numbers read from the engine. J9 gains two `setOpen` commands so the Workshop still runs short (ticks 419 and 491). Defaults go in the spec's "Build notes", S4.
- 2026-11-10 S4 prototype built (uncommitted): skills, morale, the worker effect, `pinPreview`, the People tab, the resident sheet and the tab bar. 7 new tests (5 engine, 2 browser) were seen to fail on S3's code; now 60 unit and 22 browser tests pass. `mockups/people.html` drafted from its screenshots (lint 0 warnings); its fresh check is running.
- 2026-11-10 S3 built on `m1/s3-methods-away` (PR #8). Morgan approved the mock-up after one change: a building buys a method once, then switches quickly for free; a bought method belongs to its building (his answer). Recorded as D-034; saves are now schema 3 and older towns upgrade on load. `npm run check` passes (55 unit tests; first load 88,646 bytes gzipped); 20 browser tests pass. The fresh diff review found 0 high, 2 medium, 5 low, all fixed. The built screens match the mock-up pixel for pixel.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. S4 "People" on `m1/s4-people`: Morgan approves `mockups/people.html`, then the prototype becomes the slice (commit, draft PR, fresh diff review, merge after his approval).
2. After each slice merges, check the Version line at https://silvanus-xi.vercel.app equals the merge commit (CI-05), and give Morgan the slice's "Morgan tries" line. Still open from S1 and S2: Morgan's phone tests ("Update ready" and Reload after the S2 deploy; build a Woodcutter's camp, close the app, come back), and S3's, sent 2026-11-10 (switch the Mine to stone and read the cost; let the Workshop run out of ore overnight and read the away card). Record his answers here.
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

- 2026-11-10 D-025 to D-034, see `docs/DECISIONS.md`. D-034 (methods bought once) amends D-025.
