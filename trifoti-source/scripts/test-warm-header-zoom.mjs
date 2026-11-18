import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('High zoom keeps a compact brand without sacrificing the home accessible name',()=>{
 const css=read('trifoti/warm/atelier.css');
 assert(css.includes('@media screen and (max-width:300px){.header .warm-brand-type{display:none}.header .brand.brand-blue-origin{min-width:44px;flex-shrink:0}}'));
 assert(read('trifoti/warm/index.html').includes('aria-label="ТРИФОТИ — на главную"'));
 assert.equal(css,read('docs/trifoti/warm/atelier.css'));
 assert.equal(css,read('trifoti-source/warm/interior/atelier.css'));
});
