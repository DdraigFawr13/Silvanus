"""Compose independent mine and river RGBA repairs; preserve all other pixels."""
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]


def build():
    spec = json.loads((HERE / 'manifest.json').read_text())
    source = ROOT / spec['base']
    if hashlib.sha256(source.read_bytes()).hexdigest() != spec['baseSha256']:
        raise ValueError('Base changed: inspect alignment before updating the manifest')
    before = Image.open(source).convert('RGBA')
    if list(before.size) != spec['size']:
        raise ValueError('Unexpected base dimensions')
    result = before.copy()
    allowed = np.zeros((before.height, before.width), dtype=bool)
    for patch in spec['patches']:
        if not patch['enabled']:
            continue
        asset = Image.open(HERE / patch['asset']).convert('RGBA')
        x, y = patch['position']
        if x < 0 or y < 0 or x + asset.width > before.width or y + asset.height > before.height:
            raise ValueError(f"Patch outside map: {patch['id']}")
        allowed[y:y + asset.height, x:x + asset.width] |= np.asarray(asset)[:, :, 3] > 0
        result.alpha_composite(asset, (x, y))
    result = result.convert('RGB')
    result.save(HERE / 'full-view.png')
    changed = np.any(np.asarray(result) != np.asarray(before.convert('RGB')), axis=2)
    if np.any(changed & ~allowed):
        raise AssertionError('Changes escaped the asset masks')
    report = {'size': list(result.size), 'changed_pixels': int(changed.sum()),
              'changed_percent': round(float(changed.mean() * 100), 2),
              'outside_asset_masks': int((changed & ~allowed).sum()),
              'baseSha256': spec['baseSha256']}
    (HERE / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
    for name, scene in [('before', before), ('after', result)]:
        scene.crop((960, 0, 1408, 512)).save(HERE / f'detail-{name}.png')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    build()
