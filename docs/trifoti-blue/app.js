import {projects} from './project-data.js';
import {stories} from './project-stories.js';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const order = ['stdAwards','mascot','rto-traveling-cup','pink','restoration','gesture','feather-award','vmeste-prize','two-figure-composition'];
const credits = id => projects[id].attribution || 'Из портфолио творческого объединения ТРИФОТИ.';
const cover = id => projects[id].media[0].poster || projects[id].media[0].src;
const modal = $('#project-dialog');
const presentation = $('#presentation-dialog');
let currentProject = null, mediaIndex = 0, slideIndex = 0, selectedReference = '', toastTimer;

function toast(message) { const el=$('#toast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800); }
function lockPage(){document.body.classList.toggle('modal-open',!!$('dialog[open]'));}
function closeDialog(dialog){if(!dialog)return;$$('video',dialog).forEach(v=>v.pause());dialog.close();lockPage();}
function updateHash(id){const url=new URL(location.href);url.hash=id?`project=${id}`:'projects';history.replaceState(null,'',url);}

const menu=$('.menu-toggle'), nav=$('#main-nav');
function closeMenu(){if(!menu||!nav)return;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню');nav.classList.remove('open');}
menu?.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!expanded));menu.setAttribute('aria-label',expanded?'Открыть меню':'Закрыть меню');nav.classList.toggle('open',!expanded);});
$$('#main-nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
document.addEventListener('click',e=>{if(nav?.classList.contains('open')&&!e.target.closest('.site-header'))closeMenu();});

$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.filter;
  $$('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  $$('.project-card').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.category!==filter;});
  $('#project-grid')?.classList.toggle('filtered',filter!=='all');
  const count=$$('.project-card:not([hidden])').length;
  $('#project-count').textContent=`${count} ${count===1?'ПРОЕКТ':count<5?'ПРОЕКТА':'ПРОЕКТОВ'}`;
}));

function renderMedia(){
  const p=projects[currentProject],m=p.media[mediaIndex];
  $('#case-media-main').innerHTML=m.type==='video'?`<video controls playsinline preload="metadata" poster="${esc(m.poster)}" aria-label="${esc(m.caption)}"><source src="${esc(m.src)}" type="video/mp4">Ваш браузер не поддерживает видео.</video>`:`<img class="case-photo" src="${esc(m.src)}" alt="${esc(m.caption)}">`;
  const caption = $('#case-caption-text');
  caption.textContent = m.caption + ' ';
  const original = document.createElement('a');
  original.className = 'original-photo';
  original.href = m.originalPhoto;
  original.target = '_blank';
  original.rel = 'noopener';
  original.textContent = 'Исходный кадр ↗';
  caption.append(original);
  $('#media-count').textContent=`${mediaIndex+1} / ${p.media.length}`;
  $('#media-prev').disabled=mediaIndex===0;$('#media-next').disabled=mediaIndex===p.media.length-1;
  $$('#case-thumbs button').forEach((b,i)=>{b.classList.toggle('active',i===mediaIndex);b.setAttribute('aria-pressed',String(i===mediaIndex));});
}
function changeMedia(index){const p=projects[currentProject];mediaIndex=Math.max(0,Math.min(p.media.length-1,index));renderMedia();}
function storyTeaser(id){
  const story=stories[id];
  if(!story)return (projects[id].sections||[]).map(s=>`<div class="case-section"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>`).join('');
  return `<div class="case-story-teaser"><h3>${esc(story.hook)}</h3><ol>${story.steps.map(([title],i)=>`<li><span>0${i+1}</span>${esc(title)}</li>`).join('')}</ol><a class="text-button" href="cases/${id}.html">Полная история проекта <span aria-hidden="true">↗</span></a></div>`;
}

