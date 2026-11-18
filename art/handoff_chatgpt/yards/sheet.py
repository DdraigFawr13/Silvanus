import sys
from PIL import Image, ImageDraw
tag, n, sz, cols, sc, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
c = sz + 6; rows = (n + cols - 1) // cols
W = Image.new('RGBA', (cols * c, rows * c), (70, 90, 60, 255))
for i in range(n): W.alpha_composite(Image.open(f'raw/{tag}_{i:02d}.png').convert('RGBA'), ((i % cols) * c + 3, (i // cols) * c + 3))
W = W.resize((W.size[0] * sc, W.size[1] * sc), Image.NEAREST); d = ImageDraw.Draw(W)
for i in range(n): d.text(((i % cols) * c * sc + 1, (i // cols) * c * sc + 1), str(i), fill=(255, 255, 0, 255))
W.save(out)
