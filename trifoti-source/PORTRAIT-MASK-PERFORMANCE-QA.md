# Lossless portrait-mask delivery — 11 November 2026

## Finding

At base commit `45ed3eb4765a48ebe77dfcd7087c38a079272fdf`, a fresh PageSpeed Insights mobile test fetched the below-the-fold portrait's CSS mask during the initial page load. It was the largest request: 549 KiB of the reported 1,812 KiB. Native lazy loading of the portrait does not defer its CSS mask.

Baseline: https://pagespeed.web.dev/analysis/https-step3dlab-github-io-STEP_3D-trifoti/0j6ndzlkfy?form_factor=mobile

This is one laboratory run, not real-user data: score 90, FCP 1.1 s, LCP 3.6 s, TBT 0 ms, CLS 0.009. The LCP element was the fallback bear poster after video failed in the test browser. No change was made to that fallback merely to improve the metric.

## Limited change

- Re-encoded only the mask's embedded PNG with Pillow's lossless PNG optimization (`optimize=True`, `compress_level=9`). The SVG geometry, filter, MIME type and every decoded RGB value are unchanged.
- The original SVG remains byte-for-byte intact, including its embedded source metadata. The smaller derivative has its own filename and does not assert the original file's provenance signature. Original portrait files and attribution are unchanged.
- CSS uses the new derivative. The main HTML's portrait stylesheet version is updated. No other layout, content, behavior, media, font, storage or private hosting change.

| Mask | SVG bytes | gzip level 9 bytes |
| --- | ---: | ---: |
| Original | 954,685 | 560,895 |
| Lossless PNG derivative | 561,777 | 425,375 |

Compressed saving: 135,520 bytes, or 24.2% for this resource. These deterministic gzip measurements are not a promised timing or Lighthouse-score improvement; CDN transfer size can differ.

## Verification

- `python3 scripts/check-mask-equivalence.py`: all 1,572,516 RGB pixels at 1254 × 1254 match; the SVG outside the embedded PNG matches exactly.
- Decoded RGB SHA-256: `c127d3145e2fd9b963df9726ed778d24c40af1313035cf4439211461ea8ba4a7`.
- Original SVG SHA-256: `1ceeba4e1cbab2ab6329baa11563d400af24789f4160ac99fce932ba81171ced`.
- Optimized SVG SHA-256: `88f5e9883fb8464b99ad877ab5a07b34ff2cb05b2ff572c24e23eadb74db2ae9`.
- `npm run check`: 857 passed. New regression checks the unchanged SVG shell, PNG format, compressed size budget, active CSS reference and cache version. Existing tests pin all four original portrait files.
- The full optional pixel check requires Pillow, like the existing optional font equivalence check. Normal npm checks have no new dependency.

Before publication, verify the current remote HEAD and all three runtime copies. After publication, verify the deployed bytes and portrait rendering. Physical phones and Safari are outside this check.
