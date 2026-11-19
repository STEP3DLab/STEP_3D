import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('RED7 identifies the existing portfolio source beside its title without duplicating attribution',()=>{
 const html=read('trifoti/warm/cases/red7-panels.html');
 assert(html.includes('</h1><p class="case-credit">Из портфолио Step3D / X.Lab.</p>'));
 assert.equal((html.match(/Из портфолио Step3D \/ X\.Lab\./g)||[]).length,1);
 assert(html.includes('<p class="attribution">Фотографии и производственные материалы — Step3D. Персональное авторство ТРИФОТИ или Фёдора Паршина в этом кейсе не заявляется.</p>'));
 assert.equal(html,read('docs/trifoti/warm/cases/red7-panels.html'));
 assert(!read('trifoti/warm/cases/vmeste-prize.html').includes('class="case-credit"'));
 const css=read('trifoti/warm/premium.css');
 assert.match(css,/@media screen and \(max-width: 800px\) \{[\s\S]*case-credit\) \.case-credit \{ grid-row: 3; \}[\s\S]*case-credit\) \.premium-case-cover \{ grid-row: 4; \}/);
 assert.equal(css,read('docs/trifoti/warm/premium.css'));
});
