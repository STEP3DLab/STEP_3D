# Group 8: optional brief preparation

Base: `c9cc5c9f23482e934a64e2eb11ae645db3470f40`.

## Useful changes

36. A collapsed optional helper explains the four existing directions. Only an explicit button changes the existing direction field; uncertainty and later changes remain possible.
37. Direction-specific material checklists are advice, not upload fields. Unnamed optional checkboxes stay only in page memory, are remembered separately for each direction, and reset with a new brief. They are excluded from exported text and draft storage.
38. An explicit selection action appends up to three existing projects, attribution and canonical public links to the existing reference field. It preserves the previous reference and idea, skips duplicate URLs, and rejects an oversized result without truncating existing content.
39. Browser print/PDF already existed before this group. It is retained, not claimed as a new feature. Black-and-white output and long-text overflow/page-break rules are hardened. The existing formatter covers all six current fields and states that the brief was not sent.
40. An optional idea self-check asks about purpose, environment, scale and references. It does not score or analyze the idea, add required fields, or change text.

No new named form fields, persistent storage, uploads, requests, submission, analytics or media assets. Existing team biographies, six cases, 25 media and attributions are unchanged. The private Sites copy is not touched.

## Automated verification

`npm run check`: 472 tests passed, zero failures/skips. New coverage verifies the four directions and fallback, in-memory checklist/reset, explicit direction changes, safe reference append/deduplication/limits, literal long print text and existing six-field output. Existing regression suite remains included.

Independent native cloud Chromium verification passed at 100% and 250% (472 CSS px): no horizontal overflow, visible keyboard focus, selection transfer from two to three projects with deduplication and preservation of existing fields, six-field clipboard text, optional tick reset after reload while the existing draft is retained, and new-brief reset/empty validation. All 134 runtime files match across the three mirrors. Printable DOM uses literal escaped text correctly. OS print preview was unavailable; saved PDF pagination, physical Android/touch, screen-reader output and native forced-colors are not claimed. Deployment verification is pending at this commit.
