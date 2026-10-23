import {mountGalleryChapters} from './gallery-chapters.js?v=20261023-bear-chapters';
import {watchGalleryMedia} from './media-recovery.js?v=20261022-retry';
import {createProjectNavigation,projectLink,copyProjectLink} from './project-navigation.js?v=20261022-case-links';
import {thumbnailSource} from './media-utils.js?v=20261022-previews';
import {BRIEF_KEY,createBriefDraftSession,briefErrors,formatBrief,requestBriefDownload} from './brief-utils.js?v=20261022-draft-conflict';
import {keepDialogFocus,galleryArrow} from './dialog-controls.js?v=20261022-gallery';
import {projects} from './project-data.js?v=20261022-rto';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const menu=$('.menu-button'),nav=$('#navigation'),header=$('.header');
const desktopNavigation=matchMedia('(min-width: 801px)');
function setMenuOpen(open){menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');nav.classList.toggle('open',open)}
menu.addEventListener('click',()=>setMenuOpen(menu.getAttribute('aria-expanded')!=='true'));
$$('.header a').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){setMenuOpen(false);menu.focus()}});
document.addEventListener('click',e=>{if(!e.target.closest('.header'))setMenuOpen(false)});
// Native Tab follows the DOM; leaving the header never traps or steals focus.
header.addEventListener('focusout',e=>{if(e.relatedTarget&&!header.contains(e.relatedTarget))setMenuOpen(false)});
desktopNavigation.addEventListener('change',()=>{
 const active=document.activeElement;setMenuOpen(false);
 if(!desktopNavigation.matches&&nav.contains(active))menu.focus({preventScroll:true});
 else if(desktopNavigation.matches&&active===menu)nav.querySelector('a[href]')?.focus({preventScroll:true});
});

let toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
function download(text,name){const blob=new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}

