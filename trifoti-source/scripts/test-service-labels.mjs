import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const links=[...html.matchAll(/<a\b([^>]*\bdata-service="([^"]+)"[^>]*)>([\s\S]*?)<\/a>/g)];
const attr=(text,name)=>text.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

test('The four requested directions appear in their exact order',()=>{
 const expected=['Дизайн интерьеров','Скульптура','Сувениры и призы','Макетирование'];
 const section=html.match(/<div class="service-list">(.*?)<\/section>/s)[1];
 assert.deepEqual([...section.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),expected);
 assert.deepEqual(links.map(m=>m[2]),expected);
});
test('Existing real cases use fitting directions without inventing architecture cases',()=>{
 assert.deepEqual(Object.keys(projects).sort(),['feather-award','gesture','mascot','pink','restoration','rto-traveling-cup','stdAwards','two-figure-composition','vmeste-prize']);
 assert.equal(projects.stdAwards.direction,'Сувениры и призы');
 for(const key of ['gesture','mascot','pink','restoration'])assert.equal(projects[key].direction,'Скульптура');
});
test('Hero, identity and contact copy follow the latest wording with stable anchors',()=>{
 assert(html.includes('Воплощаем смелые идеи: дизайн интерьеров, скульптура, сувениры и призы, макетирование.'));
 assert(html.includes('<title>ТРИФОТИ — творческое объединение</title>'));
 assert(html.includes('Творческое объединение «ТРИФОТИ»'));
 assert(html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').includes('Осуществим Вашу идею!'));
 assert(html.includes('id="studio"'));assert(html.includes('href="#studio">Об объединении'));
 assert.doesNotMatch(html,/студи[яиюе]/i);
});
test('Footer has four useful groups and only real section or case destinations',()=>{
 const footer=html.match(/<footer class="site-footer">(.*?)<\/footer>/s)[1];
 assert.deepEqual([...footer.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),['Направления','Проекты','Об объединении','Начало работы']);
 const hrefs=[...footer.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
 for(const href of hrefs){
  if(href.startsWith('cases/'))assert(readFileSync(new URL('../dist/'+href,import.meta.url)).length>0);
  else assert(html.includes(`id="${href.slice(1)}"`));
 }
 assert.equal(hrefs.filter(x=>x.startsWith('cases/')).length,6);
 for(const [,key] of footer.matchAll(/data-case-link="([^"]+)"/g))assert(Object.hasOwn(projects,key));
 assert.equal(hrefs.filter(x=>x.startsWith('#service-')).length,4);
 assert(footer.includes('aria-label="Разделы сайта"'));assert(!hrefs.includes('#'));
});

test('All four service CTAs retain their visible label, target and contextual accessible name',()=>{
 assert.equal(links.length,4);
 const names=new Set();
 for(const [,attrs,service,visible] of links){
  const label=visible.replace(/<[^>]*>/g,'').trim();assert.equal(label,'Подготовить бриф');
  assert.equal(attr(attrs,'href'),'#brief-form');
  const name=attr(attrs,'aria-label');
  assert.ok(name.startsWith(label));assert.ok(name.includes(service));names.add(name);
 }
 assert.equal(names.size,4);
});
test('Every service still selects one existing brief option',()=>{
 const select=html.match(/<select name="direction"[^>]*>(.*?)<\/select>/s)[1];
 const options=[...select.matchAll(/<option>([^<]+)<\/option>/g)].map(m=>m[1]);
 assert.equal(options.length,5);
 for(const [, ,service] of links)assert.ok(options.includes(service));
});
test('Only the existing name and idea fields are visibly and natively required',()=>{
 const labels=[...html.matchAll(/<label(?:\s[^>]*)?>([^<]*)<(input|textarea)\b([^>]*)>/g)];
 const required=labels.filter(m=>/\brequired\b/.test(m[3]));
 assert.deepEqual(required.map(m=>attr(m[3],'name')),['name','idea']);
 for(const [,label] of required)assert.match(label,/\(обязательно\)$/);
 for(const [,label,,attrs] of labels.filter(m=>['budget','deadline'].includes(attr(m[3],'name')))){
  assert.doesNotMatch(label,/обязательно/);assert.doesNotMatch(attrs,/\brequired\b/);
 }
});
test('The brief retains its original six stored fields and local-only explanation',()=>{
 const form=html.match(/<form id="brief-form"[^>]*>(.*?)<\/form>/s)[1];
 assert.deepEqual([...form.matchAll(/\bname="([^"]+)"/g)].map(m=>m[1]),['reference','name','direction','idea','budget','deadline']);
 assert.match(form,/Бриф скачивается файлом, а не отправляется объединению/);
});

test('Portfolio offers only populated filters while all four service directions remain available',()=>{
 const filters=[...html.matchAll(/<button[^>]+data-filter="([^"]+)"[^>]*>(.*?)<\/button>/g)];
 assert.deepEqual(filters.map(m=>m[1]),['all','sculpture','awards']);
 const cards=[...html.matchAll(/data-category="([^"]+)" data-project="([^"]+)"/g)];
 for(const [,key,body] of filters){
  const count=cards.filter(([,category])=>key==='all'||category.split(' ').includes(key)).length;
  assert(count>0);assert(body.includes('class="filter-count">'+count));
 }
 assert(html.includes('href="#directions">Все направления работы'));
 assert(html.includes('data-show-projects="sculpture"'));assert(html.includes('data-show-projects="awards"'));
});

test('Team presents the two researched profiles with portraits, attribution and source links',()=>{
 const team=html.slice(html.indexOf('<div class="team-block"'),html.indexOf('</section>',html.indexOf('<div class="team-block"')));
 assert.deepEqual([...team.matchAll(/<h3 id="team-[^"]+">([^<]+)<\/h3>/g)].map(m=>m[1]),['Фёдор Геннадьевич Паршин','Христина Анатольевна Понкратова']);
 assert.equal((team.match(/<img\b/g)||[]).length,2);assert.doesNotMatch(team,/team-monogram|Оксана|Владимир/);
 assert.match(team,/alt="Фёдор Геннадьевич Паршин"/);assert.match(team,/alt="Христина Анатольевна Понкратова"/);
 assert.match(team,/dobrotorium\.ru\/people\/12/);assert.match(team,/technopark-rgsu\.ru\/skb\/laboratories\/industrial-design-engineering\//);
 assert.match(team,/cttit\.ru\/news\/2024\/04\/reversivnyij-inzhiniring-itogi\.html/);assert.doesNotMatch(team,/имплант|Окончил|мастерскую|образование|medcollege\.medsi\.ru/i);
 assert.match(team,/Скульптор, заслуженный художник Крыма/);
 assert.match(team,/Чемпион БРИКС и чемпион Хайтек/);
 assert.match(team,/Подготовила нескольких чемпионов России/);
 assert.match(team,/реверсивном инжиниринге и аддитивном производстве/);
 assert(html.includes('<h2 id="team">Команда</h2>'));assert(html.includes('href="#team">Команда'));assert(!html.includes('Два взгляда.'));
});

test('Project heading and unified journal retain factual content and real actions',()=>{
 assert(html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').includes('Наши проекты'));
 assert(!html.includes('Воплощённые.'));
 const journal=html.match(/<section class="section journal[^>]*>(.*?)<\/section>/s)[1];
 assert.equal((journal.match(/<article class="journal-card"/g)||[]).length,3);
 assert(journal.includes('18 декабря 2025'));assert(journal.includes('Проект команды Технопарка РГСУ из портфолио STEP_3D'));
 for(const [,key] of journal.matchAll(/href="#project\/([^"]+)"/g))assert(Object.hasOwn(projects,key));
 assert.equal((journal.match(/data-case-link/g)||[]).length,3);assert.equal((journal.match(/loading="lazy" decoding="async"/g)||[]).length,3);
 assert(!journal.includes('Читать далее'));assert(html.includes('href="#journal">Новости и блог'));
});


test('Team background composition preserves all original portrait bytes',()=>{
 const expected={
  'fedor-parshin-480.webp':'04730ee124f5db77ffa026a8bcfe2ff9cdb6005fc362189a156791b84ada35e9',
  'fedor-parshin-920.webp':'e580da2100b16a2ffc3dcd4f2a5beed6f9788f2435ffeb6a0df91cc1b5a41093',
  'khristina-ponkratova-480.webp':'8512691a7d4cf1052b487b3aaad00f223e52b90dba6f77a7673493185726c243',
  'khristina-ponkratova-920.webp':'958a6d2e1cc6e57fa2a83b319137c9cfd845266fa39aa7d8165d2a282c8b1451'
 };
 for(const [name,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(readFileSync(new URL('../dist/assets/team/'+name,import.meta.url))).digest('hex'),hash);
 assert.match(html,/src="assets\/team\/fedor-parshin-920.webp" srcset="assets\/team\/fedor-parshin-480.webp 480w, assets\/team\/fedor-parshin-920.webp 920w"/);
});

test('Fedor mask preserves existing crop and keeps unsupported browsers on original photo',()=>{
 const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
 assert(css.includes('.team-portrait{aspect-ratio:4/3;overflow:hidden;background:#e8e5df}'));
 assert(css.includes('.team-portrait img{display:block;width:100%;height:100%;object-fit:cover;object-position:center 32%}'));
 assert(css.includes('.team-card:first-child .team-portrait img{object-position:center 14%}'));
 assert(css.includes('@supports (mask-mode:luminance){'));
 assert(css.includes('.team-card[aria-labelledby="team-fedor"] .team-portrait img{mask-image:'));
 assert(css.includes('mask-mode:luminance;mask-size:cover;mask-position:center 14%;mask-repeat:no-repeat'));
 assert(!css.includes('[aria-labelledby="team-khristina"]'));
});

test('Mask normalizes near-white to opaque without altering portrait pixels',()=>{
 const svg=readFileSync(new URL('../dist/assets/team/fedor-background-mask-20261026.svg',import.meta.url),'utf8');
 assert.match(svg,/width="1254" height="1254" viewBox="0 0 1254 1254"/);
 assert.equal((svg.match(/type="linear" slope="1.1" intercept="-0.05"/g)||[]).length,3);
 assert(svg.includes('color-interpolation-filters="sRGB"'));
 assert(svg.includes('href="data:image/png;base64,'));
});
