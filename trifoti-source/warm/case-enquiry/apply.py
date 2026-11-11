"""Connect published warm-edition case pages to the site's existing local brief."""
from pathlib import Path
from shutil import copyfile

VERSION = '20261111-brief-links'


def enhance_gallery_links(target):
    app = target / 'app.js'
    text = app.read_text()
    import_line = f"import {{fillCaseDirection}} from './case-enquiry.js?v={VERSION}';\n"
    if import_line not in text:
        text = import_line + text
    guard = 'function followsBriefHere(event){return !event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey}'
    if 'function followsBriefHere(' not in text:
        text = text.replace("const form=$('#brief-form')", guard + "\n\nconst form=$('#brief-form')", 1)
    replacements = [
        ("$('#empty-category-brief').addEventListener('click',()=>{", "$('#empty-category-brief').addEventListener('click',event=>{if(!followsBriefHere(event))return;"),
        ("$$('[data-service]').forEach(a=>a.addEventListener('click',()=>{", "$$('[data-service]').forEach(a=>a.addEventListener('click',event=>{if(!followsBriefHere(event))return;"),
        ("$('#case-contact').addEventListener('click',e=>{e.preventDefault();", "$('#case-contact').addEventListener('click',e=>{if(!followsBriefHere(e))return;e.preventDefault();"),
        ("if(p.direction&&direction.selectedIndex===0)direction.value=({'Скульптура':'Парковая и монументальная скульптура','Сувениры и призы':'Награды'}[p.direction]||p.direction);", "fillCaseDirection(key,direction);"),
    ]
    for old, new in replacements:
        if old in text:
            text = text.replace(old, new, 1)
        elif new not in text:
            raise ValueError('Warm brief handler changed: ' + old)
    app.write_text(text)


def apply(target):
    target = Path(target)
    copyfile(Path(__file__).with_name('case-enquiry.js'), target / 'case-enquiry.js')
    enhance_gallery_links(target)
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
