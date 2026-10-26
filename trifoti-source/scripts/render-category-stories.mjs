import {readFileSync,writeFileSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
import {storyCategories,categoryCount} from '../dist/category-stories-data.js';
import {escapeHtml as e} from './render-publications.mjs';
const file=new URL('../dist/index.html',import.meta.url);
export function categoryMarkup(){return `<div class="category-stories" aria-label="Истории по направлениям">${storyCategories.map(category=>{const cover=projects[category.cover]?.media[0];return `
    <a class="category-story-tile ${cover?'has-photo':'is-intro'}" data-story-category="${category.id}" href="${cover?'catalog.html#catalog-'+category.cover:'#'+category.service}"><span class="category-tile-art ${cover?'':'category-art-'+category.id}" aria-hidden="true">${cover?`<img src="${cover.poster||cover.src}" alt="" width="${category.id==='awards'?1536:1280}" height="${category.id==='awards'?1152:1280}" loading="lazy" decoding="async">`:'<i></i><i></i>'}</span><span class="category-tile-cta">${cover?'Смотреть':'О направлении'} <span aria-hidden="true">→</span></span><div class="category-tile-copy"><h3>${e(category.title)}</h3><span class="category-tile-count">${cover?categoryCount(category):'Пока нет проектов'}</span></div></a>`}).join('')}
  </div>`}
export function newCards(){return ['feather-award','vmeste-prize','two-figure-composition'].map(key=>{const p=projects[key],m=p.media[0],category=p.direction==='Скульптура'?'sculpture':'awards';return `    <article class="project-item" data-card="${key}"><a href="cases/${key}.html" class="project-card real-project" data-category="${category}" data-project="${key}"><div class="project-visual"><span class="project-tag">${e(p.direction)}</span><img src="${m.src}" alt="${e(m.caption)}" width="${key==='vmeste-prize'?720:1280}" height="${key==='vmeste-prize'?1280:720}" loading="lazy" decoding="async"><span class="media-count">${p.media.length} фото</span><span class="project-open-label">Смотреть проект</span><span class="project-arrow"><span class="direction-icon" aria-hidden="true"></span></span></div><div class="project-title"><h3>${e(p.title)}</h3><span>${e(p.type)}</span><p class="project-teaser">${e(p.description)}</p></div></a><button type="button" class="selection-button" data-selection="${key}" hidden>+ В подборку</button></article>`}).join('\n')}
let html=readFileSync(file,'utf8');
const replace=(name,body)=>{html=html.replace(new RegExp(`<!-- ${name}:start -->[\\s\\S]*?<!-- ${name}:end -->`),`<!-- ${name}:start -->\n${body}\n  <!-- ${name}:end -->`)};
replace('category-stories',categoryMarkup());replace('new-photo-cards',newCards());
html=html.replace(/(id="all-projects-summary">)Все проекты и подробные кейсы · \d+/,`$1Все проекты и подробные кейсы · ${Object.keys(projects).length}`);
html=html.replace(/(id="filter-status"[^>]*>)\d+ проектов/,`$1${Object.keys(projects).length} проектов`);
for(const [id,count] of [['all',Object.keys(projects).length],...storyCategories.map(category=>[category.id,category.keys.length])])html=html.replace(new RegExp(`(data-filter="${id}"[^>]*>[^<]*<span class="filter-count">)\\d+`),`$1${count}`);
if(process.argv.includes('--check')){if(html!==readFileSync(file,'utf8'))throw Error('Run node scripts/render-category-stories.mjs')}else writeFileSync(file,html);
console.log('Category tiles and new photo cards match shared project data.');
