# Visible return from direction stories — 2026-11-06

## Confirmed defect

At baseline `0f017d0`, public Chrome reproduced a separate story-dialog return problem: open the sculpture story at 100%, zoom to 300% (394 × 252 CSS px), then press Escape. Focus returned to the original sculpture tile, but its top settled around 840 CSS px below the viewport. The existing full-case correction did not cover the direction-story dialog.

## Change

The cancellable return guard is now a shared module used by both dialogs. Explicit story close keeps an already visible tile in place and reveals an offscreen focused tile, including after delayed native history restoration. Reopening, newer navigation, focus changes, page departure and keyboard/pointer/touch/wheel input end correction. Failed focus does not attach listeners. Story-to-case navigation remains route-owned and does not trigger story-return scrolling.

Content, real media, attribution, the four directions, local-only brief and separate warm snapshot are unchanged. There are no timers, new history entries, persistence, tracking or network submissions.

## Verification

- Three new story regression cases failed at baseline. The fixed focused suites passed 76 tests, including existing full-case return scenarios. Independent review passed 104 related tests and found no blocking regression.
- Full `npm run check`: 817 passed. `node --test scripts/test-warm.mjs`: 16 passed. Syntax, generated resources and whitespace checks passed.
- Local managed preview worked in this cycle. At 300%, the focused sculpture tile returned to approximately 79–248 CSS px, below the 74 px sticky header. Checked Escape, the close button, Back/Forward, manual next-frame, transition to the same frame in the full case, and full-case close. PageDown was not overridden after returning.
- Public release must match the same source files and pass its Pages deployment workflows before completion is reported.

Limits: Chromium viewport changes were tested, not physical phone rotation. Safari, Firefox, mobile operating systems and screen-reader speech were not tested. DOM fixtures supplement, rather than replace, the native browser checks.
