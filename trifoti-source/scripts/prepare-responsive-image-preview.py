"""Local-only browser QA. Does not alter production HTML or images."""
from pathlib import Path
import re, shutil, json
root = Path(__file__).resolve().parents[2]
preview = root/'trifoti-source/preview'
dist = preview/'dist'
dist.mkdir(parents=True, exist_ok=True)
(preview/'.openai').mkdir(exist_ok=True)
(preview/'.openai/hosting.json').write_text('{"static":{"directory":"dist"}}')
for folder in ('scenes','brand'):
    shutil.copytree(root/'trifoti/warm'/folder, dist/folder, dirs_exist_ok=True)
html = (root/'trifoti/warm/index.html').read_text()
html = html.replace('<head>', '<head><base href="https://step3dlab.github.io/STEP_3D/trifoti/warm/">')
for dpr in (1,2,3):
    for width in (320,390,768,800,801,1150,1151,1440):
        case = f'{width}-{dpr}'
        page = re.sub(r'(?<=[" ])((?:scenes/parshin-atelier-20261106[^" ]*|brand/logo-[^" ]*)\.(?:webp|jpg))', lambda m: f'http://127.0.0.1:4173/{m[1]}?case={case}', html)
        (dist/f'case-{case}.html').write_text(page)
shutil.copyfile(root/'trifoti-source/scripts/warm-responsive-images-qa.html', dist/'index.html')
