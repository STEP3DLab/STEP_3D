"""Publish static link cards on the studio's overview pages."""
from html import escape, unescape
from pathlib import Path
import re
import shutil

BASE_URL = 'https://step3dlab.github.io/STEP_3D/trifoti/warm/'
COVER = 'trifoti-blue-share-20261115.jpg'
ALT = 'ТРИФОТИ. Бело-голубой знак творческого объединения на синем фоне.'


def apply(target):
    target = Path(target)
    shutil.copyfile(Path(__file__).with_name(COVER), target / 'brand' / COVER)
    # Case studies keep their individual project photographs and captions.
    for page in sorted(target.glob('*.html')):
        home = page.name == 'index.html'
        head, body = page.read_text().split('</head>', 1)
        title = ('ТРИФОТИ — скульптура, интерьеры и арт-объекты' if home else
                 unescape(re.search(r'<title>(.*?)</title>', head).group(1)))
        description = ('Портфолио творческого объединения. Объёмные панно RED7, театральные награды и скульптуры из мастерской Фёдора Паршина.' if home else
                       unescape(re.search(r'<meta name="description" content="([^"]*)"', head).group(1)))
        page_url = BASE_URL if home else BASE_URL + page.name
        image_url = BASE_URL + 'brand/' + COVER
        fields = {
            'og:type': 'website', 'og:locale': 'ru_RU', 'og:site_name': 'ТРИФОТИ',
            'og:title': title, 'og:description': description, 'og:url': page_url,
            'og:image': image_url, 'og:image:type': 'image/jpeg',
            'og:image:width': '1200', 'og:image:height': '630', 'og:image:alt': ALT,
            'twitter:card': 'summary_large_image', 'twitter:title': title,
            'twitter:description': description, 'twitter:image': image_url, 'twitter:image:alt': ALT,
        }
        tags = []
        for key, value in fields.items():
            attr = 'property' if key.startswith('og:') else 'name'
            tags.append(f'<meta {attr}="{key}" content="{escape(value, quote=True)}">')
        head = re.sub(r'[ \t]*<meta (?:name="twitter:|property="og:)[^>]*>\n?', '', head)
        # Keep the card near the start, ahead of the gallery's inline styles.
        head = re.sub(r'</title>\s*', lambda _: '</title>\n' + '\n'.join(tags) + '\n', head, count=1)
        page.write_text(head + '</head>' + body)
