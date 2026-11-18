# Selection copy focus QA, 2026-11-18

Confirmed in a real Chromium DOM at 400 CSS px using `scripts/warm-selection-copy-qa.html`, which mounts the actual warm exploration module and injects a controlled delayed clipboard denial.

Baseline: after Copy selection, moving focus to Reset selection and receiving clipboard denial moved focus back to the fallback input (FAIL). Keeping focus on Copy correctly selected the fallback URL (PASS).

Fix: focus/select the fallback only if Copy selection is still active. The fallback remains visible regardless. Both browser checks now PASS; screenshot inspected. No changes to project content, layout, route or clipboard payload.

Full check: 1119 tests passed. This release excludes the independent RED7 information-packet draft pending print QA.
