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
function fixture(){
 const nodes=new Map(),windowEvents={};let focused=null,printed=0,valid=true;
 const make=()=>({value:'',textContent:'',style:{},dataset:{},hidden:true,open:false,children:[],handlers:{},maxLength:4000,scrollHeight:150,
  addEventListener(type,fn){this.handlers[type]=fn},append(n){this.children.push(n)},replaceChildren(){this.children=[]},
  querySelectorAll(){return this.children},focus(){focused=this},setSelectionRange(a,b){this.selection=[a,b]},dispatchEvent(event){assert.equal(event.type,'input');experience.refresh()},
 });
 const get=id=>{if(!nodes.has(id))nodes.set(id,make());return nodes.get(id)};
 const fields=Object.fromEntries(['name','idea','direction','budget','deadline','reference'].map(k=>[k,make()]));fields.direction.value='Скульптура';
 const classes=new Set(),document={getElementById:get,createElement:make,body:{classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}}};
 for(const key of ['name','idea']){const link=make();link.dataset.errorFor=key;get('brief-error-summary').children.push(link)}
 const form={elements:{namedItem:key=>fields[key]}};
 const window={Event:class{constructor(type){this.type=type}},addEventListener:(type,fn)=>windowEvents[type]=fn,print:()=>printed++};
 const old=globalThis.FormData;globalThis.FormData=class{[Symbol.iterator](){return Object.entries(fields).map(([k,v])=>[k,v.value])[Symbol.iterator]()}};
 const experience=initializeBriefExperience({form,document,window,validate:()=>valid});
 return {get,fields,experience,windowEvents,classes,get focused(){return focused},get printed(){return printed},set valid(v){valid=v},cleanup(){globalThis.FormData=old}};
}
test('Restored optional values are discoverable, prompts preserve draft, height is bounded',()=>{
 const f=fixture();try{
  assert.equal(f.get('brief-optional').open,false);f.fields.budget.value='По согласованию';f.experience.refresh();assert(f.get('brief-optional').open);
  f.fields.idea.value='Уже написано';f.get('brief-prompt-buttons').children[0].handlers.click();
  assert.equal(f.fields.idea.value,'Уже написано\nДля кого и где: ');assert.equal(f.focused,f.fields.idea);
  assert.equal(f.fields.idea.selection[0],f.fields.idea.value.length);
  f.fields.idea.scrollHeight=900;f.experience.refresh();assert.equal(f.fields.idea.style.height,'360px');
  f.fields.idea.value='x'.repeat(4000);f.experience.refresh();assert(f.get('brief-prompt-buttons').children.every(b=>b.disabled));
  const original=f.fields.idea.value;f.get('brief-prompt-buttons').children[0].handlers.click();assert.equal(f.fields.idea.value,original);
 }finally{f.cleanup()}
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
test('Back to top avoids covering brief/footer and never removes the focused control',()=>{
 let notify;const observed=[];const link={hidden:true,addEventListener(t,fn){this[t]=fn}},hero={},contact={},footer={};
 const document={activeElement:null,getElementById:id=>({'back-to-top':link,home:hero,contact}[id]),querySelector:selector=>selector==='.site-footer'?footer:null};
 initializeBackToTop({document,window:{IntersectionObserver:class{constructor(fn){notify=fn}observe(n){observed.push(n)}}}});
 assert.equal(observed.length,3);notify([{target:hero,isIntersecting:false}]);assert(!link.hidden);
 notify([{target:contact,isIntersecting:true}]);assert(link.hidden);notify([{target:contact,isIntersecting:false}]);assert(!link.hidden);
 document.activeElement=link;notify([{target:footer,isIntersecting:true}]);assert(!link.hidden);document.activeElement=null;link.blur();assert(link.hidden);
});
