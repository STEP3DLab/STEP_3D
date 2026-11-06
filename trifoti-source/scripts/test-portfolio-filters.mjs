import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {initializePortfolioFilters} from '../dist/portfolio-filters.js';

function fixture(categories=['sculpture','sculpture','sculpture','sculpture','awards','awards']){
 const node=(dataset={})=>({dataset,hidden:false,textContent:'',attributes:{},events:{},classes:new Set(),
  classList:{toggle(name,value){value?this.owner.classes.add(name):this.owner.classes.delete(name)}},
  setAttribute(key,value){this.attributes[key]=value},getAttribute(key){return this.attributes[key]??null},
  addEventListener(type,listener){(this.events[type]??=[]).push(listener)},
  click(event={button:0}){for(const listener of this.events.click||[])listener(event)},
  focus(){throw new Error('Filtering must not move focus')},scrollIntoView(){throw new Error('Native anchors own scroll')}
 });
 const buttons=['all','sculpture','awards'].map(key=>{
  const button=node({filter:key,direction:{sculpture:'Скульптура',awards:'Сувениры и призы'}[key]});
  button.classList.owner=button;button.badge=node();button.querySelector=selector=>selector==='.filter-count'?button.badge:null;
  button.setAttribute('aria-pressed',String(key==='all'));return button;
 });
 const cards=categories.map((category,index)=>node({category,project:`project-${index}`}));
 const links=['sculpture','awards','all'].map(showProjects=>node({showProjects}));
 const status=node(),empty=node(),emptyBrief=node(),controls=node();controls.hidden=true;
 const root={querySelectorAll:selector=>selector==='button[data-filter]'?buttons:selector==='.project-card[data-category][data-project]'?cards:[]};
 const nodes={projects:root,'portfolio-filters':controls,'filter-status':status,'project-empty':empty,'empty-category-brief':emptyBrief};
 const document={getElementById:id=>nodes[id],querySelectorAll:selector=>selector==='a[data-show-projects]'?links:[]};
 return {document,buttons,cards,links,status,empty,emptyBrief,controls,nodes,visible:()=>cards.filter(card=>!card.hidden),active:()=>buttons.filter(button=>button.getAttribute('aria-pressed')==='true').map(button=>button.dataset.filter)};
}

test('Portfolio starts with all real cards, live counts and no focus or scroll',()=>{
 const f=fixture();initializePortfolioFilters(f);
 assert.equal(f.visible().length,6);assert.deepEqual(f.active(),['all']);assert.equal(f.status.textContent,'6 проектов');assert(f.empty.hidden);
 assert.deepEqual(f.buttons.map(button=>button.badge.textContent),['6','4','2']);
});

test('Services choose the matching collection and all-projects link restores all six',()=>{
 const f=fixture();initializePortfolioFilters(f);
 for(const [key,count,status] of [['sculpture',4,'4 проекта · Скульптура'],['awards',2,'2 проекта · Сувениры и призы'],['all',6,'6 проектов']]){
  const event={button:0,preventDefault(){throw new Error('Do not replace native anchor navigation')}};
  f.links.find(link=>link.dataset.showProjects===key).click(event);
  assert.equal(f.visible().length,count);assert.deepEqual(f.active(),[key]);assert.equal(f.status.textContent,status);assert(f.empty.hidden);
  assert(f.buttons.find(button=>button.dataset.filter===key).classes.has('active'));
 }
});

test('Modified, auxiliary and already-handled links do not change the current collection',()=>{
 const f=fixture();const controller=initializePortfolioFilters(f);controller.select('sculpture');
 for(const event of [{button:1},{button:2},{button:0,metaKey:true},{button:0,ctrlKey:true},{button:0,shiftKey:true},{button:0,altKey:true},{button:0,defaultPrevented:true}]){
  f.links.find(link=>link.dataset.showProjects==='awards').click(event);
  assert.deepEqual(f.active(),['sculpture']);assert.equal(f.visible().length,4);
 }
});

test('Counts come from scoped cards, support multiple categories, and never duplicate one card',()=>{
 const f=fixture(['sculpture awards','sculpture','awards']);const controller=initializePortfolioFilters(f);
 assert.deepEqual(f.buttons.map(button=>button.badge.textContent),['3','2','2']);
 controller.select('awards');assert.deepEqual(f.visible().map(card=>card.dataset.project),['project-0','project-2']);
 controller.select('all');assert.equal(f.visible().length,3);
});

