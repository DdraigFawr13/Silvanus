# Handoff

Updated: 2026-11-17 (target picture approved; M2e spec approved). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M2 re-planned on 2026-11-14 (D-035 to D-038; PR #13, which also synced AI-Master-Instructions v4.15.0). M2 is now four steps: M2a Pace, M2b Art workshop, M2c Town view, M2d Ceiling and lots. M2a merged on 2026-11-14 (PR #14, spec `docs/specs/m2a-pace.md`); next is Morgan's M2a test, then M2b. M1 is done (S1 to S5, audit and fixes, PRs #5 to #12); its test (J14) led to the re-plan. Mock-ups: `mockups/town.html`, `mockups/people.html`; the phone is 412 px wide.

## Plan map

- ✔ Planning, M0 Skeleton and its audit (D-001 to D-024; PR #3).
- ✔ M1 Town: planning, S1 to S5, audit and fixes (D-025 to D-034; PRs #5 to #12).
- ✔ M1 test (J14) and the M2 re-plan (D-035 to D-038; PR #13).
- ▶ M2a Pace: merged (PR #14); waiting on Morgan's phone test (J7) (D-036, D-039).
- ▶ M2b Art workshop: layout D-047, art direction PixelLab mock-up 1 (D-048); workshop merged in PRs #17, #20 to #23. Re-plan in 4 steps (2026-11-16): ✔ 1 requirements checklist (`docs/workshop/art-checklist.md`) · ✔ 2 target picture (D-055, 2026-11-17) · ○ 3 method: Morgan approved PixelLab for assets (D-055); whether a separate test is still needed is open · ○ 4 short build sessions (D-037).
- ▶ M2e Choices: goals, trader swaps, forage trips, pins (D-040, D-049 to D-053). Spec and board mock-up approved 2026-11-17; next S1 to S3.
- ○ M2c Town view (D-037).
- ○ M2d Ceiling and lots: lots with a character, Town tier, 3 buildings, 2 goods, push methods (D-038).
- ○ M3 Guild · ○ M4 Trade outlet, events, chronicle (v0.1) · ○ M5a Families · ○ M5b Paths · ○ M6 Trade and Crown · ○ M7 Depth (v1.0)

## Just done

- 2026-11-17 Morgan approved the M2e board mock-up ("Approved"); spec "Web" and "Slices" updated with its wording and the extra Hamlet goals. PR #26.
- 2026-11-17 Morgan approved the target picture (D-055) on the map page https://claude.ai/artifact/Qp25MdMLv74XmFa5FxAskf (answered in chat, the page holds no answers): "as for direction it is good and creating assets in pixel lab is approved"; spots to fix later, first the Hall's path, which leads to the square's gate instead of into the square. PR #24 (Codex repairs to the older stage-B map) closed as superseded.
- 2026-11-17 Morgan approved the M2e spec in chat: "go with recommended for all" (all four `m2espec` calls; the page itself holds no answers). D-049 to D-053 accepted; spec Status Approved.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Morgan's M2a test (J7): a new town, check-ins over a day, the Village in about 8 real hours, upgrades found without help. Record their answer here in their words, then set `docs/specs/m2a-pace.md` to Shipped on the next work branch. Opening their old town first jumps it forward up to 8 real hours.
2. M2e Choices S1 (Goals): spec `docs/specs/m2e-choices.md` slice S1, on a new branch from `main`; the board mock-up was approved 2026-11-17 (https://claude.ai/artifact/NgdEzBBvKhj7FrP2ivPYXU, PR #26). S1 also adds Hamlet goals until soak pass 2 offers 3 at every check-in (see the spec's Slices).
3. M2b art (D-037, D-055): the fix list for the target map, starting with the Hall path into the square, then the art checklist's partly met items; then step 4's build sessions with PixelLab assets. AGENTS art rule. PhotoCraft is on Morgan's PC (reachable from a desktop session). About 1,265 PixelLab generations left. Still open: D-041 Proposed and partly superseded; `m2b-art-workshop` can be deleted with Morgan's OK.
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
- M2e spec check (`m2espec`): https://claude.ai/artifact/7sCHDMu36YxScF5DSp6rn9 · Map approval (`artmap1`): https://claude.ai/artifact/Qp25MdMLv74XmFa5FxAskf
- M2b art checklist (`artreq1`): https://claude.ai/artifact/JPNjVV94KuDzqzNfQQtqzY · Agreed list: https://claude.ai/artifact/8ivWjfn17NLzUWBFZG2ba6
- Phobos ideas: https://claude.ai/artifact/T1D4NsM1RRARVsxYvqbjB9 · Factions round 1 (`factions1`): https://claude.ai/artifact/5b2MDpvaSXAD7gwuX7U4Y4 · Review and round 2 (`factions-review1`): https://claude.ai/artifact/1Srtak3r52ErqMJRkiAQVn
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-16 Morgan moved the target picture to a block map: painted empty ground plus separate PixelLab buildings (test, then "1 go ahead"), in stages; after stage A: move the river farther right, fix the mine cliffs, 350 more approved; after stage B: "Do as you recommend", the river not cut off, cap raised by 60; then "Finish the map. Then work to get more things checked off the list"; then two minimal fix passes (seams, lamps, roads, no clipping). Earlier the same day: the restyled single picture ("Go with recommended"), now paused.
- 2026-11-16 Morgan fixed the town map at 1024 × 768 art pixels with zoom steps 1×, 2×, 3× (D-047 amended).
- 2026-11-16 Morgan agreed the art checklist (`artreq1`): no Tangle ring drawn but clearing stays (D-043), special sites toward the edges (D-044), a swamp east of the river and no waterfall (D-047), any tool that matches mock-up 1's mood (D-048).
- 2026-11-14 D-054 Phobos integration plan accepted (Morgan: "Ok let's start with what you say"); factions on a wider map to be planned ("I just want the generic faction managed").
