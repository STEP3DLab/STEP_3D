"""Audit the embedded slogan subset against original Oswald at weight 600."""
from pathlib import Path
from types import SimpleNamespace
import hashlib,json,subprocess
from fontTools.ttLib import TTFont,woff2
from fontTools.varLib.instancer import instantiateVariableFont
root=Path(__file__).resolve().parents[1]
def decode(data):return subprocess.run(['node','-e',"const z=require('node:zlib'),f=require('node:fs');process.stdout.write(z.brotliDecompressSync(f.readFileSync(0)));"],input=data,stdout=subprocess.PIPE,check=True).stdout
woff2.brotli=SimpleNamespace(decompress=decode);woff2.haveBrotli=True
original=instantiateVariableFont(TTFont(root/'dist/assets/fonts/oswald.ttf',recalcTimestamp=False),{'wght':600})
path=root/'dist/assets/fonts/trifoti-headline.woff2';font=instantiateVariableFont(TTFont(path,recalcTimestamp=False),{'wght':600})
a=original.getBestCmap();b=font.getBestCmap()
for cp,name in b.items():
    source=a[cp];assert font['hmtx'][name]==original['hmtx'][source],(cp,'advance')
    x=font['glyf'][name].getCoordinates(font['glyf']);y=original['glyf'][source].getCoordinates(original['glyf'])
    assert [list(z) for z in x]==[list(z) for z in y],(cp,'outline')
for table,fields in {'head':['unitsPerEm'],'hhea':['ascent','descent','lineGap'],'OS/2':['sTypoAscender','sTypoDescender','sTypoLineGap','usWinAscent','usWinDescent']}.items():
    for field in fields:assert getattr(font[table],field)==getattr(original[table],field),(table,field)
report={'source':'assets/fonts/oswald.ttf','weight':600,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'codepoints':sorted(b),'outlines_and_advances_equal':True};print(json.dumps(report,indent=2))
