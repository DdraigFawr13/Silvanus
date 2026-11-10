# Handoff

Updated: 2026-11-10. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M0 Skeleton is done: built, merged, deployed, and its exit test passed on Morgan's phone (his answers, 2026-11-10). M1 Town is in planning on branch `m1-town-plan`: round 1 and the review are settled (D-025 to D-027); round 2 has started with the taste board, which waits for Morgan. No M1 spec and no M1 code yet. Spec approved 2026-11-09 (D-024): `docs/specs/m0-skeleton.md`.

## Plan map

- ✔ Planning: charter, rounds 1 to 5, review, final page (D-001 to D-023).
- ✔ M0 spec approved; Vercel project `silvanus` created and linked (D-024).
- ✔ M0 slice S1 merged and deployed (373c7c9) at https://silvanus-xi.vercel.app; Morgan's phone check: worked (2026-11-10).
- ✔ M0 slice S2, it remembers: approved by Morgan 2026-11-09 and merged (PR #1); his phone check: worked (2026-11-10).
- ✔ M0 slice S3, install it and carry it: approved by Morgan 2026-11-10 and merged (PR #2); M0 exit test J9, both parts: worked (2026-11-10).
- ▶ M1 Town: planning. Round 1 and review settled; taste board out; next mock-ups, spec, Morgan's approval, build slices.
- ○ M2 Guild · ○ M3 Trade outlet, events, chronicle (v0.1)
- ○ M4a Families · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 Morgan: "Go with recommended for audit as well" and "Merge the audit". PR #3 merged to `main` as 644ed4f and merged into this branch. Taste board answered: Lantern at the forest edge Keep, Map table Keep, Woodcut print After, Steward's ledger Cut; density "Middle: stock always visible, buildings scroll"; "One theme only, whichever look I kept". Two Keeps, so he was asked which leads.
- 2026-11-10 Morgan in chat: "Go with your recommendations", and restated the whole loop as the goal (quoted in D-027). Recorded D-025 (M1's rules), D-026 (9 resources, 13 buildings, 9 in M1, the M1 test) and D-027; charter's M1 and M2 lines and content targets amended. Audit Outcome filled on `audit-m0` (all 19 accepted on the same instruction); draft PR #3 is not merged, he has not asked for that. Taste board published: four looks (Steward's ledger, Lantern at the forest edge, Woodcut print, Map table), collection `taste`.
- 2026-11-10 Review page published (12 findings, a 9-row scope list, 5 questions, a draft slice order). My main proposals: production methods as the one system replacing tier recipes, upkeep and recipe choice; a short input drops a workplace to its basic method; leaving slowed to one per season with a floor of 8; Herb garden, Smithy, Apothecary and Guild hall move to M2; the building cap rises to 13; the Mine makes stone by method; the Hall takes no lot; seasons after the first playtest. All are proposals until he replies.
- 2026-11-10 M0 audit done (kind repo, 3 areas, measured $1.39 for the readers): 19 findings, 3 high (saves can land out of order; a failed save is invisible; an installed app cannot take an update). Report on branch `audit-m0`, draft PR open, Outcome pending.
- 2026-11-10 Morgan's round 1 answers read (46 documents, no notes written). M0 on his phone: S1, S2, install and offline, export and import all "Worked"; catch-up after a swipe-away: "Yes"; the Storage line: "Did not look". Audit: "Yes, run it before M1 building starts". Town answers: homes take lots; building costs resources and time; demolish with no refund; tiers give slots and a second recipe; he starts the Village by upgrading the hall; 9 resources (set C, adds stone); all 13 draft buildings kept (the cap is 12); 8 founders with a Hall, Cottage and Forager's hut; a stepper per building; skills grow by working; settlers join without a choice; hunger stops arrivals, lowers morale and makes residents leave; six extras marked Now. In his words he wants Europa Universalis 5 style production methods, and to "collect" and manage "funding"; both need a question in the next round.
- 2026-11-10 M1 session started. Deployed commit checked (CI-05): Vercel's newest production deployment is READY at 4f80ea0, and the live page shows "Version 4f80ea0" with no console errors. Round 1 form published; it asks for the M0 phone results, the audit answer and the town's rules. It raises three conflicts in the charter: the M1 test ("20 minutes") is 20 ticks, under one game day; v0.1's 8 resources cannot hold everything M1 to M3 need; the 12 buildings must leave room for M2's guild buildings.
- M0's slice entries (S1 to S3, spec approval, toolchain prototype) are in `docs/archive/handoff-2026-11.md`.

## Next

1. When Morgan says which look leads (Lantern or Map table): write `docs/UI_STYLE.md` (`ui-style`, "Write the style") from that sample's values in the taste board's source, one theme, middle density; record the look in DECISIONS; then mock-ups (`ui-mockups`) of the Town tab, People tab, a building's page and a resident's sheet.
2. Ask Morgan (asked in chat 2026-11-10, unanswered): which milestone holds raids and the town's defence (D-027 open point). My recommendation: the threat clock and a first raid in M2 with the guild.
3. Then the final approval page and `write-spec` from its step 3 for M1. The spec's first slice carries audit F3 (app update prompt) and F13 (state shape, command switch, stream naming, content validation, schema 2 upgrade); F1, F2, F4 to F12 and F14 to F18 are accepted fixes to schedule in the spec or a small fix PR, each code fix with a test that failed first. No build slice before Morgan approves the spec.
4. Check the production deployment after the audit merge shows 644ed4f on the Version line (CI-05).
5. Not checked: how Android Chrome answers the persistent-storage request for an installed PWA (Morgan did not look at the Storage line).

## Open questions

- Which milestone holds raids and the town's defence (D-027). The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf

## Decisions since the last plan update

- 2026-11-09 D-001 to D-024; 2026-11-10 D-025 to D-027, see `docs/DECISIONS.md`.
