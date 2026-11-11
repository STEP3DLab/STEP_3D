#!/usr/bin/env python3
"""Verify the lossless portrait-mask derivative. Optional dependency: Pillow."""
import base64
import gzip
import hashlib
import io
import re
from pathlib import Path

from PIL import Image

assets = Path(__file__).resolve().parents[1] / "dist/assets/team"
names = ["fedor-background-mask-20261026.svg", "fedor-background-mask-lossless-20261111.svg"]
payload = re.compile(r"data:image/png;base64,([A-Za-z0-9+/=]+)")
documents = [(assets / name).read_text() for name in names]
assert payload.sub("PNG", documents[0]) == payload.sub("PNG", documents[1])
pixels = []
for name, document in zip(names, documents):
    embedded = base64.b64decode(payload.search(document).group(1), validate=True)
    with Image.open(io.BytesIO(embedded)) as image:
        assert image.format == "PNG" and image.mode == "RGB"
        assert image.size == (1254, 1254)
        pixels.append(image.tobytes())
    print(f"{name}: {len(document.encode())} bytes; gzip-9 {len(gzip.compress(document.encode(), compresslevel=9, mtime=0))}")
assert pixels[0] == pixels[1], "The optimized mask changed decoded pixels"
digest = hashlib.sha256(pixels[1]).hexdigest()
assert digest == "c127d3145e2fd9b963df9726ed778d24c40af1313035cf4439211461ea8ba4a7"
print(f"All 1,572,516 RGB pixels match. SHA-256: {digest}")
