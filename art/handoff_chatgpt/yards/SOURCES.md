# Yard props and the small fisher's hut: sources (SAFE-05)

All pieces are AI-generated with PixelLab by Claude for Morgan on 2026-11-18, under Morgan's PixelLab plan (Tier 1). Style anchors are crops of the map's own PixelLab buildings (`anchor_*.png`, `a28_*.png`, `anchor_hut.png`, cut from `art/pixellab/blocks/raw_farmhouse.png`, `raw_fisher.png`, `raw_stall_a.png`, `raw_cottage_d.png`). Receipts with job ids and prompts: `raw/*.job.txt`. Cleaned by `props.py` (free), placed by `yards.py` through `art/pixellab/blocks/place.py`.

- Call c1, `create_image_pro_from_style`, 48 px, 25 candidates, 10 generations, job b0f049c7-c1f7-4a6f-bd99-6a28ac70e697: single props. Not used (twice the map's scale).
- Call c2, `create_image_pro_from_style`, 28 px, 64 candidates, 10 generations, job 015d800b-45d2-49d8-a064-3169f1085340: woodpiles. Used: c2_45 woodshed, c2_36 log stack.
- Call c3, `create_image_pro_from_style`, 48 px, 25 candidates, 10 generations, job 2746fb46-a722-48ce-a535-ebbf420d9540: yard clusters. Used: c3_10, c3_24 (water butt, bench, pots), c3_11 (washing line), c3_07 (vegetable bed), c3_04 (wheelbarrow), c3_08 (chopping block).
- Call hut1, `create_object_pro_flash`, 64 × 64, 1 direction, high top-down, seed 7, 5 generations, object 0a0d076f-9508-4225-bc89-4911ff7f02f1: the small fisher's hut.
- Total 35 generations; balance 1,265 before, 1,230 after (`get_balance`).
