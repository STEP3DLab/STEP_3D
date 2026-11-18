# Concept destinations — 2026-11-18

## Confirmed obstacle
At 400 CSS px the Atlas direction link opened a bare WebP image, without the site's context, concept status, return or discussion links. Wolves used the same raw-image destination pattern.

## Change
Two static concept pages preserve the original image bytes and captions. Clear non-manufactured/non-interactive status, original-image access, direction return and discussion link. Main-page direction and concept-section links now lead to these pages. No project fact or case was changed; no message is sent and no existing local brief is overwritten.

## Browser checks
Chrome at 400 and 944 CSS px: each direction → its concept → discussion (#contact); browser Back; explicit direction return opens the matching details. Reload/direct concept URLs render correctly. Images load, no horizontal overflow, contain-fit retains the whole composition. Visible keyboard focus checked. Original images remain available. Mobile is a resized browser viewport, not a physical device.

## Build and tests
Both concept outputs and styles are byte-identical across public copies. The concept renderer is idempotent and reproduces each file; registered last in the premium pipeline so generic resource styling cannot contaminate these standalone pages.
Full legacy build-warm.py was attempted in isolated copies of both changed tree and untouched origin/main (1524b19). Both fail identically before the new step at red7/apply.py:22 (`catalog-filters-row` absent). This pre-existing full-build defect is not fixed or hidden in this release. Incremental generation of both copies and all site regression tests are verified separately. The unpublished RED7 information-pack draft is excluded from publication.