function selectProjectFilter(button){
 const filter=button.dataset.filter;
 $$('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});
 $$('[data-category]').forEach(card=>card.hidden=filter!=='all'&&!card.dataset.category.split(' ').includes(filter));
 const count=$$('[data-category]').filter(card=>!card.hidden).length;
 $('#filter-status').textContent=`Показано проектов: ${count}`;$('#project-empty').hidden=count>0;
 $('#empty-category-brief').setAttribute('aria-label',`Обсудить идею (${button.dataset.direction||'Все направления'})`);
}
$$('[data-filter]').forEach(button=>button.addEventListener('click',()=>selectProjectFilter(button)));
$$('[data-show-projects="all"]').forEach(link=>link.addEventListener('click',()=>selectProjectFilter($('[data-filter="all"]'))));
$('#empty-category-brief').addEventListener('click',()=>{const direction=$('[data-filter][aria-pressed="true"]').dataset.direction;if(direction){$('#brief-direction').value=direction;saveDraft()}});
$$('[data-service]').forEach(a=>a.addEventListener('click',()=>{$('#brief-direction').value=a.dataset.service;saveDraft()}));

const form=$('#brief-form'),draftSession=createBriefDraftSession(),recovered=draftSession.recovered;
const draftMessages={empty:'Черновик сохраняется в этом браузере.',restored:'Черновик восстановлен из этого браузера.',saved:'Черновик сохранён в этом браузере.',unavailable:'Автосохранение недоступно. Не закрывайте страницу, пока не скачаете или не скопируете бриф.',invalid:'Сохранённый черновик не удалось прочитать. Заполните бриф заново.',partial:'Часть черновика восстановлена. Проверьте поля перед скачиванием.',failed:'Черновик не удалось сохранить в браузере. Не закрывайте страницу: скачайте или скопируйте бриф.',conflict:'Черновик изменён в другой вкладке. Автосохранение здесь остановлено, чтобы не перезаписать другую версию. Ваши текущие поля не изменены: скачайте бриф или скопируйте текст ниже до обновления страницы. После обновления откроется сохранённая версия.'};
function draftStatus(state){const status=$('#brief-draft-status');if(status.textContent!==draftMessages[state])status.textContent=draftMessages[state];status.dataset.state=['unavailable','invalid','partial','failed','conflict'].includes(state)?'error':'ready';if(state==='conflict'){$('#brief-text-fallback').hidden=false;$('#brief-text').value=formatBrief(Object.fromEntries(new FormData(form)))}}
for(const [key,value] of Object.entries(recovered.draft)){const field=form.elements.namedItem(key);if(!field)continue;if(field.tagName==='SELECT'&&![...field.options].some(option=>option.value===value)){if(key==='direction'&&value==='3D-модель и производство')field.add(new Option(value+' (из прежнего черновика)',value));else{recovered.state='partial';continue}}field.value=value}
function saveDraft(){const values=Object.fromEntries(new FormData(form));draftStatus(draftSession.save(values));$('#brief-status').textContent='';if(!$('#brief-text-fallback').hidden)$('#brief-text').value=formatBrief(values)}
addEventListener('storage',event=>{if(event.key!==BRIEF_KEY&&event.key!==null)return;const state=draftSession.check();if(state)draftStatus(state)});
function updateReference(){const title=form.elements.namedItem('reference').value;$('#brief-reference').hidden=!title;$('#brief-reference-title').textContent=title}
function selectReference(title){form.elements.namedItem('reference').value=title;updateReference();saveDraft()}
updateReference();
$('#clear-reference').addEventListener('click',()=>{selectReference('');form.elements.namedItem('name').focus()});
form.addEventListener('input',()=>{for(const key of ['name','idea'])form.elements.namedItem(key).setCustomValidity('');saveDraft()});
form.addEventListener('change',saveDraft);
form.addEventListener('submit',e=>{
 e.preventDefault();const values=Object.fromEntries(new FormData(form));
 for(const [key,message] of Object.entries(briefErrors(values)))form.elements.namedItem(key).setCustomValidity(message);
 if(!form.reportValidity())return;
 const text=formatBrief(values),fallback=$('#brief-text-fallback'),preview=$('#brief-text'),status=$('#brief-status');preview.value=text;fallback.hidden=false;
 const result=requestBriefDownload(text);status.dataset.state=result==='started'?'ready':'error';
 status.textContent=result==='started'?'Скачивание брифа запрошено. Если файл не появился, откройте текст ниже и скопируйте его.':'Не удалось начать скачивание. Скопируйте готовый текст ниже, чтобы не потерять бриф.';
 if(result!=='started'){fallback.open=true;preview.focus();preview.select()}
});
$('#brief-text-fallback').addEventListener('toggle',()=>{if($('#brief-text-fallback').open)$('#brief-text').value=formatBrief(Object.fromEntries(new FormData(form)))});
// Keep the native submit button disabled until local-only handling is ready.
draftStatus(recovered.state);
$('#brief-save').disabled=false;

$('#review-launch')?.addEventListener('click',()=>$('#review-dialog')?.showModal());
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
$$('dialog').forEach(dialog=>{keepDialogFocus(dialog);let backdropPressed=false;dialog.addEventListener('pointerdown',e=>{const r=dialog.getBoundingClientRect();backdropPressed=e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)});dialog.addEventListener('click',e=>{if(backdropPressed&&e.target===dialog)dialog.close();backdropPressed=false})});
const projectDialog=$('#project-dialog');
let galleryProject=null,galleryIndex=0,slideRevision=0,projectOpener=null;
let updateGalleryChapters=()=>{};
function showSlide(index,retrying=false){
 const project=projects[galleryProject];if(!project?.media.length)return;
 galleryIndex=(index+project.media.length)%project.media.length;const item=project.media[galleryIndex];const viewer=$('#gallery-viewer');
 $$('video',viewer).forEach(video=>video.pause());viewer.replaceChildren();const revision=++slideRevision;
 let media;if(item.type==='video'){media=document.createElement('video');media.poster=item.poster;media.controls=true;media.muted=true;media.playsInline=true;media.preload='metadata';media.setAttribute('aria-label',item.caption)}else{media=document.createElement('img');media.alt=item.caption;media.decoding='async'}
 const retryIndex=galleryIndex;watchGalleryMedia({media,type:item.type,viewer,status:$('#gallery-status'),retry:$('#gallery-retry'),announcement:$('#gallery-announcement'),document,isCurrent:()=>revision===slideRevision&&projectDialog.open&&viewer.isConnected,onRetry:()=>showSlide(retryIndex,true),retrying,caption:item.caption});
 media.src=item.src;viewer.append(media);$('#gallery-caption').textContent=item.caption;
 $('#gallery-counter').textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(project.media.length).padStart(2,'0')}`;
 $('#gallery-announcement').textContent=`${galleryIndex+1} из ${project.media.length}. ${item.caption}`;
 $$('.gallery-thumb').forEach((b,i)=>{b.classList.toggle('active',i===galleryIndex);b.setAttribute('aria-pressed',String(i===galleryIndex))});
 updateGalleryChapters(galleryIndex);
 const thumbs=$('#gallery-thumbnails'),active=thumbs.children[galleryIndex];
 if(active&&thumbs.scrollWidth>thumbs.clientWidth){const left=active.offsetLeft-thumbs.offsetLeft;thumbs.scrollTo({left:Math.max(0,left-(thumbs.clientWidth-active.clientWidth)/2),behavior:'instant'})}
}
function openProject(key){
 galleryProject=key;const p=projects[galleryProject];const host=$('#project-content');
 // Only descendants are removed; do not steal focus from the fixed Close,
 // the scroll container itself, or anything outside this replacement.
 const restoreFocus=projectDialog.open&&host.contains(document.activeElement)&&document.activeElement!==host;
 host.innerHTML='<div class="case-layout"><div class="case-intro"><span class="eyebrow" id="case-type"></span><h2 id="case-title"></h2><p id="case-description"></p></div><div class="case-gallery"><div class="gallery-viewer" id="gallery-viewer" tabindex="-1" role="group" aria-label="Медиа проекта"></div><div class="gallery-navigation"><button id="gallery-prev" class="round-button" aria-label="Предыдущий ракурс">←</button><span id="gallery-counter"></span><button id="gallery-next" class="round-button" aria-label="Следующий ракурс">→</button></div><p id="gallery-caption"></p><p id="gallery-status" role="status" aria-atomic="true"></p><button type="button" class="text-link gallery-retry" id="gallery-retry" aria-controls="gallery-viewer" hidden>Повторить загрузку</button><p id="gallery-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p><div class="gallery-thumbnails" id="gallery-thumbnails"></div></div><div class="case-copy"><div id="case-provenance" class="case-provenance" hidden></div><div class="tags" id="case-tags"></div><a class="button button-dark" href="#contact" id="case-contact">Обсудить похожую идею <span class="direction-icon" aria-hidden="true"></span></a><div class="case-share"><button type="button" class="text-link case-share-button" id="case-share">Скопировать ссылку на проект</button><p class="form-note" id="case-share-status" role="status" aria-live="polite"></p><label class="case-share-fallback" id="case-share-fallback" hidden>Ссылка для копирования<input id="case-share-url" readonly></label></div></div></div>';
 updateGalleryChapters=mountGalleryChapters({key,host:$('.case-gallery'),document,onSelect:showSlide});
 $('#case-type').textContent=p.type;$('#case-title').textContent=p.title;$('#case-description').textContent=p.description;
 if(p.attribution){const provenance=$('#case-provenance');provenance.hidden=false;const credit=document.createElement('p');credit.textContent=p.attribution;provenance.append(credit);for(const source of p.sources||[]){const link=document.createElement('a');link.href=source.url;link.textContent=source.label;link.target='_blank';link.rel='noopener noreferrer';provenance.append(link)}}
 p.tags.forEach(tag=>{const span=document.createElement('span');span.textContent=tag;$('#case-tags').append(span)});
 if(p.media.length>1)p.media.forEach((item,i)=>{const b=document.createElement('button');b.className='gallery-thumb';b.setAttribute('aria-label',`Показать: ${item.caption}`);const img=document.createElement('img');img.src=thumbnailSource(item);img.width=180;img.height=200;img.alt='';img.loading='lazy';img.decoding='async';b.append(img);if(item.type==='video'){const label=document.createElement('span');label.textContent='▷';b.append(label)}b.addEventListener('click',()=>showSlide(i));$('#gallery-thumbnails').append(b)});
 $('#gallery-prev').addEventListener('click',()=>showSlide(galleryIndex-1));$('#gallery-next').addEventListener('click',()=>showSlide(galleryIndex+1));$('#case-contact').addEventListener('click',e=>{e.preventDefault();const direction=form.elements.namedItem('direction');if(p.direction&&direction.selectedIndex===0)direction.value=p.direction;selectReference(p.title);caseNavigation.visit('#contact');$('#contact').scrollIntoView({block:'start'});requestAnimationFrame(()=>form.elements.namedItem('name').focus({preventScroll:true}))});
 const shareButton=$('#case-share'),shareStatus=$('#case-share-status'),shareFallback=$('#case-share-fallback'),shareURL=$('#case-share-url');shareURL.value=projectLink(location.href,key);
 shareButton.addEventListener('click',async()=>{const copied=await copyProjectLink(shareURL.value,navigator.clipboard);if(!shareButton.isConnected)return;shareStatus.textContent=copied?'Ссылка скопирована.':'Не удалось скопировать автоматически. Выделите ссылку ниже и скопируйте её.';shareFallback.hidden=copied;if(!copied){shareURL.focus();shareURL.select()}});
 const multiple=p.media.length>1;$('#gallery-prev').hidden=!multiple;$('#gallery-next').hidden=!multiple;$('#gallery-thumbnails').hidden=!multiple;
 showSlide(0);if(!projectDialog.open)projectDialog.showModal();host.scrollTop=0;projectDialog.scrollTop=0;
 if(restoreFocus)$('[data-close="project-dialog"]',projectDialog).focus({preventScroll:true});
}
const caseNavigation=createProjectNavigation({keys:Object.keys(projects),location,history,onOpen:openProject,onClose:()=>{if(projectDialog.open)projectDialog.close()}});
$$('[data-project]').forEach(card=>card.addEventListener('click',()=>{projectOpener=card;caseNavigation.open(card.dataset.project)}));
$$('a[data-case-link]').forEach(link=>link.addEventListener('click',event=>{
 if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 event.preventDefault();projectOpener=link;caseNavigation.open(link.getAttribute('href').slice('#project/'.length));
}));
addEventListener('popstate',caseNavigation.sync);addEventListener('hashchange',caseNavigation.sync);
projectDialog.addEventListener('keydown',e=>{if(!projectDialog.open||projects[galleryProject]?.media.length<2)return;const step=galleryArrow(e);if(step){e.preventDefault();showSlide(galleryIndex+step)}});
projectDialog.addEventListener('close',()=>{if(projectDialog.open)return;slideRevision++;$$('video',projectDialog).forEach(v=>v.pause());const mode=caseNavigation.closed();if(mode!=='route'){const card=$(`[data-project="${galleryProject}"]`),openerMatches=projectOpener?.dataset.project===galleryProject||projectOpener?.getAttribute('href')==='#project/'+galleryProject,target=projectOpener?.isConnected&&!projectOpener.hidden&&openerMatches?projectOpener:card&&!card.hidden?card:$('[data-filter][aria-pressed="true"]');target?.focus({preventScroll:mode!=='fallback'})}});
caseNavigation.sync();
import('./bear-video.js?v=20261023-viewport');

// Optional review storage or UI must never interrupt portfolio, brief or bear setup.
import('./review-panel.js?v=20261022-identity').then(({initializeReviewPanel})=>initializeReviewPanel({document,download})).catch(()=>{
 const status=$('#review-save-status');if(status){status.textContent='Панель заметок не загрузилась. Обновите страницу, чтобы попробовать снова.';status.dataset.state='error'}
 $$('#review-dialog textarea, #review-dialog select, #export-review').forEach(control=>control.disabled=true);
});

// Optional catalogue enhancement: source links stay usable if this module fails.
import('./publication-filters.js?v=20261022-press').then(({initializePublicationFilters})=>initializePublicationFilters({document})).catch(()=>{
 $$('#publication-catalog [data-publication-category]').forEach(entry=>entry.hidden=false);
 const filters=$('#publication-filters');if(filters)filters.hidden=true;
 const count=$('#publication-count');if(count)count.textContent='Все материалы доступны ниже.';
});
