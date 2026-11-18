# Debug view: crop of a map with a 20 px coordinate grid, scaled. Usage: python3 grid.py <map.png> x0 y0 x1 y1 scale out.png
import sys
from PIL import Image, ImageDraw
m, x0, y0, x1, y1, sc, out = sys.argv[1], *map(int, sys.argv[2:7]), sys.argv[7]
im = Image.open(m).convert('RGB').crop((x0, y0, x1, y1)); im = im.resize((im.width * sc, im.height * sc), Image.NEAREST); d = ImageDraw.Draw(im)
for x in range((x0 // 20 + 1) * 20, x1, 20):
    d.line([((x - x0) * sc, 0), ((x - x0) * sc, im.height)], fill=(255, 0, 255) if x % 100 == 0 else (255, 255, 0), width=1); d.text(((x - x0) * sc + 2, 2), str(x), fill=(255, 255, 255))
for y in range((y0 // 20 + 1) * 20, y1, 20):
    d.line([(0, (y - y0) * sc), (im.width, (y - y0) * sc)], fill=(255, 0, 255) if y % 100 == 0 else (255, 255, 0), width=1); d.text((2, (y - y0) * sc + 2), str(y), fill=(255, 255, 255))
im.save(out)
