import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,mkdtempSync,cpSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=new URL('../../',import.meta.url), read=path=>readFileSync(new URL(path,root),'utf8');
for(const name of readdirSync(new URL('trifoti/warm/cases/',root)).filter(x=>x.endsWith('.html'))){
 test(`${name}: exact native index for every existing media frame`,()=>{
  const html=read(`trifoti/warm/cases/${name}`), index=html.match(/<details class="case-media-index".*?<\/details>/s)?.[0];
  const ids=[...html.matchAll(/<figure id="(media-[^"]+)"/g)].map(x=>x[1]);
  if(ids.length<2){assert(!index);assert(!html.includes('case-media-return'));return;}
  assert(index);
  const links=[...index.matchAll(/href="#(media-[^"]+)"/g)].map(x=>x[1]);assert.deepEqual(links,ids);
  assert.equal((html.match(/class="case-media-return"/g)||[]).length,ids.length);
  assert.equal((html.match(/id="case-media-index"/g)||[]).length,1);
  assert.equal(html,read(`docs/trifoti/warm/cases/${name}`));
  assert(!index.includes('<img'));assert(!index.includes('<script'));assert(!index.includes('https:'));
 });
}
test('Media index patch is idempotent',()=>{
 const paths=readdirSync(new URL('trifoti/warm/cases/',root)).filter(x=>x.endsWith('.html')).map(x=>`trifoti/warm/cases/${x}`);
 const dir=mkdtempSync(join(tmpdir(),'trifoti-index-'));
 try{cpSync(new URL('trifoti/warm/cases/',root),join(dir,'cases'),{recursive:true});
 execFileSync('python3',['-c',"import runpy;from pathlib import Path;import sys;runpy.run_path(sys.argv[1])['apply'](Path(sys.argv[2]))",fileURLToPath(new URL('trifoti-source/warm/case-media-index/apply.py',root)),dir]);
 assert.deepEqual(paths.map(p=>readFileSync(join(dir,'cases',p.split('/').at(-1)),'utf8')),paths.map(read));
 }finally{rmSync(dir,{recursive:true,force:true})}
});
