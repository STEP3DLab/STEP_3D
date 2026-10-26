# Group 9: trust, sources and attribution

Base reviewed through GitHub: `1f0c5fa2f49ee89d91d2540e9f020752bee0fced` (main, 26 October 2026). Initial checkout was clean. Work is restricted to `trifoti/`, `docs/trifoti/` and `trifoti-source/`. Independent native acceptance passed; deployment is pending at this candidate commit.

## Useful results

41. Three reading routes each connect three existing sources, displaying the format, publisher and an original reason for reading. No articles are copied.
42. A publication chronology separates the 19 dated records from two undated records and distinguishes project/competition/opening reports. Publication dates are not creation dates; year/month precision remains intact.
43. Four short definitions are supported by directly reviewed institutional/official sources (IMMA, National Portrait Gallery, NIST and Autodesk). No unsupported term, equipment/material claim or speculative case example is included. See `TRUST-SOURCES.md`.
44. A concise guide separates the ТРИФОТИ site/collective, Step3D cup development/production, Technopark RGSU award team and the sculptor's personal publications. It does not allocate unknown individual roles.
45. `information-pack.html` is a separate openable, text-only reference with up to three selected case records, their exact attribution/source URLs, two team profiles with owner-approved achievements (provenance retained in `TRUST-SOURCES.md` and `TEAM-SOURCES.md`). Existing exploration passes current selection IDs into `#cases/…`. The packet can change/reset selection, copy its canonical link with honest fallback, and request browser print/PDF. No personal brief fields are used. Without JavaScript the full six-case text reference remains readable; the page explicitly says selection from the URL was not applied.

## Automated verification

`npm run check`: **488 passed, zero failed or skipped** (472 existing + 16 new). Coverage includes route source/format integrity, date precision and unknown dates, explicit attribution/provenance, generated output consistency, safe links, noindex, selection sanitization/max-three, repeated/reset/hash/history flows, copy success only after confirmation, denial fallback and stale-copy protection, print-request semantics and non-clipping CSS rules. The unchanged regression suite is included. Cache-version assertions were updated to the new release URLs without relaxing other checks.

All **138 runtime files** match between `trifoti-source/dist/`, `trifoti/` and `docs/trifoti/`. The main team section and `project-data.js` are unchanged. Six cases, 23 photographs, two videos, prior links/attribution, noindex, exactly six brief fields and existing storage keys remain. Balanced markup and unique IDs were checked for index and packet. `git diff --check` passes.

No new runtime network API, collection, submission, backend, analytics, persistent storage, upload, contact or media asset is added. Glossary source links open only on explicit navigation. Private Sites is untouched.

## Independent verification / limits

Independent native Chromium acceptance passed after the skip-link fix. The reviewer initially found that the packet skip link replaced the selection hash and cleared the cases. It now focuses/scrolls the main landmark without changing hash/history, retaining the native href for no-JavaScript use. The regression test and the native keyboard retest both pass.

Verified at 1165 CSS px / 100%, 466 CSS px / 250%, and 388 CSS px / 300%: no horizontal overflow; four context panels and source/status wording; packet max-three selection and rejected fourth; reset focus to the first checkbox; duplicate/unknown hash IDs; repeated Back/Forward; canonical clipboard text via native paste; exploration-to-packet exact selected IDs; skip link preserves both selected IDs and focuses MAIN. Actual JavaScript-disabled fallback shows all six records and the explicit warning; the reviewer's temporary local-only setting was restored to its original Allow (default). No further browser-setting changes are needed. Screenshots: `trifoti-native-qa/group9-*.jpg` in the task workspace, outside the repository. The separate read-only code review found no further concrete defects; its 16 targeted tests passed.

Native clipboard-denial fallback was not exercised; its denial and stale-result branches are covered by automated tests.

Actual browser print/PDF pagination is **not verified**: the current managed browser's menu Print is disabled and keyboard/site actions do not open the OS print dialog. No claim is made that a PDF was saved or every printed page inspected. The packet's visible HTML, source links and print CSS are testable; that is not actual pagination evidence. Tasks 24 (native forced-colors) and 39 (saved-PDF pagination) remain unaccepted. Actual Android/touch, screen-reader output and native forced-colors remain unverified.

## Release handoff

1. Finish independent native QA; resolve any defect and repeat affected tests before publishing. Record the actual result rather than turning pending checks into passes.
2. Re-read GitHub main. It must still be the base SHA above, or stop and review concurrent changes before integration. Do not overwrite another editor's changes.
3. Publish only reviewed changed files under the three approved paths. Use deduplicated blob creation and a compact tree against the fresh base; guard ref advancement with the expected old SHA. Do not change private Sites or other repository files.
4. Verify the resulting exact commit on main, both Pages workflow outcomes, then byte-compare the eight changed runtime files below against the served public files. Smoke-test the public context section and selected packet.
5. Report only accepted results and explicit verification limits; do not count tasks 24/39 merely because implementations exist.

Runtime files to verify: `index.html`, `app.js`, `style.css`, `exploration-panel.js`, `trust-data.js`, `information-pack.html`, `information-pack.js`, `information-pack.css`.

Generation: `npm run build:trust` (updates the index's marked trust block and packet from shared data), then `npm run check`; synchronize the eight changed runtime files into both public mirrors. Existing publication generation remains separate and unchanged.
