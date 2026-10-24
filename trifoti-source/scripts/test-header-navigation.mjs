import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeHeaderNavigation} from '../dist/header-navigation.js';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const code=readFileSync(new URL('../dist/header-navigation.js',import.meta.url),'utf8');

function fixture(desktop=false){
 const listeners=new Map();
 const document={activeElement:null};
 const on=(target,type,fn)=>{const key=target+':'+type;listeners.set(key,[...(listeners.get(key)||[]),fn]);};
 const emit=(target,type,props={})=>{const event={type,target:elements[target],...props};for(const fn of listeners.get(target+':'+type)||[])fn(event);return event;};
 function element(id,parent=null){return {id,parent,attrs:{},classes:new Set(),focusOptions:null,
  setAttribute(key,value){this.attrs[key]=value},getAttribute(key){return this.attrs[key]},
  addEventListener(type,fn){on(id,type,fn)},contains(other){while(other){if(other===this)return true;other=other.parent;}return false},
  closest(selector){return selector==='.header'&&header.contains(this)?header:null},
  focus(options){document.activeElement=this;this.focusOptions=options},
  classList:{add(name){elements[id].classes.add(name)},toggle(name,active){const classes=elements[id].classes;active?classes.add(name):classes.delete(name)}}};}
 const header=element('header');const menu=element('menu',header);const nav=element('nav',header);
 const links=Array.from({length:5},(_,i)=>element('link'+i,nav));
 const brand=element('brand',header),cta=element('cta',header),hero=element('hero');
 const elements={header,menu,nav,brand,cta,hero,...Object.fromEntries(links.map(x=>[x.id,x]))};
 nav.querySelector=selector=>selector==='a[href]'?links[0]:null;
 header.querySelector=selector=>({'.menu-button':menu,'#navigation':nav}[selector]);
 header.querySelectorAll=selector=>{assert.equal(selector,'a');return [brand,...links,cta]};
 menu.attrs={'aria-expanded':'false','aria-label':'Открыть меню'};
 document.querySelector=selector=>{assert.equal(selector,'.header');return header};
 document.addEventListener=(type,fn)=>on('document',type,fn);
 const media={matches:desktop,addEventListener(type,fn){assert.equal(type,'change');on('media',type,fn)}};
 const window={matchMedia:query=>{assert.equal(query,'(min-width: 801px)');return media}};
 initializeHeaderNavigation({document,window});
 return {elements,document,media,links,listeners,emit,resize(matches){media.matches=matches;emit('media','change')},
  open(){menu.focus();emit('menu','click')},expanded(){return menu.attrs['aria-expanded']==='true'}};
}

