"""Apply the requested atelier hero and blue header to the independent warm snapshot."""
from pathlib import Path
import re
import shutil

def apply(target):
    target = Path(target)
    source = Path(__file__).parent
    page = target / 'index.html'
    text = page.read_text()
    text, count = re.subn(r'<section class="hero(?: interior-hero)? section-anchor" id="home">.*?</section>', (source/'hero.html').read_text().strip(), text, count=1, flags=re.S)
    if count != 1:
        raise ValueError('Expected one existing home hero')
    if 'interior-stage.css?' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="interior-stage.css?v=20261106-atelier">\n</head>')
    text = re.sub(r'<meta name="theme-color" content="[^"]*">', '<meta name="theme-color" content="#1e4578">', text)
    text = re.sub(r'<div class="service-list">.*?</details></div>', lambda _: (source / 'service-list.html').read_text().strip(), text, count=1, flags=re.S)
    text = re.sub(r'<!-- category-stories:start -->.*?<!-- category-stories:end -->', lambda _: (source / 'category-tiles.html').read_text().strip(), text, count=1, flags=re.S)
    profiles = (source / 'team-profiles.html').read_text().rstrip()
    # Older warm editions can already contain these two cards without their portraits.
    if 'id="team-oksana"' in text:
        cards = r'      <li class="team-card team-profile" aria-labelledby="team-oksana">.*?(?=\n    </ul>\n  </div>\n</section>)'
        text = re.sub(cards, lambda _: profiles, text, count=1, flags=re.S)
    else:
        text = re.sub(r'(<ul class="team-grid">.*?)(    </ul>)', lambda m: m[1] + profiles + '\n' + m[2], text, count=1, flags=re.S)
    text = text.replace('Все проекты и подробные кейсы · ', 'Подробные кейсы · ')
    text = text.replace('<span>Работы по направлениям</span>', '<span>Избранные работы и концепты</span>')
    text = text.replace('<a href="#studio">Об объединении</a>', '<a href="#studio">Команда</a>')
    text = re.sub(r'review-20261106\.css\?v=[^"]+', 'review-20261106.css?v=20261111-portfolio', text)
    if 'review-20261106.css?' not in text:
        text = text.replace('</head>', '  <link rel="stylesheet" href="review-20261106.css?v=20261111-portfolio">\n</head>')
    shutil.copyfile(source / 'review-20261106.css', target / 'review-20261106.css')
    shutil.copyfile(source / 'category-stories.js', target / 'category-stories.js')
    fedor_link = '<a class="team-sources" href="portfolio.html">Посмотреть подборку проектов <span class="direction-icon" aria-hidden="true"></span></a>'
    if fedor_link not in text:
        publications_link = '<a class="team-sources" href="#publications">'
        text = text.replace(publications_link, fedor_link + '\n          ' + publications_link, 1)
    # Keep the four warm-edition portrait crops together; shared pages use their original photos.
    for person, slug, name in [
        ('fedor', 'fedor-parshin', 'Фёдор Геннадьевич Паршин'),
        ('khristina', 'khristina-ponkratova', 'Христина Анатольевна Понкратова'),
    ]:
        base = f'photos/team/{slug}'
        photo = (f'<div class="team-portrait"><img src="{base}-640.webp" srcset="{base}-360.webp 360w, {base}-640.webp 640w" '
                 f'sizes="(max-width:700px) 92vw, (max-width:1200px) 45vw, 550px" width="640" height="640" alt="{name}" loading="lazy" decoding="async"></div>')
        pattern = rf'(<li class="team-card" aria-labelledby="team-{person}">\s*)<div class="team-portrait">.*?</div>'
        text = re.sub(pattern, lambda m: m[1] + photo, text, count=1, flags=re.S)
    text = re.sub(r'\n          <div class="team-kicker">[^\n]*?</div>', '', text)
    text = re.sub(r'(src="(?:\./)?app\.js)\?v=[^"]+', r'\1?v=20261111-portfolio', text)
    shutil.copyfile(source / 'portfolio-brief.js', target / 'portfolio-brief.js')
    app = target / 'app.js'
    entry = (source / 'portfolio-brief-entry.js').read_text()
    application = app.read_text()
    if "new URLSearchParams(location.search).has('portfolio')" not in application:
        app.write_text(application.rstrip() + '\n\n' + entry)
    shutil.copyfile(source / 'reference-manager.js', target / 'reference-manager.js')
    page.write_text(text)
    shutil.copyfile(source/'interior-stage.css',target/'interior-stage.css')

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[3]
    apply(root/'trifoti/warm')
    shutil.copytree(root/'trifoti/warm',root/'docs/trifoti/warm',dirs_exist_ok=True)
