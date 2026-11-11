import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const rules=selector=>[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>m[1].trim()===selector).map(m=>Object.fromEntries(m[2].split(';').filter(Boolean).map(p=>{const i=p.indexOf(':');return[p.slice(0,i).trim(),p.slice(i+1).trim()]})));
const badges=rules('.media-count'),arrow=rules('.project-arrow')[0];
const captions=[...html.matchAll(/<span class="media-count">([^<]+)<\/span>/g)].map(m=>m[1]);

test('All six existing captions are retained verbatim',()=>{
 assert.deepEqual(captions.slice(0,6),['9 фото + видео','2 фото','Видео 360°','6 фото','3 фото · от замысла до вручения','3 фото · кубок и церемония']);
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
 assert.match(html,/style\.css\?v=20261026-legacy-links/);
 assert.match(html,/app\.js\?v=20261026-legacy-links/);
 assert.match(css,/@media\(max-width:380px\)\{[\s\S]*?\.project-grid\{grid-template-columns:1fr\}/);
});

// Model the relevant width cascade, including nested media conditions. This is
// not a font-layout engine: native browser checks cover the actual rectangles.
function collectRules(source,conditions=[]){
 const result=[];let position=0;
 while(position<source.length){
  const start=source.indexOf('{',position);if(start<0)break;
  const selector=source.slice(position,start).trim();let depth=1,end=start+1;
  while(end<source.length&&depth){if(source[end]==='{')depth++;else if(source[end]==='}')depth--;end++;}
  assert.equal(depth,0,'Balanced CSS');
  const body=source.slice(start+1,end-1);
  if(selector.startsWith('@media'))result.push(...collectRules(body,[...conditions,selector]));
  else if(!selector.startsWith('@'))result.push({selectors:selector.split(',').map(s=>s.trim()),body,conditions});
  position=end;
 }
 return result;
}
const tagRules=collectRules(css.replace(/\/\*[\s\S]*?\*\//g,''))
 .filter(rule=>rule.selectors.some(selector=>selector==='.project-tag'||selector==='.project-grid .project-tag'));
function tagWidth(viewport){
 let width,weight=-1;
 for(const rule of tagRules){
  if(!rule.conditions.every(condition=>{
   if(/forced-colors|print/.test(condition))return false;
   const max=condition.match(/max-width:(\d+)px/),min=condition.match(/min-width:(\d+)px/);
   assert(max||min,'Unmodelled tag condition: '+condition);
   return (!max||viewport<=Number(max[1]))&&(!min||viewport>=Number(min[1]));
  }))continue;
  const declaration=rule.body.match(/(?:^|;)max-width:([^;]+)/);if(!declaration)continue;
  const specificity=Math.max(...rule.selectors.filter(selector=>selector==='.project-tag'||selector==='.project-grid .project-tag').map(selector=>selector.split('.').length-1));
  if(specificity>=weight){width=declaration[1];weight=specificity;}
 }
 return width;
}
for(const viewport of [320,360,361,600,601,800,801,900,901,1280]){
 test(`Project tag reserves the intended CTA lane at ${viewport}px`,()=>{
  const reserved=viewport<=360?22:viewport<=800?135:150;
  assert.equal(tagWidth(viewport),`calc(100% - ${reserved}px)`);
 });
}
test('Project tag and CTA keep full text, wrapping, and the narrow lower CTA placement',()=>{
 assert.equal((html.match(/class="project-tag"/g)||[]).length,9);
 assert.equal((html.match(/class="project-open-label">Смотреть проект<\/span>/g)||[]).length,9);
 for(const rule of tagRules)assert.doesNotMatch(rule.body,/(?:white-space:nowrap|overflow:hidden|text-overflow|line-clamp|(?:^|;)(?:max-)?height:)/);
 assert.match(css,/@media\(max-width:360px\)\{[^{}]*[\s\S]*?\.project-open-label\{top:auto;bottom:54px;right:11px\}/);
 assert.match(html,/style\.css\?[^\"]*&amp;labels=20261111-clear/);
});
