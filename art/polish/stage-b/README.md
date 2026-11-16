# Stage B local art repairs

Small, reversible follow-up to Claude's stage B at `9afcc971f0e43bb1320bbdfcbd2fb307fe1f53c8` on `m2b-target3`. This is a workshop candidate, not approved game art. The map remains a partial top band.

- `roof-removal.png`: transparent repair patch replacing the leftover cottage roof in the ground with grass. Buildings can now be placed there independently.
- `west-grass-seams.png`: transparent repair patch breaking the hard collage line through the western clearing and reducing repetitive stump/grass texture. The top forest seam and some lower plot edges remain.
- `manifest.json`: base ground, building placement file, patch filenames, positions in art pixels, and individual enable switches. Order is drawing order.
- `ground.png` and `grown.png`: generated previews using these patches and Claude's existing building assets/placement code. No source image or building has been overwritten.
- `preview.html`: self-contained before/after review with the target reference, empty ground/buildings, zoom and all checklist items. Empty ground is a composition check, not a playable day-one state.

## Rebuild or replace

From the repository root, run `python3 art/polish/stage-b/build.py`, then `python3 art/polish/stage-b/build_preview.py`. Uses the workshop's existing Pillow and numpy; no runtime dependencies or network calls.

To replace a repair, edit its RGBA PNG (keep transparent edges), or point the manifest to another asset and adjust its position. Disable a patch with `enabled: false`. The build saves both compositions and checks that no ground pixel changes outside enabled patch alpha, and that the original building assembler still reproduces Claude's saved render. `verification.json` records the results. If Claude changes the base ground, review registration before reuse; this manifest is deliberately pinned to the source hash.

`prepare.py` extracts these two patch assets from the saved Image Gen result using explicit polygon masks and a 3 px edge feather. It is only needed after replacing the generated source; it overwrites the patch PNGs. The generator returned a larger image, registered to the original 640 × 512 crop with nearest-neighbour resampling. Only the local masked areas are used. Do not replace the entire ground with the generator output.

## Source and rights

- Original ground/crop and existing buildings: PixelLab assets made by Claude for Morgan, documented in `docs/workshop/m2b-dragonscape.md`, stage B. Original service terms apply; no new third-party art pack or licence is introduced.
- `west-repair-generated.png`: AI-generated edit with OpenAI Image Gen by Codex for Morgan, 2026-11-16, from `west-source.png`. Prompt: `prompt.txt`. Use is subject to the applicable OpenAI terms; no CC0 or exclusive-rights claim is made.
- Patch assets and preview compositions: derived from the above sources for Silvanus. One Image Gen edit; no PixelLab calls or generations used.

## Review limits

The ground texture in the repair is slightly smoother at 3× than the original. The western upper forest seam, lower plot edges, east join, block-like mountain, grey riverside slab and missing lower map remain. No gameplay, lot interaction, upgrades or animation are added. See the per-item assessment in `scores.json`; scores are Codex's visual assessment, not Morgan's acceptance.

## Validation

`npm run check` passed with pinned Node 24.19.0/npm 11.9.0: 81 tests, soak, types, formatting and production build; first-load JS 94,684 bytes gzipped. Review-page Chromium checks passed at 412 px and 360 px, device scale 2.625: all version/layer/zoom options, all 55 checklist entries, no script errors or page overflow. Physical Android review and the full game browser suite were not run; no game code changed and this remains a draft.
