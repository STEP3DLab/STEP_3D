#!/usr/bin/env bash
# Technical resizes only. Keep the original images and their composition intact.
set -euo pipefail
cd "$(dirname "$0")/../.."
command -v magick >/dev/null
for width in 480 768 1024 1440; do
  magick trifoti/warm/scenes/parshin-atelier-20261106.webp \
    -filter Lanczos -resize "${width}x" -quality 90 -define webp:method=6 \
    "trifoti/warm/scenes/parshin-atelier-20261106-${width}.webp"
done
for width in 96 192 288; do
  # Lossless encoding of the resized pixels; retain the original sRGB ICC profile.
  magick trifoti/warm/brand/logo-original.jpg \
    -filter Lanczos -resize "${width}x" -define webp:lossless=true -define webp:method=6 \
    "trifoti/warm/brand/logo-${width}.webp"
done
mkdir -p docs/trifoti/warm/{scenes,brand}
cp trifoti/warm/scenes/parshin-atelier-20261106-{480,768,1024,1440}.webp docs/trifoti/warm/scenes/
cp trifoti/warm/brand/logo-{96,192,288}.webp docs/trifoti/warm/brand/
