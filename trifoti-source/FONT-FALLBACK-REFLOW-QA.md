# Fallback-font heading reflow — 11 November 2026

## Reproduced defect

Base: `df068620041874b1255bbfce410ea9a73a88b7cb`.
A separate local copy omitted the font binaries while retaining the original HTML, CSS and media. At a 606 × 399 CSS-pixel Chromium viewport, the last slogan line measured 604px inside a 539px block. The hero's overflow clipping visibly cut off the end of “не существует!”. The original `white-space:nowrap` prevented a safe line break when Oswald was unavailable.

## Limited correction

Allow normal wrapping and emergency word wrapping for the slogan spans only inside the existing <=800px single-column media rule. The desktop rule is unchanged: applying wrapping globally also changed the grid's intrinsic sizing, so that broader approach was rejected. Text, font sizes, weights, spacing, colors and assets remain unchanged. Refresh the main CSS URL and synchronize both public mirrors. The independent warm edition is untouched.

## Verification

- With fonts absent, final text fits its own width at 606, 404 and 303 CSS pixels. The final phrase wraps to a second line, no text is removed, and no document-level horizontal overflow appears.
- With the original fonts available, baseline and candidate retain identical slogan line heights and container widths, plus identical hero heights, at 1212, 606, 404 and 303 CSS pixels. The wide layout retains its original intrinsic sizing.
- At 303px with fonts absent, the menu opens and closes; all five navigation labels fit. A sculpture story opens, advances to the second frame, and opens that exact frame in the full case. Closing returns focus to the sculpture tile. No brief fields were changed.
- Browser zoom was restored to 100%. The small viewport checks used full browser zoom, not text-only zoom.
- Three source regressions protect the scoped wrapping rule, unchanged slogan and font settings, synchronized mirrors and fresh stylesheet URL. The full check passes 880/880.
- Independent review and negative control against the old stylesheet confirm the wrapping regression detects the defect. These automated assertions inspect source; native browser checks cover rendered layout.

No content, attribution, project media, local brief storage, analytics or network behavior was added or changed. Native text-only zoom, other browser engines, physical devices and screen readers are outside this limited check.

Before calling publication complete, verify fresh remote HEAD, successful deployment, matching deployed CSS/HTML and the public page.
