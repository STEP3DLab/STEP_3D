import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const marker='/* Reflow the complete header at extreme zoom instead of clipping its controls. */';
const reflow=css.slice(css.indexOf(marker)+marker.length).trim();
const rule=selector=>{
 const match=[...reflow.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(m=>m[1].trim()===selector);
 assert(match,selector);
 return Object.fromEntries(match[2].split(';').filter(Boolean).map(v=>{const i=v.indexOf(':');return [v.slice(0,i),v.slice(i+1)]}));
};

test('Reflow is limited to the verified very narrow header, not ordinary mobile or desktop',()=>{
 assert.equal(css.split(marker).length,2);
 assert.match(reflow,/^@media\(max-width:340px\)\{/);
 assert.equal((reflow.match(/@media/g)||[]).length,1);
 assert.equal(rule('.header').display,'grid');
 assert.equal(rule('.header')['grid-template-columns'],'minmax(0,1fr) 44px');
 for(const clientWidth of [285,316.25,320,337]){
  const firstColumn=clientWidth*.9-44-8;
  assert(firstColumn>=60,'The complete final 60px logo fits beside the menu');
 }
});
test('Logo and full-size menu occupy the first row, while the existing CTA reflows below',()=>{
 assert.deepEqual(rule('.brand-full'),{'grid-column':'1','grid-row':'1'});
 assert.deepEqual(rule('.menu-button'),{'grid-column':'2','grid-row':'1'});
 assert.equal(rule('.header-cta')['grid-column'],'1/-1');
 assert.equal(rule('.header-cta')['grid-row'],'2');
 assert.match(css,/\.menu-button\{min-width:44px;min-height:44px/);
 assert.match(css,/\.brand\.brand-final\{width:60px;height:60px\}/);
});
test('Header grows with its content and never masks horizontal overflow or hides a control',()=>{
 assert.equal(rule('.header').height,'auto');
 assert.equal(rule('.header')['min-height'],'74px');
 assert(!/display:none|visibility:hidden|overflow(?:-x)?:hidden|clip-path|transform:scale/.test(reflow));
 assert(!/font-size:|color:|background:/.test(reflow));
 assert.equal((html.match(/class="menu-button"/g)||[]).length,1);
 assert.equal((html.match(/class="button header-cta"/g)||[]).length,1);
});
test('Long or enlarged labels can wrap within the available width',()=>{
 const cta=rule('.header-cta'),links=rule('.header nav a');
 assert.equal(cta['min-width'],'0');assert.equal(cta['max-width'],'100%');
 for(const r of [cta,links]){assert.equal(r['white-space'],'normal');assert.equal(r['overflow-wrap'],'anywhere');}
});
test('Expanded navigation starts below the entire header and retains a viewport-bounded scroller',()=>{
 const nav=rule('.header nav');
 assert.equal(nav.top,'100%');
 assert.equal(nav['max-height'],'calc(100dvh - 100%)');
 assert.match(css,/\.header nav\{[^}]*overflow:auto/);
 assert.match(css,/\.header nav\.open\{display:flex\}/);
 assert.equal(rule('html')['scroll-padding-top'],'132px');
});
test('The disclosure DOM order and existing labels remain unchanged',()=>{
 const header=html.match(/<header class="header">([\s\S]*?)<\/header>/)[1];
 assert(header.indexOf('brand-full')<header.indexOf('class="menu-button"'));
 assert(header.indexOf('class="menu-button"')<header.indexOf('<nav'));
 assert(header.indexOf('</nav>')<header.indexOf('header-cta'));
 assert.equal((header.match(/<nav[\s\S]*?<\/nav>/)[0].match(/<a href=/g)||[]).length,5);
 assert.match(header,/<span class="mobile-label">Проект<\/span>/);
});
