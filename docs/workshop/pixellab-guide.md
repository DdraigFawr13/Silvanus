# PixelLab guide: cohesive art and clear design intent

How Claude works with PixelLab for Silvanus, so every new piece matches the anchor art and Morgan sees what they asked for. Written 2026-11-15. Sources: PixelLab's tool docs (https://api.pixellab.ai/mcp/docs, read 2026-11-15), its built-in `pixel_art_high` prompt, the community skill Pixellab Pip (Shilo, read for ideas, not installed), and test 1 (`docs/workshop/m2b-dragonscape.md`). Prices and plan limits change; re-read the tool's docs entry before quoting one.

## 1. Pin the target before any call

- The style anchor is the ChatGPT sheet (D-046): `art/gpt/sheet.png` and the cleaned pieces in `art/gpt/`. The layout is D-047. A PixelLab piece that doesn't sit beside those is wrong, however good it looks alone.
- Fix the shared constants once and send them on every call: 16 px tiles, `high top-down` view, the anchor's outline (dark, single colour) and shading (medium). Don't mix views or tile sizes within one map.
- Write the anchor palette down as hex colours sampled from the cleaned pieces (grass `#60813F`, dirt `#966444` so far). Name colours in words as well, because standard tools ignore `palette`.

## 2. Pick the tool by cost and by how it holds style

| Need | Tool | Cost (docs, 2026-11-15) | Holds style by |
|---|---|---|---|
| Terrain pair (grass to dirt, grass to water) | `create_topdown_tileset` standard | 1 | words only; chain `lower/upper_base_tile_id` so sets join |
| Same, richer, exact palette | `create_topdown_tileset` pro | 15 at 16-32 px; Tier 1+, not the trial | `palette`, `max_colors` |
| Prop or object in the anchor style | `create_object_pro_flash` | 5 up to 96 px | `style_image` + `style_options` (palette, outline, detail, shading) |
| Several pieces matching the anchor | `create_image_pro_from_style` | 10 per call (many candidates at small sizes) | 1-4 `style_images` |
| Roads as a path set | `create_path_tiles` | 10-25; square tiles must be 32 px | `palette` |
| Lock colours to the anchor after generation | `reduce_colors` with `palette_image` | 0.1 | the anchor's own colours |
| Tidy stray pixels | `correct_pixelart` | 0.1 | low `strength` (0.1) keeps the art |
| Bring our own pieces into PixelLab | `import_object`, `import_tiles` | free | they become references and chain bases |

- Prefer a reference image over prose: matching words or a seed alone does not make a matching pack (Pip). Send the anchor crop that shows the material in question (a grass patch for grass), not the whole sheet.
- Standard tilesets run an `enhance` step that rewrote test 1's prompt (it added "flat solid greens and no shadows"). Pass `enhance: false` when the wording matters.
- PixelLab can return the two terrains swapped; read which is which from the pixels (`art/pixellab_town.py` does).

## 3. Make it cohesive after it arrives

- Keep the raw download beside any cleaned version, and log its source (SAFE-05; section 5).
- Run every piece through the same final pass: palette-lock to the anchor (`reduce_colors` with a palette image of the anchor colours), then compare it at 1x and 2x beside an anchor piece of the same kind.
- Judge it on the map, never alone: render it into `art/town_wide.py`, then look at the full map and the phone opening view (`art/gpt/_town_wide_phone.png`).
- Never rescale pixel art to fit. Change the canvas or the tile size instead.
- If two tries bring no improvement, keep the better one and say what is still wrong, instead of spending more.

## 4. Talking with Morgan

- Before each paid call: the tool, its cost in generations from the docs, what is left, and what the call should fix. Wait for a yes (SAFE-01). A run of several calls can be approved once, with its total named.
- Turn Morgan's words into a short brief before calling: what it is, where it sits on the map, which anchor piece it must match, and the colours. Quote Morgan's words in the log so the brief can be checked against them.
- Check the brief against DECISIONS first, every layout and art quote included, not only the Accepted entries (LESSONS 2026-11-15: the map dropped the scroll that only D-041 recorded).
- Always show results on a published Artifact page, never as loose images in chat: each image with a caption saying what it is, what worked and what didn't, then the decision with its options and a recommendation (Morgan, 2026-11-16: "Can you always show these images in like an artifact with descriptions In a way I can see and make informed decisions on?"). Example: https://claude.ai/artifact/VrSULVpxTb63nqH1YRbjA1
- Show results as finished art in place: old beside new, day one and grown, and the phone view. No sketches (LESSONS: `art1`). Say what changed and what is still wrong, in a sentence each.
- One question at a time, with a recommendation. Taste questions with several options go on a published form (the `planning-interview` template).

## 5. Record keeping

- Assets live in `art/pixellab/<nn>_<name>/` with `raw_*` downloads and the metadata JSON.
- Log line in `docs/workshop/m2b-dragonscape.md`: "AI-generated with PixelLab by Claude for Morgan, <date>, <tool> (<mode>, <size>, <cost>)", the job or tileset id, chain ids, and the prompt as sent.
- Generation count after each call goes in HANDOFF's Just done line.

## Seamless map pieces (tested 2026-11-16)

- Use `inpaint_image_pro_flash` (9 generations a 256 px window), not `edit_image_pixen`: the cheap edit copies whatever sits beside the blank part.
- Every window holds some existing art; the mask covers the blank pixels plus a band 32 px into the art beside or above; the prompt gives measured positions of roads and rivers that cross the edge.
- A fully blank window with a whole-map context draws a small copy of the map: keep the context to about 512 px round the window.
- Check each join at 3x and measure brightness either side before reporting (LESSONS 2026-11-16).

## Open, not yet tested

- Whether trial accounts can use the pro-flash object tool and `create_image_pro_from_style` (only pro tilesets say "not a trial").
- Whether `reduce_colors` with the anchor palette keeps the PixelLab tiles' worn-edge detail.
