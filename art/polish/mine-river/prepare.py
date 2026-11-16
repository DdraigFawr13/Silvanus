"""Extract reusable local repair assets from the saved Image Gen result."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
edit = Image.open(HERE / 'generated.png').convert('RGBA').resize((448, 512), Image.Resampling.NEAREST)
regions = {
    'mine-exit': [(198, 130), (288, 128), (309, 177), (299, 244), (267, 266), (206, 315), (141, 366), (102, 370), (88, 348), (166, 290), (208, 244), (195, 192)],
    'river-bank': [(468, 199), (417, 204), (399, 245), (389, 290), (363, 330), (332, 363), (268, 378), (242, 394), (228, 447), (193, 530), (470, 530)],
}
for name, points in regions.items():
    mask = Image.new('L', edit.size)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    bounds = mask.getbbox()
    asset = edit.copy()
    asset.putalpha(mask)
    asset.crop(bounds).save(HERE / f'{name}.png')
    print(name, 'map position', [960 + bounds[0], bounds[1]], 'bounds', bounds)
