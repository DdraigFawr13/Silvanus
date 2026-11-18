# Handoff

Updated: 2026-11-18 (M2c spec approved, D-057, merged in PR #30; M2b fix 2 merged, PR #29; dressed yards approved and merged in PR #34; M2d spec approved, D-058 to D-061, merged in PR #31). A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M2 re-planned on 2026-11-14 (D-035 to D-038; PR #13, which also synced AI-Master-Instructions v4.15.0). M2 is now four steps: M2a Pace, M2b Art workshop, M2c Town view, M2d Ceiling and lots. M2a merged on 2026-11-14 (PR #14, spec `docs/specs/m2a-pace.md`); next is Morgan's M2a test, then M2b. M1 is done (S1 to S5, audit and fixes, PRs #5 to #12); its test (J14) led to the re-plan. Mock-ups: `mockups/town.html`, `mockups/people.html`; the phone is 412 px wide.

## Plan map

- ✔ Planning, M0 Skeleton and its audit (D-001 to D-024; PR #3).
- ✔ M1 Town: planning, S1 to S5, audit and fixes (D-025 to D-034; PRs #5 to #12).
- ✔ M1 test (J14) and the M2 re-plan (D-035 to D-038; PR #13).
- ▶ M2a Pace: merged (PR #14); waiting on Morgan's phone test (J7) (D-036, D-039).
- ▶ M2b Art workshop: layout D-047, art direction PixelLab mock-up 1 (D-048); workshop merged in PRs #17, #20 to #23. Re-plan in 4 steps (2026-11-16): ✔ 1 requirements checklist (`docs/workshop/art-checklist.md`) · ✔ 2 target picture (D-055, 2026-11-17) · ○ 3 method: Morgan approved PixelLab for assets (D-055); whether a separate test is still needed is open · ○ 4 short build sessions (D-037).
- ▶ M2e Choices: goals, trader swaps, forage trips, pins (D-040, D-049 to D-053, D-056). S1 to S3 merged in PR #27 (2026-11-17); waiting on Morgan's phone check (J9).
- ▶ M2c Town view: spec approved (D-057, PR #30); next S1 starts with a ui-mockups mock-up Morgan approves before code.
- ▶ M2d Ceiling and lots: spec approved (D-058 to D-061, PR #31); next S0 mock-up, then S1 to S4 in one PR.
- ○ M3 Guild · ○ M4 Trade outlet, events, chronicle (v0.1) · ○ M5a Families · ○ M5b Paths · ○ M6 Trade and Crown · ○ M7 Depth (v1.0)

## Just done

- 2026-11-18 Coordinator mode: this session starts every slice in a new session (never by extending a finished one; LESSONS), 2 at a time, and alone edits HANDOFF. Running: dressed yards (session_01Dr9VTrKjWJ1t4ySHVSHGue, Network, cap 45) and M2c S1 (session_01Dr9VTqtWCYZ2mnEaeppPzQ, branch `claude/m2c-s1-map`, mock-up form first). Queued: M2d S0 mock-up; Morgan: "start m2d s0 after yards" (AGENTS coordinator rule). PR #32 (the rule) merged.
- 2026-11-18 M2b dressed yards (Morgan: "Approved"; PR #34): 6 cottage and farm yards dressed with PixelLab props, each its own piece via `place.py`; the map's own full-size fisher's hut moved to the far bank with its jetty and boat (the 64 px hut was too small). 35 generations used of the 45 cap. Scored 29 met, 15 partly, 1 missed, 10 carried (M10 up). Page: https://claude.ai/artifact/39MAdcU21akaCkTaRzzUeu
- 2026-11-18 M2d spec approved on the form (`m2dspec`): "Approved, start with the mock-up"; Town at 32 to 48 h (not the recommended band), 24 h catch-up, 100 residents (charter cap raised), Fisher's hut, Watermill, Brewery, planks, ale. PR #31.
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. Morgan's M2a test (J7): a new town, check-ins over a day, the Village in about 8 real hours, upgrades found without help. Record their answer here in their words, then set `docs/specs/m2a-pace.md` to Shipped on the next work branch. Opening their old town first jumps it forward up to 8 real hours.
2. M2e J9 (Morgan, phone): check in over two days; every check-in should offer a real choice; record whether he wants to keep playing, in his words, then set the spec to Shipped on the next work branch. Saves move to schema 4 on first open.
3. M2b art (D-037, D-055): the working target is `result_4_grown.png` (dressed yards, scored in `result4_scores.json`; script `art/handoff_chatgpt/yards/yards.py`). Next: Morgan chooses whether to dress the 5 bare cottages from the props already made (free); the far bank already has the hut's jetty. Then step 4's build sessions with PixelLab assets. AGENTS art rule. PhotoCraft is on Morgan's PC (reachable from a desktop session). PixelLab balance 1,230 generations (2026-11-18). Still open: D-041 Proposed and partly superseded.
4. Still open: Morgan's phone tests from S1 and S2 ("Update ready" and Reload; build a Woodcutter's camp, close the app, come back), S3 (switch the Mine to stone; let the Workshop run out of ore overnight) and S4 (pin someone to a bad job and read why morale falls). Record answers here.
5. M2d S0 (`docs/specs/m2d-ceiling-lots.md`): a `ui-mockups` mock-up of the lot picker, Tangle, Town row and a push method; Morgan approves before S1. S3 likely raises the Town's cost.
6. M2c S1 (`docs/specs/m2c-town-view.md`): a `ui-mockups` mock-up of the map window first (start from `art/m2c/preview.py`), Morgan approves, then build. Check `m2cview1` answers first.
7. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
8. Phobos (D-054): nothing to build here yet. Phobos tunes content offline after M2e ships and opens normal PRs; a net enters `packages/sim` only after it beats the rule it replaces.
9. Factions planning (D-054): round 1 answered 2026-11-14 (5 factions, one standing each, off-screen wars, none fall, a drawn map with pins, plain rules first, one clan in M3; ways and success test left open). Review and round 2 (`factions-review1`) published, reviewer $0.57 measured. Next: read it with one `ArtifactData` list when Morgan says "factions review done", then the final page. Planning only; M2e stays next for building.

## Open questions

- Whether gold pays for building from M3 (D-027, proposed; settled at M3's planning).
- Settlers arrive aged 20 until M5a sets ages (F22). D-034's prices are judged again after M2a (F19).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf
- M2 re-plan round 1 (`m2r1`): https://claude.ai/artifact/3uADUApzUZwnny2PqCwnz2 · Review (`m2review1`): https://claude.ai/artifact/2KcwbeGPg47mn2rZvEbVYx · Final (`m2final`): https://claude.ai/artifact/2Q9JF8itCsoKPXsS8h8YaG
- M2e spec check (`m2espec`): https://claude.ai/artifact/7sCHDMu36YxScF5DSp6rn9 · M2d spec form (`m2dspec`): https://claude.ai/artifact/1hdoqGcMCifpeQHN7pR8dB · Map approval (`artmap1`): https://claude.ai/artifact/Qp25MdMLv74XmFa5FxAskf
- M2b art checklist (`artreq1`): https://claude.ai/artifact/JPNjVV94KuDzqzNfQQtqzY · Agreed list: https://claude.ai/artifact/8ivWjfn17NLzUWBFZG2ba6
- Phobos ideas: https://claude.ai/artifact/T1D4NsM1RRARVsxYvqbjB9 · Factions round 1 (`factions1`): https://claude.ai/artifact/5b2MDpvaSXAD7gwuX7U4Y4 · Review and round 2 (`factions-review1`): https://claude.ai/artifact/1Srtak3r52ErqMJRkiAQVn
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-18 D-058 to D-061 M2d: plots, push methods, the Town tier, three buildings and two goods.
- 2026-11-18 D-057 M2c spec approved: map window at the top of the Town tab, sites first then plots, stand-in pieces and walkers.
- 2026-11-17 D-056 the Village asks for a full Hamlet (25) and full base stores (200 wood, 200 stone, 50 tools).
