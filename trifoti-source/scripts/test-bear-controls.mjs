import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const code=readFileSync(new URL('../dist/bear-video.js',import.meta.url),'utf8');
class Element extends EventTarget{
 constructor(){super();this.hidden=false;this.dataset={};this.attrs={};this.textContent='';this.src='';this.srcWrites=[];this.classList={add(){},remove(){}};this.clientWidth=400}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='src'){this.src=String(v);this.srcWrites.push(this.src)}}
 getAttribute(k){return this.attrs[k]??null}
 setPointerCapture(){}
}
function setup(reduce=false,options={}){
 const els=Object.fromEntries(['bear-stage','bear-video','bear-gif','rotate-toggle','bear-reset','bear-keyboard-help','drag-hint'].map(id=>[id,new Element()]));
 const doc=new EventTarget();doc.hidden=false;doc.getElementById=id=>els[id];doc.querySelector=()=>els['drag-hint'];
 const pref=new EventTarget();pref.matches=reduce;
 const v=els['bear-video'];v.duration=8.8;v.currentTime=0;v.paused=true;v.playCalls=0;v.pause=()=>{v.paused=true};v.play=()=>{v.playCalls++;v.paused=false;return options.play?options.play():Promise.resolve()};
 v.readyState=options.readyState??0;v.networkState=options.networkState??2;v.error=options.error??null;
 const sources=[new Element(),new Element()];v.querySelectorAll=()=>sources;
 const timers=new Map();let timerId=0;
 const connection=new EventTarget();connection.saveData=options.saveData??false;let observerCallback,observed;
 const Observer=options.observer?class{constructor(callback,config){if(options.observerThrows)throw Error('unavailable');observerCallback=callback;assert.equal(config.threshold,0)}observe(target){observed=target}}:undefined;
 vm.runInNewContext(code,{document:doc,navigator:{connection},IntersectionObserver:Observer,matchMedia:()=>pref,setTimeout:fn=>{timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)});
 const fire=(el,type,props={})=>{const e=new Event(type,{cancelable:true});for(const [k,value]of Object.entries(props))Object.defineProperty(e,k,{value});el.dispatchEvent(e);return e};
 return {els,doc,v,fire,pref,sources,timers,intersect:value=>{assert.equal(observed,els['bear-stage']);observerCallback([{target:observed,isIntersecting:value}])},saveData:value=>{connection.saveData=value;fire(connection,'change')},flush:()=>{const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn())},click:()=>fire(els['rotate-toggle'],'click'),reduce:value=>{pref.matches=value;fire(pref,'change',{matches:value})},visibility:hidden=>{doc.hidden=hidden;fire(doc,'visibilitychange')}};
}
test('visible initial video plays; initial reduced motion stays paused',()=>{assert.equal(setup().v.paused,false);const s=setup(true);assert.equal(s.v.paused,true);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false')});
test('enabling reduced motion while open pauses, disabling it does not restart',()=>{const s=setup();s.reduce(true);assert.equal(s.v.paused,true);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false');s.reduce(false);assert.equal(s.v.paused,true)});
test('explicit play remains possible under reduced motion and manual pause survives tab changes',()=>{const s=setup(true);s.click();assert.equal(s.v.paused,false);s.click();s.visibility(true);s.visibility(false);assert.equal(s.v.paused,true)});
test('video pauses in hidden tab and only resumes the existing play intent',()=>{const s=setup();s.visibility(true);assert.equal(s.v.paused,true);s.visibility(false);assert.equal(s.v.paused,false);s.visibility(true);s.reduce(true);s.visibility(false);assert.equal(s.v.paused,true)});
test('Explicit GIF playback stops in hidden tab and resumes only if not manually paused',()=>{const s=setup();s.fire(s.v,'error');assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.click();assert.match(s.els['bear-gif'].src,/\.gif$/);s.visibility(true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.visibility(false);assert.match(s.els['bear-gif'].src,/\.gif$/);s.click();s.visibility(true);s.visibility(false);assert.match(s.els['bear-gif'].src,/poster\.webp$/)});
test('Explicit GIF playback also respects reduced motion changes',()=>{const s=setup();s.fire(s.v,'error');s.click();assert.match(s.els['bear-gif'].src,/\.gif$/);s.reduce(true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert.match(s.els['bear-keyboard-help'].textContent,/Пробел/)});
test('Space and Enter toggle playback without scrolling or repeat flicker',()=>{const s=setup();const stage=s.els['bear-stage'];assert(s.fire(stage,'keydown',{key:' '}).defaultPrevented);assert.equal(s.v.paused,true);s.fire(stage,'keydown',{key:' ',repeat:true});assert.equal(s.v.paused,true);s.fire(stage,'keydown',{key:'Enter'});assert.equal(s.v.paused,false)});
test('arrow scrubbing pauses and wraps around the clip',()=>{const s=setup();s.fire(s.els['bear-stage'],'keydown',{key:'ArrowLeft'});assert.equal(s.v.paused,true);assert(Math.abs(s.v.currentTime-8.6)<.001);s.fire(s.els['bear-stage'],'keydown',{key:'ArrowRight'});assert(Math.abs(s.v.currentTime)<.001)});
test('non-primary pointer does not pause or scrub the bear',()=>{const s=setup();s.fire(s.els['bear-stage'],'pointerdown',{button:2,isPrimary:true,clientX:50,pointerId:1});assert.equal(s.v.paused,false)});
test('reduced motion switched on during drag prevents automatic resume',()=>{const s=setup();const stage=s.els['bear-stage'];s.fire(stage,'pointerdown',{button:0,isPrimary:true,clientX:50,pointerId:1});assert.equal(s.v.paused,true);s.reduce(true);s.fire(stage,'pointerup');assert.equal(s.v.paused,true)});
test('restart returns to first frame and stays paused',()=>{const s=setup();s.v.currentTime=4;s.fire(s.els['bear-reset'],'click');assert.equal(s.v.currentTime,0);assert.equal(s.v.paused,true)});
test('a failed play request updates the control state',async()=>{const s=setup(true);s.v.play=()=>Promise.reject(new Error('blocked'));s.click();await new Promise(setImmediate);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false')});
test('outdated play rejection does not override a newer user choice',async()=>{const s=setup(true);let reject;s.v.play=()=>new Promise((_,r)=>{reject=r});s.click();s.click();s.v.play=()=>Promise.resolve();s.click();reject(new Error('old blocked request'));await new Promise(setImmediate);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'true')});

test('one failed source keeps the second format available',()=>{const s=setup();s.fire(s.sources[0],'error');s.flush();assert.equal(s.v.hidden,false);assert.notEqual(s.els['bear-stage'].dataset.renderer,'gif')});
test('Two failed formats show a poster without any GIF request until explicit play',()=>{
 const s=setup();s.fire(s.sources[0],'error');s.fire(s.sources[1],'error');
 assert.equal(s.v.hidden,true);assert.equal(s.els['bear-gif'].hidden,false);assert.equal(s.els['bear-stage'].dataset.renderer,'gif');
 assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert(s.els['bear-gif'].srcWrites.every(src=>!src.endsWith('.gif')));
 assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false');assert.match(s.els['drag-hint'].textContent,/Запустить анимацию/);assert.equal(s.timers.size,0);
 s.click();assert.match(s.els['bear-gif'].src,/\.gif$/);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'true');
});
test('duplicate errors from one source do not count as both formats',()=>{const s=setup();s.fire(s.sources[0],'error');s.fire(s.sources[0],'error');assert.equal(s.timers.size,1);s.flush();assert.equal(s.v.hidden,false);assert.equal(s.timers.size,0)});
test('exhaustion before dynamic module is recovered only after a deferred state recheck',()=>{const s=setup(false,{networkState:3});assert.equal(s.v.hidden,false);assert.equal(s.timers.size,1);s.flush();assert.equal(s.v.hidden,true);assert.equal(s.timers.size,0);assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert(s.els['bear-gif'].srcWrites.every(src=>!src.endsWith('.gif')))});
test('transient startup NO_SOURCE does not replace a newly loading or ready video',()=>{for(const state of [1,2]){const s=setup(false,{networkState:3});s.v.networkState=state;s.flush();assert.equal(s.v.hidden,false)}const s=setup(false,{networkState:3});s.v.readyState=2;s.flush();assert.equal(s.v.hidden,false)});
test('a missed first error plus a later exhausted second source still recovers',()=>{const s=setup();s.v.networkState=3;s.fire(s.sources[1],'error');assert.equal(s.v.hidden,false);s.flush();assert.equal(s.v.hidden,true)});
test('healthy second format wins over stale source errors and pending startup check',()=>{const s=setup(false,{networkState:3});s.fire(s.sources[0],'error');s.v.readyState=2;s.v.networkState=1;s.fire(s.v,'loadeddata');s.fire(s.sources[1],'error');s.flush();assert.equal(s.v.hidden,false);assert.equal(s.els['bear-stage'].dataset.renderer,'video')});
test('initial empty, idle and loading states are not failure signals',()=>{for(const networkState of [0,1,2]){const s=setup(false,{networkState});assert.equal(s.timers.size,0);s.flush();assert.equal(s.v.hidden,false)}});
test('already loaded media is marked as video without waiting for another event',()=>{const s=setup(false,{readyState:4,networkState:1});assert.equal(s.els['bear-stage'].dataset.renderer,'video');assert.equal(s.v.hidden,false)});
test('a fatal video error already present at startup activates a poster without requesting GIF',()=>{for(const reduce of [false,true])for(const errorCode of [2,3,4]){const s=setup(reduce,{error:{code:errorCode}});assert.equal(s.v.hidden,true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert(s.els['bear-gif'].srcWrites.every(src=>!src.endsWith('.gif')));assert.equal(s.els['bear-stage'].attrs['aria-keyshortcuts'],'Space Enter')}});
test('an earlier explicit media abort does not activate fallback',()=>{const s=setup(true,{error:{code:1},networkState:0});assert.equal(s.v.hidden,false);assert.equal(s.timers.size,0)});
test('fallback transition is idempotent and late media events cannot override explicit GIF playback',()=>{const s=setup();s.fire(s.sources[0],'error');s.fire(s.sources[1],'error');s.click();s.fire(s.v,'error');s.fire(s.sources[1],'error');s.v.readyState=4;s.fire(s.v,'loadeddata');s.flush();assert.equal(s.els['bear-stage'].dataset.renderer,'gif');assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'true');assert.match(s.els['bear-gif'].src,/\.gif$/)});
test('source fallback preserves reduced motion, explicit pause and visibility rules',()=>{const reduced=setup(true);reduced.fire(reduced.sources[0],'error');reduced.fire(reduced.sources[1],'error');assert.match(reduced.els['bear-gif'].src,/poster\.webp$/);reduced.click();assert.match(reduced.els['bear-gif'].src,/\.gif$/);reduced.visibility(true);assert.match(reduced.els['bear-gif'].src,/poster\.webp$/);reduced.visibility(false);assert.match(reduced.els['bear-gif'].src,/\.gif$/);reduced.click();reduced.visibility(true);reduced.visibility(false);assert.match(reduced.els['bear-gif'].src,/poster\.webp$/)});
test('early exhaustion under reduced motion shows a static fallback with correct shortcuts',()=>{const s=setup(true,{networkState:3});s.flush();assert.equal(s.v.hidden,true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert.equal(s.els['bear-stage'].attrs['aria-keyshortcuts'],'Space Enter');assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false')});
test('pause or hidden state before source failures cannot authorize GIF playback when the tab returns',()=>{for(const paused of [true,false]){const s=setup();if(paused)s.click();else s.visibility(true);s.fire(s.sources[0],'error');s.fire(s.sources[1],'error');assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.visibility(false);assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert(s.els['bear-gif'].srcWrites.every(src=>!src.endsWith('.gif')))}});
test('autoplay denial alone does not hide a playable format or trigger fallback',async()=>{const error=new Error('autoplay denied');error.name='NotAllowedError';const s=setup(false,{readyState:4,networkState:1,play:()=>Promise.reject(error)});await new Promise(setImmediate);s.flush();assert.equal(s.v.hidden,false);assert.equal(s.els['bear-stage'].dataset.renderer,'video');assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false')});
test('source fallback exposes only supported keyboard shortcuts and reset stays paused',()=>{const s=setup();s.fire(s.sources[0],'error');s.fire(s.sources[1],'error');assert.equal(s.els['bear-stage'].attrs['aria-keyshortcuts'],'Space Enter');assert.equal(s.fire(s.els['bear-stage'],'keydown',{key:'ArrowRight'}).defaultPrevented,false);s.fire(s.els['bear-reset'],'click');assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false');assert.match(s.els['bear-gif'].src,/poster\.webp$/)});
test('late rejected video play cannot pause the explicitly enabled fallback',async()=>{let reject;const s=setup(false,{play:()=>new Promise((_,r)=>{reject=r})});s.fire(s.sources[0],'error');s.fire(s.sources[1],'error');s.click();reject(new Error('old media failed'));await new Promise(setImmediate);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'true');assert.match(s.els['bear-gif'].src,/\.gif$/)});
test('a new load attempt clears previously counted source errors',()=>{const s=setup();s.fire(s.sources[0],'error');s.fire(s.v,'loadstart');s.fire(s.sources[1],'error');s.flush();assert.equal(s.v.hidden,false)});
test('fallback during drag cancels release-based playback and never fetches GIF automatically',()=>{for(const reduce of [true,false]){const s=setup();s.fire(s.els['bear-stage'],'pointerdown',{button:0,isPrimary:true,clientX:20,pointerId:1});s.fire(s.v,'error');assert.match(s.els['bear-gif'].src,/poster\.webp$/);if(reduce)s.reduce(true);s.fire(s.els['bear-stage'],'pointerup');assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false');assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert(s.els['bear-gif'].srcWrites.every(src=>!src.endsWith('.gif')))}});
test('App, bear module and stylesheet retain their current release URLs',()=>{const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');assert.match(html,/app\.js\?v=20261026-trust/);assert.match(app,/bear-video\.js\?v=20261024-ux25/);assert.match(html,/style\.css\?v=20261026-trust/)});

test('Observer waits for the first visible entry, then pauses offscreen without losing play intent',()=>{
 const s=setup(false,{observer:true});assert.equal(s.v.paused,true);assert.equal(s.v.playCalls,0);
 s.intersect(false);assert.equal(s.v.playCalls,0);s.intersect(true);assert.equal(s.v.paused,false);
 s.v.currentTime=3;s.intersect(false);assert.equal(s.v.paused,true);assert.equal(s.v.currentTime,3);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'true');
 s.intersect(true);assert.equal(s.v.paused,false);assert.equal(s.v.currentTime,3);
 const calls=s.v.playCalls;s.intersect(true);assert.equal(s.v.playCalls,calls);
});
test('Viewport reentry never overrides manual pause, reset, hidden document or reduced motion',()=>{
 for(const action of [s=>s.click(),s=>s.fire(s.els['bear-reset'],'click'),s=>s.reduce(true),s=>s.visibility(true)]){
  const s=setup(false,{observer:true});s.intersect(true);action(s);s.intersect(false);s.intersect(true);assert.equal(s.v.paused,true);
 }
 const s=setup(true,{observer:true});s.intersect(true);assert.equal(s.v.paused,true);s.click();assert.equal(s.v.paused,false);s.intersect(false);s.intersect(true);assert.equal(s.v.paused,false);
});
test('Explicit play while offscreen waits for viewport and tab visibility; pause cancels it',()=>{
 const s=setup(true,{observer:true});s.click();assert.equal(s.v.paused,true);s.visibility(true);s.intersect(true);assert.equal(s.v.paused,true);s.visibility(false);assert.equal(s.v.paused,false);
 s.intersect(false);s.click();s.intersect(true);assert.equal(s.v.paused,true);
});
test('GIF fallback uses its static poster offscreen and resumes only existing intent',()=>{
 const s=setup(false,{observer:true});s.intersect(true);s.fire(s.v,'error');assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.intersect(false);s.intersect(true);assert(s.els['bear-gif'].srcWrites.every(src=>!src.endsWith('.gif')));s.click();assert.match(s.els['bear-gif'].src,/\.gif$/);s.intersect(false);assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.intersect(true);assert.match(s.els['bear-gif'].src,/\.gif$/);s.click();s.intersect(false);s.intersect(true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);
});
test('Save-Data suppresses initial autoplay and newly enabled mode cancels resume intent',()=>{
 const s=setup(false,{observer:true,saveData:true});s.intersect(true);assert.equal(s.v.paused,true);s.saveData(false);s.intersect(false);s.intersect(true);assert.equal(s.v.paused,true);
 s.click();assert.equal(s.v.paused,false);s.intersect(false);s.saveData(true);s.intersect(true);assert.equal(s.v.paused,true);
 s.click();assert.equal(s.v.paused,false);
});
test('Save-Data never starts a fallback; explicit play waits until visible and renewed saving cancels it',()=>{
 const s=setup(false,{observer:true,saveData:true});s.fire(s.sources[0],'error');s.fire(s.sources[1],'error');s.intersect(true);
 assert(s.els['bear-gif'].srcWrites.every(src=>!src.endsWith('.gif')));
 s.intersect(false);s.click();assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.intersect(true);assert.match(s.els['bear-gif'].src,/\.gif$/);
 s.saveData(false);s.saveData(true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.saveData(false);s.intersect(false);s.intersect(true);
 assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false');
});
test('Fallback supports explicit keyboard play and pause without restarting on key repeat',()=>{
 const s=setup();s.fire(s.v,'error');const stage=s.els['bear-stage'];
 assert(s.fire(stage,'keydown',{key:'Enter'}).defaultPrevented);assert.match(s.els['bear-gif'].src,/\.gif$/);
 s.fire(stage,'keydown',{key:'Enter',repeat:true});assert.match(s.els['bear-gif'].src,/\.gif$/);
 assert(s.fire(stage,'keydown',{key:' '}).defaultPrevented);assert.match(s.els['bear-gif'].src,/poster\.webp$/);
});
test('Unsupported or failed observer retains existing visibility and explicit pause behavior',()=>{
 for(const options of [{},{observer:true,observerThrows:true}]){const s=setup(false,options);assert.equal(s.v.paused,false);s.visibility(true);assert.equal(s.v.paused,true);s.visibility(false);assert.equal(s.v.paused,false);s.click();s.visibility(true);s.visibility(false);assert.equal(s.v.paused,true)}
});
test('A stale play rejection after viewport pause cannot clear the preserved intent',async()=>{
 let reject;const s=setup(false,{observer:true,play:()=>new Promise((_,r)=>reject=r)});s.intersect(true);s.intersect(false);reject(Error('stale'));await new Promise(setImmediate);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'true');assert.equal(s.v.paused,true);
});
