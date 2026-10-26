# Category stories + three additional cases · candidate 2026-10-26

## Scope

Four primary square direction tiles replace the first-view portfolio grid. The existing detailed grid, filters, selection tools and explorer remain below a collapsed native disclosure. Empty directions show an honest introduction, not fabricated case examples. Added: three cases from five user-supplied photographs. Existing six cases (with only the authorized direction relabel), 25 media, attributions, biographies, portrait mask/background, brand bear and brief fields/storage keys remain unchanged.

Candidate totals: 9 cases, 30 media (28 photographs, 2 original videos). Sculpture: 5 cases/20 media. Awards: 4 cases/10 media. Interior design and modelmaking: no published cases.

## Automated verification

- `npm run check`: 604 tests passed, 0 failed against candidate source.
- Generated category/card markup, nine complete static case pages, catalogue, light view, meeting page and information packet are reproducible.
- New tests cover all allowlisted story routes, 30 exact frames, one-entry sessions, Back/Forward/reload, finite final frame/restart, shared-link safe close, exact-frame story-to-case replacement, single-modal ordering, manual media controls, video pause, stale-media events, safe photo swipe, empty introductions and closed-catalogue focus fallback.
- Existing test coverage remains in place. Collection-size assertions use the expanded dataset; legacy record/media hashes still check the same original subset.
- All five JPEGs match the supplied bytes via SHA-256; the 32 original/poster dimensions manifest matches actual assets.
- All changed JavaScript modules and their importing dependency chain use the `20261026-directions` cache release. Portrait stylesheet bytes and its existing mask assets are not changed.
- `git diff --check`: passed.

## Interaction contract

Story frames replace the session history entry, with no timers or auto-play. A full-case handoff replaces that entry with the exact original `#project/<case>/media/<id>` route and closes stories before opening the case. Back/close returns to the originating page; Forward restores the full case. A shared/deep link closes locally to `#projects`. No selection controls are duplicated inside stories.

Native fallback tiles link to real catalogue anchors or existing service sections. No unvalidated `#stories` links are placed in static fallback markup. Story imports are optional: failure leaves the native links usable. Filter query links, service collection links and exploration routes reveal the catalogue. Focus restoration rejects targets inside closed details.

## Native verification / release gate

Independent native desktop and approximately 320/390-CSS-pixel desktop-zoom QA passed the essential story/category flows; publication is gated by the parent. Do not interpret passing model-DOM tests as physical touch, screen-reader, mobile-device, print/PDF or forced-colors verification. The parent owns native acceptance and publication; no release has been made by the implementation worker.

Known environment limitations remain: native print is disabled; DevTools/forced-colors route was denied previously. No bypass or settings change was attempted. Actual PDF pagination and physical phone/touch are not claimed.

## Latest user direction revision and narrow-screen correction

Before publication the user revised the four directions/order to: Дизайн интерьеров, Скульптура, Сувениры и призы, Макетирование. The interface, service descriptions, brief options/preparation and generated resources follow this list. Interior design and modelmaking have no assigned case. Existing service anchors and design/everyday story aliases remain compatible. Saved old brief directions retain their original meaning as legacy options.

Initial native 320-CSS-pixel approximation found collapsing tile artwork and Top overlapping a CTA. The corrected tile artwork is absolutely positioned and contain-fit, independent of text flex sizing; narrow tiles have compact labels and explicit media space. Top is hidden while story tiles intersect the viewport, except while it itself retains keyboard focus. Targeted native recheck confirmed visible artwork, stable 2×2 squares and unobstructed CTA at approximately 320 CSS pixels; desktop and approximately 390 CSS pixels passed too. A final tiny-width font adjustment keeps «Макетирование» on one line.

Native checks also passed all five new photo views, both manual video paths, finite end/restart, exact-frame story→full-case→Back/Forward, honest empty introductions and latest service labels/order. Desktop zoom/window approximation is not physical-phone verification. The parent inspected representative screenshots and authorized publication after the tiny-title correction.
