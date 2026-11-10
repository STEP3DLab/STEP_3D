# Warm responsive images QA

Date: 2026-11-10. Base: 95d36df9d6033c54a5692dccb0d67266ee332dfc.

## Scope

Only the homepage hero and the original emblem used in both header and footer.
Three img tags gain srcset/sizes. Existing src fallbacks, dimensions, alt text,
high hero priority, asynchronous decoding, markup, CSS, scripts, original images,
all project content, attribution and noindex/nofollow remain unchanged.
The independent warm snapshot and docs mirror are identical. The hero template
and shared logo generator are aligned; the broad warm rebuild was not run.

## Asset preparation

ImageMagick 7.1.1-43: Lanczos full-image resampling, no cropping/upscaling.
Hero: WebP quality 90, method 6; original 2048w retained as the largest candidate.
Logo: lossless WebP encoding after resizing, original sRGB ICC profile retained.
Original Git blob hashes are asserted by the test script.

| Asset | Bytes |
| --- | ---: |
| Original hero 2048 | 273234 |
| Hero 480 | 33806 |
| Hero 768 | 67684 |
| Hero 1024 | 101924 |
| Hero 1440 | 159600 |
| Original logo 1536 | 158733 |
| Logo 96 | 8476 |
| Logo 192 | 22218 |
| Logo 288 | 40630 |

Hero SSIM against the same-size uncompressed Lanczos reference: 0.975536,
0.977782, 0.979388, 0.982284 respectively. The smallest and largest logo
derivatives and the smallest hero were visually compared beside resized
originals. Color and composition remain consistent. Lossless refers to the WebP
encoding, not to resizing; the decoded logo can differ by up to 2/255 from a
separately PNG-quantized reference.

## Automated and real-browser checks

- Python static checks pass: source templates, dimensions, original hashes,
  all seven image mirrors, smaller payloads, priority and non-lazy hero.
- Optional baseline comparison proves only the three image tags changed.
- All original stylesheet and script blocks compare equal.
- Python syntax compilation passes. Existing gallery regression: 17/17 pass.
- Real Chromium, 24/24 matrix rows pass. Actual devicePixelRatio was 1, 2, 3
  using native browser zoom at 100%, 200%, 300%, restored to 100% afterward.
  Same-origin iframe viewports test eight widths, including CSS breakpoints.
  This tests density-aware selection, not physical iOS/Android devices.
- Every row checks currentSrc, successful decoding, aspect ratio, actual logo
  width, hero priority and no horizontal overflow. A desktop scrollbar reduces
  content width slightly; sizes=100vw is the conservative correct CSS estimate.
- Per-case image query strings prevent reuse of larger cached candidates.
- Actual CSS comes from the unchanged live site. Keyboard mobile menu opens
  with Enter and closes with Escape in the preview. No forms were submitted.

| CSS viewport width | DPR | Selected hero | Selected logo | Result |
| ---: | ---: | --- | --- | --- |
| 320 | 1 | hero-480.webp | logo-96.webp | pass |
| 390 | 1 | hero-480.webp | logo-96.webp | pass |
| 768 | 1 | hero-768.webp | logo-96.webp | pass |
| 800 | 1 | hero-1024.webp | logo-96.webp | pass |
| 801 | 1 | hero-1024.webp | logo-96.webp | pass |
| 1150 | 1 | hero-1440.webp | logo-96.webp | pass |
| 1151 | 1 | hero-1440.webp | logo-96.webp | pass |
| 1440 | 1 | hero-1440.webp | logo-96.webp | pass |
| 320 | 2 | hero-768.webp | logo-192.webp | pass |
| 390 | 2 | hero-1024.webp | logo-192.webp | pass |
| 768 | 2 | hero.webp | logo-192.webp | pass |
| 800 | 2 | hero.webp | logo-192.webp | pass |
| 801 | 2 | hero.webp | logo-192.webp | pass |
| 1150 | 2 | hero.webp | logo-192.webp | pass |
| 1151 | 2 | hero.webp | logo-192.webp | pass |
| 1440 | 2 | hero.webp | logo-192.webp | pass |
| 320 | 3 | hero-1024.webp | logo-192.webp | pass |
| 390 | 3 | hero-1440.webp | logo-288.webp | pass |
| 768 | 3 | hero.webp | logo-288.webp | pass |
| 800 | 3 | hero.webp | logo-288.webp | pass |
| 801 | 3 | hero.webp | logo-288.webp | pass |
| 1150 | 3 | hero.webp | logo-288.webp | pass |
| 1151 | 3 | hero.webp | logo-288.webp | pass |
| 1440 | 3 | hero.webp | logo-288.webp | pass |

At 390px/DPR2 the two unique image resources total 124142 bytes instead of
431967 bytes (71.3% lower). At DPR3 the larger hero is intentionally retained
for sharpness; desktop high-DPR cases still use the original 2048w hero.
Header/footer share the same logo URL, so normal browser caching avoids a second
transfer.

## Reproduce

1. bash trifoti-source/scripts/build-warm-responsive-images.sh
2. python3 trifoti-source/scripts/test-warm-responsive-images.py
3. python3 trifoti-source/scripts/prepare-responsive-image-preview.py
4. Start the supported managed preview at trifoti-source/preview.
5. Open its returned URL. Run the width matrix at actual DPR 1, 2, 3.

The preview directory and generated case files are local QA only, not publication
inputs. The checked-in HTML harness and preparation script contain no production
instrumentation, analytics or service worker.

## Performance interpretation

Baseline supplied for the existing site:
https://pagespeed.web.dev/analysis/https-step3dlab-github-io-STEP_3D-trifoti-warm/k2dct4n8kq?form_factor=mobile
Mobile, Moto G Power, slow 4G, first visit: score 75, LCP 5.3s, CLS 0.
This is one laboratory result, not field data. Payload reductions are deterministic;
LCP and the score depend on network, cache, CPU and audit variability. Re-run the
same mobile PageSpeed profile after deployment and report the observed result
without a promised performance score.