test('Known empty category keeps an honest fallback; invalid key preserves the current state',()=>{
 const f=fixture(['sculpture']);const controller=initializePortfolioFilters(f);
 assert(controller.select('awards'));assert.equal(f.visible().length,0);assert(!f.empty.hidden);assert.equal(f.status.textContent,'0 проектов · Сувениры и призы');
 assert.equal(f.emptyBrief.getAttribute('aria-label'),'Подготовить бриф (Сувениры и призы)');
 assert.equal(controller.select('unknown'),false);assert.deepEqual(f.active(),['awards']);
 controller.select('all');assert(f.empty.hidden);assert.equal(f.status.textContent,'1 проект');
});

test('Count wording handles singular, small plural and teen exceptions',()=>{
 for(const [count,phrase] of [[0,'0 проектов'],[1,'1 проект'],[2,'2 проекта'],[4,'4 проекта'],[5,'5 проектов'],[11,'11 проектов'],[12,'12 проектов'],[21,'21 проект'],[22,'22 проекта']]){
  const f=fixture(Array(count).fill('sculpture'));initializePortfolioFilters(f);assert.equal(f.status.textContent,phrase);
 }
});

test('Repeated initialization preserves the selected filter and does not duplicate listeners',()=>{
 const f=fixture();const first=initializePortfolioFilters(f);first.select('awards');
 assert.equal(initializePortfolioFilters(f),first);assert.deepEqual(f.active(),['awards']);
 assert(f.buttons.every(button=>button.events.click.length===1));assert(f.links.every(link=>link.events.click.length===1));
});

test('Missing optional scaffold leaves the static portfolio untouched',()=>{
 for(const missing of ['projects','filter-status','portfolio-filters']){
  const f=fixture();delete f.nodes[missing];assert.equal(initializePortfolioFilters(f),false);assert.equal(f.visible().length,6);assert(f.controls.hidden);
 }
 const f=fixture();f.buttons.shift();assert.equal(initializePortfolioFilters(f),false);assert.equal(f.visible().length,6);
});

test('URL filters restore on load and Back, preserve other query, hash and history state',()=>{
 const f=fixture(),events={},state={caseToken:'preserve'};let href='https://example.test/trifoti/?review=1&filter=awards#projects';const writes=[];
 const window={location:{get href(){return href}},history:{state,replaceState(value,_,url){assert.equal(value,state);writes.push(url);href=url}},addEventListener:(event,fn)=>events[event]=fn};
 const controller=initializePortfolioFilters({...f,window});assert.deepEqual(f.active(),['awards']);assert.equal(writes.length,0);
 controller.select('sculpture');let url=new URL(href);assert.equal(url.searchParams.get('review'),'1');assert.equal(url.searchParams.get('filter'),'sculpture');assert.equal(url.hash,'#projects');
 controller.select('all');assert.equal(new URL(href).searchParams.has('filter'),false);
 href='https://example.test/trifoti/?filter=awards#projects';events.popstate();assert.equal(f.visible().length,2);assert.equal(writes.length,2);
 href='https://example.test/trifoti/?filter=unknown';events.popstate();assert.equal(f.visible().length,6);
});
test('Filter keyboard wraps, Home/End work and modified keystrokes leave selection unchanged',()=>{
 const f=fixture();let focused=null;for(const b of f.buttons)b.focus=()=>focused=b;initializePortfolioFilters(f);
 const key=(index,key,extra={})=>{let prevented=false;f.buttons[index].events.keydown[0]({key,preventDefault(){prevented=true},...extra});return prevented};
 assert(key(0,'ArrowLeft'));assert.deepEqual(f.active(),['awards']);assert.equal(focused,f.buttons[2]);
 assert(key(2,'Home'));assert.deepEqual(f.active(),['all']);assert(key(0,'End'));assert.deepEqual(f.active(),['awards']);
 assert.equal(key(2,'ArrowLeft',{ctrlKey:true}),false);assert.deepEqual(f.active(),['awards']);assert.equal(key(2,'Tab'),false);
});
test('Reset restores all cards and returns focus before hiding itself',()=>{
 const f=fixture();let focusBeforeHide=false;const reset={hidden:true,addEventListener(k,fn){this[k]=fn}};f.nodes['filter-reset']=reset;
 f.buttons[0].focus=()=>focusBeforeHide=!reset.hidden;const c=initializePortfolioFilters(f);c.select('awards');assert(!reset.hidden);reset.click();assert(focusBeforeHide);assert(reset.hidden);assert.equal(f.visible().length,6);
});


