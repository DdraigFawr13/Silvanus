# ChatGPT's clean-up of the map ground (result_1_chatgpt.png, by Morgan, 2026-11-17): its colours
# moved toward mock-up 1 (each channel's mean and spread matched to mock-up 1's, at half strength), its saturation cut to 0.78 and brightness to 0.95,
# then the same buildings, lamps and sites as the pass-2 map placed on it with place.py.
import json, pathlib, sys
import numpy as np
from PIL import Image
R = pathlib.Path(__file__).resolve().parents[2]
B = R / "art/pixellab/blocks"
sys.path.insert(0, str(B))
import place
a = np.asarray(Image.open(R / "art/handoff_chatgpt/result_1_chatgpt.png").convert("RGB")).astype(float)
m = np.asarray(Image.open(R / "art/pixellab/mock_hd/raw_1_heart.png").convert("RGB")).astype(float).reshape(-1, 3)
am, asd = a.reshape(-1, 3).mean(0), a.reshape(-1, 3).std(0)
mm, msd = m.mean(0), m.std(0)
full = (a - am) * (msd / asd) + mm
g = a + (full - a) * 0.5
grey = g.mean(2, keepdims=True)
g = grey + (g - grey) * 0.78          # saturation toward mock-up 1's (0.47 measured against 0.37)
g = g * 0.95                          # a shade darker, toward mock-up 1's dusk
Image.fromarray(np.clip(g, 0, 255).astype(np.uint8)).save(R / "art/handoff_chatgpt/result_1_graded.png")
place.PLACES = [tuple(p) for p in json.load(open(B / "pass2_items.json"))]
Image.fromarray(np.clip(place.place(g, True), 0, 255).astype(np.uint8)).save(R / "art/handoff_chatgpt/result_1_grown.png")
