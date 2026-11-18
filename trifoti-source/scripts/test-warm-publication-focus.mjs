import test from 'node:test';
import assert from 'node:assert/strict';
import {publications,publicationCategories} from '../../trifoti/warm/publications-data.js';
import {initializePublicationFilters,sortPublications,publicationCitation} from '../../trifoti/warm/publication-filters.js';

const byId=id=>publications.find(entry=>entry.id===id);

function richFixture(clipboard, beforeInitialize=()=>{}) {
 const node=(extra={})=>({hidden:true,value:'',textContent:'',listeners:{},attributes:{},dataset:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f)},async emit(t,event={}){for(const f of this.listeners[t]||[])await f(event)},setAttribute(k,v){this.attributes[k]=v},focus(options){this.focused=true;this.focusOptions=options;document.activeElement=this},select(){this.selected=true},scrollIntoView(options){this.scrolled=options},...extra});
 const buttons=Object.keys(publicationCategories).map(key=>node({dataset:{publicationFilter:key}}));
 const entries=publications.map(entry=>node({dataset:{publicationCategory:entry.category,publicationId:entry.id}}));
 const links=entries.map(entry=>node({parentElement:entry}));
 const copies=publications.map((entry,i)=>node({dataset:{publicationCopy:entry.id},parentElement:{append(panel){panel.host=entries[i]}}}));
 const summary=node();
 const root=node({dataset:{},open:true,querySelectorAll:s=>s==='[data-publication-category]'?entries:copies,querySelector:()=>summary,contains:t=>copies.includes(t)});
 const nodes={'#publication-catalog':root,'#publication-filters':node({querySelectorAll:()=>buttons})};
 for(const id of ['count','search','sort','reset','list','active','empty','citation','copy-status','copy-label','copy-text','collapse','copy-close','tools','sort-note'])nodes[`#publication-${id}`]=node();
 nodes['#publication-list'].children=[...entries];nodes['#publication-list'].moves=0;nodes['#publication-list'].append=function(el){this.moves++;if(document.activeElement?.parentElement===el)document.activeElement=null;this.children=this.children.filter(x=>x!==el);this.children.push(el)};
 const document={activeElement:null,querySelector:s=>nodes[s]||null};
 beforeInitialize({document,links,entries,list:nodes['#publication-list']});
 initializePublicationFilters({document,clipboard});
 return {root,nodes,buttons,entries,links,copies,summary,document,get:id=>nodes[`#publication-${id}`],copy:i=>{copies[i].focus();return root.emit('click',{target:{closest:()=>copies[i]}})}};
}
for(const index of [0,10,20])test(`Delayed catalogue enhancement preserves the already focused source ${index+1}`,()=>{
 const f=richFixture(undefined,({links})=>links[index].focus());
 assert.equal(f.document.activeElement,f.links[index]);
 assert.equal(f.get('list').moves,0);
 assert.deepEqual(f.get('list').children,f.entries);
 assert.equal(f.root.dataset.enhanced,'true');
});
test('Filtering and searching do not move entries whose order is unchanged',async()=>{
 const f=richFixture();
 await f.buttons.find(x=>x.dataset.publicationFilter==='interviews').emit('click');
 f.get('search').value='Фёдор';await f.get('search').emit('input');
 await f.get('reset').emit('click');
 assert.equal(f.get('list').moves,0);assert.deepEqual(f.get('list').children,f.entries);
});
test('An actual sort is applied once and repeated filtering keeps that order without moving nodes',async()=>{
 const f=richFixture(undefined,({entries,list})=>{entries.reverse();list.children=[...entries]});
 f.get('sort').value='newest';await f.get('sort').emit('change');
 const moves=f.get('list').moves,ordered=[...f.get('list').children];
 assert(moves>0);assert.deepEqual(ordered.map(x=>x.dataset.publicationId),sortPublications([...publications].reverse(),'newest').map(x=>x.id));
 await f.get('sort').emit('change');await f.buttons.find(x=>x.dataset.publicationFilter==='video').emit('click');
 assert.equal(f.get('list').moves,moves);assert.deepEqual(f.get('list').children,ordered);
 await f.get('reset').emit('click');assert.deepEqual(f.get('list').children,f.entries);
});
test('Collapse returns visible focus to native summary without changing search',async()=>{
 const f=richFixture();f.get('search').value='Вести';await f.get('search').emit('input');await f.get('collapse').emit('click');
 assert.equal(f.root.open,false);assert(f.summary.focused);assert.equal(f.summary.scrolled.block,'center');assert.equal(f.summary.scrolled.behavior,'instant');assert.equal(f.get('search').value,'Вести');
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

for(const moveFocus of [false,true])test(`Delayed citation fallback preserves newer focus (${moveFocus?'moved':'trigger retained'})`,async()=>{
 let reject;const f=richFixture({writeText:()=>new Promise((_,r)=>reject=r)});const pending=f.copy(0);
 if(moveFocus)f.get('search').focus();reject(Error('Denied'));await pending;
 assert(!f.get('citation').hidden);assert(!f.get('copy-label').hidden);assert.equal(f.get('copy-text').value,publicationCitation(publications[0]));
 assert.equal(f.document.activeElement,moveFocus?f.get('search'):f.get('copy-text'));assert.equal(!!f.get('copy-text').selected,!moveFocus);
});
test('Successful delayed citation copy never moves newer focus',async()=>{
 let resolve;const f=richFixture({writeText:()=>new Promise(r=>resolve=r)});const pending=f.copy(0);f.get('search').focus();resolve();await pending;
 assert.equal(f.document.activeElement,f.get('search'));assert.equal(f.get('copy-status').textContent,'Описание и ссылка скопированы.');
});
