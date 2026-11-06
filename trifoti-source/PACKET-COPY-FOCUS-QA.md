# Information-pack copy focus — 2026-11-06

At baseline `832d5d9`, a delayed clipboard rejection on the standalone information pack always focused and selected its manual-copy URL, overriding a newer keyboard action. Other copy controls already preserved newer focus.

The fallback remains visible with the same exact public selection URL. It now receives focus and selection only while the initiating Copy button still owns focus. Selection-change and repeat-attempt revision guards remain unchanged. The generated HTML uses an updated module cache key. No content, media, attribution, storage, services or requests change.

## Verification

- Five new regressions cover moved/retained focus, delayed success, selection invalidation, and repeated attempts. The moved-focus case fails against baseline. All 808 aggregate tests and 16 warm snapshot tests pass.
- Independent read-only review approved; all 21 focused tests, renderer consistency and module syntax checks pass.
- Chrome local fixture with explicitly simulated deferred clipboard promises reproduces the baseline failure. Fixed code keeps the newer Print focus, selects all 88 characters when Copy retains focus, and preserves newer focus after success. Repeated attempts remain usable. The fixture is outside the release.
- This does not establish a production browser permission denial. Physical phones, Safari/Firefox, screen-reader speech and native PDF pagination were not tested in this cycle.
