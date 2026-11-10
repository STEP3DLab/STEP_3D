# Warm brief clipboard focus — 2026-11-10

At baseline `9988c2e`, a delayed clipboard rejection in the warm edition moved focus out of the visitor's newer edit into the manual-copy textarea. The base site's earlier fix was absent from the independent warm snapshot.

The copy button now remains focusable while pending, using `aria-disabled` and the existing synchronous duplicate guard. Failure still opens the current brief and announces manual recovery, but focuses/selects it only if the copy button still owns focus. Reset removes pending state and invalidates obsolete results. Both module cache boundaries are updated, and the published mirrors match. No content, styling, media, storage, data transmission or services are added.

## Reproduction and checks

1. Fill the required name and idea fields, then start copying with a delayed clipboard response.
2. Move focus to the idea field and continue typing before the clipboard rejects.
3. Before the fix, the manual-copy field steals focus and selects its text. After the fix, focus and typing stay in the idea field, while the manual-copy block contains the latest text.

- The new whole-module regression suite runs the actual warm module with delayed clipboard promises. Before the fix, three assertions fail (two behavior tests and the cache-boundary check); after it, all eight tests pass.
- Aggregate `npm run check`: 856/856. `node --test scripts/test-warm*.mjs`: 78/78. The eight new tests are included in both totals, so these are not disjoint counts.
- `python3 scripts/test-warm-inline-build.py`: six passing tests. `python3 scripts/test-warm-responsive-images.py`: pass. Published warm files match their `docs/trifoti/warm/` mirrors; `git diff --check` is clean.
- Native Chrome: a local QA page imports the actual baseline/fixed modules and uses real DOM focus, form elements and `FormData`, with a controlled clipboard promise. Baseline: six passing scenarios and two failures (pending accessibility state and focus theft). Fixed: eight passing scenarios, covering duplicate requests, moved/retained focus on failure, stale success, reset before success/failure, validation and retry. The local fixture does not write storage or access the real clipboard and is not published.

## Limits

The delayed clipboard denial was simulated. Actual operating-system clipboard permission prompts, physical phones, Safari/Firefox and screen-reader speech were not tested. No mobile-layout claim is made by this JavaScript-only fix.
