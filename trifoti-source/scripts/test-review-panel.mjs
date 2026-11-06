import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REVIEW_KEY,REVIEW_SECTIONS,REVIEW_DECISIONS,normalizeReview,readReview,saveReview,formatReview,initializeReviewPanel} from '../dist/review-panel.js';

const valid={sections:{[REVIEW_SECTIONS[0]]:'Оставляем',[REVIEW_SECTIONS[2]]:'Доработать'},notes:'Сохранить характер.\nПроверить ракурсы.'};
function memory(raw=null){
 return{raw,writes:0,getItem(key){assert.equal(key,REVIEW_KEY);return this.raw},setItem(key,value){assert.equal(key,REVIEW_KEY);this.writes++;this.raw=value}};
}
test('Missing review data is empty and reading never writes or deletes storage',()=>{
 const storage=memory();assert.deepEqual(readReview(()=>storage),{review:{sections:{},notes:''},state:'empty'});assert.equal(storage.writes,0);
});
test('Existing valid notes and section choices are recovered unchanged',()=>{
 const storage=memory(JSON.stringify(valid));assert.deepEqual(readReview(()=>storage),{review:valid,state:'restored'});assert.equal(storage.writes,0);
});
test('The association label preserves the legacy review section decision and storage key',()=>{
 const storage=memory(JSON.stringify({sections:{Студия:'Оставляем'},notes:'Keep'}));
 const {ids}=panel(()=>storage);const row=ids['review-sections'].children[4];
 assert.equal(row.children[1].textContent,'Об объединении');
 assert.equal(row.children[2]['aria-label'],'Решение по разделу «Об объединении»');
 assert.equal(row.children[2].value,'Оставляем');assert.equal(storage.writes,0);
 row.children[2].value='Доработать';row.children[2].fire('change');
 assert.deepEqual(JSON.parse(storage.raw),{sections:{Студия:'Доработать'},notes:'Keep'});
 assert(formatReview(JSON.parse(storage.raw)).includes('5. Об объединении: Доработать'));
});
test('Legacy notes survive absent, null, array and primitive sections',()=>{
 for(const sections of [undefined,null,[],true,42,'old']){
  const storage=memory(JSON.stringify({sections,notes:'prior note'}));
  assert.deepEqual(readReview(()=>storage),{review:{sections:{},notes:'prior note'},state:'partial'});assert.equal(storage.writes,0);
 }
});
test('An empty object is recoverable and cannot throw during section lookup',()=>{
 assert.deepEqual(normalizeReview({}),{review:{sections:{},notes:''},state:'partial'});
});
test('Malformed JSON and invalid root shapes return an explicit error state',()=>{
 for(const raw of ['{bad','null','[]','42','false','"notes"'])assert.deepEqual(readReview(()=>memory(raw)),{review:{sections:{},notes:''},state:'invalid'});
});
test('Only allowed section decisions survive; valid notes and decisions are retained',()=>{
 const input={sections:{[REVIEW_SECTIONS[0]]:'Убрать',[REVIEW_SECTIONS[1]]:'unknown',[REVIEW_SECTIONS[2]]:{bad:true},other:'Оставляем'},notes:'keep'};
 assert.deepEqual(normalizeReview(input),{review:{sections:{[REVIEW_SECTIONS[0]]:'Убрать'},notes:'keep'},state:'partial'});
 for(const decision of REVIEW_DECISIONS)assert.equal(normalizeReview({sections:{[REVIEW_SECTIONS[0]]:decision},notes:''}).state,'restored');
});
test('Invalid note types do not discard valid section choices',()=>{
 for(const notes of [undefined,null,[],{},42])assert.deepEqual(normalizeReview({sections:valid.sections,notes}),{review:{sections:valid.sections,notes:''},state:'partial'});
});
test('Blocked storage getters and reads are reported without exceptions',()=>{
 for(const getStorage of [()=>{throw new DOMException('Blocked','SecurityError')},()=>({getItem(){throw new DOMException('Blocked','SecurityError')}})])assert.equal(readReview(getStorage).state,'unavailable');
});
test('Saving preserves the existing key and only the two existing fields',()=>{
 const storage=memory();assert.equal(saveReview({...valid,unrelated:'never retain'},()=>storage),true);
 assert.deepEqual(JSON.parse(storage.raw),valid);assert.equal(storage.writes,1);assert.equal(REVIEW_KEY,'trifoti-review-v1');
});
test('Invalid save input cannot overwrite a recoverable existing review',()=>{
 const storage=memory(JSON.stringify(valid));for(const value of [null,[],{}, {sections:null,notes:'keep'}])assert.equal(saveReview(value,()=>storage),false);
 assert.equal(storage.writes,0);assert.deepEqual(JSON.parse(storage.raw),valid);
});
test('Quota and security failures are false, and later successful saves can recover',()=>{
 for(const getStorage of [()=>{throw new DOMException('Blocked','SecurityError')},()=>({setItem(){throw new DOMException('Full','QuotaExceededError')}})])assert.equal(saveReview(valid,getStorage),false);
 assert.equal(saveReview(valid,()=>memory()),true);
});

