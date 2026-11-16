# Handoff

Updated: 2026-11-16. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M2 re-planned on 2026-11-14 (D-035 to D-038; PR #13, which also synced AI-Master-Instructions v4.15.0). M2 is now four steps: M2a Pace, M2b Art workshop, M2c Town view, M2d Ceiling and lots. M2a merged on 2026-11-14 (PR #14, spec `docs/specs/m2a-pace.md`); next is Morgan's M2a test, then M2b. M1 is done (S1 to S5, audit and fixes, PRs #5 to #12); its test (J14) led to the re-plan. Mock-ups: `mockups/town.html`, `mockups/people.html`; the phone is 412 px wide.

## Plan map

- ✔ Planning, M0 Skeleton and its audit (D-001 to D-024; PR #3).
- ✔ M1 Town: planning, S1 to S5, audit and fixes (D-025 to D-034; PRs #5 to #12).
- ✔ M1 test (J14) and the M2 re-plan (D-035 to D-038; PR #13).
- ▶ M2a Pace: merged (PR #14); waiting on Morgan's phone test (J7) (D-036, D-039).
- ▶ M2b Art workshop: layout D-047 (one wide seamless map that scrolls and zooms), art direction PixelLab mock-up 1 (D-048); workshop so far merged (PR #17); next is planning the seamless map (size, zoom steps, how PixelLab joins it) (D-037).
- ○ M2e Choices: goals, trader swaps, forage trips, pins (D-040). Next in this repo's cloud sessions.
- ○ M2c Town view (D-037).
- ○ M2d Ceiling and lots: lots with a character, Town tier, 3 buildings, 2 goods, push methods (D-038).
- ○ M3 Guild · ○ M4 Trade outlet, events, chronicle (v0.1) · ○ M5a Families · ○ M5b Paths · ○ M6 Trade and Crown · ○ M7 Depth (v1.0)

## Just done

- 2026-11-16 Session on the "Network" environment (PixelLab token works; `/v1/balance` answered 200). Morgan fixed the map size: 1024 × 768 art pixels, zoom steps 1×, 2×, 3× (D-047 amended; the phone's ~2.6 screen pixels per CSS pixel is an assumption to check). Then a 2-generation grow trial (`edit_image_pixen` outpainting from mock-up 1, `art/pixellab/grow1/`): style holds and new-to-new joins hide, but the heart's cut-off buildings still end at a straight line. Trial 2 (`grow2/`, 2 generations): growing from open ground joins cleanly, but repainting mock-up 1's edge leaves a seam. Morgan chose a new centre, then grow; two centre tries (`map1/`) both miss (1 cuts buildings at the edges, 2 is plain and ringed by forest); 20 generations left. Waiting on Morgan's pick.
- 2026-11-15 M2b PixelLab (cloud session, branch `claude/vibrant-davinci-m5m64c`, cut from `m2b-art-workshop`): token is a network secret on the "Network" environment (use PixelLab's "Claude Code" token). Test 1 grass-to-dirt tileset; the town map rebuilt wide (`art/town_wide.py`, D-047 amended four times: scroll, north forest, mine upper right, open south, forest road north-west, organic town, dense north and sparse fringe). Morgan: still not the vibe. Three higher-detail mock-ups (`art/pixellab/mock_hd/`); Morgan picked mock-up 1 as the art direction (D-048, supersedes D-046). Style tests: the same pixen wording holds the style (`art/pixellab/style_test/`). First map strip west/heart/east (`art/pixellab/strip1/`): sections match, joins show; strip 2 hides the joins on a tree belt and the river, colour-matched (`art/pixellab/strip2/_strip_graded.png`). Morgan: "Not perfect but it's ok"; the 3 realism fixes were not run. Goal recorded in D-047: one seamless map that scrolls and zooms (whole town zoomed out). Open: how to make one seamless map in PixelLab (strips join badly; options in the workshop log). 26 generations left. Draft PR: https://github.com/DdraigFawr13/Silvanus/pull/17 (carries all of `m2b-art-workshop`); PR #16's "D-041" clashes with the art D-041, renumber whichever merges second. Working guide: `docs/workshop/pixellab-guide.md`. Details: `docs/workshop/m2b-dragonscape.md`.
- 2026-11-14 M2b art: the town map from the ChatGPT pieces is "not quite there yet" (Morgan); Morgan chose PixelLab and a cloud session. The art workspace moved into `art/` (outputs pixel-identical to the PC copies), `.mcp.json` added (token from `PIXELLAB_API_TOKEN`, never in the repo).
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Morgan's M2a test (J7): a new town, check-ins over a day, the Village in about 8 real hours, upgrades found without help. Record their answer here in their words, then set `docs/specs/m2a-pace.md` to Shipped on the next work branch. Opening their old town first jumps it forward up to 8 real hours.
2. M2e Choices in a new session: spec it with `write-spec` from step 3 (input: D-040 and the `play1`, `play2`, `playfinal` pages), mock-ups first for the board and pins, then build on a new branch from `main`. Mind `m2b-art-workshop` also edits HANDOFF: merge, don't overwrite.
3. M2b Art workshop (D-037), merged so far in PR #17 (https://github.com/DdraigFawr13/Silvanus/pull/17). Size 1024 × 768 and zoom 1×/2×/3× fixed (D-047); two grow trials and two new-centre tries done (6 generations, see the workshop log). Next: Morgan picks how to grow the map (options and costs at the end of `docs/workshop/m2b-dragonscape.md`; 20 trial generations left; read `docs/workshop/pixellab-guide.md` first; ask before every paid call). The PixelLab token is a network secret on the "Network" cloud environment; `.mcp.json` still names `PIXELLAB_API_TOKEN`, which is unset, but the proxy injects the token. Still open: D-041 Proposed and partly superseded by D-048; the UI_STYLE art section waits for the final art. Work on a new branch from `main`; `m2b-art-workshop` is fully contained in `main` after #17 and can be deleted with Morgan's OK.
4. Still open: Morgan's phone tests from S1 and S2 ("Update ready" and Reload; build a Woodcutter's camp, close the app, come back), S3 (switch the Mine to stone; let the Workshop run out of ore overnight) and S4 (pin someone to a bad job and read why morale falls). Record answers here.
5. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
6. Phobos: Morgan will send an integration plan "in the next couple of days" (parked, D-035).

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

- 2026-11-16 Morgan fixed the town map at 1024 × 768 art pixels with zoom steps 1×, 2×, 3× (D-047 amended).
- 2026-11-14 Morgan chose how the art is made (D-045): CC0 artist packs as the base, hand pixels in their style for gaps, Blender for set pieces after several passes.
- 2026-11-14 Morgan picked the special sites (D-044): tar pit, standing stones, distant ruins, sunken bog, salt spring, bat caves; the Hollow Oak parked.
- 2026-11-14 Morgan settled dedicated sites and the Tangle on the sites form (D-043); the Square as a town work (D-042) and the art (D-041) are still Proposed.
- 2026-11-14 Morgan approved M2e Choices (D-040): swaps now, gold in M3; forage trips in; a goal pays about an hour of work; a trader offer about every real hour.
- 2026-11-14 Morgan approved the M2a spec: leaving gap 672 ticks, Upgrade row option B (D-039).
- 2026-11-14 Morgan approved the M2 re-plan ("Approved, start building"): D-035 to D-038.
