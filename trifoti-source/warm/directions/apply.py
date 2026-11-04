from pathlib import Path
import re,shutil

def apply(target):
 source=Path(__file__).parent
 labels=[('corporate','Корпоративные заказы','service-corporate'),('sculpture','Парковая и монументальная скульптура','service-sculpture'),('interiors','Дизайн интерьеров','service-design'),('awards','Награды','service-awards'),('industrial','Промышленный дизайн','service-industrial')]
 links=''.join(f'<a href="#{anchor}">{name}</a>' for _,name,anchor in labels)
 h=(target/'index.html').read_text()
 h=h.replace('Четыре направления','Пять направлений').replace('одно из четырёх актуальных направлений','одно из пяти актуальных направлений')
 h=h.replace('Воплощаем смелые идеи: дизайн интерьеров, скульптура, сувениры и призы, макетирование.','Корпоративные заказы, парковая и монументальная скульптура, дизайн интерьеров, награды и промышленный дизайн.')
 h=re.sub(r'(<nav class="hero-directions"[^>]*>).*?(</nav>)',lambda m:m[1]+links+m[2],h)
 h=re.sub(r'(<nav aria-label="Актуальные направления">).*?(</nav>)',lambda m:m[1]+links+m[2],h)
 tiles=[]
 for id,name,anchor in labels:
  picture={'corporate':('concepts/atlas.webp','2 концепта · не изготовленные изделия'),'sculpture':('/STEP_3D/trifoti/assets/projects/restoration/result.webp','Скульптурные работы · 5 кейсов'),'awards':('/STEP_3D/trifoti/assets/projects/std-awards/award-series.webp','4 проекта · 10 кадров')}.get(id)
  art=f'<img src="{picture[0]}" alt="" width="1024" height="1024" loading="lazy" decoding="async">' if picture else '<i></i><i></i>'
  count=picture[1] if picture else 'Пока нет проектов';cls='has-photo' if picture else 'is-intro'
  cta='Концепты' if id=='corporate' else 'Смотреть' if picture else 'О направлении'
  tiles.append(f'<a class="category-story-tile {cls}" data-story-category="{id}" href="#{anchor}"><span class="category-tile-art category-art-{id}" aria-hidden="true">{art}</span><span class="category-tile-cta">{cta} <span aria-hidden="true">→</span></span><div class="category-tile-copy"><h3>{name}</h3><span class="category-tile-count">{count}</span></div></a>')
 h=re.sub(r'<!-- category-stories:start -->.*?<!-- category-stories:end -->','<!-- category-stories:start --><div class="category-stories" aria-label="Истории по направлениям">'+''.join(tiles)+'</div><!-- category-stories:end -->',h,flags=re.S)
 descriptions=[('Для предприятий и событий','Подставки под Алису, сувениры для предприятий, фигурки медведя с логотипом, памятные и хоккейные медали. Обсуждаем назначение, символику, тираж и требования к изделию.','Символика · Тираж · Сувениры'),('Образ в пространстве','Скульптура для паркового и общественного пространства, монументальные композиции. В портфолио показаны скульптурные работы разных масштабов; контекст каждого объекта указан в его кейсе.','Образ · Масштаб · Место установки'),('Частные и офисные помещения','Дизайн частных и офисных интерьеров: образ пространства, планировка, материалы и предметные акценты. Опубликованных кейсов этого направления пока нет.','Частные помещения · Офисы · Материалы'),('Предмет со смыслом','Авторские награды, призы и кубки для событий. Прорабатываем образ, форму, материал и детали. Опубликованные проекты и их атрибуция сохранены в портфолио.','Призы · Кубки · Награды'),('От функции к форме','Промышленный дизайн изделий: назначение, эргономика, форма и конструкция с учётом материалов и изготовления. Опубликованных кейсов этого направления пока нет.','Функция · Эргономика · Конструкция')]
 services=[]
 for i,((id,name,anchor),(short,desc,tags)) in enumerate(zip(labels,descriptions),1):
  services.append(f'<details id="{anchor}"'+(' open' if i==1 else '')+f'><summary><span class="service-number">{i:02}</span><h3>{name}</h3><span class="service-short">{short}</span><span class="plus">+</span></summary><div class="service-detail"><p>{desc}</p><div class="tags">'+''.join(f'<span>{t}</span>' for t in tags.split(' · '))+f'</div><a class="text-link" href="#brief-form" data-service="{name}" aria-label="Подготовить бриф ({name})">Подготовить бриф <span aria-hidden="true">↗</span></a></div></details>')
 start=h.index('  <div class="service-list">');end=h.index('\n</section>',start)
 h=h[:start]+'  <span id="service-modelmaking" class="legacy-direction-anchor" aria-hidden="true"></span><div class="service-list">'+''.join(services)+'</div>'+h[end:]
 h=re.sub(r'(<select name="direction" id="brief-direction">).*?(</select>)',lambda m:m[1]+'<option>Пока не знаю — давайте обсудим</option>'+''.join(f'<option>{name}</option>' for _,name,_ in labels)+m[2],h)
 h=re.sub(r'(<h3>Направления</h3>\s*<ul>).*?(</ul>)',lambda m:m[1]+''.join(f'<li><a href="#{a}">{n}</a></li>' for _,n,a in labels)+m[2],h,flags=re.S)
 concepts='''<section class="section concept-gallery" id="corporate-concepts" aria-labelledby="concept-title"><span class="eyebrow">Корпоративные заказы / Визуальные идеи</span><h2 id="concept-title">Концепты, а не готовые изделия.</h2><p>Предоставленные изображения показывают замысел. Они не подтверждают изготовление или заказ со стороны указанной на медали команды. Интерактивных 3D-моделей этих концептов пока нет.</p><div class="concept-grid"><figure><a href="concepts/atlas.webp"><img src="concepts/atlas.webp" width="1024" height="1536" alt="Концепт подставки под колонку: Атлас держит ажурный глобус" loading="lazy"></a><figcaption><strong>Атлас с ажурным глобусом</strong><span>Концепт подставки под колонку · изображение</span></figcaption></figure><figure><a href="concepts/wolves.webp"><img src="concepts/wolves.webp" width="1774" height="887" alt="Концепт медали Волки: лицевая и оборотная стороны" loading="lazy"></a><figcaption><strong>Медаль «Волки»</strong><span>Концепт хоккейной медали · изображение</span></figcaption></figure></div></section>'''
 h=h.replace('<div class="manifesto-strip">',concepts+'<div class="manifesto-strip">')
 h=h.replace('Сувениры и призы','Награды').replace('Дизайн интерьеров, скульптура, сувениры и призы, макетирование.','Корпоративные заказы, парковая и монументальная скульптура, дизайн интерьеров, награды и промышленный дизайн.')
 (target/'index.html').write_text(h)
 shutil.copyfile(source/'category-stories-data.js',target/'category-stories-data.js')
 p=target/'category-stories.js';s=p.read_text().replace("import {projects} from './project-data.js?v=20261026-directions';","import {storyProjects as projects} from './category-stories-data.js?v=20261104-five';")
 s=s.replace('`Проект ${category.keys.indexOf(frame.key)+1}',"`${project?.concept?'Концепт':'Проект'} ${category.keys.indexOf(frame.key)+1}")
 s=s.replace("get('full-case').hidden=!frame", "get('full-case').hidden=!frame||!!project?.concept")
 s=s.replace("get('direction').hidden=!!frame", "get('direction').hidden=!!frame&&!project?.concept")
 s=s.replace("'Открыть исходное фото ↗'", "project?.concept?'Открыть изображение концепта ↗':'Открыть исходное фото ↗'")
 s=s.replace("get('end').textContent=frame?", "get('end').textContent=project?.concept?'Это концепт, не подтверждённый изготовленный объект.':frame?")
 p.write_text(s)
 for filename in ['brief-guidance.js','brief-preparation.js','experience-ux.js']:
  p=target/filename;s=p.read_text().replace('Сувениры и призы','Награды').replace("'Скульптура'","'Парковая и монументальная скульптура'").replace('Макетирование','Промышленный дизайн')
  if filename=='brief-guidance.js':s=s.replace('const hints=Object.freeze({',"const hints=Object.freeze({\n 'Корпоративные заказы':'Укажите назначение, символику, примерный тираж и пожелания к изделию.',").replace('что нужно показать в макете, желаемый масштаб и степень детализации','назначение изделия, размеры, материал и требования к конструкции')
  if filename=='brief-preparation.js':s=s.replace('export const preparationDirections=Object.freeze([',"export const preparationDirections=Object.freeze([\n {name:'Корпоративные заказы',question:'Нужны изделия для предприятия или события?',note:'Подставки, сувениры, фигурки и медали.',materials:['Назначение и примерный тираж','Логотип или символика, если есть','Размеры, материалы и желаемый срок']},")
  if filename=='experience-ux.js':s=s.replace("if(direction==='Награды')", "if(direction==='Награды'||direction==='Корпоративные заказы')")
  if filename=='brief-preparation.js':
   s=s.replace('Нужно представить идею в масштабе?','Нужно спроектировать изделие?').replace('Макет для показа и обсуждения формы.','Функция, эргономика, форма и конструкция.').replace('Описание объекта и задачи макета','Назначение изделия и условия использования').replace('Желаемый масштаб или размеры','Размеры и функциональные требования').replace('Чертежи, эскизы и нужная степень детализации','Чертежи, эскизы и ограничения изготовления')
   entries=re.findall(r' \{name:.*?\}',s)
   ordered=sorted(entries,key=lambda e:next(i for i,(_,name,_) in enumerate(labels) if "name:'"+name+"'" in e))
   begin=s.index('\n {name:');end=s.index('\n]);',begin);s=s[:begin]+'\n'+',\n'.join(e.rstrip(',') for e in ordered)+s[end:]
  if filename=='experience-ux.js':s=s.replace('Масштаб или размеры макета: ','Размеры изделия: ').replace('Что нужно показать: ','Назначение изделия: ').replace('Степень детализации: ','Требования к конструкции: ')
  p.write_text(s)
 p=target/'app.js';s=p.read_text().replace('direction.value=p.direction',"direction.value=({'Скульптура':'Парковая и монументальная скульптура','Сувениры и призы':'Награды'}[p.direction]||p.direction)");s=s.replace('legacyDirections.includes(value)',"[...legacyDirections,'Скульптура','Сувениры и призы','Макетирование'].includes(value)");p.write_text(s)
 # Bust module cache for the new direction data throughout the warm module graph.
 for p in target.rglob('*'):
  if p.suffix in ('.js','.html'):
   s=p.read_text().replace('v=20261104-sky','v=20261104-five').replace('Дизайн интерьеров · Скульптура · Сувениры и призы · Макетирование',' · '.join(name for _,name,_ in labels));s=re.sub(r'(category-stories(?:-data|-navigation)?\.js)(?:\?[^\'\"\s]+)?',r'\1?v=20261104-five',s)
   for module in ['brief-guidance','brief-preparation','experience-ux','app']:
    s=re.sub(r'('+module+r'\.js)(?:\?[^\'\"\s]+)?',r'\1?v=20261104-five',s)
   p.write_text(s)
