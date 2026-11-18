import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=f=>readFileSync(new URL('../../'+f,import.meta.url),'utf8');
const cases=readdirSync(new URL('../../trifoti/warm/cases/',import.meta.url)).filter(f=>f.endsWith('.html'));
test('Every shared case offers conversation without a form and its own example in the brief',()=>{
 assert.equal(cases.length,10);
 for(const f of cases){
  const html=read('trifoti/warm/cases/'+f), key=f.replace('.html','');
  assert.equal((html.match(/id="case-next-title"/g)||[]).length,1);
  assert.ok(html.indexOf('class="case-next-step"')>html.indexOf('Материалы проекта'));
  assert.match(html,/<a class="case-next-contact" href="\.\.\/index.html#contact">Начать с разговора<\/a>/);
  assert.ok(html.includes(`<a class="case-next-brief" href="../index.html?case=${key}#brief-form">`));
  assert.ok(html.includes('../case-next-step.css?v=20261118'));
  assert.equal(html,read('docs/trifoti/warm/cases/'+f));
 }
});
test('Case next-step is responsive and preserves a visible keyboard focus',()=>{
 const css=read('trifoti/warm/case-next-step.css');
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/:focus-visible\{outline:3px solid #ffd878/);
 assert.equal(css,read('docs/trifoti/warm/case-next-step.css'));
});
