import test from 'node:test';import assert from 'node:assert/strict';
import {concepts,appendConcept,conceptBlock} from '../warm/concepts/concept-data.js';
import {addConceptReference} from '../warm/concepts/concept-brief.js';
const make=(key='atlas',value='Мой прежний пример',selected=1)=>{
 const fields={reference:{value},direction:{selectedIndex:selected,value:selected?'Награды':'',options:[{value:'Промышленный дизайн'},{value:'Корпоративные заказы'}]}};
 const state={fields,status:{textContent:''},saved:0,replaced:[]};
 state.args={form:{elements:{namedItem:n=>fields[n]}},status:state.status,location:{href:`https://example.test/index.html?keep=yes&concept=${key}#brief-form`},history:{state:{retain:true},replaceState:(...a)=>state.replaced.push(a)},selectReference:v=>{fields.reference.value=v;state.saved++}};return state;
};
test('both concepts append exact honest reference without replacing existing content',()=>{for(const key of Object.keys(concepts)){const s=make(key);addConceptReference(s.args);assert.equal(s.fields.reference.value,'Мой прежний пример\n\n'+conceptBlock(key));assert.equal(s.fields.direction.value,'Награды');assert.match(s.status.textContent,/Ничего не отправлено/);assert.equal(s.saved,1);assert.match(s.replaced[0][2],/keep=yes#brief-form$/);}});
test('blank direction is proposed, explicit direction wins',()=>{const s=make('wolves','',0);addConceptReference(s.args);assert.equal(s.fields.direction.value,'Корпоративные заказы');});
test('repeated link is idempotent',()=>{const s=make('atlas',conceptBlock('atlas'));addConceptReference(s.args);assert.equal(s.saved,0);assert.equal(s.fields.reference.value,conceptBlock('atlas'));});
test('limit failure preserves content and query for retry',()=>{const s=make('atlas','x'.repeat(5990));addConceptReference(s.args);assert.equal(s.saved,0);assert.equal(s.replaced.length,0);assert.equal(s.fields.reference.value.length,5990);assert.match(s.status.textContent,/лимит/);});
test('unknown key and wrong route never modify the brief',()=>{for(const key of ['__proto__','missing']){const s=make(key);addConceptReference(s.args);assert.equal(s.saved,0);}const s=make();s.args.location.href=s.args.location.href.replace('#brief-form','#contact');addConceptReference(s.args);assert.equal(s.saved,0);});
test('reference helper rejects invalid keys and never loses draft',()=>{assert.equal(appendConcept('draft','constructor').value,'draft');assert.equal(appendConcept('draft','constructor').invalid,true);});
