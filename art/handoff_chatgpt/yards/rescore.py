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
    "L7": ("m", "As before, plus yard props that belong to each building: a wheelbarrow and a vegetable bed at the farm, woodpiles and a chopping block at the cottages, the fisher's hut with its nets, jetty and boat, now on the far bank."),
    "L10": ("m", "Ground by ChatGPT (Morgan) from the PixelLab ground; buildings and yard props from PixelLab, styled on crops of the map's own pieces."),
    "M10": ("m", "The fisher's hut, at the same scale as the other buildings, now stands on the far bank between the river and the backwater, its jetty and boat on the backwater (the map's own water shows under them). Its roof covers the bridge's east end. A few planks of the old landing show in the grass on the town bank."),
    "M12": ("p", "Worn earth plots, packed lanes, rougher grass at the edges, boulders near the mountain; the yard props bring small patches of worn earth with them. Little slope."),
    "T7": ("p", "As fix 2; the fisher's hut on the far bank is reached by its jetty, with no track from the bridge road. Still without a track: the forager's hut and the woodcutter (pines between them and the roads)."),
    "P5": ("p", "Seven dressed yards (was one): the forager's, the farmhouse (wheelbarrow, vegetable bed), the cottage by the Hall (water butt, bench and pots; washing line), the big cottage on the High Street (woodshed), the fenced cottage (chopping block), the small cottage south of the High Street (log stack), the cottage on the cross street (water butt, bench, pots). Five cottages are still bare: two north of the High Street, the one by the square, two south of it."),
    "P10": ("m", "One painted ground; every building and every yard prop a separate piece placed by place.py."),
    "R3": ("m", "Every prop and the hut checked at 3x beside the old map: no hard edge where their earth patches meet the ground. The hut's own pond first showed as a light rectangle over the mist; it is cut, so the map's backwater shows under the jetty and boat."),
    "R5": ("m", "New pieces made in PixelLab from the map's own pieces as style anchors; nothing redrawn in another style. Rescaling the first 48 px props to fit was not done (the guide forbids it); a second call at map scale was paid instead."),
    "R6": ("m", "Morgan approved up to 45 generations for this step; 35 used (4 calls), 10 left of the cap. The 5-generation small hut is not used (Morgan: too small); the move to the far bank reuses the map's own hut, 0 generations."),
    "R1": ("m", "This page."), "R2": ("m", "This list, all 55 items."),
}
for k, (s, n) in NOTES.items(): new[k][1], new[k][2] = s, n
json.dump(new, open(P / "result4_scores.json", "w"), indent=0, ensure_ascii=False)
c = {}
for v in new.values(): c[v[1]] = c.get(v[1], 0) + 1
print(c, "changed status:", [k for k, v in new.items() if v[1] != v[3]])
