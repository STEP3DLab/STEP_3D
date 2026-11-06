"""Apply the editorial layer to the existing warm snapshot; never import base JS."""
from pathlib import Path
import re
import shutil

VERSION = '20261106-premium'

def section(source, marker):
    start = source.index(marker)
    depth = 0
    for tag in re.finditer(r'<section\b[^>]*>|</section>', source[start:]):
        depth += -1 if tag[0].startswith('</') else 1
        if depth == 0:
            return source[start:start + tag.end()]
    raise ValueError(marker)

def apply(target):
    target = Path(target)
    source = Path(__file__).parent
    page = target / 'index.html'
    text = page.read_text()
    if 'data-premium-edition="20261106"' not in text:
        text = text.replace('class="warm-edition"', 'class="warm-edition" data-premium-edition="20261106"')
        text = text.replace('<h1><span>Пределов</span><span class="red">в творчестве</span><span>не существует.</span></h1>', '<h1><span>Характер —</span><span class="red">в форме.</span></h1>')
        text = text.replace('Творческое объединение <span class="hero-location">Москва · 2026</span>', 'Искусство · Дизайн · Инженерия')
        text = re.sub(r'<p class="hero-description">.*?</p>', '<p class="hero-description">Создаём скульптуры, награды и арт-объекты. Соединяем художественный взгляд и цифровые технологии, чтобы воплотить вашу идею.</p>', text, count=1, flags=re.S)
        text = re.sub(r'\s*<nav class="hero-directions".*?</nav>', '', text, count=1, flags=re.S)
        text = text.replace('Посмотреть проекты <span>', 'Смотреть работы <span>', 1)
        text = text.replace('<a class="text-link" href="#studio">Познакомиться с объединением', '<a class="text-link" href="#brief-form">Описать идею', 1)
        text = text.replace('<span>Идея → цифровая форма → реальный объект</span><span>TRIFOTI / ФОРМА И ТЕХНОЛОГИИ</span>', '<span>От первого эскиза<br>до готового объекта</span><span>ТРИФОТИ<br>Творческое объединение · Москва</span>')
        mood = section(text, '<section class="warm-mood')
        original = section(text, '<section class="warm-original')
        concept = section(text, '<section class="section concept-gallery')
        journal = section(text, '<section class="section journal')
        for block in [mood, original, concept, journal]:
            text = text.replace(block, '', 1)
        text = re.sub(r'<aside class="brief-bridge".*?</aside>', '', text, count=1, flags=re.S)
        text = re.sub(r'<div class="manifesto-strip">.*?</div>', '', text, count=1, flags=re.S)
        mood = mood.replace('Тёплый свет.<br>Выразительная форма.', 'Цвет. Свет.<br>Характер предмета.').replace('Художественная подача из предоставленных изображений. Подлинные фотографии и видео проектов сохранены в портфолио ниже.', 'Художественные визуализации: исследуем, как освещение и окружение меняют восприятие формы.')
        concept = concept.replace('Концепты, а не готовые изделия.', 'Концепты и исследования формы.')
        selected = (source / 'selected-work.html').read_text()
        text = text.replace('<h2>Наши<br><span class="red">проекты</span></h2><p class="category-story-lead">Шесть направлений —<br>работы, детали, ракурсы.</p>', '<h2>Идеи, ставшие<br><span class="red">реальностью.</span></h2><p class="category-story-lead">Избранные работы.<br>От характера предмета до масштаба пространства.</p>')
        text = text.replace('<!-- category-stories:start -->', selected + '\n<details class="premium-categories"><summary><span>Работы по направлениям</span><span class="disclosure-count">6 направлений</span></summary><!-- category-stories:start -->', 1)
        text = text.replace('<p class="category-story-help">Откройте направление и листайте в своём темпе.</p>', '<p class="category-story-help">Выберите направление, чтобы посмотреть работы и концепты.</p></details>', 1)
        text = text.replace('Сначала «а что, если».<br><span>Потом — вот оно.</span>', 'От замысла<br><span>к готовому объекту.</span>')
        text = text.replace('Осуществим<br><span class="red">Вашу идею!</span>', 'У вашей идеи<br><span class="red">есть будущее.</span>')
        text = text.replace('Контакты объединения добавим после согласования.<br>Пока можно подготовить и сохранить бриф.', 'Опишите замысел и скачайте бриф.<br>Он сохранится на вашем устройстве. Отправка объединению пока недоступна.')
        # The actual form precedes its supporting FAQ in the reading order.
        faq = re.search(r'<div id="project-questions".*?</details></div></div>', text, re.S)
        if faq:
            block = faq[0]
            text = text.replace(block, '', 1)
            contact = section(text, '<section class="section contact')
            text = text.replace(contact, contact[:-len('</section>')] + block + '\n</section>', 1)
        extras = '''<div class="premium-extras section" aria-label="Больше о ТРИФОТИ">
<p class="eyebrow">Больше о ТРИФОТИ</p>
<details class="premium-disclosure" id="form-studies"><summary><span>Исследования формы</span><span>Визуализации · концепты · 360°</span></summary><div class="premium-disclosure-body">''' + mood + concept + original + '''</div></details>
<details class="premium-disclosure" id="studio-journal"><summary><span>Журнал и публикации</span><span>Истории · интервью · авторство</span></summary><div class="premium-disclosure-body">''' + journal + '''</div></details>
</div>'''
        text = text.replace('</main>', extras + '\n</main>', 1)
        text = text.replace('</head>', '<script defer src="premium-navigation.js?v=' + VERSION + '"></script>\n</head>', 1)
        page.write_text(text)
    for name in ['premium.css', 'premium-navigation.js']:
        shutil.copyfile(source / name, target / name)
    shutil.copyfile(source / 'favicon.svg', target / 'brand/favicon.svg')
    for page in target.rglob('*.html'):
        text = page.read_text()
        if page.parent.name == 'cases' and 'premium-case-heading' not in text:
            image = re.search(r'<figure id="([^"]+)"[^>]*>.*?(<img\b[^>]*>)', text, re.S)
            heading = re.search(r'<header class="resource-heading">.*?</header>', text, re.S)
            if image and heading:
                cover_image = re.sub(r'\sloading="[^"]*"', '', image[2]).replace('<img ', '<img fetchpriority="high" ')
                cover = '<a class="premium-case-cover" href="#' + image[1] + '">' + cover_image + '<span>Смотреть фотографии проекта <span aria-hidden="true">↘</span></span></a>'
                replacement = heading[0].replace('class="resource-heading"', 'class="resource-heading premium-case-heading"').replace('</header>', cover + '</header>')
                text = text.replace(heading[0], replacement, 1)
        style = '../premium.css' if page.parent.name == 'cases' else 'premium.css'
        if 'premium.css?' not in text:
            text = text.replace('</head>', f'<link rel="stylesheet" href="{style}?v={VERSION}">\n</head>')
        # Share the same verified emblem in the header and Telegram link preview.
        text = text.replace('https://step3dlab.github.io/STEP_3D/trifoti/assets/brand/trifoti-logo-transparent.png', 'https://step3dlab.github.io/STEP_3D/trifoti/warm/brand/logo-original.jpg')
        text = text.replace('property="og:image:type" content="image/png"', 'property="og:image:type" content="image/jpeg"')
        text = text.replace('property="og:image:width" content="1254"', 'property="og:image:width" content="1536"').replace('property="og:image:height" content="1254"', 'property="og:image:height" content="1258"')
        text = text.replace('Логотип ТРИФОТИ: красно-белый медведь в чёрном контуре дома', 'ТРИФОТИ — знак творческого объединения')
        text = re.sub(r'<link rel="icon"[^>]*>', '<link rel="icon" href="/STEP_3D/trifoti/warm/brand/favicon.svg" type="image/svg+xml">', text)
        page.write_text(text)
    nav = target / 'section-navigation.js'
    text = nav.read_text().replace('(design|sculpture|modelmaking|awards)', '(corporate|sculpture|design|awards|industrial|artobjects)')
    nav.write_text(text)
    # Retain the requested interior hero during future editorial builds.
    import runpy
    runpy.run_path(str(source.parent / "interior/apply.py"))["apply"](target)

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[3]
    apply(root / 'trifoti/warm')
    shutil.copytree(root / 'trifoti/warm', root / 'docs/trifoti/warm', dirs_exist_ok=True)
