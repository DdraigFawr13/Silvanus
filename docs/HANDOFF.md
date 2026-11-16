# Handoff

Updated: 2026-11-16 (target picture round 3, branch `m2b-target3`). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M2 re-planned on 2026-11-14 (D-035 to D-038; PR #13, which also synced AI-Master-Instructions v4.15.0). M2 is now four steps: M2a Pace, M2b Art workshop, M2c Town view, M2d Ceiling and lots. M2a merged on 2026-11-14 (PR #14, spec `docs/specs/m2a-pace.md`); next is Morgan's M2a test, then M2b. M1 is done (S1 to S5, audit and fixes, PRs #5 to #12); its test (J14) led to the re-plan. Mock-ups: `mockups/town.html`, `mockups/people.html`; the phone is 412 px wide.

## Plan map

- ✔ Planning, M0 Skeleton and its audit (D-001 to D-024; PR #3).
- ✔ M1 Town: planning, S1 to S5, audit and fixes (D-025 to D-034; PRs #5 to #12).
- ✔ M1 test (J14) and the M2 re-plan (D-035 to D-038; PR #13).
- ▶ M2a Pace: merged (PR #14); waiting on Morgan's phone test (J7) (D-036, D-039).
- ▶ M2b Art workshop: layout D-047, art direction PixelLab mock-up 1 (D-048); workshop merged so far in PRs #17, #20 and #21. Re-plan in 4 steps (2026-11-16): ✔ 1 requirements checklist (`docs/workshop/art-checklist.md`) · ▶ 2 target picture (building-block test done; waiting on Morgan) · ○ 3 two-method test · ○ 4 short build sessions (D-037).
- ▶ M2e Choices: goals, trader swaps, forage trips, pins (D-040). Spec checked (`docs/specs/m2e-choices.md`, merged in PR #18 on 2026-11-16, still Proposed); waiting on Morgan's approval page (`m2espec`); then the mock-up, S1 to S3.
- ○ M2c Town view (D-037).
- ○ M2d Ceiling and lots: lots with a character, Town tier, 3 buildings, 2 goods, push methods (D-038).
- ○ M3 Guild · ○ M4 Trade outlet, events, chronicle (v0.1) · ○ M5a Families · ○ M5b Paths · ○ M6 Trade and Crown · ○ M7 Depth (v1.0)

## Just done

- 2026-11-16 Art re-plan step 2, rounds 1 and 2 (PR #22, merged 2026-11-16). Round 1: three whole-town tries; Morgan picked C but wants it about twice as big and wider (about 1408 × 888) and the mine on the town's side, no bridge (D-047, M2, M7 amended). Round 2: a 3-tile pixflux test at 2× held the layout but came out brighter and plainer than mock-up 1 (https://claude.ai/artifact/AjsFD3miKr6f6CzydcwdBX). 6 generations used, 1,875 left.
- 2026-11-16 Target picture round 3 on branch `m2b-target3`: `edit_image` reference mode restyled the mine tile with mock-up 1's look (brightness 54 vs 55, edge share 0.233 vs 0.263; pixflux was 65, 0.199). Defects: flat lamp discs, a repeating grass mark, a mesa-like cliff top; joins untested. Page: https://claude.ai/artifact/8A3cqAv7nXHmsKT2rgvgGV. 25 used, 1,850 left.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Morgan's M2a test (J7): a new town, check-ins over a day, the Village in about 8 real hours, upgrades found without help. Record their answer here in their words, then set `docs/specs/m2a-pace.md` to Shipped on the next work branch. Opening their old town first jumps it forward up to 8 real hours.
2. M2e Choices: read Morgan's `m2espec` answers (`ArtifactData` list, collection `m2espec`). On approval: spec Status Approved, D-049 to D-053 into DECISIONS as he decided, then `mockups/board.html` with `ui-mockups`, then S1 on a new branch from `main`.
3. M2b art re-plan (D-037), step 2, AGENTS art rule. Stage 1 of the restyled map paused at 56 (join unrepaired). Morgan asked for building blocks instead; test 1 done (47, 1,747 left): empty ground restyled plus the Hall and two cottages as `create_object_pro_flash` assets, page https://claude.ai/artifact/J9Pu6R4bj94MLYjpAYjvzx. Waits for Morgan's pick: recommended, the whole target picture by blocks, capped at 375, first stage about 77; or finish the painted stage 1 (18); a Codex brief (free) with either. Ask before spending. The PixelLab token is a network secret on the "Network" cloud environment. Still open: D-041 Proposed and partly superseded; `m2b-art-workshop` can be deleted with Morgan's OK.
4. Still open: Morgan's phone tests from S1 and S2 ("Update ready" and Reload; build a Woodcutter's camp, close the app, come back), S3 (switch the Mine to stone; let the Workshop run out of ore overnight) and S4 (pin someone to a bad job and read why morale falls). Record answers here.
5. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
6. Phobos (D-054): nothing to build here yet. Phobos tunes content offline after M2e ships and opens normal PRs; a net enters `packages/sim` only after it beats the rule it replaces.
7. Factions planning (D-054): round 1 answered 2026-11-14 (5 factions, one standing each, off-screen wars, none fall, a drawn map with pins, plain rules first, one clan in M3; ways and success test left open). Review and round 2 (`factions-review1`) published, reviewer $0.57 measured. Next: read it with one `ArtifactData` list when Morgan says "factions review done", then the final page. Planning only; M2e stays next for building.

## Open questions

- Whether gold pays for building from M3 (D-027, proposed; settled at M3's planning).
- Whether the Town tier counts 24 real hours away (M1 audit F18; M2d). Settlers arrive aged 20 until M5a sets ages (F22). D-034's prices are judged again after M2a (F19).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf
- M2 re-plan round 1 (`m2r1`): https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2 · Review (`m2review1`): https://claude.ai/artifact/2KcwbeGPg47mn2rZvEbVYx · Final (`m2final`): https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG
- M2e spec check (`m2espec`): https://claude.ai/artifact/7sCHDMu36YxScF5DSp6rn9
- M2b art checklist (`artreq1`): https://claude.ai/artifact/JPNjVV94KuDzqzNfQQtqzY · Agreed list: https://claude.ai/artifact/8ivWjfn17NLzUWBFZG2ba6
- Phobos ideas: https://claude.ai/artifact/T1D4NsM1RRARVsxYvqbjB9 · Factions round 1 (`factions1`): https://claude.ai/artifact/5b2MDpvaSXAD7gwuX7U4Y4 · Review and round 2 (`factions-review1`): https://claude.ai/artifact/1Srtak3r52ErqMJRkiAQVn
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-16 Morgan asked to test building blocks (ground plus PixelLab assets, then smoothing) and picked the 45-generation test.
- 2026-11-16 Morgan on the restyle test: "Go with recommended": the whole map by `edit_image` reference restyle, in stages, capped at 390 generations.
- 2026-11-16 Morgan fixed the town map at 1024 × 768 art pixels with zoom steps 1×, 2×, 3× (D-047 amended).
- 2026-11-16 Morgan agreed the art checklist (`artreq1`): no Tangle ring drawn but clearing stays (D-043), special sites toward the edges (D-044), a swamp east of the river and no waterfall (D-047), any tool that matches mock-up 1's mood (D-048).
- 2026-11-14 D-054 Phobos integration plan accepted (Morgan: "Ok let's start with what you say"); factions on a wider map to be planned ("I just want the generic faction managed").
