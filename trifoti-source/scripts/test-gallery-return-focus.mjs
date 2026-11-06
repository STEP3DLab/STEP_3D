import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {visiblePortfolioTarget} from '../dist/portfolio-disclosure.js';
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
// The actual close handler and viewport guard, not a parallel implementation.
function fixture({mode='back',source='comparison',open=false}={}){
 const focus=[],scroll=[],document={activeElement:null},window={innerHeight:756,location:{hash:'#project/mascot'}},listeners=[];let close;
 for(const owner of [document,window]){
  owner.addEventListener=(type,fn,options)=>listeners.push({owner,type,fn,options});
  owner.removeEventListener=(type,fn)=>{const i=listeners.findIndex(e=>e.owner===owner&&e.type===type&&e.fn===fn);if(i>=0)listeners.splice(i,1)};
 }
 const emit=(owner,type)=>{for(const e of [...listeners])if(e.owner===owner&&e.type===type)e.fn()};
 const node=(id,extra={})=>({id,isConnected:true,hidden:false,dataset:{},parentElement:null,bounds:{top:300,bottom:346},
  closest(){return null},getAttribute(){return null},getBoundingClientRect(){return this.bounds},
  focus(options){document.activeElement=this;focus.push({id,options});emit(document,'focusin')},
  scrollIntoView(options){scroll.push({id,options});this.bounds={top:300,bottom:346}},...extra});
 const summary=node('explore-summary'),panel=node('explore',{querySelector:selector=>selector==='summary'?summary:null});
 const card=node('card',{dataset:{project:'mascot'}}),catalog=node('catalog-summary'),outside=node('outside');
 const opener=source==='card'?card:node('comparison-open',{closest:selector=>selector==='.exploration-panel'?panel:null});
 document.querySelector=()=>({getBoundingClientRect:()=>({bottom:92})});
 const context={document,window,visiblePortfolioTarget,cancelProjectReturn:()=>{},projectOpener:null,projectOpenerFallback:null,galleryProject:'mascot',
  projectDialog:{open,addEventListener(type,handler){assert.equal(type,'close');close=handler}},
  photoDetail:{reset(){}},slideRevision:0,clearMediaWait(){},releaseGalleryVideo(){},$$:()=>[],caseNavigation:{closed:()=>mode},
  $:selector=>selector==='[data-project="mascot"]'?card:selector==='#all-projects-summary'?catalog:null};
 vm.createContext(context);const start=app.indexOf('function rememberProjectOpener(');
 vm.runInContext(app.slice(start,app.indexOf('\nfunction showSlide(',start)),context);context.rememberProjectOpener(opener);
 vm.runInContext(app.split('\n').find(line=>line.startsWith("projectDialog.addEventListener('close'")),context);
 return {context,opener,card,catalog,summary,panel,outside,document,window,focus,scroll,listeners,close,
  emitWindow:type=>emit(window,type),emitDocument:type=>emit(document,type),
  removeOpener(){opener.isConnected=false;opener.closest=()=>null},
  displace(target=summary,bounds={top:-1000,bottom:-954}){target.bounds=bounds;emit(window,'scroll')},
  returned(){window.location.hash='#explore/pink';emit(window,'popstate');emit(window,'hashchange')}};
}

