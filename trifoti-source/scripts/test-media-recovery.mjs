import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {watchGalleryMedia} from '../dist/media-recovery.js';

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
 assert.match(app,/const retryIndex=galleryIndex;watchGalleryMedia/);
 assert.match(app,/onRetry:\(\)=>showSlide\(retryIndex,true\)/);
 assert.match(app,/revision===slideRevision&&projectDialog\.open&&viewer\.isConnected/);
 assert.match(app,/media\.src=item\.src/);
 assert.match(app,/<button type="button" class="text-link gallery-retry" id="gallery-retry" aria-controls="gallery-viewer" hidden>Повторить загрузку<\/button>/);
 assert.match(app,/id="gallery-viewer" tabindex="-1" role="group"/);
 assert.match(app,/id="gallery-status" role="status" aria-atomic="true"/);
 assert.match(app,/projectDialog\.addEventListener\('close'.*slideRevision\+\+/);
 const helper=readFileSync(new URL('../dist/media-recovery.js',import.meta.url),'utf8');
 assert.doesNotMatch(helper,/setTimeout|setInterval|fetch\(|localStorage|sessionStorage/);
});
