import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('Selected award series keeps the complete image and a full-width mobile preview',()=>{
 const css=read('trifoti/warm/atelier.css');
 assert.match(css,/selected-card\[href="cases\/stdAwards.html"\]:not\(\.selected-card-feature\) \.selected-image img \{\s*aspect-ratio: 3 \/ 2; object-fit: contain;/);
 assert.match(css,/@media screen and \(max-width: 600px\) \{\s*\.warm-edition \.selected-card\[href="cases\/stdAwards.html"\]:not\(\.selected-card-feature\) \{ display: block; \}/);
 assert.equal(css,read('docs/trifoti/warm/atelier.css'));
 assert.equal(css,read('trifoti-source/warm/interior/atelier.css'));
 const html=read('trifoti-source/warm/premium/selected-work.html');
 assert(html.includes('Проект команды Технопарка РГСУ'));
 assert.equal((html.match(/href="cases\/stdAwards.html"/g)||[]).length,1);
});
