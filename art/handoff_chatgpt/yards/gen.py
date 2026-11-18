# Submit one PixelLab create_image_pro_from_style call and save its candidates (Claude's script, 2026-11-18).
# Calls PixelLab's MCP HTTP endpoint; the session's network proxy adds the key. Usage: python3 gen.py <tag> <description> [seed]
import json, subprocess, sys, base64, time, re, pathlib
D = pathlib.Path(__file__).resolve().parent
def rpc(tool, args):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": tool, "arguments": args}})
    r = subprocess.run(['curl', '-sS', '--max-time', '300', 'https://api.pixellab.ai/mcp', '-H', 'Content-Type: application/json',
                        '-H', 'Accept: application/json, text/event-stream', '-H', 'Authorization: Bearer dummy', '--data-binary', '@-'],
                       input=body.encode(), capture_output=True).stdout.decode()
    return json.loads([l for l in r.splitlines() if l.startswith('data: ')][0][6:])['result']
def b64(p): return "data:image/png;base64," + base64.b64encode(open(D / p, 'rb').read()).decode()
ANCH = [f"{p}_{n}.png" for p in [__import__("os").environ.get("ANCHOR", "anchor")] for n in ("farm", "fisher", "stall", "barrel")]
if __name__ == "__main__":
    tag, desc = sys.argv[1], sys.argv[2]
    args = {"description": desc, "style_images": [{"url": b64(p)} for p in ANCH],
            "style_description": "dark moody dusk pixel art, high top-down three-quarter view, dark single-colour outline, medium shading, muted greens, browns and slate greys"}
    if len(sys.argv) > 3: args["seed"] = int(sys.argv[3])
    r = rpc("create_image_pro_from_style", args); t = r['content'][0]['text']; print(t)
    m = re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})', t)
    if r.get('isError') or not m: sys.exit(1)
    job = m.group(1); open(D / "raw" / f"{tag}.job.txt", "w").write(f"tool: create_image_pro_from_style\njob: {job}\ndescription: {desc}\nreceipt:\n{t}\n")
    for _ in range(120):
        time.sleep(10); cc = rpc("get_image", {"job_id": job})['content']; ims = [x for x in cc if x['type'] == 'image']
        if ims:
            n = int(re.search(r"frames: (\d+)", " ".join(x.get("text", "") for x in cc)).group(1))
            for i in range(n): subprocess.run(["curl", "-sS", "-o", str(D / "raw" / f"{tag}_{i:02d}.png"), "-H", "Authorization: Bearer dummy", f"https://api.pixellab.ai/mcp/images/{job}/download?index={i}"])
            print(tag, len(ims), "candidates"); print([x['text'][:300] for x in cc if x['type'] == 'text']); break
