"""Keep the commercial enquiry flow reproducible on the independent warm edition."""
import re
import shutil
from pathlib import Path

SOURCE = Path(__file__).parent
VERSION = '20261111-sales'


def replace_section(text, start, stop, replacement):
    begin = text.index(start)
    end = text.index(stop, begin)
    return text[:begin] + replacement + text[end:]


def apply(target):
    target = Path(target)
    page = target / 'index.html'
    html = page.read_text()
    # Existing snapshots and regenerated pages share these stable container boundaries.
    selected = (SOURCE.parent / 'premium/selected-work.html').read_text().split('<div class="portfolio-albums"')[0]
    html = replace_section(html, '<div class="selected-work"', '<div class="portfolio-albums"', selected)
    html = replace_section(html, '<div class="contact-layout">', '<form id="brief-form"', '<div class="contact-layout">' + (SOURCE / 'contact.html').read_text())
    html = replace_section(html, '<div id="project-questions"', '</section>', (SOURCE / 'faq.html').read_text())
    if 'id="enquiry-handoff"' in html:
        html = replace_section(html, '<div class="enquiry-handoff"', '<div class="brief-actions">', '')
    html = html.replace('<div class="brief-actions">', (SOURCE / 'handoff.html').read_text() + '<div class="brief-actions">', 1)
    html = html.replace('Подготовить бриф для скачивания, без отправки', 'Обсудить проект с менеджером')
    html = html.replace('href="#brief-form" class="button header-cta"', 'href="#contact" class="button header-cta"')
    html = html.replace('<span class="desktop-label">Подготовить бриф</span><span class="mobile-label">Бриф</span>', '<span class="desktop-label">Обсудить проект</span><span class="mobile-label">Связь</span>')
    html = html.replace('Соберите свой бриф', 'Бриф на проект').replace('Для начала достаточно имени и пары предложений об идее. Остальное — по желанию.', 'Для первого обсуждения достаточно имени и короткого описания задачи. Бюджет, срок и примеры можно добавить по желанию.')
    html = html.replace('class="button button-dark" type="submit" id="brief-save"', 'class="button button-outline" type="submit" id="brief-save"')
    html = html.replace('Бриф скачивается файлом, а не отправляется объединению.', 'Копию брифа можно сохранить для себя или коллег.')
    html = html.replace('Скопируйте текст и передайте объединению удобным способом. Данные никуда не отправляются автоматически.', 'Вставьте текст в письмо или сообщение менеджеру.')
    html = html.replace('Для скачивания брифа нужен JavaScript. Без него доступны описания направлений, публикации и полные страницы проектов.', 'Чтобы обсудить проект, воспользуйтесь прямой ссылкой на Telegram или почту менеджера выше.')
    html = html.replace('<option>Арт-объекты</option></select>', '<option>Арт-объекты</option><option>Макетирование</option></select>')
    html = re.sub(r'(src="(?:\./)?app\.js\?v=)[^"]+', r'\g<1>20261111-print-intent&amp;copy-focus=20261111&amp;enquiry=' + VERSION, html)
    if 'href="sales.css?' not in html:
        html = html.replace('</head>', f'<link rel="stylesheet" href="sales.css?v={VERSION}">\n</head>')
    page.write_text(html)
    for filename in ['sales.css', 'brief-handoff.js', 'brief-guidance.js']:
        shutil.copyfile(SOURCE / filename, target / filename)

    app = target / 'app.js'
    script = app.read_text()
    marker = '// Enhance the local brief only after'
    if marker in script:
        script = script.split(marker)[0]
    script = re.sub(r"((?:reference-manager|brief-guidance|brief-preparation|portfolio-brief)\.js\?v=)[^']+", r'\g<1>' + VERSION, script)
    app.write_text(script.rstrip() + '\n\n' + (SOURCE / 'entry.js').read_text())
    preparation = target / 'brief-preparation.js'
    script = preparation.read_text()
    if "{name:'Макетирование'" not in script:
        marker = "\n]);\nconst commonMaterials"
        if marker not in script:
            raise ValueError('Brief preparation directions changed')
        script = script.replace(marker, ",\n {name:'Макетирование',question:'Нужен макет здания или изделия?',note:'Масштаб, габариты и детализация.',materials:['Фотографии, планы или чертежи','Масштаб или желаемый размер макета','Детали, которые важно показать']}" + marker)
    script = re.sub(r"(reference-manager\.js\?v=)[^']+", r'\g<1>' + VERSION, script)
    preparation.write_text(script)
