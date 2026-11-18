import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../../trifoti/warm/'+f,import.meta.url),'utf8');
const html=read('index.html'),css=read('customer-start.css');
test('Customer sees the two routes and the local-only explanation before entering a name',()=>{
 assert.match(html,/class="customer-brief-link" href="#brief-form"/);
 assert(html.includes('Вариант 1 · без заполнения формы'));
 assert(html.includes('Вариант 2 · сначала собрать задачу'));
 assert(html.indexOf('Это не форма отправки.')<html.indexOf('id="brief-name"'));
 assert(html.includes('Сообщение вы отправляете сами.'));
});
test('New next-step guidance does not send or embed draft values',()=>{
 const block=html.match(/<div class="brief-next-step"[\s\S]*?<\/div>/)[0];
 assert.match(block,/href="#customer-start-title"/);
 assert.doesNotMatch(block,/<script|<input|https:|mailto:|tg:|data-service|onclick/);
 const contact=html.match(/<div class="enquiry-contact customer-start"[\s\S]*?<\/div>/)[0];
 assert.match(contact,/href="https:\/\/t.me\/step_3d_mngr" target="_blank" rel="noopener noreferrer"/);
 assert.doesNotMatch(contact,/\?text=|\?body=/);
});
test('The new style is scoped, responsive and identical in the published mirror',()=>{
 assert.match(html,/customer-start.css\?v=20261118-start/);
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(css,/@import|url\(/);
 for(const f of ['index.html','customer-start.css'])assert.equal(read(f),readFileSync(new URL('../../docs/trifoti/warm/'+f,import.meta.url),'utf8'));
});
