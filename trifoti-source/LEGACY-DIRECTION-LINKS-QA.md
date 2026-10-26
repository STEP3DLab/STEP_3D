# Legacy direction links · candidate 2026-10-26

## Correction

`#service-everyday` used to identify «Бытовой дизайн»; reusing it for «Макетирование» changed the meaning of a published link. Modelmaking now has `#service-modelmaking`, used by its current hero/footer links, generated tile and story introduction. The canonical `#stories/modelmaking/intro` remains unchanged.

Old `#service-everyday` and `#stories/everyday/intro` land on a native notice: «Направления изменились», followed by exactly four current choices in the agreed order. Fragment targets and CSS `:target` reveal it without a JavaScript redirect, new history entry or storage write. The everyday story alias is removed; the design/interiors alias is unchanged. The notice is not a fifth service and contains no brief-selection CTA.

## Verification

- `npm run check`: **610 tests passed, 0 failed**.
- New regressions cover both old deep links, no automatic modelmaking selection/modal, canonical modelmaking links, four choices only, repeated Back/Forward/close and no added history entries.
- A synthetic test executes the actual app restoration loop for all four legacy labels plus «Предметы и интерьер», all six fields, multiline text, load/reload and route transitions. Stored bytes remain unchanged and writes remain zero; pre-existing migration and export behavior is retained.
- `trifoti-brief-v1`, its six fields, existing draft helper and all saved-value handling are unchanged. No new persistence or networking.
- Fresh cache versions cover the changed application/module chain and stylesheet. All **177 runtime files** match across `dist/`, `trifoti/` and `docs/trifoti/`; `git diff --check` passes. Photo assets, project data and portrait rules are unchanged.

## Native acceptance / publication

Independent Chromium desktop acceptance passed: both old hashes visibly showed the notice and four ordered choices, with no modal and modelmaking initially collapsed. The fresh-origin brief stayed on its default option. The modelmaking choice opened the canonical service; Back restored the old-story notice and Forward restored that service without a loop. The canonical modelmaking story showed its honest empty introduction and service link. The parent then authorized publication.

The native check did not edit input/storage or inspect a saved legacy draft. Legacy saved-value preservation is covered by the synthetic regression, not claimed as native storage evidence. Narrow-screen, no-JavaScript, physical-phone/touch and screen-reader checks were not repeated for this patch. The independent tester closed the QA tab and stopped the owned preview server; no browser settings were changed.
