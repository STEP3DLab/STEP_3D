import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
import {createProjectNavigation,projectKey,projectLink,copyProjectLink} from '../dist/project-navigation.js';
const keys=Object.keys(projects);
function browser(start='https://example.test/STEP_3D/trifoti/#projects') {
  let entries=[{url:new URL(start),state:null}],index=0,nav,rendered=null;
  const pending=[],calls={opens:[],closes:0,backs:0,pushes:0,replaces:0};
  const location={get hash(){return entries[index].url.hash},get href(){return entries[index].url.href}};
  const history={
    get state(){return entries[index].state},get length(){return entries.length},
    pushState(state,unused,hash){calls.pushes++;entries=entries.slice(0,index+1);entries.push({url:new URL(hash,location.href),state});index++},
    replaceState(state,unused,hash){calls.replaces++;entries[index]={url:new URL(hash,location.href),state}},
    back(){calls.backs++;pending.push(()=>{if(index>0){index--;nav.sync();nav.sync()}})},
    forward(){pending.push(()=>{if(index+1<entries.length){index++;nav.sync();nav.sync()}})},
  };
  function bind(){nav=createProjectNavigation({keys,location,history,onOpen:key=>{rendered=key;calls.opens.push(key)},onClose:()=>{rendered=null;calls.closes++;pending.push(()=>{if(!rendered)nav.closed()})}});nav.sync()}
  bind();
  return {location,history,calls,get nav(){return nav},get rendered(){return rendered},
    flush(){let count=0;while(pending.length){assert(count++<20,'History events must not loop');pending.shift()()}},
    close(){rendered=null;return nav.closed()},reload(){rendered=null;bind()},
    hash(hash){history.pushState(null,'',hash);nav.sync();nav.sync()},
  };
}

