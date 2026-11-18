# Publication catalogue: stable reading focus

Verified 2026-11-18 against main 0614ba3. Completes draft 965ea24.

- Initial enhancement no longer detaches/re-appends an already correctly ordered
  list, so a visitor who has started reading keeps focus on the source link.
- Late clipboard failure exposes the manual-copy field but only focuses/selects
  it when the visitor is still on the copy button. Moving to search or another
  control is respected. Actual sorting and immediate fallback are preserved.
- No source URLs, dates, attribution, project cases or media were changed.

## Browser evidence

Run `scripts/warm-publication-focus-qa.html` through the managed Sites preview.
It uses the real catalogue markup and production initializer in native DOM,
with controlled clipboard rejection, without changing browser permissions.

The baseline main module fails both late-initialization and moved-focus checks.
The corrected module passes all four browser checks, including immediate manual
copy selection and sorting/reset with all sources intact.

Main page manually checked at 400 and 944 CSS-pixel widths: search «Вести» gives
1 of 21, Interviews gives 5 of 21, sort works, reset restores 21 and focuses
search. No horizontal overflow; all controls remain usable. Browser: Chromium.
Physical phones and other browsers not tested.

`npm run check`: 1104 tests passed, 0 failed. Published warm mirror matches.
