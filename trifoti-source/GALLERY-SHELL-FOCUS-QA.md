# Gallery shell focus check — 2026-11-06

## Confirmed failure

On the published baseline `770f0bc`, Chrome at 300% zoom (394 × 252 CSS pixels): open the sculpture story, then its full case. Press Tab from Close through Sketch, Form and Colour to the photo-enlargement control. Native focus scrolls the outer dialog by 34 pixels as well as the case content. The top of Close moves to −12.42 pixels and is clipped.

## Bounded change

The project dialog uses `overflow:clip` after the existing `overflow:hidden` fallback. The shell no longer accepts focus-driven scrolling; `#project-content` remains the scrollable region. No JavaScript, content, media, attribution, storage or network behaviour changes. The main page has a new stylesheet cache key.

## Verification before release

- `npm run check`: 770/770 passed. Warm checks: 16/16 passed.
- Independent review approved; it reran the 11 gallery-layout checks and all 770 aggregate checks.
- Native Chrome in the local preview: the same 394 × 252 Tab sequence keeps the outer scroll at 0 while the inner region scrolls to 416.33 pixels. Close remains fully inside the dialog, and the focused photo control remains visible.
- Reverse Tab returns to Close. Shift+Tab wraps to the last related-work control while inner scrolling reaches 1322 pixels and outer scrolling stays at 0. Escape returns focus to the originating sculpture tile.
- Reopening resets both scroll positions. Photo zoom, arrow panning, Escape-to-fit, frame navigation, and switching to another case remain functional.
- At 1182 × 756 CSS pixels the header stays visible, images load, frame navigation works, another case resets scrolling, and Escape closes the dialog. Neither tested width has horizontal page overflow.

The CSS test guards the declarations and cache key; the native-browser check supplies the scrolling evidence. No claim is made about physical touch devices, Safari, Firefox or screen readers. Engines without `overflow:clip` retain the previous `hidden` fallback.
