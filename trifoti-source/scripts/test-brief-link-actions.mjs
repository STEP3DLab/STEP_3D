import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const directions=['Дизайн интерьеров','Скульптура','Сувениры и призы','Макетирование'];

// Execute the actual registered app handlers, rather than a duplicate predicate.
function fixture(kind,{direction='Макетирование',selectedIndex=4,tooLong=false,filterDirection='Скульптура'}={}){
 const callbacks=new Map(),effects=[],field={value:direction,selectedIndex};
 const reference={value:'Прежний референс'},name={focus:()=>effects.push('focus')},status={textContent:''};
 const link={dataset:{service:'Скульптура'},addEventListener(type,fn){callbacks.set(type,fn)}};
 const form={elements:{namedItem:key=>({direction:field,reference,name}[key])},scrollIntoView:()=>effects.push('scroll')};
 const $=selector=>({
  '#brief-direction':field,'#empty-category-brief':link,'[data-filter][aria-pressed="true"]':{dataset:{direction:filterDirection}},
  '#case-contact':link,'#case-selection-status':status
 }[selector]);
 const context={$, $$:()=>[link],form,p:{direction:'Скульптура'},key:'mascot',
  saveDraft(){effects.push('save')},
  appendSelectionReference(value,keys){effects.push(['append',value,[...keys]]);return {value:value+' + mascot',tooLong}},
  selectReference(value){reference.value=value;effects.push('save-reference')},
  caseNavigation:{visit:hash=>effects.push(['visit',hash])},requestAnimationFrame:fn=>fn()};
 const guard=app.split('\n').find(line=>line.startsWith('function followsBriefHere('));
 if(guard)vm.runInNewContext(guard,context);
 const marker=kind==='service'?"$$('[data-service]')":kind==='empty'?"$('#empty-category-brief')":"$('#case-contact')";
 const line=app.split('\n').find(line=>line.includes(marker));assert(line,`${kind} handler must exist`);
 vm.runInNewContext(line.slice(line.indexOf(marker)),context);
 return {field,reference,status,effects,link,click(props={}){const event={button:0,defaultPrevented:false,...props,preventDefault(){effects.push('prevent');this.defaultPrevented=true}};callbacks.get('click')(event);return event}};
}

for(const kind of ['service','empty','case']){
 for(const fields of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{button:2},{defaultPrevented:true}]){
  test(`${kind}: native/handled ${JSON.stringify(fields)} leaves draft, navigation and focus untouched`,()=>{
   const f=fixture(kind),event=f.click(fields);
   assert.equal(f.field.value,'Макетирование');assert.equal(f.reference.value,'Прежний референс');
   assert.deepEqual(f.effects,[]);assert.equal(event.defaultPrevented,!!fields.defaultPrevented);
  });
 }
 for(const detail of [0,1])test(`${kind}: ordinary ${detail===0?'keyboard':'pointer'} activation still prepares the brief`,()=>{
  const f=fixture(kind,{direction:'Пока не знаю — давайте обсудим',selectedIndex:0}),event=f.click({detail});
  assert.equal(f.field.value,'Скульптура');
  if(kind==='case'){
   assert.equal(f.reference.value,'Прежний референс + mascot');assert.equal(event.defaultPrevented,true);
   assert.deepEqual(f.effects,['prevent',['append','Прежний референс',['mascot']],'save-reference',['visit','#brief-form'],'scroll','focus']);
  }else{assert.equal(event.defaultPrevented,false);assert.deepEqual(f.effects,['save']);}
 });
}
test('All four service directions still select their existing option exactly once',()=>{
 for(const direction of directions){const f=fixture('service');f.link.dataset.service=direction;f.click();assert.equal(f.field.value,direction);assert.deepEqual(f.effects,['save']);}
});
test('An empty category without a direction does not overwrite a chosen brief',()=>{
 const without=fixture('empty',{filterDirection:''});without.click();assert.equal(without.field.value,'Макетирование');assert.deepEqual(without.effects,[]);
});
test('Ordinary case activation preserves an explicitly selected direction',()=>{
 const f=fixture('case');f.click();assert.equal(f.field.value,'Макетирование');assert.equal(f.reference.value,'Прежний референс + mascot');
});
test('An overlong reference still stops before changing or saving the brief',()=>{
 const f=fixture('case',{tooLong:true});f.click();assert.equal(f.field.value,'Макетирование');assert.equal(f.reference.value,'Прежний референс');
 assert.deepEqual(f.effects,['prevent',['append','Прежний референс',['mascot']]]);assert.match(f.status.textContent,/лимит 6000/);
});
test('A native action followed by an ordinary one prepares the brief once',()=>{
 for(const kind of ['service','empty','case']){const f=fixture(kind);f.click({ctrlKey:true});f.click({detail:0});assert.equal(f.effects.filter(x=>x==='save'||x==='save-reference').length,1);}
});
