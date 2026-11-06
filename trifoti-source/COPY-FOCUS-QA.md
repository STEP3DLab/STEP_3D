# Clipboard fallback focus — 2026-11-06

At baseline `5899816`, a delayed clipboard failure in the publication catalog or project selection always focused and selected its manual-copy field. A visitor who had already moved to search or another control lost their newer focus.

Both paths now reveal the same manual-copy fallback but only focus/select it while the originating copy button still owns focus. Successful copy, close/reset/collapse handling, public link contents and data boundaries are unchanged. No new media, storage, services or network requests were introduced. Module and entry-point cache keys are updated.

## Verification

- Six regression tests cover delayed failure with retained/moved focus and delayed success for both paths. The two moved-focus cases fail against the baseline and pass after the change.
- Focused suites: 76/76. Aggregate checks: 784/784. Warm snapshot: 16/16. Independent read-only review approved; diff whitespace checks clean.
- Native Chrome with a local QA harness and explicitly deferred simulated clipboard promises reproduced both baseline failures. With the fix, publication search and the selection reset button retain newer focus while the exact fallback text remains visible. When the copy button still has focus, both fallback fields receive focus and fully select their text. Repeated attempts work.
- These local fault-injection checks do not establish a production permission failure. Real browser permission prompts, physical mobile devices, Safari/Firefox and screen-reader speech were not tested.
