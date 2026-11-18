# Header at high browser zoom

2026-11-18, baseline 9de7e42.

Confirmed in Chromium: at 200% zoom in a narrow desktop window (250 CSS px),
the full wordmark and contact action push the menu toggle outside the viewport.
Baseline document overflow: 35px. This also makes the last menu action difficult
to reach even though the menu itself correctly supports vertical scrolling.

Below 301 CSS px, hide only the visible wordmark text. Keep the original brand
mark, the home link's full accessible name, contact action and 44px menu toggle.
At 333px and normal 400px the original full wordmark is unchanged.

Browser verification after change:
- 250px: no horizontal overflow; menu toggle bounds 186–230px, height 44px.
- Open menu, reach the last link «Новости и блог», navigate to #journal;
  menu closes and section is visible.
- 333px: full wordmark restored, no horizontal overflow.
- 400px: Enter opens menu, Escape closes it and focus stays on the toggle.
- Browser zoom restored after QA. No facts, cases, assets or links changed.

Full suite: 1116 tests passed, 0 failed. Source, warm CSS and docs mirror agree.
