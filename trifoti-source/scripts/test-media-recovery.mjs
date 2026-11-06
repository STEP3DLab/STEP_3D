import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {watchGalleryMedia,releaseGalleryVideo} from '../dist/media-recovery.js';
import vm from 'node:vm';

function fixture(type='image'){
 const document={activeElement:null},attrs=new Map(),retryAttrs=new Map();
 const viewer={setAttribute:(k,v)=>attrs.set(k,v),focus(){document.activeElement=viewer;viewer.focuses++},focuses:0};
 const retry={hidden:true,setAttribute:(k,v)=>retryAttrs.set(k,v),onclick:null};
 const status={textContent:''},announcement={textContent:''};
 let open=true,connected=true,revision=0,attempts=0;
 function start(retrying=false){
  const ownRevision=++revision,media=new EventTarget();attempts++;
  watchGalleryMedia({media,type,viewer,status,retry,announcement,document,isCurrent:()=>open&&connected&&ownRevision===revision,onRetry:()=>start(true),retrying,caption:'Реальный проект'});
  f.media=media;return media;
 }
 const f={document,viewer,attrs,retry,retryAttrs,status,announcement,start,media:null,get attempts(){return attempts},close(){open=false},detach(){connected=false},fire(name,media=f.media){media.dispatchEvent(new Event(name))},click(){retry.onclick()}};
 start();return f;
}
for(const type of ['image','video']){
 const ready=type==='video'?'loadedmetadata':'load';
 test(`${type}: initial loading has no retry; success removes busy state`,()=>{
  const f=fixture(type);assert.equal(f.attrs.get('aria-busy'),'true');assert.equal(f.retry.hidden,true);f.click();assert.equal(f.attempts,1);f.fire(ready);assert.equal(f.attrs.get('aria-busy'),'false');assert.equal(f.status.textContent,'');assert.equal(f.retry.hidden,true);
 });
 test(`${type}: failure offers an explicit retry without making a request`,()=>{
  const f=fixture(type);f.fire('error');assert.equal(f.attempts,1);assert.equal(f.retry.hidden,false);assert.equal(f.retryAttrs.get('aria-disabled'),'false');assert.match(f.status.textContent,/Не удалось/);assert.equal(f.attrs.get('aria-busy'),'false');
 });
 test(`${type}: one explicit retry, no duplicate while pending, then success`,()=>{
  const f=fixture(type);f.fire('error');f.document.activeElement=f.retry;f.click();assert.equal(f.attempts,2);assert.equal(f.retry.hidden,false);assert.equal(f.retryAttrs.get('aria-disabled'),'true');assert.equal(f.document.activeElement,f.retry);assert.match(f.status.textContent,/Повторная загрузка/);f.click();f.click();assert.equal(f.attempts,2);f.fire(ready);assert.equal(f.retry.hidden,true);assert.equal(f.status.textContent,'');assert.equal(f.document.activeElement,f.viewer);assert.match(f.announcement.textContent,/Изображение загружено|Данные видео получены/);
 });
 test(`${type}: retry failure stays recoverable and does not retry automatically`,()=>{
  const f=fixture(type);f.fire('error');f.click();f.fire('error');assert.equal(f.attempts,2);assert.equal(f.retry.hidden,false);assert.equal(f.retryAttrs.get('aria-disabled'),'false');f.click();assert.equal(f.attempts,3);f.fire(ready);assert.equal(f.retry.hidden,true);
 });
}
test('Success does not steal focus from another dialog control',()=>{
 const f=fixture();f.fire('error');f.click();const elsewhere={};f.document.activeElement=elsewhere;f.fire('load');assert.equal(f.document.activeElement,elsewhere);assert.equal(f.viewer.focuses,0);
});
test('Changing slides moves focus before hiding an active retry control',()=>{
 const f=fixture();f.fire('error');f.document.activeElement=f.retry;f.start();assert.equal(f.retry.hidden,true);assert.equal(f.document.activeElement,f.viewer);
});
test('Late success after failure cannot erase the error of that attempt',()=>{
 const f=fixture();f.fire('error');f.fire('load');assert.equal(f.retry.hidden,false);assert.match(f.status.textContent,/Не удалось/);
});
test('A video error after metadata becomes retryable without autoplay',()=>{
 const f=fixture('video');f.fire('loadedmetadata');f.fire('error');assert.equal(f.retry.hidden,false);f.click();assert.equal(f.attempts,2);assert.equal(f.media.autoplay,undefined);
});
test('A previous slide error or load cannot change the new attempt',()=>{
 const f=fixture();const old=f.media;f.start();f.fire('error',old);f.fire('load',old);assert.equal(f.retry.hidden,true);assert.equal(f.status.textContent,'');assert.equal(f.attrs.get('aria-busy'),'true');f.fire('load');assert.equal(f.attrs.get('aria-busy'),'false');
});
test('The old failed media stays inert after retry begins',()=>{
 const f=fixture();const old=f.media;f.fire('error');const oldClick=f.retry.onclick;f.click();f.fire('load',old);oldClick();assert.equal(f.attempts,2);assert.match(f.status.textContent,/Повторная загрузка/);assert.equal(f.attrs.get('aria-busy'),'true');
});
test('Closed dialogs ignore in-flight events and stale retry activations',()=>{
 const f=fixture();f.fire('error');f.click();f.document.activeElement=f.retry;f.close();f.fire('load');f.fire('error');f.click();assert.equal(f.attempts,2);assert.equal(f.viewer.focuses,0);assert.match(f.status.textContent,/Повторная загрузка/);
});
test('Detached gallery nodes ignore late failures',()=>{
 const f=fixture();f.detach();f.fire('error');f.click();assert.equal(f.attempts,1);assert.equal(f.retry.hidden,true);
});
test('App wiring preserves original file/index and provides native focusable controls',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert.match(app,/const retryIndex=galleryIndex;clearMediaWait=watchGalleryMedia/);
 assert.match(app,/onRetry:\(\)=>showSlide\(retryIndex,true\)/);
 assert.match(app,/revision===slideRevision&&projectDialog\.open&&viewer\.isConnected/);
 assert.match(app,/media\.src=item\.src/);
 assert.match(app,/<button type="button" class="text-link gallery-retry" id="gallery-retry" aria-controls="gallery-viewer" hidden>Повторить загрузку<\/button>/);
 assert.match(app,/id="gallery-viewer" tabindex="-1" role="group"/);
 assert.match(app,/id="gallery-status" role="status" aria-atomic="true"/);
 assert.match(app,/projectDialog\.addEventListener\('close'.*slideRevision\+\+/);
 const helper=readFileSync(new URL('../dist/media-recovery.js',import.meta.url),'utf8');
 assert.doesNotMatch(helper,/setInterval|fetch\(|localStorage|sessionStorage/);
});

function videoResource(src='assets/projects/gesture/gesture-turntable.mp4'){
 const calls=[],video=new EventTarget();video.src=src;
 video.getAttribute=name=>video[name]??null;
 video.pause=()=>calls.push('pause');
 video.removeAttribute=name=>{calls.push('remove:'+name);delete video[name]};
 video.load=()=>{assert.equal(video.src,undefined);calls.push('load');video.dispatchEvent(new Event('error'))};
 return {video,calls};
}
for(const state of ['loading','playing','failed'])test(`Releasing a ${state} gallery video cancels its source, not just playback`,()=>{
 const f=videoResource();f.video.readyState=state==='playing'?4:0;
 releaseGalleryVideo(f.video);
 assert.deepEqual(f.calls,['pause','remove:src','load']);assert.equal(f.video.src,undefined);
});
test('Repeated teardown does not reset an already released video again',()=>{
 const f=videoResource();releaseGalleryVideo(f.video);releaseGalleryVideo(f.video);
 assert.deepEqual(f.calls,['pause','remove:src','load','pause']);
});
test('An abort from releasing old media cannot expose a stale retry or loading message',()=>{
 const f=fixture('video'),resource=videoResource();
 const dispose=watchGalleryMedia({media:resource.video,type:'video',viewer:f.viewer,status:f.status,retry:f.retry,announcement:f.announcement,document:f.document,isCurrent:()=>true,onRetry(){throw Error('No automatic retry')},schedule:()=>0,cancel(){}});
 dispose();releaseGalleryVideo(resource.video);
 assert.equal(f.retry.hidden,true);assert.equal(f.status.textContent,'');
});
test('Actual project replacement cancels its wait and releases video before replacing content',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const body=app.slice(app.indexOf('function openProject(key,routeMedia){'),app.indexOf(" host.innerHTML="))+'\n}';
 const f=videoResource(),host={contains:()=>false},events=[];
 const context={releaseGalleryVideo,categoryStories:null,projects:{next:{title:'Next'}},galleryProject:'old',projectDialog:{open:true},document:{activeElement:null},photoDetail:{destroy(){events.push('detail')}},unbindCaseSelection(){events.push('unbind')},clearMediaWait(){events.push('wait');f.calls.push('wait')},
  $:selector=>selector==='#project-content'?host:{},$$:(selector,root)=>{if(selector==='[data-project]')return[];assert.equal(root,context.projectDialog);return[f.video]}};
 vm.createContext(context);vm.runInContext(body,context);context.openProject('next');
 assert.deepEqual(events,['detail','unbind','wait']);assert.deepEqual(f.calls,['wait','pause','remove:src','load']);
 assert.equal(context.galleryProject,'next');assert.equal(context.photoDetail,null);
});
function closeFixture(open=false){
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const line=app.split('\n').find(line=>line.startsWith("projectDialog.addEventListener('close'"));
 const f=videoResource();let close;
 const context={releaseGalleryVideo,photoDetail:{reset(){}},slideRevision:3,clearMediaWait(){f.calls.push('wait')},caseNavigation:{closed(){return 'route'}},
  projectDialog:{open,addEventListener(type,fn){assert.equal(type,'close');close=fn}},$$:(selector,root)=>{assert.equal(selector,'video');assert.equal(root,context.projectDialog);return[f.video]}};
 vm.runInNewContext(line,context);return {...f,context,close};
}
test('Actual dialog close invalidates old events and releases video; repeated close is safe',()=>{
 const f=closeFixture();f.close();assert.equal(f.context.slideRevision,4);
 assert.deepEqual(f.calls,['wait','pause','remove:src','load']);f.close();
 assert.deepEqual(f.calls,['wait','pause','remove:src','load','wait','pause']);
});
test('A delayed close event cannot release a gallery that was already reopened',()=>{
 const f=closeFixture(true);f.close();assert.equal(f.context.slideRevision,3);assert.deepEqual(f.calls,[]);assert(f.video.src);
});
test('Entry point and changed media module both receive fresh cache keys',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(app,/import \{watchGalleryMedia,releaseGalleryVideo\} from '\.\/media-recovery.js\?v=20261106-release-video'/);
 assert.match(html,/app\.js\?[^\"]*&amp;media=20261106-release-video/);
 assert.match(html,/app\.js\?[^\"]*&amp;playback=20261106-background-pause/);
});

function backgroundFixture(){
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),handlers={};
 const document={hidden:false,pictureInPictureElement:null,addEventListener(type,fn){handlers['document:'+type]=fn}},window={addEventListener(type,fn){handlers['window:'+type]=fn}};
 const dialog={open:true};let videos=[];
 const context={document,window,$:selector=>{assert.equal(selector,'#project-dialog');return dialog},$$:(selector,root)=>{assert.equal(selector,'video');assert.equal(root,dialog);return videos}};
 vm.runInNewContext(app.slice(app.indexOf("const projectDialog=$('#project-dialog');"),app.indexOf('let categoryStories=null;')),context);
 const video=()=>({src:'assets/projects/gesture/gesture-turntable.mp4',currentTime:3.25,paused:false,pauses:0,pause(){this.pauses++;this.paused=true},play(){throw Error('No automatic resume')},load(){throw Error('Keep the current resource on tab changes')},removeAttribute(){throw Error('Keep the current resource on tab changes')}});
 const first=video();videos=[first];
 return {first,document,dialog,video,setVideos(value){videos=value},emit(owner,type){handlers[owner+':'+type]?.()}};
}
test('Hiding the page pauses full-gallery playback without discarding its source or position',()=>{
 const f=backgroundFixture();f.document.hidden=true;f.emit('document','visibilitychange');
 assert.equal(f.first.paused,true);assert.equal(f.first.currentTime,3.25);assert.equal(f.first.src,'assets/projects/gesture/gesture-turntable.mp4');assert.equal(f.first.pauses,1);
});
test('A visible page does not interrupt active full-gallery playback',()=>{
 const f=backgroundFixture();f.emit('document','visibilitychange');assert.equal(f.first.pauses,0);assert.equal(f.first.paused,false);
});
test('Returning to the page never resumes a video, including repeated hide/show cycles',()=>{
 const f=backgroundFixture();for(let i=0;i<3;i++){f.document.hidden=true;f.emit('document','visibilitychange');f.document.hidden=false;f.emit('document','visibilitychange');assert.equal(f.first.paused,true)}assert.equal(f.first.pauses,3);
});
test('Page departure pauses full-gallery media even without a preceding hidden event',()=>{
 const f=backgroundFixture();f.emit('window','pagehide');assert.equal(f.first.paused,true);assert.equal(f.first.currentTime,3.25);assert.equal(f.first.pauses,1);
});
test('Background handling reads the current media, not a previously replaced frame',()=>{
 const f=backgroundFixture(),current=f.video();f.setVideos([current]);f.document.hidden=true;f.emit('document','visibilitychange');assert.equal(current.paused,true);assert.equal(f.first.pauses,0);
});
test('Photo-only and empty galleries safely ignore page lifecycle changes',()=>{
 const f=backgroundFixture();f.setVideos([]);f.document.hidden=true;f.emit('document','visibilitychange');f.emit('window','pagehide');assert.equal(f.first.pauses,0);
});
test('An explicitly floating picture-in-picture video remains playing on tab changes',()=>{
 const f=backgroundFixture();f.document.pictureInPictureElement=f.first;f.document.hidden=true;f.emit('document','visibilitychange');assert.equal(f.first.pauses,0);assert.equal(f.first.paused,false);f.emit('window','pagehide');assert.equal(f.first.paused,true);
});
test('A different picture-in-picture video does not exempt the current gallery',()=>{
 const f=backgroundFixture();f.document.pictureInPictureElement=f.video();f.document.hidden=true;f.emit('document','visibilitychange');assert.equal(f.first.paused,true);
});
