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
        for old, new in {'#e71931': '#075e9d', '#bf1230': '#075e9d', '#c41027': '#064b7a', '#c9102c': '#075e9d', '#a3162c': '#064b7a', '#f5f3ee': '#f2f9ff', '#ff5266': '#b8e6ff', '#a91c24': '#075e9d', '#c92323': '#075e9d', '#e9e6df': '#e4f1fa', '#eee9e1': '#e6f4ff', '#f7f5f0': '#f5fbff', '#e8e5df': '#e7f3fc', '#f4f0ec': '#eef8ff', '#c82922':'#075e9d', '#ff6476':'#80ddff'}.items():
            text=text.replace(old,new)
        text=text.replace('245,243,238','242,249,255')
    # Restore absolute shared media references after changing canonical URLs.
    text = text.replace('/trifoti/warm/assets/', '/trifoti/assets/')
    if path.suffix == '.html':
        css = '../warm-theme.css' if relative.parts[0] == 'cases' else 'warm-theme.css'
        text = text.replace('</head>', f'<link rel="stylesheet" href="{css}?v=20261104-warm">\n</head>')
        text = text.replace('content="#f5f3ee"', 'content="#d5eefa"')
        text = re.sub(r'(href="[^"]+\.css)(?:\?[^"]*)?(")', r'\1?v=20261104-sky\2', text)
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
html = html.replace('01 / TRIFOTI', 'TRIFOTI / ФОРМА И ТЕХНОЛОГИИ')
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
# Use the verified blue edition emblem without importing its palette or content.
logo = '<span class="warm-brand-mark"><img src="brand/logo-original.jpg" width="1536" height="1258" alt="" decoding="async"></span><span class="warm-brand-type">ТРИФОТИ<small>ТВОРЧЕСКОЕ ОБЪЕДИНЕНИЕ</small></span>'
html = re.sub(r'(<a class="brand brand-full brand-final"[^>]*>).*?(</a>)', lambda m: m[1].replace('brand-final', 'brand-blue-origin').replace('ТРИФОТИ — медведь и название объединения', 'ТРИФОТИ — на главную') + logo + m[2], html)
html = re.sub(r'(<a href="#home" class="footer-wordmark footer-brand-final"[^>]*>).*?(</a>)', lambda m: m[1].replace('footer-brand-final', 'footer-brand-blue-origin') + logo + m[2], html)
html = html.replace('<body>', '<body class="warm-edition">')
html = html.replace('</head>', '<script type="module" src="warm-ui.js?v=20261104-warm"></script>\n</head>')
(target/'index.html').write_text(html)
shutil.copyfile(root/'trifoti-source/warm/warm-theme.css',target/'warm-theme.css')
shutil.copyfile(root/'trifoti-source/warm/warm-ui.js',target/'warm-ui.js')
import runpy
runpy.run_path(str(root/'trifoti-source/warm/directions/apply.py'))['apply'](target)
runpy.run_path(str(root/'trifoti-source/warm/red7/apply.py'))['apply'](target)
# Keep the independent studio palette after all generated styles and direction updates.
shutil.copyfile(root/'trifoti-source/warm/studio-palette.css', target/'studio-palette.css')
for page in target.rglob('*.html'):
    palette = '../studio-palette.css' if page.parent.name == 'cases' else 'studio-palette.css'
    content = page.read_text()
    content = re.sub(r'<meta name="theme-color" content="[^"]*">', '<meta name="theme-color" content="#142039">', content)
    content = content.replace('</head>', f'<link rel="stylesheet" href="{palette}?v=20261106-spectrum">\n</head>')
    page.write_text(content)
# Apply the editorial layer last, preserving the warm snapshot when called independently.
runpy.run_path(str(root/'trifoti-source/warm/premium/apply.py'))['apply'](target)
# Publish identical files for either GitHub Pages source layout.
mirror=root/'docs/trifoti/warm'
shutil.copytree(target,mirror,dirs_exist_ok=True)
print('Built warm edition and docs mirror')
