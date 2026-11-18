# Quick media selection in shared cases

2026-11-18, based on main 75f727d.

Seven cases with multiple frames now offer a compact native disclosure listing
all existing frames in their original order with exact existing captions. Each
frame has a return-to-index link. Single-frame cases are unchanged. No thumbnails,
new media requests, scripts, invented facts, autoplay, or extra external links.

Browser QA in Chromium managed preview:
- At desktop width, open the bear case index, jump directly to its tenth frame
  (workshop video); target appears at 24px from viewport top; video stays paused.
- Return to index and select the original sketch with Enter; native links work.
- At 400 CSS pixels, the index uses one column, does not overflow horizontally;
  selecting the video and browser Back restores the open list.
- Index is collapsed initially. Original gallery stays available below it.
- Print CSS suppresses the index and return controls.

Automated: 1115 tests passed, 0 failed. Tests cover every case, exact target/order,
no media requests in the index, single-frame exclusion, mirrors and idempotence.
Removing additions from each resulting case reconstructs its baseline HTML
byte for byte. Original photos, video, captions, facts and credits are untouched.

To reapply to an existing warm snapshot after other case-page layers:
`python3 trifoti-source/warm/case-media-index/apply.py`
Do not run the full historical warm rebuild to update this independent snapshot.
