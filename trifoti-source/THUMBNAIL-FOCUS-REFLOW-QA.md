# Keyboard thumbnail visibility in short windows — 11 November 2026

## Reproduced defect

Base: `81fcba001df53a4bfc5f08ed97ce472332360ff9`.
On the public main site in Chromium at 832 × 240 CSS pixels, open the bear case. Tab to the first thumbnail, press End to select its video, then ArrowLeft to select the sketch. The focused sketch thumbnail extends from y=191.375 to y=252.375 while the inner scroller ends at y=228. The lower 24 pixels, including part of the focus outline, are clipped.

The thumbnails wrap into multiple rows above the 800px breakpoint. Their keyboard handler explicitly suppressed focus scrolling, while the frame renderer only adjusts horizontal thumbnail scrolling. Switching from video back to an image also restores the photo controls above the strip. Normal Tab navigation was unaffected.

## Narrow correction

Allow native focus scrolling only in the thumbnail Arrow/Home/End handler, after rendering the selected frame. Already-visible targets need no explicit scroll; offscreen targets can be revealed by the browser. Keep the existing horizontal centering, roving Tab stop, key filtering, route updates, and single-frame behavior. Refresh the main app URL and synchronize both public mirrors.

No CSS, visual design, content, media, attribution, story categories, brief fields/storage, warm edition, private copy, or analytics behavior changes.

## Prepublication verification

- Baseline: 880/880 tests pass. The added real-initializer regression fails on the original preventScroll option and passes after its removal.
- Candidate: 882/882 tests pass. The regression covers End, Home, ArrowLeft, wraparound, and ignored Tab/modified/already-consumed keys. It verifies render-before-focus order and the absence of scroll suppression; it is not a simulated browser layout test.
- Both changed runtime files match both public mirrors byte-for-byte. The app URL has a fresh thumbfocus parameter. git diff --check is clean.
- Independent read-only review approved the narrow change and independently reran all 882 tests.
- Baseline browser audit at 832 × 361 and 667 × 300: Tab reaches controls and wraps within the modal, Close remains visible, and the content has no horizontal overflow. Crossing the 800px breakpoint preserves the active case and frame. The short-window arrow-key failure was then reproduced at 832 × 240.

Local HTTP preview attempts returned ERR_CONNECTION_REFUSED, so candidate rendering was not verified before publication. After deployment, repeat the failing 832 × 240 sequence and check narrow single-row thumbnails, fixed Close, and breakpoint crossing before declaring completion. These are resized desktop Chromium windows, not physical phones or device emulation. Safari, Firefox, touch hardware, and screen-reader speech are outside this check.
