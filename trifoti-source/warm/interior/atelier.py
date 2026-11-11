"""Apply the public portfolio layout without rewriting gallery data or the local brief."""
from pathlib import Path
import re
import shutil

SOURCE = Path(__file__).parent


def stylesheet(page, href):
    link = f'<link rel="stylesheet" href="{href}atelier.css?v=20261111-studio">'
    if link not in page:
        return page.replace('</head>', link + '\n</head>', 1)
    return page


def apply(target):
    shutil.copyfile(SOURCE / 'atelier.css', target / 'atelier.css')
    shutil.copytree(SOURCE / 'type', target / 'type', dirs_exist_ok=True)
    home = target / 'index.html'
    page = home.read_text()
    page = re.sub(r'<section class="hero interior-hero section-anchor" id="home">.*?</section>',
                  lambda _: (SOURCE / 'hero.html').read_text().strip(), page, count=1, flags=re.S)
    for section in ['projects', 'directions', 'process', 'studio', 'contact']:
        page = re.sub(r'(id="' + section + r'"[^>]*>)\s*<div class="section-top">.*?</div>',
                      r'\1', page, count=1, flags=re.S)
    page = re.sub(r'<div class="projects-heading">.*?</div>', '''<div class="projects-heading">
    <h2>Избранные <em>проекты</em></h2>
    <a class="atelier-link" href="portfolio.html">Вся галерея <span aria-hidden="true">↗</span></a>
  </div>''', page, count=1, flags=re.S)
    page = re.sub(r'<div class="section-heading"><h2>Форма следует.*?</div>', '''<div class="section-heading">
    <h2>Что можно <em>заказать</em></h2>
    <p>Выберите направление, чтобы посмотреть примеры и обсудить материалы, масштаб или тираж.</p>
  </div>''', page, count=1, flags=re.S)
    process_intro = '''<div class="atelier-process-intro">
    <h2>От эскиза <em>до объекта</em></h2>
    <figure><img src="photos/red7/finishing.webp" width="1536" height="1152" alt="Мастер обрабатывает поверхность рельефного панно RED7" loading="lazy" decoding="async"><figcaption><a href="cases/red7-panels.html">Панно RED7 в мастерской <span aria-hidden="true">↗</span></a></figcaption></figure>
  </div>'''
    page = page.replace('<h2>От замысла<br><span>к готовому объекту.</span></h2>', process_intro, 1)
    page = re.sub(r'<div class="studio-layout">.*?</div></div>(?=\s*<div class="team-block")', '''<div class="studio-layout"><h2 id="team">Команда <em>ТРИФОТИ</em></h2>
    <p>Скульптор, дизайнер и инженеры работают вместе. Для каждого заказа подбираем материал, проверяем форму и готовим её к изготовлению.</p></div>''', page, count=1, flags=re.S)
    page = page.replace('Обсудим<br><span class="red">ваш проект</span>', 'Обсудим <em>ваш проект</em>')
    page = page.replace('Расскажите, что хотите создать и к какому сроку. Можно начать с фотографии, эскиза или ссылки на работу, которая вам понравилась.', 'Пришлите менеджеру фото пространства, эскиз или ссылку на работу. Если известны размеры, тираж или дата события, укажите их в сообщении.')
    page = page.replace('<p>Пределов в творчестве не существует.</p>', '')
    # Each step describes its outcome in its own paragraph.
    page = re.sub(r'<p class="process-result">.*?</p>', '', page, flags=re.S)
    # Keep every biography and source accessible beside its portrait.
    page = re.sub(r'(<p class="team-role">[^<]+</p>)(.*?)(?=\s*</div>\s*</li>)',
                  lambda m: m[1] + (m[2] if 'class="team-more"' in m[2] else
                      '<details class="team-more"><summary>Об участнике</summary>' + m[2] + '</details>'),
                  page, flags=re.S)
    home.write_text(stylesheet(page, ''))
    portfolio = target / 'portfolio.html'
    if portfolio.is_file():
        page = portfolio.read_text()
        page = page.replace('<a href="./#portfolio-albums">← К альбомам</a></div>', '<div class="album-top-links"><a href="./#portfolio-albums">← К альбомам</a><a class="inquiry-link" href="./#contact">Обсудить проект <span aria-hidden="true"></span></a></div></div>')
        page = page.replace('<h1>Галерея проектов</h1>', '<h1>Галерея <em>проектов</em></h1>')
        portfolio.write_text(stylesheet(page, ''))
    for case in sorted((target / 'cases').glob('*.html')):
        page = case.read_text()
        if 'class="inquiry-link"' not in page:
            page = page.replace('</nav></header>', '<a class="inquiry-link" href="../index.html#contact">Обсудить проект <span aria-hidden="true"></span></a></nav></header>', 1)
        case.write_text(stylesheet(page, '../'))
    catalog = target / 'catalog.html'
    catalog.write_text(stylesheet(catalog.read_text(), ''))
