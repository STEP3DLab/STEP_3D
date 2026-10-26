import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {projects} from '../dist/project-data.js';
import {mediaId,exactLink} from '../dist/exploration-data.js';
import {referenceBlock,referenceParts,appendSelectionReference,removeCaseReference,mountReferenceManager} from '../dist/reference-manager.js';
import {mountPhotoDetail} from '../dist/gallery-photo-detail.js';
import {mountExploration} from '../dist/exploration-panel.js';
import {mountVisualStories} from '../dist/visual-stories.js';
import {bindSelectionButton,mountSelectionSummary,selectionReturnTarget} from '../dist/selection-controls.js';
import {optionalModule} from '../dist/optional-module.js';
import {viewContext,modeLinks,lightContext,staticContext} from '../dist/view-context.js';
import {initializeStaticContext} from '../dist/static-case-context.js';
import {initializeLightView} from '../dist/light-view.js';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
class Node{
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.attrs={};this.dataset={};this.listeners={};this.style={};this.hidden=false;this.disabled=false;this.checked=false;this.open=false;this.value='';this.textContent='';this.className='';this.scrollLeft=this.scrollTop=0;this.clientWidth=600;this.clientHeight=400;this.scrollWidth=900;this.scrollHeight=600;this.classList={toggle:(name,force)=>{const set=new Set(this.className.split(' '));if(force)set.add(name);else set.delete(name);this.className=[...set].join(' ')}};}
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node)}}
 replaceChildren(...nodes){for(const n of this.children)n.parent=null;this.children=[];this.append(...nodes)}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null}
 setAttribute(k,v){this.attrs[k]=String(v)} removeAttribute(k){delete this.attrs[k];if(k==='src')delete this.src}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)} removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(f=>f!==fn)}
 emit(type,event={}){const e={target:this,button:0,preventDefault(){this.defaultPrevented=true},stopPropagation(){this.stopped=true},...event};for(const fn of [...(this.listeners[type]||[])])fn(e);return e}
 focus(){this.doc.activeElement=this} select(){this.selected=true} scrollIntoView(){this.scrolled=true} scrollBy({left,top}){this.scrollLeft+=left;this.scrollTop+=top} pause(){this.paused=true} load(){this.loaded=true}
 contains(n){return n===this||this.children.some(c=>c.contains(n))}
 matches(s){if(s[0]==='#')return this.id===s.slice(1);if(s[0]==='.')return this.className.split(' ').includes(s.slice(1));if(s[0]==='['){const [,name,value]=s.match(/^\[([^=\]]+)(?:="([^"]+)")?\]$/)||[];if(!name)return false;const k=name.replace(/^data-/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return name.startsWith('data-')?k in this.dataset&&(value===undefined||this.dataset[k]===value):name in this.attrs&&(value===undefined||this.attrs[name]===value)}return this.tagName===s.toUpperCase()}
 querySelectorAll(s){return this.children.flatMap(c=>[...(c.matches(s)?[c]:[]),...c.querySelectorAll(s)])} querySelector(s){return this.querySelectorAll(s)[0]||null}
 closest(s){for(let n=this;n;n=n.parent)if(s.split(',').some(p=>n.matches(p.trim())))return n;return null}
}
function fixture(hash='#projects'){
 const listeners={},document={activeElement:null,readyState:'complete',createElement:tag=>new Node(tag,document),createTextNode:text=>Object.assign(new Node('text',document),{textContent:text}),addEventListener(type,fn){(listeners[type]??=[]).push(fn)}};
 const host=document.createElement('main');document.querySelector=s=>host.querySelector(s);document.querySelectorAll=s=>host.querySelectorAll(s);document.getElementById=id=>host.querySelector('#'+id);
 const location={hash,href:'https://example.test/index.html'+hash,pathname:'/index.html',search:''};const history={entries:[],state:null,pushState(state,_,url){this.entries.push(url);this.state=state;location.hash=new URL(url,location.href).hash},replaceState(state,_,url){this.state=state;location.hash=new URL(url,location.href).hash}};
 const window={location,history,addEventListener(type,fn){(listeners[type]??=[]).push(fn)}};document.defaultView=window;
 const all=()=>[host,...host.querySelectorAll('*')];const find=text=>{const visit=n=>n.textContent===text?n:n.children.map(visit).find(Boolean);return visit(host)};
 return {document,window,location,history,host,find,el:document.createElement,emit(type,event={}){for(const fn of listeners[type]||[])fn(event)}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('Reference addition from a case preserves old prose, existing cases and every character',()=>{
 const legacy='Мой текст\n\n  абзац <script>не HTML</script>\n\n';const one=appendSelectionReference(legacy,['stdAwards']);const two=appendSelectionReference(one.value,['mascot']);
 assert(two.value.startsWith(legacy));assert(two.value.includes(referenceBlock('stdAwards')));assert(two.value.includes(referenceBlock('mascot')));
 assert.deepEqual(appendSelectionReference(two.value,['stdAwards','mascot']),{value:two.value,added:0});
 assert.equal(removeCaseReference(removeCaseReference(two.value,'mascot'),'stdAwards'),legacy);
});
test('Old title-only references deduplicate and remain independently removable after appending',()=>{
 const current=projects.mascot.title;assert.equal(appendSelectionReference(current,['mascot']).added,0);const added=appendSelectionReference(current,['pink']);assert.deepEqual(referenceParts(added.value).map(p=>p.key),['mascot','pink']);assert.equal(removeCaseReference(added.value,'pink'),current);
});
test('Unknown reference text and lookalike URLs never become removable case blocks',()=>{
 const value='Свой '+projects.mascot.title+'\n'+exactLink('mascot')+'\nкомментарий';assert(referenceParts(value).every(p=>p.key===null));assert.equal(removeCaseReference(value,'mascot'),value);assert.equal(removeCaseReference(value,null),value);
});
test('Reference length is checked atomically at 6000 with no truncation or partial multi-add',()=>{
 const block=referenceBlock('pink'),at='x'.repeat(6000-block.length-2);assert.equal(appendSelectionReference(at,['pink']).value.length,6000);const over=at+'x';assert.deepEqual(appendSelectionReference(over,['pink']),{value:over,added:0,tooLong:true});assert.equal(appendSelectionReference(at,['pink','mascot']).value,at);
});
test('Reference UI removes one case without clearing legacy prose, idea or other case',()=>{
 const f=fixture(),field={value:appendSelectionReference('не трогать\n\nабзац',['mascot','pink']).value};let changed=0;
 mountReferenceManager({host:f.host,field,document:f.document,onChange:()=>changed++,focusFallback:f.el('input')});
 const remove=f.host.querySelectorAll('button').find(n=>n.attrs['aria-label']==='Убрать из брифа: '+projects.mascot.title);remove.emit('click');assert.equal(changed,1);assert(field.value.includes('не трогать\n\nабзац'));assert(field.value.includes(referenceBlock('pink')));assert(!field.value.includes(referenceBlock('mascot')));assert(f.host.contains(f.document.activeElement));
});
test('Legacy text deletion is explicit, cancelable and never rewrites data merely by rendering',()=>{
 const f=fixture(),field={value:'  Необработанный текст\n\nпоследний абзац  '},initial=field.value;let changed=0;
 mountReferenceManager({host:f.host,field,document:f.document,onChange:()=>changed++,focusFallback:f.el('input')});
 assert.equal(field.value,initial);const remove=f.find('Убрать сохранённый текст');remove.emit('click');assert.equal(field.value,initial);f.find('Отмена').emit('click');assert.equal(field.value,initial);remove.emit('click');remove.emit('click');assert.equal(field.value,'');assert.equal(changed,1);assert.equal(f.host.hidden,true);
});
function exploration(hash='#projects',extra={}){const f=fixture(hash),opened=[];const controller=mountExploration({host:f.host,document:f.document,location:f.location,history:f.history,onOpen:(...a)=>opened.push(a),...extra});return {...f,controller,opened}}
test('Exactly one task pane is exposed; switching retains original comparison node and frame',async()=>{
 const f=exploration('#explore/mascot,pink',{loadStories:async()=>({mountVisualStories})});const first=f.host.querySelector('img');f.host.querySelectorAll('button').find(n=>n.attrs['aria-label']==='Следующий ракурс: '+projects.mascot.title).emit('click');const source=first.src;
 for(const name of ['Визуальные истории','Атлас кадров','Подборка и сравнение']){f.find(name).emit('click');await tick();assert.equal(['selection','stories','atlas'].filter(id=>!f.document.getElementById('explore-'+id).hidden).length,1)}
 assert.equal(first.src,source);assert(f.host.contains(first));assert.equal(f.location.hash,'#explore/mascot,pink');
});
test('Optional story import rejection is local: selection, comparison and case open still work',async()=>{
 let loads=0;const f=exploration('#explore/mascot,pink',{loadStories:async()=>{loads++;throw Error('injected network failure')}});
 f.find('Визуальные истории').emit('click');await tick();assert(f.find('Открыть статический каталог всех кейсов'));
 f.find('Подборка и сравнение').emit('click');f.find('Открыть этот ракурс').emit('click');assert.equal(f.opened.length,1);f.controller.toggle('gesture');assert.equal(f.controller.getSelected().length,3);
 f.find('Визуальные истории').emit('click');await tick();assert.equal(loads,1);assert.equal(f.location.hash,'#explore/mascot,pink,gesture');
});
test('Synchronous optional initializer failure cleans its partial pane without losing selected cases',async()=>{
 const f=exploration('#explore/mascot,pink',{loadStories:async()=>({mountVisualStories({host,document}){host.append(document.createElement('video'));throw Error('injected render failure')}})});f.find('Атлас кадров').emit('click');await tick();assert.equal(f.host.querySelectorAll('video').length,0);assert.deepEqual(f.controller.getSelected(),['mascot','pink']);assert(f.find('Открыть статический каталог всех кейсов'));
});
test('Optional loader runs and mounts once even with concurrent clicks and rejected result',async()=>{
 for(const failure of [false,true]){let loads=0,mounts=0,errors=0;const start=optionalModule({load:async()=>{loads++;if(failure)throw Error('fail');return 1},mount:()=>mounts++,onError:()=>errors++});await Promise.all([start(),start(),start()]);await start();assert.equal(loads,1);assert.equal(mounts,failure?0:1);assert.equal(errors,failure?1:0)}
});
test('Card and case buttons share max-three state without moving focus or navigating away from modal',()=>{
 const f=exploration(),buttons=[];for(const key of ['mascot','pink','gesture','stdAwards','mascot']){const button=f.el('button');f.host.append(button);bindSelectionButton({button,key,controller:f.controller,status:f.el('p')});buttons.push(button)}
 buttons[0].focus();buttons[0].emit('click');assert.equal(f.document.activeElement,buttons[0]);assert.equal(buttons[4].attrs['aria-pressed'],'true');buttons[1].emit('click');buttons[2].emit('click');buttons[3].emit('click');assert.equal(buttons[3].attrs['aria-pressed'],'false');assert.equal(f.controller.getSelected().length,3);
 f.location.hash='#project/mascot/media/white-side';buttons[4].focus();buttons[4].emit('click');assert.equal(f.location.hash,'#project/mascot/media/white-side');assert.equal(f.document.activeElement,buttons[4]);assert.equal(buttons[0].attrs['aria-pressed'],'false');
 f.location.hash='#explore/mascot,pink,gesture';f.controller.sync();assert.equal(f.location.hash,'#explore/pink,gesture');assert.deepEqual(f.controller.getSelected(),['pink','gesture']);
});
test('Compact summary is absent when empty, removes one item and opens comparison deliberately',()=>{
 const f=exploration(),host=f.el('div');f.host.append(host);const {region}=mountSelectionSummary({host,document:f.document,controller:f.controller});assert.equal(region.hidden,true);f.controller.toggle('mascot');f.controller.toggle('pink');assert.equal(region.hidden,false);assert.equal(region.querySelectorAll('li').length,2);region.querySelector('button').emit('click');assert.deepEqual(f.controller.getSelected(),['pink']);assert(region.contains(f.document.activeElement));region.querySelectorAll('button').at(-1).emit('click');assert.equal(f.document.getElementById('explore-selection').hidden,false);
});
function zoom(){const f=fixture(),viewer=f.el('div'),host=f.el('div'),image=f.el('img');image.naturalWidth=1200;image.naturalHeight=800;viewer.append(image);f.host.append(viewer,host);const controller=mountPhotoDetail({viewer,host,document:f.document});controller.setItem(image,projects.pink.media[0]);return {...f,viewer,image,controller}}
test('Photo zoom uses the same original, bounded dimensions and explicit pan/fit without changing route',()=>{
 const f=zoom();f.image.src='same-original.webp';f.find('Рассмотреть +').emit('click');assert.equal(f.controller.isZoomed(),true);assert.equal(f.image.style.width,'900px');assert.equal(f.image.src,'same-original.webp');const before=f.viewer.scrollLeft;f.host.querySelectorAll('button').find(n=>n.attrs['aria-label']==='Сдвинуть просмотр вправо').emit('click');assert.equal(f.viewer.scrollLeft,before+80);for(let i=0;i<20;i++)f.find('Рассмотреть +').emit('click');assert.equal(f.image.style.width,'2400px');f.find('Вписать').emit('click');assert.equal(f.controller.isZoomed(),false);assert.equal(f.image.style.width,'');assert.equal(f.location.hash,'#projects');
});
test('First Escape fits the photo and keeps dialog open; second is left to native dismissal',()=>{
 const f=zoom();f.find('Рассмотреть +').emit('click');const event=()=>({key:'Escape',target:f.viewer,preventDefault(){this.defaultPrevented=true},stopPropagation(){this.stopped=true}});const first=event();assert.equal(f.controller.key(first),true);assert.equal(first.defaultPrevented,true);const second=event();assert.equal(f.controller.key(second),false);assert.equal(second.defaultPrevented,undefined);
});
test('Zoom keyboard pans only inside inspection; browser shortcuts and unrelated controls are untouched',()=>{
 const f=zoom();f.find('Рассмотреть +').emit('click');for(const extra of [{ctrlKey:true},{metaKey:true},{altKey:true},{shiftKey:true},{target:f.el('input')}])assert.equal(f.controller.key({key:'ArrowRight',target:f.viewer,...extra}),false);let prevented=false;assert.equal(f.controller.key({key:'ArrowRight',target:f.viewer,preventDefault(){prevented=true}}),true);assert(prevented);
});
test('Changing frame or switching to video clears zoom, hides photo controls and never autoplays',()=>{
 const f=zoom();f.find('Рассмотреть +').emit('click');const second=f.el('img');second.naturalWidth=800;second.naturalHeight=1200;f.viewer.replaceChildren(second);f.controller.setItem(second,projects.pink.media[1]);assert.equal(f.controller.isZoomed(),false);assert.equal(second.style.width,'');f.find('Рассмотреть +').focus();const video=f.el('video');f.controller.setItem(video,{type:'video'});assert.equal(f.host.querySelector('.photo-detail').hidden,true);assert.equal(f.document.activeElement,f.viewer);assert.equal(video.autoplay,undefined);
});
for(const [key,p] of Object.entries(projects))test('Context round-trip across all three modes: '+key,()=>{for(const item of p.media){const id=mediaId(item),links=modeLinks(key,id),context={key,id};assert.deepEqual(lightContext(new URL(links.light,'https://test/').hash),context);assert.deepEqual(staticContext(key,new URL(links.static,'https://test/').hash),context);assert.equal(links.modal,'index.html#project/'+key+'/media/'+id);assert(!Object.values(links).some(url=>url.includes('?')))}});
test('Context parsers reject unknown IDs and safe-fallback invalid frames without arbitrary URL text',()=>{
 for(const key of ['__proto__','constructor','missing','<script>']){assert.equal(viewContext(key,'x'),null);assert.deepEqual(modeLinks(key,'secret'),{modal:'index.html#projects',light:'light.html',static:'catalog.html'})}
 assert.equal(lightContext('#project/mascot/media/%3Cscript%3E'),null);assert.equal(viewContext('mascot','secret').id,'white-front');assert.equal(staticContext('pink','#private-note').id,mediaId(projects.pink.media[0]));
});
test('Static header switches retain incoming frame and respond to history without media loading',()=>{
 const f=fixture('#media-red-head'),page=f.el('main');page.dataset.staticCase='mascot';f.host.append(page);for(const mode of ['modal','light']){const link=f.el('a');link.dataset.viewMode=mode;page.append(link)}initializeStaticContext(f);assert.equal(page.children[0].href,'../index.html#project/mascot/media/red-head');f.location.hash='#media-white-side';f.emit('hashchange');assert.equal(page.children[1].href,'../light.html#project/mascot/media/white-side');assert.equal(page.querySelectorAll('img').length,0);
});
test('Light mode enters exact frame, keeps outgoing modes synchronized and restores hash without autoplay',()=>{
 const f=fixture('#project/mascot/media/red-head');for(const id of ['light-posters','light-mode']){const n=f.el('div');n.id=id;f.host.append(n)}const card=f.el('article');card.dataset.lightCase='mascot';const gallery=f.el('div');gallery.dataset.lightGallery='';card.append(gallery);for(const mode of ['modal','static']){const link=f.el('a');link.dataset.viewMode=mode;card.append(link)}f.host.append(card);const controller=initializeLightView(f);assert.equal(card.querySelector('[data-view-mode="modal"]').href,'index.html#project/mascot/media/red-head');assert.equal(card.querySelectorAll('img').length,0);const next=card.querySelectorAll('button').find(n=>n.attrs['aria-label']==='Следующий кадр: '+projects.mascot.title);next.emit('click');assert.equal(f.location.hash,'#project/mascot/media/red-edition');assert.equal(card.querySelector('[data-view-mode="static"]').href,'cases/mascot.html#media-red-edition');f.location.hash='#project/mascot/media/clay-turntable';controller.sync(false);assert.equal(card.querySelectorAll('video').length,0);
});
test('Static per-frame switches remain native no-JavaScript paths for all 25 media',()=>{for(const [key,p] of Object.entries(projects)){const html=read('cases/'+key+'.html');for(const item of p.media){assert(html.includes('href="../index.html#project/'+key+'/media/'+mediaId(item)+'"'));assert(html.includes('id="media-'+mediaId(item)+'"'))}}});
test('Cards expose sibling selection buttons, not nested links, and remain native static fallbacks',()=>{
 const html=read('index.html');assert.equal((html.match(/class="project-item"/g)||[]).length,Object.keys(projects).length);for(const match of html.matchAll(/<a href="cases\/[^>]+>(.*?)<\/a>/gs))assert.doesNotMatch(match[1],/<button/);assert.equal((html.match(/data-selection="[^"]+" hidden/g)||[]).length,Object.keys(projects).length);
});
test('Hero primary action precedes bear in DOM and mobile layout never crops original stage',()=>{const html=read('index.html'),hero=html.slice(html.indexOf('class="hero section-anchor"'),html.indexOf('id="projects"'));assert(hero.indexOf('hero-actions')<hero.indexOf('id="bear-stage"'));assert.equal((hero.match(/Посмотреть проекты/g)||[]).length,1);assert.match(read('style.css'),/\.bear-stage video,\.bear-stage img\{object-fit:contain\}/);assert.doesNotMatch(read('style.css'),/touch-action:none/)});
test('Critical app import graph excludes stories, exploration and preparation failures',()=>{const app=read('app.js');const statics=[...app.matchAll(/^import .*? from ['"]([^'"]+)/gm)].map(m=>m[1]);assert(!statics.some(p=>/visual-stories|exploration-panel|brief-preparation|selection-controls/.test(p)));assert.doesNotMatch(read('exploration-panel.js'),/^import .*from.*visual-stories/m);assert(app.indexOf("$('#brief-save').disabled=false")<app.indexOf("load:()=>import('./brief-preparation"));assert(app.indexOf("optionalModule({load:()=>Promise.all([import('./exploration-panel")<app.indexOf('caseNavigation.sync();'));});
test('Independent brief guard prevents native submission even with the main module absent',()=>{
 let handler,prevented=0;vm.runInNewContext(read('brief-guard.js'),{document:{getElementById:id=>{assert.equal(id,'brief-form');return {addEventListener(type,fn){assert.equal(type,'submit');handler=fn}}}}});handler({preventDefault(){prevented++}});assert.equal(prevented,1);assert.match(read('index.html'),/<script defer src="brief-guard.js\?v=20261026-seven"><\/script>/);
});
test('New modules add no persistent storage, network API, personal field or automatic media play',()=>{for(const file of ['reference-manager.js','gallery-photo-detail.js','selection-controls.js','view-context.js','static-case-context.js','optional-module.js','brief-guard.js'])assert.doesNotMatch(read(file),/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|\.submit\(|\.play\(|\.name\s*=/);assert.equal((read('index.html').match(/\bname="(?:reference|name|direction|idea|budget|deadline)"/g)||[]).length,6)});

test('Removing the last filtered-out selection targets the visible active filter, not a hidden card',()=>{const activeFilter={},hiddenCard={hidden:false,closest:()=>({hidden:true})},visibleCard={hidden:false,closest:()=>null};let card=hiddenCard;const document={querySelector:selector=>selector.startsWith('[data-selection')?card:activeFilter};assert.equal(selectionReturnTarget(document,'mascot'),activeFilter);card=visibleCard;assert.equal(selectionReturnTarget(document,'mascot'),visibleCard);card=null;assert.equal(selectionReturnTarget(document,'mascot'),activeFilter)});
test('Zoomed image itself permits both native pan axes and pinch, not just its parent',()=>{assert.match(read('style.css'),/\.gallery-viewer\.photo-detail-active img\{touch-action:pan-x pan-y pinch-zoom;/)});

test('Replacement records old focused descendant before zoom cleanup can remove it',()=>{const app=read('app.js'),open=app.slice(app.indexOf('function openProject'),app.indexOf('const caseNavigation='));assert(open.indexOf('const restoreFocus=')<open.indexOf('photoDetail?.destroy()'))});
test('Optional selection import failure prevents half-mounted exploration without blocking caller',async()=>{let mounted=false,failed=false,coreReady=false;const start=optionalModule({load:()=>Promise.all([Promise.resolve({}),Promise.reject(Error('selection module unavailable'))]),mount:()=>{mounted=true},onError:()=>{failed=true}});const pending=start();coreReady=true;await pending;assert(coreReady);assert(failed);assert(!mounted)});

test('A case title inside arbitrary multi-paragraph legacy prose is never parsed out as a removable case',()=>{const legacy='Моя заметка\n\n'+projects.mascot.title+'\n\nОбъяснение и условия';const value=appendSelectionReference(legacy,['pink']).value;assert.equal(referenceParts(value).find(p=>p.text===projects.mascot.title).key,null);assert.equal(removeCaseReference(value,'pink'),legacy);assert.equal(removeCaseReference(value,'mascot'),value)});

test('A fourth inline selection explains the limit at that same card without scroll or focus change',()=>{const f=exploration('#explore/mascot,pink,gesture'),button=f.el('button'),status=f.el('p');f.host.append(button,status);bindSelectionButton({button,key:'stdAwards',controller:f.controller,status});button.focus();button.emit('click');assert.match(status.textContent,/не больше трёх/);assert.equal(status.dataset.state,'error');assert.equal(f.document.activeElement,button);assert.equal(button.scrolled,undefined);f.controller.toggle('pink',false);assert.equal(status.textContent,'');assert.match(read('app.js'),/button.after\(feedback\)/)});

test('Static frame links use a selector more specific than generic caption spans so flex gaps apply',()=>{const css=read('portfolio-resources.css');assert.match(css,/\.static-gallery \.frame-mode-links\{display:flex;flex-wrap:wrap;gap:10px 20px/);assert.match(css,/@media print\{\.static-gallery \.frame-mode-links\{display:none\}/)});

test('Every static original reserves measured dimensions, including lazy photos and video, preventing anchor shift',async()=>{const {createHash}=await import('node:crypto');const dimensions=JSON.parse(readFileSync(new URL('./media-dimensions.json',import.meta.url),'utf8'));assert.equal(Object.keys(dimensions).length,Object.values(projects).flatMap(p=>p.media).length+2);for(const [src,d] of Object.entries(dimensions)){assert(d.width>0&&d.height>0);assert.equal(createHash('sha256').update(readFileSync(new URL('../dist/'+src,import.meta.url))).digest('hex'),d.sha256)}for(const [key,p] of Object.entries(projects)){const html=read('cases/'+key+'.html');for(const item of p.media){const figure=html.split('id="media-'+mediaId(item)+'"')[1].split('</figure>')[0],d=dimensions[item.src];assert(figure.includes('width="'+d.width+'" height="'+d.height+'"'),key+'/'+mediaId(item))}}});
