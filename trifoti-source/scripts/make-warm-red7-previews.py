"""Rebuild the published, uncropped RED7 light-view previews from source photos."""
from pathlib import Path
import shutil

from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[2]
warm = root / 'trifoti/warm/photos'
published = warm / 'red7-preview'
mirror = root / 'docs/trifoti/warm/photos/red7-preview'
for directory in (published, mirror):
    directory.mkdir(parents=True, exist_ok=True)
for name in ('ring-installed', 'copper-context', 'copper-detail', 'ring-workshop', 'finishing'):
    filename = f'{name}.webp'
    with Image.open(warm / 'red7' / filename) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        image.thumbnail((400, 400), Image.Resampling.LANCZOS)
        image.save(published / filename, 'WEBP', quality=72, method=6)
    shutil.copyfile(published / filename, mirror / filename)
