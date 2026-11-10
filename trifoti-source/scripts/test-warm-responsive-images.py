"""Check responsive image markup, preserved originals, geometry and mirror parity."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib, re, subprocess

root = Path(__file__).resolve().parents[2]
warm = root/'trifoti/warm'
mirror = root/'docs/trifoti/warm'
class Images(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.images=[]; self.feed(text)
    def handle_starttag(self, tag, attrs):
        if tag == 'img': self.images.append(dict(attrs))

index=(warm/'index.html').read_text()
assert (mirror/'index.html').read_bytes() == (warm/'index.html').read_bytes()
images=Images(index).images
hero=next(i for i in images if i.get('src')=='scenes/parshin-atelier-20261106.webp')
logos=[i for i in images if i.get('src')=='brand/logo-original.jpg']
assert len(logos)==2 and logos[0]==logos[1]
assert hero['sizes']=='100vw' and hero['width']=='2048' and hero['height']=='1152'
assert hero['fetchpriority']=='high' and hero.get('loading')!='lazy' and hero['decoding']=='async'
assert hero in Images((root/'trifoti-source/warm/interior/hero.html').read_text()).images
assert logos[0]['sizes']=='(max-width:380px) 59.5px, (max-width:800px) 66.5px, (max-width:1150px) 73.5px, 85.75px'
assert logos[0]['alt']=='' and logos[0]['width']=='1536' and logos[0]['height']=='1258'
build=(root/'trifoti-source/scripts/build-warm.py').read_text()
assert logos[0]['srcset'] in build and logos[0]['sizes'] in build
for original,sha in [('scenes/parshin-atelier-20261106.webp','933c68568411db8185bee6137c600b8925e6af6f'),('brand/logo-original.jpg','230f52eb21f6a9650cee342a35715450d7f8111d')]:
    data=(warm/original).read_bytes()
    assert hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()==sha
for image,expected,ratio in [(hero,[480,768,1024,1440,2048],16/9),(logos[0],[96,192,288],1536/1258)]:
    entries=[entry.strip().split() for entry in image['srcset'].split(',')]
    assert [int(width[:-1]) for _,width in entries]==expected
    for name,descriptor in entries:
        width,height=map(int,subprocess.check_output(['magick','identify','-format','%w %h',str(warm/name)],text=True).split())
        assert width==int(descriptor[:-1]) and abs(height-width/ratio)<=0.5
        if name.endswith('20261106.webp'): continue
        assert (warm/name).read_bytes()==(mirror/name).read_bytes()
        assert (warm/name).stat().st_size < (warm/image['src']).stat().st_size
# Optional local baseline asserts the production document changed only these three tags.
baseline=root/'trifoti-source/preview/index-original.html'
if baseline.exists():
    normalized=index
    for img in [hero,*logos]:
        normalized=normalized.replace(f' srcset="{img["srcset"]}"','').replace(f' sizes="{img["sizes"]}"','')
    assert normalized==baseline.read_text()
print('PASS: markup, templates, priority, geometry, 7 derivative mirrors, original hashes and optional document baseline')
