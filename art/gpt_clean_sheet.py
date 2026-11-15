"""Generic ChatGPT sheet cleaner (D-046): key magenta, snap to P-pixel blocks by median, 96 colours, no grade,
fix magenta-tinted shadows, then group connected pieces into a rows x cols grid so small loose parts (crates,
signs, pumpkins) stay with their building. Usage: gpt_clean_sheet.py <sheet.png> <outdir> <P> <rows> <cols>"""
import sys
from PIL import Image
import numpy as np

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
    q = img.convert("RGB").quantize(colors=int(__import__("os").environ.get("COLORS", 96)), method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGBA")
    q.putalpha(img.split()[3])
    o = np.asarray(q).copy()
    src = np.asarray(img)  # rare colours (moss, fountain water, bats) get no palette slot: keep them as snapped
    far = np.abs(o[..., :3].astype(int) - src[..., :3].astype(int)).sum(2) > 36
    o[far, :3] = src[far, :3]; print('kept true colour', int((far & (src[..., 3] > 0)).sum()))
    c = o[..., :3].astype(int)
    purple = (c[..., 2] > c[..., 1] + 25) & (c[..., 0] > c[..., 1] + 15) & (o[..., 3] > 0)
    o[purple] = (18, 16, 22, 110)
    return Image.fromarray(o, "RGBA")

def components(alpha):
    seen = np.zeros_like(alpha); comps = []
    for y0, x0 in zip(*np.nonzero(alpha)):
        if seen[y0, x0]:
            continue
        stack, pts = [(y0, x0)], []; seen[y0, x0] = True
        while stack:
            y, x = stack.pop(); pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < alpha.shape[0] and 0 <= xx < alpha.shape[1] and alpha[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True; stack.append((yy, xx))
        comps.append(np.array(pts))
    return comps

if __name__ == "__main__":
    src, out, P, R, C = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
    img = clean(src, P); img.save(out + "snapped@1x.png")
    img.resize((img.width * 3, img.height * 3), Image.NEAREST).save(out + "_snapped.png")
    alpha = np.asarray(img)[..., 3] > 0
    comps = [c for c in components(alpha) if len(c) >= 4]
    big = sorted(comps, key=len, reverse=True)[:R * C]
    cy = lambda c: c[:, 0].mean(); cx = lambda c: c[:, 1].mean()
    big.sort(key=cy)
    rows = [sorted(big[i * C:(i + 1) * C], key=cx) for i in range(R)]
    cells = [c for row in rows for c in row]
    groups = [[c] for c in cells]
    for c in comps:
        if any(c is b for b in big):
            continue
        y, x = cy(c), cx(c)
        def dist(b):  # distance from piece centre to the building's bounding box
            y0, x0 = b[:, 0].min(), b[:, 1].min(); y1, x1 = b[:, 0].max(), b[:, 1].max()
            return max(y0 - y, 0, y - y1) + max(x0 - x, 0, x - x1)
        k = min(range(len(cells)), key=lambda i: dist(cells[i]))
        if dist(cells[k]) < (int(sys.argv[6]) if len(sys.argv) > 6 else 12):
            groups[k].append(c)
    src_px = np.asarray(img)
    for k, grp in enumerate(groups):
        pts = np.concatenate(grp)
        y0, x0 = pts.min(0); y1, x1 = pts.max(0)
        piece = np.zeros((y1 - y0 + 1, x1 - x0 + 1, 4), dtype=np.uint8)
        piece[pts[:, 0] - y0, pts[:, 1] - x0] = src_px[pts[:, 0], pts[:, 1]]
        Image.fromarray(piece, "RGBA").save(f"{out}piece{k:02d}.png")
        print(k, (int(x0), int(y0), int(x1 - x0 + 1), int(y1 - y0 + 1)), len(grp), "parts")
