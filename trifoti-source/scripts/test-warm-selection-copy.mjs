import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('warm selection clipboard fallback respects newer focus and matches mirror',()=>{
 const warm=read('../../trifoti/warm/exploration-panel.js');
 assert.ok(warm.includes('if(!copied&&document.activeElement===share){url.focus();url.select()}'));
 assert.equal(warm,read('../../docs/trifoti/warm/exploration-panel.js'));
});
