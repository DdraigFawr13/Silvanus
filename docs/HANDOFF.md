# Handoff

Updated: 2026-11-14. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M2 re-planned on 2026-11-14 (D-035 to D-038; PR #13, which also synced AI-Master-Instructions v4.15.0). M2 is now four steps: M2a Pace, M2b Art workshop, M2c Town view, M2d Ceiling and lots. M2a merged on 2026-11-14 (PR #14, spec `docs/specs/m2a-pace.md`); next is Morgan's M2a test, then M2b. M1 is done (S1 to S5, audit and fixes, PRs #5 to #12); its test (J14) led to the re-plan. Mock-ups: `mockups/town.html`, `mockups/people.html`; the phone is 412 px wide.

## Plan map

- ✔ Planning, M0 Skeleton and its audit (D-001 to D-024; PR #3).
- ✔ M1 Town: planning, S1 to S5, audit and fixes (D-025 to D-034; PRs #5 to #12).
- ✔ M1 test (J14) and the M2 re-plan (D-035 to D-038; PR #13).
- ▶ M2a Pace: merged (PR #14); waiting on Morgan's phone test (J7) (D-036, D-039).
- ○ M2b Art workshop: taste board and Town tab mock-up (D-037).
- ○ M2c Town view (D-037).
- ○ M2d Ceiling and lots: lots with a character, Town tier, 3 buildings, 2 goods, push methods (D-038).
- ○ M3 Guild · ○ M4 Trade outlet, events, chronicle (v0.1) · ○ M5a Families · ○ M5b Paths · ○ M6 Trade and Crown · ○ M7 Depth (v1.0)

## Just done

- 2026-11-14 Morgan approved PR #14 ("Approved"); merged by hand once CI was green. M2a built on `m2a-pace`: S1 Pace (`d427645`: 15 s game hours, caps 1,920 and 3,840, 10-minute autosave and away card, leaving gap 672 ticks, content version 3, soak plays hourly check-ins) and S2 Upgrade row option B (`41ea051`). Tests seen to fail first. `npm run check` passed in 5.6 s (81 unit tests; soak Village at 7.40 real hours, hungry night 3 left, back to 20 in 216 ticks; first load 94,685 bytes); 28 browser tests passed in 36.7 s. Built rows match the mock-up at 412 and 360 px.
- 2026-11-14 M2a spec written on branch `m2a-pace`: `docs/specs/m2a-pace.md` (Draft), checked by paraphrase, critic and zero-decision agents, then a re-check (no high left). Measured on a prototype: hourly 5-minute check-ins reach the Village at tick 1,776 (7.40 h) at 15 s, so no retune; an 8-hour hungry night loses 8 of 20 with the season gap and 3 with a 672-tick gap. Mock-up of the Upgrade row (A: button; B: button and cost, recommended): https://claude.ai/artifact/7xmvYWD4xV6fu36M5X69BH. Approval form (`m2aspec`): https://claude.ai/artifact/REo95ymqF2GDq5MqtMpzTz. The option A prototype is in `git stash` on this branch, not committed.
- 2026-11-14 M2 final page (`m2final`) approved: "About 8" real hours to the Village, the Upgrade fix in M2a, push methods in M2d, M2d's size the Town tier plus 3 buildings and 2 goods. Written as D-035 to D-038, with the charter's milestones renumbered (M3 Guild, M4 v0.1, M5a to M7) and its clock figures updated; Phobos parked. PR #13 merged with this.
- 2026-11-14 M1 test (J14) findings and M2 re-plan round 1 answers (`m2r1`): in `docs/archive/handoff-2026-11.md`. In short: the town "felt a little mechanical", wants a view with people moving, faster pacing (15 s game hours, the same real hours away) and a higher ceiling.
- 2026-11-14 M2 re-plan review (`m2review1`): Morgan agreed all 12 findings and the split M2a pace, M2b art workshop, M2c town view, M2d ceiling and lots; guild to M3, v0.1 to the end of M4; Phobos parked ("you will receive a message in the next couple of days giving you plans for integration"); art workshop before the view; ceiling = more buildings and chains plus the Town tier sooner. He didn't find the building upgrades, didn't reach the Village, and found choices "almost too straight forward"; the clicking "just felt too lifeless".
- 2026-11-14 Synced AI-Master-Instructions v4.12.0 to v4.15.0: VER-10 and VER-11 replace WEB-07; the `test-design` skill, its browser-tests page and the `tests.delete` guard updated. No override changes.
- 2026-11-14 Audit fixes merged as `782553d` (PR #12); the live bundle at https://silvanus-xi.vercel.app carries `782553d` (CI-05).
- 2026-11-10 All 25 M1 audit findings fixed (`dd912d7`, `d60d3b1`); `npm run check` passed (77 unit tests; first load 94,492 bytes); 27 browser tests passed.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Morgan's M2a test (J7): a new town, check-ins over a day, the Village in about 8 real hours, upgrades found without help. Record his answer here in his words, then set `docs/specs/m2a-pace.md` to Shipped on the next work branch. Opening his old town first jumps it forward up to 8 real hours.
2. Then M2b Art workshop in a new session (D-037): taste board and Town tab mock-up, no game code.
3. Still open: Morgan's phone tests from S1 and S2 ("Update ready" and Reload; build a Woodcutter's camp, close the app, come back), S3 (switch the Mine to stone; let the Workshop run out of ore overnight) and S4 (pin someone to a bad job and read why morale falls). Record answers here.
4. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
5. Phobos: Morgan will send an integration plan "in the next couple of days" (parked, D-035).

## Open questions

- Whether gold pays for building from M3 (D-027, proposed; settled at M3's planning).
- Whether the Town tier counts 24 real hours away (M1 audit F18; M2d). Settlers arrive aged 20 until M5a sets ages (F22). D-034's prices are judged again after M2a (F19).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf
- M2 re-plan round 1 (`m2r1`): https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2 · Review (`m2review1`): https://claude.ai/artifact/2KcwbeGPg47mn2rZvEbVYx · Final (`m2final`): https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-14 Morgan approved the M2a spec: leaving gap 672 ticks, Upgrade row option B (D-039).
- 2026-11-14 Morgan approved the M2 re-plan ("Approved, start building"): D-035 to D-038.
- 2026-11-10 Morgan: the M1 audit comes before the M1 test (J14) ("Audit before testing in a new session please"). Plan page: https://claude.ai/artifact/JBJXyeY7awmo7p5GHuRL8z.
- 2026-11-10 D-025 to D-034, see `docs/DECISIONS.md`. D-034 (methods bought once) amends D-025.
