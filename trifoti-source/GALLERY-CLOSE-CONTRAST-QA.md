# Gallery Close contrast — 11 November 2026

## Reproduced defect

On base commit `07120e76778ef82ebeefe4b25f48328b7dd69f35`, the main red-white site's full-case Close control became almost invisible when hovered. Chromium reported white text (`#fff`) on paper (`#f5f3ee`), a contrast ratio of 1.109:1. Both the visible “Закрыть” label and the cross inherited this color.

The general `.close-button:hover` rule supplied white text and a dark background. The later `.project-dialog-header>.close-button` rule had equal specificity and replaced only the background with paper.

## Limited correction

A hover rule scoped to the project header restores the existing dark-background/white-text treatment. Default colors, dimensions, focus ring, native dialog behavior and the separate review-dialog control remain unchanged. The stylesheet URL is refreshed and both public mirrors are synchronized. The independent warm edition is untouched.

No content, media, attribution, brief, storage, network requests or private hosting settings were changed. Native forced-color adjustment remains automatic.

## Verification before publication

- Chromium on the deployed base reproduced the white-on-paper hover visually and through computed styles.
- Supported local preview: default and keyboard-focus states retain ink on paper. Hover and hover plus keyboard focus use white on ink, with the existing red focus outline.
- Checked at 1156 × 757 and 385 × 252 CSS pixels (300% browser zoom). The Close control remains visible and closes the full case; focus returns to the sculpture category tile. Browser zoom was restored to 100%.
- The focused cascade regression covers project and review Close controls in default, hover, focus-visible, and combined states. It accounts for source order, specificity and the actual nested header structure.
- An independent reviewer ran the new tests against the old CSS in a scratch copy: both project hover scenarios fail at 1.109:1. Current contrast tests pass 33/33; the full check passes 866/866.
- All 182 runtime files match both public mirrors. `git diff --check` passes.

Publication still requires a fresh remote-HEAD check, deployment completion, deployed-byte comparison and a public-browser hover check. Physical touch devices, Safari/Firefox, screen readers and native forced-colors rendering are outside this verification.
