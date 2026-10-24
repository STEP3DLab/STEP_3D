import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {currentSection,revealService,initializeSectionNavigation} from '../dist/section-navigation.js';
const file=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
function fixture(hash=''){
 const listeners={},frames=[],elements={};
 const on=(target,type,fn)=>{(listeners[target+type]??=[]).push(fn)};
 const emit=(target,type,event={})=>(listeners[target+type]||[]).forEach(fn=>fn(event));
 for(const id of ['projects','directions','process','studio','journal'])elements[id]={id,rect:{top:1000,bottom:2000},getBoundingClientRect(){return this.rect}};
 for(const id of ['design','sculpture','everyday','awards'])elements['service-'+id]={tagName:'DETAILS',open:id==='design'};
 const links=Object.keys(elements).slice(0,5).map(id=>({attrs:{href:'#'+id},getAttribute(k){return this.attrs[k]},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]}}));
 const document={body:{},getElementById:id=>elements[id],querySelectorAll:()=>links,querySelector:()=>({getBoundingClientRect:()=>({bottom:74})}),addEventListener:(type,fn)=>on('d',type,fn)};
 const window={innerHeight:800,location:{hash},requestAnimationFrame:fn=>frames.push(fn),addEventListener:(type,fn,options)=>{on('w',type,fn);if(type==='scroll')assert.equal(options.passive,true)}};
 const controller=initializeSectionNavigation({document,window});
 return {elements,links,window,document,controller,emit,frames,flush(){while(frames.length)frames.shift()()},active(){return links.filter(x=>x.attrs['aria-current']).map(x=>x.attrs.href)}};
}
test('Reading-line selection follows geometry, not nav order; clears outside sections',()=>{
 const sections=[{id:'directions',top:500,bottom:800},{id:'projects',top:80,bottom:500}];
 assert.equal(currentSection(sections,90),'projects');assert.equal(currentSection(sections,500),'directions');
 for(const line of [0,801,1000])assert.equal(currentSection(sections,line),null);
});
test('All initial service hashes open only their target, preserving design',()=>{
 for(const id of ['design','sculpture','everyday','awards']){const f=fixture('#service-'+id);assert(f.elements['service-'+id].open);assert(f.elements['service-design'].open)}
});
test('Invalid and non-details targets are ignored',()=>{
 const f=fixture();for(const hash of ['#project/mascot','#service-nope','#service-%61wards','#service-awards?x','#contact',''])assert.equal(revealService(hash,f.document),false);
 f.elements['service-awards'].tagName='DIV';assert.equal(revealService('#service-awards',f.document),false);
});
test('Hashchange, back-forward and bfcache reopen a target without closing others',()=>{
 const f=fixture();for(const type of ['hashchange','popstate','pageshow']){f.window.location.hash='#service-sculpture';f.elements['service-sculpture'].open=false;f.emit('w',type);assert(f.elements['service-sculpture'].open);assert(f.elements['service-design'].open)}
});
test('Same-hash click reopens manually closed service and preserves native behavior',()=>{
 const f=fixture('#service-awards');f.elements['service-awards'].open=false;
 const event={target:{closest:()=>({getAttribute:()=> '#service-awards'})},button:0};f.emit('d','click',event);assert(f.elements['service-awards'].open);assert.equal(event.defaultPrevented,undefined);
 for(const modifier of ['ctrlKey','metaKey','shiftKey','altKey','defaultPrevented']){f.elements['service-awards'].open=false;f.emit('d','click',{...event,[modifier]:true});assert(!f.elements['service-awards'].open)}
});
test('Scroll batches frames, selects one current location and clears footer',()=>{
 const f=fixture();f.elements.projects.rect={top:50,bottom:400};f.flush();assert.deepEqual(f.active(),['#projects']);
 f.elements.projects.rect={top:-500,bottom:50};f.elements.directions.rect={top:50,bottom:600};
 for(let i=0;i<10;i++)f.emit('w','scroll');assert.equal(f.frames.length,1);f.flush();assert.deepEqual(f.active(),['#directions']);
 f.elements.directions.rect={top:-600,bottom:-50};f.emit('w','scroll');f.flush();assert.deepEqual(f.active(),[]);
});
test('Resize, load and disclosure recalculate without focus/scroll/history/storage side effects',()=>{
 const f=fixture();f.flush();for(const [target,event] of [['w','resize'],['w','load'],['d','toggle']]){f.elements.studio.rect={top:0,bottom:500};f.emit(target,event);f.flush();assert.deepEqual(f.active(),['#studio'])}
 assert.doesNotMatch(file('section-navigation.js'),/\.focus\(|scrollTo|scrollIntoView|pushState|replaceState|fetch\(|localStorage|sessionStorage|setInterval/);
});
test('Visual current location has underline and accessible red; mobile footer targets are scoped',()=>{
 const css=file('style.css');assert.match(css,/\.header nav a\[aria-current="location"\]\{[^}]*color:var\(--red-text\)[^}]*text-decoration:underline/);
 assert.match(css,/@media\(max-width:800px\)\{\.site-footer \.footer-column a\{display:flex;align-items:center;min-height:44px;width:100%;padding:10px 0\}/);
 assert.match(css,/\.site-footer \.footer-top\{display:inline-flex;align-items:center;min-height:44px;min-width:44px/);
 assert.match(css,/\.site-footer \.footer-column a\{[^}]*overflow-wrap:anywhere/);
});
test('All brief routes name local preparation instead of conversation or sending',()=>{
 const html=file('index.html'),links=[...html.matchAll(/<a\b[^>]*href="#(?:contact|brief-form)"[^>]*>[\s\S]*?<\/a>/g)].map(x=>x[0]);
 assert.equal(links.length,11);for(const link of links){assert.match(link,/бриф|Бриф/);assert.doesNotMatch(link,/Обсудить|познакомимся|отправить/i)}
 assert.match(html,/mobile-label">Бриф<\/span>/);assert.match(html,/aria-label="Подготовить бриф для скачивания, без отправки"/);
 assert.match(file('app.js'),/id="case-contact">Подготовить бриф по примеру/);
});
