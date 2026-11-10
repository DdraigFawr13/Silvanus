# Handoff

Updated: 2026-11-10. A fresh session must be able to continue from this file alone. Keep it to 60 lines; move finished entries to `docs/archive/handoff-YYYY-MM.md`.

## Phase

M1 Town is built from `docs/specs/m1-town.md` (approved, D-030), five slices, all merged: S1 (PR #5), S2 (PR #6), S3 (PR #8, with D-034), S4 (PR #9), S5 "Growth and the Village" (PR #10; Morgan: "Approved. Merge when ready"). Mock-ups: `mockups/town.html` (https://claude.ai/artifact/6k9547asTCDNHmfobt6Hym) and `mockups/people.html` (https://claude.ai/artifact/R2jofFnKAX6bWhpqKngZcP); the phone is 412 px wide (Morgan). The M1 audit is done (PR #11, all 25 findings accepted). Next is one PR of audit fixes, then Morgan's M1 test (J14). M0 is done and passed on Morgan's phone.

## Plan map

- ✔ Planning and M0 Skeleton (D-001 to D-024); M0 audit merged (PR #3), all 19 findings accepted.
- ✔ M1 planning: round 1, review, taste board, style doc, spec (D-025 to D-030).
- ✔ M1 S1 Safe saves and updates (PR #5).
- ✔ M1 S2 Stock, lots and the Town tab (PR #6).
- ✔ M1 S3 Production methods and the away card (PR #8; D-034).
- ✔ M1 S4 People (PR #9).
- ✔ M1 S5 Growth and the Village (PR #10).
- ✔ M1 audit (PR #11): 25 findings, all accepted.
- ▶ The M1 audit fixes, then the M1 test (J14) on Morgan's phone.
- ○ M2 in two sessions (D-033). Town half first: lots with a character, standing orders, forecast and ledger, a practised crew, push methods if the M1 test asks. Then the guild half: the guild, staged reports, the first raid (D-029) with its clock as a sign, the Palisade.
- ○ M3 Trade outlet, events, chronicle (v0.1), plus signs, deeds, named foes, gold hiring a second crew, three more town works (D-032, D-033).
- ○ M4a Families, plus foremen and apprentices and heirlooms · ○ M4b Paths · ○ M5 Trade and Crown · ○ M6 Depth (v1.0)

## Just done

- 2026-11-10 PR #10 merged as `2bc2181`. Deployed commit checked: the live bundle at https://silvanus-xi.vercel.app carries `2bc2181` (CI-05). M1 audit started on `audit/m1`: `npm run check` passes (67 unit tests, 7.4 s), 25 browser tests pass (43.0 s), five readers. Report written and checked (shape ok, 25 of 25 quotes); 25 findings, 0 high, 4 medium; all accepted on 2026-11-10 (Morgan: "Do what you recommend for all"); PR #11 merged.
- 2026-11-10 S5 built on `m1/s5-village` (PR #10): leaving, arrival, the tavern term, `upgradeHall` and the Village, the catch-up cap from the Hall, the Hall row's "Upgrade to Village" (asks first) and the away card's Arrived and Left rows. Tests first, each seen to fail. Soak pass 2: the Village at tick 1,216 (band 1,200 to 2,200, 16 ticks above the floor); pass 3 lost 2 and was back to 20 after 168 ticks. Mock-up approved after one change round (Morgan: "order the village" is weird wording for an upgrade; it now says "Upgrade"). Diff review (96,977 tokens): 0 high, 1 medium, 7 low; 5 fixed, 2 declined (spec build notes). `npm run check` passes (67 unit tests; first load 93,636 bytes); 25 browser tests pass. Morgan approved the slice on 2026-11-10: "Approved. Merge when ready".
- 2026-11-10 S4 merged as `f083aa7` (PR #9). Deployed commit checked: the live bundle at https://silvanus-xi.vercel.app carried `f083aa7` and the manifest had its `id` (CI-05). S4's "Morgan tries" sent. S5 started on `m1/s5-village` from that commit; its zero-decision check (fresh agent) ran and its findings are in the spec's build notes, S5. S5 moves to a new session: this one built S4 and its context is large (write-spec step 8).
- Earlier entries are in `docs/archive/handoff-2026-11.md`.

## Next

1. The M1 audit fixes, one PR on `audit/m1-fixes` cut from main after PR #11: all 25 findings of `docs/audit/2026-11-10-repo-2.md` (Morgan: "Do what you recommend for all"), with the defaults its Outcome names. A code finding closes only with a test seen to fail first; name each fix commit in the report's Outcome.
2. Then send Morgan the M1 test (J14) from the plan page https://claude.ai/artifact/JBJXyeY7awmo7p5GHuRL8z: about 20 minutes of play over check-ins across 2 or 3 days, reaching the Village, noting at least one choice he found hard. Record his findings here (GAME-06).
3. Still open from S1 and S2: Morgan's phone tests ("Update ready" and Reload after the S2 deploy; build a Woodcutter's camp, close the app, come back), S3's, sent 2026-11-10 (switch the Mine to stone and read the cost; let the Workshop run out of ore overnight and read the away card), and S4's, sent 2026-11-10 (pin someone to a job they are bad at and read why their morale falls). S4 begun 2026-11-10 (relayed by the S4 session): "Pinned a resident but the ticks don't seem to be updating at all oh wait nvm there it goes. I guess morale will update in the next day in game"; pinning works, the morale fall is not yet read. For J14: at a game hour per real minute the date sits still up to a minute, which first read to him as stuck. Record his answers here.
4. The repo has auto-merge off: merge by hand once the ready CI run is green, and do not push and mark ready within the same few seconds.
5. M2's planning starts from D-032 and D-033 and the two pages under "Planning pages". The M1 test (J14) also answers three things for it: does the town feel mechanical (push methods), do shortages annoy (parked reserves), do 6 lots feel right.

## Open questions

- Whether gold pays for building from M3 (D-027, proposed; settled at M3's planning).
- Whether the charter's 1,440-tick catch-up cap belongs to a later Hall tier (M1 audit F18). Settlers arrive aged 20 until M4a sets ages (F22). J14 judges the pacing to the Village and D-034's prices (F19, F22).
- How Android Chrome answers the persistent-storage request for an installed PWA: Morgan did not look at the Storage line.
- The other two peoples for v1.0. Whether ranks get bigger jumps (D-021, after the first playtest).

## Planning pages

- Round 5: https://claude.ai/artifact/GXyCyVEpnCLUU8jVBXjfJG · Review: https://claude.ai/artifact/MTxTA5yFtYgbZrUKqmStUQ · Final: https://claude.ai/artifact/PDb43Sn8K1tcBLkqek9cPv · M0 spec: https://claude.ai/artifact/Bvt8GtrMSSTGaDjVRscCXe · S3 summary: https://claude.ai/artifact/BqkLY3zSL5CVprLRRxxndq · M1 round 1: https://claude.ai/artifact/4Lu6ZT9ZDmtqhLgLaWbymR · M1 review: https://claude.ai/artifact/5NTJDE3CuGvSkuDjkBL1W1 · M0 audit replies: https://claude.ai/artifact/Wa5YKEgJy8xWYVhaiVRuUk · Taste board: https://claude.ai/artifact/JrzLhbWsWXpwvPsVgqUZGf
- Fun round 1: https://claude.ai/artifact/7NFqLKmYoVrgEB4TgHsdop · Fun round 2 (town): https://claude.ai/artifact/NbBSXFajzEL8reyh2M7rsE

## Decisions since the last plan update

- 2026-11-10 Morgan: the M1 audit comes before the M1 test (J14) ("Audit before testing in a new session please"). Plan page: https://claude.ai/artifact/JBJXyeY7awmo7p5GHuRL8z.
- 2026-11-10 D-025 to D-034, see `docs/DECISIONS.md`. D-034 (methods bought once) amends D-025.
