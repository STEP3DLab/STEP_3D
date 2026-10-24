import test from 'node:test';
import assert from 'node:assert/strict';
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
  const button=node({filter:key,direction:{sculpture:'Скульптура',awards:'Сувениры, призы, награды'}[key]});
  button.classList.owner=button;button.badge=node();button.querySelector=selector=>selector==='.filter-count'?button.badge:null;
  button.setAttribute('aria-pressed',String(key==='all'));return button;
 });
 const cards=categories.map((category,index)=>node({category,project:`project-${index}`}));
 const links=['sculpture','awards','all'].map(showProjects=>node({showProjects}));
 const status=node(),empty=node(),emptyBrief=node();
 const root={querySelectorAll:selector=>selector==='button[data-filter]'?buttons:selector==='.project-card[data-category][data-project]'?cards:[]};
 const nodes={projects:root,'filter-status':status,'project-empty':empty,'empty-category-brief':emptyBrief};
 const document={getElementById:id=>nodes[id],querySelectorAll:selector=>selector==='a[data-show-projects]'?links:[]};
 return {document,buttons,cards,links,status,empty,emptyBrief,nodes,visible:()=>cards.filter(card=>!card.hidden),active:()=>buttons.filter(button=>button.getAttribute('aria-pressed')==='true').map(button=>button.dataset.filter)};
}

test('Portfolio starts with all real cards, live counts and no focus or scroll',()=>{
 const f=fixture();initializePortfolioFilters(f);
 assert.equal(f.visible().length,6);assert.deepEqual(f.active(),['all']);assert.equal(f.status.textContent,'6 проектов');assert(f.empty.hidden);
 assert.deepEqual(f.buttons.map(button=>button.badge.textContent),['6','4','2']);
});

test('Services choose the matching collection and all-projects link restores all six',()=>{
 const f=fixture();initializePortfolioFilters(f);
 for(const [key,count,status] of [['sculpture',4,'4 проекта · Скульптура'],['awards',2,'2 проекта · Сувениры, призы, награды'],['all',6,'6 проектов']]){
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
 assert(controller.select('awards'));assert.equal(f.visible().length,0);assert(!f.empty.hidden);assert.equal(f.status.textContent,'0 проектов · Сувениры, призы, награды');
 assert.equal(f.emptyBrief.getAttribute('aria-label'),'Подготовить бриф (Сувениры, призы, награды)');
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
 for(const missing of ['projects','filter-status']){
  const f=fixture();delete f.nodes[missing];assert.equal(initializePortfolioFilters(f),false);assert.equal(f.visible().length,6);
 }
 const f=fixture();f.buttons.shift();assert.equal(initializePortfolioFilters(f),false);assert.equal(f.visible().length,6);
});
