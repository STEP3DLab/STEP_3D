# Main-page initial layout stability — 11 November 2026

Base: `2cb26a6437fb8f6d4302580d9d91b092762776ff`.

## Confirmed causes

The published main page scored CLS 0.349 in two slow-4G Lighthouse mobile lab runs. A separate local copy was then tested with external font faces and the independent menu controller withheld and released separately. These controlled iframe measurements are diagnostic, not replacement Lighthouse scores.

At iframe widths 320 / 360 / 390 / 412 CSS pixels:
- Late menu initialization reduced header height from 181 / 181 / 192 / 192px to 74px, moving main content upward 107–118px.
- Loading Oswald after Manrope reduced heading height by 37.422 / 42.328 / 46.016 / 48.703px, removing an extra fallback line and moving the following buttons.

Baseline lab reports:
- https://pagespeed.web.dev/analysis/https-step3dlab-github-io-STEP_3D-trifoti/otqrd6j8ik?form_factor=mobile
- https://pagespeed.web.dev/analysis/https-step3dlab-github-io-STEP_3D-trifoti/td6lxaycjb?form_factor=mobile

## Scoped fix

The unchanged, independently tested header controller is generated inline immediately after the parsed header and before main. It no longer waits for an external module. No-JS or an inline-script restriction still leaves the original native navigation links visible. There is no second late controller.

The heading now uses a 5,300-byte variable Oswald subset embedded in the main stylesheet, covering the exact slogan in both original and uppercase characters. Original fonts and OFL attribution remain. The subset retains original variable data, outlines, advances and vertical metrics. `font-display:block` is scoped to this small embedded face. Original full font fallbacks and narrow-screen wrapping remain available if the embedded face cannot be used. No font size, spacing, colour, text or line-height was changed.

## Verification before publication

- Full checks: 889/889 tests passed; independent full check also passed. Warm-specific regression checks: 6 Python and 13 JavaScript tests passed.
- Original vs candidate rendered header, heading and all three text-line rectangles are identical at 320, 360, 390, 412, 800, 1024 and 1280px. No document-level horizontal overflow. Visual mobile comparison retains the same design.
- In the controlled final sequence, header is 74px from the initial snapshot, heading and action-link positions remain unchanged after Manrope and Oswald are released. Initial snapshots and Oswald release have no observed shift in these four diagnostic frames.
- This is not a claim of universally zero CLS: Manrope still moves body text and direction links, most noticeably at 360px (diagnostic contribution 0.082). Deliberately fragmented HTML before the inline block, other engines, physical devices and real-user performance were not tested.
- Actual scripting-disabled iframe sandbox: all five navigation links remain visible; native catalogue disclosure exposes all nine cases; the full STD awards case opens. Brief download/copy controls remain disabled with the existing honest explanation and no transmission.
- Enhanced menu: Enter opens, Tab reaches Projects, Escape closes and restores menu focus, pointer activation works. Sculpture stories advance to frame 2, open that exact full case, and return focus to the sculpture tile.
- Original and subset font outlines/advances/vertical metrics are equal at weight 600. All three main deployment mirrors match. Warm edition, private copy, media, cases, attribution, storage and collection behaviour are unchanged.

## Maintenance

Edit `dist/header-navigation.js`, then run `npm run build:header`. `npm run check` rejects a stale inline block. The inline generator rejects missing/duplicate canonical exports, unsupported imports/exports, unsafe script terminators, duplicate/unrecognized script triggers and malformed boundaries.

Optional font rebuilding uses the retained original font with installed fontTools and Node, without network downloads:

```
python3 scripts/build-headline-font.py
python3 scripts/check-headline-equivalence.py > scripts/headline-integrity.json
```

The normal check verifies embedded bytes, integrity hash, slogan coverage, original full font hashes and mirror consistency. Rebuild and re-audit the subset when the slogan changes. Synchronize `dist/` changes to `trifoti/` and `docs/trifoti/` before checking and publishing.
