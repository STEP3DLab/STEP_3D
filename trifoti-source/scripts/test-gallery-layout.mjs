import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const dialog=html.match(/<dialog id="project-dialog"[^>]*>(.*?)<\/dialog>/s)[1];
const layout=css.slice(css.indexOf('/* Keep Close outside the scrolling case'));

test('One explicit Close precedes and stays outside the scrolling case',()=>{
 assert.match(dialog,/^<div class="project-dialog-header"><button type="button" class="close-button" data-close="project-dialog" aria-label="Закрыть проект">×<\/button><\/div><div id="project-content"><\/div>$/);
 assert.equal((dialog.match(/data-close=/g)||[]).length,1);
 assert.match(html,/<dialog id="project-dialog" class="project-dialog" aria-labelledby="case-title" aria-describedby="case-description">/);
});
test('Only open native dialogs receive the flex layout',()=>{
 assert.match(layout,/\.project-dialog\{padding:0;overflow:hidden\}/);
 assert.match(layout,/\.project-dialog\[open\]\{display:flex;flex-direction:column\}/);
 assert.doesNotMatch(layout,/\.project-dialog\{[^}]*display:/);
});
test('The fixed-size header reserves space rather than overlaying content',()=>{
 assert.match(layout,/\.project-dialog-header\{flex:0 0 60px;display:flex;justify-content:flex-end;align-items:flex-start;padding:8px 16px\}/);
 assert.match(layout,/\.project-dialog-header>\.close-button\{position:static;background:var\(--paper\)\}/);
 assert.doesNotMatch(layout,/position:(?:fixed|absolute|sticky)|z-index/);
 assert.match(css,/\.round-button,\.close-button\{width:44px;height:44px;flex-shrink:0\}/);
 assert.equal(8+44+8,60);
});
test('Only case content scrolls, can shrink, and keeps previous content insets',()=>{
 assert.match(layout,/#project-content\{min-height:0;min-width:0;overflow:auto;overscroll-behavior:contain;padding:6px 30px 30px;scroll-padding-block:6px\}/);
 assert.match(layout,/@media\(max-width:800px\)\{#project-content\{padding:6px 20px 25px\}\}/);
 assert.equal(60+6,66); // Original media/content top inset, with room for focus outlines.
 assert.doesNotMatch(layout,/height:100vh|touch-action:none|transition|animation/);
});
for(const wasOpen of [false,true])test(`Opening a case resets its new scroll area after modal initialization (already open: ${wasOpen})`,()=>{
 const events=[];
 const reset=app.match(/showSlide\(frameMemory.recall\(key,p.media.length\)\);if\(!projectDialog.open\)projectDialog.showModal\(\);[^\n]+/)[0];
 const host={set scrollTop(value){assert.equal(value,0);events.push('content-reset')}};
 const projectDialog={open:wasOpen,showModal(){this.open=true;events.push('show')},set scrollTop(value){assert.equal(value,0);events.push('outer-reset')}};
 vm.runInNewContext(reset,{key:"mascot",p:{media:[{}]},frameMemory:{recall:()=>0},showSlide:index=>{assert.equal(index,0);events.push('slide')},host,projectDialog});
 assert.deepEqual(events,wasOpen?['slide','content-reset','outer-reset']:['slide','show','content-reset','outer-reset']);
});
test('Nested Close uses the same native close handler and dialog keyboard controller',()=>{
 let click,closed=0;
 const button={dataset:{close:'project-dialog'},addEventListener:(type,fn)=>{assert.equal(type,'click');click=fn}};
 const binding=app.split('\n').find(line=>line.startsWith("$$('[data-close]')"));
 vm.runInNewContext(binding,{$$:selector=>{assert.equal(selector,'[data-close]');return[button]},document:{getElementById:id=>{assert.equal(id,'project-dialog');return{close:()=>closed++}}}});
 click();assert.equal(closed,1);assert.match(app,/keepDialogFocus\(dialog\)/);
 assert.match(app,/projectDialog.addEventListener\('close'/);
});
test('Both changed runtime resources have current release URLs',()=>{
 assert.match(html,/style\.css\?v=20261024-public-experience/);
 assert.match(html,/app\.js\?v=20261024-public-experience/);
});

test('Case context is unique and precedes media in document order',()=>{
 const template=app.match(/host.innerHTML='([^']+)'/)[1];
 assert(template.indexOf('class="case-intro"')<template.indexOf('class="case-gallery"'));
 assert(template.indexOf('class="case-gallery"')<template.indexOf('class="case-copy"'));
 for(const id of ['case-type','case-title','case-description','case-provenance','case-tags','case-contact'])assert.equal(template.split(`id="${id}"`).length-1,1);
 assert.match(css,/grid-template-areas:"intro" "media" "details"/);
 assert.match(css,/grid-template-areas:"media intro" "media details"/);
 assert.match(app,/\$\('#case-description'\).textContent=p.description/);
});
test('A clear local-download brief shortcut comes before the complete journal',()=>{
 const bridge=html.match(/<aside class="brief-bridge"[\s\S]*?<\/aside>/)[0];
 assert.match(bridge,/href="#contact">Подготовить бриф/);
 assert.match(bridge,/без отправки/);
 assert(html.indexOf(bridge)<html.indexOf('id="journal"'));
 assert.equal((html.match(/class="journal-card"/g)||[]).length,3);
 assert.doesNotMatch(bridge,/<form|<input|<iframe|https?:/);
});
