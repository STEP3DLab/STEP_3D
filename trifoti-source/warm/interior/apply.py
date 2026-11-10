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
    if 'id="team-oksana"' not in text:
        text = re.sub(r'(<ul class="team-grid">.*?)(    </ul>)', lambda m: m[1] + (source / 'team-profiles.html').read_text() + m[2], text, count=1, flags=re.S)
    text = text.replace('<a href="#studio">Об объединении</a>', '<a href="#studio">Команда</a>')
    if 'review-20261106.css?' not in text:
        text = text.replace('</head>', '  <link rel="stylesheet" href="review-20261106.css?v=20261110">\n</head>')
    shutil.copyfile(source / 'review-20261106.css', target / 'review-20261106.css')
    shutil.copyfile(source / 'category-stories.js', target / 'category-stories.js')
    fedor_link = '<a class="team-sources" href="portfolio.html">Посмотреть подборку проектов <span class="direction-icon" aria-hidden="true"></span></a>'
    if fedor_link not in text:
        publications_link = '<a class="team-sources" href="#publications">'
        text = text.replace(publications_link, fedor_link + '\n          ' + publications_link, 1)
    page.write_text(text)
    shutil.copyfile(source/'interior-stage.css',target/'interior-stage.css')

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[3]
    apply(root/'trifoti/warm')
    shutil.copytree(root/'trifoti/warm',root/'docs/trifoti/warm',dirs_exist_ok=True)
