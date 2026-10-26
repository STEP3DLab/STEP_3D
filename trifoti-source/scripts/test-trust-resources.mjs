import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
import {publications} from '../dist/publications-data.js';
import {readingRoutes,evidenceKinds,formGlossary,attributionNotes,packetPeople} from '../dist/trust-data.js';
import {renderTrustResources,renderInformationPack,evidenceTimeline} from './render-trust-resources.mjs';
import {packetSelection,packetURL,initializeInformationPack} from '../dist/information-pack.js';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const trust=renderTrustResources(),packet=renderInformationPack();

test('Three original reading routes reuse two to four existing sources with explicit reasons and formats',()=>{
 assert.equal(readingRoutes.length,3);
 for(const route of readingRoutes){assert(route.items.length>=2&&route.items.length<=4);assert.equal(new Set(route.items.map(item=>item.id)).size,route.items.length);for(const item of route.items){const source=publications.find(source=>source.id===item.id);assert(source);assert(item.reason.length>20);assert(trust.includes(source.kind));assert(trust.includes(source.url));}}
 assert.match(trust,/Полные тексты и видео остаются у источников/);
});
test('Timeline partitions all 21 sources without inventing precision or creation dates',()=>{
 const {dated,undated}=evidenceTimeline();assert.equal(dated.length,19);assert.equal(undated.length,2);assert.deepEqual(undated.map(item=>item.id),['P20','P08']);
 assert.equal(new Set([...dated,...undated].map(item=>item.id)).size,publications.length);
 for(let i=1;i<dated.length;i++)assert(dated[i].date.slice(0,4)>=dated[i-1].date.slice(0,4));
 assert.match(trust,/даты публикаций, а не даты создания работ/);assert.match(trust,/октябрь 2019/);assert.doesNotMatch(trust,/2019-10-01|2025-01-01/);
 assert.match(evidenceKinds.P17,/другой победитель/);assert.match(evidenceKinds.P04,/не установленный/);assert.match(evidenceKinds.P14,/об открытии/);
});
test('Four glossary definitions have specific primary source URLs and no speculative examples',()=>{
 assert.equal(formGlossary.length,4);assert.equal(new Set(formGlossary.map(item=>item.url)).size,4);
 assert.deepEqual(formGlossary.map(item=>new URL(item.url).hostname),['imma.ie','www.npg.org.uk','www.nist.gov','www.autodesk.com']);
 for(const item of formGlossary){assert(item.definition.length<260);assert(trust.includes(item.url));assert.doesNotMatch(item.definition,/ТРИФОТИ|РГСУ|Step3D/)}
 assert.match(trust,/не перечень оборудования или материалов/);
});
test('Attribution explicitly separates the collective, cup maker, awards team and sculptor sources',()=>{
 assert.equal(attributionNotes.length,4);assert.match(trust,/не означает авторство объединения/);assert.match(trust,/не его изготовитель/);assert.match(trust,/не приписывает ему все кейсы/);assert.match(trust,/Публичное вручение не означает соавторство/);
});
test('Generated resources match final HTML and packet is readable with no JavaScript',()=>{
 assert(read('index.html').includes(trust));assert.equal(read('information-pack.html'),packet);
 assert.equal((packet.match(/data-pack-case=/g)||[]).length,Object.keys(projects).length);assert.doesNotMatch(packet,/<article[^>]*hidden/);assert.match(packet,/Без JavaScript здесь показаны все кейсы/);
 for(const html of [trust,packet]){const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length);}
});
test('Packet preserves all source project descriptions and attribution without fabricated roles',()=>{
 for(const [key,p] of Object.entries(projects)){assert(packet.includes(p.description));assert(packet.includes(p.attribution||p.type));assert(packet.includes('#project/'+key));for(const source of p.sources||[])assert(packet.includes(source.url));}
 assert.equal((packet.match(/Персональные роли участников в этом кейсе не уточнены/g)||[]).length,Object.values(projects).filter(p=>!p.attribution).length);
 assert.doesNotMatch(packet,/имплант|образовани|основатель|директор ТРИФОТИ|художественный руководитель/i);
});
test('Packet preserves approved achievements and specific role-source labels without internal audit prose',()=>{
 assert.equal(packetPeople.length,2);for(const person of packetPeople)assert(packet.includes(person.ownerClaim));
 assert.doesNotMatch(packet,/По сведениям владельца|отдельная внешняя проверка|переданы владельцем|клиентских логотипов/);
 assert.equal((packet.match(/Профессиональный контекст/g)||[]).length,2);assert.match(packet,/Заслуженный художник Крыма/);assert.match(packet,/Чемпион БРИКС и чемпион Хайтек/);assert.match(packet,/Подготовила нескольких чемпионов России/);
 for(const person of packetPeople)assert(packet.includes(person.name));
});
test('Packet preserves noindex, safe external links and local-only controls',()=>{
 assert.match(packet,/name="robots" content="noindex,nofollow"/);
 for(const [,attrs] of packet.matchAll(/<a\b([^>]*)>/g))if(attrs.includes('href="https://')){assert(attrs.includes('target="_blank"'));assert(attrs.includes('rel="noopener noreferrer"'));}
 for(const [,src] of packet.matchAll(/\bsrc="([^"]+)"/g))assert(existsSync(new URL('../dist/'+src.split('?')[0],import.meta.url)));
 assert.doesNotMatch(packet,/<form|name="(?:name|idea|reference|budget|deadline|direction)"|<iframe|<video|<img/);
 for(const file of ['information-pack.js','trust-data.js'])assert.doesNotMatch(read(file),/localStorage|sessionStorage|fetch\(|XMLHttpRequest|sendBeacon|innerHTML|document\.cookie/);
});
test('Packet parser restricts hashes to existing public IDs and maximum three',()=>{
 const keys=Object.keys(projects);assert.deepEqual(packetSelection('#cases/mascot,mascot,missing,stdAwards,pink,gesture',keys),['mascot','stdAwards','pink']);
 for(const hash of ['#cases/__proto__,constructor,<script>','#project/mascot','#cases/'+ 'x'.repeat(180),null])assert.deepEqual(packetSelection(hash,keys),[]);
 assert.equal(packetURL(['mascot']),'https://step3dlab.github.io/STEP_3D/trifoti/information-pack.html#cases/mascot');
});
function fixture(hash='#cases/mascot,stdAwards'){
 let focus=null,prints=0;const listeners={},history=[];const node=extra=>({hidden:true,disabled:false,textContent:'',checked:false,listeners:{},value:'',addEventListener(type,fn){this.listeners[type]=fn},focus(){focus=this},select(){this.selected=true},scrollIntoView(options){this.scrolled=options},...extra});
 const cards=Object.keys(projects).map(key=>node({dataset:{packCase:key}})),choices=Object.keys(projects).map(key=>node({dataset:{packChoice:key}}));
 const ids=['information-pack','pack-skip','pack-feedback','pack-copy-fallback','pack-url','pack-reset','pack-selection-status','pack-print','pack-copy','pack-actions','pack-chooser'];const nodes=Object.fromEntries(ids.map(id=>[id,node()]));
 const document={getElementById:id=>nodes[id],querySelectorAll:selector=>selector==='[data-pack-case]'?cards:choices};
 const window={location:{hash,pathname:'/information-pack.html'},history:{replaceState(state,title,hash){history.push(hash);window.location.hash=hash.startsWith('#')?hash:''}},navigator:{},print(){prints++},addEventListener(type,fn){listeners[type]=fn}};
 const controller=initializeInformationPack({document,window});return {document,window,nodes,cards,choices,controller,listeners,history,get prints(){return prints},get focus(){return focus}};
}
test('Packet selection, repeat changes, maximum limit, reset and focus keep literal source cards',()=>{
 const f=fixture();assert.deepEqual(f.cards.filter(card=>!card.hidden).map(card=>card.dataset.packCase),['stdAwards','mascot']);assert.equal(f.nodes['pack-chooser'].hidden,false);
 const choose=key=>{const c=f.choices.find(c=>c.dataset.packChoice===key);c.checked=true;c.listeners.change();return c};choose('pink');assert.equal(choose('gesture').checked,false);assert.match(f.nodes['pack-feedback'].textContent,/не больше трёх/);
 assert.equal(f.cards.filter(card=>!card.hidden).length,3);
 f.nodes['pack-reset'].listeners.click();assert.equal(f.cards.filter(card=>!card.hidden).length,0);assert.equal(f.focus,f.choices[0]);assert.equal(f.window.location.hash,'');assert.equal(f.nodes['pack-reset'].disabled,true);
});
test('Packet Back/Forward hash sync updates selection without new history entries or stale fallback',()=>{
 const f=fixture();f.window.location.hash='#cases/gesture';f.listeners.popstate();assert.equal(f.history.length,0);assert.deepEqual(f.cards.filter(card=>!card.hidden).map(card=>card.dataset.packCase),['gesture']);
 f.window.location.hash='#cases/pink';f.listeners.hashchange();assert.deepEqual(f.cards.filter(card=>!card.hidden).map(card=>card.dataset.packCase),['pink']);assert.equal(f.nodes['pack-copy-fallback'].hidden,true);
});
test('Packet copy reports success only after clipboard resolution and ignores obsolete selections',async()=>{
 const f=fixture();let finish,actual;f.window.navigator.clipboard={writeText(text){actual=text;return new Promise(resolve=>finish=resolve)}};
 const pending=f.nodes['pack-copy'].listeners.click();assert.equal(f.nodes['pack-feedback'].textContent,'');assert.equal(actual,packetURL(['mascot','stdAwards']));finish();await pending;assert.match(f.nodes['pack-feedback'].textContent,/Ссылка скопирована/);
 const stale=f.nodes['pack-copy'].listeners.click();f.nodes['pack-reset'].listeners.click();finish();await stale;assert.equal(f.nodes['pack-feedback'].textContent,'');
});
test('Packet clipboard denial retains a selectable exact URL; print requests no false completion',async()=>{
 const f=fixture('#cases/gesture');f.window.navigator.clipboard={writeText(){throw Error('denied')}};await f.nodes['pack-copy'].listeners.click();assert.equal(f.nodes['pack-copy-fallback'].hidden,false);assert.equal(f.nodes['pack-url'].value,packetURL(['gesture']));assert.equal(f.focus,f.nodes['pack-url']);assert.equal(f.nodes['pack-url'].selected,true);assert.match(f.nodes['pack-feedback'].textContent,/недоступно/);
 f.nodes['pack-print'].listeners.click();assert.equal(f.prints,1);assert.doesNotMatch(f.nodes['pack-feedback'].textContent,/сохранён|напечатан/);
});
test('Existing exploration passes only current selection IDs into packet link',()=>{
 const source=read('exploration-panel.js');assert.match(source,/packet\.href='information-pack\.html'\+\(selected\.length\?'#cases\/'\+selected\.join\(','\):''\)/);
 assert.match(source,/packet\.target='_blank'/);assert.match(source,/packet\.rel='noopener noreferrer'/);
});
test('Packet print styles preserve text, source URLs and non-fixed height; pagination not claimed',()=>{
 const css=read('information-pack.css');assert.match(css,/@page\{size:A4;margin:16mm/);assert.match(css,/attr\(href\)/);assert.match(css,/height:auto;max-height:none;overflow:visible/);assert.match(css,/\[hidden\]\{display:none!important/);
 assert.doesNotMatch(css,/overflow:hidden(?!;clip)|height:100vh/);
});


test('Native skip-link enhancement preserves shared selection/hash/history while moving keyboard focus to main',()=>{
 const f=fixture(),original=f.window.location.hash;let prevented=false;
 f.nodes['pack-skip'].listeners.click({button:0,preventDefault(){prevented=true}});
 assert(prevented);assert.equal(f.window.location.hash,original);assert.equal(f.history.length,0);assert.equal(f.focus,f.nodes['information-pack']);assert.deepEqual(f.nodes['information-pack'].scrolled,{block:'start'});
 assert.deepEqual(f.cards.filter(card=>!card.hidden).map(card=>card.dataset.packCase),['stdAwards','mascot']);
 f.controller.sync();assert.equal(f.cards.filter(card=>!card.hidden).length,2);
 assert.match(packet,/<a class="skip" id="pack-skip" href="#information-pack">/);assert.match(packet,/<main id="information-pack" tabindex="-1">/);
 prevented=false;f.nodes['pack-skip'].listeners.click({button:0,ctrlKey:true,preventDefault(){prevented=true}});assert.equal(prevented,false);
});
