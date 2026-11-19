import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('catalog contents keeps ten original links and keyboard-native disclosure',()=>{
 const code=read('trifoti/warm/catalog.js');
 for(const hash of ['', '#catalog-stdAwards']){
  let button;const attrs={};const events={};
  const contents={querySelectorAll:()=>Array(10),before:b=>{button=b;}};
  const document={getElementById:()=>null,querySelector:()=>contents,createElement:()=>({setAttribute:(k,v)=>attrs[k]=v,getAttribute:k=>attrs[k],addEventListener:(k,f)=>events[k]=f})};
  vm.runInNewContext(code,{document,location:{hash}});
  assert.equal(button.type,'button');assert.equal(attrs['aria-controls'],'catalog-contents');
  assert.equal(attrs['aria-expanded'],String(Boolean(hash)));
  events.click();assert.equal(attrs['aria-expanded'],String(!hash));
  assert.match(button.textContent,/10 проектов/);
 }
 assert.equal(read('trifoti/warm/catalog.html'),read('docs/trifoti/warm/catalog.html'));
 assert.equal(code,read('docs/trifoti/warm/catalog.js'));
});
test('catalog collapse applies only on screen, original print markup is retained',()=>{
 const css=read('trifoti/warm/premium.css').split('/* Screen-only catalogue reading mode;')[1];
 assert.ok(css);assert.ok(css.indexOf('@media screen')<css.indexOf('[aria-expanded="false"]+ol'));
 assert.doesNotMatch(css,/@media print/);
 assert.match(css,/\.catalog-contents-toggle\{display:none\}/);
 const html=read('trifoti/warm/catalog.html');
 assert.equal((html.match(/href="#catalog-/g)||[]).length,10);
 assert.doesNotMatch(html,/catalog-contents-toggle|<details/);
});
