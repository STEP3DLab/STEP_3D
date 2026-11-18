# Initial service choice

2026-11-18. Published baseline: 0d2a756.

The corporate service was expanded by default. On a 400 CSS px browser,
its row occupied 946.8 px and pushed sculpture to y=1247.3 and art objects
to y=1602.1 after navigation to the section. With no preselected service,
corporate occupies 83.6 px; sculpture starts at y=376.1 and art at y=730.9
(the settled section scroll position differs by 8 px). About 863 px of
unrequested content is removed from the initial choice, not from the page.

Change: remove only corporate's initial open attribute, and align its generator.
Native disclosures retain all copy, images, links and independent user choices.
No accordion exclusivity or new UI. Explicit #service-corporate still opens it.

Actual Chromium QA at 400 and 944 CSS px: homepage, navigation to services,
art objects -> RED7 case -> start a conversation -> contact guidance.
Corporate opens/closes by Enter; direct corporate route opens under header
(top 95 px vs header 92 px at 944 width). Fresh #directions load starts with
all six closed. No horizontal overflow at 400 px. Existing open user choices
are preserved on same-document navigation. No form edits or external messages.
Before/after screenshots inspected. These are desktop browser widths, not
physical phone tests. Full npm check: 1120 tests, zero failures.
RED7 information-pack draft is excluded from publication.
