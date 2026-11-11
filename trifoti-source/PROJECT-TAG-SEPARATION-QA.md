# Project card label separation — 11 November 2026

## Reproduced defect

On base commit `cafec54a8c3e12b002db4f957332004822474c6d`, the top-right “Смотреть проект” label obscured the end of the top-left descriptive tag on three detailed project cards at a 606 × 399 CSS-pixel viewport. Chromium screenshots and element rectangles confirmed overlap on the gesture, restoration and RTO cards. The restoration tag extended 28.91 CSS pixels under the higher-z-index action label, including with keyboard focus.

The earlier `.project-grid .project-tag` rule had greater specificity than the later width reservations. It silently replaced their intended `calc(100% - 150px)` / `135px` limits with `calc(100% - 32px)`.

## Limited correction

Add the grid-scoped selector to the three existing width-reservation rules. Their original values, including the wider tag allowance when the action moves below at widths up to 360px, are unchanged. Long tags now wrap into their reserved lane. No text is removed, shortened or hidden. Default, hover and keyboard colors, arrows, images and card behavior remain unchanged.

Only the main CSS, its cache URL, regression test and this QA record change, plus the matching public mirrors. The warm edition and separate private concept remain untouched. No content, attribution, media, brief, storage or network behavior changes.

## Verification before publication

- The live base reproduced three overlapping rectangles at 606px and visibly obscured restoration text.
- Supported local Chromium preview: all nine tag/action rectangle pairs are disjoint at widths 1212, 970, 808, 606, 404 and 303 CSS pixels (100% through 400% browser zoom). Tag text does not horizontally overflow.
- At 606px, the three affected tags wrap to two lines. The restoration card's keyboard-focus and combined hover/focus states keep the full tag and action visible, with existing red outline and arrow treatment. At 303px the action retains its existing 54px bottom offset.
- Opening the restoration card still opens the correct project. Escape closes it and returns focus to that card. Preview zoom restored to 100%.
- The cascade regression accounts for source order, selector specificity and nested media conditions at 320/360/361/600/601/800/801/900/901/1280px. These are static cascade checks, not pixel-layout emulation.
- An independent reviewer ran the new regression against the old CSS in a scratch copy: all ten width cases fail. Candidate full check: 877/877 passed. All 182 runtime files match both public mirrors; `git diff --check` passes.

Before completion, verify fresh remote HEAD, successful deployment, public bytes and live layout. Native Safari/Firefox, physical touch devices, screen readers, text-only zoom and forced-colors rendering were not tested. Category tile hover/focus colors were also inspected with no new defect confirmed; they are unchanged.
