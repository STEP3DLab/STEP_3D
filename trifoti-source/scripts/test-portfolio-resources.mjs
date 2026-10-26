import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
import {portfolioOutputs,casePath} from './render-portfolio-resources.mjs';
import {createMediaSlot} from '../dist/portfolio-media.js';
import {initializeLightView,lightPreview} from '../dist/light-view.js';
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
 assert.match(html,/meta name="twitter:image:alt"/);assert.doesNotMatch(html,/<script/);
});
test('Catalog includes all six cases with exact descriptions, covers, citations and no video payload',()=>{
 const html=outputs.get('catalog.html');assert.equal((html.match(/class="catalog-case"/g)||[]).length,6);assert.doesNotMatch(html,/<video/);
 for(const [key,p] of Object.entries(projects)){assert(html.includes(p.description));assert(html.includes(p.attribution||p.type));assert(html.includes(p.media[0].poster||p.media[0].src));assert(html.includes(casePath(key)));for(const source of p.sources||[])assert(html.includes(source.url));}
 const css=read('portfolio-resources.css');assert.match(css,/@page\{size:A4/);assert.match(css,/break-before:page/);assert.match(css,/attr\(href\)/);assert.match(css,/height:auto;max-height:none;overflow:visible/);
 assert.equal(read('catalog.js').match(/window.print\(\)/g).length,1);
});
test('Text-only lightweight markup requests no media, fonts, app or bear and retains 25 original links',()=>{
 const html=outputs.get('light.html');assert.doesNotMatch(html,/<img|<video|<source|preload|app\.js|bear-video/);
 assert.equal((html.match(/data-light-case=/g)||[]).length,6);
 for(const p of Object.values(projects))for(const item of p.media)assert(html.includes('href="https://step3dlab.github.io/STEP_3D/trifoti/'+item.src+'"'));
 assert.match(html,/index.html#brief-form/);assert.match(html,/index.html#project\//);
 for(const file of ['portfolio-media.js','light-view.js','meeting.js'])assert.doesNotMatch(read(file),/localStorage|sessionStorage|fetch\(|sendBeacon|setInterval|autoplay\s*=/);
});
test('Existing six cards now fall back to generated pages; original hash navigation remains',()=>{
 const html=read('index.html'),app=read('app.js');for(const key of Object.keys(projects))assert(html.includes('href="'+casePath(key)+'"'));
 assert.match(html,/href="light.html"/);assert.match(html,/href="catalog.html"/);assert.match(app,/caseNavigation\.open\(card\.dataset\.project\)/);
 assert.match(read('exploration-panel.js'),/meeting\.hidden=!selected.length/);assert(read('exploration-panel.js').includes("meeting.href='meeting.html#show/'"));
});
test('Meeting route validates and limits IDs, clamps frames and never embeds arbitrary text',()=>{
 assert.deepEqual(meetingRoute('#show/mascot,stdAwards,gesture,pink/99'),{ids:['mascot','stdAwards','gesture'],index:13});
 assert.equal(meetingFrames(['mascot','stdAwards']).length,13);
 for(const hash of ['',null,'#show/__proto__,constructor/0','#show/pink/-1','#show/pink/999','#show/'+ 'x'.repeat(200)+'/0'])assert.deepEqual(meetingRoute(hash),{ids:[],index:0});
 assert.equal(meetingHash(['pink'],99),'#show/pink/1');assert.equal(meetingHash(['wrong'],0),'');
 assert.equal(meetingHash(['pink'],NaN),'#show/pink/0');assert.equal(meetingHash(['pink'],-1),'#show/pink/0');
});
class Node{
 constructor(tag='div',doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.attrs={};this.listeners={};this.hidden=false;this.disabled=false;this.textContent='';this.value='';this.checked=false;this.dataset={};}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)}
 emit(type,extra={}){const event={button:0,key:'',target:this,preventDefault(){this.defaultPrevented=true},...extra};for(const fn of this.listeners[type]||[])fn(event);return event}
 append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node)}}
 replaceChildren(...nodes){for(const n of this.children)n.parent=null;this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attrs[k]=v} removeAttribute(k){delete this.attrs[k];if(k==='src')delete this.src}
 focus(){this.doc.activeElement=this} scrollIntoView(){this.scrolled=true} pause(){this.paused=(this.paused||0)+1}load(){this.loaded=(this.loaded||0)+1}
 closest(selector){return selector.includes('video')&&['VIDEO','INPUT','TEXTAREA','SELECT'].includes(this.tagName)?this:null}
 contains(other){return other===this||this.children.some(n=>n.contains(other))}
 click(){this.clicks=(this.clicks||0)+1;this.emit('click')}
 querySelector(selector){return selector==='[data-light-gallery]'?this.gallery:null}
}
function fixture(hash='#show/mascot,gesture/0'){
 const nodes={},listeners={},changes=[];const document={hidden:false,activeElement:null,createElement:tag=>new Node(tag,document),getElementById:id=>nodes[id],addEventListener(type,fn){(listeners[type]??=[]).push(fn)},querySelectorAll(){return []}};
 for(const id of ['meeting-player','meeting-media','meeting-media-status','meeting-load','meeting-case','meeting-exit','meeting-title','meeting-direction','meeting-caption','meeting-credit','meeting-counter','meeting-case-link','meeting-sources','meeting-prev','meeting-next','meeting-empty','meeting-skip','meeting-stage','light-posters','light-mode'])nodes[id]=new Node(id==='meeting-case'?'select':id==='light-posters'?'input':id.endsWith('-next')||id.endsWith('-prev')||id.endsWith('-load')?'button':'div',document);
 const window={location:{hash},history:{state:{existing:true},replaceState(state,_,hash){changes.push([state,hash]);window.location.hash=hash}},addEventListener(type,fn){(listeners[type]??=[]).push(fn)}};
 return {document,window,nodes,changes,emit(type,event={}){for(const fn of listeners[type]||[])fn({target:nodes['meeting-next'],preventDefault(){this.defaultPrevented=true},...event})}};
}
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
test('Final measured lightweight responses byte-match the candidate runtime files',()=>{
 const measurements=JSON.parse(readFileSync(new URL('./lightweight-measurements.json',import.meta.url),'utf8'));
 for(const key of ['light_text','light_posters'])for(const row of measurements[key].responses){const path=row.path.slice(1).split('?')[0];assert.equal(readFileSync(new URL(path,root)).byteLength,row.bytes,path);}
});
