"""Verify the shipped WOFF2 containers against the retained original TTFs.
Requires fontTools and Node.js; uses Node's built-in Brotli decoder, no downloads.
Run from any working directory: python3 scripts/check-font-equivalence.py
"""
from pathlib import Path
from types import SimpleNamespace
import gzip
import hashlib
import json
import subprocess
from fontTools.ttLib import TTFont, woff2


def decode(data):
    return subprocess.run(
        ['node', '-e', "const z=require('node:zlib'),f=require('node:fs');process.stdout.write(z.brotliDecompressSync(f.readFileSync(0)));"],
        input=data, stdout=subprocess.PIPE, check=True).stdout


# WOFF2 transformation is fontTools' implementation; only Brotli decoding is bridged.
woff2.brotli = SimpleNamespace(decompress=decode)
woff2.haveBrotli = True
root = Path(__file__).resolve().parent.parent / 'dist' / 'assets' / 'fonts'
rows = []
for family in ['unbounded', 'oswald', 'manrope']:
    ttf = root / (family + '.ttf')
    web = root / (family + '.woff2')
    original = TTFont(ttf, recalcTimestamp=False)
    decoded = TTFont(web, recalcTimestamp=False)
    assert set(original.keys()) == set(decoded.keys()), (family, 'table inventory')
    assert original.getGlyphOrder() == decoded.getGlyphOrder(), (family, 'glyph order')
    assert original.getBestCmap() == decoded.getBestCmap(), (family, 'Unicode cmap')
    # Every unchanged OpenType table must be byte-identical. glyf/loca are WOFF2
    # transformed; head.checkSumAdjustment can change when the sfnt is reconstructed.
    identical = []
    for tag in original.keys():
        if tag in ['GlyphOrder', 'glyf', 'loca', 'head']:
            continue
        assert original.getTableData(tag) == decoded.getTableData(tag), (family, tag)
        identical.append(tag)
    for key, value in vars(original['head']).items():
        if key == 'flags':
            # WOFF2 requires the lossless-transform flag (bit 11).
            # https://www.w3.org/TR/WOFF2/#Overview
            assert decoded['head'].flags == (value | (1 << 11)), (family, 'head flags')
        elif key not in ['checkSumAdjustment']:
            assert value == vars(decoded['head'])[key], (family, 'head', key)
    assert original['hmtx'].metrics == decoded['hmtx'].metrics, (family, 'advance widths')
    for name in original.getGlyphOrder():
        a, b = original['glyf'][name], decoded['glyf'][name]
        assert a.numberOfContours == b.numberOfContours, (family, name, 'contours')
        a_coords, a_ends, a_flags = a.getCoordinates(original['glyf'])
        b_coords, b_ends, b_flags = b.getCoordinates(decoded['glyf'])
        assert list(a_coords) == list(b_coords), (family, name, 'coordinates')
        assert list(a_ends) == list(b_ends), (family, name, 'endpoints')
        assert list(a_flags) == list(b_flags), (family, name, 'flags')
        assert a.isComposite() == b.isComposite(), (family, name, 'composite')
        if a.isComposite():
            assert [(c.getComponentInfo(), c.flags) for c in a.components] == [(c.getComponentInfo(), c.flags) for c in b.components], (family, name, 'components')
        assert (a.program.getBytecode() if hasattr(a, 'program') else b'') == (b.program.getBytecode() if hasattr(b, 'program') else b''), (family, name, 'instructions')
    axes = [[a.axisTag, a.minValue, a.defaultValue, a.maxValue] for a in original['fvar'].axes]
    assert axes == [[a.axisTag, a.minValue, a.defaultValue, a.maxValue] for a in decoded['fvar'].axes]
    rows.append({'family':family, 'glyphs':len(original.getGlyphOrder()), 'unicode_mappings':len(original.getBestCmap()),
                 'axes':axes, 'identical_tables':identical, 'ttf_bytes':ttf.stat().st_size,
                 'gzip_ttf_bytes':len(gzip.compress(ttf.read_bytes(), mtime=0)), 'woff2_bytes':web.stat().st_size,
                 'ttf_sha256':hashlib.sha256(ttf.read_bytes()).hexdigest(), 'woff2_sha256':hashlib.sha256(web.read_bytes()).hexdigest()})
print(json.dumps({'fonts':rows, 'totals':{key:sum(row[key] for row in rows) for key in ['glyphs','ttf_bytes','gzip_ttf_bytes','woff2_bytes']}}, indent=2))
