"""Checks exact scoped gallery font artifacts and safe, idempotent application."""
from pathlib import Path
import hashlib, importlib.util, json, re, subprocess, sys, unittest
from types import SimpleNamespace
from fontTools.ttLib import TTFont, woff2
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('gallery_fonts',ROOT/'warm/portfolio-critical-fonts.py'); module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

def decode(data):
    return subprocess.run(['node','-e',"const z=require('node:zlib'),f=require('node:fs');process.stdout.write(z.brotliDecompressSync(f.readFileSync(0)));"],input=data,stdout=subprocess.PIPE,check=True).stdout
woff2.brotli=SimpleNamespace(decompress=decode);woff2.haveBrotli=True

class GalleryFonts(unittest.TestCase):
    def test_artifact_coverage_mirrors_and_idempotence(self):
        subprocess.run([sys.executable,str(ROOT/'warm/portfolio-critical-fonts.py'),'--check'],check=True)
        fonts={key:(module.OUTPUT/(key+'.woff2')).read_bytes() for key,_,_,_ in module.SPECS}
        page=module.PAGES[0].read_text()
        self.assertEqual(module.apply(page,fonts),page)
        self.assertEqual(module.apply(re.sub(re.escape(module.START)+r'.*?'+re.escape(module.END)+r'\n','',page,flags=re.S),fonts),page)
    def test_scope_and_existing_styles_unchanged(self):
        page=module.PAGES[0].read_text()
        block=module.BLOCK_RE.search(page)[0]
        self.assertIn('.bar > a:not(.brand),.intro p,#album-menu,.section-head > span{',block)
        self.assertIn('.bar .brand,.intro h1,.section-head h2{',block)
        self.assertEqual(block.count('@font-face'),2)
        self.assertIn('font-family:Manrope; src:url("../assets/fonts/manrope.woff2")',page)
        self.assertIn('font-family:Unbounded; src:url("../assets/fonts/unbounded.woff2")',page)
        self.assertNotIn('font-size:',block)
        for forbidden in ['font-size:', 'line-height:', 'padding:', 'margin:', 'display:none']:
            self.assertNotIn(forbidden,block)
    def test_rejects_malformed_markers_and_unexpected_stylesheets(self):
        with self.assertRaises(ValueError): module.apply(module.START,{key:b'x' for key,_,_,_ in module.SPECS})
        with self.assertRaises(ValueError): module.apply('no style',{key:b'x' for key,_,_,_ in module.SPECS})
    def test_text_extraction_handles_entities_and_void_tags(self):
        html='<header>A<img src="x"/> B &amp; C</header><div>ignored</div><nav id="album-menu">1<br>2</nav>'
        self.assertEqual(module.characters(html), ''.join(sorted(set(' A B & C12'))))

    def test_exact_glyphs_metrics_names_and_licenses(self):
        manifest=json.loads((module.OUTPUT/'manifest.json').read_text())
        chars=set(map(ord,manifest['characters']))
        for key,source,family,_ in module.SPECS:
          for weight in ([400] if source=='manrope' else [450,600]):
            with self.subTest(key=key,weight=weight):
                path=module.OUTPUT/(key+'.woff2')
                original=instantiateVariableFont(TTFont(module.REPO/'trifoti/assets/fonts'/(source+'.ttf'),recalcTimestamp=False),{'wght':weight})
                font=instantiateVariableFont(TTFont(path,recalcTimestamp=False),{'wght':weight})
                a=original.getBestCmap(); b=font.getBestCmap()
                self.assertTrue(chars.issubset(b))
                self.assertNotIn('fvar',font)
                for cp,name in b.items():
                    self.assertEqual(font['hmtx'][name],original['hmtx'][a[cp]],(key,cp,'advance'))
                    x=font['glyf'][name].getCoordinates(font['glyf']);y=original['glyf'][a[cp]].getCoordinates(original['glyf'])
                    self.assertEqual([list(z) for z in x],[list(z) for z in y],(key,cp,'outline'))
                for table,fields in {'head':['unitsPerEm'],'hhea':['ascent','descent','lineGap'],'OS/2':['sTypoAscender','sTypoDescender','sTypoLineGap','usWinAscent','usWinDescent']}.items():
                    for field in fields:self.assertEqual(getattr(font[table],field),getattr(original[table],field),(key,table,field))
                for field in [0,13,14]:
                    self.assertEqual({n.toUnicode() for n in font['name'].names if n.nameID==field},{n.toUnicode() for n in original['name'].names if n.nameID==field},(key,'license',field))
                self.assertEqual(font['name'].getBestFamilyName(),family)
                self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),manifest['fonts'][key]['sha256'])

if __name__=='__main__':unittest.main()
