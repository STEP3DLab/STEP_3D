import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {BRIEF_KEY,createBriefDraftSession,legacyDirections,formatBrief} from '../dist/brief-utils.js';
import {revealService} from '../dist/section-navigation.js';
import {projects} from '../dist/project-data.js';
import {mediaId} from '../dist/exploration-data.js';
import {storyCategories,storyFrames,categoryCount,parseStoryRoute,firstStoryRoute,storyRoute} from '../dist/category-stories-data.js';
import {createStoryNavigation} from '../dist/category-stories-navigation.js';
import {createProjectNavigation} from '../dist/project-navigation.js';
import {mountCategoryStories} from '../dist/category-stories.js';
import {visiblePortfolioTarget,initializePortfolioDisclosure} from '../dist/portfolio-disclosure.js';
const read=file=>readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');

test('Four directions retain their order and factual 0/5/0/4 cases and 0/20/0/10 frames',()=>{
 assert.deepEqual(storyCategories.map(c=>c.id),['interiors','sculpture','awards','modelmaking']);
 assert.deepEqual(storyCategories.map(c=>c.keys.length),[0,5,4,0]);assert.deepEqual(storyCategories.map(c=>storyFrames(c.id).length),[0,20,10,0]);
 assert.equal(categoryCount(storyCategories[1]),'5 проектов · 20 кадров');assert.equal(categoryCount(storyCategories[2]),'4 проекта · 10 кадров');
 const frames=storyCategories.flatMap(c=>storyFrames(c.id));assert.equal(frames.length,30);assert.equal(new Set(frames.map(f=>f.key+'/'+f.id)).size,30);
 for(const f of frames)assert.deepEqual(f.item,projects[f.key].media[f.index]);
});
test('All five supplied originals retain their exact verified bytes and original dimensions',()=>{
 const manifest=JSON.parse(readFileSync(new URL('./new-photo-manifest.json',import.meta.url),'utf8'));assert.equal(manifest.length,5);
 for(const item of manifest){const bytes=readFileSync(new URL('../dist/'+item.asset,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);assert.equal(bytes.length,item.bytes)}
 assert.deepEqual(projects['feather-award'].media.map(m=>mediaId(m)),['feather-front','feather-inscription','feather-angle']);
 for(const key of ['feather-award','vmeste-prize','two-figure-composition']){const p=projects[key];assert.equal(p.attribution,undefined);assert.equal(p.sources,undefined);assert.doesNotMatch(JSON.stringify(p),/202\d|бронз|латун|Паршин|фестивал|Куликов|Селезнёв/)}
});
test('Story parser only accepts actual category/case/media combinations or honest empty introductions',()=>{
 for(const c of storyCategories){if(!c.keys.length){assert.deepEqual(parseStoryRoute(firstStoryRoute(c.id)),{category:c.id,key:null,id:null,index:0});continue}for(const [index,f] of storyFrames(c.id).entries())assert.deepEqual(parseStoryRoute(storyRoute(c.id,f.key,f.id)),{category:c.id,key:f.key,id:f.id,index})}
 for(const hash of ['',null,'#stories/sculpture/intro','#stories/design/mascot/white-front','#stories/awards/mascot/white-front','#stories/sculpture/mascot/missing','#stories/__proto__/intro','#stories/constructor/intro','#stories/awards/stdAwards/award-series/extra','#stories/design/intro/extra','#stories/sculpture/%6dascot/white-front','#stories/'+ 'x'.repeat(230)])assert.equal(parseStoryRoute(hash),null,hash);
});
function browser(hash='#projects'){
 const location={hash,href:'https://example.test/'+hash},entries=[{hash,state:{keep:true}}];let index=0;const listeners={};
 const set=()=>{location.hash=entries[index].hash;location.href='https://example.test/'+location.hash};
 const history={get state(){return entries[index].state},get length(){return entries.length},pushState(state,_,hash){entries.splice(++index);entries.push({state,hash});set()},replaceState(state,_,hash){entries[index]={state,hash};set()},back(){if(index)index--;set()},forward(){if(index<entries.length-1)index++;set()}};
 return {location,history,listeners,addEventListener(type,fn){(listeners[type]??=[]).push(fn)},emit(type){for(const f of listeners[type]||[])f()},get index(){return index}};
}
test('One story session creates one entry; frames replace; Back/Forward reload the exact frame',()=>{
 const b=browser(),opened=[];let closes=0;const n=createStoryNavigation({...b,onOpen:r=>opened.push(r),onClose:()=>closes++});n.sync();n.open('sculpture');assert.equal(b.history.length,2);
 n.frame('sculpture','mascot','red-profile');n.frame('sculpture','two-figure-composition','two-figure-composition');assert.equal(b.history.length,2);assert.equal(opened.at(-1).key,'two-figure-composition');
 b.history.back();n.sync();assert.equal(b.location.hash,'#projects');b.history.forward();n.sync();assert.equal(opened.at(-1).id,'two-figure-composition');
 const reload=createStoryNavigation({...b,onOpen:r=>opened.push(r),onClose(){}});reload.sync();assert.equal(opened.at(-1).id,'two-figure-composition');assert.equal(reload.closed(),'back');assert.equal(b.location.hash,'#projects');assert(closes>0);
});
test('Shared links close locally, invalid routes never acquire modal state, intros remain one frame',()=>{
 const b=browser('#stories/design/intro');let opened;const n=createStoryNavigation({...b,onOpen:r=>opened=r,onClose(){}});n.sync();assert.equal(opened.key,null);assert.equal(n.fullCase(),null);assert.equal(n.closed(),'fallback');assert.equal(b.location.hash,'#projects');assert.equal(b.history.length,1);assert.equal(n.open('missing'),false);assert.equal(n.frame('design',null,null),false);
});
test('Story-to-full-case replaces the one entry and transfers its return destination',()=>{
 const b=browser('#directions');let storyOpen=false,caseOpen=false;const stories=createStoryNavigation({...b,onOpen:()=>{assert(!caseOpen);storyOpen=true},onClose:()=>storyOpen=false});
 const cases=createProjectNavigation({...b,keys:Object.keys(projects),onOpen:(key,id)=>{assert(!storyOpen);caseOpen=true;assert.equal(key,'feather-award');assert.equal(id,'feather-angle')},onClose:()=>caseOpen=false});
 stories.open('awards');stories.frame('awards','feather-award','feather-angle');const r=stories.fullCase();assert.equal(r.id,'feather-angle');cases.sync();assert.equal(b.history.length,2);assert.equal(stories.closed(),'route');assert.equal(cases.closed(),'back');assert.equal(b.location.hash,'#directions');cases.sync();b.history.forward();cases.sync();assert(caseOpen);assert(!storyOpen);
});
test('A deep story-to-case transition cannot send close offsite or create an unnecessary history entry',()=>{
 const b=browser('#stories/awards/feather-award/feather-front'),s=createStoryNavigation({...b,onOpen(){},onClose(){}});s.sync();s.fullCase();const c=createProjectNavigation({...b,keys:Object.keys(projects),onOpen(){},onClose(){}});c.sync();assert.equal(b.history.length,1);assert.equal(c.closed(),'fallback');assert.equal(b.location.hash,'#projects');assert.equal(b.history.state.keep,true);
});
class Node{
 constructor(tag,document){this.tagName=tag.toUpperCase();this.document=document;this.children=[];this.dataset={};this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this.open=false;this.isConnected=true;this.className='';this.textContent='';this.classList={add:name=>{this.className+=' '+name},remove:name=>{this.className=this.className.replace(name,'')}}}
 get scrollTop(){return this._scrollTop||0}set scrollTop(value){if(this.tagName!=='DIALOG'||this.open)this._scrollTop=value}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 emit(type,extra={}){const event={button:0,target:this,key:'',preventDefault(){this.defaultPrevented=true},...extra};for(const fn of this.listeners[type]||[])fn(event);return event}
 append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}}replaceChildren(...nodes){this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attrs[k]=v}removeAttribute(k){delete this.attrs[k]}
 focus(){this.document.activeElement=this}pause(){this.paused=(this.paused||0)+1}load(){}
 closest(selector){if(selector.includes('video')&&this.tagName==='VIDEO')return this;return null}
 showModal(){this.open=true}close(){this.open=false;this.emit('close')}scrollIntoView(){}querySelector(){return this.summary}
}
function mounted(hash='#projects'){
 const window=browser(hash),nodes={},document={hidden:false,activeElement:null,createElement:tag=>new Node(tag,document),getElementById:id=>nodes[id],listeners:{},addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}};
 const dialog=nodes['category-story-dialog']=new Node('dialog',document);dialog.id='category-story-dialog';
 for(const id of ['category','title','counter','caption','credit','full-case','direction','progress','prev','next','restart','end','retry','original','media','status','close'])nodes['story-'+id]=new Node(['prev','next','restart','retry','close'].includes(id)?'button':'div',document);
 const tiles=storyCategories.map(c=>{const tile=new Node('a',document);tile.dataset.storyCategory=c.id;return tile});document.querySelectorAll=()=>tiles;
 let caseOpen=false,fullCase;const cases=createProjectNavigation({...window,keys:Object.keys(projects),onOpen:(key,id)=>{assert(!dialog.open);caseOpen=true;fullCase={key,id}},onClose:()=>caseOpen=false});
 const controller=mountCategoryStories({document,window,beforeOpen:()=>cases.sync(),onFullCase:()=>cases.sync()});
 return {window,document,nodes,tiles,dialog,controller,cases,get caseOpen(){return caseOpen},get fullCase(){return fullCase},open:id=>tiles.find(t=>t.dataset.storyCategory===id).emit('click'),click:id=>nodes['story-'+id].emit('click')};
}
test('Viewer keeps original captions, credit, case segments and counters; next advances manually only',()=>{
 const f=mounted();f.open('awards');assert(f.dialog.open);assert.equal(f.nodes['story-media'].children[0].src,projects.stdAwards.media[0].src);assert.equal(f.nodes['story-caption'].textContent,projects.stdAwards.media[0].caption);assert.match(f.nodes['story-credit'].textContent,/Технопарка РГСУ/);assert.equal(f.nodes['story-progress'].children.length,3);assert.match(f.nodes['story-counter'].textContent,/Проект 1 из 4 · Кадр 1 из 3/);f.click('next');assert.match(f.window.location.hash,/award-ceremony$/);assert.equal(f.window.history.length,2);
});
test('Final frame is finite, does not claim video was watched, and offers explicit restart',()=>{
 const f=mounted('#stories/awards/vmeste-prize/vmeste-prize');assert.equal(f.nodes['story-next'].hidden,true);assert.equal(f.nodes['story-restart'].hidden,false);assert.match(f.nodes['story-end'].textContent,/Последний кадр/);f.dialog.emit('keydown',{key:'ArrowRight'});assert.match(f.window.location.hash,/vmeste-prize$/);f.click('restart');assert.match(f.window.location.hash,/stdAwards\/award-series$/);
});
test('Videos require manual controls and pause on hidden, frame change and close',()=>{
 const f=mounted('#stories/sculpture/mascot/clay-turntable');let video=f.nodes['story-media'].children[0];assert.equal(video.tagName,'VIDEO');assert.equal(video.preload,'none');assert.equal(video.controls,true);assert.equal(video.autoplay,undefined);f.document.hidden=true;for(const fn of f.document.listeners.visibilitychange)fn();assert.equal(video.paused,1);f.click('next');assert.equal(video.paused,2);f.window.location.hash='#stories/sculpture/gesture/gesture-turntable';f.window.emit('hashchange');video=f.nodes['story-media'].children[0];f.click('close');assert.equal(video.paused,1);assert(!f.dialog.open);
});
test('Viewer hands exact frame to full case without stacked dialogs; native modified links remain native',()=>{
 const f=mounted();const modified=f.tiles[1].emit('click',{ctrlKey:true});assert(!modified.defaultPrevented);assert(!f.dialog.open);f.open('awards');f.click('next');f.click('full-case');assert(!f.dialog.open);assert(f.caseOpen);assert.deepEqual(f.fullCase,{key:'stdAwards',id:'award-ceremony'});assert.equal(f.window.history.length,2);assert.equal(f.cases.closed(),'back');assert.equal(f.window.location.hash,'#projects');
});
test('Keyboard ignores video controls/shortcuts; photos have passive safe swipe and no automatic advance',()=>{
 const f=mounted();f.open('sculpture');f.dialog.emit('keydown',{key:'ArrowRight',ctrlKey:true});assert.match(f.window.location.hash,/white-front$/);f.dialog.emit('keydown',{key:'ArrowRight'});assert.match(f.window.location.hash,/white-side$/);const host=f.nodes['story-media'],photo=host.children[0];host.emit('touchstart',{target:photo,touches:[{clientX:120,clientY:20}],timeStamp:0});host.emit('touchend',{target:photo,touches:[],changedTouches:[{clientX:30,clientY:22}],timeStamp:200});assert.match(f.window.location.hash,/red-profile$/);
});
test('Empty directions show no invented project/photo and route to the existing service',()=>{
 const f=mounted();const service=f.nodes['service-modelmaking']=new Node('details',f.document);service.id='service-modelmaking';service.summary=new Node('summary',f.document);f.open('modelmaking');assert.equal(f.nodes['story-media'].children.length,0);assert.equal(f.nodes['story-full-case'].hidden,true);assert.equal(f.nodes['story-direction'].hidden,false);assert.equal(f.nodes['story-credit'].textContent,'Пока нет опубликованных проектов');assert.equal(f.nodes['story-progress'].children.length,1);f.click('direction');assert(!f.dialog.open);assert(service.open);assert.equal(f.document.activeElement,service.summary);assert.equal(f.window.location.hash,'#service-modelmaking');
});
test('Stale media errors cannot overwrite newer frame; retry success restores visible focus',()=>{
 const f=mounted();f.open('awards');const old=f.nodes['story-media'].children[0];f.click('next');old.emit('error');assert(f.nodes['story-retry'].hidden);const active=f.nodes['story-media'].children[0];active.emit('error');assert(!f.nodes['story-retry'].hidden);f.nodes['story-retry'].focus();active.emit('load');assert(f.nodes['story-retry'].hidden);assert.equal(f.document.activeElement,f.nodes['story-media']);
});
test('Case focus recovery rejects closed disclosure ancestors and detached or filtered triggers',()=>{
 const target={isConnected:true,hidden:false,parentElement:{tagName:'DIV',parentElement:{tagName:'DETAILS',open:false}},closest(){return null}};assert.equal(visiblePortfolioTarget(target),false);target.parentElement.parentElement.open=true;assert.equal(visiblePortfolioTarget(target),true);target.hidden=true;assert.equal(visiblePortfolioTarget(target),false);target.hidden=false;target.isConnected=false;assert.equal(visiblePortfolioTarget(target),false);assert.equal(visiblePortfolioTarget(null),false);
});
test('Service selection, filter query and exploration routes reveal the collapsed catalogue',()=>{
 const window=browser(),catalog={open:false},link={addEventListener(_,fn){this.click=fn}},document={getElementById:()=>catalog,querySelectorAll:()=>[link]};initializePortfolioDisclosure({document,window});assert(!catalog.open);link.click({button:0});assert(catalog.open);catalog.open=false;window.location.href='https://example.test/?filter=awards#projects';window.emit('popstate');assert(catalog.open);catalog.open=false;window.location.href='https://example.test/#explore/mascot';window.location.hash='#explore/mascot';window.emit('hashchange');assert(catalog.open);
});
test('Primary DOM is four native square links followed by one collapsed catalogue; close stays sticky',()=>{
 const html=read('index.html'),css=read('category-stories.css');assert.equal((html.match(/data-story-category=/g)||[]).length,4);assert(html.indexOf('category-stories:start')<html.indexOf('id="all-projects"'));assert.match(html,/<details class="all-projects" id="all-projects">/);assert.match(html,/Все проекты и подробные кейсы · 9/);assert.match(html,/id="portfolio-exploration"/);assert.match(css,/aspect-ratio:1/);assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);assert.match(css,/\.story-top\{position:sticky;top:0/);assert.match(css,/object-fit:contain/);assert.match(css,/min-height:44px/);
 const catalog=read('catalog.html');for(const [,target] of html.matchAll(/data-story-category="[^"]+" href="catalog.html#([^"]+)"/g))assert(catalog.includes('id="'+target+'"'));
});
test('No new persistence, data collection, networking, automatic timing or media playback is introduced',()=>{
 for(const file of ['category-stories.js','category-stories-data.js','category-stories-navigation.js','portfolio-disclosure.js'])assert.doesNotMatch(read(file),/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|\.play\(|setTimeout|setInterval|requestAnimationFrame/);
 assert.match(read('exploration-panel.js'),/location.hash.startsWith\('#stories\/'\)/);
});

test('Latest category labels/order are consistent across story tiles, services, navigation, brief and resources',()=>{
 const names=['Дизайн интерьеров','Скульптура','Сувениры и призы','Макетирование'];assert.deepEqual(storyCategories.map(c=>c.title),names);
 const html=read('index.html');for(const block of [html.match(/<nav class="hero-directions"[^>]*>(.*?)<\/nav>/s)[1],html.match(/<div class="service-list">(.*?)<\/section>/s)[1],html.match(/<select name="direction"[^>]*>(.*?)<\/select>/s)[1]]){let at=-1;for(const name of names){const next=block.indexOf(name,at+1);assert(next>at,name);at=next}}
 for(const file of ['index.html','catalog.html','information-pack.html','light.html'])assert.doesNotMatch(read(file),/Дизайн и архитектура|Бытовой дизайн|Сувениры, призы, награды/);
});
test('Interior story alias is retained, but old everyday links never mean modelmaking',()=>{
 assert.equal(parseStoryRoute('#stories/design/intro').category,'interiors');assert.equal(parseStoryRoute('#stories/everyday/intro'),null);assert.equal(parseStoryRoute('#stories/modelmaking/intro').category,'modelmaking');assert.equal(firstStoryRoute('design'),'#stories/interiors/intro');assert.equal(firstStoryRoute('everyday'),null);assert.equal(firstStoryRoute('modelmaking'),'#stories/modelmaking/intro');
});
test('Legacy brief intent is retained without converting everyday design to modelmaking',async()=>{
 const {legacyDirections,readBriefDraft}=await import('../dist/brief-utils.js');for(const direction of legacyDirections){const draft=readBriefDraft(()=>({getItem:()=>JSON.stringify({direction,name:'Имя',idea:'Идея'})}));assert.equal(draft.draft.direction,direction)}assert.match(read('app.js'),/legacyDirections.includes\(value\)/);assert.match(read('app.js'),/из прежнего черновика/);
});
test('Full-tile artwork and honest, clickable direction covers survive the narrow layout',async()=>{
 const css=read('category-stories.css'),html=read('index.html');assert.match(css,/\.category-tile-art\{position:absolute;inset:0;/);assert.match(css,/\.category-tile-art img\{[^}]*width:100%;height:100%;object-fit:contain/);assert.doesNotMatch(css,/mix-blend-mode|category-tile-progress|box-shadow/);assert.doesNotMatch(css,/category-tile-art\{[^}]*flex:1/);assert.match(css,/\.category-story-tile h3\{font-size:14px;line-height:1\.22/);assert.match(css,/overflow-wrap:normal;word-break:normal/);assert.doesNotMatch(html,/category-tile-progress/);assert.equal((html.match(/class="category-tile-cta">Смотреть/g)||[]).length,2);assert.equal((html.match(/class="category-tile-cta">О направлении/g)||[]).length,2);
 for(const id of ['interiors','modelmaking']){const tile=html.match(new RegExp('<a class="category-story-tile is-intro" data-story-category="'+id+'".*?</a>'))[0];assert.doesNotMatch(tile,/<img/);assert.match(tile,/Пока нет проектов/)}
 const {initializeBackToTop}=await import('../dist/experience-ux.js');let notify;const hero={},stories={},link={hidden:true,addEventListener(){}};initializeBackToTop({document:{activeElement:null,getElementById:id=>id==='home'?hero:id==='back-to-top'?link:null,querySelector:selector=>selector==='.category-stories'?stories:null},window:{IntersectionObserver:class{constructor(fn){notify=fn}observe(){}}}});notify([{target:hero,isIntersecting:false},{target:stories,isIntersecting:true}]);assert(link.hidden);notify([{target:stories,isIntersecting:false}]);assert(!link.hidden);
});


test('Legacy everyday deep links never open a story or rewrite the current history entry',()=>{
 for(const hash of ['#service-everyday','#stories/everyday/intro']){
  const f=mounted(hash);assert(!f.dialog.open);assert.equal(f.controller.isStory(),false);assert.equal(f.window.location.hash,hash);assert.equal(f.window.history.length,1);
  for(const event of ['hashchange','popstate','hashchange'])f.window.emit(event);
  assert(!f.dialog.open);assert.equal(f.window.location.hash,hash);assert.equal(f.window.history.length,1);
 }
});
test('Legacy notice and canonical stories survive repeated Back/Forward without loops or added entries',()=>{
 for(const hash of ['#service-everyday','#stories/everyday/intro']){
  const f=mounted(hash);f.open('modelmaking');assert(f.dialog.open);assert.equal(f.window.location.hash,'#stories/modelmaking/intro');assert.equal(f.window.history.length,2);
  for(let i=0;i<3;i++){
   f.window.history.back();f.window.emit('popstate');f.window.emit('hashchange');assert(!f.dialog.open);assert.equal(f.window.location.hash,hash);assert.equal(f.window.index,0);
   f.window.history.forward();f.window.emit('popstate');f.window.emit('hashchange');assert(f.dialog.open);assert.equal(f.window.location.hash,'#stories/modelmaking/intro');assert.equal(f.window.history.length,2);
  }
  f.click('close');f.window.emit('popstate');f.window.emit('hashchange');assert(!f.dialog.open);assert.equal(f.window.location.hash,hash);assert.equal(f.window.history.length,2);
 }
});

test('Old-link load, reload, choices and Back/Forward preserve all six legacy brief fields without writing',()=>{
 const html=read('index.html'),app=read('app.js'),restore=app.match(/for\(const \[key,value\] of Object.entries\(recovered.draft\)\)\{[^\n]+/)[0];
 const options=[...html.match(/<select name="direction"[^>]*>(.*?)<\/select>/s)[1].matchAll(/<option>([^<]+)<\/option>/g)].map(m=>m[1]);
 for(const direction of [...legacyDirections,'Предметы и интерьер'])for(const hash of ['#service-everyday','#stories/everyday/intro']){
  const original={reference:'Ссылка и пояснение',name:'Тестовое имя',direction,idea:'Первая строка\nВторая строка',budget:'Не определён',deadline:'После согласования'},raw=JSON.stringify(original);let writes=0;
  const storage={getItem(key){assert.equal(key,BRIEF_KEY);return raw},setItem(){writes++},removeItem(){writes++}};
  const expected={...original,direction:direction==='Предметы и интерьер'?'Бытовой дизайн':direction};
  for(let reload=0;reload<2;reload++){
   const session=createBriefDraftSession(()=>storage),fields=Object.fromEntries(Object.keys(original).map(key=>[key,key==='direction'?{tagName:'SELECT',options:options.map(value=>({value})),add(option){this.options.push(option)},value:''}:{tagName:'INPUT',value:''}]));
   vm.runInNewContext(restore,{recovered:session.recovered,form:{elements:{namedItem:key=>fields[key]}},legacyDirections,Option:class{constructor(text,value){this.text=text;this.value=value}}});
   const values=()=>Object.fromEntries(Object.entries(fields).map(([key,field])=>[key,field.value])),f=mounted(hash);
   for(const id of ['design','sculpture','awards','modelmaking'])f.nodes['service-'+id]={tagName:'DETAILS',open:false};
   assert.deepEqual(values(),expected);assert.equal(revealService(hash,f.document),false);assert(!f.nodes['service-modelmaking'].open);
   for(const id of ['design','sculpture','awards','modelmaking']){assert(revealService('#service-'+id,f.document));assert.deepEqual(values(),expected);assert.equal(writes,0)}
   f.open('modelmaking');f.window.history.back();f.window.emit('popstate');f.window.emit('hashchange');f.window.history.forward();f.window.emit('popstate');f.window.emit('hashchange');f.click('close');f.window.emit('popstate');f.window.emit('hashchange');
   assert.equal(f.window.location.hash,hash);assert.deepEqual(values(),expected);assert.equal(writes,0);assert.equal(storage.getItem(BRIEF_KEY),raw);assert.equal(session.check(),null);
   const text=formatBrief(values());for(const value of Object.values(expected))assert(text.includes(value));
  }
 }
});


test('Dark viewer prioritizes the intact original with compact chrome and scroll-safe controls',()=>{
 const css=read('category-stories.css'),html=read('index.html');assert.match(css,/width:min\(900px,calc\(100% - 32px\)\)/);assert.match(css,/max-height:calc\(100dvh - 32px\)/);assert.match(css,/background:#1b1d1c;color:#f7f5f0;overflow:auto/);assert.match(css,/\.category-story-dialog::backdrop\{background:#080a09c9/);assert.match(css,/height:min\(60dvh,620px\);min-height:260px/);assert.match(css,/\.story-media\{height:58dvh;min-height:280px/);assert.match(css,/@media\(max-height:500px\)\{\.story-media,\.story-media\.story-intro-art\{height:34dvh;min-height:110px/);assert.match(css,/env\(safe-area-inset-bottom\)/);assert.match(css,/env\(safe-area-inset-top\)/);assert.match(css,/\.story-media img,\.story-media video\{[^}]*object-fit:contain/);assert.doesNotMatch(css,/object-fit:cover|line-clamp/);
 const top=html.match(/<header class="story-top">(.*?)<\/header>/s)[1];for(const id of ['progress','category','counter','close'])assert(top.includes('id="story-'+id+'"'));assert(html.indexOf('id="story-media"')<html.indexOf('class="story-rail"'));assert.match(css,/\.story-actions a\{min-height:44px/);assert.match(css,/\.story-controls button,#story-retry\{min-height:44px/);assert.match(css,/#story-status:empty\{display:none\}/);
});

test('Manual next and previous begin at the new frame rather than a scrolled caption rail',()=>{
 const f=mounted();f.open('awards');f.dialog.scrollTop=420;f.nodes['story-next'].focus();f.click('next');assert.equal(f.dialog.scrollTop,0);assert.equal(f.document.activeElement,f.nodes['story-media']);assert.match(f.window.location.hash,/award-ceremony$/);f.dialog.scrollTop=520;f.click('prev');assert.equal(f.dialog.scrollTop,0);assert.match(f.window.location.hash,/award-series$/);assert.equal(f.window.history.length,2);
});

test('Story polish changes both entry and optional module URLs without invalidating legacy imports',()=>{
 assert.match(read('index.html'),/app\.js\?v=20261026-legacy-links&amp;stories=20261026-story-polish/);assert.match(read('index.html'),/category-stories\.css\?v=20261026-story-polish/);assert.match(read('app.js'),/category-stories\.js\?v=20261026-legacy-links&stories=20261026-story-polish/);
});

test('Reopening a previously scrolled hidden dialog resets after it has a visible scroll box',()=>{
 const f=mounted();f.open('awards');f.dialog.scrollTop=420;f.click('close');assert(!f.dialog.open);assert.equal(f.dialog.scrollTop,420);f.open('sculpture');assert(f.dialog.open);assert.equal(f.dialog.scrollTop,0);assert.equal(f.nodes['story-title'].textContent,projects.mascot.title);
});

test('Short-height stories keep 44px navigation before captions without changing normal-height media',()=>{
 const html=read('index.html'),css=read('category-stories.css');assert(html.indexOf('id="story-media"')<html.indexOf('class="story-controls"'));assert(html.indexOf('class="story-controls"')<html.indexOf('id="story-caption"'));
 assert.match(css,/@media\(max-height:500px\)\{\.story-media,\.story-media\.story-intro-art\{height:34dvh;min-height:110px\}/);assert.match(css,/\.story-controls button,#story-retry\{min-height:44px/);assert.match(css,/height:min\(60dvh,620px\);min-height:260px/);assert.match(css,/\.story-media\{height:58dvh;min-height:280px/);
});
