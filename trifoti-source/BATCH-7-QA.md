# Group 7: visual reading of real portfolio media

Base: `198c6e3145b2355c73cba25d92aada670f750d3f`.

## Scope

31. Bear: independently controlled white and red photo groups, with explicit note about different light/angles and no ordering/configurator claim.
32. Restoration: object photographs and model views, independently controlled; no before/after or overlay assertion.
33. STD awards: manually stepped discussion-board image, finished series and ceremony; existing Techpark attribution and source links.
34. RTO cup: finished object, first holder and general participants photo, without assigning the whole group to one theatre; existing Step3D attribution and sources.
35. Atlas: all 23 photographs and two labelled video posters, project/type filters, exact-frame gallery links, honest empty states.

The new section remains inside the existing optional exploration disclosure. Each story creates its images only on first opening. Atlas uses existing lightweight previews; the single-media gesture case uses its existing 13,236-byte poster because it has no thumbnail derivative. No media files were changed or added. Videos never play in these views.

## Automated verification

`npm run check`: 465 tests passed, zero failures/skips. Tests include all media IDs, preview existence, lazy creation, independent pair controls, wraparound, modifier-click preservation, exact-frame links, source attribution, atlas filtering and empty results. No new persistence, analytics, submission, HTML injection or automatic playback.

`git diff --check` passed. Runtime mirror parity and original media byte preservation are checked before publication.

## Native verification

Independent native cloud Chromium review passed at 100% and 250% (472 CSS px): independent pair controls and wraparound, disclosure persistence/no duplicate images, exact-frame gallery links and focus return, atlas 25/all, 2/videos, 0/empty, paused video, initial zero media nodes, narrow layout without overflow, menu Escape and brief navigation. Publication and public smoke remain pending at this commit.

Physical Android/touch, screen reader, forced-colors, saved downloads and OS print dialog are outside this verification coverage. The private Sites copy is not changed.
