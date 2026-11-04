"""Build the isolated warm presentation without changing the established site."""
from pathlib import Path
import re, shutil
root = Path(__file__).resolve().parents[2]
source = root / 'trifoti'
target = source / 'warm'
target.mkdir(exist_ok=True)
# Shared original photos/video/fonts remain in the established site's asset directory.
for path in source.rglob('*'):
    relative = path.relative_to(source)
    if relative.parts[0] in ('assets', 'warm') or not path.is_file():
        continue
    if path.suffix not in ('.html', '.js', '.css'):
        continue
    text = path.read_text()
    text = text.replace('https://step3dlab.github.io/STEP_3D/trifoti/', 'https://step3dlab.github.io/STEP_3D/trifoti/warm/')
    text = re.sub(r'(?<![\w:/])(?:\./|\.\./)*assets/', '/STEP_3D/trifoti/assets/', text)
    if path.suffix == '.css':
        for old, new in {'#e71931':'#6b172b','#bf1230':'#6b172b','#c41027':'#4e1020','#c9102c':'#6b172b','#a3162c':'#541323','#f5f3ee':'#f3eade','#ff5266':'#eab9bd'}.items():
            text=text.replace(old,new)
    # Restore absolute shared media references after changing canonical URLs.
    text = text.replace('/trifoti/warm/assets/', '/trifoti/assets/')
    if path.suffix == '.html':
        css = '../warm-theme.css' if relative.parts[0] == 'cases' else 'warm-theme.css'
        text = text.replace('</head>', f'<link rel="stylesheet" href="{css}?v=20261104-warm">\n</head>')
        text = text.replace('content="#f5f3ee"', 'content="#f3eade"')
    output = target / relative
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(text)
html = (target/'index.html').read_text()
start = html.index('  <div class="hero-art">')
end = html.index('\n</section>', start)
original_art = html[start:end]
hero = '''  <figure class="warm-hero-art">
    <img src="visuals/bear.webp" width="1536" height="1024" alt="Художественная визуализация медведя: кремовая фигура с бордовым плащом на тёплом фоне" fetchpriority="high" decoding="async">
    <figcaption><span>Форма. Характер. Деталь.</span><span>Художественная визуализация</span></figcaption>
    <a class="warm-original-link" href="#original-bear">Смотреть настоящую скульптуру <span class="direction-icon" aria-hidden="true"></span></a>
  </figure>'''
html = html[:start] + hero + html[end:]
html = html.replace('<h1 aria-label="Пределов в творчестве не существует!"><span>Пределов</span><span class="red">в творчестве</span><span>не существует!</span></h1>', '<h1><span>Пределов</span><span class="red">в творчестве</span><span>не существует.</span></h1>')
html = html.replace('01 / TRIFOTI', 'TRIFOTI / ТЁПЛАЯ КОЛЛЕКЦИЯ')
marker = '<section class="section projects'
extra = '''<section class="warm-mood section" aria-labelledby="warm-mood-title">
  <div class="warm-mood-heading"><span class="eyebrow">Цвет и фактура</span><h2 id="warm-mood-title">Тёплый свет.<br>Выразительная форма.</h2><p>Художественная подача из предоставленных изображений. Подлинные фотографии и видео проектов сохранены в портфолио ниже.</p></div>
  <div class="warm-mood-grid">
    <figure><img src="visuals/together.webp" width="1536" height="1024" loading="lazy" decoding="async" alt="Художественная визуализация золотого приза «ВМЕСТЕ» на бордовом фоне"><figcaption>Бордо и золото <span>Художественная визуализация</span></figcaption></figure>
    <figure><img src="visuals/feather.webp" width="1536" height="1024" loading="lazy" decoding="async" alt="Художественная визуализация награды с пером в тёплом свете"><figcaption>Свет и рельеф <span>Художественная визуализация</span></figcaption></figure>
  </div>
</section>
<section class="warm-original section" id="original-bear" aria-labelledby="original-bear-title">
  <details><summary><span><span class="eyebrow">Подлинное видео</span><span id="original-bear-title">Медведь · круговой обзор</span></span><span aria-hidden="true">+</span></summary>
  <div class="warm-original-body">''' + original_art + '''</div></details>
</section>
'''
html = html.replace(marker,extra+marker)
html = html.replace('<body>', '<body class="warm-edition">')
html = html.replace('</head>', '<script type="module" src="warm-ui.js?v=20261104-warm"></script>\n</head>')
(target/'index.html').write_text(html)
shutil.copyfile(root/'trifoti-source/warm/warm-theme.css',target/'warm-theme.css')
shutil.copyfile(root/'trifoti-source/warm/warm-ui.js',target/'warm-ui.js')
# Publish identical files for either GitHub Pages source layout.
mirror=root/'docs/trifoti/warm'
shutil.copytree(target,mirror,dirs_exist_ok=True)
print('Built warm edition and docs mirror')
