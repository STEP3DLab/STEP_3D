import {projects} from './project-data.js';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const storage={get(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}},set(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}};
const menu=$('.menu-button'),nav=$('#navigation');
function setMenuOpen(open){menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');nav.classList.toggle('open',open)}
menu.addEventListener('click',()=>setMenuOpen(menu.getAttribute('aria-expanded')!=='true'));
$$('.header a').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenuOpen(false);menu.focus()}});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))setMenuOpen(false)});
matchMedia('(min-width: 801px)').addEventListener('change',()=>setMenuOpen(false));

let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
function download(text,name){const blob=new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}

$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;$$('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});$$('[data-category]').forEach(card=>card.hidden=filter!=='all'&&!card.dataset.category.split(' ').includes(filter));$('#filter-status').textContent=`Показано проектов: ${$$('[data-category]').filter(card=>!card.hidden).length}`}));
$$('[data-service]').forEach(a=>a.addEventListener('click',()=>{$('#brief-direction').value=a.dataset.service;saveDraft()}));

const form=$('#brief-form'),draft=storage.get('trifoti-brief-v1',{});
for(const [key,value] of Object.entries(draft)){if(form.elements.namedItem(key)&&typeof value==='string')form.elements.namedItem(key).value=value}
function saveDraft(){storage.set('trifoti-brief-v1',Object.fromEntries(new FormData(form)))}
function updateReference(){const title=form.elements.namedItem('reference').value;$('#brief-reference').hidden=!title;$('#brief-reference-title').textContent=title}
function selectReference(title){form.elements.namedItem('reference').value=title;updateReference();saveDraft()}
updateReference();
$('#clear-reference').addEventListener('click',()=>{selectReference('');form.elements.namedItem('name').focus()});
form.addEventListener('input',saveDraft);
form.addEventListener('change',saveDraft);
form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;const d=Object.fromEntries(new FormData(form));download(`ТРИФОТИ — бриф проекта\n\nИмя: ${d.name}\nНаправление: ${d.direction}${d.reference?'\nОтправная точка: '+d.reference:''}\n\nИдея:\n${d.idea}\n\nБюджет: ${d.budget||'Обсудим'}\nСроки: ${d.deadline||'Обсудим'}\n\nЭтот бриф подготовлен на сайте ТРИФОТИ. Передайте его студии удобным способом.`, 'TRIFOTI-brief.txt');$('#brief-status').textContent='Бриф сохранён файлом. Вы можете передать его студии.';toast('Бриф подготовлен к скачиванию')});

