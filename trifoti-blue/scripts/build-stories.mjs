import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {projects} from '../project-data.js';
import {stories} from '../project-stories.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const ids = Object.keys(stories);
const sourceLink = media => ` <a class="original-photo" href="${esc(media.originalPhoto)}" target="_blank" rel="noopener">Исходный кадр ↗</a>`;
const media = (p, indices, className='') => indices.length ? `<div class="story-media ${indices.length===1?'single':''} ${className}">${indices.map(i=>{
  const m=p.media[i];
  return `<figure>${m.type==='video'?`<video controls playsinline preload="none" poster="${esc(m.poster)}" aria-label="${esc(m.caption)}"><source src="${esc(m.src)}" type="video/mp4">Ваш браузер не поддерживает видео.</video>`:`<img src="${esc(m.src)}" alt="${esc(m.caption)}" loading="lazy">`}<figcaption>${esc(m.caption)}${sourceLink(m)}</figcaption></figure>`;
}).join('')}</div>` : '';

for (const [index,id] of ids.entries()) {
  const p=projects[id], s=stories[id], nextId=ids[(index+1)%ids.length], next=projects[nextId];
  const canonical=`https://step3dlab.github.io/STEP_3D/trifoti-blue/cases/${id}.html`;
  const html=`<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="../">
  <title>${esc(p.title)} — история проекта · ТРИФОТИ</title>
  <meta name="description" content="${esc(s.summary)} ${esc(s.credit)}"><meta name="theme-color" content="#092d50">
  <link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${esc(p.title)} — ТРИФОТИ"><meta property="og:description" content="${esc(s.summary)}"><meta property="og:image" content="https://step3dlab.github.io/STEP_3D/trifoti-blue/${p.media[0].src}">
  <link rel="icon" href="assets/favicon.svg"><link rel="preload" as="font" href="assets/fonts/manrope.woff2" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="style.css"><link rel="stylesheet" href="stories.css">
</head>
<body class="story-page">
<a class="skip" href="cases/${id}.html#main">К содержимому</a>
<header class="site-header"><a class="brand-type" href="index.html">ТРИФОТИ<small>ТВОРЧЕСКИЙ КОМБИНАТ</small></a><a class="header-cta" href="index.html#projects">Все проекты <span aria-hidden="true">↗</span></a></header>
<main id="main">
  <section class="story-hero">
    <div class="story-breadcrumb"><a href="index.html#projects">← ПОРТФОЛИО</a><span>ИСТОРИЯ ПРОЕКТА / ${s.number}</span></div>
    <h1>${esc(p.title)}</h1><p class="story-subtitle">${esc(s.subtitle)}</p>
    <dl class="story-facts">${s.facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>
  </section>
  <figure class="story-cover"><img src="${esc(p.media[0].src)}" alt="${esc(p.media[0].caption)}" fetchpriority="high"><figcaption>${esc(p.media[0].caption)}${sourceLink(p.media[0])}</figcaption></figure>
  <section class="story-chapter"><div class="section-label">01 / ЗАМЫСЕЛ</div><div><h2>${esc(s.taskTitle)}</h2><p>${esc(s.task)}</p></div></section>
  <section class="story-process"><div class="section-label">02 / ВОПЛОЩЕНИЕ</div><h2>${esc(s.processTitle)}</h2><ol class="story-steps">${s.steps.map(([title,text],i)=>`<li><span class="step-num">0${i+1}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`).join('')}</ol></section>
  ${media(p,s.processMedia)}
  <section class="story-result"><div class="story-chapter"><div class="section-label">03 / РЕЗУЛЬТАТ</div><div><h2>${esc(s.resultTitle)}</h2><p>${esc(s.result)}</p></div></div>${media(p,s.resultMedia)}</section>
  ${s.detailMedia.length?`<details class="story-detail"><summary>Ещё ракурсы и детали (${s.detailMedia.length})</summary>${media(p,s.detailMedia)}</details>`:''}
  <aside class="story-provenance"><div class="section-label">АВТОРСТВО И КОНТЕКСТ</div><div><p>${esc(s.credit)}</p>${p.sources?.length?`<div class="case-sources">${p.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a>`).join('')}</div>`:''}</div></aside>
  <section class="story-cta"><div><h2>Теперь — ваша идея.</h2><p>Расскажите, какой предмет вы хотите создать.</p></div><a class="button cyan" href="index.html?reference=${id}#brief">Подготовить бриф <span aria-hidden="true">↗</span></a></section>
  <a class="story-next" href="cases/${nextId}.html"><div><img src="${esc(next.media[0].src)}" alt="" loading="lazy"><div><p class="section-label">СЛЕДУЮЩАЯ ИСТОРИЯ</p><h2>${esc(next.title)}</h2></div></div><span aria-hidden="true">↗</span></a>
</main>
<footer><div class="footer-top"><a class="brand-type" href="index.html">ТРИФОТИ</a><a href="index.html#projects">Вернуться к портфолио ↗</a></div></footer>
</body></html>
`;
  fs.writeFileSync(path.join(root,'cases',id+'.html'),html.split('\n').map(line=>line.trimEnd()).join('\n'));
}
console.log(`Built ${ids.length} static project stories.`);
