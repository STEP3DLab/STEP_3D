from pathlib import Path
import shutil

def apply(target):
    dest=target/'concepts'
    dest.mkdir(exist_ok=True)
    shutil.copyfile(Path(__file__).with_name('concept.css'),dest/'concept.css')
    for key,title,subtitle,direction,label,width,height in [
        ('wolves','Медаль «Волки»','Концепт хоккейной медали','corporate','Корпоративные заказы',1774,887),
        ('atlas','Атлас с ажурным глобусом','Концепт подставки под колонку','industrial','Промышленный дизайн',1024,1536)]:
        text=f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title} — концепт · ТРИФОТИ</title><meta name="description" content="{subtitle}. Изображение замысла, не подтверждённое изготовленное изделие."><link rel="stylesheet" href="concept.css"></head>
<body><header><a class="brand" href="../index.html">ТРИФОТИ<span>Дизайн-студия</span></a><a class="back" href="../index.html#service-{direction}">← {label}</a></header>
<main><div class="intro"><span class="eyebrow">Исследование формы · концепт</span><h1>{title}</h1><p class="subtitle">{subtitle}</p></div>
<div class="layout"><figure><a href="{key}.webp" aria-label="Открыть оригинальное изображение: {title.replace('«','').replace('»','')}"><img src="{key}.webp" alt="{title}" width="{width}" height="{height}"></a><figcaption>{subtitle} · изображение <a href="{key}.webp">Открыть оригинал →</a></figcaption></figure>
<aside><h2>Замысел, не готовое изделие</h2><p>Предоставленное изображение показывает замысел. Оно не подтверждает изготовление или заказ со стороны указанной на медали команды. Интерактивной 3D-модели этого концепта пока нет.</p><div class="next"><h2>Обсудим вашу задачу</h2><p>На главной можно подготовить описание заказа и выбрать удобный способ связи со студией.</p><a class="button" href="../index.html#contact">Перейти к обсуждению <span aria-hidden="true">→</span></a><a class="return" href="../index.html#service-{direction}">Вернуться к направлению →</a></div></aside></div></main><footer>ТРИФОТИ · Концепты и исследования формы</footer></body></html>'''
        if key=='atlas': text=text.replace(' или заказ со стороны указанной на медали команды','')
        (dest/f'{key}.html').write_text(text)
    p=target/'index.html'
    h=p.read_text()
    for key in ['wolves','atlas']: h=h.replace(f'href="concepts/{key}.webp"',f'href="concepts/{key}.html"')
    p.write_text(h)
