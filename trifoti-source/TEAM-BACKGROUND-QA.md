# Team portrait background — 26 October 2026

- Base: `1cfcaa23f98de931af65bae5bb8de99dc8d0a37c`; requested change is only Fedor's background. The separate spacing request was canceled.
- Both original CSS backdrops were `#e8e5df` (`rgb(232,229,223)`); the visible gray versus violet backgrounds were embedded in the photographs, so changing that solid color alone would not work.
- The displayed Fedor photograph still uses the original 920/480 WebP files, unchanged. A generated black/white segmentation mask is consumed as an SVG luminance mask. Its near-white region is normalized to fully opaque with `1.1 × channel − 0.05`, so the face, clothing, hands and tabletop are not tinted or repainted. No generated replacement portrait is included.
- Behind that foreground, CSS uses sampled Khristina colors `#8829bd`, `#6e16c8`, `#a649c8`, `#a03bad` and a curved violet accent. Khristina's image and styles are unchanged. There is no single target solid color: her original background is a gradient.
- Existing desktop 4:3 / narrow square aspect ratios, `object-fit:cover`, Fedor's `50% 14%` object position and Khristina's `50% 32%` position are preserved. The mask follows the same square cover crop and position. Browsers without luminance-mask support retain the unmasked original photograph.
- Native Chromium review: desktop viewport 1180×757, 100%; narrow effective viewport 472×303 at native 250% zoom. Hair, face, shoulders, elbows, hands and the white tabletop were checked. No horizontal overflow. This is not a physical phone/touch test. Zoom restored to 100%.
- `npm run check`: 567/567 passed (564 existing, 3 portrait-preservation checks). All three runtime mirrors are identical. Four original portrait SHA-256 values are pinned in `scripts/test-service-labels.mjs`.
- No biography, name, spacing, card count, portfolio media, attribution, noindex, brief behavior, storage, analytics or private Sites changes.

Native screenshots are retained outside the public repository under `../trifoti-native-qa/`: `team-background-before.png`, `team-background-candidate-desktop.png`, `team-background-narrow-top.png`, `team-background-narrow-table.png`.
