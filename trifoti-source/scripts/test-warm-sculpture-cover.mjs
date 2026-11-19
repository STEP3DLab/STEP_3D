import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
test('Sculpture album cover preserves both complete figures at wide and narrow widths',()=>{
 const css=read('trifoti-source/warm/interior/review-20261106.css');
 assert.match(css,/\.albums-grid a:is\([^}]*\[href\$="#sculpture"\]\) img \{\s*object-fit:contain;\s*object-position:center;/);
 const page=read('trifoti/warm/index.html');
 assert(page.includes('photos/portfolio/cover-46.webp'));
 assert(page.includes('Городская скульптурная композиция с двумя фигурами'));
 assert.equal(page,read('docs/trifoti/warm/index.html'));
});
