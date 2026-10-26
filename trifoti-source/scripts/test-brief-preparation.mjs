import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {preparationDirections,preparationMaterials,ideaQuestions,appendSelectionReference,mountBriefPreparation} from '../dist/brief-preparation.js';
import {projects} from '../dist/project-data.js';
import {exactLink} from '../dist/exploration-data.js';
import {formatBrief} from '../dist/brief-utils.js';

test('Preparation directions match the existing service order, with optional source materials',()=>{
 assert.deepEqual(preparationDirections.map(d=>d.name),['Дизайн и архитектура','Скульптура','Бытовой дизайн','Сувениры, призы, награды']);
 for(const direction of preparationDirections){assert.equal(preparationMaterials(direction.name).length,3);assert(direction.question.endsWith('?'))}
 assert.deepEqual(preparationMaterials('unknown'),preparationMaterials('__proto__'));assert.equal(ideaQuestions.length,4);
});
test('Selection references preserve existing text, valid public links and original attribution',()=>{
 const original='Мой исходный пример';const result=appendSelectionReference(original,['stdAwards','mascot','pink','gesture']);
 assert(result.value.startsWith(original+'\n\n'));assert.equal(result.added,3);
 assert(result.value.includes(projects.stdAwards.attribution));assert(result.value.includes(exactLink('stdAwards')));
 assert(!result.value.includes(exactLink('gesture')));
 assert.deepEqual(appendSelectionReference(result.value,['stdAwards','mascot','pink']),{value:result.value,added:0});
});
test('Reference transfer rejects invalid IDs, de-duplicates and never truncates an existing draft',()=>{
 assert.deepEqual(appendSelectionReference('Keep',['__proto__','constructor','missing']),{value:'Keep',added:0});
 assert.equal(appendSelectionReference('',['mascot','mascot']).added,1);
 const current='x'.repeat(6000);assert.deepEqual(appendSelectionReference(current,['mascot']),{value:current,added:0,tooLong:true});
 assert.deepEqual(appendSelectionReference('Keep',null),{value:'Keep',added:0});
});
function fixture(){
 const nodes=[];let focused=null,inserted=null;const make=tag=>{const node={tag,textContent:'',children:[],listeners:{},checked:false,open:false,append(...n){this.children.push(...n)},replaceChildren(...n){this.children=n},setAttribute(k,v){this[k]=v},addEventListener(k,v){this.listeners[k]=v},focus(){focused=this}};nodes.push(node);return node};
 const direction={value:'Скульптура',_index:2,get selectedIndex(){return this._index},set selectedIndex(v){this._index=v;if(v===0)this.value='Пока не знаю — давайте обсудим'},dispatchEvent(e){assert.equal(e.type,'change');controller.refresh()}};
 const form={querySelector:()=>({after:n=>inserted=n}),elements:{namedItem:k=>{assert.equal(k,'direction');return direction}}};
 const document={createElement:make,createTextNode:text=>({textContent:text})};
 const window={Event:class{constructor(type){this.type=type}}};
 const controller=mountBriefPreparation({form,document,window});
 return {nodes,direction,controller,get inserted(){return inserted},get focused(){return focused},find:text=>nodes.find(n=>n.textContent===text)};
}
test('Preparation changes only the existing direction field on an explicit button and accepts uncertainty',()=>{
 const f=fixture();assert.equal(f.inserted.id,'brief-preparation');assert.equal(f.inserted.open,false);
 f.find('Бытовой дизайн').listeners.click();assert.equal(f.direction.value,'Бытовой дизайн');
 assert(f.nodes.some(n=>n.textContent==='Выбрано: Бытовой дизайн. Поле направления можно изменить в любой момент.'));
 f.find('Пока не знаю').listeners.click();assert.equal(f.direction.selectedIndex,0);
});
test('Checklist ticks remain in memory per direction and reset with new brief; self-check never edits draft',()=>{
 const f=fixture(),list=f.nodes.find(n=>n.className==='brief-checklist');const first=list.children[0].children[0];first.checked=true;first.listeners.change();
 f.find('Бытовой дизайн').listeners.click();assert.equal(list.children[0].children[0].checked,false);
 f.find('Скульптура').listeners.click();assert.equal(list.children[0].children[0].checked,true);
 f.controller.reset();assert.equal(list.children[0].children[0].checked,false);
 for(const input of f.nodes.filter(n=>n.tag==='input')){assert.equal(input.name,undefined);assert.equal(input.required,undefined)}
 f.find('Свернуть подсказки').listeners.click();assert.equal(f.inserted.open,false);assert.equal(f.focused,f.find('Нужна помощь с брифом?'));
});
test('Existing printable brief includes all six current fields and safely retains long text',()=>{
 const fields={name:'Имя',direction:'Скульптура',reference:appendSelectionReference('',['mascot']).value,idea:'Я'.repeat(4000)+'<b>plain</b>',budget:'100',deadline:'Позже'};
 const text=formatBrief(fields);for(const value of Object.values(fields))assert(text.includes(value));
 const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(html,/Бриф не отправлен автоматически/);
 const css=fs.readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');assert.match(css,/\.brief-printout pre\{max-width:100%;height:auto;max-height:none;overflow:visible;break-inside:auto/);
});
test('Preparation has no new storage, request, upload, HTML parsing or readiness score',()=>{
 const source=fs.readFileSync(new URL('../dist/brief-preparation.js',import.meta.url),'utf8');
 for(const pattern of [/localStorage/,/sessionStorage/,/fetch\(/,/sendBeacon/,/innerHTML/,/type='file'/,/\.name\s*=(?!=)/,/\.required\s*=/])assert.doesNotMatch(source,pattern);
 const app=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');assert.match(app,/briefPreparation\?\.reset\(\)/);assert.match(app,/appendSelectionReference\(reference.value,keys\)/);
});