test('All five case IDs have exact, allowlisted routes; anchors and malformed IDs are ignored',()=>{
  for(const key of keys) assert.equal(projectKey('#project/'+key,keys),key);
  for(const hash of ['', '#projects','#brief','#contact','#studio','#project/unknown','#project/__proto__','#project/constructor','#project/%','#project/mascot/extra']) assert.equal(projectKey(hash,keys),null);
});
test('Fresh shared links open every case and close safely to the portfolio without leaving the site',()=>{
  for(const key of keys){const b=browser('https://example.test/#project/'+key);assert.equal(b.rendered,key);assert.equal(b.close(),'fallback');b.flush();assert.equal(b.location.hash,'#projects');assert.equal(b.rendered,null);assert.equal(b.calls.backs,0);assert.equal(b.history.length,1)}
});
test('Opening a card creates one history step; duplicate opening does not add a second',()=>{
  const b=browser();b.nav.open('mascot');b.nav.open('mascot');b.nav.sync();assert.equal(b.rendered,'mascot');assert.equal(b.calls.pushes,1);assert.equal(b.calls.opens.length,1);assert.equal(b.location.hash,'#project/mascot');
});
test('Back closes, Forward reopens, and duplicated popstate/hashchange events do not loop',()=>{
  const b=browser();b.nav.open('stdAwards');b.history.back();b.flush();assert.equal(b.rendered,null);assert.equal(b.location.hash,'#projects');b.history.forward();b.flush();assert.equal(b.rendered,'stdAwards');assert.equal(b.calls.pushes,1);assert.equal(b.calls.backs,1);
});
test('Close, Escape and backdrop all consume the app-owned case entry exactly once',()=>{
  for(const action of ['close','escape','backdrop']){const b=browser();b.nav.open('pink');assert.equal(b.close(),'back',action);b.flush();assert.equal(b.location.hash,'#projects');assert.equal(b.rendered,null);assert.equal(b.calls.backs,1);assert.equal(b.calls.pushes,1)}
});
test('Reload retains an app-owned history entry and closes back to the previous location',()=>{
  const b=browser('https://example.test/#directions');b.nav.open('restoration');b.reload();assert.equal(b.rendered,'restoration');assert.equal(b.close(),'back');b.flush();assert.equal(b.location.hash,'#directions');
});
test('A direct link without our marker never calls Back, even if unrelated history state exists',()=>{
  const b=browser('https://example.test/#project/gesture');b.history.replaceState({other:'kept'},'',b.location.hash);assert.equal(b.close(),'fallback');assert.deepEqual(b.history.state,{other:'kept'});assert.equal(b.calls.backs,0);
});
test('Case-to-brief navigation stays closed after the asynchronous close event',()=>{
  const b=browser();b.nav.open('stdAwards');b.nav.visit('#contact');b.flush();assert.equal(b.location.hash,'#contact');assert.equal(b.rendered,null);assert.equal(b.calls.backs,0);assert(!('trifotiCase' in b.history.state));
});
test('Intentional Back from the brief can reopen the prior case; closing then returns to the portfolio',()=>{
  const b=browser();b.nav.open('stdAwards');b.nav.visit('#contact');b.flush();b.history.back();b.flush();assert.equal(b.rendered,'stdAwards');b.close();b.flush();assert.equal(b.location.hash,'#projects');assert.equal(b.rendered,null);
});
test('Unknown case links close an existing gallery gracefully without rewriting the incoming URL',()=>{
  const b=browser();b.nav.open('mascot');b.hash('#project/missing');b.flush();assert.equal(b.rendered,null);assert.equal(b.location.hash,'#project/missing');assert.equal(b.calls.backs,0);assert.equal(b.nav.open('missing'),false);
});
test('Existing anchors remain native and do not acquire a case marker',()=>{
  for(const anchor of ['#projects','#brief','#contact','#studio','#home']){const b=browser('https://example.test/'+anchor);assert.equal(b.rendered,null);assert.equal(b.location.hash,anchor);assert.equal(b.calls.pushes,0)}
});
test('Public and alternate-host share links keep their current origin/path and omit unrelated query data',()=>{
  assert.equal(projectLink('https://step3dlab.github.io/STEP_3D/trifoti/?version=old#projects','stdAwards'),'https://step3dlab.github.io/STEP_3D/trifoti/#project/stdAwards');
  assert.equal(projectLink('https://preview.example.test/portfolios/trifoti/?anything=omit#home','mascot'),'https://preview.example.test/portfolios/trifoti/#project/mascot');
});
test('Copy succeeds only after an explicit, successful clipboard write',async()=>{
  let copied;assert.equal(await copyProjectLink('https://example.test/#project/mascot',{async writeText(value){copied=value}}),true);assert.equal(copied,'https://example.test/#project/mascot');
});
test('Unavailable or rejected clipboard access reports failure for the visible fallback',async()=>{
  assert.equal(await copyProjectLink('url',undefined),false);assert.equal(await copyProjectLink('url',{}),false);assert.equal(await copyProjectLink('url',{writeText(){throw Error('blocked')}}),false);assert.equal(await copyProjectLink('url',{async writeText(){throw Error('denied')}}),false);
});
test('Sharing is click-only, fallback is readonly and focus recovery excludes filtered-out cards',()=>{
  const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
  assert(app.includes("shareButton.addEventListener('click',async()=>"));assert(app.includes('<input id="case-share-url" readonly>'));assert(app.includes('card&&!card.hidden?card:'));assert(app.includes("caseNavigation.visit('#contact')"));assert(app.includes("if(!shareButton.isConnected)return"));
  const nav=readFileSync(new URL('../dist/project-navigation.js',import.meta.url),'utf8');assert(!/localStorage|sessionStorage|fetch\(/.test(nav));
});
test('First-screen studio introduction now targets the existing studio section',()=>{
  const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');assert(html.includes('class="text-link" href="#studio">Познакомиться со студией'));assert(html.includes('id="studio"'));
});
