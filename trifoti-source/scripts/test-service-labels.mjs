import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const links=[...html.matchAll(/<a\b([^>]*\bdata-service="([^"]+)"[^>]*)>([\s\S]*?)<\/a>/g)];
const attr=(text,name)=>text.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

test('The four requested directions appear in their exact order',()=>{
 const expected=['Дизайн и архитектура','Скульптура','Бытовой дизайн','Сувениры, призы, награды'];
 const section=html.match(/<div class="service-list">(.*?)<\/section>/s)[1];
 assert.deepEqual([...section.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m=>m[1]),expected);
 assert.deepEqual(links.map(m=>m[2]),expected);
});
test('Existing real cases use fitting directions without inventing architecture cases',()=>{
 assert.deepEqual(Object.keys(projects).sort(),['gesture','mascot','pink','restoration','rto-traveling-cup','stdAwards']);
 assert.equal(projects.stdAwards.direction,'Сувениры, призы, награды');
 for(const key of ['gesture','mascot','pink','restoration'])assert.equal(projects[key].direction,'Скульптура');
});
test('Hero, identity and contact copy follow the latest wording with stable anchors',()=>{
 assert(html.includes('Воплощаем смелые идеи в дизайне и архитектуре интерьеров и экстерьеров, скульптуре и бытовом дизайне.'));
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
  if(href.startsWith('#project/'))assert(Object.hasOwn(projects,href.slice(9)));
  else assert(html.includes(`id="${href.slice(1)}"`));
 }
 assert.equal(hrefs.filter(x=>x.startsWith('#project/')).length,6);
 assert.equal(hrefs.filter(x=>x.startsWith('#service-')).length,4);
 assert(footer.includes('aria-label="Разделы сайта"'));assert(!hrefs.includes('#'));
});

test('All four service CTAs retain their visible label, target and contextual accessible name',()=>{
 assert.equal(links.length,4);
 const names=new Set();
 for(const [,attrs,service,visible] of links){
  const label=visible.replace(/<[^>]*>/g,'').trim();assert.equal(label,'Подготовить бриф');
  assert.equal(attr(attrs,'href'),'#contact');
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
 const form=html.match(/<form id="brief-form">(.*?)<\/form>/s)[1];
 assert.deepEqual([...form.matchAll(/\bname="([^"]+)"/g)].map(m=>m[1]),['reference','name','direction','idea','budget','deadline']);
 assert.match(form,/Бриф скачивается файлом, а не отправляется объединению/);
});

test('Portfolio filters use the current directions and honest case counts',()=>{
 const filters=[...html.matchAll(/<button[^>]+data-filter="([^"]+)"[^>]*>([^<]+)<\/button>/g)];
 assert.deepEqual(filters.map(m=>m[2]),['Все','Дизайн и архитектура','Скульптура','Бытовой дизайн','Сувениры, призы, награды']);
 const cards=[...html.matchAll(/data-category="([^"]+)" data-project="([^"]+)"/g)];
 assert.deepEqual(filters.map(([,key])=>cards.filter(([,category])=>key==='all'||category.split(' ').includes(key)).length),[6,0,4,0,2]);
 assert(html.includes('id="project-empty" hidden'));assert(html.includes('Проекты этого направления пока не добавлены.'));
 assert(html.includes('id="empty-category-brief" href="#contact"'));
 const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
 assert(app.includes("$('#project-empty').hidden=count>0"));assert(app.includes("b.setAttribute('aria-pressed',String(b===button))"));
});

test('Team presents the two researched profiles with portraits, attribution and source links',()=>{
 const team=html.slice(html.indexOf('<div class="team-block"'),html.indexOf('</section>',html.indexOf('<div class="team-block"')));
 assert.deepEqual([...team.matchAll(/<h3 id="team-[^"]+">([^<]+)<\/h3>/g)].map(m=>m[1]),['Фёдор Геннадьевич Паршин','Христина Анатольевна Понкратова']);
 assert.equal((team.match(/<img\b/g)||[]).length,2);assert.doesNotMatch(team,/team-monogram|Оксана|Владимир/);
 assert.match(team,/alt="Фёдор Геннадьевич Паршин"/);assert.match(team,/alt="Христина Анатольевна Понкратова"/);
 assert.match(team,/dobrotorium\.ru\/people\/12/);assert.match(team,/technopark-rgsu\.ru\/skb\/laboratories\/industrial-design-engineering\//);
 assert.match(team,/cttit\.ru\/news\/2024\/04\/reversivnyij-inzhiniring-itogi\.html/);assert.match(team,/medcollege\.medsi\.ru/);
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
