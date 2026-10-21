# Static portfolio export

`npm run build:pages` creates a static portfolio in `pages-dist/`. The default public address is `https://step3dlab.github.io/STEP_3D/trifoti/`. To use another location, set `NEXT_PUBLIC_SITE_ORIGIN` to its HTTPS origin and `NEXT_PUBLIC_BASE_PATH` to the path where the portfolio will be mounted.

The script uses the installed Next.js dependency in an isolated `.pages-build/` directory. It does not run or modify the Vinext/Sites build and does not publish to a remote. `npm run build` remains the full application build with Worker, D1 and R2.

## Differences in the portfolio

- `NEXT_PUBLIC_STATIC_EXPORT=true` enables a browser-only brief. Visitors review and send the text through Telegram or email, or copy/download it. This mode does not create a stored lead, upload attachments or issue a status token.
- API routes, the manager dashboard and the private status page are excluded from the temporary source tree. The portfolio does not call the internal analytics API.
- Photos, video and project text stay in the shared source. Transformations in the temporary copy prefix public media paths and ordinary anchors, replace legacy canonical origins, and preserve the deployment path when a route constructs `new URL(path, origin)`. `next/link` keeps its normal basePath behavior.
- Geist and Geist Mono are bundled as local WOFF2 subsets in `public/fonts/`, with their OFL license. Both builds use the same fonts without fetching Google Fonts; the static preparation prefixes their CSS URLs for the mount path.
- Public QA helpers, tests, local databases, runtime state and environment files are not copied. Only validated `out/` files become `pages-dist/`.
- `.pages-build/` and `pages-dist/` are ignored by Git, TypeScript and lint. The normal test command selects only `tests/*.test.mjs`; no tests are copied into the temporary app.

Use `node scripts/build-pages.mjs --prepare-only` to inspect the generated source without building. Do not edit that copy: the next export recreates it from the shared app.

The output contains HTML for each known route, including a real 404 page, and can be mounted as the `trifoti/` directory within the existing `STEP_3D` Pages artifact. Copy the contents of `pages-dist/`, not its parent directory, into that deployment folder. No backend keys or GitHub credentials belong in the public build settings.
