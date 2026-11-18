import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
for(const [key,direction] of [['atlas','industrial'],['wolves','corporate']]) test(`${key}: honest concept page retains image, return and discussion in both copies`,()=>{
const path=`warm/concepts/${key}.html`,html=read('../../trifoti/'+path);
assert.equal(html,read('../../docs/trifoti/'+path));
assert.match(html,new RegExp(`src="${key}.webp"`));
assert.match(html,new RegExp(`href="../index.html#service-${direction}"`));
assert.match(html,/href="..\/index.html#contact"/);
assert.match(html,/не готовое изделие/);
assert.match(html,/Интерактивной 3D-модели этого концепта пока нет/);
const home=read('../../trifoti/warm/index.html');
assert.match(home,new RegExp(`href="concepts/${key}.html"`));
assert.doesNotMatch(home,new RegExp(`href="concepts/${key}.webp"`));
});
test('concept renderer is repeatable for both destinations and shares responsive stylesheet',()=>{
execFileSync('python3',['-c',`from pathlib import Path
import runpy,tempfile
f=runpy.run_path('trifoti-source/warm/concepts/apply.py')['apply']
for root in ['trifoti/warm','docs/trifoti/warm']:
 with tempfile.TemporaryDirectory() as temp:
  target=Path(temp);(target/'index.html').write_text((Path(root)/'index.html').read_text());f(target)
  first=(target/'index.html').read_bytes();f(target);assert first==(target/'index.html').read_bytes()
  for name in ['atlas.html','wolves.html','concept.css']:assert (target/'concepts'/name).read_bytes()==(Path(root)/'concepts'/name).read_bytes()
`],{cwd:new URL('../../',import.meta.url)});
assert.match(read('../warm/premium/apply.py'),/concepts.*apply.py/);
const css=read('../../trifoti/warm/concepts/concept.css');
assert.match(css,/max-width:700px/);assert.match(css,/object-fit:contain/);assert.match(css,/:focus-visible/);
});