class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.listeners={};this.disabled=true;this.value='';this.textContent=''}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children.flatMap(child=>child.tag==='fragment'?child.children:[child])}
 setAttribute(name,value){this[name]=value}
 addEventListener(name,callback){this.listeners[name]=callback}
 fire(name,event={}){this.listeners[name]?.(event)}
}
function panel(getStorage=()=>memory(),download=()=>{}){
 const ids=Object.fromEntries(['review-sections','review-notes','review-save-status','export-review','review-status'].map(id=>[id,new Element()]));
 const document={defaultView:new Element('window'),getElementById:id=>ids[id]||null,createElement:tag=>new Element(tag),createDocumentFragment:()=>new Element('fragment')};
 initializeReviewPanel({document,download,getStorage});return{ids,document};
}
test('Every legacy shape initializes all six controls and preserves recoverable note text',()=>{
 for(const value of [{},{notes:'prior note'},{sections:null,notes:'prior note'},valid]){
  const storage=memory(JSON.stringify(value)),{ids}=panel(()=>storage);
  assert.equal(ids['review-sections'].children.length,6);assert.equal(ids['review-notes'].value,value.notes||'');
  assert.equal(ids['review-notes'].disabled,false);assert.equal(ids['export-review'].disabled,false);assert.equal(storage.writes,0);
  assert.equal(ids['review-save-status'].dataset.state,value===valid?'ready':'error');
 }
});
test('Malformed and inaccessible storage still leave the optional review usable',()=>{
 for(const getStorage of [()=>memory('{bad'),()=>{throw new DOMException('Blocked','SecurityError')}]){
  const {ids}=panel(getStorage);assert.equal(ids['review-sections'].children.length,6);assert.equal(ids['review-save-status'].dataset.state,'error');assert.equal(ids['review-notes'].disabled,false);
 }
});
test('Failed note saves retain visible text and never announce successful saving',()=>{
 const storage=memory(JSON.stringify(valid));let blocked=true;
 const getStorage=()=>({getItem:key=>storage.getItem(key),setItem(...args){if(blocked)throw new DOMException('Full','QuotaExceededError');storage.setItem(...args)}});
 const {ids}=panel(getStorage);ids['review-notes'].value='Important current notes';ids['review-notes'].fire('input');
 assert.equal(ids['review-save-status'].dataset.state,'error');assert.match(ids['review-save-status'].textContent,/Не удалось сохранить/);
 assert.equal(ids['review-notes'].value,'Important current notes');assert.deepEqual(JSON.parse(storage.raw),valid);
 blocked=false;ids['review-notes'].fire('input');assert.equal(ids['review-save-status'].textContent,'Заметки сохранены в этом браузере.');assert.equal(JSON.parse(storage.raw).notes,'Important current notes');
});
test('Section failures are visible and in-memory decisions remain available for export',()=>{
 let exported;const {ids}=panel(()=>({getItem:()=>JSON.stringify(valid),setItem(){throw new DOMException('Blocked','SecurityError')}}),(text,name)=>{exported={text,name}});
 const select=ids['review-sections'].children[1].children[2];select.value='Убрать';select.fire('change');
 assert.equal(ids['review-save-status'].dataset.state,'error');ids['export-review'].fire('click');
 assert(exported.text.includes('2. Направления: Убрать'));assert(exported.text.includes(valid.notes));assert.equal(exported.name,'TRIFOTI-site-review.txt');
 assert.equal(ids['review-save-status'].dataset.state,'error');assert.match(ids['review-status'].textContent,/запрошено/);
});
test('A download exception is reported without losing notes or throwing from the control',()=>{
 const {ids}=panel(()=>memory(JSON.stringify(valid)),()=>{throw new Error('Download blocked')});assert.doesNotThrow(()=>ids['export-review'].fire('click'));
 assert.equal(ids['review-status'].dataset.state,'error');assert.match(ids['review-status'].textContent,/Не удалось начать/);assert.equal(ids['review-notes'].value,valid.notes);
});
test('Missing optional controls fail before any storage is changed',()=>{
 const storage=memory(JSON.stringify(valid));assert.throws(()=>initializeReviewPanel({document:{getElementById:()=>null},getStorage:()=>storage}));assert.equal(storage.writes,0);
});
test('Export retains the existing six-section format without unrelated stored fields',()=>{
 const text=formatReview(valid);assert(text.includes(valid.notes));assert(text.includes('Концепт 01'));assert(text.includes('6. Обсуждение проекта: Обсудить'));assert.equal(REVIEW_SECTIONS.length,6);
});
test('Optional review loads after all core initialization and has a visible failure boundary',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');const at=app.indexOf("import('./review-panel.js?");
 assert(at>app.indexOf('caseNavigation.sync();'));assert(at>app.indexOf("import('./bear-video.js?"));
 assert(app.slice(at).includes('.catch('));assert(app.slice(at).includes("control.disabled=true"));assert(!app.includes('review.sections['));
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert(html.includes('id="review-save-status" class="form-note" role="status" aria-atomic="true"'));
 assert(html.includes('<textarea id="review-notes" disabled'));assert(html.includes('id="export-review" disabled'));assert(!html.includes('Заметки сохраняются в этом браузере.</p>'));
});

