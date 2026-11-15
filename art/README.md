# Silvanus art workspace

The game's art as cleaned pixel pieces, the scripts that clean and assemble them, and the town-map test renders. The style is the ChatGPT anchor sheet (D-046), and the town layout is D-047. The log for each sheet is in `docs/workshop/m2b-dragonscape.md`.

Source of every asset in `gpt/`: AI-generated with ChatGPT by Morgan on 2026-11-14, from prompts Claude wrote. Each folder's `sheet.png` is the original; `pieceNN.png` are the cleaned cut-outs. `gpt/layout/` is reference only and is not cut into assets. Licence: Morgan's own generated art for this project (SAFE-05).

## Setup

```
cd art
pip install -r requirements.txt
python gpt_town.py        # writes gpt/town_day1@1x.png, town_grown@1x.png and 2x copies (_town_*.png)
```

Run scripts from inside `art/`; they import each other and find files relative to their own folder. On 2026-11-14 the copies here gave pixel-identical output to the originals in `C:\Users\Morgan\CraftWork\silvanus-art` (town day1, town grown, scene C).

## Cleaning pipeline (a new ChatGPT sheet)

1. Key the magenta background: r > 170, b > 170, g < 110.
2. Snap to a true grid: median of each P × P block (P = 6 for most sheets, 8 for villagers). `_pxprobe.py <sheet>` estimates P.
3. Reduce to 96 colours (median cut, no dither, no grade), but keep a pixel's snapped colour when the reduction moves it by more than 36 (sum of RGB differences). Without this, moss, water and bats lose their colour.
4. Purple-fringe fix: only pixels touching transparency become (18, 16, 22, 110), so drawn purples survive.
5. Cut pieces, grouping loose fragments with their object:
   - `gpt_clean_sheet.py <sheet> <outdir> <P> <rows> <cols> [dist]`: nearest big component. `COLORS` env var overrides 96.
   - `gpt_clean_grid.py <sheet> <outdir> <P> <rows> <cols>`: by grid cell of the centroid.
   - `gpt_clean_cluster.py <sheet> <outdir> <P> <D>`: union of boxes within D px (generic: P 6, D 3, 35 pieces).
   - `gpt_mountain.py`, `gpt_villagers.py`: special layouts.

The props and `A/` pieces came from older scripts that also graded against a Kenney pack; those scripts stayed on the PC and are not needed again.

## Assembly

- `gpt_ground2.py`: the 4 × 4 ground tiles snapped to 16 × 16; exports `T` (T["00"] grass, T["10"] dirt, T["20"] transition) and `grassy()`.
- `gpt_scene_b.py`: shared helpers: `ground(W, H, mask)` draws grass with dirt where the mask is set (jagged edge, lit lip, overhang shadow), `mask`, `jag`, `put` (sprite with shadow), `P`.
- `gpt_town.py`: the 30 × 30-tile town (480 × 480 px), `build("day1")` and `build("grown")`. Roads, river, plots, sprites, dark Tangle trees and mist.
- `gpt_scene_c.py`: mountain and cliff test scene.
- `pixellab_town.py`: `wang_ground(W, H, mask)` lays the PixelLab grass-to-dirt tileset (`pixellab/t1_grass_dirt/`) on a 16 px corner grid; run alone, it re-renders the old square map with it for comparison.
- `town_wide.py`: the current town map (D-047 as amended 2026-11-15), 60 × 30 tiles, scrolls left and right. `gpt_town.py` is the superseded square map.

## Piece index

- `buildings/`: index = row × 3 + tier. Woodcutter 0–2, farm 3–5, forager 6–8, workshop 9–11, storehouse 12–14, tavern 15–17.
- `hall/`: tiers 0–2 (81 × 68, 94 × 88, 144 × 107 px). `square/`: stages 0–2.
- `sites/`: 0 tar pit, 1 bog, 2 salt spring, 3 standing stones, 4 bat cave, 5 tower.
- `mountain/`: 00 mountain 144 × 75, 01 mine entrance, 02 left cliff end, 03–06 middles (27 × 67), 07 right end.
- `villagers/`: 0–31 (8 villagers × 4 walk frames); strips `walk0–7.png`.
- `generic/`: 0–5 cottages, 6 woodshed, 7 shed, 8 veg plot, 9 washing line, 10 woodpile, 11 coop, 12 beehive, 13 barrel, 14 compost, 15 fence, 16 fence corner, 17 gate, 18 wall, 19 wall corner, 20–21 small walls, 22 steps, 23 flower box, 24 hedge, 25 signpost, 26 cart, 27 hitching post, 28 flower bed, 29 mushrooms, 30 log, 31 graveyard, 32 crow, 33 lantern stake, 34 stumps.
- `props/`: 0–2 oaks, 5–7 pines, 8 dead tree, 12 berry bush, 14–15 brambles, 16–17 rocks, 18 lamp post, 24 hedge, 29 bridge, 30 jetty with boat (others unused so far).

## Known gaps

- Town map, Morgan on 2026-11-14: "it still isn't quite there yet". Diagnosed: flat ground with no wear or paths to doors, plain road strips, no shared lighting, hard terrain edges. PixelLab tilesets are the planned fix (`docs/workshop/pixellab-handoff.md`).
- Small purple smudge under the coop ramp (generic 11). The mountain is 9 × 5 tiles, smaller than the 12 × 7 asked for.
