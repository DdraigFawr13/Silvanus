"""Extract local RGBA repair assets from the saved Image Gen edit, not a redraw.
Run only when replacing west-repair-generated.png; build.py consumes the assets.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
# Registration to the original crop. No whole-map rescaling is performed.
edit = Image.open(HERE / 'west-repair-generated.png').convert('RGB').resize((640, 512), Image.Resampling.NEAREST)
regions = {
    'roof-removal': [(505, 477), (543, 438), (564, 438), (603, 470), (603, 530), (505, 530)],
    'west-grass-seams': [(-20, 244), (248, 244), (248, 283), (294, 315), (375, 315), (390, 382), (348, 430), (265, 402), (121, 416), (-20, 401)],
}
for name, points in regions.items():
    mask = Image.new('L', edit.size)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    # Feather only the asset boundary; the generated pixel texture stays sharp.
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    bounds = mask.getbbox()
    asset = edit.convert('RGBA')
    asset.putalpha(mask)
    asset.crop(bounds).save(HERE / f'{name}.png')
    print(name, 'bounds', bounds)
