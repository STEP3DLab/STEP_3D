import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {publications,featuredPublicationIds,publicationCategories} from '../dist/publications-data.js';

export const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const monthNames = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'];
export function publicationDate(date) {
  if (!date) return 'Дата не указана';
  const [year, month, day] = date.split('-');
  if (!month) return year;
  return day ? `${Number(day)} ${months[Number(month)-1]} ${year}` : `${monthNames[Number(month)-1]} ${year}`;
}
const dateMarkup = date => date?.length > 4 ? `<time datetime="${escapeHtml(date)}">${publicationDate(date)}</time>` : `<span>${publicationDate(date)}</span>`;
const noteMarkup = entry => entry.note ? `<p class="publication-note">${escapeHtml(entry.note)}</p>` : '';
const externalAttrs = entry => `href="${escapeHtml(entry.url)}" target="_blank" rel="noopener noreferrer"`;
const actionLabel = entry => entry.format === 'video-page' ? 'Видео на сайте издания' : entry.format === 'pdf' ? 'Открыть PDF' : 'Читать у источника';

export function renderPublications() {
  const featured = featuredPublicationIds.map(id => publications.find(entry => entry.id === id));
  return `<!-- publications:start -->
  <section class="publications-block section-anchor" id="publications" aria-labelledby="publications-title">
    <div class="publications-heading"><div><p class="eyebrow">Фёдор Паршин / скульптор</p><h3 id="publications-title">Публикации<br><span class="red">и интервью</span></h3></div><p>Разговоры о скульптуре, репортажи и публикации о работах Фёдора Паршина. Подборка проверенных источников, а не полный список всех публикаций.</p></div>
    <div class="publication-highlights">${featured.map((entry,index) => `
      <article class="publication-card" data-publication-highlight="${entry.id}"><div class="publication-card-top"><span class="publication-kind">${escapeHtml(entry.kind)}</span><span aria-hidden="true">0${index+1}</span></div><p class="publication-source">${escapeHtml(entry.publisher)} · ${dateMarkup(entry.date)}</p><h4>${escapeHtml(entry.title)}</h4><p class="publication-summary">${escapeHtml(entry.summary)}</p><a class="text-link" ${externalAttrs(entry)} aria-label="${escapeHtml(actionLabel(entry)+' ('+entry.title+') — новая вкладка')}">${escapeHtml(actionLabel(entry))}<span aria-hidden="true"> ↗</span></a></article>`).join('')}
    </div>
    <details class="publication-catalog" id="publication-catalog"><summary><span>Каталог материалов</span><span class="publication-total">${publications.length} источник</span></summary><p class="publication-intro">Интервью, статьи, каталоги и видео. Ссылки открываются в новой вкладке на сайтах изданий или в электронной копии выпуска; тексты и медиа остаются у источников.</p><div class="publication-filters" id="publication-filters" role="group" aria-label="Тип публикации" hidden>${Object.entries(publicationCategories).map(([key,label])=>`<button type="button" data-publication-filter="${key}" aria-pressed="${key==='all'}" aria-controls="publication-list">${escapeHtml(label)}</button>`).join('')}</div><p class="publication-count" id="publication-count" role="status" aria-atomic="true">Показано: ${publications.length} из ${publications.length}.</p><ul class="publication-list" id="publication-list">${publications.map(entry => `
      <li class="publication-entry" data-publication-id="${entry.id}" data-publication-category="${entry.category}"><article><div class="publication-meta"><span>${escapeHtml(entry.kind)}</span>${dateMarkup(entry.date)}</div><p class="publication-source">${escapeHtml(entry.publisher)}</p><h4><a ${externalAttrs(entry)}>${escapeHtml(entry.title)}<span class="sr-only"> — ${escapeHtml(entry.publisher)}, новая вкладка</span></a></h4><p class="publication-summary">${escapeHtml(entry.summary)}</p>${noteMarkup(entry)}</article></li>`).join('')}
    </ul></details>
  </section>
  <!-- publications:end -->`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const path = new URL('../dist/index.html', import.meta.url);
  const html = readFileSync(path,'utf8');
  const section = /<!-- publications:start -->[\s\S]*?<!-- publications:end -->/;
  if (!section.test(html)) throw new Error('Publication markers missing');
  const rendered = html.replace(section,renderPublications());
  if (process.argv.includes('--check')) {
    if (rendered !== html) throw new Error('Run npm run build:publications to update the static catalogue');
    console.log(`Static publications verified: ${publications.length} sources, ${featuredPublicationIds.length} highlights.`);
  } else writeFileSync(path,rendered);
}
