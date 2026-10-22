import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {test} from 'node:test';
const code=readFileSync(new URL('../dist/bear-video.js',import.meta.url),'utf8');
class Element extends EventTarget{
 constructor(){super();this.hidden=false;this.dataset={};this.attrs={};this.textContent='';this.src='';this.classList={add(){},remove(){}};this.clientWidth=400}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='src')this.src=String(v)}
 getAttribute(k){return this.attrs[k]??null}
 setPointerCapture(){}
}
function setup(reduce=false){
 const els=Object.fromEntries(['bear-stage','bear-video','bear-gif','rotate-toggle','bear-reset','bear-keyboard-help','drag-hint'].map(id=>[id,new Element()]));
 const doc=new EventTarget();doc.hidden=false;doc.getElementById=id=>els[id];doc.querySelector=()=>els['drag-hint'];
 const pref=new EventTarget();pref.matches=reduce;
 const v=els['bear-video'];v.duration=8.8;v.currentTime=0;v.paused=true;v.playCalls=0;v.pause=()=>{v.paused=true};v.play=()=>{v.playCalls++;v.paused=false;return Promise.resolve()};
 vm.runInNewContext(code,{document:doc,matchMedia:()=>pref});
 const fire=(el,type,props={})=>{const e=new Event(type,{cancelable:true});for(const [k,value]of Object.entries(props))Object.defineProperty(e,k,{value});el.dispatchEvent(e);return e};
 return {els,doc,v,fire,pref,click:()=>fire(els['rotate-toggle'],'click'),reduce:value=>{pref.matches=value;fire(pref,'change',{matches:value})},visibility:hidden=>{doc.hidden=hidden;fire(doc,'visibilitychange')}};
}
test('visible initial video plays; initial reduced motion stays paused',()=>{assert.equal(setup().v.paused,false);const s=setup(true);assert.equal(s.v.paused,true);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false')});
test('enabling reduced motion while open pauses, disabling it does not restart',()=>{const s=setup();s.reduce(true);assert.equal(s.v.paused,true);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false');s.reduce(false);assert.equal(s.v.paused,true)});
test('explicit play remains possible under reduced motion and manual pause survives tab changes',()=>{const s=setup(true);s.click();assert.equal(s.v.paused,false);s.click();s.visibility(true);s.visibility(false);assert.equal(s.v.paused,true)});
test('video pauses in hidden tab and only resumes the existing play intent',()=>{const s=setup();s.visibility(true);assert.equal(s.v.paused,true);s.visibility(false);assert.equal(s.v.paused,false);s.visibility(true);s.reduce(true);s.visibility(false);assert.equal(s.v.paused,true)});
test('GIF fallback stops in hidden tab and resumes only if not manually paused',()=>{const s=setup();s.fire(s.v,'error');assert.match(s.els['bear-gif'].src,/\.gif$/);s.visibility(true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);s.visibility(false);assert.match(s.els['bear-gif'].src,/\.gif$/);s.click();s.visibility(true);s.visibility(false);assert.match(s.els['bear-gif'].src,/poster\.webp$/)});
test('GIF fallback also respects reduced motion changes',()=>{const s=setup();s.fire(s.v,'error');s.reduce(true);assert.match(s.els['bear-gif'].src,/poster\.webp$/);assert.match(s.els['bear-keyboard-help'].textContent,/Пробел/)});
test('Space and Enter toggle playback without scrolling or repeat flicker',()=>{const s=setup();const stage=s.els['bear-stage'];assert(s.fire(stage,'keydown',{key:' '}).defaultPrevented);assert.equal(s.v.paused,true);s.fire(stage,'keydown',{key:' ',repeat:true});assert.equal(s.v.paused,true);s.fire(stage,'keydown',{key:'Enter'});assert.equal(s.v.paused,false)});
test('arrow scrubbing pauses and wraps around the clip',()=>{const s=setup();s.fire(s.els['bear-stage'],'keydown',{key:'ArrowLeft'});assert.equal(s.v.paused,true);assert(Math.abs(s.v.currentTime-8.6)<.001);s.fire(s.els['bear-stage'],'keydown',{key:'ArrowRight'});assert(Math.abs(s.v.currentTime)<.001)});
test('non-primary pointer does not pause or scrub the bear',()=>{const s=setup();s.fire(s.els['bear-stage'],'pointerdown',{button:2,isPrimary:true,clientX:50,pointerId:1});assert.equal(s.v.paused,false)});
test('reduced motion switched on during drag prevents automatic resume',()=>{const s=setup();const stage=s.els['bear-stage'];s.fire(stage,'pointerdown',{button:0,isPrimary:true,clientX:50,pointerId:1});assert.equal(s.v.paused,true);s.reduce(true);s.fire(stage,'pointerup');assert.equal(s.v.paused,true)});
test('restart returns to first frame and stays paused',()=>{const s=setup();s.v.currentTime=4;s.fire(s.els['bear-reset'],'click');assert.equal(s.v.currentTime,0);assert.equal(s.v.paused,true)});
test('a failed play request updates the control state',async()=>{const s=setup(true);s.v.play=()=>Promise.reject(new Error('blocked'));s.click();await new Promise(setImmediate);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'false')});
test('outdated play rejection does not override a newer user choice',async()=>{const s=setup(true);let reject;s.v.play=()=>new Promise((_,r)=>{reject=r});s.click();s.click();s.v.play=()=>Promise.resolve();s.click();reject(new Error('old blocked request'));await new Promise(setImmediate);assert.equal(s.els['rotate-toggle'].attrs['aria-pressed'],'true')});
