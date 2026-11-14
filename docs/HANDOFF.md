# Handoff

Updated: 2026-11-14. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M1 Town is built from `docs/specs/m1-town.md` (approved, D-030), five slices, all merged: S1 (PR #5), S2 (PR #6), S3 (PR #8, with D-034), S4 (PR #9), S5 "Growth and the Village" (PR #10; Morgan: "Approved. Merge when ready"). Mock-ups: `mockups/town.html` (https://claude.ai/artifact/6k9547asTCDNHmfobt6Hym) and `mockups/people.html` (https://claude.ai/artifact/R2jofFnKAX6bWhpqKngZcP); the phone is 412 px wide (Morgan). The M1 audit is done (PR #11, all 25 findings accepted). All 25 are fixed and merged (PR #12). Next is Morgan's M1 test (J14). M0 is done and passed on Morgan's phone.

## Plan map

- ✔ Planning and M0 Skeleton (D-001 to D-024); M0 audit merged (PR #3), all 19 findings accepted.
- ✔ M1 planning: round 1, review, taste board, style doc, spec (D-025 to D-030).
- ✔ M1 S1 Safe saves and updates (PR #5).
- ✔ M1 S2 Stock, lots and the Town tab (PR #6).
- ✔ M1 S3 Production methods and the away card (PR #8; D-034).
- ✔ M1 S4 People (PR #9).
- ✔ M1 S5 Growth and the Village (PR #10).
- ✔ M1 audit (PR #11): 25 findings, all accepted.
- ✔ M1 audit fixes: all 25 (PR #12).
- ▶ The M1 test (J14) on Morgan's phone.
- ○ M2 in two sessions (D-033). Town half first: lots with a character, standing orders, forecast and ledger, a practised crew, push methods if the M1 test asks. Then the guild half: the guild, staged reports, the first raid (D-029) with its clock as a sign, the Palisade.
- ○ M3 Trade outlet, events, chronicle (v0.1), plus signs, deeds, named foes, gold hiring a second crew, three more town works (D-032, D-033).
- ○ M4a Families, plus foremen and apprentices and heirlooms · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-14 M1 test (J14), Morgan's first findings: "it felt a little mechanical. I'd like more graphically pleasing actual view of the town and people walking or moving around it. Kind of like project Vulcan"; "look for free art that can work as a placeholder"; "everything is a little slow and boring. I would rather have it go faster with a higher ceiling"; "the rest of the updates will help a lot". This is new evidence against D-009 (text and icons), the charter's no-map-view non-goal and D-002 (60 s ticks). Not yet asked: whether he reached the Village, the hard choice, shortages, 6 lots.
- 2026-11-14 Synced AI-Master-Instructions v4.12.0 to v4.15.0: VER-10 and VER-11 replace WEB-07; the `test-design` skill, its browser-tests page and the `tests.delete` guard updated. No override changes.
- 2026-11-14 Audit fixes merged as `782553d` (PR #12); the live bundle at https://silvanus-xi.vercel.app carries `782553d` (CI-05).
- 2026-11-10 All 25 M1 audit findings fixed (`dd912d7`, `d60d3b1`); `npm run check` passed (77 unit tests; first load 94,492 bytes); 27 browser tests passed.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Plan M2 again with the `planning-interview` skill: its town half is rebuilt around a town view with people moving and faster pacing with a higher ceiling; the guild half follows as planned. Art options found: Project Vulcan's script-drawn sprites (his own, D-011 allows a one-time copy) or Kenney's Tiny Town (CC0). Earlier: send Morgan the M1 test (J14) from the plan page https://claude.ai/artifact/JBJXyeY7awmo7p5GHuRL8z: about 20 minutes of play over check-ins across 2 or 3 days, reaching the Village, noting at least one choice he found hard. Record his findings here (GAME-06).
2. Still open: Morgan's phone tests from S1 and S2 ("Update ready" and Reload; build a Woodcutter's camp, close the app, come back), S3 (switch the Mine to stone; let the Workshop run out of ore overnight) and S4 (pin someone to a bad job and read why morale falls; begun, the fall not yet read). For J14: the date can sit still up to a real minute, which first read to him as stuck. Record answers here.
3. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
4. M2's planning starts from D-032 and D-033 and the two pages under "Planning pages". The M1 test (J14) also answers three things for it: does the town feel mechanical (push methods), do shortages annoy (parked reserves), do 6 lots feel right.

## Open questions

- Whether gold pays for building from M3 (D-027, proposed; settled at M3's planning).
- Whether the charter's 1,440-tick catch-up cap belongs to a later Hall tier (M1 audit F18). Settlers arrive aged 20 until M4a sets ages (F22). J14 judges the pacing to the Village and D-034's prices (F19, F22).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-14 Morgan: re-plan M2 with the town view and faster pacing (picked "Re-plan M2"). D-002, D-009 and the charter's no-map-view non-goal reopen in that planning, not before.
- 2026-11-10 Morgan: the M1 audit comes before the M1 test (J14) ("Audit before testing in a new session please"). Plan page: https://claude.ai/artifact/JBJXyeY7awmo7p5GHuRL8z.
- 2026-11-10 D-025 to D-034, see `docs/DECISIONS.md`. D-034 (methods bought once) amends D-025.
