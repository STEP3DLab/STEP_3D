# Gallery return after viewport changes — 2026-11-06

At baseline `e914eda`, Chrome could restore keyboard focus to the original portfolio tile outside the visible viewport after a zoom change while the gallery was open. Reproduction: open sculpture stories at 100%, zoom to 300% (394 CSS px), open the full case and close it with Escape. The focused tile began about 692 CSS px below the top of a 252 CSS px viewport.

The existing cancellable return guard now also protects the unchanged opener. A still-visible opener keeps its position. An offscreen opener is revealed immediately, including after late native history restoration. New input, focus changes, later navigation, reopening or leaving the page still stop correction. Failed focus does not leave inactive listeners attached. No content, media, attribution, storage, data transmission or history entries change.

## Verification

- Focused return tests cover original cards, comparison buttons and story tiles, initial and delayed displacement, normal visible returns, input cancellation and failed focus. New regression cases fail against the baseline.
- Aggregate checks: 812 tests. Warm snapshot: 16 tests. Publication mirrors must match source before release.
- Independent source/VM review found no blocking regression. Its focus-failure hardening recommendation was incorporated and tested.
- The baseline defect was reproduced in public Chrome. Managed local preview reported a running service, but Chrome returned ERR_CONNECTION_RESET; local fixed-browser verification is unavailable in this cycle. Public deployment verification is therefore performed separately after publication.
- Physical phones, Safari/Firefox and screen-reader speech are not tested. Zoom is a viewport-change reproduction, not proof of a physical orientation test.