function openProject(id,{hash=true}={}){
  if(!projects[id]||!modal)return;
  if(presentation?.open)closeDialog(presentation);
  currentProject=id;mediaIndex=0;const p=projects[id],idx=order.indexOf(id);
  $('#case-content').innerHTML=`<div class="case-layout"><div class="case-media"><div id="case-media-main"></div><div class="case-caption"><p id="case-caption-text"></p><span id="media-count" aria-live="polite"></span><div class="media-controls"><button id="media-prev" aria-label="Предыдущий ракурс">←</button><button id="media-next" aria-label="Следующий ракурс">→</button></div></div><div class="case-thumbs" id="case-thumbs" role="group" aria-label="Ракурсы проекта">${p.media.map((m,i)=>`<button data-media="${i}" aria-label="${esc(m.type==='video'?'Видео: ':'Ракурс: ')}${esc(m.caption)}" aria-pressed="${i===0}"><img src="${esc(m.poster||m.src)}" alt="" loading="lazy"></button>`).join('')}</div></div><div class="case-copy"><div class="section-label">${esc(p.type)}</div><h2 id="case-title">${esc(p.title)}</h2><p>${esc(p.description)}</p><div class="tags">${(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('')}</div>${storyTeaser(id)}<p class="case-credit">${esc(credits(id))}</p><div class="case-sources">${(p.sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`).join('')}</div><button class="button cyan" id="case-to-brief">Хочу обсудить похожую идею <span>↗</span></button></div></div><div class="case-nav"><button id="case-prev" ${idx===0?'disabled':''}>← Предыдущий проект</button><button id="case-next" ${idx===order.length-1?'disabled':''}>Следующий проект →</button></div>`;
  $('#media-prev').addEventListener('click',()=>changeMedia(mediaIndex-1));$('#media-next').addEventListener('click',()=>changeMedia(mediaIndex+1));
  $$('#case-thumbs button').forEach(b=>b.addEventListener('click',()=>changeMedia(Number(b.dataset.media))));
  $('#case-prev').addEventListener('click',()=>openProject(order[idx-1]));$('#case-next').addEventListener('click',()=>openProject(order[idx+1]));
  $('#case-to-brief').addEventListener('click',()=>{selectedReference=id;closeDialog(modal);updateReference();setDirection(p.direction==='Сувениры и призы'?'Награды и призы':p.direction);});
  renderMedia();if(!modal.open)modal.showModal();modal.scrollTop=0;lockPage();if(hash)updateHash(id);
}
$$('[data-project]').forEach(el=>el.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();openProject(el.dataset.project);}));
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeDialog(document.getElementById(b.dataset.close))));
$$('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{lockPage();$$('video',dialog).forEach(v=>v.pause());if(dialog===modal&&location.hash.startsWith('#project='))updateHash(null);});
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(dialog);});
});
modal?.addEventListener('keydown',e=>{if(e.target.closest('video,textarea,input,select'))return;if(e.key==='ArrowRight'){e.preventDefault();changeMedia(mediaIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();changeMedia(mediaIndex-1);}});
function readHash(){const id=location.hash.match(/^#project=([\w-]+)$/)?.[1];if(id&&projects[id])openProject(id,{hash:false});}
window.addEventListener('hashchange',readHash);readHash();

function renderSlide(){
  const id=order[slideIndex-1];
  if(slideIndex===0){$('#slide-content').innerHTML=`<div class="slide"><img src="assets/logo-original.jpg" alt="ТРИФОТИ — творческий комбинат"><div class="slide-copy"><div class="section-label">ИСКУССТВО × ДИЗАЙН × ИНЖЕНЕРИЯ</div><h2 id="slide-title">Придаём<br>идеям <em>форму.</em></h2><p>Скульптура, авторские награды, дизайн интерьеров и макеты. От художественного замысла — к реальному объекту.</p><p class="slide-credit">ТРИФОТИ / Москва</p><a class="text-button" href="show.html">Короткий показ · 3 проекта <span aria-hidden="true">↗</span></a></div></div>`;}
  else {const p=projects[id];$('#slide-content').innerHTML=`<div class="slide"><img src="${esc(cover(id))}" alt="${esc(p.title)}"><div class="slide-copy"><div class="section-label">${esc(p.type)}</div><h2 id="slide-title">${esc(p.title)}</h2><p>${esc(p.description)}</p><p class="slide-credit">${esc(credits(id))}</p><button class="text-button" id="slide-details">Рассмотреть детали <span>↗</span></button></div></div>`;$('#slide-details').addEventListener('click',()=>openProject(id));}
  $('#slide-count').textContent=`${String(slideIndex+1).padStart(2,'0')} / ${String(order.length+1).padStart(2,'0')}`;
  $('#slide-prev').disabled=slideIndex===0;$('#slide-next').disabled=slideIndex===order.length;
}
function nextSlide(step){slideIndex=Math.max(0,Math.min(order.length,slideIndex+step));renderSlide();}
$$('[data-presentation]').forEach(button=>button.addEventListener('click',()=>{slideIndex=0;renderSlide();presentation.showModal();lockPage();}));
$('#slide-prev')?.addEventListener('click',()=>nextSlide(-1));$('#slide-next')?.addEventListener('click',()=>nextSlide(1));
presentation?.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();nextSlide(1);}if(e.key==='ArrowLeft'){e.preventDefault();nextSlide(-1);}});
let touchX=null;
presentation?.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].screenX;},{passive:true});
presentation?.addEventListener('touchend',e=>{if(touchX===null)return;const dx=e.changedTouches[0].screenX-touchX;if(Math.abs(dx)>75)nextSlide(dx<0?1:-1);touchX=null;},{passive:true});

$$('.service').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)$$('.service').filter(d=>d!==detail&&d.open).forEach(d=>d.open=false);}));
function setDirection(direction){const field=$('#brief-direction');if(!field)return;const found=[...field.options].find(o=>o.value===direction);if(found)field.value=direction;location.hash='brief';$('#brief-name').focus({preventScroll:true});}
$$('[data-service]').forEach(b=>b.addEventListener('click',()=>setDirection(b.dataset.service)));
function updateReference(){const line=$('#reference-line');if(!line)return;line.hidden=!selectedReference;if(selectedReference)$('span',line).textContent=`Отправная точка: ${projects[selectedReference].title}`;}
$('#clear-reference')?.addEventListener('click',()=>{selectedReference='';updateReference();});
const form=$('#brief-form');
const incomingReference=new URLSearchParams(location.search).get('reference');
if(incomingReference&&projects[incomingReference]){selectedReference=incomingReference;updateReference();const direction=projects[incomingReference].direction;const field=$('#brief-direction');if(field)field.value=direction==='Сувениры и призы'?'Награды и призы':direction;}
function makeBrief(){const data=new FormData(form);return `БРИФ ПРОЕКТА / ТРИФОТИ\nТворческий комбинат\n\nИмя: ${String(data.get('name')).trim()}\nНаправление: ${data.get('direction')}\n\nИдея:\n${String(data.get('idea')).trim()}\n\nБюджет: ${String(data.get('budget')).trim()||'Обсудим'}\nЖелаемый срок: ${String(data.get('deadline')).trim()||'Обсудим'}${selectedReference?`\nОтправная точка: ${projects[selectedReference].title}`:''}\n\nБриф подготовлен на сайте ТРИФОТИ. Передайте его команде по вашему каналу связи.\n`;}
function validateBrief(){for(const name of ['name','idea']){const el=form.elements.namedItem(name);el.setCustomValidity(el.value.trim()?'':'Пожалуйста, заполните это поле.');}return form.reportValidity();}
form?.addEventListener('input',e=>{if(e.target.setCustomValidity)e.target.setCustomValidity('');$('#brief-status').textContent='';});
form?.addEventListener('submit',e=>{e.preventDefault();if(!validateBrief())return;const blob=new Blob(['\uFEFF'+makeBrief()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='TRIFOTI-Brief.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#brief-status').textContent='Бриф подготовлен для скачивания. Передайте файл команде.';});
$('#copy-brief')?.addEventListener('click',async()=>{if(!validateBrief())return;const value=makeBrief();try{await navigator.clipboard.writeText(value);$('#brief-status').textContent='Бриф скопирован. Его можно вставить в сообщение.';toast('Бриф скопирован');}catch{const fallback=$('#copy-fallback');fallback.hidden=false;fallback.value=value;fallback.focus();fallback.select();$('#brief-status').textContent='Выделенный текст можно скопировать вручную.';}});
