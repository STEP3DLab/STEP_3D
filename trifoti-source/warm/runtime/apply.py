"""Preserve independent warm runtime sources before inline header rendering."""
from pathlib import Path
import shutil
def apply(target):
    for source in Path(__file__).parent.iterdir():
        if source.suffix not in ('.js','.css'): continue
        shutil.copyfile(source,Path(target)/source.name)
    # Base-only module; independent warm app has no dependency on it.
    (Path(target)/'gallery-return-focus.js').unlink(missing_ok=True)

    import re
    p=Path(target)/'index.html';h=p.read_text()
    h=h.replace('<div class="catalog-filters-row" id="portfolio-filters" hidden>','<div class="catalog-filters-row">')
    # Base and warm controllers must never attach concurrently.
    h=re.sub(r'<!-- header-navigation:inline:start -->.*?<!-- header-navigation:inline:end -->\n?', '',h,flags=re.S)
    # Warm's manual video controller owns the controls, unlike the base runtime.
    h=h.replace('id="bear-stage" role="group"', 'id="bear-stage" role="group" aria-describedby="bear-keyboard-help"')
    h=h.replace('<video id="bear-video" controls', '<video id="bear-video"')
    for ident in ('bear-keyboard-help','rotate-toggle','bear-reset'):
        h=re.sub(r'(<[^>]*id="'+ident+r'"[^>]*?) hidden(?=[ >])', r'\1', h)
    h=h.replace('class="drag-hint" hidden', 'class="drag-hint"')
    h=h.replace('\n\n  <script type="importmap">', '\n    <script type="importmap">')
    h=h.replace('\n\n<details class="premium-categories">', '\n<details class="premium-categories">')
    h=h.rstrip()+'\n\n'
    p.write_text(h)