test('Removed comparison opener returns to stable panel, not distant catalog card',()=>{
 const f=fixture();f.removeOpener();f.close();assert.equal(f.document.activeElement,f.summary);assert.equal(f.focus.length,1);assert.equal(f.scroll[0].id,'explore-summary');
});
test('Late and repeated native restoration is corrected after the Back event pair',()=>{
 const f=fixture();f.removeOpener();f.close();f.returned();assert.equal(f.scroll.length,1);
 for(let i=0;i<3;i++){f.displace();assert.equal(f.scroll.length,2+i);assert.equal(f.summary.bounds.top,300)}
 assert.equal(f.document.activeElement,f.summary);assert.equal(f.focus.length,1);
});
test('Corrective scroll events are no-ops while the target is already visible',()=>{
 const f=fixture();f.removeOpener();f.close();for(let i=0;i<5;i++)f.emitWindow('scroll');assert.equal(f.scroll.length,1);
});
test('Hidden behind sticky header or below viewport is revealed instantly',()=>{
 for(const bounds of [{top:0,bottom:46},{top:900,bottom:946}]){const f=fixture();f.removeOpener();f.close();f.displace(f.summary,bounds);assert.equal(f.scroll.length,2);assert.equal(f.scroll[1].options.block,'center');assert.equal(f.scroll[1].options.behavior,'instant')}
});
for(const source of ['comparison','card'])test(`Unchanged opener retains focus without a scroll guard: ${source}`,()=>{
 const f=fixture({source});f.close();assert.equal(f.document.activeElement,f.opener);assert.equal(f.focus[0].options.preventScroll,true);assert.equal(f.listeners.length,0);assert.equal(f.scroll.length,0);
});
test('Unavailable panel or filtered card falls back to a visible catalog destination',()=>{
 const f=fixture();f.removeOpener();f.summary.hidden=true;f.card.hidden=true;f.close();assert.equal(f.document.activeElement,f.catalog);assert.equal(f.scroll[0].id,'catalog-summary');
});
test('Direct-link fallback is revealed without requiring a Back event',()=>{
 const f=fixture({mode:'fallback'});f.removeOpener();f.close();assert.equal(f.document.activeElement,f.summary);assert.equal(f.focus[0].options.preventScroll,false);f.displace();assert.equal(f.scroll.length,2);
});
for(const mode of ['route','reopened'])test(`Route-owned and delayed close do not redirect focus: ${mode}`,()=>{
 const f=fixture({mode:mode==='route'?'route':'back',open:mode==='reopened'});f.removeOpener();f.close();assert.equal(f.focus.length,0);assert.equal(f.listeners.length,0);
});
for(const input of ['keydown','wheel','touchstart','pointerdown'])test(`User intent cancels the guard before scrolling: ${input}`,()=>{
 const f=fixture();f.removeOpener();f.close();const listener=f.listeners.find(e=>e.owner===f.document&&e.type===input);assert.equal(listener.options.capture,true);assert.equal(listener.options.passive,true);
 f.emitDocument(input);assert.equal(f.listeners.length,0);f.displace();assert.equal(f.scroll.length,1);
});
for(const interruption of ['focus','dialog','hidden','removed'])test(`New state suppresses late viewport correction: ${interruption}`,()=>{
 const f=fixture();f.removeOpener();f.close();
 if(interruption==='focus')f.outside.focus();if(interruption==='dialog')f.context.projectDialog.open=true;if(interruption==='hidden')f.summary.hidden=true;if(interruption==='removed')f.summary.isConnected=false;
 f.displace();assert.equal(f.scroll.length,1);assert.equal(f.listeners.length,0);
});
for(const event of ['blur','pagehide'])test(`Leaving the page cleans up the temporary guard: ${event}`,()=>{
 const f=fixture();f.removeOpener();f.close();f.emitWindow(event);assert.equal(f.listeners.length,0);
});
test('A later Back cancels the guard, while its original event pair does not',()=>{
 const f=fixture();f.removeOpener();f.close();f.returned();assert(f.listeners.length);f.emitWindow('popstate');assert.equal(f.listeners.length,0);
});
test('A subsequent hash destination cancels the guard',()=>{
 const f=fixture();f.removeOpener();f.close();f.returned();f.window.location.hash='#directions';f.emitWindow('hashchange');assert.equal(f.listeners.length,0);
});
test('New explicit opening removes listeners and resets the old fallback',()=>{
 const f=fixture();f.removeOpener();f.close();f.context.rememberProjectOpener(f.card);assert.equal(f.listeners.length,0);assert.equal(f.context.projectOpenerFallback,null);
 f.card.isConnected=false;f.close();assert.equal(f.document.activeElement,f.catalog);
});
test('All opening paths remember current return context and cache key is refreshed',()=>{
 for(const [entry,arg] of [['onOpen:(key,id,opener)','opener'],['onOpen:card','card'],['onOpen:link','link'],['onFullCase:(key,id,tile)','tile']])assert(app.includes(entry+'=>{rememberProjectOpener('+arg+');'));
 assert.match(readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),/return=20261106-visible-return/);
 assert.doesNotMatch(app.slice(app.indexOf('function restoreProjectFocus'),app.indexOf('function showSlide')),/setTimeout|requestAnimationFrame|scrollRestoration\s*=/);
});
