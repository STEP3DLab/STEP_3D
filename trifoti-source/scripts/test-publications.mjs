import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {publications,featuredPublicationIds,publicationCategories} from '../dist/publications-data.js';
import {initializePublicationFilters,publicationMatches,publicationSearchMatches,sortPublications,publicationCitation} from '../dist/publication-filters.js';
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

function richFixture(clipboard) {
 const node=(extra={})=>({hidden:true,value:'',textContent:'',listeners:{},attributes:{},dataset:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},async emit(t,event={}){for(const f of this.listeners[t]||[])await f(event)},setAttribute(k,v){this.attributes[k]=v},focus(options){this.focused=true;this.focusOptions=options},select(){this.selected=true},scrollIntoView(options){this.scrolled=options},...extra});
 const buttons=Object.keys(publicationCategories).map(key=>node({dataset:{publicationFilter:key}}));
 const entries=publications.map(entry=>node({dataset:{publicationCategory:entry.category,publicationId:entry.id}}));
 const copies=publications.map((entry,i)=>node({dataset:{publicationCopy:entry.id},parentElement:{append(panel){panel.host=entries[i]}}}));
 const summary=node();
 const root=node({dataset:{},open:true,querySelectorAll:s=>s==='[data-publication-category]'?entries:copies,querySelector:()=>summary,contains:t=>copies.includes(t)});
 const nodes={'#publication-catalog':root,'#publication-filters':node({querySelectorAll:()=>buttons})};
 for(const id of ['count','search','sort','reset','list','active','empty','citation','copy-status','copy-label','copy-text','collapse','copy-close','tools','sort-note'])nodes[`#publication-${id}`]=node();
 nodes['#publication-list'].children=[];nodes['#publication-list'].append=function(el){this.children=this.children.filter(x=>x!==el);this.children.push(el)};
 const document={querySelector:s=>nodes[s]||null};
 initializePublicationFilters({document,clipboard});
 return {root,nodes,buttons,entries,copies,summary,get:id=>nodes[`#publication-${id}`],copy:i=>root.emit('click',{target:{closest:()=>copies[i]}})};
}
test('Search is case/ё/whitespace tolerant, matches title and publisher only',()=>{
 assert(publicationSearchMatches({title:'Фёдор  Паршин',publisher:'Вести'},' федор ВЕСТИ '));
 assert(!publicationSearchMatches({title:'Фёдор',publisher:'Вести',summary:'Лазарев'},'Лазарев'));
 assert(publicationSearchMatches(publications[0],''));
});
test('Newest sort preserves precision, unknown tail, stable ties and original input',()=>{
 const records=[{id:'unknown',date:null},{id:'year',date:'2025'},{id:'day',date:'2025-06-04'},{id:'month',date:'2025-06'},{id:'day2',date:'2025-06-04'},{id:'older',date:'2024-12-30'}];
 assert.deepEqual(sortPublications(records,'newest').map(x=>x.id),['day','day2','month','year','older','unknown']);
 assert.deepEqual(sortPublications(records,'original'),records);assert.equal(records[0].id,'unknown');
});
for(const category of Object.keys(publicationCategories))for(const query of ['','Лазарев','Вести','НЕСУЩЕСТВУЮЩЕЕ'])test(`Combined category ${category} / search ${query||'empty'} / date order/reset`,async()=>{
 const f=richFixture();f.get('search').value=query;await f.get('search').emit('input');
 await f.buttons.find(x=>x.dataset.publicationFilter===category).emit('click');
 f.get('sort').value='newest';await f.get('sort').emit('change');
 const expected=sortPublications(publications.filter(x=>publicationMatches(x.category,category)&&publicationSearchMatches(x,query)),'newest');
 assert.deepEqual(f.get('list').children.filter(x=>!x.hidden).map(x=>x.dataset.publicationId),expected.map(x=>x.id));
 assert.equal(f.get('empty').hidden,expected.length!==0);
 assert(f.get('active').textContent.includes(publicationCategories[category]));assert(f.get('active').textContent.includes('Сначала новые'));
 await f.get('reset').emit('click');assert(f.entries.every(x=>!x.hidden));assert.equal(f.get('search').value,'');assert.equal(f.get('sort').value,'original');
 assert(f.get('search').focused);assert(f.get('reset').disabled);assert.deepEqual(f.get('list').children.map(x=>x.dataset.publicationId),publications.map(x=>x.id));
});
test('Collapse returns visible focus to native summary without changing search',async()=>{
 const f=richFixture();f.get('search').value='Вести';await f.get('search').emit('input');await f.get('collapse').emit('click');
 assert.equal(f.root.open,false);assert(f.summary.focused);assert.equal(f.summary.scrolled.block,'center');assert.equal(f.summary.scrolled.behavior,'instant');assert.equal(f.get('search').value,'Вести');
 const summaryHTML=section.match(/<summary>[\s\S]*?<\/summary>/)[0];assert.doesNotMatch(summaryHTML,/<(?:button|input|select|a)\b/);
});
test('Citation uses exact metadata/URL and does not invent author or date',()=>{
 for(const entry of publications){const text=publicationCitation(entry);assert(text.includes(entry.title));assert(text.includes(entry.publisher));assert(text.endsWith(entry.url));assert(!text.includes(entry.summary));}
 assert(publicationCitation(byId('P08')).includes('Дата публикации не указана'));assert(publicationCitation({title:'T',publisher:'P',date:'2025',url:'https://example.com'}).includes('Дата публикации: 2025\n'));
});
test('Copy success waits for clipboard resolution; close returns to trigger',async()=>{
 let resolve, written;const f=richFixture({writeText:text=>{written=text;return new Promise(r=>resolve=r)}});
 const pending=f.copy(0);assert.equal(f.get('copy-status').textContent,'Копируем описание источника…');assert.equal(written,publicationCitation(publications[0]));
 resolve();await pending;assert.equal(f.get('copy-status').textContent,'Описание и ссылка скопированы.');assert(f.get('copy-label').hidden);
 await f.get('copy-close').emit('click');assert(f.get('citation').hidden);assert(f.copies[0].focused);
});
for(const clipboard of [undefined,{writeText:async()=>{throw new Error('Denied')}}])test(`Unavailable/denied clipboard exposes selectable exact text ${!!clipboard}`,async()=>{
 const f=richFixture(clipboard);await f.copy(0);assert(!f.get('copy-label').hidden);assert(f.get('copy-text').focused&&f.get('copy-text').selected);assert.equal(f.get('copy-text').value,publicationCitation(publications[0]));assert.match(f.get('copy-status').textContent,/недоступно/);
});
test('Late clipboard rejection after reset or collapse never focuses hidden text',async()=>{
 for(const action of ['reset','collapse']){let reject;const f=richFixture({writeText:()=>new Promise((_,r)=>reject=r)});const pending=f.copy(0);
 await f.get(action).emit('click');if(action==='collapse')await f.root.emit('toggle');reject(new Error('Denied'));await pending;assert(f.get('citation').hidden);assert(!f.get('copy-text').focused);}
});
test('More recent copy request wins over earlier asynchronous completion',async()=>{
 const pending=[];const f=richFixture({writeText:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))});const first=f.copy(0), second=f.copy(1);
 pending[1].resolve();await second;pending[0].reject(new Error('late'));await first;assert.equal(f.get('copy-status').textContent,'Описание и ссылка скопированы.');assert.equal(f.get('copy-text').value,publicationCitation(publications[1]));assert(!f.get('copy-text').focused);
});