test('The disclosure button precedes all five links in native DOM order; desktop hides only the trigger',()=>{
 const header=html.match(/<header class="header">([\s\S]*?)<\/header>/)[1];
 assert(header.indexOf('brand-full')<header.indexOf('class="menu-button"'));
 assert(header.indexOf('class="menu-button"')<header.indexOf('<nav id="navigation"'));
 assert(header.indexOf('</nav>')<header.indexOf('header-cta'));
 assert.equal((header.match(/<nav[\s\S]*?<\/nav>/)[0].match(/<a href=/g)||[]).length,5);
 assert.match(css,/\.menu-button\{display:none/);
 assert.match(css,/\.header nav\{order:1\}\.header-cta\{order:2\}\.menu-button\{order:3\}/);
});
test('Opening and closing keep native button focus and truthful accessible state for keyboard and pointer clicks',()=>{
 for(const detail of [0,1]){const f=fixture();const {menu,nav}=f.elements;menu.focus();f.emit('menu','click',{detail});
 assert(f.expanded());assert(nav.classes.has('open'));assert.equal(menu.attrs['aria-label'],'Закрыть меню');assert.equal(f.document.activeElement,menu);
 f.emit('menu','click',{detail});assert(!f.expanded());assert(!nav.classes.has('open'));assert.equal(menu.attrs['aria-label'],'Открыть меню');}
});
test('Escape closes from every nav link and returns focus to the visible trigger',()=>{
 for(let i=0;i<5;i++){const f=fixture();f.open();f.links[i].focus();f.emit('document','keydown',{key:'Escape'});
 assert(!f.expanded());assert.equal(f.document.activeElement,f.elements.menu);}
});
test('Closed-menu Escape and all Tab/Shift+Tab events remain native without focus trapping',()=>{
 const f=fixture();f.elements.hero.focus();f.emit('document','keydown',{key:'Escape'});assert.equal(f.document.activeElement,f.elements.hero);
 f.open();for(const shiftKey of [false,true]){f.links[2].focus();f.emit('document','keydown',{key:'Tab',shiftKey,preventDefault(){assert.fail('Tab must stay native')}});assert.equal(f.document.activeElement,f.links[2]);assert(f.expanded());}
 assert(!code.includes('preventDefault'));assert(!code.includes('setTimeout'));
});
test('Focus can move throughout the header, then exits without being pulled back',()=>{
 const f=fixture();f.open();for(const target of [f.links[0],f.links[4],f.elements.cta,f.elements.menu,f.elements.brand]){target.focus();f.emit('header','focusout',{relatedTarget:target});assert(f.expanded());}
 f.elements.hero.focus();f.emit('header','focusout',{relatedTarget:f.elements.hero});assert(!f.expanded());assert.equal(f.document.activeElement,f.elements.hero);
});
test('A temporarily unknown focus destination does not hide the currently focused link',()=>{
 const f=fixture();f.open();f.links[2].focus();f.emit('header','focusout',{relatedTarget:null});assert(f.expanded());assert.equal(f.document.activeElement,f.links[2]);
});
test('All header links and outside pointer clicks still close without invented focus changes',()=>{
 const f=fixture();for(const target of [f.elements.brand,...f.links,f.elements.cta]){f.open();target.focus();f.emit(target.id,'click');assert(!f.expanded());assert.equal(f.document.activeElement,target);}
 f.open();f.emit('document','click',{target:f.elements.menu});assert(f.expanded());f.emit('document','click',{target:f.elements.hero});assert(!f.expanded());
});
test('Desktop-to-mobile collapse rescues focus from every newly hidden nav link',()=>{
 for(let i=0;i<5;i++){const f=fixture(true);f.links[i].focus();f.resize(false);assert(!f.expanded());assert.equal(f.document.activeElement,f.elements.menu);assert.equal(f.elements.menu.focusOptions.preventScroll,true);}
});
test('Mobile-to-desktop expansion rescues only a newly hidden menu trigger',()=>{
 const f=fixture();f.open();f.resize(true);assert(!f.expanded());assert.equal(f.document.activeElement,f.links[0]);assert.equal(f.links[0].focusOptions.preventScroll,true);
});
test('Resize preserves focus on visible links, CTA, brand and unrelated page controls',()=>{
 for(const target of ['brand','cta','hero']){for(const desktop of [false,true]){const f=fixture(desktop);f.elements[target].focus();f.resize(!desktop);assert.equal(f.document.activeElement,f.elements[target]);}}
 for(let i=0;i<5;i++){const f=fixture();f.open();f.links[i].focus();f.resize(true);assert.equal(f.document.activeElement,f.links[i]);assert(!f.expanded());}
});
test('Repeated breakpoint changes reset open state without duplicate listeners or asynchronous focus work',()=>{
 const f=fixture();assert.equal(f.listeners.get('media:change').length,1);for(let i=0;i<8;i++){f.open();f.resize(true);f.resize(false);assert(!f.expanded());assert.equal(f.document.activeElement,f.elements.menu);}
 assert(!/scrollIntoView|requestAnimationFrame|prefers-reduced-motion/.test(code));
});
