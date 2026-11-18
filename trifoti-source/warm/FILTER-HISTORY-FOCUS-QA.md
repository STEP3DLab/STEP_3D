# Warm filters: keyboard focus when history hides a card

Verified 2026-11-18 in Chromium using the managed Sites preview.

The filter captures the focused card (including its surrounding project item)
before hiding it and returns focus to the selected filter without scrolling.
Unrelated focus is left alone. Source and published mirror remain identical.

## Browser checks

- Open the initially collapsed «Подробные кейсы · 10» section.
- From a URL without a fragment, select «Награды», follow the «Проекты»
  anchor, select «Все», focus the mascot sculpture link, then go Back.
- The URL restores `filter=awards`; only four awards remain visible and
  `document.activeElement` is the awards filter, not BODY.
- Confirmed the focus still remains on that button on the next browser check.
- Forward restores all ten projects without stealing focus from the filter.
- Repeated Back scenario at a 400 CSS-pixel viewport using «Смотреть проекты».
  Filter focus is preserved, controls wrap within the viewport, all buttons
  remain 44 pixels high, no horizontal page overflow.

The earlier suspected Back failure was not reproduced with the case section
open and the distinct history entries established as above. No speculative
additional timing/focus workaround was added.

## Automated checks

`npm run check`: 1089 passed, 0 failed. Includes 14 new focus checks,
existing content/fact validation, generated render checks and mirror parity.
No case facts, images, or ordering were changed.
