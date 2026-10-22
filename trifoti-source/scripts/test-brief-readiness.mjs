import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),css=read('style.css');
const form=html.match(/<form id="brief-form">(.*?)<\/form>/s)[1];

test('The sole native submit button starts disabled, including before module evaluation',()=>{
 const buttons=[...form.matchAll(/<button\b([^>]*)>/g)];
 const submit=buttons.filter(m=>/type="submit"/.test(m[1]));assert.equal(submit.length,1);
 assert.match(submit[0][1],/id="brief-save"/);assert.match(submit[0][1],/\bdisabled\b/);
 assert.match(submit[0][1],/aria-describedby="brief-draft-status"/);
 assert.ok(buttons.every(m=>/type="(?:submit|button)"/.test(m[1])));
});
test('Initial feedback explains unavailability instead of promising an unsaved draft',()=>{
 const status=form.match(/<p[^>]*id="brief-draft-status"[^>]*>([^<]*)<\/p>/)[1];
 assert.match(status,/ещё не готово/);assert.match(status,/скопируйте текст/);
 assert.doesNotMatch(status,/Черновик сохраняется|Черновик сохранён/);
 assert.match(form,/<p[^>]*id="brief-draft-status"[^>]*role="status"/);
});
test('Noscript help explains real static content without offering transmission',()=>{
 const help=form.match(/<noscript>(.*?)<\/noscript>/s)[1];
 assert.match(help,/Для скачивания брифа нужен JavaScript/);
 assert.match(help,/описания направлений и обложки проектов/);
 assert.doesNotMatch(help,/action=|https?:|отправлен|сохранён/);
});
test('Readiness is activated only after prevention, local export and input handlers are wired',()=>{
 const submit=app.indexOf("form.addEventListener('submit',e=>{"),prevent=app.indexOf('e.preventDefault();',submit),values=app.indexOf('new FormData(form)',submit),exportCall=app.indexOf('requestBriefDownload(text)',submit),fallback=app.indexOf("$('#brief-text-fallback').addEventListener('toggle'"),status=app.indexOf('draftStatus(recovered.state);'),enable=app.indexOf("$('#brief-save').disabled=false;");
 assert.ok(submit>0&&submit<prevent&&prevent<values&&values<exportCall&&exportCall<fallback&&fallback<status&&status<enable);
 assert.ok(app.indexOf("form.addEventListener('input'")<enable);
 assert.ok(app.indexOf("form.addEventListener('change'")<enable);
 assert.equal(app.match(/brief-save/g).length,1);
 assert.doesNotMatch(app,/\.submit\(\)|fetch\(|XMLHttpRequest|sendBeacon/);
});
test('Short-height review control stays in normal flow, not hidden or inaccessible',()=>{
 const rule=css.match(/@media\(max-height:500px\)\{\.review-launch\{([^}]*)\}\}/)[1];
 assert.match(rule,/position:static/);assert.match(rule,/transform:none/);assert.match(rule,/width:max-content/);assert.match(rule,/max-width:calc\(100% - 32px\)/);
 assert.doesNotMatch(rule,/display:none|visibility:hidden|pointer-events:none/);
 assert.ok(html.indexOf('id="review-launch"')>html.indexOf('</footer>'));
 assert.match(html,/<button class="review-launch" id="review-launch">/);
});
