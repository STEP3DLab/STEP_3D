# Quality Pass Checklist (a11y / SEO / performance)

## Scope rule
- Quality-pass updates **must not** change marketing copy or business content.
- Allowed changes: semantic markup, accessibility attributes, technical SEO files, resource loading/performance tuning.

## Accessibility (a11y)
### Checklist
- [ ] Mobile menu button has `aria-controls` and live `aria-expanded` state.
- [ ] Mobile menu container exposes visibility state (`aria-hidden`) and dialog semantics where applicable.
- [ ] Interactive controls include explicit labels (`aria-label`) when icon-only or ambiguous.
- [ ] Exactly one `h1` exists on the page.
- [ ] Heading hierarchy is sequential (`h1` → `h2` → `h3`) without skipped levels.
- [ ] `noscript` fallback includes at least one actionable contact channel.

### Acceptance criteria
- Mobile menu can be opened/closed with state synchronized in DOM attributes.
- Accessibility tree exposes meaningful names for open/close controls.
- No heading-level violations in manual DOM scan.

## SEO
### Checklist
- [ ] `canonical` points to production URL.
- [ ] `meta description` is present and non-empty.
- [ ] `robots.txt` exists in repository root and allows indexing.
- [ ] `sitemap.xml` exists in repository root and contains canonical URL entries.
- [ ] Structured data (`application/ld+json`) remains valid JSON.

### Acceptance criteria
- Search crawlers can discover canonical landing URL via `robots.txt` and `sitemap.xml`.
- Core metadata remains consistent with deployed GitHub Pages base URL `https://step3dlab.github.io/STEP_3D/`.

## Performance
### Checklist
- [ ] External scripts list contains only actively used dependencies.
- [ ] `defer` is applied to non-critical external scripts where safe.
- [ ] Google Fonts request includes only required font families/weights.
- [ ] `display=swap` is enabled in font URL.

### Acceptance criteria
- No unused external script references remain in HTML head.
- Render-blocking resources are minimized without breaking runtime behavior.
- Font payload is reduced compared to previous state.
