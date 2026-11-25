"""Generate the homepage's WebP derivatives; keep full JPG originals for other views."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'dist/assets'
covers = ('feather-award/feather-front', 'vmeste-prize/vmeste-prize',
          'two-figure-composition/two-figure-composition')
for stem in covers:
    source = root / 'projects' / f'{stem}.jpg'
    with Image.open(source) as original:
        w, h = original.size
        # These inputs are already in display orientation and carry no ICC profile.
        assert not original.getexif().get(274) and 'icc_profile' not in original.info
        for width in sorted({min(v, w) for v in (480, 800, w)}):
            target = root / 'responsive' / f'{stem}-{width}.webp'
            target.parent.mkdir(parents=True, exist_ok=True)
            image = original.resize((width, round(h * width / w)), Image.Resampling.LANCZOS) if width < w else original
            image.save(target, 'WEBP', quality=88, method=6)
            assert target.stat().st_size < source.stat().st_size
