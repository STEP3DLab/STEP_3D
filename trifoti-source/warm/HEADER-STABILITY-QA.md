# Warm header layout stability

Date: 2026-11-10. Base: 9f34349e31f3119311a797bdfef9ab6b315d3618.

## Reproduced cause

The external header module was delayed 3500ms by a local test service worker.
At 390px, the stylesheet's accessible no-script fallback made the header 192px
high. When the module added nav-ready, the header became 74px high and MAIN#main
moved upward by 118px. A matching Layout Instability entry scored 0.133856.

The previous mobile PageSpeed run reported CLS 0.131 on MAIN#main:
https://pagespeed.web.dev/analysis/https-step3dlab-github-io-STEP_3D-trifoti-warm/1ewxclzo90?form_factor=mobile
Other runs were zero because initialization sometimes completed before paint.
The controlled delay confirms the mechanism rather than inferring it from the
PageSpeed score alone.

## Change and preservation

The existing independent warm header controller is generated as a strict,
synchronous IIFE immediately after the header and before main. Its external
module tag is removed from this homepage. No network response is needed before
the navigation becomes ready.

The external source file remains byte-identical (SHA256
76856b1cd84199536df049d3dc3ac505e4eeda6fc27312201959d85155ea6117).
A helper regenerates the inline block from that source on every premium apply,
after the interior layer and outside the edition guard. It rejects duplicate or
unsupported controller loads, unsafe module syntax and malformed block markers.
Repeated generation is byte-idempotent.

All surrounding HTML, links, artwork, styles, noindex/nofollow, responsive image
attributes and other scripts are unchanged. Both published homepage copies match.
The broad warm rebuild was not run.

With no page JavaScript, or CSP blocking inline scripts, the original expanded
navigation stays visible. The hidden disclosure button is not exposed. This is
intentional progressive enhancement, with no delayed collapse afterward.

## Checks

- 13 Node tests execute the actual generated inline block: keyboard/pointer
  toggles, Escape, native Tab behavior, focus exit, outside click, breakpoint
  focus recovery, single initialization, source fidelity and mirror parity.
- 6 Python generator tests: both quote styles, duplicate/unrecognized external
  script rejection, marker ordering, unsafe source rejection, missing main,
  source preservation and repeated-build equality.
- Independent read-only review reran all 19 tests and found no remaining blocker.
- Python syntax compilation passes.
- Full surrounding-HTML comparison passes after removing only the replaced
  script. No runtime CSS, external JS or image file is in the publication set.
- Real Chromium keyboard checks pass: Enter and Space toggle, Tab visits all
  five links and CTA, Shift+Tab returns to the trigger, Escape closes and returns
  focus, Tab exits to main without trapping. Desktop trigger stays hidden.
- At 320/800/801px, removing all page scripts or blocking inline scripts with
  CSP leaves all five links visible, keyboard reachable, and no horizontal
  overflow. Blocking every external page script still leaves the inline header
  functional, including Enter/Escape.
- Direct #brief-form navigation lands below the sticky header.
- Visual review matches the previous ready-state header. No CSS changes.
- 3500ms streamed-HTML pause immediately before the inline block: header starts
  expanded but main is not yet parsed; after execution, main first appears at
  the final position. Measured layout-shift score remained zero.

## Browser matrix

Values below observe layout shifts after stylesheets are ready, using the
standard maximum session-window calculation. This isolates navigation readiness
from preview-only cross-origin stylesheet setup. It is not a claim that every
possible full-page navigation has zero CLS.

| Version | Controlled condition | Width | Header height | Observed CLS |
| --- | --- | ---: | --- | ---: |
| current | delay | 390 | 192 → 74 | 0.133856 |
| fixed | delay | 390 | 74 → 74 | 0.000000 |
| fixed | delay | 320 | 74 → 74 | 0.000000 |
| fixed | delay | 800 | 74 → 74 | 0.000000 |
| fixed | delay | 801 | 92 → 92 | 0.000000 |
| fixed | streamed | 390 | 192 → 74 | 0.000000 |
| current | delay | 320 | 225 → 74 | 0.171291 |
| current | delay | 800 | 148 → 74 | 0.083944 |
| current | delay | 801 | 92 → 92 | 0.000000 |
| fixed | block | 320 | 74 → 74 | 0.000000 |
| fixed | block | 800 | 74 → 74 | 0.000000 |
| fixed | block | 801 | 92 → 92 | 0.000000 |
| fixed | nojs | 320 | 225 → 225 | 0.000000 |
| fixed | nojs | 800 | 148 → 148 | 0.000000 |
| fixed | nojs | 801 | 92 → 92 | 0.000000 |
| fixed | inline-blocked | 320 | 225 → 225 | 0.000000 |
| fixed | inline-blocked | 800 | 148 → 148 | 0.000000 |
| fixed | inline-blocked | 801 | 92 → 92 | 0.000000 |
| fixed | all-external-blocked | 320 | 74 → 74 | 0.000000 |
| fixed | all-external-blocked | 800 | 74 → 74 | 0.000000 |
| fixed | all-external-blocked | 801 | 92 → 92 | 0.000000 |

The early block-scenario rows block the former header module. The
all-external-blocked rows additionally fail all external page scripts. Fixed
delay rows have no external header request to wait for. These are real DOM and
Layout Instability observations, not physical iOS/Android or screen-reader tests.
The repository-wide aggregate suite was not run in this partial materialization;
the focused checks above are the verified scope.

## Reproduction

1. python3 trifoti-source/warm/inline-navigation.py
2. python3 trifoti-source/scripts/test-warm-inline-build.py
3. node trifoti-source/scripts/test-warm-inline-navigation.mjs
4. python3 trifoti-source/scripts/prepare-navigation-preview.py
5. Start the supported managed preview at trifoti-source/preview and use its URL.
6. The current baseline needs a saved pre-change index-original.html in the
   local preview directory; without it, current mirrors the checked-out page.
7. Choose width and delay/block/nojs/inline-blocked/streamed scenario.
8. Remove the test worker afterward.

The observer, response interception, generated cases and telemetry are confined
to local QA. No service worker, telemetry, storage or new third-party endpoint is
added to the production page. Live Pages and post-deployment PageSpeed should
be checked separately for the exact published commit.

