# Fisher's hut for the far bank: one PixelLab create_object_pro_flash call, 64 x 64, 1 direction (5 generations). Claude's script, 2026-11-18.
import sys, json, time, re, base64, subprocess
sys.path.insert(0, '.'); from gen import rpc, b64, D
tag, seed = sys.argv[1], int(sys.argv[2])
desc = ("a small weathered wooden fisherman's hut with a steep slate roof patched with moss, a stone chimney, one warm lit window, "
        "a wooden door, a lantern on a post, fishing nets drying on a pole frame and a barrel beside it, standing on a small patch of grass")
r = rpc("create_object_pro_flash", {"description": desc, "view": "high top-down", "n_directions": 1, "width": 64, "height": 64, "seed": seed,
        "style_image": {"url": b64("anchor_hut.png")}, "name": "silvanus fisher hut small"})
t = r['content'][0]['text']; print(t)
m = re.search(r'"object_id": "([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', t)
if r.get('isError') or not m: sys.exit(1)
oid = m.group(1); open(D / "raw" / f"{tag}.job.txt", "w").write(f"tool: create_object_pro_flash\nobject: {oid}\nseed: {seed}\ndescription: {desc}\nreceipt:\n{t}\n")
for _ in range(90):   # get_object lists the finished PNG's URL under "rotations"; download it from there
    time.sleep(10); txt = " ".join(x.get('text', '') for x in rpc("get_object", {"object_id": oid})['content'])
    u = re.search(r'unknown: (https://\S+\.png)', txt)
    if 'status: completed' in txt and u: subprocess.run(['curl', '-sS', '-o', str(D / "raw" / f"{tag}.png"), u.group(1)]); print("saved", u.group(1)); break
    if 'fail' in txt.lower(): print(txt[:800]); break
