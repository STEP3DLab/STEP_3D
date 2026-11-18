import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=f=>readFileSync(new URL('../../'+f,import.meta.url),'utf8');
test('Project dialog clips outer overflow so focusing content cannot scroll Close out of view',()=>{
 const css=read('trifoti/warm/style.css');
 assert.match(css,/\.project-dialog\{padding:0;overflow:clip\}/);
 assert.match(css,/#project-content\{[^}]*overflow:auto/);
 assert.match(read('trifoti/warm/index.html'),/style.css\?v=20261118-modal-scroll/);
});
test('Modal scroll styles and stylesheet version are mirrored',()=>{
 for(const f of ['style.css','index.html'])assert.equal(read('trifoti/warm/'+f),read('docs/trifoti/warm/'+f));
});
