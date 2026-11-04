import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects, projectOrder } from '../project-data.js';
import { stories } from '../project-stories.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://step3dlab.github.io/STEP_3D/trifoti-blue/';
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const pad = n => String(n).padStart(2, '0');
const poster = item => item.poster || item.src;
function versioned(asset) {
  const hash = createHash('sha256').update(fs.readFileSync(path.join(root, asset))).digest('hex');
  return asset + '?v=' + hash.slice(0, 10);
}
const styles = versioned('stories.css');
const viewerScript = versioned('case-viewer.js');

function figure(item, cover = false) {
  const caption = esc(item.caption);
  const picture = item.type === 'video'
    ? `<video controls playsinline preload="none" poster="${esc(item.poster)}" aria-label="${caption}"><source src="${esc(item.src)}" type="video/mp4">Ваш браузер не поддерживает видео.</video>`
    : `<a class="enlarge" href="${esc(item.src)}" aria-label="Увеличить фото. ${caption}"><img src="${esc(item.src)}" alt="${caption}" ${cover ? 'fetchpriority="high"' : 'loading="lazy"'}><span aria-hidden="true">⤢</span></a>`;
  return `<figure${cover ? ' class="dossier-cover"' : ''}>${picture}<figcaption>${caption} <a class="original-photo" href="${esc(item.originalPhoto)}" target="_blank" rel="noopener">Исходный кадр ↗</a></figcaption></figure>`;
}

function gallery(project, indices) {
  if (!indices.length) return '';
  return `<div class="story-media ${indices.length === 1 ? 'single' : ''}">${indices.map(i => figure(project.media[i])).join('\n')}</div>`;
}

function chapters(project, story) {
  if (!story) {
    const rest = project.media.slice(1).map((_, i) => i + 1);
    return rest.length ? `<section class="dossier-gallery"><div class="section-label">ГАЛЕРЕЯ ПРОЕКТА</div><h2>Ракурсы и детали</h2>${gallery(project, rest)}</section>` : '';
  }
  return `<section class="story-chapter"><div class="section-label">01 / ЗАМЫСЕЛ</div><div><h2>${esc(story.taskTitle)}</h2><p>${esc(story.task)}</p></div></section>
  <section class="story-process"><div class="section-label">02 / ВОПЛОЩЕНИЕ</div><h2>${esc(story.processTitle)}</h2><ol class="story-steps">${story.steps.map(([title,text],i)=>`<li><span class="step-num">${pad(i+1)}</span><h3>${esc(title)}</h3><p>${esc(text)}</p></li>`).join('')}</ol></section>
  ${gallery(project, story.processMedia)}
  <section class="story-result"><div class="story-chapter"><div class="section-label">03 / РЕЗУЛЬТАТ</div><div><h2>${esc(story.resultTitle)}</h2><p>${esc(story.result)}</p></div></div>${gallery(project, story.resultMedia)}</section>
  ${story.detailMedia.length ? `<details class="story-detail"><summary>Ещё ракурсы и детали (${story.detailMedia.length})</summary>${gallery(project, story.detailMedia)}</details>` : ''}`;
}

for (const [index,id] of projectOrder.entries()) {
  const p = projects[id], s = stories[id];
  const nextId = projectOrder[(index+1) % projectOrder.length], next = projects[nextId];
  const canonical = base + 'cases/' + id + '.html';
  const description = s?.summary || p.description;
  const credit = s?.credit || p.attribution || 'Из портфолио творческого объединения ТРИФОТИ.';
  const html = `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="../">
  <title>${esc(p.title)} · ТРИФОТИ</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#092d50">
  <link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="article"><meta property="og:locale" content="ru_RU">
  <meta property="og:title" content="${esc(p.title)} — ТРИФОТИ"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${base}${esc(poster(p.media[0]))}">
  <link rel="icon" href="assets/favicon.svg"><link rel="preload" as="font" href="assets/fonts/manrope.woff2" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="style.css"><link rel="stylesheet" href="${styles}"><script defer src="${viewerScript}"></script>
</head>
<body class="story-page">
<a class="skip" href="cases/${id}.html#main">К содержимому</a>
<header class="site-header"><a class="brand" href="index.html" aria-label="ТРИФОТИ — на главную"><span class="brand-mark"><img src="assets/logo-original.jpg" alt="" width="1536" height="1258"></span><span class="brand-type">ТРИФОТИ<small>ТВОРЧЕСКИЙ КОМБИНАТ</small></span></a><a class="header-cta" href="index.html#projects">Все проекты <span aria-hidden="true">↗</span></a></header>
<main id="main">
  <section class="dossier" aria-labelledby="case-heading">
    <div class="dossier-intro"><div class="dossier-number">ПОРТФОЛИО <span></span> ${pad(index+1)} / ${pad(projectOrder.length)}</div>
      <p class="dossier-type">${esc(p.type)}</p><h1 id="case-heading">${esc(p.title)}</h1><p class="dossier-deck">${esc(s ? s.summary : p.description)}</p>
      ${s ? `<dl class="story-facts">${s.facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>` : `<div class="dossier-tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`}
    </div>
    ${figure(p.media[0],true)}
  </section>
  ${chapters(p,s)}
  <aside class="story-provenance"><div class="section-label">АВТОРСТВО И КОНТЕКСТ</div><div><p>${esc(credit)}</p>${p.sources?.length ? `<div class="case-sources">${p.sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)} ↗</a>`).join('')}</div>` : ''}</div></aside>
  <section class="story-cta"><div><h2>Обсудим ваш проект?</h2><p>Эта работа будет указана в брифе как пример.</p></div><a class="button cyan" href="index.html?reference=${id}#brief">Подготовить бриф <span aria-hidden="true">↗</span></a></section>
  <a class="story-next" href="cases/${nextId}.html"><div><img src="${esc(poster(next.media[0]))}" alt="" loading="lazy"><div><p class="section-label">СЛЕДУЮЩИЙ ПРОЕКТ</p><h2>${esc(next.title)}</h2></div></div><span aria-hidden="true">→</span></a>
</main>
<footer><div class="footer-top"><a class="brand-type" href="index.html">ТРИФОТИ</a><a href="index.html#projects">Вернуться к портфолио ↗</a></div></footer>
<dialog class="photo-viewer" aria-label="Увеличенная фотография"><div class="viewer-bar"><span>ТРИФОТИ / ГАЛЕРЕЯ</span><button type="button" data-dismiss autofocus>Закрыть ×</button></div><img alt="">
<div class="viewer-foot"><p aria-live="polite"></p><div class="viewer-controls"><button type="button" data-previous aria-label="Предыдущая фотография">←</button><span></span><button type="button" data-next aria-label="Следующая фотография">→</button></div></div></dialog>
</body></html>
`;
  fs.writeFileSync(path.join(root, 'cases', id + '.html'), html);
}
console.log(`Built ${projectOrder.length} project pages.`);
