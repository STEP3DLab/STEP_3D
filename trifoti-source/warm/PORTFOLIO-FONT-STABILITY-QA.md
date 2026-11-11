# Warm gallery font stability

Date: 2026-11-11. Base: f71f37b9251e16f3304dfe0da2d898c99f92270c.

## Reproduced issue

The gallery initially renders its heading and album filters in fallback fonts.
When Manrope and Unbounded arrive, a 375 px document gains a heading line and a
filter row: the first section moves from y=435.078 to y=522.031 (86.953 px).
Two normal local-preview loads scored CLS 0.166887. The same result occurs on
b0edb86 before the recent sales changes, so this is not a new sales regression.
At a 390 px document the wrapping differs and the observed shift is much smaller.

A live mobile PSI run scored 96, LCP 2.701 s, CLS 0.004. It does not disprove the
controlled timing issue: fonts can load before the first visible fallback frame.
https://pagespeed.web.dev/analysis/https-step3dlab-github-io-STEP_3D-trifoti-warm-portfolio-html/sbx8bkwdag?form_factor=mobile

## Narrow change

The existing gallery head style embeds exact variable-font subsets for the
header, intro, album navigation and section headings. Original faces remain for
all other content. The embedded faces stay selected after external fonts arrive,
so critical geometry no longer depends on a font network response. Font sizes,
weights, spacing, artwork, gallery scripts, links and stored briefs are unchanged.

The subsets retain variable axes, shaping features, outlines, advances, vertical
metrics, copyright and OFL names. Derivative family names are distinct. The
source fonts and their published licenses remain untouched. This avoids the
small rounding changes found in an experimental static-font candidate.

The two subsets total 37,796 bytes. Gallery HTML grows from 60,373/12,398 bytes
(raw/gzip) to 111,447/52,050. In preview the initial page no longer requests the
260,104-byte external Unbounded font, because its visible uses are covered by
the subset. This is not a measured CDN transfer or a general speed claim. The
full face remains available for later content such as the viewer's titles.

## Maintenance

The standalone portfolio.html is its own checked-in source. The premium apply
script intentionally skips it; do not run a broad warm rebuild for this change.

- Rebuild after changing critical text: python3 trifoti-source/warm/portfolio-critical-fonts.py
- Validate artifacts and text coverage without fontTools: python3 trifoti-source/warm/portfolio-critical-fonts.py --check
- Font equivalence and helper tests: PYTHONDONTWRITEBYTECODE=1 python3 trifoti-source/scripts/test-warm-portfolio-fonts.py

Build uses already available fontTools and Node Brotli, never network downloads.
The helper replaces only its marked CSS block and updates the two public mirrors.

## Checks before publication

- 889/889 main checks and 92/92 warm tests pass.
- Variable glyph outlines, advances and vertical metrics match original fonts at
  Manrope 400 and Unbounded 450/600; original copyright/OFL records retained.
- Fully loaded geometry is identical at iframe widths 320, 360, 375, 390, 414,
  540, 541, 768, 1024 and 1280 px. The Linux scrollbar consumes 15 px in each
  document. Header, intro, filters, section headings, grids and pictures compared.
  A second scrollbar-free sweep at exact document/viewport widths 320, 360, 375,
  390, 414, 540, 541, 768, 1024 and 1280 also reports zero geometry differences.
- Normal candidate load at a 375 px document: CLS 0.000014, no page errors or
  horizontal overflow. A tiny count badge shift remains; no zero-CLS promise.
- With external fonts absent, the candidate critical layout is already final.
  Releasing both full fonts after a 1-second delay yields CLS 0.178342 in the
  baseline and 0.000014 in the candidate (375 px document). The remaining
  candidate shift is the unmodified count badge, not the critical layout.
- Gallery opening, next frame, Escape, focus return to the original card and
  repeated opening pass in preview. No physical device or screen reader test
  is claimed. No analytics or data collection was added.
- Independent review reran all three suites, confirmed byte-reproducible
  font builds, matching variable axes and retained shaping tables, and found
  no implementation blockers. Browser comparisons complement, rather than
  replace, font outline/metric checks.
