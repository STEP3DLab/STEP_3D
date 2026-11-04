from pathlib import Path
import json,re,subprocess
from html import escape

def apply(target):
 root=target.parents[1]
 source=Path(__file__).parent
 data=json.loads((source/'project.json').read_text())
 p=target/'project-data.js'
 p.write_text(p.read_text()+'\n// Additional verified completed project for this edition only.\nprojects["red7-panels"]='+json.dumps(data,ensure_ascii=False)+';\n')
 p=target/'category-stories-data.js'
 s=p.read_text()
 s=re.sub(r"(\{id:'artobjects',title:'Арт-объекты',service:'service-artobjects',)keys:\[\],intro:.*?\}",r"\1keys:['red7-panels']}",s)
 p.write_text(s)
 p=target/'index.html';s=p.read_text()
 s=s.replace('Подтверждённые примеры этого направления пока не добавлены.','В портфолио — изготовленные и установленные панно RED7 из материалов Step3D / X.Lab.')
 s=re.sub(r'<a class="category-story-tile is-intro" data-story-category="artobjects".*?</a>', '<a class="category-story-tile has-photo" data-story-category="artobjects" href="cases/red7-panels.html"><span class="category-tile-art category-art-artobjects" aria-hidden="true"><img src="photos/red7/ring-installed.webp" width="1152" height="1536" alt="" loading="lazy" decoding="async"></span><span class="category-tile-cta">Смотреть <span aria-hidden="true">→</span></span><div class="category-tile-copy"><h3>Арт-объекты</h3><span class="category-tile-count">1 проект · 5 фотографий</span></div></a>',s)
 card='<article class="project-item" data-card="red7-panels"><a href="cases/red7-panels.html" class="project-card real-project" data-category="artobjects" data-project="red7-panels"><div class="project-visual"><span class="project-tag">Арт-объекты</span><img src="photos/red7/ring-installed.webp" alt="Круглое объёмное панно после монтажа в интерьере RED7" width="1152" height="1536" loading="lazy" decoding="async"><span class="media-count">5 фото</span><span class="project-open-label">Смотреть проект</span></div><div class="project-title"><h3>Объёмные панно RED7</h3><span>Из портфолио Step3D / X.Lab</span><p class="project-teaser">Установленные панно и этапы работы в мастерской. Проспект Академика Сахарова, 7.</p></div></a><button type="button" class="selection-button" data-selection="red7-panels" hidden>+ В подборку</button></article>'
 s=s.replace('<div class="project-grid">','<div class="project-grid">'+card)
 s=s.replace('Все проекты и подробные кейсы · 9','Все проекты и подробные кейсы · 10').replace('Все <span class="filter-count">9</span>','Все <span class="filter-count">10</span>').replace('9 проектов','10 проектов')
 marker='</div></div>\n'
 i=s.index('<div class="catalog-filters-row">');end=s.index('</div></div>',i)
 s=s[:end]+'<button data-filter="artobjects" data-direction="Арт-объекты" aria-pressed="false">Арт-объекты <span class="filter-count">1</span></button>'+s[end:]
 p.write_text(s)
 # Reuse established resource renderer with this edition's project data.
 gen=(root/'trifoti-source/scripts/render-portfolio-resources.mjs').read_text()
 gen=gen.replace("'../dist/project-data.js'","'../../trifoti/warm/project-data.js'").replace("'../dist/exploration-data.js'","'../../trifoti/warm/exploration-data.js'")
 gen=gen.replace("https://step3dlab.github.io/STEP_3D/trifoti/","https://step3dlab.github.io/STEP_3D/trifoti/warm/")
 gen=gen.replace("const d=dimensions[src];","const d=dimensions[src]||(src.includes('/photos/red7/')?{width:src.includes('workshop')||src.includes('finishing')?1536:1152,height:src.includes('workshop')||src.includes('finishing')?1152:1536}:null);")
 temp=root/'trifoti-source/scripts/.warm-render.tmp.mjs';temp.write_text(gen)
 try:
  code="import {renderCase,renderCatalog,renderLight,renderMeeting} from './trifoti-source/scripts/.warm-render.tmp.mjs'; console.log(JSON.stringify({'cases/red7-panels.html':renderCase('red7-panels'),'catalog.html':renderCatalog(),'light.html':renderLight(),'meeting.html':renderMeeting()}));"
  outputs=json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=root).decode())
 finally: temp.unlink()
 for name,html in outputs.items():
  html=html.replace('../ /STEP_3D/','/STEP_3D/').replace('..//STEP_3D/','/STEP_3D/').replace('https://step3dlab.github.io/STEP_3D/trifoti/warm//STEP_3D/','https://step3dlab.github.io/STEP_3D/')
  html=re.sub(r'(?<![\w:/])(?:\.\./)?assets/','/STEP_3D/trifoti/assets/',html)
  html=html.replace('Дизайн интерьеров · Скульптура · Сувениры и призы · Макетирование','Корпоративные заказы · Парковая и монументальная скульптура · Дизайн интерьеров · Награды · Промышленный дизайн · Арт-объекты')
  html=html.replace('</head>',f'<link rel="stylesheet" href="{"../" if name.startswith("cases/") else ""}warm-theme.css?v=20261104-red7"></head>')
  (target/name).write_text(html)
 # Keep all consumers on a single fresh module graph.
 for p in target.rglob('*'):
  if p.suffix in ('.html','.js'):
   s=p.read_text()
   s=re.sub(r'((?:[a-z-]+)\.js)\?[^\s\'\"]+',r'\1?v=20261104-red7',s)
   s=s.replace('v=20261104-six','v=20261104-red7')
   p.write_text(s)
