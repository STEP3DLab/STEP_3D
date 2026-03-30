# Release Notes — Quality Pass

## What changed
- Added a quality checklist with explicit acceptance criteria for accessibility, SEO, and performance.
- Improved mobile menu accessibility states in `index.html`:
  - `aria-controls` + dynamic `aria-expanded` on the menu trigger.
  - `aria-hidden` synchronization and dialog semantics on mobile navigation.
  - explicit labels for open/close actions.
- Added `<noscript>` fallback block with baseline contact information.
- Optimized resource loading in `index.html`:
  - kept only required external scripts;
  - added `defer` for the Three.js dependency;
  - reduced Google Fonts weights/families to the minimum used set while preserving `display=swap`.
- Added root-level `robots.txt` and `sitemap.xml` configured for GitHub Pages base URL:
  - `https://step3dlab.github.io/Step3D/`.

## Regression risks
- **Low:** mobile menu behavior changed to centralized state setter; verify open/close on tap and link click.
- **Low:** deferred Three.js load could delay hero animation initialization on very slow devices.
- **Low:** reduced font weights may cause small visual differences in intermediate font-weight rendering.

## Scope guard
- This quality pass intentionally avoids edits to business copy and marketing content; only technical quality improvements were applied.
