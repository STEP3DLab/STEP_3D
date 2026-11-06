# Bear fallback recovery — 2026-11-06

## Confirmed failure

Baseline `768ca72`: after the two video formats fail, explicitly playing the GIF fallback can also fail. Native Chrome with the three files unavailable in a local QA copy shows `complete=true`, `naturalWidth=0`, while the toggle remains pressed, is labelled “Приостановить вращение”, and the hint says “Скульптура · 360°”. The failed image has no recovery message.

## Bounded change

A failed current GIF clears playback intent, returns to the existing static poster, and gives a visible live-status message plus an accessible retry label on the same play control. Keyboard Enter/Space and the play button can try the same original GIF again. Failure persists until a successful GIF load; repeated failures remain retryable. No automatic retries, new assets, services, storage or data collection are introduced.

Image events are checked against the current GIF source, completion and natural width. Pending or healthy current images are not marked failed because an obsolete error arrives. Poster errors never restart requests or recursively reset the poster. Tab, viewport, reduced-motion and Save-Data transitions retain their existing guards. The entry point and bear module have new cache keys.

## Verification before publication

- Baseline: 770/770 aggregate and 16/16 warm tests passed.
- Eight added regressions cover failure, explicit retry success and failure, focus preservation, keyboard retry, unchanged original URL, poster failure, inactive/obsolete image events, preferences, viewport/tab changes and cache keys. They fail against the baseline where applicable.
- Final aggregate: 778/778 passed. Warm: 16/16 passed. Independent read-only review approved; focused suites 91/91 passed.
- Native Chrome: unavailable MP4/WebM/GIF reproduced the baseline; the fix restored the 480 px poster, unpressed the toggle and retained focus. Repeated missing-file retries stayed recoverable. With preview live-reload disabled, restoring the GIF kept the failure visible until Enter loaded the 360 px animation on the same page; Enter paused back to the poster. With the poster also unavailable, the error remained without recursive recovery.
- Existing full-gallery recovery also passed native Chrome fault checks: repeated missing photo, restored 1536 px original with focus on the viewer, and restored video metadata/controls remaining paused. These paths did not require source changes.
- At 394 × 252 and 295 × 189 CSS px (300% and 400% browser zoom), the retry control and message fit on screen with no horizontal overflow. The poster remains the real existing asset.

These are fault-injected local-browser and automated checks, not a claim that production assets are currently unavailable. Physical phones, Safari, Firefox, screen-reader speech and real connection throttling were not tested.
