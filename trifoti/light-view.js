import {projects} from './project-data.js?v=20261024-case-story';
import {thumbnailSource} from './media-utils.js';
import {createMediaSlot} from './portfolio-media.js?v=20261026-portfolio-tools';
import {galleryArrow} from './dialog-controls.js?v=20261022-gallery';
export function lightPreview(project,item){return project.media.length<2?(item.poster||item.src):thumbnailSource(item)}
export function initializeLightView({document,window}){
 const mode=document.getElementById('light-posters');if(!mode)return null;
 const slots=[],renderers=[];const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 for(const card of document.querySelectorAll('[data-light-case]')){
  const project=projects[card.dataset.lightCase];if(!project)continue;let index=0;
  const parent=card.querySelector('[data-light-gallery]'),frame=el('section',null,'light-frame');frame.setAttribute('aria-label','Ручная галерея: '+project.title);
  const controls=el('div',null,'light-controls'),previous=el('button','←'),next=el('button','→'),counter=el('span'),host=el('div',null,'light-media'),caption=el('p',null,'light-caption'),status=el('p',null,'note'),load=el('button');
  for(const b of [previous,next,load])b.type='button';previous.setAttribute('aria-label','Предыдущий кадр: '+project.title);next.setAttribute('aria-label','Следующий кадр: '+project.title);counter.setAttribute('role','status');status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
  controls.append(previous,counter,next);frame.append(controls,host,caption,status,load);parent.append(frame);
  const slot=createMediaSlot({document,host,status,onError:()=>{load.hidden=false;load.disabled=false;load.textContent='Повторить загрузку'}});slots.push(slot);

  function render(){slot.clear();load.hidden=false;load.disabled=false;const item=project.media[index];caption.textContent=(item.type==='video'?'Видео. ':'Фото. ')+item.caption;counter.textContent=`${index+1} / ${project.media.length}`;previous.disabled=next.disabled=project.media.length<2;load.textContent=item.type==='video'?'Показать управление видео':'Загрузить оригинал фото';if(mode.checked)slot.show(item,{preview:true,source:lightPreview(project,item)});else status.textContent='Материал не загружен. Можно прочитать подпись или загрузить его вручную.';}
  function step(delta){index=(index+delta+project.media.length)%project.media.length;render()}
  previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  frame.addEventListener('keydown',event=>{const direction=galleryArrow(event);if(direction&&project.media.length>1){event.preventDefault();step(direction)}});
  load.addEventListener('click',()=>{const item=project.media[index];slot.show(item,{video:item.type==='video'});load.textContent='Повторить загрузку';});
  renderers.push(render);render();
 }
 mode.addEventListener('change',()=>{for(const render of renderers)render()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const slot of slots)slot.pause()});
 window.addEventListener('pagehide',()=>{for(const slot of slots)slot.pause()});
 document.getElementById('light-mode').hidden=false;
 return {refresh:()=>{for(const render of renderers)render()}};
}
if(typeof document!=='undefined'&&typeof window!=='undefined')initializeLightView({document,window});
