"""Clean a sheet laid out on a fixed rows x cols grid (D-046): same cleaning as gpt_clean_sheet.clean, except the
magenta-tint fix only touches pixels next to the background (so drawn purples such as the cave's bats survive), and
every fragment goes to the grid cell its centre falls in. Usage: gpt_clean_grid.py <sheet> <outdir> <P> <rows> <cols>"""
import sys
from PIL import Image
import numpy as np
from gpt_clean_sheet import components

def clean(src, P):
    a = np.asarray(Image.open(src).convert("RGB")).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (r > 170) & (b > 170) & (g < 110)
    H, W = a.shape[0] // P, a.shape[1] // P
    out = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        for x in range(W):
            m = bg[y * P:(y + 1) * P, x * P:(x + 1) * P].reshape(-1)
            if m.mean() > 0.5:
                continue
            blk = a[y * P:(y + 1) * P, x * P:(x + 1) * P].reshape(-1, 3)[~m]
            out[y, x, :3] = np.median(blk, axis=0); out[y, x, 3] = 255
    img = Image.fromarray(out, "RGBA")
    q = img.convert("RGB").quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGBA")
    q.putalpha(img.split()[3])
    o = np.asarray(q).copy()
    src = np.asarray(img)  # rare colours (moss, fountain water, bats) get no palette slot: keep them as snapped
    far = np.abs(o[..., :3].astype(int) - src[..., :3].astype(int)).sum(2) > 36
    o[far, :3] = src[far, :3]; print('kept true colour', int((far & (src[..., 3] > 0)).sum()))
    c = o[..., :3].astype(int); op = o[..., 3] > 0
    tr = ~op; near = tr.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            near |= np.roll(np.roll(tr, dy, 0), dx, 1)
    tint = (c[..., 2] > c[..., 1] + 25) & (c[..., 0] > c[..., 1] + 15) & op
    o[tint & near] = (18, 16, 22, 110)
    print("tint fixed", int((tint & near).sum()), "kept", int((tint & ~near).sum()))
    return Image.fromarray(o, "RGBA")

if __name__ == "__main__":
    src, out, P, R, C = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
    img = clean(src, P); img.save(out + "snapped@1x.png")
    px = np.asarray(img); H, W = px.shape[:2]
    cells = [[] for _ in range(R * C)]
    for c in components(px[..., 3] > 0):
        k = int(c[:, 0].mean() // (H / R)) * C + int(c[:, 1].mean() // (W / C))
        cells[k].append(c)
    for k, grp in enumerate(cells):
        pts = np.concatenate(grp); y0, x0 = pts.min(0); y1, x1 = pts.max(0)
        piece = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), dtype=np.uint8)
        piece[pts[:, 0] - y0, pts[:, 1] - x0] = px[pts[:, 0], pts[:, 1]]
        Image.fromarray(piece, "RGBA").save(f"{out}piece{k:02d}.png")
        print(k, (int(x1 - x0 + 1), int(y1 - y0 + 1)), len(grp), "parts")
