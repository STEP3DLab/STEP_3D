"""Optional reproducible font build: fontTools + Node, no network/install.
Subset the original variable Oswald, preserving outlines, variation and advances.
"""
from pathlib import Path
from types import SimpleNamespace
import base64, io, re, subprocess
from fontTools.ttLib import TTFont, woff2
from fontTools import subset
root=Path(__file__).resolve().parents[1]
css=root/'dist/style.css'
html=(root/'dist/index.html').read_text()
heading=re.search(r'<h1\b[^>]*>(.*?)</h1>',html,re.S)[1]
text=re.sub('<[^>]*>','',heading)
chars=''.join(sorted(set(text+text.upper()+' ')))
font=TTFont(root/'dist/assets/fonts/oswald.ttf',recalcTimestamp=False)
options=subset.Options(); options.recalc_timestamp=False; options.name_IDs=['*']; options.name_legacy=True; options.name_languages=['*']; options.layout_features=['*']
subsetter=subset.Subsetter(options=options);subsetter.populate(text=chars);subsetter.subset(font)
# A distinct derivative name, retaining copyright, designer and OFL notices.
for rec in font['name'].names:
    if rec.nameID in (1,4,6,16,17):
        value={1:'Trifoti Headline',4:'Trifoti Headline Semibold',6:'TrifotiHeadline-Semibold',16:'Trifoti Headline',17:'Semibold'}[rec.nameID]
        rec.string=value.encode(rec.getEncoding())
def compress(data, **kwargs):
    return subprocess.run(['node','-e',"const z=require('node:zlib'),f=require('node:fs');process.stdout.write(z.brotliCompressSync(f.readFileSync(0),{params:{[z.constants.BROTLI_PARAM_MODE]:z.constants.BROTLI_MODE_FONT,[z.constants.BROTLI_PARAM_QUALITY]:11}}));"],input=data,stdout=subprocess.PIPE,check=True).stdout
woff2.brotli=SimpleNamespace(compress=compress,MODE_FONT=2);woff2.haveBrotli=True
font.flavor='woff2';out=io.BytesIO();font.save(out);data=out.getvalue()
(root/'dist/assets/fonts/trifoti-headline.woff2').write_bytes(data)
block="/* headline-font:start */\n/* Trifoti Headline: exact Oswald 600 slogan subset. Copyright 2016 The Oswald Project Authors. SIL OFL, see assets/fonts/Oswald-OFL.txt. */\n@font-face{font-family:TrifotiHeadline;src:url('data:font/woff2;base64,"+base64.b64encode(data).decode()+"') format('woff2');font-weight:600;font-display:block}\n/* headline-font:end */"
style=css.read_text()
if '/* headline-font:start */' in style:style=re.sub(r'/\* headline-font:start \*/.*?/\* headline-font:end \*/',lambda m:block,style,flags=re.S)
else:style=style.replace(':root{--paper:',block+'\n:root{--paper:',1)
style=style.replace('font-family:Oswald,Manrope,sans-serif;','font-family:TrifotiHeadline,Oswald,Manrope,sans-serif;')
css.write_text(style)
print(f'{len(data)} bytes WOFF2, {len(chars)} characters; embedded in main stylesheet')
