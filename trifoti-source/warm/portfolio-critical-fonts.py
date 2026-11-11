"""Embed exact critical gallery fonts without rebuilding the independent warm site.

Optional reproducible build requires fontTools and Node (Brotli). No downloads.
Run from anywhere; --check validates the checked-in artifacts and coverage only.
"""
from pathlib import Path
from html.parser import HTMLParser
from types import SimpleNamespace
import base64, hashlib, io, json, re, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
OUTPUT = Path(__file__).with_name('portfolio-fonts')
SPECS = [('manrope','manrope','TrifotiGalleryText','200 800'), ('unbounded','unbounded','TrifotiGalleryHeading','200 900')]
PAGES = [REPO / 'trifoti/warm/portfolio.html', REPO / 'docs/trifoti/warm/portfolio.html']
START = '/* gallery-critical-fonts:start */'
END = '/* gallery-critical-fonts:end */'
BLOCK_RE = re.compile(re.escape(START) + r'.*?' + re.escape(END), re.S)

class CriticalText(HTMLParser):
    def __init__(self):
        super().__init__(); self.depth = 0; self.captures = []; self.text = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs); classes = attrs.get('class', '').split()
        if tag in ['meta','link','img','input','br','hr','source','wbr']: return
        self.depth += 1
        if (tag == 'header' or 'intro' in classes or 'section-head' in classes or attrs.get('id') == 'album-menu'):
            self.captures.append(self.depth)
    def handle_endtag(self, tag):
        if tag in ['meta','link','img','input','br','hr','source','wbr']: return
        if self.depth in self.captures: self.captures.remove(self.depth)
        self.depth -= 1
    def handle_data(self, data):
        if self.captures: self.text.append(data)

def characters(html):
    parser = CriticalText(); parser.feed(html)
    # Whitespace is rendered as spaces by these existing text containers.
    return ''.join(sorted(set(re.sub(r'\s+', ' ', ''.join(parser.text)) + ' ')))

def css_block(fonts):
    lines = [START, '/* Exact subsets of existing Manrope/Unbounded. Copyright and SIL OFL retained; see ../assets/fonts/*-OFL.txt. */']
    for key, source, family, weight in SPECS:
        encoded = base64.b64encode(fonts[key]).decode('ascii')
        lines.append(f"@font-face{{font-family:{family};src:url('data:font/woff2;base64,{encoded}') format('woff2');font-weight:{weight};font-display:block}}")
    lines += [
        '.bar > a:not(.brand),.intro p,#album-menu,.section-head > span{font-family:TrifotiGalleryText,Manrope,Arial,sans-serif}',
        '.bar .brand,.intro h1,.section-head h2{font-family:TrifotiGalleryHeading,Unbounded,Manrope,sans-serif}',
        END,
    ]
    return '\n'.join(lines)

def apply(html, fonts):
    block = css_block(fonts)
    if START in html or END in html:
        if html.count(START) != 1 or html.count(END) != 1 or not BLOCK_RE.search(html):
            raise ValueError('Invalid gallery font markers')
        return BLOCK_RE.sub(lambda _: block, html)
    if html.count('</style>') != 1: raise ValueError('Expected one gallery stylesheet')
    return html.replace('</style>', block + '\n</style>', 1)

def build(chars):
    from fontTools import subset
    from fontTools.ttLib import TTFont, woff2
    def compress(data, **kwargs):
        return subprocess.run(['node','-e',"const z=require('node:zlib'),f=require('node:fs');process.stdout.write(z.brotliCompressSync(f.readFileSync(0),{params:{[z.constants.BROTLI_PARAM_MODE]:z.constants.BROTLI_MODE_FONT,[z.constants.BROTLI_PARAM_QUALITY]:11}}));"], input=data, stdout=subprocess.PIPE, check=True).stdout
    woff2.brotli = SimpleNamespace(compress=compress, MODE_FONT=2); woff2.haveBrotli = True
    result = {}; metadata = {}
    for key, source, family, weight in SPECS:
        source_path = REPO / 'trifoti/assets/fonts' / (source + '.ttf')
        font = TTFont(source_path, recalcTimestamp=False)
        missing = set(map(ord, chars)) - set(font.getBestCmap())
        if missing: raise ValueError(f'{source} lacks {missing}')
        opts = subset.Options(); opts.recalc_timestamp = False
        opts.name_IDs = ['*']; opts.name_legacy = True; opts.name_languages = ['*']; opts.layout_features = ['*']
        sub = subset.Subsetter(options=opts); sub.populate(text=chars); sub.subset(font)
        for record in font['name'].names:
            if record.nameID in (1,4,6,16):
                name = family.replace(' ', '') if record.nameID == 6 else family
                record.string = name.encode(record.getEncoding())
        font.flavor = 'woff2'; stream = io.BytesIO(); font.save(stream); data = stream.getvalue()
        result[key] = data
        metadata[key] = {'source':source, 'weight':weight, 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest(), 'source_sha256':hashlib.sha256(source_path.read_bytes()).hexdigest()}
    return result, {'characters':chars, 'fonts':metadata}

def main():
    page = PAGES[0].read_text(); chars = characters(page)
    if '--check' in sys.argv:
        manifest = json.loads((OUTPUT / 'manifest.json').read_text())
        assert chars == manifest['characters'], 'Critical text changed; rebuild fonts'
        fonts = {key:(OUTPUT / (key + '.woff2')).read_bytes() for key,_,_,_ in SPECS}
        for name,data in fonts.items():
            assert hashlib.sha256(data).hexdigest() == manifest['fonts'][name]['sha256']
            assert hashlib.sha256((REPO/'trifoti/assets/fonts'/(manifest['fonts'][name]['source']+'.ttf')).read_bytes()).hexdigest() == manifest['fonts'][name]['source_sha256']
        for path in PAGES: assert apply(path.read_text(), fonts) == path.read_text(), path
        assert PAGES[0].read_bytes() == PAGES[1].read_bytes(), 'Mirrors differ'
        print('Critical font CSS, coverage, source hashes and mirrors verified'); return
    fonts,manifest = build(chars); OUTPUT.mkdir(exist_ok=True)
    for name,data in fonts.items(): (OUTPUT / (name + '.woff2')).write_bytes(data)
    (OUTPUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    for path in PAGES: path.write_text(apply(path.read_text(),fonts))
    print(json.dumps(manifest,ensure_ascii=False,indent=2))

if __name__ == '__main__': main()
