from pathlib import Path
import shutil

def apply(target):
    dest=target/'concepts'
    dest.mkdir(exist_ok=True)
    shutil.copyfile(Path(__file__).with_name('concept.css'),dest/'concept.css')
    for key,title,subtitle,direction,label,width,height in [
        ('wolves','Медаль «Волки»','Концепт хоккейной медали','corporate','Корпоративные заказы',1774,887),
        ('atlas','Атлас с ажурным глобусом','Концепт подставки под колонку','industrial','Промышленный дизайн',1024,1536)]:
        base='https://step3dlab.github.io/STEP_3D/trifoti/warm/concepts'
        description=f'{subtitle}. Изображение замысла, не подтверждённое изготовленное изделие.'
        text=f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} — концепт · ТРИФОТИ</title><meta name="description" content="{description}"><meta property="og:type" content="website"><meta property="og:title" content="{title} — концепт · ТРИФОТИ"><meta property="og:description" content="{description}"><meta property="og:url" content="{base}/{key}.html"><meta property="og:image" content="{base}/{key}.webp"><meta property="og:image:width" content="{width}"><meta property="og:image:height" content="{height}"><meta property="og:image:alt" content="{title} — изображение концепта"><link rel="stylesheet" href="concept.css"></head>
<body><header><a class="brand" href="../index.html">ТРИФОТИ<span>Творческое объединение</span></a><a class="back" href="../index.html#service-{direction}">← {label}</a></header>
<main><div class="intro"><span class="eyebrow">Исследование формы · концепт</span><h1>{title}</h1><p class="subtitle">{subtitle}</p></div>
<div class="layout"><figure><a href="{key}.webp" aria-label="Открыть оригинальное изображение: {title.replace('«','').replace('»','')}"><img src="{key}.webp" alt="{title}" width="{width}" height="{height}"></a><figcaption>{subtitle} · изображение <a href="{key}.webp">Открыть оригинал →</a></figcaption></figure>
<aside><h2>Замысел, не готовое изделие</h2><p>Предоставленное изображение показывает замысел. Оно не подтверждает изготовление или заказ со стороны указанной на медали команды. Интерактивной 3D-модели этого концепта пока нет.</p><div class="next"><h2>Обсудим вашу задачу</h2><p>Добавьте это изображение как отправную точку в локальный бриф. Ваш текст и выбранное направление сохранятся. Ничего не отправляется.</p><a class="button" href="../index.html?concept={key}#brief-form">Добавить концепт в бриф <span aria-hidden="true">→</span></a><a class="return" href="../index.html#service-{direction}">Вернуться к направлению →</a></div></aside></div></main><footer>ТРИФОТИ · Концепты и исследования формы</footer></body></html>'''
        if key=='atlas': text=text.replace(' или заказ со стороны указанной на медали команды','')
        (dest/f'{key}.html').write_text(text)
    p=target/'index.html'
    h=p.read_text()
    for key in ['wolves','atlas']: h=h.replace(f'href="concepts/{key}.webp"',f'href="concepts/{key}.html"')
    p.write_text(h)

    source=Path(__file__).parent
    for name in ['concept-data.js','concept-brief.js']: shutil.copyfile(source/name,target/name)
    manager=target/'reference-manager.js'
    text=manager.read_text()
    imp="import {concepts,conceptBlock,conceptURL} from './concept-data.js?v=20261119-context';\n"
    if imp not in text: text=imp+text
    marker='function readPart(text) {'
    hook="\n  const conceptKey=Object.keys(concepts).find(key=>text===conceptBlock(key));\n  if(conceptKey)return {text,key:conceptURL(conceptKey),title:concepts[conceptKey].title,caption:concepts[conceptKey].caption};"
    if 'const conceptKey=' not in text:text=text.replace(marker,marker+hook)
    manager.write_text(text)
    app=target/'app.js';text=app.read_text()
    if "has('concept')" not in text:
        text+="\nif(new URLSearchParams(location.search).has('concept')) {\n import('./concept-brief.js?v=20261119-context').then(({addConceptReference})=>addConceptReference({form,selectReference,status:document.getElementById('brief-status')})).catch(()=>{document.getElementById('brief-status').textContent='Не удалось добавить концепт. Обновите страницу, чтобы повторить.';});\n}\n"
    app.write_text(text)

    # Invalidate all consumers of the extended reference parser together.
    import re
    for name in ['app.js','brief-preparation.js','case-enquiry.js']:
        file=target/name
        if file.exists():file.write_text(re.sub(r"(reference-manager\.js\?v=)[^'\"]+",r"\g<1>20261119-context",file.read_text()))
