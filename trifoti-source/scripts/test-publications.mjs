import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publications,featuredPublicationIds,publicationCategories} from '../dist/publications-data.js';
import {initializePublicationFilters,publicationMatches} from '../dist/publication-filters.js';
import {renderPublications,publicationDate,escapeHtml} from './render-publications.mjs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const section=renderPublications();
const counts={all:21,interviews:5,articles:9,catalogs:4,video:3};
const byId=id=>publications.find(entry=>entry.id===id);

test('Curated catalogue contains 21 unique verified pages and six distinct highlights',()=>{
 assert.equal(publications.length,21);assert.equal(new Set(publications.map(x=>x.id)).size,21);
 assert.equal(new Set(publications.map(x=>x.url)).size,21);
 assert.equal(featuredPublicationIds.length,6);assert.equal(new Set(featuredPublicationIds).size,6);
 for(const id of featuredPublicationIds)assert(byId(id));
 for(const id of ['P13','P18','P21','P22','P23','P24','P25','P26','P27','video-04','video-05'])assert(!byId(id),id);
});
test('All sources use HTTPS and only the declared publication categories',()=>{
 for(const entry of publications){
  const url=new URL(entry.url);assert.equal(url.protocol,'https:');assert(!url.username&&!url.password);
  assert(Object.hasOwn(publicationCategories,entry.category));assert.notEqual(entry.category,'all');
  assert(entry.publisher&&entry.title&&entry.kind&&entry.summary);assert(entry.summary.length<250);
  assert(entry.date===null||/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(entry.date));
 }
});
test('Date display preserves year/month precision and does not invent dates',()=>{
 assert.equal(publicationDate('2025'),'2025');assert.equal(publicationDate('2019-10'),'октябрь 2019');
 assert.equal(publicationDate('2020-06-04'),'4 июня 2020');assert.equal(publicationDate(null),'Дата не указана');
 assert.equal(byId('P08').date,null);assert.equal(byId('P20').date,null);
 assert(section.includes('<span>2025</span>'));assert(!section.includes('datetime="2025-01-01"'));
});
test('Annotations retain the important attribution and project-status qualifications',()=>{
 assert.match(byId('P09').summary,/Елизавета Молчанова/);assert.match(byId('P09').note,/не с Фёдором/);
 assert.match(byId('P17').summary,/Победителем стал другой проект/);
 assert.match(byId('P12').note,/не о завершённой установке/);
 assert.match(byId('P04').summary,/не об установленном монументе/);
 assert.match(byId('video-01').summary,/с отцом/);assert.match(byId('video-03').note,/Доступность внешнего видеоплеера/);
 assert(!featuredPublicationIds.includes('video-03'));
});
test('Static HTML exactly matches the portable source data',()=>{
 assert(html.includes(section));assert.equal((section.match(/data-publication-highlight=/g)||[]).length,6);
 assert.equal((section.match(/data-publication-id=/g)||[]).length,21);
 assert(html.includes('href="#publications">Публикации и интервью'));
});
test('Publication links are safe, explicit and present without JavaScript',()=>{
 const anchors=[...section.matchAll(/<a\b([^>]*)>/g)];assert.equal(anchors.length,27);
 for(const [,attrs] of anchors){assert(attrs.includes('href="https://'));assert(attrs.includes('target="_blank"'));assert(attrs.includes('rel="noopener noreferrer"'));}
 assert(section.includes('<details class="publication-catalog"'));assert(section.includes('id="publication-filters" role="group" aria-label="Тип публикации" hidden'));
 assert(!/<li[^>]*\bhidden/.test(section));assert(section.includes('а не полный список всех публикаций'));
 assert(section.includes('role="status" aria-atomic="true"'));
});
test('Press section adds no remote images, players, copied media or storage',()=>{
 assert.doesNotMatch(section,/<(?:img|iframe|video|audio|script)\b/i);
 const helper=readFileSync(new URL('../dist/publication-filters.js',import.meta.url),'utf8');
 assert.doesNotMatch(helper,/localStorage|sessionStorage|fetch\(|XMLHttpRequest|cookie/);
 assert(app.indexOf("import('./publication-filters.js?")>app.indexOf('caseNavigation.sync();'));
 assert(app.includes("if(filters)filters.hidden=true"));assert(app.includes("entry=>entry.hidden=false"));
});
test('Renderer escapes untrusted text and attribute delimiters',()=>{
 assert.equal(escapeHtml('<a "x" & \'y\'>'),'&lt;a &quot;x&quot; &amp; &#39;y&#39;&gt;');
});

function fixture(){
 const buttons=Object.keys(publicationCategories).map(key=>({dataset:{publicationFilter:key},attributes:{},listeners:[],setAttribute(k,v){this.attributes[k]=v},addEventListener(type,fn){this.listeners.push(fn)},click(){this.listeners.forEach(fn=>fn())}}));
 const entries=publications.map(entry=>({dataset:{publicationCategory:entry.category},hidden:false}));
 const root={dataset:{},querySelectorAll:()=>entries};
 const controls={hidden:true,querySelectorAll:()=>buttons};
 const status={textContent:''};
 const nodes={'#publication-catalog':root,'#publication-filters':controls,'#publication-count':status};
 const document={querySelector:selector=>nodes[selector]||null};
 return {buttons,entries,root,controls,status,document,nodes};
}
for(const [key,count] of Object.entries(counts))test(`Catalogue ${key} filter shows ${count} sources without changing link data`,()=>{
 const f=fixture();assert(initializePublicationFilters(f));f.buttons.find(b=>b.dataset.publicationFilter===key).click();
 assert.equal(f.entries.filter(e=>!e.hidden).length,count);assert.equal(f.status.textContent,`Показано: ${count} из 21.`);
 assert.equal(f.buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1);
 assert.equal(f.buttons.find(b=>b.attributes['aria-pressed']==='true').dataset.publicationFilter,key);
 assert.equal(f.controls.hidden,false);
 f.entries.forEach(e=>assert.equal(!e.hidden,publicationMatches(e.dataset.publicationCategory,key)));
});
test('Catalogue initialization is idempotent and preserves an active filter',()=>{
 const f=fixture();initializePublicationFilters(f);f.buttons.find(b=>b.dataset.publicationFilter==='video').click();
 initializePublicationFilters(f);assert(f.buttons.every(b=>b.listeners.length===1));assert.equal(f.status.textContent,'Показано: 3 из 21.');
});
for(const missing of ['#publication-catalog','#publication-filters','#publication-count'])test(`Missing optional ${missing} leaves static sources available`,()=>{
 const f=fixture();delete f.nodes[missing];assert.equal(initializePublicationFilters(f),false);assert(f.entries.every(e=>!e.hidden));assert(f.controls.hidden);
});
test('Malformed optional filter group stays unenhanced',()=>{
 const f=fixture();f.buttons.shift();assert.equal(initializePublicationFilters(f),false);assert(f.entries.every(e=>!e.hidden));assert(f.controls.hidden);
});
