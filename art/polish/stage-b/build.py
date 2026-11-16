"""Compose reusable ground repair assets, then Claude's existing buildings.
Usage from any directory: python3 /path/to/art/polish/stage-b/build.py
Requires the art workshop's existing Pillow and numpy dependencies.
"""
import hashlib
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sys.path.insert(0, str(ROOT / 'art/pixellab/blocks'))
import place


def build():
    spec = json.loads((HERE / 'manifest.json').read_text())
    digest = hashlib.sha256((ROOT / spec['base']).read_bytes()).hexdigest()
    if digest != spec['baseSha256']:
        raise ValueError('Base ground changed; review and update patch registration first')
    base = Image.open(ROOT / spec['base']).convert('RGBA')
    if list(base.size) != spec['size']:
        raise ValueError('Base size changed; review patch registration before rebuilding')
    original = base.copy()
    coverage = np.zeros((base.height, base.width), dtype=bool)
    for patch in spec['patches']:
        if not patch['enabled']:
            continue
        asset = Image.open(HERE / patch['asset']).convert('RGBA')
        x, y = patch['position']
        if x < 0 or y < 0 or x + asset.width > base.width or y + asset.height > base.height:
            raise ValueError(f"Patch {patch['id']} lies outside the ground")
        coverage[y:y + asset.height, x:x + asset.width] |= np.asarray(asset)[:, :, 3] > 0
        base.alpha_composite(asset, (x, y))
    ground = base.convert('RGB')
    ground.save(HERE / 'ground.png')
    place.PLACES = [tuple(p) for p in json.loads((ROOT / spec['buildings']).read_text())]
    grown = Image.fromarray(place.place(np.asarray(ground).astype(float), True).clip(0, 255).astype(np.uint8))
    grown.save(HERE / 'grown.png')
    before = np.asarray(original.convert('RGB'))
    changed = np.any(before != np.asarray(ground), axis=2)
    if np.any(changed & ~coverage):
        raise AssertionError('Pixels changed outside enabled assets')
    # Rebuild the original too: records whether the shared placement pipeline agrees
    # with Claude's checked-in stage B render before using it for this preview.
    baseline = place.place(before.astype(float), True).clip(0, 255).astype(np.uint8)
    saved = np.asarray(Image.open(ROOT / 'art/pixellab/blocks/stage_b.png').convert('RGB'))
    if not np.array_equal(baseline, saved):
        raise AssertionError('Original building assembly no longer matches stage B')
    report = {
        'base_sha256': hashlib.sha256((ROOT / spec['base']).read_bytes()).hexdigest(),
        'size': list(ground.size),
        'ground_pixels_changed': int(changed.sum()),
        'ground_percent_changed': round(float(changed.mean() * 100), 2),
        'pixels_changed_outside_assets': int((changed & ~coverage).sum()),
        'baseline_buildings_match': True,
    }
    (HERE / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    # Same coordinates, 3x nearest-neighbour for seam and roof inspection.
    for name, box in [('roof', (480, 420, 630, 512)), ('west', (0, 220, 410, 450))]:
        for label, scene in [('before', original), ('after', ground)]:
            crop = scene.crop(box)
            crop.resize((crop.width * 3, crop.height * 3), Image.Resampling.NEAREST).save(HERE / f'{name}-{label}.png')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    build()
