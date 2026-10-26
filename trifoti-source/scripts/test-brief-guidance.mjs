import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {briefGuidance,updateBriefGuidance} from '../dist/brief-guidance.js';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),module=read('brief-guidance.js');
const directions=['Дизайн интерьеров','Скульптура','Сувениры и призы','Макетирование'];
test('Four directions receive distinct, short optional prompts',()=>{
 assert.equal(new Set(directions.map(briefGuidance)).size,4);
 directions.forEach(direction=>{assert.match(briefGuidance(direction),/^Если уже знаете,/);assert.ok(briefGuidance(direction).length<180)});
 assert.match(briefGuidance(directions[0]),/помещения.*размеры.*интерьере/);
 assert.match(briefGuidance(directions[1]),/образ.*размер.*место установки/);
 assert.match(briefGuidance(directions[3]),/макете.*масштаб.*детализации/);
 assert.match(briefGuidance(directions[2]),/повод.*кому.*тираж.*символике/);
});
test('Unknown and restored legacy directions retain neutral fallback',()=>{
 for(const direction of ['',undefined,null,'Пока не знаю — давайте обсудим','3D-модель и производство','toString','__proto__'])assert.match(briefGuidance(direction),/^Можно начать с пары предложений:.*Остальное уточните позже/);
});
test('Persistent text is associated with the idea textarea and readable without JS',()=>{
 assert.match(html,/<textarea id="brief-idea" name="idea" aria-describedby="brief-idea-help brief-idea-counter brief-idea-error"[^>]*required/);
 assert.match(html,/<p id="brief-idea-help" class="form-note brief-idea-help" role="status" aria-atomic="true">/);
 assert.equal((html.match(/id="brief-idea-help"/g)||[]).length,1);assert.ok(html.includes(briefGuidance('')));
 assert.match(read('style.css'),/form \.brief-idea-help\{font-size:12px;line-height:1\.6;margin:0 0 20px;overflow-wrap:anywhere\}/);
});
test('Repeated input does not rewrite or reannounce unchanged guidance',()=>{
 let text='',writes=0;const helper={get textContent(){return text},set textContent(value){text=value;writes++}};
 updateBriefGuidance({direction:directions[0],helper});updateBriefGuidance({direction:directions[0],helper});
 assert.equal(writes,1);assert.equal(text,briefGuidance(directions[0]));
 updateBriefGuidance({direction:directions[1],helper});assert.equal(writes,2);
 updateBriefGuidance({direction:'unknown',helper});assert.equal(writes,3);assert.equal(text,briefGuidance(''));
});
test('Helper cannot modify fields, focus, validation, storage or export',()=>{
 assert.doesNotMatch(module,/innerHTML|\.value\s*=|\.focus\(|setCustomValidity|localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|FormData|\.required/);
 const form=Object.freeze({idea:'Мой текст\n20 × 30',direction:directions[2]}),helper={textContent:''};
 updateBriefGuidance({direction:form.direction,helper});assert.equal(form.idea,'Мой текст\n20 × 30');assert.equal(form.direction,directions[2]);
});
test('Restore and every existing direction entry point refresh guidance',()=>{
 assert.match(app,/function refreshBriefGuidance\(\)\{updateBriefGuidance\(\{direction:form.elements.namedItem\('direction'\).value,helper:\$\('#brief-idea-help'\)\}\)\}/);
 assert.match(app,/function saveDraft\(\)\{refreshBriefGuidance\(\);briefTools\?\.refresh\(\);briefExperience\?\.refresh\(\);briefPreparation\?\.refresh\(\);const values=/);
 assert.match(app,/updateReference\(\);refreshBriefGuidance\(\);/);
 assert.ok(app.indexOf('Object.entries(recovered.draft)')<app.indexOf('updateReference();refreshBriefGuidance();'));
 assert.match(app,/form.addEventListener\('change',saveDraft\)/);
 assert.match(app,/\$\('#brief-direction'\).value=direction;saveDraft\(\)/);
 assert.match(app,/\$\('#brief-direction'\).value=a.dataset.service;saveDraft\(\)/);
});
test('Field schema, local download and conflict handling remain intact',()=>{
 const form=html.match(/<form id="brief-form"[^>]*>([\s\S]*?)<\/form>/)[1];
 assert.deepEqual([...form.matchAll(/\bname="([^"]+)"/g)].map(m=>m[1]).sort(),['budget','deadline','direction','idea','name','reference']);
 assert.match(app,/const result=requestBriefDownload\(text\)/);assert.match(app,/draftSession\.check\(\)/);assert.match(app,/draftSession\.save\(values\)/);
 assert.match(form,/Бриф скачивается файлом, а не отправляется объединению/);
});
test('Guidance release has matching local app and stylesheet cache keys',()=>{
 assert.match(app,/brief-guidance\.js\?v=20261026-directions/);
 assert.match(html,/app\.js\?v=20261026-legacy-links/);assert.match(html,/style\.css\?v=20261026-legacy-links/);
});
