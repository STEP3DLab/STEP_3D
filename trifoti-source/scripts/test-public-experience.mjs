import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {enhanceProjectCards} from '../dist/project-card-links.js';
const read=n=>readFileSync(new URL('../dist/'+n,import.meta.url),'utf8');
const html=read('index.html'),css=read('style.css');
const manifest=JSON.parse(readFileSync(new URL('./responsive-images.json',import.meta.url),'utf8'));
function setup(supported=true){let opens=0,prevented=0;const card={attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,f){this.click=f}};enhanceProjectCards([card],{dialog:{id:'project-dialog',...(supported?{showModal(){}}:{})},onOpen:c=>{assert.equal(c,card);opens++}});return{card,event:extra=>({button:0,preventDefault(){prevented++},...extra}),counts:()=>[opens,prevented]}}
test('Six native cards link to complete generated pages without JS-only semantics',()=>{
 const cards=[...html.matchAll(/<a href="([^"]+)" class="project-card[^>]*>([\s\S]*?)<\/a>/g)];assert.equal(cards.length,9);
 for(const [,href,body] of cards){assert.match(href,/^cases\/[a-zA-Z0-9-]+\.html$/);assert.match(body,/<img src="assets\/projects\//);assert.match(body,/<h3>/);assert.match(body,/alt="[^" ]/)}
 assert.doesNotMatch(html,/<button class="project-card/);
});
test('Primary activation opens dialog once and suppresses only its own default navigation',()=>{const s=setup();assert.deepEqual(s.card.attrs,{'aria-haspopup':'dialog','aria-controls':'project-dialog'});s.card.click(s.event());assert.deepEqual(s.counts(),[1,1])});
for(const flag of ['ctrlKey','metaKey','shiftKey','altKey','defaultPrevented'])test(`${flag} leaves native image-link behavior untouched`,()=>{const s=setup();s.card.click(s.event({[flag]:true}));assert.deepEqual(s.counts(),[0,0])});
test('Middle click and unsupported dialog retain native fallback',()=>{const s=setup();s.card.click(s.event({button:1}));assert.deepEqual(s.counts(),[0,0]);const unsupported=setup(false);assert.equal(unsupported.card.click,undefined);assert.deepEqual(unsupported.card.attrs,{})});
test('Concept notes explain locality without changing persisted state machinery',()=>{assert.match(html,/Записи сохраняются только в этом браузере на этом устройстве/);assert.match(html,/это не заявка и не публичные комментарии/);assert.match(html,/Скачать заметки/);assert.doesNotMatch(html,/Соберём ваш сайт|Концепт 01/)});
test('Fedor profile retains its verified role and existing internal publications link',()=>{assert.match(html,/<h3 id="team-fedor">Фёдор Геннадьевич Паршин<\/h3>/);assert.match(html,/<p class="team-role">Художник-скульптор<\/p>/);assert.match(html,/<a class="team-sources" href="#publications">/);assert.match(html,/id="publications"/)});
test('Every responsive derivative has measured bytes and original SHA; all full-size originals remain options',()=>{
 assert.equal(manifest.length,9);let source=0,narrow=0;
 for(const m of manifest){const data=readFileSync(new URL('../dist/'+m.src,import.meta.url));assert.equal(createHash('sha256').update(data).digest('hex'),m.sha256);source+=m.bytes;narrow+=m.variants.find(v=>v.width===480)?.bytes??m.bytes;
  for(const v of m.variants){assert(v.width<m.width);assert.equal(v.height,Math.round(m.height*v.width/m.width));assert.equal(statSync(new URL('../dist/'+v.src,import.meta.url)).size,v.bytes);assert(v.bytes<m.bytes);assert(html.includes(`${v.src} ${v.width}w`))}
  if(m.variants.length)assert(html.includes(`${m.src} ${m.width}w`));
 }
 assert(narrow/source<0.4);assert.equal(source,1021742);assert.equal(narrow,389042);
});
test('Forced colors is bounded, preserves user palette and covers focus, selection, errors and controls',()=>{
 const rules=css.slice(css.indexOf('@media(forced-colors:active)'));assert(rules);
 assert.match(rules,/:focus-visible\{outline:3px solid Highlight/);assert.match(rules,/aria-pressed="true"/);assert.match(rules,/gallery-thumb.active/);assert.match(rules,/aria-current="location"/);assert.match(rules,/form \[aria-invalid="true"\]\{border:2px dashed CanvasText/);assert.match(rules,/form \.brief-field-error\{color:CanvasText/);assert.match(rules,/button,\.button,select,input,textarea\{border:1px solid ButtonText/);assert.doesNotMatch(css,/forced-color-adjust\s*:\s*none/);
});
