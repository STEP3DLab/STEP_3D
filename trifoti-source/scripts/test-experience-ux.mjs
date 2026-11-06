import test from 'node:test';
import assert from 'node:assert/strict';
import {briefCompletion,ideaPrompts,appendIdeaPrompt,initializeBriefExperience,initializeBackToTop} from '../dist/experience-ux.js';

test('Readiness only counts nonblank required fields, not optional choices',()=>{
 assert.equal(briefCompletion({name:' ',idea:'\n',budget:'1000'}).done,0);
 assert.equal(briefCompletion({name:'Анна',idea:''}).done,1);
 assert.deepEqual(briefCompletion({name:'Анна',idea:'Арт-объект'}),{done:2,text:'Можно сохранить · 2 из 2 обязательных полей'});
});
test('Prompts match the selected service and never insert invented project facts',()=>{
 assert(ideaPrompts('Сувениры и призы').some(([label])=>label==='Тираж'));
 assert(ideaPrompts('Дизайн интерьеров').some(([label])=>label==='Пространство'));
 assert(ideaPrompts('Макетирование').some(([label])=>label==='Масштаб'));
 assert.deepEqual(ideaPrompts('unknown'),ideaPrompts('Скульптура'));
 for(const direction of ['Скульптура','Дизайн интерьеров','Макетирование','Сувениры и призы'])for(const [,value] of ideaPrompts(direction))assert(value.endsWith(': '));
});
test('Prompt insertion preserves existing text and respects native UTF-16 maxlength',()=>{
 assert.equal(appendIdeaPrompt('Моя идея','Размер: '),'Моя идея\nРазмер: ');
 assert.equal(appendIdeaPrompt('Моя идея\n','Размер: '),'Моя идея\nРазмер: ');
 assert.equal(appendIdeaPrompt('','Размер: '),'Размер: ');
 assert.equal(appendIdeaPrompt('😀','X',3),null);
 assert.equal(appendIdeaPrompt('x'.repeat(3990),'Размер: ').length,3999);
 assert.equal(appendIdeaPrompt('x'.repeat(3992),'Размер: '),null);
});
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
test('Prompts preserve draft and textarea height is bounded',()=>{
 const f=fixture();try{
  f.fields.idea.value='Уже написано';f.get('brief-prompt-buttons').children[0].handlers.click();
  assert.equal(f.fields.idea.value,'Уже написано\nДля кого и где: ');assert.equal(f.focused,f.fields.idea);
  assert.equal(f.fields.idea.selection[0],f.fields.idea.value.length);
  f.fields.idea.scrollHeight=900;f.experience.refresh();assert.equal(f.fields.idea.style.height,'360px');
  f.fields.idea.value='x'.repeat(4000);f.experience.refresh();assert(f.get('brief-prompt-buttons').children.every(b=>b.disabled));
  const original=f.fields.idea.value;f.get('brief-prompt-buttons').children[0].handlers.click();assert.equal(f.fields.idea.value,original);
 }finally{f.cleanup()}
});
test('Optional fields start collapsed when empty and reveal each restored value on initialization',()=>{
 for(const values of [{},{budget:'По согласованию'},{deadline:'Весной'},{budget:'1000',deadline:'После согласования'}]){
  const f=fixture(values);try{
   assert.equal(f.get('brief-optional').open,Boolean(values.budget||values.deadline));
   for(const [key,value] of Object.entries(values))assert.equal(f.fields[key].value,value);
  }finally{f.cleanup()}
 }
});
test('Closing restored optional fields survives edits, prompts and repeated refreshes',()=>{
 const f=fixture({budget:'По согласованию',deadline:'Весной'});try{
  const optional=f.get('brief-optional');assert(optional.open);optional.open=false;
  for(const [key,value] of [['name','Тест'],['idea','Моя идея'],['direction','Дизайн интерьеров'],['reference','Пример']]){
   f.fields[key].value=value;f.experience.refresh();f.experience.refresh();assert.equal(optional.open,false,key);
  }
  f.get('brief-prompt-buttons').children[0].handlers.click();assert.equal(optional.open,false);
  assert.equal(f.fields.budget.value,'По согласованию');assert.equal(f.fields.deadline.value,'Весной');
  assert.equal(f.get('brief-progress').dataset.ready,'true');
 }finally{f.cleanup()}
});
test('New optional values do not override later manual closing or reopening',()=>{
 const f=fixture();try{
  const optional=f.get('brief-optional');assert.equal(optional.open,false);optional.open=true;
  f.fields.budget.value='1000';f.fields.deadline.value='Весной';f.experience.refresh();assert(optional.open);
  optional.open=false;f.fields.idea.value='Моя идея';f.experience.refresh();assert.equal(optional.open,false);
  optional.open=true;f.fields.name.value='Тест';f.experience.refresh();assert(optional.open);
  optional.open=false;f.experience.refresh();assert.equal(optional.open,false);
 }finally{f.cleanup()}
});
test('Clearing optional values preserves the current disclosure choice',()=>{
 for(const open of [false,true]){
  const f=fixture({budget:'1000'});try{
   f.get('brief-optional').open=open;f.fields.budget.value='';f.experience.refresh();
   assert.equal(f.get('brief-optional').open,open);
  }finally{f.cleanup()}
 }
});
test('Direction changes rebuild relevant prompts without clearing text',()=>{
 const f=fixture();try{f.fields.idea.value='Сохранить';f.fields.direction.value='Дизайн интерьеров';f.experience.refresh();assert.equal(f.fields.idea.value,'Сохранить');assert.equal(f.get('brief-prompt-buttons').children[0].textContent,'+ Пространство')}finally{f.cleanup()}
});
test('Error summary shows only invalid fields and links focus the matching input',()=>{
 const f=fixture();try{
  f.experience.showErrors(['idea']);const summary=f.get('brief-error-summary');assert(!summary.hidden);assert(summary.children[0].hidden);assert(!summary.children[1].hidden);
  let prevented=false;summary.children[1].handlers.click({preventDefault(){prevented=true}});assert(prevented);assert.equal(f.focused,f.fields.idea);
  f.experience.showErrors([]);assert(summary.hidden);
 }finally{f.cleanup()}
});
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
test('Back to top avoids covering brief/footer and never removes the focused control',()=>{
 let notify;const observed=[];const link={hidden:true,addEventListener(t,fn){this[t]=fn}},hero={},contact={},footer={};
 const document={activeElement:null,getElementById:id=>({'back-to-top':link,home:hero,contact}[id]),querySelector:selector=>selector==='.site-footer'?footer:null};
 initializeBackToTop({document,window:{IntersectionObserver:class{constructor(fn){notify=fn}observe(n){observed.push(n)}}}});
 assert.equal(observed.length,3);notify([{target:hero,isIntersecting:false}]);assert(!link.hidden);
 notify([{target:contact,isIntersecting:true}]);assert(link.hidden);notify([{target:contact,isIntersecting:false}]);assert(!link.hidden);
 document.activeElement=link;notify([{target:footer,isIntersecting:true}]);assert(!link.hidden);document.activeElement=null;link.blur();assert(link.hidden);
});
