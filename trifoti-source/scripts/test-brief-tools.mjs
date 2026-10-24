import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ideaCount,copyBriefText,initializeBriefTools} from '../dist/brief-tools.js';
import {BRIEF_KEY,createBriefDraftSession} from '../dist/brief-utils.js';
const directions=['Пока не знаю — давайте обсудим','Дизайн и архитектура','Скульптура','Бытовой дизайн','Сувениры, призы, награды'];
function fixture(initial={}){
 const nodes={},fields={},events=[];let active=null,raw=null;
 const node=id=>nodes[id]??=( {id,value:'',textContent:'',hidden:false,open:false,disabled:false,dataset:{},attrs:{},handlers:{},addEventListener(k,fn){this.handlers[k]=fn},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},focus(){active=this},select(){this.selected=true}} );
 for(const key of ['name','idea','direction','reference','budget','deadline'])fields[key]=node(key);
 let index=0;Object.defineProperty(fields.direction,'selectedIndex',{get(){return index},set(v){index=v;this.value=directions[v]}});fields.direction.selectedIndex=0;
 for(const [key,value] of Object.entries(initial))fields[key].value=value;
 const form={elements:{namedItem:key=>fields[key]}};
 const NativeFormData=globalThis.FormData;
 globalThis.FormData=class{constructor(f){assert.equal(f,form)}[Symbol.iterator](){return Object.entries(fields).map(([k,n])=>[k,n.value])[Symbol.iterator]()}};
 const storage={getItem:key=>{assert.equal(key,BRIEF_KEY);return raw},setItem(key,value){raw=value},removeItem(key){assert.equal(key,BRIEF_KEY);raw=null}};
 node('brief-reset-confirm').hidden=true;
 const session=createBriefDraftSession(()=>storage),statuses=[];
 let copied=[],denied=false,resolve,reject;
 const clipboard={async writeText(text){copied.push(text);if(denied)throw Error('denied');if(resolve===true)await new Promise((r,j)=>{resolve=r;reject=j})}};
 const tools=initializeBriefTools({form,document:{getElementById:node},draftSession:session,draftStatus:s=>statuses.push(s),onReset:()=>events.push('reset'),clipboard});
 return {node,fields,form,tools,session,statuses,events,copied,set denied(v){denied=v},set raw(v){raw=v},get raw(){return raw},get active(){return active},click:id=>node(id).handlers.click(),cleanup(){globalThis.FormData=NativeFormData},defer(){resolve=true},finish(){resolve()},fail(){reject(Error('denied'))}};
}
test('Idea count matches native maxlength units and only two warning thresholds',()=>{
 assert.deepEqual(ideaCount('abc'),{length:3,near:false,text:'3 / 4000',announcement:''});
 assert.equal(ideaCount('x'.repeat(3799)).near,false);assert.equal(ideaCount('x'.repeat(3800)).near,true);
 assert.match(ideaCount('x'.repeat(3999)).text,/Осталось 1/);assert.match(ideaCount('x'.repeat(4000)).text,/Лимит достигнут/);
 assert.equal(ideaCount('x'.repeat(3800)).announcement,ideaCount('x'.repeat(3999)).announcement);
 assert.equal(ideaCount('😀').length,2);
});
test('Copy reports real success only after clipboard resolves and handles absent/denied APIs',async()=>{
 assert.equal(await copyBriefText('test',undefined),false);assert.equal(await copyBriefText('test',{}),false);
 assert.equal(await copyBriefText('test',{writeText(){throw Error('denied')}}),false);
 let got='';assert.equal(await copyBriefText('text',{async writeText(value){got=value}}),true);assert.equal(got,'text');
});
test('Unfinished preview stays available; primary copy validates without submitting or downloading',async()=>{
 const f=fixture({idea:'Незавершённый замысел'});try{
  assert.equal(f.node('brief-text-fallback').hidden,false);assert.equal(f.node('brief-copy').disabled,false);assert.equal(f.form.noValidate,true);
  f.node('brief-text-fallback').open=true;f.tools.refresh();assert.match(f.node('brief-text').value,/Незавершённый замысел/);
  await f.click('brief-copy');assert.equal(f.copied.length,0);assert.equal(f.active,f.fields.name);assert.match(f.node('brief-text').value,/Незавершённый замысел/);assert(f.node('brief-text-fallback').open);
  f.fields.name.value='Тест';f.tools.refresh();await f.click('brief-copy');assert.match(f.copied[0],/Незавершённый замысел/);assert.match(f.node('brief-copy-status').textContent,/Бриф скопирован/);
  assert.equal(f.raw,null);
 }finally{f.cleanup()}
});
test('Required errors remain inline, focus first field, and whitespace does not pass',()=>{
 const f=fixture({name:' ',idea:'\n'});try{
  assert.equal(f.tools.validate(),false);assert.equal(f.active,f.fields.name);
  for(const key of ['name','idea']){assert.equal(f.fields[key].attrs['aria-invalid'],'true');assert.equal(f.node(`brief-${key}-error`).hidden,false)}
  f.fields.name.value='Тест';f.tools.refresh();assert.equal(f.node('brief-name-error').hidden,true);assert.equal(f.fields.idea.attrs['aria-invalid'],'true');
  f.fields.idea.value='Скульптура';f.tools.refresh();assert.equal(f.tools.validate(),true);
 }finally{f.cleanup()}
});
test('Untouched required fields are not prematurely marked invalid',()=>{
 const f=fixture();try{f.tools.refresh();assert.equal(f.fields.name.attrs['aria-invalid'],undefined);f.fields.name.handlers.blur();assert.equal(f.fields.name.attrs['aria-invalid'],'true')}finally{f.cleanup()}
});
test('Denied clipboard exposes current text, selects it and never claims success',async()=>{
 const f=fixture({name:'Тест',idea:'Мой текст'});try{f.denied=true;await f.click('brief-copy');assert.equal(f.node('brief-text-fallback').open,true);assert.equal(f.active,f.node('brief-text'));assert.equal(f.node('brief-text').selected,true);assert.match(f.node('brief-text').value,/Мой текст/);assert.match(f.node('brief-copy-status').textContent,/недоступно/);assert.match(f.node('brief-copy-status').textContent,/в открытом блоке/);assert.equal(f.node('brief-copy').disabled,false)}finally{f.cleanup()}
});
test('Copy in flight cannot mislabel newer edited text as copied',async()=>{
 const f=fixture({name:'Тест',idea:'Первая версия'});try{f.defer();const pending=f.click('brief-copy');assert.equal(f.node('brief-copy').disabled,true);f.fields.idea.value='Вторая версия';f.tools.refresh();f.finish();await pending;assert.match(f.node('brief-copy-status').textContent,/до последних изменений/)}finally{f.cleanup()}
});
test('Primary copy rejects whitespace-only required fields without touching clipboard or draft',async()=>{
 const f=fixture({name:' ',idea:'\n'});try{
  f.session.save({idea:'Сохранённый черновик'});const before=f.raw;f.node('brief-copy-status').textContent='Старый статус';
  await f.click('brief-copy');assert.equal(f.copied.length,0);assert.equal(f.raw,before);assert.equal(f.active,f.fields.name);assert.equal(f.node('brief-copy').disabled,false);assert.equal(f.node('brief-copy-status').textContent,'');
  for(const key of ['name','idea'])assert.equal(f.fields[key].attrs['aria-invalid'],'true');
  f.fields.name.value='Тест';await f.click('brief-copy');assert.equal(f.active,f.fields.idea);assert.equal(f.copied.length,0);
 }finally{f.cleanup()}
});
test('Copy remains pending until resolved, ignores duplicate clicks and leaves preview closed on success',async()=>{
 const f=fixture({name:'Тест',idea:'Готовый замысел'});try{
  f.defer();const pending=f.click('brief-copy');assert.equal(f.node('brief-copy-status').textContent,'Копируем текст…');assert.equal(f.node('brief-copy').disabled,true);
  await f.click('brief-copy');assert.equal(f.copied.length,1);f.finish();await pending;
  assert.equal(f.node('brief-copy').disabled,false);assert.equal(f.node('brief-text-fallback').open,false);assert.equal(f.node('brief-copy-status').textContent,'Бриф скопирован. Данные никуда не отправлены.');assert.equal(f.raw,null);
 }finally{f.cleanup()}
});
test('Late clipboard rejection exposes the current text after an intervening edit',async()=>{
 const f=fixture({name:'Тест',idea:'Первая версия'});try{
  f.defer();const pending=f.click('brief-copy');f.fields.idea.value='Новая версия';f.tools.refresh();f.fail();await pending;
  assert.match(f.node('brief-text').value,/Новая версия/);assert.doesNotMatch(f.node('brief-text').value,/Первая версия/);assert(f.node('brief-text-fallback').open);assert.equal(f.active,f.node('brief-text'));assert.match(f.node('brief-copy-status').textContent,/недоступно/);
 }finally{f.cleanup()}
});
test('Reset during pending copy prevents late success or failure from restoring old status or focus',async()=>{
 for(const outcome of ['finish','fail']){
  const f=fixture({name:'Тест',idea:'Старый текст'});try{
   f.defer();const pending=f.click('brief-copy');f.click('brief-new');f.click('brief-reset-yes');f[outcome]();await pending;
   assert.equal(f.fields.idea.value,'');assert.equal(f.node('brief-copy-status').textContent,'');assert.equal(f.node('brief-copy').disabled,false);assert.equal(f.node('brief-text-fallback').open,false);assert.equal(f.active,f.fields.name);assert.doesNotMatch(f.node('brief-text').value,/Старый текст/);
  }finally{f.cleanup()}
 }
});
test('Copy and unfinished preview remain available during a latched storage conflict without overwriting it',async()=>{
 const f=fixture({name:'Тест',idea:'Моя текущая версия'});try{
  f.session.save({idea:'Прежняя версия'});f.raw='{"idea":"Другая вкладка"}';assert.equal(f.session.check(),'conflict');const other=f.raw;
  await f.click('brief-copy');assert.match(f.copied[0],/Моя текущая версия/);assert.equal(f.raw,other);assert.equal(f.session.check(),'conflict');
  f.fields.name.value='';f.fields.idea.value='Незавершённый черновик';f.node('brief-text-fallback').open=true;f.tools.refresh();
  await f.click('brief-copy');assert.equal(f.copied.length,1);assert.match(f.node('brief-text').value,/Незавершённый черновик/);assert(f.node('brief-text-fallback').open);assert.equal(f.raw,other);
 }finally{f.cleanup()}
});
test('Reset requires explicit confirmation and Cancel or Escape preserves all fields and storage',()=>{
 const f=fixture({name:'Тест',idea:'Не удалить',reference:'Медведь'});try{
  f.session.save({idea:'Не удалить'});const before=f.raw;
  f.click('brief-new');assert.equal(f.active,f.node('brief-reset-no'));assert.equal(f.fields.idea.value,'Не удалить');assert.equal(f.raw,before);
  f.click('brief-reset-no');assert.equal(f.node('brief-reset-confirm').hidden,true);assert.equal(f.raw,before);
  f.click('brief-new');let prevented=false;f.node('brief-reset-confirm').handlers.keydown({key:'Escape',preventDefault(){prevented=true},stopPropagation(){}});assert(prevented);assert.equal(f.raw,before);assert.equal(f.active,f.node('brief-new'));
 }finally{f.cleanup()}
});
test('Confirmed reset clears only the guarded draft and its existing fields, permits new autosave',()=>{
 const f=fixture({name:'Тест',idea:'Старый текст',reference:'Медведь',budget:'100',deadline:'Позже'});try{
  f.fields.direction.selectedIndex=2;f.session.save({idea:'Старый текст'});f.click('brief-new');f.click('brief-reset-yes');
  for(const key of ['name','idea','reference','budget','deadline'])assert.equal(f.fields[key].value,'');
  assert.equal(f.fields.direction.selectedIndex,0);assert.equal(f.raw,null);assert.equal(f.active,f.fields.name);assert.equal(f.node('brief-reset-confirm').hidden,true);
  assert.equal(f.node('brief-idea-counter').textContent,'0 / 4000');assert.deepEqual(f.events,['reset']);assert.equal(f.session.save({idea:'Новая идея'}),'saved');
 }finally{f.cleanup()}
});
test('Newer tab draft appearing while confirmation is open is never deleted',()=>{
 const f=fixture({idea:'Моя версия'});try{f.session.save({idea:'Моя версия'});f.click('brief-new');f.raw='{"idea":"Другая вкладка"}';f.click('brief-reset-yes');assert.equal(f.raw,'{"idea":"Другая вкладка"}');assert.equal(f.fields.idea.value,'Моя версия');assert.equal(f.statuses.at(-1),'conflict');assert.deepEqual(f.events,[])}finally{f.cleanup()}
});
test('Failed draft removal preserves visible fields and baseline',()=>{
 let raw='{"idea":"Сохранено"}',denied=true;
 const storage={getItem(){return raw},removeItem(){if(denied)throw Error('denied');raw=null},setItem(k,v){raw=v}};
 const s=createBriefDraftSession(()=>storage);assert.equal(s.clear(),'failed');assert.equal(raw,'{"idea":"Сохранено"}');denied=false;assert.equal(s.clear(),'empty');assert.equal(raw,null);assert.equal(s.check(),null);
});
test('Unreadable or conflicted draft session refuses reset',()=>{
 const inaccessible=createBriefDraftSession(()=>{throw Error('denied')});assert.equal(inaccessible.clear(),'unavailable');
 let raw='{}',removals=0;const s=createBriefDraftSession(()=>({getItem(){return raw},removeItem(){removals++}}));raw='{"idea":"changed"}';assert.equal(s.clear(),'conflict');raw='{}';assert.equal(s.clear(),'conflict');assert.equal(removals,0);
});
const file=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
test('Counter, errors and preview have descriptive relationships, reset is hidden until JS is ready',()=>{
 const html=file('index.html');assert.match(html,/name="name" aria-describedby="brief-name-error"/);assert.match(html,/aria-describedby="brief-idea-help brief-idea-counter brief-idea-error"/);
 assert.match(html,/id="brief-idea-limit" class="sr-only" role="status" aria-atomic="true"/);assert.doesNotMatch(html,/id="brief-idea-counter"[^>]*role="status"/);
 assert.match(html,/id="brief-reset-confirm"[^>]*hidden/);assert.match(html,/id="brief-reset-controls" hidden/);assert.match(html,/id="brief-copy" disabled/);
});
test('Brief tools add no new form fields, storage keys, request or transmission path',()=>{
 const html=file('index.html'),form=html.match(/<form id="brief-form"[^>]*>([\s\S]*?)<\/form>/)[1];assert.deepEqual([...form.matchAll(/\bname="([^"]+)"/g)].map(m=>m[1]).sort(),['budget','deadline','direction','idea','name','reference']);
 const module=file('brief-tools.js');assert.doesNotMatch(module,/fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|innerHTML/);assert.match(module,/draftSession\.clear\(\)/);
});
