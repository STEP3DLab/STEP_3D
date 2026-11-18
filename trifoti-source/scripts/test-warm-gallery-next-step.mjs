import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const html=read('trifoti/warm/portfolio.html');
test('Gallery gives a clear local-only next step without duplicating the frame action',()=>{
 assert.match(html,/class="gallery-guide"/);
 assert.match(html,/как пример для вашей задачи/);
 assert.equal((html.match(/<a data-brief /g)||[]).length,1);
 assert.match(html,/aria-describedby="viewer-brief-note"/);
 assert.match(html,/briefUrl.searchParams.set\('portfolio', hash.slice\(1\)\)/);
 assert.match(html,/Бриф останется у вас/);
});
test('Gallery handoff markup and responsive styles have identical published mirrors',()=>{
 for(const f of ['portfolio.html','gallery-next-step.css'])assert.equal(read('trifoti/warm/'+f),read('docs/trifoti/warm/'+f));
 const css=read('trifoti/warm/gallery-next-step.css');
 assert.match(css,/@media\(max-width:540px\)/);
 assert.match(css,/@media\(max-height:580px\)/);
 assert.doesNotMatch(css,/@import/);
});
