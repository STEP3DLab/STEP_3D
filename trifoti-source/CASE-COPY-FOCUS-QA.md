# Gallery link-copy focus — 2026-11-06

At baseline `6ce9b54`, a delayed clipboard rejection moved focus from a newer gallery control into the manual-copy URL. The earlier fixes covered publication sources, selections, and the brief, not this full-case action.

The gallery still reveals its exact current-frame URL and explains manual copying after failure. It now focuses/selects that fallback only while the initiating copy button still owns focus. Existing closed-dialog, replaced-control, and changed-frame guards remain unchanged. No content, media, storage, or services change.

## Verification

- The actual registered callback is exercised by six new regressions. The moved-focus test fails on baseline; all 28 project-navigation tests pass after the fix.
- Aggregate suite: 793/793. Warm snapshot: 16/16. Independent review approved with 93/93 focused tests. `git diff --check` passes.
- Native Chrome with local fault injection: a five-second rejection reproduces baseline focus theft. After the fix, a newer gallery link keeps focus and the manual URL remains available. With focus retained on Copy, the entire URL is selected. Repeat attempts remain usable.
- Desktop (1182 CSS px) and narrow (394 CSS px at desktop zoom) checks found no horizontal overflow. The narrow check is not a physical-phone or touch test.
- Clipboard denial was simulated only in the local QA fixture, excluded from the release. Real permission prompts, physical phones, Safari/Firefox, and screen-reader speech were not tested.
