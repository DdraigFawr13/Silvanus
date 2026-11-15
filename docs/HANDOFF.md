# Handoff

Updated: 2026-11-14. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M2 re-planned on 2026-11-14 (D-035 to D-038; PR #13, which also synced AI-Master-Instructions v4.15.0). M2 is now four steps: M2a Pace, M2b Art workshop, M2c Town view, M2d Ceiling and lots. M2a merged on 2026-11-14 (PR #14, spec `docs/specs/m2a-pace.md`); next is Morgan's M2a test, then M2b. M1 is done (S1 to S5, audit and fixes, PRs #5 to #12); its test (J14) led to the re-plan. Mock-ups: `mockups/town.html`, `mockups/people.html`; the phone is 412 px wide.

## Plan map

- ✔ Planning, M0 Skeleton and its audit (D-001 to D-024; PR #3).
- ✔ M1 Town: planning, S1 to S5, audit and fixes (D-025 to D-034; PRs #5 to #12).
- ✔ M1 test (J14) and the M2 re-plan (D-035 to D-038; PR #13).
- ▶ M2a Pace: merged (PR #14); waiting on Morgan's phone test (J7) (D-036, D-039).
- ▶ M2b Art workshop: ChatGPT style chosen (D-046), layout D-047, all sheets cleaned into `art/`; next is PixelLab terrain in a cloud session (`docs/workshop/pixellab-handoff.md`) (D-037).
- ○ M2e Choices: goals, trader swaps, forage trips, pins (D-040). Next in this repo's cloud sessions.
- ○ M2c Town view (D-037).
- ○ M2d Ceiling and lots: lots with a character, Town tier, 3 buildings, 2 goods, push methods (D-038).
- ○ M3 Guild · ○ M4 Trade outlet, events, chronicle (v0.1) · ○ M5a Families · ○ M5b Paths · ○ M6 Trade and Crown · ○ M7 Depth (v1.0)

## Just done

- 2026-11-14 M2b art: the town map from the ChatGPT pieces is "not quite there yet" (Morgan); Morgan chose PixelLab and a cloud session. The art workspace moved into `art/` (outputs pixel-identical to the PC copies), `.mcp.json` added (token from `PIXELLAB_API_TOKEN`, never in the repo).
- 2026-11-14 Morgan, starting the M2a test town: "it needs to be clearer who is pinned and who isnt" (People tab shows only " · Pinned" at the end of a row, `apps/web/src/ui/PeopleTab.tsx:110`); "There also isn't really anything to actually do at this point so it's kind of boring. There is nothing I can actively just do. See the game dragonscape for reference to like always having something to do". The second touches D-025 (no Collect tap) and the Avoid list item "any reward for tapping" (`docs/UI_STYLE.md:74`): a direction question, asked in chat.
- 2026-11-14 Morgan chose a planning round on "always something to do" before more game steps, and will run the M2b art workshop themself in a desktop session ("so it can potentially use the artcraft apps"). Round 1 (`play1`): https://claude.ai/artifact/HdpkiWhhZkeEPV2FLgAFKg.
- 2026-11-14 `play1` answers: goals list and delivery requests Now; town orders, push methods, events, guild quests, town works, forecast Soon; keep D-025 (but energy taps also ticked: finding f1); something at every check-in; a new step now; pins as a label and a filter. Review and round 2 (`play2`): https://claude.ai/artifact/2zZSib54mLApaC8wtUfJXG. Recommended there: deliveries as swaps, pick-one-of-three goals, pins, events right after.
- 2026-11-14 `play2` answers: swaps ("but gold would be nice to have"), three goals at a time, events right after this step; wants trips, collecting and upgrading, a board, lots to look at; must not be endless tapping, a pushy mobile-game feel or "annoyingly slow progress". The art session's DragonScape notes are on branch `m2b-art-workshop` (`docs/workshop/m2b-dragonscape.md`). Final page (`playfinal`, step M2e Choices): https://claude.ai/artifact/FJuq2TKb8gmPAfcEbdymhQ.
- 2026-11-14 M2b `art1` answers (second try; the first stayed on the phone): all three sketched icon styles Cut ("I need to see higher quality mockups to choose"); "the kenney look but modified"; VectorCraft, PhotoCraft and CC0 packs, not OpenArt; compact stock bar with icons; a bigger picture on every board card; town light and colours to be shown in round 2. Full answers and art sources: `docs/workshop/m2b-dragonscape.md`. Round 2 (`art2`): https://claude.ai/artifact/LJsptFDjmGwyuDZNs1Qb2s, built from Kenney Tiny Town and Tiny Dungeon (CC0) in `C:\Users\Morgan\CraftWork\silvanus-art`, graded in PhotoCraft.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Morgan's M2a test (J7): a new town, check-ins over a day, the Village in about 8 real hours, upgrades found without help. Record their answer here in their words, then set `docs/specs/m2a-pace.md` to Shipped on the next work branch. Opening their old town first jumps it forward up to 8 real hours.
2. M2e Choices in a new session: spec it with `write-spec` from step 3 (input: D-040 and the `play1`, `play2`, `playfinal` pages), mock-ups first for the board and pins, then build on a new branch from `main`. Mind `m2b-art-workshop` also edits HANDOFF: merge, don't overwrite.
3. M2b Art workshop (D-037): first, the cloud session walks Morgan through connecting PixelLab and makes the first terrain test, as `docs/workshop/pixellab-handoff.md` says (Morgan: "slowly walk me through the process"). Art, scripts and piece index: `art/README.md`. Older plan: Morgan approves or changes the Design canvas https://claude.ai/artifact/MS4YKVneBzq2RyfBSBPN9J (three artboards: the map with tappable lots, interactive; the Mine sheet; a new town building on an empty plot). Then bring `mockups/town-art.html` in line with it (picture tab bar, lot buttons on the map, All lots list) with a new check record. On approval: set D-041 to Accepted, add the art section to `docs/UI_STYLE.md` (palette file, 1.5x tiles, art sources, the now bar), open the PR from `m2b-art-workshop` and merge once green; then M2c builds the moving town from this mock-up. On a change: fix, re-run the fact check and lint, write a new check record, republish to the same link. Workshop answers: `docs/workshop/m2b-dragonscape.md`. Gameplay ideas from the workshop (dailies, festivals, quest-path map, per-hour rates) go to M2e or later planning.
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

- 2026-11-14 Morgan chose how the art is made (D-045): CC0 artist packs as the base, hand pixels in their style for gaps, Blender for set pieces after several passes.
- 2026-11-14 Morgan picked the special sites (D-044): tar pit, standing stones, distant ruins, sunken bog, salt spring, bat caves; the Hollow Oak parked.
- 2026-11-14 Morgan settled dedicated sites and the Tangle on the sites form (D-043); the Square as a town work (D-042) and the art (D-041) are still Proposed.
- 2026-11-14 Morgan approved M2e Choices (D-040): swaps now, gold in M3; forage trips in; a goal pays about an hour of work; a trader offer about every real hour.
- 2026-11-14 Morgan approved the M2a spec: leaving gap 672 ticks, Upgrade row option B (D-039).
- 2026-11-14 Morgan approved the M2 re-plan ("Approved, start building"): D-035 to D-038.
