# Independent warm build sources

The warm edition is not a skin of the current base edition. Its runtime and late customer-facing markup must be preserved independently.

Runtime JS/CSS sources were recovered from the verified published warm edition at 5750a84fe17c8d43bce89e62810ddeaf7faf72a5. Edit these sources when changing warm behavior; do not let a later full build silently substitute base behavior. Header source restoration runs before inline-navigation. Customer fragments run after older sales templates. No finished HTML page is copied over generated output.

Verification 2026-11-19: full build twice; all tracked files in both warm output directories byte-identical to that published commit; second build changes zero files; mirrors identical; 1130 tests pass. Browser QA at 944 and 400 CSS px: bear pause/reset/arrow control; meeting empty state, selected RED7, next frame, Home, exit. Test selection removed, brief untouched. This repair changes source generation only and includes no RED7 printable-pack draft.
