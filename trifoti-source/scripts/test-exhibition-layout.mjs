import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const exhibition=css.split('/* Exhibition layout:')[1].split('/* DOM order puts')[0];
const cards=html.match(/<div class="project-grid">([\s\S]*?)\n  <\/div>/)[1];
const hero=html.match(/<section class="hero[\s\S]*?<\/section>/)[0];

test('Real projects follow the hero in the document, before all four directions',()=>{
 assert.match(html,/<\/section>\s*<section class="section projects section-anchor" id="projects"/);
 assert(html.indexOf('id="home"')<html.indexOf('id="projects"'));
 assert(html.indexOf('id="projects"')<html.indexOf('id="directions"'));
 assert.match(html,/01 \/ Проекты/);assert.match(html,/02 \/ Что создаём/);
 const directions=['service-design','service-sculpture','service-awards','service-modelmaking'].map(id=>html.indexOf(`id="${id}"`));
 assert(directions.every((n,i)=>n>0&&(!i||n>directions[i-1])));
});
test('Hero retains its complete copy, real bear and actions in logical narrow-screen order',()=>{
 assert(hero.indexOf('hero-description')<hero.indexOf('hero-art'));
 assert(hero.indexOf('hero-followthrough')<hero.indexOf('hero-art'));
 assert.equal((hero.match(/class="hero-actions"/g)||[]).length,1);
 for(const id of ['bear-stage','bear-video','bear-gif','rotate-toggle','bear-reset'])assert(hero.includes(`id="${id}"`));
 assert.match(hero,/Пределов.*?в творчестве.*?не существует!/s);
 assert.match(exhibition,/\.hero-art\{min-height:0;width:100%;margin-top:18px;overflow:visible\}/);
 assert.match(exhibition,/font-size:clamp\(30px,11.8vw,88px\)/);
 assert.match(exhibition,/\.bear-stage\{position:relative;inset:auto;aspect-ratio:1;width:100%\}/);
 assert.doesNotMatch(exhibition,/\border:|max-height:|line-clamp/);
 assert.doesNotMatch(exhibition,/\.hero(?:-art)?\{[^}]*height:\d+(?:px|vh)/);
});
test('All six case buttons retain their natural DOM order and local image dimensions',()=>{
 assert.deepEqual([...cards.matchAll(/data-project="([^"]+)"/g)].map(m=>m[1]),['mascot','pink','gesture','restoration','stdAwards','rto-traveling-cup','feather-award','vmeste-prize','two-figure-composition']);
 const images=[...cards.matchAll(/<img [^>]+>/g)].map(m=>m[0]);assert.equal(images.length,9);
 for(const img of images){assert.match(img,/width="\d+"/);assert.match(img,/height="\d+"/);assert.match(img,/loading="lazy"/);assert.match(img,/decoding="async"/);assert.match(img,/alt="[^"].*?"/)}
 assert.equal((cards.match(/class="media-count"/g)||[]).length,9);
});
test('Editorial desktop spans collapse without sparse fixed placements when filtering',()=>{
 assert.match(exhibition,/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)/);
 assert.match(exhibition,/grid-column:span 7/);assert.match(exhibition,/grid-column:span 5/);
 assert.match(exhibition,/@media\(max-width:900px\)/);
 assert.match(exhibition,/@media\(max-width:600px\)\{\s*\.project-grid\{grid-template-columns:minmax\(0,1fr\);gap:34px\}/);
 assert.doesNotMatch(exhibition,/grid-auto-flow:dense|grid-area:/);
 assert.match(exhibition,/\.project-grid>\.project-card\{grid-column:auto\}/);
});
test('Project objects stay uncropped, captions readable, badge clear of arrow',()=>{
 assert.match(exhibition,/\.project-grid \.real-project img\{object-fit:contain/);
 assert.match(exhibition,/\.project-grid \.real-project \.project-title h3\{font-size:22px;line-height:1.3\}/);
 assert.match(exhibition,/\.project-grid \.real-project \.project-title>span\{font-size:12px\}/);
 assert.match(exhibition,/\.project-grid \.media-count\{font-size:11px;line-height:1.5;left:16px;bottom:16px;max-width:calc\(100% - 84px\);background:#20201e;color:white/);
 // 16px left + 16px right + 44px arrow + 8px clearance.
 assert.equal(16+16+44+8,84);
 assert.match(exhibition,/\.project-grid \.project-arrow\{width:44px;height:44px/);
});
test('Motion is optional, keyboard focus has equal emphasis and native navigation is preserved',()=>{
 assert.match(exhibition,/@media\(hover:hover\) and \(prefers-reduced-motion:no-preference\)/);
 assert.match(exhibition,/@media\(prefers-reduced-motion:reduce\)\{\.project-grid \.project-card img\{transform:none!important\}\}/);
 assert.match(exhibition,/\.project-card:focus-visible \.project-arrow/);
 assert.match(exhibition,/\.project-card:focus-visible \.project-title/);
 assert.doesNotMatch(exhibition,/scroll-snap|scroll-timeline|animation:|cursor:none|position:fixed/);
 assert.match(html,/style\.css\?v=20261026-legacy-links/);
 assert.match(html,/app\.js\?v=20261026-legacy-links/);
});

 test('Narrow manifesto strip wraps without hiding horizontal overflow',()=>{
 assert.match(exhibition,/@media\(max-width:340px\)\{\s*\.manifesto-strip\{flex-wrap:wrap\}/);
 assert.match(exhibition,/\.manifesto-strip a\{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;margin-left:auto\}/);
 assert.doesNotMatch(exhibition,/overflow-x:hidden/);
 });

test('Decorative diagonal arrows are font-independent and hidden from assistive names',()=>{
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 const icons=[...html.matchAll(/<span class="direction-icon(?: direction-icon-down)?" aria-hidden="true"><\/span>/g)];
 assert.equal(icons.length,32);
 assert.equal((html.match(/direction-icon-down/g)||[]).length,1);
 assert.doesNotMatch(html,/[↗↘]/);assert.doesNotMatch(app,/[↗↘]/);
 assert.match(app,/<span class="direction-icon" aria-hidden="true"><\/span>/);
 assert.match(css,/\.direction-icon::before\{[^}]*border-top:1.5px solid currentColor[^}]*rotate\(-45deg\)/);
 assert.match(css,/\.direction-icon::after\{[^}]*border-top:1.5px solid currentColor;border-right:1.5px solid currentColor/);
 assert.match(css,/\.direction-icon-down\{transform:rotate\(90deg\)\}/);
});
