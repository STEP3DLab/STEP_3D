import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {briefErrors,formatBrief} from '../../trifoti/warm/brief-utils.js';

const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const source=read('trifoti/warm/brief-tools.js').replace(/^import[^\n]+\n/,'').replaceAll('export ','');
function fixture(){
 const nodes=new Map(),fields={},body={},doc={activeElement:body,getElementById:id=>node(id)};
 function node(id){
  if(nodes.has(id))return nodes.get(id);
  const listeners={},attrs={};let disabled=false;
  const element={id,value:'',textContent:'',hidden:false,open:false,dataset:{},attrs,
   get disabled(){return disabled},set disabled(value){disabled=value;if(value&&doc.activeElement===element)doc.activeElement=body},
   addEventListener(type,listener){listeners[type]=listener},setAttribute(key,value){attrs[key]=value},removeAttribute(key){delete attrs[key]},
   focus(){doc.activeElement=element},select(){this.selected=true},click(){return listeners.click?.()},listeners};
  nodes.set(id,element);return element;
 }
 for(const name of ['name','idea','direction','reference','budget','deadline'])fields[name]=node(name);
 fields.name.value='Тест';fields.idea.value='Исходная идея';fields.direction.value='Дизайн интерьеров';fields.reference.value='Сохранённый пример';
 const form={elements:{namedItem:name=>fields[name]}},requests=[];let removed=0;
 const clipboard={writeText(text){return new Promise((resolve,reject)=>requests.push({text,resolve,reject}))}};
 const scope={briefErrors,formatBrief,form,document:doc,clipboard,draftSession:{clear(){removed++;return 'empty'}},
  FormData:class{constructor(){return Object.entries(fields).map(([name,field])=>[name,field.value])}}};
 vm.runInNewContext(source+'\nthis.tools=initializeBriefTools({form,document,clipboard,draftSession,draftStatus(){},onReset(){}})',scope);
 return {node,fields,requests,doc,body,tools:scope.tools,get removed(){return removed}};
}
function start(f){f.node('brief-copy').focus();return f.node('brief-copy').click()}

test('warm pending copy retains keyboard focus and blocks duplicate activation',async()=>{
 const f=fixture(),pending=start(f),copy=f.node('brief-copy');
 assert.equal(f.doc.activeElement,copy);assert.equal(copy.disabled,false);assert.equal(copy.attrs['aria-disabled'],'true');
 await copy.click();assert.equal(f.requests.length,1);f.requests[0].resolve();await pending;
 assert.equal(copy.attrs['aria-disabled'],undefined);assert.match(f.node('brief-copy-status').textContent,/Бриф скопирован/);
});
test('warm late clipboard denial does not steal focus from a newer edit',async()=>{
 const f=fixture(),pending=start(f);f.fields.idea.focus();f.fields.idea.value='Продолжаю редактирование';f.tools.refresh();
 f.requests[0].reject(Error('simulated denial'));await pending;
 assert.equal(f.doc.activeElement,f.fields.idea);assert.notEqual(f.node('brief-text').selected,true);
 assert(f.node('brief-text-fallback').open);assert.match(f.node('brief-text').value,/Продолжаю редактирование/);
 assert.match(f.node('brief-text').value,/Сохранённый пример/);assert.match(f.node('brief-copy-status').textContent,/недоступно/);assert.equal(f.removed,0);
});
test('warm denial selects the manual fallback when the initiating button still owns focus',async()=>{
 const f=fixture(),pending=start(f);f.requests[0].reject(Error('simulated denial'));await pending;
 assert.equal(f.doc.activeElement,f.node('brief-text'));assert(f.node('brief-text').selected);assert(f.node('brief-text-fallback').open);
 assert.equal(f.node('brief-copy').attrs['aria-disabled'],undefined);
});
test('warm delayed success preserves newer focus and identifies an older copied version',async()=>{
 const f=fixture(),pending=start(f);f.fields.idea.focus();f.fields.idea.value='Новая идея';f.tools.refresh();f.requests[0].resolve();await pending;
 assert.equal(f.doc.activeElement,f.fields.idea);assert.match(f.requests[0].text,/Исходная идея/);assert.doesNotMatch(f.requests[0].text,/Новая идея/);
 assert.match(f.node('brief-copy-status').textContent,/до последних изменений/);assert(!f.node('brief-text-fallback').open);
});
test('warm reset invalidates a late success or rejection and clears pending accessibility state',async()=>{
 for(const result of ['resolve','reject']){
  const f=fixture(),pending=start(f);f.node('brief-reset-yes').click();f.requests[0][result](Error('simulated denial'));await pending;
  assert.equal(f.doc.activeElement,f.fields.name);assert.equal(f.fields.idea.value,'');assert.equal(f.fields.reference.value,'');
  assert.equal(f.node('brief-copy-status').textContent,'');assert.equal(f.node('brief-copy').attrs['aria-disabled'],undefined);
  assert.equal(f.node('brief-copy').disabled,false);assert(!f.node('brief-text-fallback').open);assert.equal(f.removed,1);
 }
});
test('warm missing required fields block copy and preserve the existing reference',async()=>{
 const f=fixture();f.fields.name.value=' ';await start(f);
 assert.equal(f.requests.length,0);assert.equal(f.doc.activeElement,f.fields.name);assert.equal(f.fields.reference.value,'Сохранённый пример');
 assert.equal(f.node('brief-copy').attrs['aria-disabled'],undefined);assert.equal(f.removed,0);
});
test('warm copy can be retried after a rejected request without stale pending state',async()=>{
 const f=fixture(),first=start(f);f.requests[0].reject(Error('simulated denial'));await first;
 const second=start(f);assert.equal(f.requests.length,2);f.requests[1].resolve();await second;
 assert.match(f.node('brief-copy-status').textContent,/Бриф скопирован/);assert.equal(f.node('brief-copy').attrs['aria-disabled'],undefined);
});
test('warm copy fix preserves published mirrors and updates both cache boundaries',()=>{
 for(const path of ['brief-tools.js','app.js','index.html'])assert.equal(read('trifoti/warm/'+path),read('docs/trifoti/warm/'+path));
 assert.match(read('trifoti/warm/app.js'),/brief-tools\.js\?v=20261111-copy-focus/);
 assert.match(read('trifoti/warm/index.html'),/app\.js\?[^"\n]*copy-focus=20261111/);
});