test('Static portfolio hides only inert filter controls and keeps all nine case links without JavaScript',()=>{
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 const row=html.match(/<div class="catalog-filters-row"[^>]*>[\s\S]*?<\/div><\/div>/)?.[0];
 assert(row);assert.match(row,/<div[^>]*id="portfolio-filters"[^>]* hidden>/);
 assert.equal((row.match(/<button\b/g)||[]).length,3);
 assert.doesNotMatch(row,/class="project-card|portfolio-resources/);
 const items=[...html.matchAll(/<article class="project-item"[^>]*>([\s\S]*?)<\/article>/g)];
 assert.equal(items.length,9);
 for(const item of items){
  assert.doesNotMatch(item[0].split('>')[0],/\bhidden\b/);
  const card=item[1].match(/<a\b[^>]*class="project-card[^>]*>/)?.[0];
  assert(card);assert.doesNotMatch(card,/\bhidden\b/);
  const href=card.match(/href="([^"]+)"/)[1];
  assert(existsSync(new URL('../dist/'+href,import.meta.url)),href);
 }
 assert.match(html,/<button[^>]*id="filter-reset"[^>]* hidden>/);
 assert.match(html,/<p id="filter-status"[^>]*>9 проектов<\/p>/);
 assert.match(html,/app\.js\?[^"\n]*filters=20261106-ready/);
 assert.match(readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),/portfolio-filters\.js\?v=20261106-ready/);
});

test('The panel is revealed only after listeners, URL selection and live counts are ready',()=>{
 const f=fixture();let revealed=0;
 Object.defineProperty(f.controls,'hidden',{get:()=>revealed===0,set:value=>{
  assert.equal(value,false);assert(f.buttons.every(button=>button.events.click?.length===1&&button.events.keydown?.length===1));
  assert(f.links.every(link=>link.events.click?.length===1));assert.deepEqual(f.active(),['awards']);assert.equal(f.visible().length,2);
  assert.equal(f.status.textContent,'2 проекта · Сувениры и призы');assert.deepEqual(f.buttons.map(button=>button.badge.textContent),['6','4','2']);revealed++;
 }});
 let popstateReady=false;
 const window={location:{href:'https://example.test/?filter=awards'},addEventListener(type){assert.equal(type,'popstate');assert(f.controls.hidden);popstateReady=true}};
 initializePortfolioFilters({...f,window});assert(popstateReady);assert.equal(revealed,1);
 initializePortfolioFilters({...f,window});assert.equal(revealed,1);
});

function focusFixture(){
 const f=fixture();
 f.cards.forEach(card=>{
  card.selection={};card.wrapper={contains:element=>element===card||element===card.selection};card.closest=()=>card.wrapper;
  let hidden=false;
  Object.defineProperty(card,'hidden',{get:()=>hidden,set:value=>{hidden=value;if(value&&f.document.activeElement===card)f.document.activeElement=null}});
  Object.defineProperty(card.wrapper,'hidden',{get:()=>hidden,set:value=>{hidden=value;if(value&&card.wrapper.contains(f.document.activeElement))f.document.activeElement=null}});
 });
 f.buttons.forEach(button=>button.focus=options=>{assert(!f.controls.hidden);assert.deepEqual(options,{preventScroll:true});f.document.activeElement=button});
 return f;
}

test('Delayed URL enhancement transfers focus only when it hides a card or its selection control',()=>{
 for(const target of ['card','selection']){
  const f=focusFixture();f.document.activeElement=target==='card'?f.cards[0]:f.cards[0].selection;
  initializePortfolioFilters({...f,window:{location:{href:'https://example.test/?filter=awards'},addEventListener(){}}});
  assert.equal(f.document.activeElement,f.buttons[2]);assert(f.cards[0].wrapper.hidden);
 }
 for(const target of ['matching','outside']){
  const f=focusFixture(),active=target==='matching'?f.cards[4]:{};f.document.activeElement=active;
  initializePortfolioFilters({...f,window:{location:{href:'https://example.test/?filter=awards'},addEventListener(){}}});
  assert.equal(f.document.activeElement,active);
 }
});

test('History filtering preserves visible focus and rescues a newly hidden card',()=>{
 const f=focusFixture(),events={};let href='https://example.test/';
 initializePortfolioFilters({...f,window:{location:{get href(){return href}},addEventListener(type,fn){events[type]=fn}}});
 f.document.activeElement=f.cards[0].selection;href='https://example.test/?filter=awards';events.popstate();
 assert.equal(f.document.activeElement,f.buttons[2]);
 f.document.activeElement=f.cards[4];href='https://example.test/';events.popstate();assert.equal(f.document.activeElement,f.cards[4]);
});
