import {mediaId} from '../dist/exploration-data.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameMemory,thumbnailKey,mountPhotoSwipe} from '../dist/gallery-interactions.js';
import {galleryArrow} from '../dist/dialog-controls.js';
import {watchGalleryMedia} from '../dist/media-recovery.js';
function swipe(){const handlers={},steps=[];let enabled=true;mountPhotoSwipe({viewer:{addEventListener(type,fn,options){assert.equal(options.passive,true);handlers[type]=fn}},onStep:s=>steps.push(s),isEnabled:()=>enabled});return{steps,disable(){enabled=false},fire(type,{x=0,y=0,n=1,tag='IMG',time=0,...rest}={}){const touch={clientX:x,clientY:y};handlers[type]({touches:type==='touchend'?[]:Array(n).fill(touch),changedTouches:[touch],target:{tagName:tag},timeStamp:time,...rest})}}}
for(const [dx,step] of [[-90,1],[90,-1]])test(`Horizontal photo swipe ${dx} changes one frame`,()=>{const f=swipe();f.fire('touchstart');f.fire('touchend',{x:dx,y:10,time:300});f.fire('touchend',{x:dx,time:400});assert.deepEqual(f.steps,[step])});
for(const kind of ['vertical','pinch','video','cancel','short','slow','disabled','remaining-touch'])test(`Swipe ignores ${kind}`,()=>{const f=swipe();f.fire('touchstart',{tag:kind==='video'?'VIDEO':'IMG'});if(kind==='vertical')f.fire('touchmove',{x:5,y:35});if(kind==='pinch')f.fire('touchmove',{n:2});if(kind==='cancel')f.fire('touchcancel');if(kind==='disabled')f.disable();f.fire('touchend',{x:kind==='short'?20:-90,y:kind==='vertical'?100:0,time:kind==='slow'?1000:300,...(kind==='remaining-touch'?{touches:[{}]}:{})});assert.deepEqual(f.steps,[])});
test('Thumbnail wrap, boundaries, modifiers and Tab',()=>{for(const [key,index,expected] of [['ArrowLeft',0,9],['ArrowRight',9,0],['Home',5,0],['End',5,9],['Tab',5,null]])assert.equal(thumbnailKey({key},index,10),expected);assert.equal(thumbnailKey({key:'ArrowRight',ctrlKey:true},5,10),null)});
test('Consumed thumbnail key cannot trigger global gallery arrows',()=>{const e={key:'ArrowRight',target:{closest:()=>null}};assert.equal(thumbnailKey(e,2,10),3);e.defaultPrevented=true;assert.equal(galleryArrow(e),0)});
test('Frame memory is independent, validated and ephemeral',()=>{const m=createFrameMemory();m.remember('bear',8);m.remember('cup',2);assert.equal(m.recall('bear',10),8);assert.equal(m.recall('cup',3),2);assert.equal(m.recall('bear',4),0);m.remember('bear',-1);assert.equal(m.recall('bear',10),8);assert.equal(createFrameMemory().recall('bear',10),0)});
function waitMedia(type='image'){let callback,canceled=0,current=true;const media=new EventTarget(),status={textContent:''},retry={setAttribute(){}};const dispose=watchGalleryMedia({media,type,viewer:{setAttribute(){}},status,retry,announcement:{},document:{},isCurrent:()=>current,onRetry(){},schedule(fn,delay){assert.equal(delay,500);callback=fn;return 12},cancel(id){assert.equal(id,12);canceled++}});return{status,dispose,get canceled(){return canceled},late(){current=false},tick(){callback()},fire(name){media.dispatchEvent(new Event(name))}}}
for(const type of ['image','video'])test(`${type} delayed wait clears on completion`,()=>{const f=waitMedia(type);assert.equal(f.status.textContent,'');f.tick();assert.match(f.status.textContent,/Загружаем/);assert.doesNotMatch(f.status.textContent,/%/);f.fire(type==='video'?'loadedmetadata':'load');assert.equal(f.status.textContent,'');assert.equal(f.canceled,1);f.tick();assert.equal(f.status.textContent,'')});
for(const state of ['load','error','disposed','stale'])test(`Delayed callback cannot override ${state}`,()=>{const f=waitMedia();if(state==='disposed')f.dispose();else if(state==='stale')f.late();else f.fire(state);const status=f.status.textContent;f.tick();assert.equal(f.status.textContent,status)});

// Exercise the real slide renderer, not a second implementation of its state updates.
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
test('Real slide renderer remembers photo/video, sets one thumbnail Tab stop, cancels old media and never autoplays',()=>{
 const memory=createFrameMemory(),nodes=new Map();let cleanups=0,paused=0;
 const thumbs=projects.mascot.media.map(()=>({classList:{toggle(){}},setAttribute(){}}));
 const viewer={children:[],replaceChildren(){this.children=[]},append(media){this.children.push(media)},isConnected:true};
 for(const id of ['gallery-caption','gallery-counter','gallery-announcement','gallery-status','gallery-retry','gallery-photo-link'])nodes.set(id,{});
 nodes.set('gallery-viewer',viewer);nodes.set('gallery-thumbnails',{children:thumbs,scrollWidth:0,clientWidth:100});
 const context={mediaId,caseNavigation:{frame(){}},projects,galleryProject:'mascot',galleryIndex:0,slideRevision:0,projectDialog:{open:true},frameMemory:memory,
  clearMediaWait(){cleanups++},document:{createElement(tag){return{tag,setAttribute(){},pause(){paused++}}}},
  $:selector=>nodes.get(selector.slice(1)),$$:selector=>selector==='.gallery-thumb'?thumbs:viewer.children.filter(media=>media.tag==='video'),
  watchGalleryMedia(){return()=>{cleanups++}},updateGalleryPhotoLink(){},updateGalleryChapters(){}};
 vm.createContext(context);vm.runInContext(app.slice(app.indexOf('function showSlide('),app.indexOf('function openProject(')),context);
 context.showSlide(8);assert.equal(memory.recall('mascot',10),8);assert.equal(thumbs.filter(t=>t.tabIndex===0).length,1);assert.equal(thumbs[8].tabIndex,0);
 context.showSlide(9);assert.equal(viewer.children[0].tag,'video');assert.equal(viewer.children[0].autoplay,undefined);assert.equal(memory.recall('mascot',10),9);
 context.showSlide(0);assert.equal(paused,1);assert.equal(cleanups,3);assert.equal(thumbs[0].tabIndex,0);
});
