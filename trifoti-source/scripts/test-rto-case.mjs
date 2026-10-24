import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projects} from '../dist/project-data.js';
import {thumbnailSource} from '../dist/media-utils.js';
import {projectKey,projectLink} from '../dist/project-navigation.js';
const file=path=>readFileSync(new URL('../dist/'+path,import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
const html=file('index.html').toString(),css=file('style.css').toString(),app=file('app.js').toString();
const key='rto-traveling-cup',cup=projects[key];

test('The four non-award project records remain byte-for-byte equivalent as data',()=>{
 const previous=Object.fromEntries(Object.entries(projects).filter(([id])=>id!==key&&id!=='stdAwards'));
 assert.equal(hash(JSON.stringify(previous)),'c2f57f44df92417486f83ca2b26b3595df800bff120ca0c8963d8f20e03cf050');
 assert.equal(Object.keys(projects).length,6);
});
test('The selected cup is the second awards case, with its exact title and verified result',()=>{
 assert.equal(cup.title,'Переходящий кубок Спартакиады РТО');
 assert.equal(cup.direction,'Сувениры, призы, награды');
 assert.equal(Object.values(projects).filter(p=>p.direction===cup.direction).length,2);
 assert.match(cup.sections[1].text,/2026/);assert.match(cup.sections[1].text,/Театр «Ленком Марка Захарова»/);
 assert.equal(cup.media.length,3);
});
test('All three real photographs retain their supplied bytes and original gallery sources',()=>{
 const expected={trophy:'b02995e79c0e8c7715949feb6355e607af2b69d5db6982ab8feb7db7fea70159',ceremony:'9eeecfb7e25c0cad5bad98295acfc6301d078d621eb6da6d55bf5cf77a7789cc',winners:'55e392067af80c6928dc312b9abce9db42e86cedb7bc0a97e60c8db6353532d3'};
 assert.deepEqual(cup.media.map(m=>m.src),Object.keys(expected).map(name=>`assets/projects/${key}/${name}.webp`));
 for(const [index,[name,digest]] of Object.entries(expected).entries()){
  const media=cup.media[index];assert.equal(hash(file(media.src)),digest);assert(media.caption);assert(!media.type);
  const preview=thumbnailSource(media);assert.equal(preview,`assets/previews/${key}/${name}-thumb.webp`);
  assert(file(preview).length<file(media.src).length*.15);
 }
});
test('The cup has one lazy dimensioned portfolio card, a footer link and an uncropped cover',()=>{
 assert.equal((html.match(/data-project="rto-traveling-cup"/g)||[]).length,1);
 assert.equal((html.match(/data-case-link="rto-traveling-cup" href="assets\/projects\/rto-traveling-cup\/trophy.webp"/g)||[]).length,1);
 const card=html.match(/<a href="[^"]+" class="project-card[^>]*data-project="rto-traveling-cup">(.*?)<\/a>/s)[1];
 assert.match(card,/width="1152" height="1536" loading="lazy" decoding="async"/);
 assert.match(card,/3 фото/);assert.match(css,/\.rto-card img\{object-fit:contain\}/);
 assert.match(css,/\.awards-card\{grid-column:auto\}/);
});
test('Public attribution names Step3D, with safe sources and no unverified authorship or private details',()=>{
 assert.match(cup.type,/Из портфолио STEP_3D/);assert.match(cup.attribution,/Разработка и производство — Step3D/);
 assert.deepEqual(cup.sources.map(x=>x.url),[
  'https://step3dlab.github.io/Technopark_project/industrial-design-lab/cases/rto-traveling-cup/',
  'https://stdrf.ru/novosti/itogi-pervoy-spartakiady-rto/'
 ]);
 for(const source of cup.sources)assert.equal(new URL(source.url).protocol,'https:');
 assert.doesNotMatch(JSON.stringify(cup),/₽|договор|ИНН|КПП|подписан|Ф[её]дор|ТРИФОТИ/i);
});
test('The hyphenated case route and copy link work with the existing allowlist and public base path',()=>{
 assert.equal(projectKey('#project/'+key,Object.keys(projects)),key);
 assert.equal(projectLink('https://step3dlab.github.io/STEP_3D/trifoti/?old=1#projects',key),'https://step3dlab.github.io/STEP_3D/trifoti/#project/rto-traveling-cup');
 assert.equal(projectKey('#project/'+key+'/extra',Object.keys(projects)),null);
});
test('The new case uses the unchanged brief handoff without overwriting a chosen direction',()=>{
 assert.match(app,/if\(p.direction&&direction.selectedIndex===0\)direction.value=p.direction;selectReference\(p.title\)/);
 const form=html.match(/<form id="brief-form"[^>]*>(.*?)<\/form>/s)[1];
 assert.deepEqual([...form.matchAll(/\bname="([^"]+)"/g)].map(x=>x[1]),['reference','name','direction','idea','budget','deadline']);
});
test('Returning visitors load the matching stylesheet, app and six-case data module',()=>{
 assert.match(html,/style\.css\?v=20261024-audit-round2/);assert.match(html,/app\.js\?v=20261024-audit-round2/);
 assert.match(app,/project-data\.js\?v=20261024-case-story/);
});