test('A stale panel cannot overwrite notes saved in another tab, even before a storage event',()=>{
 const storage=memory(JSON.stringify(valid)),first=panel(()=>storage),second=panel(()=>storage);
 first.ids['review-notes'].value='New notes from the first tab';first.ids['review-notes'].fire('input');
 const select=second.ids['review-sections'].children[1].children[2];select.value='Убрать';select.fire('change');
 assert.equal(storage.writes,1);assert.equal(JSON.parse(storage.raw).notes,'New notes from the first tab');
 assert.equal(second.ids['review-notes'].value,valid.notes);assert.equal(select.value,'Убрать');
 assert.match(second.ids['review-save-status'].textContent,/другой вкладке/);assert.equal(second.ids['review-save-status'].dataset.state,'error');
});
test('Storage events warn immediately without changing visible notes or decisions',()=>{
 const storage=memory(JSON.stringify(valid)),{ids,document}=panel(()=>storage);
 storage.raw=JSON.stringify({sections:{},notes:'Elsewhere'});document.defaultView.fire('storage',{key:REVIEW_KEY});
 assert.match(ids['review-save-status'].textContent,/другой вкладке/);assert.equal(ids['review-notes'].value,valid.notes);
 assert.equal(ids['review-sections'].children[0].children[2].value,'Оставляем');assert.equal(storage.writes,0);
});
test('A cleared saved review is treated as a conflict instead of silently resurrected',()=>{
 for(const key of [REVIEW_KEY,null]){
  const storage=memory(JSON.stringify(valid)),{ids,document}=panel(()=>storage);
  storage.raw=null;document.defaultView.fire('storage',{key});
  ids['review-notes'].value='Keep locally';ids['review-notes'].fire('input');
  assert.equal(storage.raw,null);assert.equal(storage.writes,0);assert.match(ids['review-save-status'].textContent,/другой вкладке/);
 }
});
test('Conflicts stay latched after later edits or restoration of the old storage bytes',()=>{
 const storage=memory(JSON.stringify(valid)),{ids,document}=panel(()=>storage);
 storage.raw='changed';document.defaultView.fire('storage',{key:REVIEW_KEY});storage.raw=JSON.stringify(valid);
 ids['review-notes'].value='Local version';ids['review-notes'].fire('input');
 assert.equal(storage.writes,0);assert.match(ids['review-save-status'].textContent,/другой вкладке/);
});
test('Current local notes and decisions remain exportable during a conflict',()=>{
 let exported;const storage=memory(JSON.stringify(valid)),{ids}=panel(()=>storage,text=>{exported=text});
 storage.raw=JSON.stringify({sections:{},notes:'Saved elsewhere'});
 ids['review-notes'].value='Unsaved local notes';ids['review-notes'].fire('input');
 const select=ids['review-sections'].children[1].children[2];select.value='Убрать';select.fire('change');
 ids['export-review'].fire('click');assert.match(exported,/Unsaved local notes/);assert.match(exported,/2\. Направления: Убрать/);
 assert.equal(JSON.parse(storage.raw).notes,'Saved elsewhere');assert.equal(ids['review-save-status'].dataset.state,'error');
});
test('Unrelated and unchanged storage events do not create false conflicts',()=>{
 const storage=memory(JSON.stringify(valid)),{ids,document}=panel(()=>storage);
 document.defaultView.fire('storage',{key:REVIEW_KEY});document.defaultView.fire('storage',{key:null});
 assert.equal(ids['review-save-status'].dataset.state,'ready');
 storage.raw='changed';document.defaultView.fire('storage',{key:'unrelated'});assert.equal(ids['review-save-status'].dataset.state,'ready');
});
test('Consecutive own saves advance the expected snapshot and a reopened panel uses the latest notes',()=>{
 const storage=memory(JSON.stringify(valid)),{ids}=panel(()=>storage);
 for(const value of ['One','Two']){ids['review-notes'].value=value;ids['review-notes'].fire('input');assert.equal(ids['review-save-status'].dataset.state,'ready')}
 const reopened=panel(()=>storage);assert.equal(reopened.ids['review-notes'].value,'Two');
 reopened.ids['review-notes'].value='Three';reopened.ids['review-notes'].fire('input');assert.equal(JSON.parse(storage.raw).notes,'Three');assert.equal(storage.writes,3);
});
test('An unreadable initial snapshot cannot overwrite unseen notes after storage recovers',()=>{
 const storage=memory(JSON.stringify(valid));let blocked=true;
 const getStorage=()=>{if(blocked)throw new Error('Unavailable');return storage};
 const {ids}=panel(getStorage);blocked=false;ids['review-notes'].value='Local';ids['review-notes'].fire('input');
 assert.equal(storage.writes,0);assert.deepEqual(JSON.parse(storage.raw),valid);assert.equal(ids['review-save-status'].dataset.state,'error');
});
test('A temporary read failure prevents saving and can recover if the snapshot is unchanged',()=>{
 const storage=memory(JSON.stringify(valid));let blocked=false;
 const getStorage=()=>({getItem(key){if(blocked)throw new Error('Unavailable');return storage.getItem(key)},setItem:(...args)=>storage.setItem(...args)});
 const {ids}=panel(getStorage);blocked=true;ids['review-notes'].value='Local';ids['review-notes'].fire('input');
 assert.equal(storage.writes,0);assert.equal(ids['review-save-status'].dataset.state,'error');
 blocked=false;ids['review-notes'].fire('input');assert.equal(storage.writes,1);assert.equal(JSON.parse(storage.raw).notes,'Local');
});
test('Malformed and partial snapshots can still be repaired by explicit edits if unchanged',()=>{
 for(const raw of ['{bad',JSON.stringify({notes:'Recoverable'})]){
  const storage=memory(raw),{ids}=panel(()=>storage);ids['review-notes'].value='Repaired';ids['review-notes'].fire('input');
  assert.equal(JSON.parse(storage.raw).notes,'Repaired');assert.equal(ids['review-save-status'].dataset.state,'ready');
 }
});