const sections=['Главная и вращающийся медведь','Направления','Проекты','Процесс','Студия','Обсуждение проекта'];
const review=storage.get('trifoti-review-v1',{sections:{},notes:''});
sections.forEach((name,i)=>{const row=document.createElement('div');row.className='review-section-row';const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');const label=document.createElement('span');label.textContent=name;const select=document.createElement('select');select.setAttribute('aria-label',`Решение по разделу «${name}»`);['Обсудить','Оставляем','Доработать','Убрать'].forEach(value=>select.add(new Option(value,value)));select.value=review.sections[name]||'Обсудить';select.addEventListener('change',()=>{review.sections[name]=select.value;storage.set('trifoti-review-v1',review)});row.append(number,label,select);$('#review-sections').append(row)});
$('#review-notes').value=review.notes;
$('#review-notes').addEventListener('input',e=>{review.notes=e.target.value;storage.set('trifoti-review-v1',review)});
$('#review-launch').addEventListener('click',()=>$('#review-dialog').showModal());
$('#export-review').addEventListener('click',()=>{download(`ТРИФОТИ — решения по сайту\nКонцепт 01\n\nСТРУКТУРА\n${sections.map((name,i)=>`${i+1}. ${name}: ${review.sections[name]||'Обсудить'}`).join('\n')}\n\nВНЕШНИЙ ВИД И ПОЖЕЛАНИЯ\n${review.notes||'Пока без комментариев'}\n\nДОПОЛНИТЬ\n— Согласованные проекты: фото и описания\n— Контакты студии\n`,'TRIFOTI-site-review.txt');$('#review-status').textContent='Решения подготовлены к скачиванию.'});
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
$$('dialog').forEach(dialog=>{let backdropPressed=false;dialog.addEventListener('pointerdown',e=>{const r=dialog.getBoundingClientRect();backdropPressed=e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)});dialog.addEventListener('click',e=>{if(backdropPressed&&e.target===dialog)dialog.close();backdropPressed=false})});
const projectDialog=$('#project-dialog');
let galleryProject=null,galleryIndex=0,slideRevision=0;
function showSlide(index){
 const project=projects[galleryProject];if(!project?.media.length)return;
 galleryIndex=(index+project.media.length)%project.media.length;const item=project.media[galleryIndex];const viewer=$('#gallery-viewer');
 $$('video',viewer).forEach(video=>video.pause());viewer.replaceChildren();const revision=++slideRevision;
 viewer.setAttribute('aria-busy','true');const status=$('#gallery-status');status.textContent='';
 let media;if(item.type==='video'){media=document.createElement('video');media.poster=item.poster;media.controls=true;media.muted=true;media.playsInline=true;media.preload='metadata';media.setAttribute('aria-label',item.caption)}else{media=document.createElement('img');media.alt=item.caption;media.decoding='async'}
 const ready=()=>{if(revision===slideRevision)viewer.setAttribute('aria-busy','false')};
 media.addEventListener(item.type==='video'?'loadedmetadata':'load',ready,{once:true});
 media.addEventListener('error',()=>{if(revision!==slideRevision)return;ready();status.textContent='Не удалось загрузить этот файл. Попробуйте другой ракурс или откройте проект снова.'},{once:true});
 media.src=item.src;viewer.append(media);$('#gallery-caption').textContent=item.caption;
 $('#gallery-counter').textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(project.media.length).padStart(2,'0')}`;
 $('#gallery-announcement').textContent=`${galleryIndex+1} из ${project.media.length}. ${item.caption}`;
 $$('.gallery-thumb').forEach((b,i)=>{b.classList.toggle('active',i===galleryIndex);b.setAttribute('aria-pressed',String(i===galleryIndex))});
 const thumbs=$('#gallery-thumbnails'),active=thumbs.children[galleryIndex];
 if(active&&thumbs.scrollWidth>thumbs.clientWidth){const left=active.offsetLeft-thumbs.offsetLeft;thumbs.scrollTo({left:Math.max(0,left-(thumbs.clientWidth-active.clientWidth)/2),behavior:'instant'})}
}
$$('[data-project]').forEach(card=>card.addEventListener('click',()=>{
 galleryProject=card.dataset.project;const p=projects[galleryProject];const host=$('#project-content');host.innerHTML='<div class="case-layout"><div class="case-gallery"><div class="gallery-viewer" id="gallery-viewer" role="group" aria-label="Медиа проекта"></div><div class="gallery-navigation"><button id="gallery-prev" class="round-button" aria-label="Предыдущий ракурс">←</button><span id="gallery-counter"></span><button id="gallery-next" class="round-button" aria-label="Следующий ракурс">→</button></div><p id="gallery-caption"></p><p id="gallery-status" role="status"></p><p id="gallery-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p><div class="gallery-thumbnails" id="gallery-thumbnails"></div></div><div class="case-copy"><span class="eyebrow" id="case-type"></span><h2 id="case-title"></h2><p id="case-description"></p><div class="tags" id="case-tags"></div><a class="button button-dark" href="#contact" id="case-contact">Обсудить похожую идею <span>↗</span></a></div></div>';
 $('#case-type').textContent=p.type;$('#case-title').textContent=p.title;$('#case-description').textContent=p.description;
 p.tags.forEach(tag=>{const span=document.createElement('span');span.textContent=tag;$('#case-tags').append(span)});
 p.media.forEach((item,i)=>{const b=document.createElement('button');b.className='gallery-thumb';b.setAttribute('aria-label',`Показать: ${item.caption}`);const img=document.createElement('img');img.src=item.poster||item.src;img.alt='';img.loading='lazy';img.decoding='async';b.append(img);if(item.type==='video'){const label=document.createElement('span');label.textContent='▷';b.append(label)}b.addEventListener('click',()=>showSlide(i));$('#gallery-thumbnails').append(b)});
 $('#gallery-prev').addEventListener('click',()=>showSlide(galleryIndex-1));$('#gallery-next').addEventListener('click',()=>showSlide(galleryIndex+1));$('#case-contact').addEventListener('click',()=>{selectReference(p.title);projectDialog.close();requestAnimationFrame(()=>form.elements.namedItem('name').focus({preventScroll:true}))});
 const multiple=p.media.length>1;$('#gallery-prev').hidden=!multiple;$('#gallery-next').hidden=!multiple;$('#gallery-thumbnails').hidden=!multiple;
 showSlide(0);projectDialog.showModal();projectDialog.scrollTop=0;
}));
projectDialog.addEventListener('keydown',e=>{if(e.target.closest('video,input,textarea,select')||projects[galleryProject]?.media.length<2)return;if(e.key==='ArrowLeft'){e.preventDefault();showSlide(galleryIndex-1)}if(e.key==='ArrowRight'){e.preventDefault();showSlide(galleryIndex+1)}});
projectDialog.addEventListener('close',()=>{slideRevision++;$$('video',projectDialog).forEach(v=>v.pause())});
import('./bear-video.js');
