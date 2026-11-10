import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeBriefExperience} from '../../trifoti/warm/experience-ux.js';

function fixture(initialValues={}){
 const nodes=new Map(),windowEvents={};let focused=null,printed=0,valid=true;
 const make=()=>({value:'',textContent:'',style:{},dataset:{},hidden:true,open:false,children:[],handlers:{},maxLength:4000,scrollHeight:150,
  addEventListener(type,fn){this.handlers[type]=fn},append(n){this.children.push(n)},replaceChildren(){this.children=[]},
  querySelectorAll(){return this.children},focus(){focused=this},setSelectionRange(a,b){this.selection=[a,b]},dispatchEvent(event){assert.equal(event.type,'input');experience.refresh()},
 });
 const get=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id)};
 const fields=Object.fromEntries(['name','idea','direction','budget','deadline','reference'].map(k=>[k,make()]));fields.direction.value='Скульптура';
 for(const [key,value] of Object.entries(initialValues))fields[key].value=value;
 const classes=new Set(),document={getElementById:get,createElement:make,body:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k)}}};
 for(const key of ['name','idea']){const link=make();link.dataset.errorFor=key;get('brief-error-summary').children.push(link)}
 const form={elements:{namedItem:key=>fields[key]}};
 const window={Event:class{constructor(type){this.type=type}},addEventListener:(type,fn)=>windowEvents[type]=fn,print:()=>printed++};
 const old=globalThis.FormData;globalThis.FormData=class{[Symbol.iterator](){return Object.entries(fields).map(([k,v])=>[k,v.value])[Symbol.iterator]()}};
 const experience=initializeBriefExperience({form,document,window,validate:()=>valid});
 return {get,fields,experience,windowEvents,classes,get focused(){return focused},get printed(){return printed},set valid(v){valid=v},cleanup(){globalThis.FormData=old}};
}
test('Print validates, uses current values as plain text and restores the screen after printing',()=>{
 const f=fixture();try{
  f.valid=false;f.get('brief-print').handlers.click();assert.equal(f.printed,0);assert(!f.classes.has('brief-printing'));
  f.valid=true;f.fields.name.value='Анна';f.fields.idea.value='<script>no HTML</script>';f.get('brief-print').handlers.click();
  assert.equal(f.printed,1);assert.match(f.get('brief-print-text').textContent,/<script>no HTML<\/script>/);assert(f.classes.has('brief-printing'));
  f.fields.idea.value='Новая версия';f.windowEvents.beforeprint();assert.match(f.get('brief-print-text').textContent,/Новая версия/);
  f.windowEvents.afterprint();assert(!f.classes.has('brief-printing'));
 }finally{f.cleanup()}
});
test('Ordinary browser printing never selects or prepares the local brief',()=>{
 const f=fixture();try{
  f.fields.name.value='Сохранённое имя';f.fields.idea.value='Личный черновик';
  for(let i=0;i<2;i++){
   f.windowEvents.beforeprint();
   assert(!f.classes.has('brief-printing'));assert.equal(f.get('brief-print-text').textContent,'');assert.equal(f.printed,0);
   f.windowEvents.afterprint();
  }
  assert.equal(f.fields.name.value,'Сохранённое имя');assert.equal(f.fields.idea.value,'Личный черновик');
 }finally{f.cleanup()}
});
test('Cancelled or completed brief printing does not hijack the next browser print',()=>{
 const f=fixture();try{
  f.fields.name.value='Тест';f.fields.idea.value='Первая версия';
  f.get('brief-print').handlers.click();f.windowEvents.beforeprint();assert(f.classes.has('brief-printing'));
  f.windowEvents.afterprint();assert(!f.classes.has('brief-printing'));
  f.fields.idea.value='Не выбрана для печати';
  f.windowEvents.beforeprint();assert(!f.classes.has('brief-printing'));
  assert.doesNotMatch(f.get('brief-print-text').textContent,/Не выбрана для печати/);f.windowEvents.afterprint();
  // A new explicit request still prints the latest fields after cancellation.
  f.get('brief-print').handlers.click();f.windowEvents.beforeprint();assert(f.classes.has('brief-printing'));
  assert.match(f.get('brief-print-text').textContent,/Не выбрана для печати/);assert.equal(f.printed,2);
  f.windowEvents.afterprint();assert(!f.classes.has('brief-printing'));
 }finally{f.cleanup()}
});
test('Failed brief validation does not change a subsequent ordinary print',()=>{
 const f=fixture();try{
  f.valid=false;f.fields.idea.value='Незавершённый черновик';f.get('brief-print').handlers.click();
  f.windowEvents.beforeprint();assert(!f.classes.has('brief-printing'));assert.equal(f.printed,0);
  assert.equal(f.get('brief-print-text').textContent,'');
 }finally{f.cleanup()}
});

test('Published warm modules match their mirror and use fresh entry versions',()=>{
 for(const file of ['experience-ux.js','app.js','index.html'])assert.deepEqual(readFileSync(new URL('../../trifoti/warm/'+file,import.meta.url)),readFileSync(new URL('../../docs/trifoti/warm/'+file,import.meta.url)));
 assert.match(readFileSync(new URL('../../trifoti/warm/app.js',import.meta.url),'utf8'),/experience-ux\.js\?v=20261111-print-intent/);
 assert.match(readFileSync(new URL('../../trifoti/warm/index.html',import.meta.url),'utf8'),/app\.js\?v=20261111-print-intent/);
});
