import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('service choice starts without preselecting a direction and mirrors match',()=>{
const html=read('../../trifoti/warm/index.html');
const services=[...html.matchAll(/<details\b([^>]*\bid="service-[^"]+"[^>]*)>/g)];
assert.equal(services.length,6);
for(const [,attrs] of services) assert.doesNotMatch(attrs,/\bopen\b/);
assert.equal(html,read('../../docs/trifoti/warm/index.html'));
assert.doesNotMatch(read('../warm/directions/apply.py'),/open' if i==1/);
});
