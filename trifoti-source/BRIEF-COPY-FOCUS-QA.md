# Brief clipboard focus — 2026-11-06

At baseline `5ab4134`, a delayed clipboard rejection moved focus out of the visitor's newer edit into the manual-copy textarea. The earlier clipboard fix covered publication sources and project selections, not the brief.

The brief's copy button now stays focusable while pending, with `aria-disabled` and the existing synchronous guard preventing duplicate requests. A rejected copy still reveals the current brief and announces manual recovery, but only focuses/selects it when the initiating copy button still owns focus. Reset clears the pending state and invalidates obsolete results. No new storage, transmission, media or services are introduced.

## Verification

- The new moved-focus regression fails on the baseline and passes after the fix. Three additional tests cover newer edit focus, retained button focus with duplicate activation, and successful completion after moving focus. Existing validation, current-text fallback, stale-result and reset checks remain passing.
- Aggregate suite: 787/787. Warm snapshot: 16/16. Independent review: 70/70 focused tests plus 787/787 aggregate and clean whitespace checks.
- Native Chrome, local fault-injection page: a six-second delayed clipboard rejection reproduces the baseline focus theft. After the fix, the idea field retains focus and the fallback contains its latest text. With no intervening focus change, the full fallback text is selected. A repeated attempt works. Delayed success preserves the newer field focus and correctly reports that the copied version predates the latest edit.
- Native Tab navigation remains available while copying, including the narrow layout. At 1182 and 394 CSS px (desktop browser zoom), no horizontal overflow was observed. This is not a physical-phone or touch test.
- The clipboard denial was simulated in the local QA page, which is not included in the release. These checks do not establish behavior of actual browser permission prompts. Physical phones, Safari/Firefox and screen-reader speech were not tested.
