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
    text = re.sub(r'<meta name="theme-color" content="[^"]*">', '<meta name="theme-color" content="#1963c9">', text)
    page.write_text(text)
    shutil.copyfile(source/'interior-stage.css',target/'interior-stage.css')

if __name__ == '__main__':
    root = Path(__file__).resolve().parents[3]
    apply(root/'trifoti/warm')
    shutil.copytree(root/'trifoti/warm',root/'docs/trifoti/warm',dirs_exist_ok=True)
