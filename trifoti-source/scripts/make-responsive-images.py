"""Resize existing covers only; preserve the full frame and untouched originals."""
from pathlib import Path
import re,json,hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'dist/index.html'; html=p.read_text(); manifest=[]
for src in dict.fromkeys(re.findall(r'<img src="(assets/projects/[^"]+)"',html)):
 source=ROOT/'dist'/src
 with Image.open(source) as original:
  width,height=original.size; variants=[]
  for w in (480,800):
   if w>=width:continue
   target=src.replace('assets/projects/','assets/responsive/').replace('.webp',f'-{w}.webp')
   output=ROOT/'dist'/target; output.parent.mkdir(parents=True,exist_ok=True)
   resized=original.resize((w,round(height*w/width)),Image.Resampling.LANCZOS)
   resized.save(output,'WEBP',quality=92,method=6)
   if output.stat().st_size>=source.stat().st_size:
    output.unlink();continue
   variants.append(dict(src=target,width=w,height=resized.height,bytes=output.stat().st_size))
  manifest.append(dict(src=src,width=width,height=height,bytes=source.stat().st_size,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),variants=variants))
  if not variants:continue
  srcset=', '.join(f'{v["src"]} {v["width"]}w' for v in variants)+f', {src} {width}w'
  # Matches actual 91/90vw content width; project grid 7/5 columns above900.
  pos=html.index(f'<img src="{src}"'); before=html[:pos]; journal=before.rfind('<article class="journal-card"')>before.rfind('<a href=')
  if journal:sizes='(max-width:560px) 90vw, (max-width:800px) calc(45vw - 11px), calc(30.3333vw - 16px)'
  else:
   large=src.endswith(('white-front.webp','result.webp','award-series.webp'))
   sizes='(max-width:600px) 90vw, (max-width:900px) calc(45vw - 12px), '+('calc(53.0833vw - 12.5px)' if large else 'calc(37.9167vw - 17.5px)')
  html=re.sub(r'(<img src="'+re.escape(src)+r'")(?: srcset="[^"]*" sizes="[^"]*")?',lambda m:m[1]+f' srcset="{srcset}" sizes="{sizes}"',html)
p.write_text(html)
(ROOT/'scripts/responsive-images.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('480px candidate total:',sum(next((v['bytes'] for v in m['variants'] if v['width']==480),m['bytes']) for m in manifest),'original total:',sum(m['bytes'] for m in manifest))
