import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const rules=selector=>[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>m[1].trim()===selector).map(m=>Object.fromEntries(m[2].split(';').filter(Boolean).map(p=>{const i=p.indexOf(':');return[p.slice(0,i).trim(),p.slice(i+1).trim()]})));
const badges=rules('.media-count'),arrow=rules('.project-arrow')[0];
const captions=[...html.matchAll(/<span class="media-count">([^<]+)<\/span>/g)].map(m=>m[1]);

test('All six existing captions are retained verbatim',()=>{
 assert.deepEqual(captions,['9 фото + видео','2 фото','Видео 360°','6 фото','3 фото · от замысла до вручения','3 фото · кубок и церемония']);
});
for(const [index,label] of ['desktop','narrow'].entries())test(`${label} badge reserves the actual arrow, insets and an eight-pixel gap`,()=>{
 const rule=badges[index],left=parseFloat(rule.left),right=parseFloat(arrow.right),width=parseFloat(arrow.width);
 const reserved=left+right+width+8;
 assert.equal(rule['max-width'],`calc(100% - ${reserved}px)`);
 for(const cardWidth of [120,163.5,198.15,259.2,334.5,500]){
  const badgeRight=left+cardWidth-reserved,arrowLeft=cardWidth-right-width;
  assert(cardWidth-reserved>16); // Preserve space beyond the existing horizontal padding.
  assert(Math.abs(arrowLeft-badgeRight-8)<1e-9);
 }
});
test('Long labels wrap rather than clip or use an ellipsis',()=>{
 assert.equal(badges[0]['white-space'],'normal');
 assert.equal(badges[0]['overflow-wrap'],'anywhere');
 for(const rule of badges)for(const forbidden of ['overflow','text-overflow','line-clamp','-webkit-line-clamp','height','max-height'])assert.equal(rule[forbidden],undefined);
});
test('Typography, color, arrow size and visual state rules are unchanged',()=>{
 assert.equal(badges[0]['font-size'],'9px');assert.equal(badges[1]['font-size'],'8px');
 assert.equal(badges[0].color,'white');assert.equal(badges[0].background,'#181815bb');assert.equal(badges[0].padding,'6px 8px');
 assert.equal(arrow.width,'33px');assert.equal(arrow.height,'33px');assert.equal(arrow.right,'16px');assert.equal(arrow.bottom,'16px');
 assert.equal(rules('.project-card:hover .project-arrow')[0].background,'var(--red)');
 assert.match(css,/button:focus-visible,a:focus-visible\{outline:2px solid var\(--red\)\}/);
});
test('Returning visitors load the badge stylesheet without replacing app or data modules',()=>{
 assert.match(html,/style\.css\?v=20261023-bear-chapters/);
 assert.match(html,/app\.js\?v=20261023-viewport/);
 assert.match(css,/@media\(max-width:380px\)\{[\s\S]*?\.project-grid\{grid-template-columns:1fr\}/);
});
