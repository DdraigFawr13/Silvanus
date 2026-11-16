# Mine exit and river repair

Morgan requested: “Ok fix the mine exit and the river and give me a full view I can see on my phone”. This follows the first stage B cleanup on `codex/art-polish` (PR #24). The remote `m2b-target3` still points to `9afcc97` when checked for this pass.

## View

- `full-view.png`: the entire current 1408 × 512 artwork, including earlier west/roof cleanup. Open the raw PNG on a phone and pinch to zoom. This is the full existing band, not the unfinished 1408 × 888 map.
- `preview.html`: self-contained image-first page, before/after, full view, 1×/2×/3× zoom in screen pixels per art pixel, and a **Mine & river** button. Open locally or download; no network dependencies. Style reference and all 55 scored requirements are included below the artwork.
- `detail-before.png`, `detail-after.png`: identical coordinates for comparison.

## Independent assets

- `mine-exit.png`: RGBA patch with dark tunnel, mossy timber portal, lantern, gravel apron and continuous curved rails. It replaces the visible mine and approach as a workshop overlay. It includes ground pixels and is not yet a clean building-only sprite for gameplay.
- `river-bank.png`: RGBA patch with moving water and irregular stone banks, replacing the isolated slab. The river stays east of the mine; its outlet curves farther west near the unfinished lower edge. Future lower-map artwork must use this outlet if the repair is accepted.
- `manifest.json`: patch filenames, art-pixel coordinates, drawing order, enable switches, base size and source hash. Each patch can be swapped independently.

Run `python3 art/polish/mine-river/build.py`, then `python3 art/polish/mine-river/build_preview.py`. The build consumes the previous stage B composite, applies only enabled assets and checks zero changes outside their alpha. It rejects a changed base hash until registration is reviewed. Pillow/numpy are the existing workshop dependencies; nothing is added to the game runtime.

To change a patch, replace its RGBA PNG and update its manifest coordinates if necessary. To remove it, set `enabled` to `false` and rebuild. `prepare.py` is only for re-extracting assets from `generated.png`; its polygons and 3 px feather preserve source pixels outside each repair. Generator output is registered to the original 448 × 512 crop using nearest-neighbour resampling. Do not use the full generated crop as a replacement tile.

## Sources and rights

Original artwork: Claude’s PixelLab stage B, documented in `docs/workshop/m2b-dragonscape.md`, plus Codex’s earlier local cleanup (`../stage-b/README.md`). `source.png` is the corresponding east crop, at map x 960–1408, y 0–512.

`generated.png`: one OpenAI Image Gen edit by Codex for Morgan on 2026-11-16, using `source.png`; exact request in `prompt.txt`. Use is subject to the applicable OpenAI and original PixelLab terms. No third-party pack added, no CC0/exclusive-rights claim, no PixelLab calls made. Patch assets are derived from that edit.

## Limits

Close-up texture is a little smoother than the original. Larger block-like cliff tiers and unrelated map seams remain. The lower town, swamp, bridge and jetty have not been built in this pass. No game logic or interaction changed. This is a draft art candidate, not a physical-phone approval or final production asset.

## Validation

`npm run check` passed with pinned Node 24.19.0/npm 11.9.0: 81 tests, simulation soak, types, formatting, build and first-load JS budget (94,684 bytes gzipped). Local Chromium preview checks passed at 412 × 900, 360 × 800 and landscape 900 × 412, device scale 2.625: before/after, all zoom steps, mine focus, all 55 checklist entries; no script errors or page overflow. Screenshots are included. Physical Android review and the full game browser suite remain unrun; no game code changed.
