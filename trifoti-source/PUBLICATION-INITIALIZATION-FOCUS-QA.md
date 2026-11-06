# Publication enhancement focus — 2026-11-06

At baseline `f479f05`, the optional publication-filter initializer reinserted all 21 existing source entries even when their order was unchanged. If a visitor had already focused a static source link while the module loaded, Chromium dropped focus to the page body.

The initializer now compares the requested entry order with the actual direct list children and skips DOM moves when the sequences match. Filtering, search and repeated sort updates also avoid unnecessary moves. A genuinely changed order still uses the existing sorting behavior. No source content, links, dates, layout, storage, media or external services changed. The independent warm edition is untouched.

## Verification

- A local QA copy deferred initialization by six seconds after a source link received focus. Chromium reproduced the baseline loss from the source link to `BODY`; the fixed version retained the same link, and the next native Tab reached its copy-source button. The timing harness is not part of the release.
- Five new regressions fail on the baseline. They cover already-focused first/middle/last links, unchanged filter/search order, and true sorting from a reversed initial fixture followed by original-order restoration. The fixture starts with existing list children, matching the static HTML, and models removal-induced blur.
- Publication tests: 55/55. Aggregate checks: 822/822. Independent warm checks: 16/16. Independent read-only review found no blockers and repeated all 55 publication checks.
- Combined search for «Лазарев», video filter and newest order returned the expected single source. Reset restored all 21 sources and focused the search field. No horizontal overflow at 1182 or 394 CSS px (desktop Chromium zoom). Delayed initialization also retained source-link focus at 1182 CSS px.

Physical phones, Safari/Firefox and screen-reader speech were not tested. Printing was not attempted. Simulated delayed initialization verifies the focus behavior, not real network timing or performance measurements.
