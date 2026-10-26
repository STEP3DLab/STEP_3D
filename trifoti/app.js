import {initializeBriefExperience,initializeBackToTop} from './experience-ux.js?v=20261024-ux25';
import {initializePortfolioFilters} from './portfolio-filters.js?v=20261024-ux25';
import {mediaId,mediaIndex} from './exploration-data.js';
import {mountExploration,mountRelated} from './exploration-panel.js';
import {enhanceProjectCards} from './project-card-links.js';
import {createFrameMemory,thumbnailKey,mountPhotoSwipe} from './gallery-interactions.js?v=20261024-gallery-browse';
import {initializeSectionNavigation} from './section-navigation.js?v=20261024-clear-navigation';
import {initializeBriefTools} from './brief-tools.js?v=20261024-ux25';
import {updateGalleryPhotoLink} from './gallery-photo-link.js?v=20261024-photo-details';
import {updateBriefGuidance} from './brief-guidance.js?v=20261024-brief-guidance';
import {mountCaseSections} from './case-sections.js?v=20261024-case-story';
import {mountGalleryChapters} from './gallery-chapters.js?v=20261023-bear-chapters';
import {watchGalleryMedia} from './media-recovery.js?v=20261024-gallery-browse';
import {createProjectNavigation,projectLink,copyProjectLink} from './project-navigation.js?v=20261024-explore';
import {thumbnailSource} from './media-utils.js?v=20261022-previews';
import {BRIEF_KEY,createBriefDraftSession,formatBrief,requestBriefDownload} from './brief-utils.js?v=20261024-brief-tools';
import {keepDialogFocus,galleryArrow} from './dialog-controls.js?v=20261022-gallery';
import {projects} from './project-data.js?v=20261024-case-story';
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
let toastTimer;
initializeSectionNavigation({document,window});
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200)}
function download(text,name){const blob=new Blob(['\ufeff'+text],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}

initializePortfolioFilters({document,window});
initializeBackToTop({document,window});
$('#empty-category-brief').addEventListener('click',()=>{const direction=$('[data-filter][aria-pressed="true"]').dataset.direction;if(direction){$('#brief-direction').value=direction;saveDraft()}});
$$('[data-service]').forEach(a=>a.addEventListener('click',()=>{$('#brief-direction').value=a.dataset.service;saveDraft()}));

const form=$('#brief-form'),draftSession=createBriefDraftSession(),recovered=draftSession.recovered;
const draftMessages={empty:'Черновик сохраняется в этом браузере.',restored:'Черновик восстановлен из этого браузера.',saved:'Черновик сохранён в этом браузере.',unavailable:'Автосохранение недоступно. Не закрывайте страницу, пока не скачаете или не скопируете бриф.',invalid:'Сохранённый черновик не удалось прочитать. Заполните бриф заново.',partial:'Часть черновика восстановлена. Проверьте поля перед скачиванием.',failed:'Черновик не удалось сохранить в браузере. Не закрывайте страницу: скачайте или скопируйте бриф.',conflict:'Черновик изменён в другой вкладке. Автосохранение здесь остановлено, чтобы не перезаписать другую версию. Ваши текущие поля не изменены: скачайте бриф или скопируйте текст ниже до обновления страницы. После обновления откроется сохранённая версия.'};
function draftStatus(state){const status=$('#brief-draft-status');if(status.textContent!==draftMessages[state])status.textContent=draftMessages[state];status.dataset.state=['unavailable','invalid','partial','failed','conflict'].includes(state)?'error':'ready';if(state==='conflict'){$('#brief-text-fallback').hidden=false;$('#brief-text').value=formatBrief(Object.fromEntries(new FormData(form)))}}
for(const [key,value] of Object.entries(recovered.draft)){const field=form.elements.namedItem(key);if(!field)continue;if(field.tagName==='SELECT'&&![...field.options].some(option=>option.value===value)){if(key==='direction'&&value==='3D-модель и производство')field.add(new Option(value+' (из прежнего черновика)',value));else{recovered.state='partial';continue}}field.value=value}
let briefTools,briefExperience;
function refreshBriefGuidance(){updateBriefGuidance({direction:form.elements.namedItem('direction').value,helper:$('#brief-idea-help')})}
function saveDraft(){refreshBriefGuidance();briefTools?.refresh();briefExperience?.refresh();const values=Object.fromEntries(new FormData(form));draftStatus(draftSession.save(values));$('#brief-status').textContent='';if(!$('#brief-text-fallback').hidden)$('#brief-text').value=formatBrief(values)}
addEventListener('storage',event=>{if(event.key!==BRIEF_KEY&&event.key!==null)return;const state=draftSession.check();if(state)draftStatus(state)});
function updateReference(){const title=form.elements.namedItem('reference').value;$('#brief-reference').hidden=!title;$('#brief-reference-title').textContent=title}
function selectReference(title){form.elements.namedItem('reference').value=title;updateReference();saveDraft()}
updateReference();refreshBriefGuidance();
$('#clear-reference').addEventListener('click',()=>{selectReference('');form.elements.namedItem('name').focus()});
form.addEventListener('input',saveDraft);
form.addEventListener('change',saveDraft);
form.addEventListener('submit',e=>{
 e.preventDefault();const values=Object.fromEntries(new FormData(form));
 if(!briefTools.validate())return;
 const text=formatBrief(values),fallback=$('#brief-text-fallback'),preview=$('#brief-text'),status=$('#brief-status');preview.value=text;fallback.hidden=false;
 const result=requestBriefDownload(text);status.dataset.state=result==='started'?'ready':'error';
 status.textContent=result==='started'?'Скачивание брифа запрошено. Если файл не появился, откройте текст ниже и скопируйте его.':'Не удалось начать скачивание. Скопируйте готовый текст ниже, чтобы не потерять бриф.';
 if(result!=='started'){fallback.open=true;preview.focus();preview.select()}
});
$('#brief-text-fallback').addEventListener('toggle',()=>{if($('#brief-text-fallback').open)$('#brief-text').value=formatBrief(Object.fromEntries(new FormData(form)))});
briefTools=initializeBriefTools({form,document,draftSession,draftStatus,onValidation:keys=>briefExperience?.showErrors(keys),onReset:()=>{updateReference();refreshBriefGuidance();briefExperience?.refresh()}});
briefExperience=initializeBriefExperience({form,document,window,validate:()=>briefTools.validate()});
// Keep the native submit button disabled until local-only handling is ready.
draftStatus(recovered.state);
$('#brief-save').disabled=false;

$$('[data-close]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.close).close()));
$$('dialog').forEach(dialog=>{keepDialogFocus(dialog);let backdropPressed=false;dialog.addEventListener('pointerdown',e=>{const r=dialog.getBoundingClientRect();backdropPressed=e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)});dialog.addEventListener('click',e=>{if(backdropPressed&&e.target===dialog)dialog.close();backdropPressed=false})});
const projectDialog=$('#project-dialog');
let galleryProject=null,galleryIndex=0,slideRevision=0,projectOpener=null;
let updateGalleryChapters=()=>{},clearMediaWait=()=>{};
const frameMemory=createFrameMemory();
function showSlide(index,retrying=false,updateRoute=true){
 const project=projects[galleryProject];if(!project?.media.length)return;
 galleryIndex=(index+project.media.length)%project.media.length;const item=project.media[galleryIndex];const viewer=$('#gallery-viewer');
 frameMemory.remember(galleryProject,galleryIndex);clearMediaWait();
 $$('video',viewer).forEach(video=>video.pause());viewer.replaceChildren();const revision=++slideRevision;
 let media;if(item.type==='video'){media=document.createElement('video');media.poster=item.poster;media.controls=true;media.muted=true;media.playsInline=true;media.preload='metadata';media.setAttribute('aria-label',item.caption)}else{media=document.createElement('img');media.alt=item.caption;media.decoding='async'}
 const retryIndex=galleryIndex;clearMediaWait=watchGalleryMedia({media,type:item.type,viewer,status:$('#gallery-status'),retry:$('#gallery-retry'),announcement:$('#gallery-announcement'),document,isCurrent:()=>revision===slideRevision&&projectDialog.open&&viewer.isConnected,onRetry:()=>showSlide(retryIndex,true),retrying,caption:item.caption});
 media.src=item.src;viewer.append(media);$('#gallery-caption').textContent=item.caption;
 updateGalleryPhotoLink({item,link:$('#gallery-photo-link'),viewer,document});
 $('#gallery-counter').textContent=`${String(galleryIndex+1).padStart(2,'0')} / ${String(project.media.length).padStart(2,'0')}`;
 $('#gallery-announcement').textContent=`${galleryIndex+1} из ${project.media.length}. ${item.caption}`;
 $$('.gallery-thumb').forEach((b,i)=>{b.classList.toggle('active',i===galleryIndex);b.setAttribute('aria-pressed',String(i===galleryIndex));b.tabIndex=i===galleryIndex?0:-1});
 updateGalleryChapters(galleryIndex);
 if(updateRoute&&projectDialog.open)caseNavigation.frame(galleryProject,mediaId(item));
 const shareURL=$('#case-share-url');if(shareURL)shareURL.value=projectLink(location.href,galleryProject,mediaId(item));
 const shareStatus=$('#case-share-status');if(shareStatus)shareStatus.textContent='';const shareFallback=$('#case-share-fallback');if(shareFallback)shareFallback.hidden=true;
 const thumbs=$('#gallery-thumbnails'),active=thumbs.children[galleryIndex];
 if(active&&thumbs.scrollWidth>thumbs.clientWidth){const left=active.offsetLeft-thumbs.offsetLeft;thumbs.scrollTo({left:Math.max(0,left-(thumbs.clientWidth-active.clientWidth)/2),behavior:'instant'})}
}
function openProject(key,routeMedia){
 clearMediaWait();$$('video',projectDialog).forEach(video=>video.pause());
 galleryProject=key;const p=projects[galleryProject];const host=$('#project-content');
 const caseKeys=[...new Set($$('[data-project]').map(card=>card.dataset.project).filter(projectKey=>projects[projectKey]))];if(!caseKeys.length)caseKeys.push(...Object.keys(projects));
 $('#project-dialog-context').textContent=`${caseKeys.indexOf(key)+1} / ${caseKeys.length} · ${p.title}`;
 // Only descendants are removed; do not steal focus from the fixed Close,
 // the scroll container itself, or anything outside this replacement.
 const restoreFocus=projectDialog.open&&host.contains(document.activeElement)&&document.activeElement!==host;
 host.innerHTML='<div class="case-layout"><div class="case-intro"><span class="eyebrow" id="case-type"></span><h2 id="case-title"></h2><p id="case-description"></p></div><div class="case-gallery"><div class="gallery-viewer" id="gallery-viewer" tabindex="-1" role="group" aria-label="Медиа проекта"></div><div class="gallery-navigation"><button id="gallery-prev" class="round-button" aria-label="Предыдущий ракурс">←</button><span id="gallery-counter"></span><button id="gallery-next" class="round-button" aria-label="Следующий ракурс">→</button></div><a class="gallery-photo-link" id="gallery-photo-link" target="_blank" rel="noopener noreferrer" hidden>Открыть фото крупно <span>в новой вкладке</span></a><p id="gallery-caption"></p><p id="gallery-status" role="status" aria-atomic="true"></p><button type="button" class="text-link gallery-retry" id="gallery-retry" aria-controls="gallery-viewer" hidden>Повторить загрузку</button><p id="gallery-announcement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p><p class="gallery-help" id="gallery-help"><span class="gallery-help-keyboard">← → Переключайте ракурсы стрелками</span><span class="gallery-help-touch">Листайте фото свайпом или кнопками</span></p><div class="gallery-thumbnails" id="gallery-thumbnails" role="group" aria-label="Выбор ракурса"></div></div><div class="case-copy"><div id="case-provenance" class="case-provenance" hidden></div><div class="tags" id="case-tags"></div><a class="button button-dark" href="#brief-form" id="case-contact">Подготовить бриф по примеру <span class="direction-icon" aria-hidden="true"></span></a><nav class="case-navigation" aria-label="Другие проекты"><button type="button" class="text-link" id="case-prev">← Предыдущий проект</button><button type="button" class="text-link" id="case-next">Следующий проект →</button></nav><div class="case-share"><button type="button" class="text-link case-share-button" id="case-share">Скопировать ссылку на этот ракурс</button><p class="form-note" id="case-share-status" role="status" aria-live="polite"></p><label class="case-share-fallback" id="case-share-fallback" hidden>Ссылка для копирования<input id="case-share-url" readonly></label></div></div></div>';
 updateGalleryChapters=mountGalleryChapters({key,host:$('.case-gallery'),document,onSelect:showSlide});
 $('#case-type').textContent=p.type;$('#case-title').textContent=p.title;$('#case-description').textContent=p.description;
 mountCaseSections({project:p,host:$('.case-copy'),document});
 if(p.attribution){const provenance=$('#case-provenance');provenance.hidden=false;const credit=document.createElement('p');credit.textContent=p.attribution;provenance.append(credit);for(const source of p.sources||[]){const link=document.createElement('a');link.href=source.url;link.textContent=source.label;link.target='_blank';link.rel='noopener noreferrer';provenance.append(link)}}
 p.tags.forEach(tag=>{const span=document.createElement('span');span.textContent=tag;$('#case-tags').append(span)});
 if(p.media.length>1)p.media.forEach((item,i)=>{const b=document.createElement('button');b.className='gallery-thumb';b.setAttribute('aria-label',`Показать: ${item.caption}`);const img=document.createElement('img');img.src=thumbnailSource(item);img.width=180;img.height=200;img.alt='';img.loading='lazy';img.decoding='async';b.append(img);const number=document.createElement('span');number.className='thumb-number';number.textContent=String(i+1).padStart(2,'0');number.setAttribute('aria-hidden','true');b.append(number);if(item.type==='video'){const label=document.createElement('span');label.textContent='▷';b.append(label)}b.addEventListener('click',()=>showSlide(i));b.addEventListener('keydown',event=>{const next=thumbnailKey(event,i,p.media.length);if(next===null)return;event.preventDefault();showSlide(next);$('#gallery-thumbnails').children[next].focus({preventScroll:true})});$('#gallery-thumbnails').append(b)});
 $('#gallery-prev').addEventListener('click',()=>showSlide(galleryIndex-1));$('#gallery-next').addEventListener('click',()=>showSlide(galleryIndex+1));$('#case-contact').addEventListener('click',e=>{e.preventDefault();const direction=form.elements.namedItem('direction');if(p.direction&&direction.selectedIndex===0)direction.value=p.direction;selectReference(p.title);caseNavigation.visit('#brief-form');form.scrollIntoView({block:'start'});requestAnimationFrame(()=>form.elements.namedItem('name').focus({preventScroll:true}))});
 const shareButton=$('#case-share'),shareStatus=$('#case-share-status'),shareFallback=$('#case-share-fallback'),shareURL=$('#case-share-url');shareURL.value=projectLink(location.href,key);
 shareButton.addEventListener('click',async()=>{const value=shareURL.value;const copied=await copyProjectLink(value,navigator.clipboard);if(!shareButton.isConnected)return;if(!projectDialog.open||shareURL.value!==value)return;shareStatus.textContent=copied?'Ссылка скопирована.':'Не удалось скопировать автоматически. Выделите ссылку ниже и скопируйте её.';shareFallback.hidden=copied;if(!copied){shareURL.focus();shareURL.select()}});
 const caseIndex=caseKeys.indexOf(key);
 for(const [id,step] of [['case-prev',-1],['case-next',1]]){const nextKey=caseKeys[(caseIndex+step+caseKeys.length)%caseKeys.length],button=$('#'+id);button.setAttribute('aria-label',`${step<0?'Предыдущий':'Следующий'} проект: ${projects[nextKey].title}`);button.replaceChildren();const label=document.createElement('span');label.className='case-nav-label';label.textContent=step<0?'← Предыдущий проект':'Следующий проект →';const title=document.createElement('strong');title.textContent=projects[nextKey].title;button.append(label,title);button.addEventListener('click',()=>caseNavigation.switchCase(nextKey))}
 mountPhotoSwipe({viewer:$('#gallery-viewer'),onStep:step=>showSlide(galleryIndex+step),isEnabled:()=>projectDialog.open&&(!window.visualViewport||window.visualViewport.scale===1)&&p.media.length>1&&projects[galleryProject]===p});
 const multiple=p.media.length>1;$('#gallery-prev').hidden=!multiple;$('#gallery-next').hidden=!multiple;$('#gallery-thumbnails').hidden=!multiple;$('#gallery-help').hidden=!multiple;
 mountRelated({host:$('.case-copy'),key,document,onOpen:next=>caseNavigation.switchCase(next)});
 showSlide(routeMedia?mediaIndex(key,routeMedia):frameMemory.recall(key,p.media.length),false,false);if(!projectDialog.open)projectDialog.showModal();host.scrollTop=0;projectDialog.scrollTop=0;
 if(restoreFocus)$('[data-close="project-dialog"]',projectDialog).focus({preventScroll:true});
}
const caseNavigation=createProjectNavigation({keys:Object.keys(projects),location,history,onOpen:openProject,onClose:()=>{if(projectDialog.open)projectDialog.close()}});
const exploration=mountExploration({host:$('#projects'),document,location,history,clipboard:navigator.clipboard,onOpen:(key,id,opener)=>{projectOpener=opener;caseNavigation.open(key,id)}});
addEventListener('popstate',exploration.sync);addEventListener('hashchange',exploration.sync);
enhanceProjectCards($$('[data-project]'),{dialog:projectDialog,onOpen:card=>{projectOpener=card;caseNavigation.open(card.dataset.project)}});
enhanceProjectCards($$('a[data-case-link]'),{dialog:projectDialog,onOpen:link=>{projectOpener=link;caseNavigation.open(link.dataset.caseLink)}});
addEventListener('popstate',caseNavigation.sync);addEventListener('hashchange',caseNavigation.sync);
projectDialog.addEventListener('keydown',e=>{if(!projectDialog.open||projects[galleryProject]?.media.length<2)return;const step=galleryArrow(e);if(step){e.preventDefault();showSlide(galleryIndex+step)}});
projectDialog.addEventListener('close',()=>{if(projectDialog.open)return;slideRevision++;clearMediaWait();$$('video',projectDialog).forEach(v=>v.pause());const mode=caseNavigation.closed();if(mode!=='route'){const card=$(`[data-project="${galleryProject}"]`),openerMatches=projectOpener?.closest('.exploration-panel')||projectOpener?.dataset.project===galleryProject||projectOpener?.dataset.caseLink===galleryProject||projectOpener?.getAttribute('href')==='#project/'+galleryProject,target=projectOpener?.isConnected&&!projectOpener.hidden&&openerMatches?projectOpener:card&&!card.hidden?card:$('[data-filter][aria-pressed="true"]');target?.focus({preventScroll:mode!=='fallback'})}});
caseNavigation.sync();
import('./bear-video.js?v=20261024-ux25');

// Editorial tools are an explicit local mode, separate from the visitor experience.
const reviewMode=new URLSearchParams(location.search).get('review')==='1';
if(reviewMode&&typeof $('#review-dialog')?.showModal==='function'){
 $('#review-launch').hidden=false;
 $('#review-launch')?.addEventListener('click',()=>$('#review-dialog')?.showModal());
 import('./review-panel.js?v=20261022-identity').then(({initializeReviewPanel})=>initializeReviewPanel({document,download})).catch(()=>{
  const status=$('#review-save-status');if(status){status.textContent='Панель заметок не загрузилась. Обновите страницу, чтобы попробовать снова.';status.dataset.state='error'}
  $$('#review-dialog textarea, #review-dialog select, #export-review').forEach(control=>control.disabled=true);
 });
}

// Optional catalogue enhancement: source links stay usable if this module fails.
import('./publication-filters.js?v=20261024-publication-tools').then(({initializePublicationFilters})=>initializePublicationFilters({document})).catch(()=>{
 $$('#publication-catalog [data-publication-category]').forEach(entry=>entry.hidden=false);
 const filters=$('#publication-filters');if(filters)filters.hidden=true;
 $$('#publication-tools, #publication-collapse, #publication-citation, #publication-sort-note, #publication-empty, [data-publication-copy]').forEach(control=>control.hidden=true);
 const active=$('#publication-active');if(active)active.textContent='Все источники';
 const count=$('#publication-count');if(count)count.textContent='Все материалы доступны ниже.';
});
