import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {visiblePortfolioTarget} from '../dist/portfolio-disclosure.js';

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
// Exercise the shipped close handler and its helper, not a parallel implementation.
function fixture({mode='back',source='comparison',open=false}={}){
 const focus=[],scroll=[],listeners=[],tasks=[],document={activeElement:null};let close;
 const node=(id,extra={})=>({id,isConnected:true,hidden:false,dataset:{},parentElement:null,
  closest(){return null},getAttribute(){return null},focus(options){document.activeElement=this;focus.push({id,options})},
  scrollIntoView(options){scroll.push({id,options})},...extra});
 const summary=node('explore-summary'),panel=node('explore',{querySelector:selector=>selector==='summary'?summary:null});
 const card=node('card',{dataset:{project:'mascot'}}),catalog=node('catalog-summary'),outside=node('outside');
 const opener=source==='card'?card:node('comparison-open',{closest:selector=>selector==='.exploration-panel'?panel:null});
 const context={document,visiblePortfolioTarget,projectOpener:null,projectOpenerFallback:null,galleryProject:'mascot',
  projectDialog:{open,addEventListener(type,handler){assert.equal(type,'close');close=handler}},
  photoDetail:{reset(){}},slideRevision:0,clearMediaWait(){},releaseGalleryVideo(){},$$:()=>[],
  caseNavigation:{closed:()=>mode},
  $:selector=>selector==='[data-project="mascot"]'?card:selector==='#all-projects-summary'?catalog:null,
  window:{addEventListener(type,fn,options){listeners.push({type,fn,options})}},setTimeout(fn,delay){assert.equal(delay,0);tasks.push(fn)}};
 vm.createContext(context);
 const start=app.indexOf('function rememberProjectOpener(');
 if(start>=0)vm.runInContext(app.slice(start,app.indexOf('\nfunction showSlide(',start)),context);
 if(context.rememberProjectOpener)context.rememberProjectOpener(opener);else context.projectOpener=opener;
 vm.runInContext(app.split('\n').find(line=>line.startsWith("projectDialog.addEventListener('close'")),context);
 return {context,opener,card,catalog,summary,panel,outside,document,focus,scroll,listeners,tasks,close,
  removeOpener(){opener.isConnected=false;opener.closest=()=>null},
  settle(){for(const entry of listeners.splice(0)){assert.equal(entry.type,'popstate');assert.equal(entry.options.once,true);entry.fn()}for(const fn of tasks.splice(0))fn()}};
}

test('Removing a comparison opener returns to its stable selection summary, not a distant card',()=>{
 const f=fixture();f.removeOpener();f.close();assert.equal(f.document.activeElement,f.summary);assert.equal(f.focus.length,1);
 assert.equal(f.scroll[0].id,'explore-summary');f.settle();assert.equal(f.scroll.at(-1).id,'explore-summary');
});
test('Return waits until the popstate task ends, after native Back scroll restoration',()=>{
 const f=fixture();f.removeOpener();f.close();assert.equal(f.listeners.length,1);assert.equal(f.scroll.length,1);
 f.listeners.shift().fn();assert.equal(f.scroll.length,1);assert.equal(f.tasks.length,1);f.tasks.shift()();assert.equal(f.scroll.length,2);
 assert.equal(f.scroll[1].options.block,'center');assert.equal(f.scroll[1].options.behavior,'instant');
});
test('Unchanged comparison opener keeps native context and avoids extra scrolling',()=>{
 const f=fixture();f.close();assert.equal(f.document.activeElement,f.opener);assert.equal(f.focus[0].options.preventScroll,true);assert.equal(f.listeners.length,0);assert.equal(f.scroll.length,0);
});
test('Unchanged portfolio card is returned to without scrolling the page',()=>{
 const f=fixture({source:'card'});f.close();assert.equal(f.document.activeElement,f.card);assert.equal(f.scroll.length,0);
});
test('A hidden source panel is not chosen as return target',()=>{
 const f=fixture();f.removeOpener();f.summary.hidden=true;f.close();assert.equal(f.document.activeElement,f.card);assert.equal(f.scroll[0].id,'card');
});
test('A filtered card and unavailable opener return to the catalog summary',()=>{
 const f=fixture();f.removeOpener();f.summary.isConnected=false;f.card.hidden=true;f.close();assert.equal(f.document.activeElement,f.catalog);assert.equal(f.scroll[0].id,'catalog-summary');
});
test('A direct-link fallback does not wait for a history event',()=>{
 const f=fixture({mode:'fallback'});f.removeOpener();f.close();assert.equal(f.document.activeElement,f.summary);assert.equal(f.focus[0].options.preventScroll,false);assert.equal(f.listeners.length,0);
});
for(const mode of ['route','reopened'])test(`Navigation-owned or delayed close does not redirect focus: ${mode}`,()=>{
 const f=fixture({mode:mode==='route'?'route':'back',open:mode==='reopened'});f.removeOpener();f.close();assert.equal(f.focus.length,0);assert.equal(f.scroll.length,0);assert.equal(f.listeners.length,0);
});
for(const interruption of ['focus','dialog','hidden','removed'])test(`Late restoration does not override a newer action: ${interruption}`,()=>{
 const f=fixture();f.removeOpener();f.close();const before=f.scroll.length;
 if(interruption==='focus')f.outside.focus();if(interruption==='dialog')f.context.projectDialog.open=true;if(interruption==='hidden')f.summary.hidden=true;if(interruption==='removed')f.summary.isConnected=false;
 f.settle();assert.equal(f.scroll.length,before);
});
test('A new ordinary opener discards the previous exploration fallback',()=>{
 const f=fixture();if(f.context.rememberProjectOpener)f.context.rememberProjectOpener(f.card);else f.context.projectOpener=f.card;
 f.card.isConnected=false;f.close();assert.equal(f.document.activeElement,f.catalog);assert.notEqual(f.document.activeElement,f.summary);
});
test('All opening paths remember their current return context',()=>{
 assert.match(app,/onOpen:\(key,id,opener\)=>\{rememberProjectOpener\(opener\);/);
 assert.match(app,/onOpen:card=>\{rememberProjectOpener\(card\);/);
 assert.match(app,/onOpen:link=>\{rememberProjectOpener\(link\);/);
 assert.match(app,/onFullCase:\(key,id,tile\)=>\{rememberProjectOpener\(tile\);/);
});
