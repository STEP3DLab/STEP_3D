import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
import {portfolioOutputs,casePath} from './render-portfolio-resources.mjs';
import {createMediaSlot} from '../dist/portfolio-media.js';
import {initializeLightView,lightPreview} from '../dist/light-view.js';
import {initializeLightView as initializeWarmLightView,lightPreview as warmLightPreview} from '../../trifoti/warm/light-view.js';
import {projects as warmProjects} from '../../trifoti/warm/project-data.js';
import {meetingFrames,meetingRoute,meetingHash,initializeMeeting} from '../dist/meeting.js';
const root=new URL('../dist/',import.meta.url),read=name=>readFileSync(new URL(name,root),'utf8');
const outputs=portfolioOutputs();
for(const [path,html] of outputs)test('Generated '+path+' is factual, noindex, portable and reproducible',()=>{
 assert.equal(read(path),html);assert.match(html,/<html lang="ru">/);assert.match(html,/name="robots" content="noindex,nofollow"/);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const [,url] of html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)){
  if(url.startsWith('#'))assert(ids.includes(url.slice(1)),url);
  else if(!/^https?:/.test(url))assert(existsSync(new URL(url.split(/[?#]/)[0],new URL(path,root))),url);
 }
 assert.doesNotMatch(html,/chatgpt\.site|<form|autoplay|analytics|iframe/);
 for(const key of ['og:url','og:image'])assert.match(html,new RegExp('property="'+key+'" content="https://step3dlab.github.io/STEP_3D/trifoti/'));
});
for(const [key,p] of Object.entries(projects))test('Static '+key+' preserves every original and exact source caption',()=>{
 const html=outputs.get(casePath(key));assert(html.includes(p.title));assert(html.includes(p.description));assert(html.includes(p.attribution||p.type));
 for(const section of p.sections||[])assert(html.includes(section.text));for(const source of p.sources||[])assert(html.includes(source.url));
 assert.equal((html.match(/<figure /g)||[]).length,p.media.length);
 for(const item of p.media){assert(html.includes('../'+item.src));assert(html.includes(item.caption));if(item.type==='video'){assert(html.includes('../'+item.poster));assert.match(html,/<video controls playsinline preload="none"/);}}
 const image=html.match(/property="og:image" content="([^"]+)"/)[1];assert.equal(image,'https://step3dlab.github.io/STEP_3D/trifoti/'+(p.media[0].poster||p.media[0].src));
 assert.match(html,/meta name="twitter:image:alt"/);assert.match(html,/<script type="module" src="\.\.\/static-case-context.js/);
});
test('Catalog includes all six cases with exact descriptions, covers, citations and no video payload',()=>{
 const html=outputs.get('catalog.html');assert.equal((html.match(/class="catalog-case"/g)||[]).length,Object.keys(projects).length);assert.doesNotMatch(html,/<video/);
 for(const [key,p] of Object.entries(projects)){assert(html.includes(p.description));assert(html.includes(p.attribution||p.type));assert(html.includes(p.media[0].poster||p.media[0].src));assert(html.includes(casePath(key)));for(const source of p.sources||[])assert(html.includes(source.url));}
 const css=read('portfolio-resources.css');assert.match(css,/@page\{size:A4/);assert.match(css,/break-before:page/);assert.match(css,/attr\(href\)/);assert.match(css,/height:auto;max-height:none;overflow:visible/);
 assert.equal(read('catalog.js').match(/window.print\(\)/g).length,1);
});
test('Three mobile catalog covers reuse smaller WebP assets without changing desktop or printed originals',()=>{
 const html=outputs.get('catalog.html');
 const affected={
  'feather-award/feather-front':[480,800,1280],
  'vmeste-prize/vmeste-prize':[480,720],
  'two-figure-composition/two-figure-composition':[480,800,1280]
 };
 const pictures=[...html.matchAll(/<picture><source media="screen and \(max-width: 700px\)" type="image\/webp" srcset="([^"]+)" sizes="92vw"><img src="assets\/projects\/([^"]+)\.jpg"[^>]+><\/picture>/g)];
 assert.equal(pictures.length,3);
 for(const [,set,stem] of pictures){
  assert.deepEqual(set.split(', '),affected[stem].map(w=>`assets/responsive/${stem}-${w}.webp ${w}w`));
  const image=readFileSync(new URL('assets/projects/'+stem+'.jpg',root));
  for(const w of affected[stem])assert(readFileSync(new URL(`assets/responsive/${stem}-${w}.webp`,root)).length<image.length);
 }
 assert.equal((html.match(/loading="eager"/g)||[]).length,Object.keys(projects).length);
});
test('Text-only lightweight markup requests no media, fonts, app or bear and retains 25 original links',()=>{
 const html=outputs.get('light.html');assert.doesNotMatch(html,/<img|<video|<source|preload|app\.js|bear-video/);
 assert.equal((html.match(/data-light-case=/g)||[]).length,Object.keys(projects).length);
 for(const p of Object.values(projects))for(const item of p.media)assert(html.includes('href="https://step3dlab.github.io/STEP_3D/trifoti/'+item.src+'"'));
 assert.match(html,/index.html#brief-form/);assert.match(html,/index.html#project\//);
 for(const file of ['portfolio-media.js','light-view.js','meeting.js'])assert.doesNotMatch(read(file),/localStorage|sessionStorage|fetch\(|sendBeacon|setInterval|autoplay\s*=/);
});
test('Existing six cards now fall back to generated pages; original hash navigation remains',()=>{
 const html=read('index.html'),app=read('app.js');for(const key of Object.keys(projects))assert(html.includes('href="'+casePath(key)+'"'));
 assert.match(html,/href="light.html"/);assert.match(html,/href="catalog.html"/);assert.match(app,/caseNavigation\.open\(card\.dataset\.project\)/);
 assert.match(read('exploration-panel.js'),/meeting\.hidden=!selected.length/);assert(read('exploration-panel.js').includes("meeting.href='meeting.html#show/'"));
});
test('Meeting HTML exposes recovery links without any script and hides premature selection advice',()=>{
 const html=outputs.get('meeting.html'),withoutNoscript=html.replace(/<noscript>[\s\S]*?<\/noscript>/g,'');
 const loading=withoutNoscript.match(/<div id="meeting-loading">([\s\S]*?)<\/div>/)[1];
 assert.match(loading,/Открываем выбранные работы/);assert.match(loading,/Если показ не открылся/);
 assert.doesNotMatch(loading,/Выберите до трёх|Выбрать работы/);
 for(const [key,p] of Object.entries(projects))assert(loading.includes(`<a href="${casePath(key)}">${p.title}</a>`),key);
 assert.match(withoutNoscript,/<div id="meeting-selection" hidden>/);
 assert.match(withoutNoscript,/<section id="meeting-player" hidden/);
 assert.match(withoutNoscript,/<a class="skip" id="meeting-skip" href="#meeting-stage" hidden>/);
 assert.match(withoutNoscript,/meeting\.js[^"<>]*fallback=20261106-loading/);
 assert.match(read('portfolio-resources.css'),/\.light-index a\{[^}]*min-height:44px/);
});
test('Meeting route validates and limits IDs, clamps frames and never embeds arbitrary text',()=>{
 assert.deepEqual(meetingRoute('#show/mascot,stdAwards,gesture,pink/99'),{ids:['mascot','stdAwards','gesture'],index:13});
 assert.equal(meetingFrames(['mascot','stdAwards']).length,13);
 for(const hash of ['',null,'#show/__proto__,constructor/0','#show/pink/-1','#show/pink/999','#show/'+ 'x'.repeat(200)+'/0'])assert.deepEqual(meetingRoute(hash),{ids:[],index:0});
 assert.equal(meetingHash(['pink'],99),'#show/pink/1');assert.equal(meetingHash(['wrong'],0),'');
 assert.equal(meetingHash(['pink'],NaN),'#show/pink/0');assert.equal(meetingHash(['pink'],-1),'#show/pink/0');
});
class Node{
 constructor(tag='div',doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this.textContent='';this.value='';this.checked=false;this.dataset={};this.style={};}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 emit(type,extra={}){const event={button:0,key:'',target:this,preventDefault(){this.defaultPrevented=true},...extra};for(const fn of this.listeners[type]||[])fn(event);return event}
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node)}}
 replaceChildren(...nodes){if(this.children.some(n=>n.contains(this.doc.activeElement)))this.doc.activeElement=this.doc.body;for(const n of this.children)n.parent=null;this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attrs[k]=v} removeAttribute(k){delete this.attrs[k];if(k==='src')delete this.src}
 set disabled(value){this._disabled=!!value;if(this._disabled&&this.doc.activeElement===this)this.doc.activeElement=this.doc.body}
 get disabled(){return this._disabled}
 focus(options){this.doc.activeElement=this;this.focusOptions=options} scrollIntoView(){this.scrolled=true} pause(){this.paused=(this.paused||0)+1}load(){this.loaded=(this.loaded||0)+1}
 closest(selector){return selector.includes('video')&&['VIDEO','INPUT','TEXTAREA','SELECT'].includes(this.tagName)?this:null}
 contains(other){return other===this||this.children.some(n=>n.contains(other))}
 click(){this.clicks=(this.clicks||0)+1;this.emit('click')}
 querySelector(selector){return selector==='[data-light-gallery]'?this.gallery:null}
}
function fixture(hash='#show/mascot,gesture/0'){
 const nodes={},listeners={},changes=[];const document={hidden:false,activeElement:null,createElement:tag=>new Node(tag,document),getElementById:id=>nodes[id],addEventListener(type,fn){(listeners[type]??=[]).push(fn)},querySelectorAll(){return []},querySelector(selector){return selector==='.meeting-top'?{getBoundingClientRect:()=>({height:78})}:null}};
 for(const id of ['meeting-player','meeting-media','meeting-media-status','meeting-load','meeting-case','meeting-exit','meeting-title','meeting-direction','meeting-caption','meeting-credit','meeting-counter','meeting-case-link','meeting-sources','meeting-prev','meeting-next','meeting-empty','meeting-loading','meeting-selection','meeting-skip','meeting-stage','light-posters','light-mode'])nodes[id]=new Node(id==='meeting-case'?'select':id==='light-posters'?'input':id.endsWith('-next')||id.endsWith('-prev')||id.endsWith('-load')?'button':'div',document);
 document.body=new Node('body',document);document.activeElement=document.body;
 nodes['meeting-empty'].append(nodes['meeting-loading'],nodes['meeting-selection']);
 for(const id of ['meeting-player','meeting-selection','meeting-skip'])nodes[id].hidden=true;
 nodes['meeting-stage'].append(nodes['meeting-media'],nodes['meeting-sources'],nodes['meeting-load']);
 nodes['meeting-player'].append(nodes['meeting-prev'],nodes['meeting-next'],nodes['meeting-case'],nodes['meeting-stage']);
 const window={location:{hash},history:{state:{existing:true},replaceState(state,_,hash){changes.push([state,hash]);window.location.hash=hash}},addEventListener(type,fn){(listeners[type]??=[]).push(fn)}};
 return {document,window,nodes,changes,emit(type,event={}){for(const fn of listeners[type]||[])fn({target:nodes['meeting-next'],preventDefault(){this.defaultPrevented=true},...event})}};
}
test('Meeting only replaces the loading fallback after a successful initialization',()=>{
 for(const hash of ['#show/pink/1','']){
  const f=fixture(hash);initializeMeeting(f);
  assert(f.nodes['meeting-loading'].hidden);assert.equal(f.nodes['meeting-selection'].hidden,false);
  assert.equal(f.nodes['meeting-player'].hidden,!hash);assert.equal(f.nodes['meeting-empty'].hidden,!!hash);
  assert.equal(f.nodes['meeting-skip'].hidden,!hash);assert.equal(f.document.activeElement,f.document.body);
  assert.equal(f.changes.length,0);
 }
});
test('Meeting fallback survives an incomplete scaffold or failure during the first render',()=>{
 for(const missing of ['meeting-player','meeting-selection','meeting-skip']){
  const f=fixture();delete f.nodes[missing];assert.equal(initializeMeeting(f),null);
  assert.equal(f.nodes['meeting-empty'].hidden,false);assert.equal(f.nodes['meeting-loading'].hidden,false);
 }
 const f=fixture();delete f.nodes['meeting-title'];assert.throws(()=>initializeMeeting(f));
 assert.equal(f.nodes['meeting-empty'].hidden,false);assert.equal(f.nodes['meeting-loading'].hidden,false);
 assert(f.nodes['meeting-player'].hidden);assert(f.nodes['meeting-selection'].hidden);assert(f.nodes['meeting-skip'].hidden);
});
test('Delayed meeting initialization restores focus only when it hides a focused fallback link',()=>{
 for(const hash of ['#show/pink/1','']){
  const f=fixture(hash),link=new Node('a',f.document);f.nodes['meeting-loading'].append(link);link.focus();
  initializeMeeting(f);const target=f.nodes[hash?'meeting-stage':'meeting-exit'];
  assert.equal(f.document.activeElement,target);assert.deepEqual(target.focusOptions,{preventScroll:true});
 }
 const f=fixture();f.nodes['meeting-exit'].focus();initializeMeeting(f);
 assert.equal(f.document.activeElement,f.nodes['meeting-exit']);
});
test('Meeting route from the selection prompt to a valid show retains a visible focus',()=>{
 const f=fixture('');initializeMeeting(f);const link=new Node('a',f.document);f.nodes['meeting-selection'].append(link);link.focus();
 f.window.location.hash='#show/pink/1';f.emit('hashchange');
 assert.equal(f.document.activeElement,f.nodes['meeting-stage']);assert.equal(f.nodes['meeting-skip'].hidden,false);
 assert.equal(f.nodes['meeting-counter'].textContent,'2 / 2');assert(f.nodes['meeting-empty'].hidden);
});
test('Media slot ignores obsolete loads/errors, explicitly pauses replaced video and never autoplays',()=>{
 const f=fixture(),host=new Node('div',f.document),status=new Node('p',f.document);let errors=0;
 const slot=createMediaSlot({document:f.document,host,status,onError(){errors++}}),item=projects.mascot.media[9];
 const old=slot.show(item,{video:true});assert.equal(old.preload,'none');assert.equal(old.autoplay,undefined);assert.equal(old.controls,true);
 const current=slot.show(projects.pink.media[0]);assert.equal(old.paused,1);assert.equal(old.src,undefined);assert.equal(old.loaded,1);
 old.emit('error');assert.equal(errors,0);current.emit('error');assert.equal(errors,1);current.emit('load');assert.equal(status.textContent,'');slot.clear();assert.equal(host.children.length,0);current.emit('error');assert.equal(errors,1);
});
test('Meeting initializes only selected first frame; manual navigation replaces history and retains attribution',()=>{
 const f=fixture('#show/stdAwards,gesture/0'),m=initializeMeeting(f);assert.equal(f.nodes['meeting-player'].hidden,false);assert.equal(f.nodes['meeting-empty'].hidden,true);
 assert.equal(f.nodes['meeting-media'].children.length,1);assert.equal(f.nodes['meeting-media'].children[0].src,projects.stdAwards.media[0].src);assert.match(f.nodes['meeting-credit'].textContent,/Технопарка РГСУ/);
 f.nodes['meeting-next'].emit('click');assert.equal(f.window.location.hash,'#show/stdAwards,gesture/1');assert.deepEqual(f.changes[0][0],{existing:true});
 m.go(3);assert.equal(f.nodes['meeting-media'].children[0].tagName,'IMG');assert.equal(f.nodes['meeting-media'].children[0].src,projects.gesture.media[0].poster);assert.equal(f.nodes['meeting-load'].hidden,false);
 f.nodes['meeting-load'].emit('click');const video=f.nodes['meeting-media'].children[0];assert.equal(video.tagName,'VIDEO');assert.equal(video.preload,'none');assert.equal(video.autoplay,undefined);
 f.nodes['meeting-next'].emit('click');assert.equal(video.paused,1);assert.equal(f.nodes['meeting-counter'].textContent,'1 / 4');assert.equal(f.nodes['meeting-exit'].href,'index.html?from=meeting#explore/stdAwards,gesture');
});
test('Meeting jump, browser history, invalid routes and return context remain coherent',()=>{
 const f=fixture(),m=initializeMeeting(f);f.nodes['meeting-case'].value='gesture';f.nodes['meeting-case'].emit('change');assert.equal(f.nodes['meeting-counter'].textContent,'11 / 11');
 f.window.location.hash='#show/pink/1';f.emit('popstate');assert.equal(f.nodes['meeting-title'].textContent,projects.pink.title);assert.equal(f.nodes['meeting-counter'].textContent,'2 / 2');assert.equal(f.changes.length,1);
 f.window.location.hash='#bad';f.emit('hashchange');assert.equal(f.nodes['meeting-player'].hidden,true);assert.equal(f.nodes['meeting-empty'].hidden,false);assert.equal(f.nodes['meeting-media'].children.length,0);
 f.window.location.hash='#show/gesture/0';m.sync();assert.equal(f.nodes['meeting-prev'].disabled,true);assert.equal(f.nodes['meeting-next'].disabled,true);
});
test('Meeting keyboard, skip, native video and hidden-page behavior are explicit and non-destructive',()=>{
 const f=fixture();initializeMeeting(f);f.emit('keydown',{key:'End'});assert.equal(f.nodes['meeting-counter'].textContent,'11 / 11');
 f.nodes['meeting-load'].emit('click');const video=f.nodes['meeting-media'].children[0];f.emit('keydown',{key:'ArrowLeft',target:video});assert.equal(f.nodes['meeting-counter'].textContent,'11 / 11');
 f.emit('keydown',{key:'ArrowLeft',ctrlKey:true});assert.equal(f.nodes['meeting-counter'].textContent,'11 / 11');
 f.document.hidden=true;f.emit('visibilitychange');assert.equal(video.paused,1);f.emit('pagehide');assert.equal(video.paused,2);
 f.emit('keydown',{key:'Home'});assert.equal(f.nodes['meeting-counter'].textContent,'1 / 11');
 const hash=f.window.location.hash;f.nodes['meeting-skip'].emit('click');assert.equal(f.window.location.hash,hash);assert.equal(f.document.activeElement,f.nodes['meeting-stage']);assert.equal(f.nodes['meeting-stage'].scrolled,true);
 f.emit('keydown',{key:'Escape'});assert.equal(f.nodes['meeting-exit'].clicks,1);
});
test('Light galleries load no media until a deliberate request and reset without fetching on step',()=>{
 const f=fixture(),cards=Object.keys(projects).map(key=>{const n=new Node('article',f.document);n.dataset.lightCase=key;n.gallery=new Node('div',f.document);return n});f.document.querySelectorAll=()=>cards;
 initializeLightView(f);const frames=cards.map(c=>c.gallery.children[0]),first=frames[0],controls=first.children[0],host=first.children[1],load=first.children[4];
 assert(frames.every(frame=>frame.children[1].children.length===0));assert.equal(f.nodes['light-mode'].hidden,false);
 load.emit('click');assert.equal(host.children[0].src,projects.stdAwards.media[0].src);
 controls.children[2].emit('click');assert.equal(host.children.length,0);assert.equal(controls.children[1].textContent,'2 / 3');
 f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');assert(frames.every(frame=>frame.children[1].children[0].tagName==='IMG'));
 assert.equal(host.children[0].src,lightPreview(projects.stdAwards,projects.stdAwards.media[1]));
 f.nodes['light-posters'].checked=false;f.nodes['light-posters'].emit('change');assert(frames.every(frame=>frame.children[1].children.length===0));
 const videoFrame=frames[Object.keys(projects).indexOf('gesture')];videoFrame.children[4].emit('click');const video=videoFrame.children[1].children[0];assert.equal(video.tagName,'VIDEO');assert.equal(video.preload,'none');f.emit('pagehide');assert.equal(video.paused,1);
});

test('Meeting moves focus from removed dynamic sources to the stable stage',()=>{
 const f=fixture('#show/stdAwards,pink/0');initializeMeeting(f);
 const source=f.nodes['meeting-sources'].children[0].children[0];source.focus();
 f.emit('keydown',{key:'End',target:source});
 assert.equal(f.document.activeElement,f.nodes['meeting-stage']);assert.equal(f.nodes['meeting-title'].textContent,projects.pink.title);
});
for(const event of ['hashchange','popstate']){
 test(`Meeting ${event} preserves a visible focus target before removing video controls`,()=>{
  const f=fixture('#show/gesture,pink/0');initializeMeeting(f);
  f.nodes['meeting-load'].emit('click');const video=f.nodes['meeting-media'].children[0];video.focus();
  f.window.location.hash='#show/gesture,pink/1';f.emit(event);
  assert.equal(f.document.activeElement,f.nodes['meeting-stage']);
  assert.equal(f.nodes['meeting-title'].textContent,projects.pink.title);
  assert.equal(f.nodes['meeting-counter'].textContent,'2 / 3');
  assert.equal(video.paused,1);assert.equal(video.src,undefined);
  assert.equal(f.nodes['meeting-media'].children[0].src,projects.pink.media[0].src);
  assert.equal(f.changes.length,0);
 });
 test(`Meeting ${event} leaves stable navigation focus alone`,()=>{
  for(const id of ['meeting-exit','meeting-prev','meeting-next','meeting-case']){
   const f=fixture('#show/gesture,pink/0');initializeMeeting(f);f.nodes[id].focus();
   f.window.location.hash='#show/gesture,pink/1';f.emit(event);
   assert.equal(f.document.activeElement,f.nodes[id],id);
  }
 });
 for(const id of ['meeting-prev','meeting-next'])test(`Meeting ${event} restores focus when ${id} becomes disabled by a single-frame route`,()=>{
  const f=fixture('#show/gesture,pink/1');initializeMeeting(f);f.nodes[id].focus();
  f.window.location.hash='#show/gesture/0';f.emit(event);
  assert.equal(f.nodes['meeting-prev'].disabled,true);assert.equal(f.nodes['meeting-next'].disabled,true);
  assert.equal(f.document.activeElement,f.nodes['meeting-stage']);assert.deepEqual(f.nodes['meeting-stage'].focusOptions,{preventScroll:true});
  assert.equal(f.nodes['meeting-counter'].textContent,'1 / 1');assert.equal(f.nodes['meeting-title'].textContent,projects.gesture.title);
  assert.equal(f.nodes['meeting-media'].children[0].tagName,'IMG');assert.equal(f.changes.length,0);
  f.nodes['meeting-load'].emit('click');const video=f.nodes['meeting-media'].children[0];video.focus();
  f.emit('popstate');f.emit('hashchange');
  assert.equal(f.document.activeElement,video);assert.equal(f.nodes['meeting-media'].children[0],video);assert.equal(video.paused,undefined);
  f.window.location.hash='#show/gesture,pink/1';f.emit(event);
  assert.equal(f.nodes['meeting-prev'].disabled,false);assert.equal(f.nodes['meeting-next'].disabled,false);
  assert.equal(f.document.activeElement,f.nodes['meeting-stage']);assert.equal(video.paused,1);assert.equal(video.src,undefined);
 });
 test(`Meeting ${event} single-frame route leaves usable controls and outside focus alone`,()=>{
  for(const id of ['meeting-exit','meeting-case','meeting-stage','meeting-skip']){
   const f=fixture('#show/gesture,pink/0');initializeMeeting(f);f.nodes[id].focus();
   f.window.location.hash='#show/gesture/0';f.emit(event);
   assert.equal(f.document.activeElement,f.nodes[id],id);assert.equal(f.nodes['meeting-next'].disabled,true);
  }
 });
 test(`Meeting ${event} returns focus outside a player hidden by an invalid route`,()=>{
  const f=fixture('#show/gesture,pink/0');initializeMeeting(f);
  f.nodes['meeting-load'].emit('click');const video=f.nodes['meeting-media'].children[0];video.focus();
  f.window.location.hash='#bad';f.emit(event);
  assert.equal(f.document.activeElement,f.nodes['meeting-exit']);
  assert.equal(f.nodes['meeting-player'].hidden,true);assert.equal(f.nodes['meeting-empty'].hidden,false);
  assert.equal(f.nodes['meeting-media'].children.length,0);assert.equal(video.paused,1);
  assert.equal(f.nodes['meeting-exit'].href,'index.html#projects');
 });
}
test('Meeting repeated route events keep the current video and its native focus',()=>{
 const f=fixture('#show/gesture,pink/0');initializeMeeting(f);
 f.nodes['meeting-load'].emit('click');const video=f.nodes['meeting-media'].children[0];video.focus();
 f.emit('popstate');f.emit('hashchange');
 assert.equal(f.document.activeElement,video);assert.equal(f.nodes['meeting-media'].children[0],video);
 assert.equal(video.paused,undefined);assert.equal(f.changes.length,0);
});
test('Meeting an invalid route preserves outside focus but moves focus from the disappearing skip link',()=>{
 for(const id of ['meeting-exit','meeting-skip']){
  const f=fixture('#show/gesture,pink/0');initializeMeeting(f);f.nodes[id].focus();
  f.window.location.hash='#bad';f.emit('hashchange');assert.equal(f.document.activeElement,f.nodes['meeting-exit']);
  assert(f.nodes['meeting-skip'].hidden);
 }
});
test('Lightweight native request measurements reconcile and prove a bounded reduction',()=>{
 const measurements=JSON.parse(readFileSync(new URL('./lightweight-measurements.json',import.meta.url),'utf8'));
 for(const key of ['baseline','light_text','light_posters']){const item=measurements[key];assert.equal(item.requests,item.responses.length);assert.equal(item.body_bytes,item.responses.reduce((sum,row)=>sum+row.bytes,0));assert(item.responses.every(row=>row.status===200));assert(item.responses.every(row=>!row.path.includes('favicon')));}
 assert.equal(measurements.baseline_commit,'02c123815db840c6a34009fd39c2fd2c13db46ff');assert(measurements.light_text.body_bytes<measurements.baseline.body_bytes*.05);assert(measurements.light_posters.body_bytes<measurements.baseline.body_bytes*.1);
 assert(measurements.light_text.responses.every(row=>!/\.(mp4|webm|webp|woff2)/.test(row.path)));
 assert.equal(measurements.light_posters.requests-measurements.light_text.requests,6);assert.equal(measurements.manual_original.next_caption_extra_requests,0);
});
test('Return marker is transient and focuses the visible meeting entry only after load',()=>{
 const source=read('exploration-panel.js');assert.match(source,/get\('from'\)==='meeting'/);assert.match(source,/meeting\.focus\(\{preventScroll:true\}\)/);assert.match(source,/document\.defaultView\?\.addEventListener\('load',restore,\{once:true\}\)/);assert.match(source,/history\.replaceState\(history\.state,''/);
});
test('Historical group 10 trace stays explicitly scoped to its release, not current runtime bytes',()=>{
 const measurements=JSON.parse(readFileSync(new URL('./lightweight-measurements.json',import.meta.url),'utf8'));
 assert.equal(measurements.release_commit,'683f42bb5551ba257b97756d7ceb6c56b3ec3a62');
 for(const key of ['light_text','light_posters'])assert.equal(measurements[key].responses.reduce((sum,row)=>sum+row.bytes,0),measurements[key].body_bytes);
});

test('Light poster mode only assigns preview sources, including all one-frame cases; originals stay explicit',()=>{
 const f=fixture(),requests=[];f.document.createElement=tag=>{const n=new Node(tag,f.document);let src;Object.defineProperty(n,'src',{configurable:true,get:()=>src,set:value=>{src=value;requests.push(value)}});return n};
 const cards=Object.keys(projects).map(key=>{const n=new Node('article',f.document);n.dataset.lightCase=key;n.gallery=new Node('div',f.document);return n});f.document.querySelectorAll=()=>cards;
 initializeLightView(f);assert.deepEqual(requests,[]);f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');assert.equal(requests.length,9);assert(requests.every(src=>src.startsWith('assets/previews/')));
 for(const key of ['vmeste-prize','two-figure-composition','gesture']){const item=projects[key].media[0];assert(!requests.includes(item.src));assert(!requests.includes(item.poster));assert(requests.includes(lightPreview(projects[key],item)));}
 const before=requests.length;f.nodes['light-posters'].checked=false;f.nodes['light-posters'].emit('change');assert.equal(requests.length,before);
 for(const key of ['vmeste-prize','two-figure-composition','gesture']){const frame=cards.find(card=>card.dataset.lightCase===key).gallery.children[0];frame.children[4].emit('click');assert.equal(requests.at(-1),projects[key].media[0].src);if(key==='gesture'){assert.equal(frame.children[1].children[0].preload,'none');assert.equal(frame.children[1].children[0].autoplay,undefined)}}
});
test('Meeting skip recalculates the sticky header clearance after responsive reflow without changing route',()=>{
 const f=fixture();let height=78;f.document.querySelector=selector=>{assert.equal(selector,'.meeting-top');return {getBoundingClientRect:()=>({height})}};initializeMeeting(f);const stage=f.nodes['meeting-stage'],route=f.window.location.hash;
 for(height of [78,124.5,62]){f.nodes['meeting-skip'].emit('click');assert.equal(stage.style.scrollMarginTop,(Math.ceil(height)+8)+'px');assert.equal(f.document.activeElement,stage);assert(stage.scrolled);assert.equal(f.window.location.hash,route)}
});

function lightFixture(hash='#project/mascot/media/white-front',initialize=initializeLightView,collection=projects){
 const f=fixture(hash),cards=Object.keys(collection).map(key=>{const card=new Node('article',f.document);card.dataset.lightCase=key;card.gallery=new Node('div',f.document);card.append(card.gallery);return card});
 f.document.querySelectorAll=()=>cards;
 const controller=initialize(f);
 const frame=key=>cards.find(card=>card.dataset.lightCase===key).gallery.children[0];
 return {...f,controller,frame};
}
for(const [id,type] of [['white-front','IMG'],['clay-turntable','VIDEO']]){
 test(`Light unchanged route keeps manually loaded ${type}, focus and retry state`,()=>{
  const f=lightFixture('#project/mascot/media/'+id),frame=f.frame('mascot'),host=frame.children[1],load=frame.children[4];
  load.emit('click');const original=host.children[0];assert.equal(original.tagName,type);
  if(type==='VIDEO')original.focus();else load.focus();const active=f.document.activeElement;
  f.emit('popstate');f.emit('hashchange');f.emit('load');f.controller.sync(false);
  assert.equal(host.children[0],original);assert.equal(f.document.activeElement,active);
  assert.equal(original.paused,undefined);assert.equal(original.loaded,undefined);assert.equal(load.textContent,type==='VIDEO'?'Управление видео открыто':'Загружается оригинал…');
  assert.equal(f.changes.length,0);
 });
}
for(const [id,event,ready] of [['white-front','load','Оригинал загружен'],['clay-turntable','loadeddata','Управление видео открыто']]){
 test(`Light original cannot re-request ${id} until an explicit failure; focus stays put`,()=>{
  const f=lightFixture('#project/mascot/media/'+id),frame=f.frame('mascot'),host=frame.children[1],load=frame.children[4];
  load.focus();load.emit('click');const original=host.children[0];
  assert.equal(load.attrs['aria-disabled'],'true');
  load.emit('click');assert.equal(host.children[0],original);
  original.emit(event);assert.equal(load.textContent,ready);
  load.emit('click');assert.equal(host.children[0],original);assert.equal(f.document.activeElement,load);
  original.emit('error');assert.equal(load.textContent,'Повторить загрузку');assert.equal(load.attrs['aria-disabled'],'false');
  load.emit('click');assert.notEqual(host.children[0],original);assert.equal(f.document.activeElement,load);
  frame.children[0].children[2].emit('click');assert.equal(load.attrs['aria-disabled'],'false');
 });
}
test('Light browser return to an unchanged frame preserves its requested original',()=>{
 const f=lightFixture(),bear=f.frame('mascot');bear.children[4].emit('click');const original=bear.children[1].children[0];
 f.window.location.hash='#pink';f.emit('popstate');f.emit('hashchange');
 assert.equal(bear.children[1].children[0],original);
 f.window.location.hash='#project/mascot/media/white-front';f.emit('popstate');f.emit('hashchange');
 assert.equal(bear.children[1].children[0],original);assert.equal(f.changes.length,0);
});
for(const event of ['hashchange','popstate']){
 test(`Light ${event} restores focus after replacing focused video with an unloaded photo`,()=>{
  const f=lightFixture('#project/mascot/media/clay-turntable'),frame=f.frame('mascot'),host=frame.children[1];
  frame.children[4].emit('click');const video=host.children[0];video.focus();
  f.window.location.hash='#project/mascot/media/white-front';f.emit(event);
  assert.equal(f.document.activeElement,frame);assert.equal(frame.attrs.tabindex,'-1');
  assert.equal(video.paused,1);assert.equal(video.src,undefined);assert.equal(host.children.length,0);
  assert.equal(frame.children[0].children[1].textContent,'1 / 10');assert.match(frame.children[2].textContent,/Белый медведь/);
  assert.equal(frame.children[4].textContent,'Загрузить оригинал фото');
  f.emit(event);assert.equal(f.document.activeElement,frame);assert.equal(video.paused,1);
 });
 test(`Light ${event} does not move focus from stable controls or another case`,()=>{
  for(const target of ['next','load','other']){
   const f=lightFixture('#project/mascot/media/clay-turntable'),frame=f.frame('mascot');
   const focus=target==='next'?frame.children[0].children[2]:target==='load'?frame.children[4]:f.frame('pink').children[4];focus.focus();
   f.window.location.hash='#project/mascot/media/white-front';f.emit(event);
   assert.equal(f.document.activeElement,focus,target);
  }
 });
}
test('Light duplicate route events do not replace or refetch the same preview',()=>{
 const f=lightFixture(),frame=f.frame('mascot');f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');
 const first=frame.children[1].children[0];f.emit('popstate');f.emit('hashchange');assert.equal(frame.children[1].children[0],first);
 f.window.location.hash='#project/mascot/media/white-side';f.emit('popstate');const second=frame.children[1].children[0];assert.notEqual(second,first);
 assert.equal(second.src,lightPreview(projects.mascot,projects.mascot.media[1]));f.emit('hashchange');assert.equal(frame.children[1].children[0],second);
 f.nodes['light-posters'].checked=false;f.nodes['light-posters'].emit('change');assert.equal(frame.children[1].children.length,0);
});
test('Light invalid routes leave loaded media and focus intact',()=>{
 const f=lightFixture('#project/mascot/media/clay-turntable'),frame=f.frame('mascot');frame.children[4].emit('click');const video=frame.children[1].children[0];video.focus();
 f.window.location.hash='#unknown';f.emit('popstate');f.emit('hashchange');assert.equal(frame.children[1].children[0],video);assert.equal(f.document.activeElement,video);assert.equal(video.paused,undefined);
});

// A failed small poster must never turn a retry into an original-file request.
for(const [key,id] of [['mascot','white-front'],['gesture','gesture-turntable'],['vmeste-prize','vmeste-prize']])test(`Light failed preview keeps an explicit original action: ${key}`,()=>{
 const f=lightFixture('#project/'+key+'/media/'+id),frame=f.frame(key),host=frame.children[1],load=frame.children[4],item=projects[key].media.find(item=>item.src.includes('/'+id+'.'));
 f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');
 const first=host.children[0];first.emit('error');
 assert.equal(load.textContent,item.type==='video'?'Показать управление видео':'Загрузить оригинал фото');
 const retry=frame.children[5];assert(retry);assert.equal(retry.hidden,false);assert.equal(retry.textContent,'Повторить загрузку превью');
 retry.focus();retry.emit('click');const second=host.children[0];assert.notEqual(second,first);
 assert.equal(second.tagName,'IMG');assert.equal(second.src,lightPreview(projects[key],item));assert.notEqual(second.src,item.src);
 assert.equal(f.document.activeElement,retry);assert.equal(retry.hidden,false);assert.equal(retry.attrs['aria-disabled'],'true');
 retry.emit('click');assert.equal(host.children[0],second,'Pending retry cannot create a duplicate request');
 second.emit('error');assert.equal(retry.attrs['aria-disabled'],'false');assert.equal(retry.hidden,false);
 retry.emit('click');const third=host.children[0];assert.notEqual(third,second);assert.equal(third.src,first.src);
 third.emit('load');assert.equal(retry.hidden,true);assert.equal(f.document.activeElement,frame);assert.deepEqual(frame.focusOptions,{preventScroll:true});
 assert.equal(load.textContent,item.type==='video'?'Показать управление видео':'Загрузить оригинал фото');
 load.focus();load.emit('click');const original=host.children[0];assert.equal(original.src,item.src);assert.equal(original.tagName,item.type==='video'?'VIDEO':'IMG');
 assert.equal(f.document.activeElement,load);if(item.type==='video'){assert.equal(original.preload,'none');assert.equal(original.autoplay,undefined)}
 original.emit('error');assert.equal(load.textContent,'Повторить загрузку');assert.equal(retry.hidden,true);
 load.emit('click');assert.equal(host.children[0].src,item.src);
});
for(const phase of ['failed','pending'])for(const action of ['next','popstate','posters-off','original'])test(`Light ${action} clears a ${phase} preview retry and ignores obsolete events`,()=>{
 const f=lightFixture(),frame=f.frame('mascot'),host=frame.children[1],load=frame.children[4];
 f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');let old=host.children[0];old.emit('error');
 const retry=frame.children[5];assert(retry);retry.focus();if(phase==='pending'){retry.emit('click');old=host.children[0]}
 if(action==='next')frame.children[0].children[2].emit('click');
 else if(action==='popstate'){f.window.location.hash='#project/mascot/media/white-side';f.emit('popstate')}
 else if(action==='posters-off'){f.nodes['light-posters'].checked=false;f.nodes['light-posters'].emit('change')}
 else load.emit('click');
 assert(retry.hidden);assert.equal(f.document.activeElement,frame);
 const current=host.children[0],message=frame.children[3].textContent,button=load.textContent;
 old.emit('error');old.emit('load');retry.emit('click');
 assert.equal(host.children[0],current);assert.equal(frame.children[3].textContent,message);assert.equal(load.textContent,button);assert(retry.hidden);
});
test('Light successful preview retry never takes focus from another gallery',()=>{
 const f=lightFixture(),frame=f.frame('mascot'),host=frame.children[1];f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');
 host.children[0].emit('error');const retry=frame.children[5];assert(retry);retry.emit('click');
 const elsewhere=f.frame('pink').children[4];elsewhere.focus();host.children[0].emit('load');
 assert(retry.hidden);assert.equal(f.document.activeElement,elsewhere);
});
test('Light preview recovery refreshes its generated entry module URL',()=>{
 assert.match(read('light.html'),/light-view\.js[^"<>]*preview=20261115-retry/);
});

test('Light duplicate history events preserve an in-flight preview retry and focus',()=>{
 const f=lightFixture(),frame=f.frame('mascot'),host=frame.children[1];f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');
 host.children[0].emit('error');const retry=frame.children[5];retry.focus();retry.emit('click');const current=host.children[0];
 f.emit('popstate');f.emit('hashchange');f.controller.sync(false);
 assert.equal(host.children[0],current);assert.equal(f.document.activeElement,retry);assert.equal(retry.hidden,false);assert.equal(retry.attrs['aria-disabled'],'true');
 current.emit('error');assert.equal(retry.attrs['aria-disabled'],'false');
});

test('Warm light-view previews stay distinct from originals, including all RED7 photos',()=>{
 const key='red7-panels',project=warmProjects[key];
 for(const item of project.media){
  const small=warmLightPreview(project,item);
  assert.notEqual(small,item.src);assert.match(small,/red7-preview\/[^/]+\.webp$/);
  const preview=new URL('../../trifoti/warm/photos/red7-preview/'+small.split('/').at(-1),import.meta.url);
  const original=new URL('../../trifoti/warm/photos/red7/'+item.src.split('/').at(-1),import.meta.url);
  assert(readFileSync(preview).length<readFileSync(original).length*.25);
  assert.deepEqual(readFileSync(preview),readFileSync(new URL(preview.href.replace('/trifoti/warm/','/docs/trifoti/warm/'))));
 }
});
test('Warm light view retries the preview independently and preserves it across duplicate routes',()=>{
 const key='mascot',f=lightFixture(undefined,initializeWarmLightView,warmProjects),frame=f.frame(key),host=frame.children[1],load=frame.children[4];
 f.nodes['light-posters'].checked=true;f.nodes['light-posters'].emit('change');
 const initial=host.children[0];initial.emit('error');
 const retry=frame.children[5];assert(retry&&!retry.hidden);
 assert.equal(load.textContent,'Загрузить оригинал фото');
 retry.focus();retry.emit('click');const second=host.children[0];
 assert.notEqual(initial,second);assert.equal(second.src,initial.src);assert.equal(retry.attrs['aria-disabled'],'true');retry.emit('click');
 f.emit('popstate');f.emit('hashchange');assert.equal(host.children[0],second);assert.equal(f.document.activeElement,retry);
 second.emit('load');assert(retry.hidden);assert.equal(f.document.activeElement,frame);
 load.emit('click');assert.notEqual(host.children[0].src,initial.src);assert.equal(host.children[0].src,warmProjects[key].media[0].src);
});
test('Warm light entry and its source-build pin reference the new preview runtime',()=>{
 const entry=readFileSync(new URL('../../trifoti/warm/light.html',import.meta.url),'utf8');
 assert.match(entry,/light-view\.js\?[^"]*preview=20261124/);
 assert.equal(entry,readFileSync(new URL('../../docs/trifoti/warm/light.html',import.meta.url),'utf8'));
 assert.equal(readFileSync(new URL('../../trifoti/warm/light-view.js',import.meta.url),'utf8'),readFileSync(new URL('../warm/runtime/light-view.js',import.meta.url),'utf8'));
});

test('Meeting keeps opened video controls and only retries a failed resource',()=>{
 const f=fixture('#show/gesture/0');initializeMeeting(f);
 const load=f.nodes['meeting-load'],host=f.nodes['meeting-media'];load.focus();load.emit('click');
 const video=host.children[0];assert.equal(video.tagName,'VIDEO');assert.equal(load.attrs['aria-disabled'],'true');
 assert.equal(load.textContent,'Управление видео открыто');assert.equal(f.document.activeElement,load);
 load.emit('click');f.emit('keydown',{key:'ArrowRight'});assert.equal(host.children[0],video);assert.equal(video.paused,undefined);assert.equal(f.changes.length,0);
 video.emit('error');assert.equal(load.attrs['aria-disabled'],undefined);assert.equal(load.textContent,'Повторить загрузку');
 load.emit('click');const retry=host.children[0];assert.notEqual(retry,video);assert.equal(retry.tagName,'VIDEO');assert.equal(video.paused,1);
 assert.equal(load.attrs['aria-disabled'],'true');video.emit('error');assert.equal(load.attrs['aria-disabled'],'true');
});
test('Meeting retries a failed photo without replacing a healthy retry',()=>{
 const f=fixture('#show/pink/0');initializeMeeting(f);
 const load=f.nodes['meeting-load'],host=f.nodes['meeting-media'];
 assert(load.hidden);host.children[0].emit('error');assert(!load.hidden);load.emit('click');const retry=host.children[0];
 assert.equal(load.textContent,'Загрузка изображения…');load.emit('click');assert.equal(host.children[0],retry);
 retry.emit('load');assert.equal(load.textContent,'Изображение загружено');assert.equal(load.attrs['aria-disabled'],'true');
 f.nodes['meeting-next'].emit('click');assert(load.hidden);assert.equal(load.attrs['aria-disabled'],undefined);
});

test('Each full-catalog case link identifies its project in a screen-reader link list',()=>{
 const label='Полный кейс: все фото, видео и подписи';
 const links=[...outputs.get('catalog.html').matchAll(/href="([^"]+)"[^>]*>(Полный кейс: все фото, видео и подписи)<span class="sr-only"> — (.+?) — новая вкладка<\/span>/g)];
 assert.equal(links.length,Object.keys(projects).length);
 assert.equal(new Set(links.map(([, , ,title])=>title)).size,links.length);
 for(const [key,project] of Object.entries(projects)){
  const entry=links.find(([,url])=>url.endsWith('/'+casePath(key)));
  assert.equal(entry?.[2],label);
  assert.equal(entry?.[3],project.title.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;'));
 }
});
