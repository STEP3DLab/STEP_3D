"""Add native, JavaScript-independent navigation to existing warm case media."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
import re

ROOT = Path(__file__).resolve().parents[3]
class MediaParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.items = []; self.figure = None
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'figure' and a.get('id', '').startswith('media-'):
            self.figure = a['id']
        if self.figure and tag in ('img', 'video'):
            self.items.append((self.figure, a.get('alt') if tag == 'img' else a.get('aria-label'), tag == 'video'))
            self.figure = None
    def handle_endtag(self, tag):
        if tag == 'figure': self.figure = None

def apply(target):
    for page in sorted((target / 'cases').glob('*.html')):
        text = page.read_text(); parser = MediaParser(); parser.feed(text)
        if not parser.items: continue
        text = re.sub(r'<details class="case-media-index".*?</details>', '', text, flags=re.S)
        text = re.sub(r'<a class="case-media-return"[^>]*>.*?</a>', '', text)
        if len(parser.items) < 2:
            text = text.replace('<link rel="stylesheet" href="../case-media-index.css?v=20261118">\n', '')
            page.write_text(text)
            continue
        count = len(parser.items)
        noun = 'материалов' if 11 <= count % 100 <= 14 else 'материал' if count % 10 == 1 else 'материала' if count % 10 in (2, 3, 4) else 'материалов'
        links = ''.join(f'<li><a href="#{escape(id)}"><span>{i:02d}{" · Видео" if video else " · Фото"}</span>{escape(caption)}</a></li>' for i,(id,caption,video) in enumerate(parser.items,1))
        index = f'<details class="case-media-index" id="case-media-index"><summary>Выбрать фото или видео <span>{count} {noun}</span></summary><ol>{links}</ol></details>'
        text = text.replace('<div class="static-gallery">', index + '<div class="static-gallery">', 1)
        text = text.replace('</figcaption>', '<a class="case-media-return" href="#case-media-index">К списку материалов ↑</a></figcaption>')
        css = '<link rel="stylesheet" href="../case-media-index.css?v=20261118">'
        if css not in text: text = text.replace('</head>', css + '\n</head>')
        page.write_text(text)
    (target / 'case-media-index.css').write_text(Path(__file__).with_name('case-media-index.css').read_text())

if __name__ == '__main__':
    for target in (ROOT / 'trifoti/warm', ROOT / 'docs/trifoti/warm'): apply(target)
