# Self-hosted font containers

The existing fonts are retained in full, with no subsetting, changed outlines, changed names or altered weight ranges. The website now requests WOFF2 containers of the same files. Original TTFs remain in `dist/assets/fonts/` for provenance and verification; CSS does not request them. Copyright and SIL OFL 1.1 text remain in the adjacent license files and the fonts' unchanged name tables.

- Unbounded: `unbounded.ttf` → `unbounded.woff2`; 200–900; `Unbounded-OFL.txt`. Source: https://github.com/googlefonts/unbounded . License: https://raw.githubusercontent.com/google/fonts/main/ofl/unbounded/OFL.txt .
- Oswald: `oswald.ttf` → `oswald.woff2`; 200–700; `Oswald-OFL.txt`. Source: https://github.com/googlefonts/OswaldFont . License: https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/OFL.txt .
- Manrope: `manrope.ttf` → `manrope.woff2`; 200–800; `Manrope-OFL.txt`. Source: https://github.com/googlefonts/manrope . License: https://raw.githubusercontent.com/google/fonts/main/ofl/manrope/OFL.txt . The existing license header says 2018 and embedded copyright says 2019; both are preserved, not reconciled by guessing.

These bundled license headers declare no reserved font name. The fonts remain under the SIL Open Font License: https://openfontlicense.org/open-font-license-official-text/ . No vendor endorsement is implied.

## Measured file sizes, not timing claims

The three original TTFs total 1,115,060 bytes. WOFF2 totals 386,100 bytes, a reduction of 728,960 bytes (65.4%). Gzipping the originals totals 544,304 bytes, still 158,204 bytes larger than WOFF2. Actual transfer and timing depend on server encoding, cache, device and connection; no millisecond improvement is claimed.

## Verification

`npm run check` is dependency-free and verifies shipped hashes, WOFF2 headers, local CSS sources, weight ranges and retained license files. `npm run check:font-equivalence` additionally requires Python fontTools plus Node.js (its built-in Brotli decoder), and reconstructs each WOFF2 for comparison against the retained TTF. It checks all 3,044 glyph outlines, components, instructions, advance widths, Unicode maps, variable axes, font metadata and shaping/positioning/variation tables. `scripts/font-integrity.json` records the audited fingerprints and sizes. Browser geometry is compared separately at desktop and narrow widths.

Conversion used fontTools' WOFF2 transform with Brotli quality 11, font mode. No glyph data was removed. WOFF2 reconstruction is not claimed to be bit-identical to the original sfnt file: transformed glyf/loca storage, checksum adjustment and the required head.flags bit 11 can differ while rendering data remains equivalent. The verifier checks every other head field and every non-transformed table. Specification: https://www.w3.org/TR/WOFF2/ .
