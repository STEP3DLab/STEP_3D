import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BRIEF_KEY,createBriefDraftSession,formatBrief} from '../dist/brief-utils.js';

const original={reference:'Медведь. С характером.',name:'Проверка',direction:'Скульптура',idea:'Исходная идея',budget:'',deadline:''};
function fixture(raw=JSON.stringify(original)) {
 const state={raw,reads:0,writes:[],readDenied:false,writeDenied:false};
 const storage={getItem(key){assert.equal(key,BRIEF_KEY);state.reads++;if(state.readDenied)throw Error('SecurityError');return state.raw;},setItem(key,value){assert.equal(key,BRIEF_KEY);if(state.writeDenied)throw Error('QuotaExceededError');state.raw=value;state.writes.push({key,value});}};
 return {state,session:()=>createBriefDraftSession(()=>storage)};
}
test('Recovery and its baseline come from the same single storage read',()=>{
 const f=fixture(),s=f.session();assert.equal(f.state.reads,1);assert.deepEqual(s.recovered,{draft:original,state:'restored'});assert.equal(f.state.writes.length,0);
});
test('Empty storage accepts the existing six fields and no extra personal data',()=>{
 const f=fixture(null),s=f.session();assert.equal(s.recovered.state,'empty');assert.equal(s.save({...original,extra:'not retained'}),'saved');assert.deepEqual(JSON.parse(f.state.raw),original);assert.equal(f.state.writes[0].key,'trifoti-brief-v1');assert.equal(s.check(),null);
});
test('Two tabs cannot silently overwrite a newer idea while editing an old budget',()=>{
 const f=fixture(),a=f.session(),b=f.session(),newIdea={...original,idea:'Новая подробная идея'},oldBudget={...original,budget:'Обсудим бюджет'};
 assert.equal(a.save(newIdea),'saved');const stored=f.state.raw;assert.equal(b.save(oldBudget),'conflict');assert.equal(f.state.raw,stored);assert.deepEqual(oldBudget,{...original,budget:'Обсудим бюджет'});assert.equal(f.state.writes.length,1);assert.equal(a.check(),null);
});
test('An external change can be announced before the stale tab next edits',()=>{
 const f=fixture(),s=f.session();f.state.raw=JSON.stringify({...original,idea:'Другая вкладка'});assert.equal(s.check(),'conflict');assert.equal(f.state.writes.length,0);
});
test('Conflict stays latched even when a later external write returns the old bytes',()=>{
 const f=fixture(),s=f.session();const initial=f.state.raw;f.state.raw='{}';assert.equal(s.check(),'conflict');f.state.raw=initial;
 for(let i=0;i<5;i++)assert.equal(s.save({...original,budget:String(i)}),'conflict');assert.equal(f.state.raw,initial);assert.equal(f.state.writes.length,0);
});
test('A queued old event does not cause a false conflict when current storage matches',()=>{
 const f=fixture(),s=f.session();assert.equal(s.save({...original,idea:'Первое изменение'}),'saved');assert.equal(s.save({...original,idea:'Последнее изменение'}),'saved');assert.equal(s.check(),null);assert.equal(f.state.writes.length,2);
});
test('Removing an existing draft is an external change, not permission to restore stale text',()=>{
 const f=fixture(),s=f.session();f.state.raw=null;assert.equal(s.save(original),'conflict');assert.equal(f.state.raw,null);assert.equal(f.state.writes.length,0);
});
test('Clearing already empty storage is not a conflict',()=>{
 const f=fixture(null),s=f.session();assert.equal(s.check(),null);assert.equal(s.save(original),'saved');
});
test('Malformed external data is preserved rather than silently overwritten',()=>{
 for(const raw of ['{broken','null','[]','42']){const f=fixture(),s=f.session();f.state.raw=raw;assert.equal(s.save(original),'conflict');assert.equal(f.state.raw,raw);assert.equal(f.state.writes.length,0);}
});
test('Comparison is conservative even for reordered but semantically similar JSON',()=>{
 const f=fixture(),s=f.session();f.state.raw=JSON.stringify(Object.fromEntries(Object.entries(original).reverse()));assert.equal(s.save(original),'conflict');assert.equal(f.state.writes.length,0);
});
test('A transient read failure blocks writes without losing a known baseline',()=>{
 const f=fixture(),s=f.session();f.state.readDenied=true;assert.equal(s.save(original),'unavailable');assert.equal(f.state.writes.length,0);f.state.readDenied=false;assert.equal(s.save({...original,budget:'Позже'}),'saved');
});
test('A recovered read failure still detects an intervening change',()=>{
 const f=fixture(),s=f.session();f.state.readDenied=true;assert.equal(s.check(),'unavailable');f.state.raw='{}';f.state.readDenied=false;assert.equal(s.save(original),'conflict');assert.equal(f.state.raw,'{}');
});
test('An unreadable initial snapshot never gains permission to overwrite unknown storage',()=>{
 for(const raw of [null,JSON.stringify(original)]){const f=fixture(raw);f.state.readDenied=true;const s=f.session();assert.equal(s.recovered.state,'unavailable');f.state.readDenied=false;assert.equal(s.save({...original,idea:'Текущие поля'}),'unavailable');assert.equal(f.state.raw,raw);assert.equal(f.state.writes.length,0);}
 const s=createBriefDraftSession(()=>{throw Error('SecurityError');});assert.equal(s.save(original),'unavailable');
});
test('Quota failures preserve the baseline and a later ordinary retry can succeed',()=>{
 const f=fixture(),s=f.session(),initial=f.state.raw;f.state.writeDenied=true;assert.equal(s.save({...original,budget:'Бюджет'}),'failed');assert.equal(f.state.raw,initial);f.state.writeDenied=false;assert.equal(s.save({...original,budget:'Бюджет'}),'saved');assert.equal(s.check(),null);
});
test('Quota recovery cannot overwrite a newer external version',()=>{
 const f=fixture(),s=f.session();f.state.writeDenied=true;assert.equal(s.save(original),'failed');f.state.writeDenied=false;f.state.raw=JSON.stringify({...original,idea:'Новое'});assert.equal(s.save(original),'conflict');assert.equal(JSON.parse(f.state.raw).idea,'Новое');
});
test('Legacy directions migrate only on an otherwise safe explicit edit',()=>{
 for(const [old,current] of [['Скульптуры и арт-объекты','Скульптура'],['Предметы и интерьер','Бытовой дизайн'],['Бренды в объёме','Сувениры, призы, награды'],['3D-модель и производство','3D-модель и производство']]){
  const f=fixture(JSON.stringify({...original,direction:old})),s=f.session();assert.equal(s.recovered.draft.direction,current);assert.equal(f.state.writes.length,0);assert.equal(s.save(s.recovered.draft),'saved');assert.equal(JSON.parse(f.state.raw).direction,current);
 }
});
test('Partial and malformed initial records retain the established recovery behavior',()=>{
 const f=fixture(JSON.stringify({name:'Проверка',idea:42})),s=f.session();assert.deepEqual(s.recovered,{draft:{name:'Проверка'},state:'partial'});assert.equal(s.save(original),'saved');
 for(const raw of ['{bad','null','[]']){const f=fixture(raw),s=f.session();assert.equal(s.recovered.state,'invalid');assert.equal(s.save(original),'saved');}
});
test('Reload restores the other stored version, not the conflicting visible fields',()=>{
 const f=fixture(),a=f.session(),b=f.session();a.save({...original,idea:'Другая сохранённая версия'});assert.equal(b.save({...original,budget:'Мой бюджет'}),'conflict');assert.equal(f.session().recovered.draft.idea,'Другая сохранённая версия');assert.equal(f.session().recovered.draft.budget,'');
});
test('Current conflicting fields remain exportable without any storage writes',()=>{
 const f=fixture(),s=f.session(),current={...original,idea:'Моя текущая идея',budget:'Мой бюджет'};f.state.raw='{}';assert.equal(s.save(current),'conflict');const text=formatBrief(current);assert(text.includes(current.idea));assert(text.includes(current.budget));assert.equal(f.state.raw,'{}');assert.equal(f.state.writes.length,0);
});

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
test('Every application autosave uses the session guard',()=>{
 assert.match(app,/draftSession=createBriefDraftSession\(\),recovered=draftSession\.recovered/);assert.match(app,/draftStatus\(draftSession\.save\(values\)\)/);assert.doesNotMatch(app,/saveBriefDraft\(|localStorage\.setItem/);
});
test('Storage events are filtered and compare current data without replacing fields or focus',()=>{
 const handler=app.match(/addEventListener\('storage',event=>\{([^\n]+)\}\);/)[1];assert.match(handler,/event\.key!==BRIEF_KEY&&event\.key!==null/);assert.match(handler,/draftSession\.check\(\)/);assert.match(handler,/draftStatus\(state\)/);assert.doesNotMatch(handler,/newValue|\.save\(|\.value=|\.focus\(|reload\(/);
});
test('Conflict feedback announces paused saving and exposes the existing local copy text',()=>{
 assert.match(app,/conflict:'Черновик изменён в другой вкладке\./);assert.match(app,/\['unavailable','invalid','partial','failed','conflict'\]/);assert.match(app,/if\(state==='conflict'\)\{\$\('#brief-text-fallback'\)\.hidden=false/);assert.match(html,/id="brief-draft-status" role="status" aria-atomic="true"/);assert.match(html,/<summary>Открыть текст брифа для копирования<\/summary>/);
});
test('Local submit remains independently available and prevents native transmission',()=>{
 const submit=app.slice(app.indexOf("form.addEventListener('submit'"),app.indexOf("$('#brief-text-fallback').addEventListener"));assert.match(submit,/e\.preventDefault\(\)/);assert.match(submit,/requestBriefDownload\(text\)/);assert.doesNotMatch(submit,/draftSession|saveDraft|fetch\(|XMLHttpRequest/);
});
test('Returning visitors receive both the new application and guarded helper',()=>{
 assert.match(html,/app\.js\?v=20261024-brief-guidance/);assert.match(app,/brief-utils\.js\?v=20261022-draft-conflict/);
});
