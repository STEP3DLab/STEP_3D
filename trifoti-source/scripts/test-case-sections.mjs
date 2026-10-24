import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projects} from '../dist/project-data.js';
import {mountCaseSections} from '../dist/case-sections.js';
const file=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const awards=['stdAwards','rto-traveling-cup'];
function element(tag){return{tag,children:[],append(...items){this.children.push(...items)},prepend(item){this.children.unshift(item)}}}

test('Only the two documented awards cases receive two concise editorial sections',()=>{
 assert.deepEqual(Object.keys(projects).filter(key=>projects[key].sections),awards);
 assert.deepEqual(projects.stdAwards.sections.map(s=>s.title),['Изготовление','Вручение']);
 assert.deepEqual(projects['rto-traveling-cup'].sections.map(s=>s.title),['Изготовление','Первый обладатель']);
 assert.equal(projects.stdAwards.description,'Скульптурные награды для Премии Председателя и Сопредседателя СТД РФ.');
 assert.equal(projects['rto-traveling-cup'].description,'Переходящий кубок Спартакиады Российского театрального общества.');
});
test('Unique manufacturing and ceremony facts remain explicitly attributed',()=>{
 const std=projects.stdAwards,cup=projects['rto-traveling-cup'];
 assert.match(std.sections[0].text,/Цифровой дизайн и 3D-печать готовой серии/);
 assert.match(std.sections[0].text,/командой Технопарка РГСУ/);
 assert.match(std.sections[1].text,/18 декабря 2025 года, Театральный центр «На Страстном»/);
 assert.match(std.sections[1].text,/Владимир Машков вручил премии в области драматического театра/);
 assert.match(cup.sections[0].text,/Step3D разработал и изготовил награду: 3D-моделирование, печать, сборка и декоративная отделка/);
 assert.match(cup.sections[1].text,/Театр «Ленком Марка Захарова», победитель общекомандного зачёта Спартакиады РТО 2026 года/);
 for(const project of [std,cup]){assert.match(project.type,/Из портфолио STEP_3D/);assert.equal(project.sources.length,2);assert.doesNotMatch(JSON.stringify(project.sections),/ТРИФОТИ|₽|срок изготовления/)}
 assert.equal(std.attribution,'Проект реализован командой Технопарка РГСУ.');
 assert.equal(cup.attribution,'Разработка и производство — Step3D. Из портфолио STEP_3D.');
 assert.deepEqual(std.sources.map(s=>s.url),['https://technopark-rgsu.ru/skb/news/nagrady-dlya-zvezd-teatra/','https://stdrf.ru/novosti/sostoyalos-vruchenie-premiy-predsedatelya-i-sopredsedatelya-std-rf/']);
});
test('All 25 media records and four other cases remain byte-equivalent as data',()=>{
 assert.equal(hash(Object.fromEntries(Object.entries(projects).map(([key,p])=>[key,p.media]))),'d5cf362fff1bde5d195ba44d8cd05dff1da6c6c3ac0db853d6b45feb832fc323');
 assert.equal(Object.values(projects).reduce((sum,p)=>sum+p.media.length,0),25);
 assert.equal(hash(Object.fromEntries(Object.entries(projects).filter(([key])=>!awards.includes(key)))),'c2f57f44df92417486f83ca2b26b3595df800bff120ca0c8963d8f20e03cf050');
});
test('Sections use real headings and plain text before the unchanged source links and CTA',()=>{
 for(const key of awards){
  const host=element('div'),provenance=element('div'),cta=element('a');host.append(provenance,cta);
  mountCaseSections({project:projects[key],host,document:{createElement:element}});
  assert.equal(host.children[1],provenance);assert.equal(host.children[2],cta);
  const group=host.children[0];assert.equal(group.className,'case-sections');assert.equal(group.children.length,2);
  group.children.forEach((section,i)=>{assert.equal(section.className,'case-section');assert.deepEqual(section.children.map(c=>c.tag),['h3','p']);assert.equal(section.children[0].textContent,projects[key].sections[i].title);assert.equal(section.children[1].textContent,projects[key].sections[i].text)});
 }
 const host=element('div');mountCaseSections({project:{sections:[{title:'<b>Title</b>',text:'<script>not markup</script>'}]},host,document:{createElement:element}});
 assert.equal(host.children[0].children[0].children[1].textContent,'<script>not markup</script>');
 assert.doesNotMatch(file('case-sections.js'),/innerHTML|insertAdjacentHTML|fetch\(|localStorage|addEventListener|\.focus\(/);
});
test('Legacy cases produce no empty wrappers, controls or altered copy',()=>{
 for(const project of [...Object.values(projects).filter(p=>!p.sections),{sections:[]}]){
  const host=element('div'),existing=element('div');host.append(existing);
  mountCaseSections({project,host,document:{createElement(){throw Error('legacy markup must stay unchanged')}}});
  assert.deepEqual(host.children,[existing]);
 }
});
test('Integration preserves context-first intro, provenance, gallery chapters and native behavior',()=>{
 const app=file('app.js');
 assert.match(app,/mountCaseSections\(\{project:p,host:\$\('\.case-copy'\),document\}\)/);
 assert.match(app,/\$\('#case-description'\).textContent=p.description/);
 assert.match(app,/link.target='_blank';link.rel='noopener noreferrer'/);
 assert.match(app,/updateGalleryChapters=mountGalleryChapters/);
 assert.match(app,/showSlide\(frameMemory.recall\(key,p.media.length\)\);if\(!projectDialog.open\)projectDialog.showModal\(\)/);
 const css=file('style.css').split('/* Short verified case facts')[1].split('/* Reflow the complete header')[0];
 assert.match(css,/overflow-wrap:anywhere/);assert.match(css,/\.case-section h3\{/);assert.match(css,/\.case-section p\{/);
 assert.doesNotMatch(css,/(?:^|[;{])height:|position:|animation|transition|overflow:hidden/);
});
test('Changed app, stylesheet and case data load as a matching cache release',()=>{
 assert.match(file('index.html'),/app\.js\?v=20261024-gallery-browse/);assert.match(file('index.html'),/style\.css\?v=20261024-gallery-browse/);
 assert.match(file('app.js'),/project-data\.js\?v=20261024-case-story/);assert.match(file('app.js'),/case-sections\.js\?v=20261024-case-story/);
});
