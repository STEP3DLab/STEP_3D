"""Create size-only derivatives of the supplied logo; keep its PNG untouched.

Optional development utility: requires Pillow, not needed to serve the site.
No crop, background removal, palette change, or redraw is applied.
"""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'dist/assets/brand'
original = Image.open(root / 'trifoti-logo-original.png')
for size in (256, 512):
    output = original.resize((size, size), Image.Resampling.LANCZOS)
    output.save(root / f'trifoti-logo-{size}.webp', lossless=True, method=6)
original.resize((64, 64), Image.Resampling.LANCZOS).save(root / 'trifoti-favicon-64.png', optimize=True)
