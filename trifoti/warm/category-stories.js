import {projects} from './project-data.js?v=20261026-directions';
import {storyCategory,storyFrames,parseStoryRoute} from './category-stories-data.js?v=20261026-legacy-links';
import {createStoryNavigation} from './category-stories-navigation.js?v=20261026-legacy-links';
import {createMediaSlot} from './portfolio-media.js';
import {keepDialogFocus,galleryArrow} from './dialog-controls.js';
import {mountPhotoSwipe} from './gallery-interactions.js';
import {visiblePortfolioTarget} from './portfolio-disclosure.js?v=20261026-directions';

export function mountCategoryStories({document,window,onFullCase=()=>{},beforeOpen=()=>{}}){
 const dialog=document.getElementById('category-story-dialog');
 if(!dialog||typeof dialog.showModal!=='function')return null;
 const get=id=>document.getElementById('story-'+id),tiles=[...document.querySelectorAll('[data-story-category]')];
 let current=null,opener=null;
 const slot=createMediaSlot({document,host:get('media'),status:get('status'),onError:()=>get('retry').hidden=false,onReady:()=>{if(document.activeElement===get('retry'))get('media').focus({preventScroll:true});get('retry').hidden=true}});
 const navigation=createStoryNavigation({location:window.location,history:window.history,onOpen:render,onClose:()=>{if(dialog.open)dialog.close();slot.clear()}});
 function render(route){
  current=route;beforeOpen();const category=storyCategory(route.category),frames=storyFrames(category.id),frame=frames[route.index],project=frame&&projects[frame.key];
  get('category').textContent=category.title;get('title').textContent=project?.title||category.title;
  get('counter').textContent=frame?`Проект ${category.keys.indexOf(frame.key)+1} из ${category.keys.length} · Кадр ${frame.index+1} из ${project.media.length}`:'О направлении · 1 из 1';
  get('caption').textContent=frame?frame.item.caption:category.intro;
  get('credit').textContent=project?(project.attribution||project.type)+(project.attribution?'':' · Персональные роли участников не уточнены.'):'Пока нет опубликованных проектов';
  get('full-case').hidden=!frame;get('full-case').href=frame?`#project/${frame.key}/media/${frame.id}`:'#projects';
  get('direction').hidden=!!frame;get('direction').href='#'+category.service;
  get('progress').replaceChildren();for(let i=0;i<(project?.media.length||1);i++){const segment=document.createElement('span');segment.className=i<=(frame?.index||0)?'is-seen':'';segment.setAttribute('aria-hidden','true');get('progress').append(segment)}
  const last=!frame||route.index===frames.length-1;get('prev').disabled=route.index===0;get('next').hidden=last;get('restart').hidden=!frame||!last;get('end').hidden=!last;get('end').textContent=frame?'Последний кадр этого направления. Можно начать сначала или открыть полный кейс.':'Это знакомство с направлением, а не пример выполненного проекта.';
  get('retry').hidden=true;get('original').hidden=!frame;
  if(frame){get('original').href=frame.item.src;get('original').textContent=frame.item.type==='video'?'Открыть исходное видео ↗':'Открыть исходное фото ↗';slot.show(frame.item,{video:frame.item.type==='video'});get('media').classList.remove('story-intro-art')}
  else{slot.clear();get('media').classList.add('story-intro-art');get('media').dataset.direction=category.id}
  // A new frame starts at its image, even after using the lower controls on a short screen.
  if(dialog.open&&dialog.scrollTop>0&&[get('prev'),get('next'),get('restart')].includes(document.activeElement))get('media').focus({preventScroll:true});
  if(!dialog.open)dialog.showModal();
  dialog.scrollTop=0;
  // Do not leave keyboard focus on a control hidden by a boundary transition.
  if(document.activeElement?.hidden||document.activeElement?.disabled)get('restart').hidden?get('close').focus():get('restart').focus();
 }
 function step(delta){if(!current)return;const frames=storyFrames(current.category),index=current.index+delta;if(index<0||index>=frames.length)return;const frame=frames[index];navigation.frame(current.category,frame.key,frame.id)}
 for(const tile of tiles){tile.setAttribute('aria-haspopup','dialog');tile.setAttribute('aria-controls',dialog.id);tile.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();opener=tile;navigation.open(tile.dataset.storyCategory)})}
 get('close').addEventListener('click',()=>dialog.close());get('prev').addEventListener('click',()=>step(-1));get('next').addEventListener('click',()=>step(1));
 get('restart').addEventListener('click',()=>{const first=storyFrames(current.category)[0];navigation.frame(current.category,first.key,first.id)});
 get('retry').addEventListener('click',()=>{if(current)render(current)});
 get('full-case').addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const tile=tiles.find(tile=>tile.dataset.storyCategory===current.category),route=navigation.fullCase();if(route)onFullCase(route.key,route.id,tile)});
 get('direction').addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const service=document.getElementById(storyCategory(current.category).service);navigation.visit('#'+service.id);service.open=true;service.scrollIntoView({block:'start'});service.querySelector('summary').focus({preventScroll:true})});
 keepDialogFocus(dialog);
 dialog.addEventListener('keydown',event=>{const delta=galleryArrow(event);if(delta){event.preventDefault();step(delta)}});
 dialog.addEventListener('close',()=>{if(dialog.open)return;slot.clear();const mode=navigation.closed();if(mode==='route')return;const tile=tiles.find(tile=>tile.dataset.storyCategory===current?.category);(visiblePortfolioTarget(opener)?opener:tile)?.focus({preventScroll:mode!=='fallback'})});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)slot.pause()});
 mountPhotoSwipe({viewer:get('media'),onStep:step,isEnabled:()=>dialog.open&&!!current?.key&&(!window.visualViewport||window.visualViewport.scale===1)});
 window.addEventListener('popstate',navigation.sync);window.addEventListener('hashchange',navigation.sync);navigation.sync();
 return {sync:navigation.sync,isStory:()=>!!parseStoryRoute(window.location.hash)};
}
