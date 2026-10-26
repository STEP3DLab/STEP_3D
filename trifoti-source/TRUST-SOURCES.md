# Context, attribution and information packet — source notes

Checked: 26 October 2026. Group 9 is an editorial layer over the existing six cases and 21-source publication catalogue. It introduces no case, image, credential, contact, equipment or material claim.

## Reading routes and evidence chronology (41–42)

`dist/trust-data.js` contains editorial reasons and source IDs; titles, publishers, formats, dates and links are resolved from unchanged `dist/publications-data.js`. Routes have three existing sources each:

- Profession: P01, P02, video-01.
- Memory and monumental form: P04, P17, P14.
- Character: P10, P01, P03.

The evidence chronology includes all 19 dated sources and separates P20/P08, whose publication dates are unknown. Dates retain original precision. It is a history of publications, not a biography or a timeline of making the works. The project for Lazarev (P04/P12/video-03), competition final won by another project (P17), and reports of openings (P14/P15/video-02/P16) retain different status labels. No unpublished completion or installation is inferred.

## Glossary (43): directly inspected primary sources

Definitions are short original Russian paraphrases. They explain vocabulary, not the collective's capabilities. No examples are attached to individual portfolio works because the source does not establish that relationship.

1. **Sculpture** — Irish Museum of Modern Art, a museum's own educational definition: https://imma.ie/what-is-art/series-3-materials-methodologies/sculpture/ . Supports three-dimensional artworks.
2. **Relief** — National Portrait Gallery, institutional art glossary: https://www.npg.org.uk/collections/explore/glossary-of-art-terms/relief . Supports a raised image projecting from and remaining connected with a flat background rather than a free-standing sculpture.
3. **Additive manufacturing / 3D printing** — NIST: https://www.nist.gov/additive-manufacturing/what-additive-manufacturing . Supports producing three-dimensional objects from digital designs through successive addition of material, normally in layers.
4. **Reverse engineering** — Autodesk's official engineering explanation: https://www.autodesk.com/solutions/reverse-engineering . Supports studying an existing product to understand, reproduce or improve it; digital models can be part of the physical-object workflow.

The sources were fetched and their relevant definitions read on 26 October 2026. An inaccessible Tate page and an unofficial mirror were excluded. A Getty maquette definition was not used: it does not establish that the restoration case's sculpture model is a small preliminary maquette. Do not silently relabel that model or invent its scale/material.

## Attribution guide and packet (44–45)

`dist/project-data.js` remains the single source for case titles, descriptions, directions, attribution and source links. The generated text-only packet includes these records rather than separately rewriting them. No media are embedded; this is a short reference, not the planned illustrated portfolio catalogue (48).

- ТРИФОТИ identifies the creative collective and the site, not blanket authorship of every displayed work.
- The RTO traveling cup retains **development and production — Step3D**, with the source case and official event results. Lenkom is the first holder, not the maker.
- STD awards retain **realized by the Technopark RGSU team**, shown from the STEP_3D portfolio. The ceremony does not establish a participant's authorship, client status or endorsement.
- Publications about Fedor's personal practice do not attribute all six portfolio cases to him.
- For four cases without individual attribution in the original records, the packet explicitly says personal roles are unspecified.

The packet uses the owner-approved biographies without internal audit scaffolding. Provenance remains recorded here and in `TEAM-SOURCES.md`; `packetPeople.ownerClaim` retains the supplied achievement text separately from professional context:

- Fedor's sculpture practice and professional memberships: https://dobrotorium.ru/people/12 and https://vm.ru/news/77952-skulptor-fedor-parshin-mne-ne-interesny-zolotye-unitazy . The title «Заслуженный художник Крыма» was provided by the owner on 26 October 2026; it is not presented as independently verified by these links.
- Khristina's laboratory role and additive-technology context: https://technopark-rgsu.ru/skb/laboratories/industrial-design-engineering/ . The organizer's 2024 report supports the specific mentorship context, not Russian championship achievements: https://cttit.ru/news/2024/04/reversivnyij-inzhiniring-itogi.html . BRICS/Hightech champion and training several Russian champions were provided by the owner on 26 October; separate external verification was not performed. The source records retain this distinction. Public source links are specifically labeled laboratory/specialization and competition/mentorship; no blanket external-verification claim is made.

The main team section is byte-for-byte unchanged from base `1f0c5fa`; education and implants are not reintroduced. Public spelling «Христина Анатольевна Понкратова» is preserved. See `TEAM-SOURCES.md` and `CASE-SOURCES.md` for earlier provenance.
