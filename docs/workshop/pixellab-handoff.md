# PixelLab handoff (M2b art, cloud session)

Written 2026-11-14 by the desktop session that ran the M2b art workshop, for the cloud session that continues it. Branch: `m2b-art-workshop`. Read `docs/HANDOFF.md` first, then this file, then `art/README.md`.

## Why this exists

- The art style is the ChatGPT anchor sheet (D-046); the town layout is D-047. Every sheet so far is cleaned and in `art/gpt/` (log: `docs/workshop/m2b-dragonscape.md`).
- Morgan on the assembled town map (`art/gpt/_town_day1.png`, `_town_grown.png`): "Honestly it still isn't quite there yet truthfully but I think you get what I am going for?"
- Gaps found (inference, not measured): flat ground with no wear or paths to doors; plain road strips; no shared lighting or grade; hard terrain edges with no blending.
- Morgan asked for the best use of money. Recommended and chosen: PixelLab (AI pixel art on a real grid, with Wang terrain tilesets, path tiles and style references, and an MCP server). Morgan replied "Ok pixel lab it is" and made a free account.
- Morgan wants to do everything from the phone, so the work moved to a cloud session. `.mcp.json` at the repo root points at `https://api.pixellab.ai/mcp` and reads the token from the environment variable `PIXELLAB_API_TOKEN`. The token is never in the repo or in chat.

## First job: walk Morgan through the setup, slowly

Morgan asked for this in these words: "the first thing I want it to do is slowly walk me through the process". So:

- One step per message. Say what to tap, what they should see, and wait for Morgan to say it is done before the next step. Phone taps and links only, no terminal commands (WS-08).
- Never ask Morgan to paste the token into chat. If they do, tell them it is now exposed and to make a new one.
- First check whether the setup is already done: are tools named `mcp__pixellab__*` available? If yes, skip to step 6.

Steps (claude.ai/code screens may differ from these names; describe what you can confirm, and say when you are guessing):

1. **New token.** At https://api.pixellab.ai/mcp (signed in), make a new token and revoke any older one. An earlier token was pasted into a desktop chat on 2026-11-14 and must be treated as exposed. Morgan keeps the new one copied, out of chat.
2. **Environment variable.** In claude.ai/code, open the Silvanus environment's settings and add `PIXELLAB_API_TOKEN=<token>` to its environment variables (they are stored in `.env` format and visible to anyone using that environment; only Morgan uses it).
3. **Network access.** In the same settings, set network access so `api.pixellab.ai` is allowed (Custom access with that domain added; keep the default package registries if the screen offers to). Also allow the hosts the PixelLab download URLs use if a download later fails; check the failing URL's host first.
4. **New session.** Environment changes apply to new sessions, so Morgan starts a fresh cloud session on branch `m2b-art-workshop` and says "PixelLab connected".
5. **Check.** The new session confirms `mcp__pixellab__*` tools exist. If not: check `PIXELLAB_API_TOKEN` is set (print only whether it is set, never the value), and whether `api.pixellab.ai` is reachable. `.mcp.json`'s `${PIXELLAB_API_TOKEN}` expansion in cloud sessions is an assumption that has not been tested; if it fails, say so plainly and find the documented way rather than guessing.
6. **Balance.** Call `get_balance` and tell Morgan what the free account has. Nothing is spent before this.

## Then: the first art test (ask before every paid call)

- Spending rule (SAFE-01): before each generation, say the tool, the cost in generations from the docs, and what is left, and wait for a yes. Failed jobs are not charged. Docs: https://api.pixellab.ai/mcp/docs (a subagent's reading on 2026-11-14: standard `create_topdown_tileset` costs 1 generation; pro mode, `create_tiles_pro` and rooms need a paid Tier 1+ plan; costs are listed per tool).
- Test 1: one standard `create_topdown_tileset`, grass (lower) to packed dirt road (upper), tile size 16, colours described from the anchor (moss green grass, warm brown dirt; sample `art/gpt/ground2/t00.png`, `t10.png`). Chain later sets with the returned base tile ids (grass to water, grass to forest floor).
- Integrate: in `art/gpt_town.py` the dirt mask (`dirt = sb.mask(...)`) and water mask (`wm`) already exist. Replace `sb.ground` with a corner-based Wang render of the tileset on the 16 px grid from those masks. Render day1 and grown, and put the old and new side by side.
- Show Morgan finished-quality art in full mock-ups, never sketches. Taste or design questions go in a published Artifact form (the `planning-interview` skill's template), not inline questions; a quick yes/no can be in chat. Tell Morgan to tick "Synced with Claude" on a form before submitting.
- If the tileset tool is locked on the free account, stop and tell Morgan the price of the plan that unlocks it (listed at about $12, $24 or $50 a month on 2026-11-14; check the live page). Don't upgrade for them.
- Later candidates: `create_path_tiles` for roads, style references from `art/gpt/sheet.png` (the anchor) for new objects, `import_tiles` / `import_object` (free) for our own pieces.

## Rules to keep

- Record every new asset's source in `docs/workshop/m2b-dragonscape.md` (SAFE-05): "AI-generated with PixelLab by Claude for Morgan, <date>, <tool>", and keep the raw download beside the cleaned piece.
- Don't commit third-party screenshots (the DragonScape ones stay out of the repo).
- Use they/them for Morgan. Morgan is on a phone: short messages, links, one question at a time.
- Update `docs/HANDOFF.md` at each checkpoint; commits end with the co-author line the session's attribution gives.
- Still open from the workshop (`docs/HANDOFF.md` Next 3): D-041 and D-042 Proposed, the UI_STYLE art section, `mockups/town-art.html`, and the PR from `m2b-art-workshop` once Morgan approves.

Sources checked on 2026-11-14: https://api.pixellab.ai/mcp/docs, https://code.claude.com/docs/en/cloud-environments
