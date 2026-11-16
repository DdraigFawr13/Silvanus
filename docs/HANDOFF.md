# Handoff

Updated: 2026-11-16 (art re-plan step 1). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M2 re-planned on 2026-11-14 (D-035 to D-038; PR #13, which also synced AI-Master-Instructions v4.15.0). M2 is now four steps: M2a Pace, M2b Art workshop, M2c Town view, M2d Ceiling and lots. M2a merged on 2026-11-14 (PR #14, spec `docs/specs/m2a-pace.md`); next is Morgan's M2a test, then M2b. M1 is done (S1 to S5, audit and fixes, PRs #5 to #12); its test (J14) led to the re-plan. Mock-ups: `mockups/town.html`, `mockups/people.html`; the phone is 412 px wide.

## Plan map

- ✔ Planning, M0 Skeleton and its audit (D-001 to D-024; PR #3).
- ✔ M1 Town: planning, S1 to S5, audit and fixes (D-025 to D-034; PRs #5 to #12).
- ✔ M1 test (J14) and the M2 re-plan (D-035 to D-038; PR #13).
- ▶ M2a Pace: merged (PR #14); waiting on Morgan's phone test (J7) (D-036, D-039).
- ▶ M2b Art workshop: layout D-047, art direction PixelLab mock-up 1 (D-048); workshop merged so far in PR #17. Re-plan in 4 steps (2026-11-16): ✔ 1 requirements checklist (`docs/workshop/art-checklist.md`) · ▶ 2 target picture · ○ 3 two-method test · ○ 4 short build sessions (D-037).
- ○ M2e Choices: goals, trader swaps, forage trips, pins (D-040). Next in this repo's cloud sessions.
- ○ M2c Town view (D-037).
- ○ M2d Ceiling and lots: lots with a character, Town tier, 3 buildings, 2 goods, push methods (D-038).
- ○ M3 Guild · ○ M4 Trade outlet, events, chronicle (v0.1) · ○ M5a Families · ○ M5b Paths · ○ M6 Trade and Crown · ○ M7 Depth (v1.0)

## Just done

- 2026-11-16 Art re-plan step 1 (branch `m2b-art-requirements`, cut from `ccr-754ea0b1-ma2ccm` / PR #20, not from `main`): Morgan corrected the requirements checklist on the phone form `artreq1` https://claude.ai/artifact/JPNjVV94KuDzqzNfQQtqzY (source `docs/workshop/forms/artreq1.html`; 64 items, each Keep / Change / Remove with its decision id and Morgan's quote; details in the workshop log). No generations spent (1,881 left).
- 2026-11-16 Earlier the same day: map size and zoom fixed (D-047), grow and inpainting trials, Tier 1 bought, the `map2` map and a phone prototype (https://claude.ai/artifact/ShHtod3JeD9ENsNdfyNAAR). Morgan: "No that still sucks. Can we rethink how we are designing?" The work had drifted from D-041, D-048 and the brief (LESSONS ×2, AGENTS rule). Morgan approved a four-step re-plan: 1 requirements checklist; 2 one approved target picture in mock-up 1's style at 412 px; 3 a two-method test scored on the checklist; 4 short build sessions. Review page: https://claude.ai/artifact/VrSULVpxTb63nqH1YRbjA1.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Morgan's M2a test (J7): a new town, check-ins over a day, the Village in about 8 real hours, upgrades found without help. Record their answer here in their words, then set `docs/specs/m2a-pace.md` to Shipped on the next work branch. Opening their old town first jumps it forward up to 8 real hours.
2. M2e Choices in a new session: spec it with `write-spec` from step 3 (input: D-040 and the `play1`, `play2`, `playfinal` pages), mock-ups first for the board and pins, then build on a new branch from `main`. Mind `m2b-art-workshop` also edits HANDOFF: merge, don't overwrite.
3. M2b art re-plan (D-037). Step 1 done: the agreed checklist is `docs/workshop/art-checklist.md` (55 items; D-043, D-044, D-047, D-048 amended: no Tangle ring drawn, sites toward the edges, a swamp east of the river and no waterfall, any tool that matches mock-up 1's mood). Step 2 next, waiting on Morgan's go: one target picture in mock-up 1's mood at 412 px (lots, glows, day one and grown), scored item by item against the checklist before Morgan sees it; ask before any paid call (1,881 PixelLab generations left on Tier 1; read `docs/workshop/pixellab-guide.md` and the AGENTS art rule first). Branch: `m2b-art-requirements` (PR #21), cut from `ccr-754ea0b1-ma2ccm` (PR #20, not yet merged); merge #20 first, then #21. The PixelLab token is a network secret on the "Network" cloud environment. Still open: D-041 Proposed and partly superseded; the UI_STYLE art section waits for the final art; `m2b-art-workshop` can be deleted with Morgan's OK.
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
- M2b art checklist (`artreq1`): https://claude.ai/artifact/JPNjVV94KuDzqzNfQQtqzY
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-16 Morgan fixed the town map at 1024 × 768 art pixels with zoom steps 1×, 2×, 3× (D-047 amended).
- 2026-11-16 Morgan agreed the art checklist (`artreq1`): no Tangle ring drawn but clearing stays (D-043), special sites toward the edges (D-044), a swamp east of the river and no waterfall (D-047), any tool that matches mock-up 1's mood (D-048).
- 2026-11-14 Morgan chose how the art is made (D-045): CC0 artist packs as the base, hand pixels in their style for gaps, Blender for set pieces after several passes.
- 2026-11-14 Morgan picked the special sites (D-044): tar pit, standing stones, distant ruins, sunken bog, salt spring, bat caves; the Hollow Oak parked.
- 2026-11-14 Morgan settled dedicated sites and the Tangle on the sites form (D-043); the Square as a town work (D-042) and the art (D-041) are still Proposed.
- 2026-11-14 Morgan approved M2e Choices (D-040): swaps now, gold in M3; forage trips in; a goal pays about an hour of work; a trader offer about every real hour.
- 2026-11-14 Morgan approved the M2a spec: leaving gap 672 ticks, Upgrade row option B (D-039).
- 2026-11-14 Morgan approved the M2 re-plan ("Approved, start building"): D-035 to D-038.
