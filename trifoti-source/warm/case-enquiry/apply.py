"""Connect published warm-edition case pages to the site's existing local brief."""
from pathlib import Path
from shutil import copyfile


def apply(target):
    target = Path(target)
    copyfile(Path(__file__).with_name('case-enquiry.js'), target / 'case-enquiry.js')
    old_link = '<a href="../index.html#brief-form">Подготовить локальный бриф</a>'
    pagination = '<nav class="case-pagination"'
    for page in sorted((target / 'cases').glob('*.html')):
        text = page.read_text()
        key = page.stem
        if f'data-static-case="{key}"' not in text:
            continue
        link = f'<a href="../index.html?case={key}#brief-form">Добавить проект в бриф</a>'
        if old_link not in text and link not in text:
            raise ValueError(f'Brief link is missing from {page.name}')
        text = text.replace(old_link, link)
        action = f'<div class="resource-actions case-enquiry-action">{link}</div>'
        if action not in text:
            if pagination not in text:
                raise ValueError(f'Case navigation is missing from {page.name}')
            text = text.replace(pagination, action + '\n' + pagination, 1)
        page.write_text(text)
