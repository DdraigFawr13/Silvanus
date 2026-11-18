# Rescore after the dressed yards: copies result3_scores.json, keeps the previous status as the 4th field, and updates the
# items this pass touched (Claude's scoring at 3x, 2026-11-18). Usage: python3 art/handoff_chatgpt/yards/rescore.py
import json, pathlib
R = pathlib.Path(__file__).resolve().parents[3]
P = R / "docs/workshop/pages"
old = json.load(open(P / "result3_scores.json"))
new = {k: [v[0], v[1], v[2], v[1]] for k, v in old.items()}
NOTES = {
    "L1": ("m", "Brightness 51, saturation 0.39, edge share 0.237, unchanged by the yards (mock-up 1: 55, 0.37, 0.263). The props carry the map's dusk browns and slate greys."),
    "L4": ("m", "Houses face their lanes, fences, lamp posts, trees among the houses; six more yards now hold the things people use there (water butts, benches, washing, woodpiles)."),
    "L7": ("m", "As before, plus yard props that belong to each building: a wheelbarrow and a vegetable bed at the farm, woodpiles and a chopping block at the cottages, a smaller fisher's hut with a net frame and lantern post."),
    "L10": ("m", "Ground by ChatGPT (Morgan) from the PixelLab ground; buildings and yard props from PixelLab, styled on crops of the map's own pieces."),
    "M10": ("p", "The fisher's hut now stands on the far bank, between the river and the backwater below the bridge road, with a short track to the water (a new 64 px hut). The old hut's jetty and boat went with it, so there is no jetty now; a few planks of the old landing show in the grass on the town bank."),
    "M12": ("p", "Worn earth plots, packed lanes, rougher grass at the edges, boulders near the mountain; the yard props bring small patches of worn earth with them. Little slope."),
    "T7": ("p", "As fix 2, plus a track from the new fisher's hut to the water. Still without a track: the forager's hut and the woodcutter (pines between them and the roads)."),
    "P5": ("p", "Seven dressed yards (was one): the forager's, the farmhouse (wheelbarrow, vegetable bed), the cottage by the Hall (water butt, bench and pots; washing line), the big cottage on the High Street (woodshed), the fenced cottage (chopping block), the small cottage south of the High Street (log stack), the cottage on the cross street (water butt, bench, pots). Five cottages are still bare: two north of the High Street, the one by the square, two south of it."),
    "P10": ("m", "One painted ground; every building and every yard prop a separate piece placed by place.py."),
    "R3": ("m", "Every prop and the hut checked at 3x beside the old map: no hard edge where their earth patches meet the ground; the hut first touched the bridge's east end and was moved 4 px right, 24 px down."),
    "R5": ("m", "New pieces made in PixelLab from the map's own pieces as style anchors; nothing redrawn in another style. Rescaling the first 48 px props to fit was not done (the guide forbids it); a second call at map scale was paid instead."),
    "R6": ("m", "Morgan approved up to 45 generations for this step; 35 used (4 calls), 10 left of the cap."),
    "R1": ("m", "This page."), "R2": ("m", "This list, all 55 items."),
}
for k, (s, n) in NOTES.items(): new[k][1], new[k][2] = s, n
json.dump(new, open(P / "result4_scores.json", "w"), indent=0, ensure_ascii=False)
c = {}
for v in new.values(): c[v[1]] = c.get(v[1], 0) + 1
print(c, "changed status:", [k for k, v in new.items() if v[1] != v[3]])
