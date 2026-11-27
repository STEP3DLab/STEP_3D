import {lightContext,modeLinks} from './view-context.js?v=20261026-directions';
import {mediaId,mediaIndex} from './exploration-data.js?v=20261026-directions';
import {projects} from './project-data.js?v=20261026-directions';
import {thumbnailSource} from './media-utils.js?v=20261026-directions';
import {createMediaSlot} from './portfolio-media.js?v=20261026-portfolio-tools';
import {galleryArrow} from './dialog-controls.js?v=20261022-gallery';
export function lightPreview(project,item){return thumbnailSource(item)}
export function initializeLightView({document,window}){
 const mode=document.getElementById('light-posters');if(!mode)return null;
 const slots=[],renderers=[],cases=new Map();const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 for(const card of document.querySelectorAll('[data-light-case]')){
  const key=card.dataset.lightCase,project=projects[key];if(!project)continue;const initial=lightContext(window.location.hash);let index=initial?.key===key?mediaIndex(key,initial.id):0;
  const parent=card.querySelector('[data-light-gallery]'),frame=el('section',null,'light-frame');frame.setAttribute('aria-label','Ручная галерея: '+project.title);frame.setAttribute('tabindex','-1');
  const controls=el('div',null,'light-controls'),previous=el('button','←'),next=el('button','→'),counter=el('span'),host=el('div',null,'light-media'),caption=el('p',null,'light-caption'),status=el('p',null,'note'),load=el('button'),retry=el('button','Повторить загрузку превью');
  for(const b of [previous,next,load,retry])b.type='button';previous.setAttribute('aria-label','Предыдущий кадр: '+project.title);next.setAttribute('aria-label','Следующий кадр: '+project.title);counter.setAttribute('role','status');status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
  retry.hidden=true;controls.append(previous,counter,next);frame.append(controls,host,caption,status,load,retry);parent.append(frame);
  let previewing=false,retrying=false,originalRequested=false;
  function originalAction(text,locked=false){originalRequested=locked;load.textContent=text;load.setAttribute("aria-disabled",String(locked))}
  function hideRetry(){if(document.activeElement===retry)frame.focus({preventScroll:true});retry.hidden=true;retrying=false;retry.setAttribute('aria-disabled','false')}
  const slot=createMediaSlot({document,host,status,onReady:()=>{if(previewing)hideRetry();else if(project.media[index].type!=='video')originalAction('Оригинал загружен',true)},onError:()=>{
   if(previewing){retrying=false;retry.hidden=false;retry.setAttribute('aria-disabled','false');status.textContent='Не удалось загрузить превью. Повторите загрузку превью или откройте оригинал отдельной кнопкой.'}
   else originalAction('Повторить загрузку')
  }});slots.push(slot);
  // A preview retry must request only the same small image, never its original.
  function showPreview(){previewing=true;const item=project.media[index];slot.show(item,{preview:true,source:lightPreview(project,item)})}

  function render(){const displaced=host.contains(document.activeElement);const links=modeLinks(key,mediaId(project.media[index]));for(const mode of ['modal','static']){const link=card.querySelector('[data-view-mode="'+mode+'"]');if(link)link.href=links[mode]}slot.clear();hideRetry();previewing=false;load.hidden=false;load.disabled=false;const item=project.media[index];caption.textContent=(item.type==='video'?'Видео. ':'Фото. ')+item.caption;counter.textContent=`${index+1} / ${project.media.length}`;previous.disabled=next.disabled=project.media.length<2;originalAction(item.type==='video'?'Показать управление видео':'Загрузить оригинал фото');if(mode.checked)showPreview();else status.textContent='Материал не загружен. Можно прочитать подпись или загрузить его вручную.';if(displaced)frame.focus({preventScroll:true});}
  function step(delta){index=(index+delta+project.media.length)%project.media.length;window.history.replaceState(window.history.state,'',modeLinks(key,mediaId(project.media[index])).light.split('light.html')[1]);render()}
  previous.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));
  frame.addEventListener('keydown',event=>{const direction=galleryArrow(event);if(direction&&project.media.length>1){event.preventDefault();step(direction)}});
  load.addEventListener('click',()=>{if(originalRequested)return;hideRetry();previewing=false;const item=project.media[index],video=item.type==='video';originalAction(video?'Управление видео открыто':'Загружается оригинал…',true);const player=slot.show(item,{video});
   // Keep controls available without allowing two case videos to play together.
   if(video)player.addEventListener('play',()=>{
     if(!host.contains(player)||player.paused)return;
     for(const other of slots)if(other!==slot)other.pause();
   });
  });
  retry.addEventListener('click',()=>{if(retry.hidden||retrying||!previewing)return;retrying=true;retry.setAttribute('aria-disabled','true');showPreview()});
  // History can announce the same route twice. Keep an explicitly loaded resource
  // until the actual frame or poster mode changes.
  renderers.push(render);cases.set(key,{set(id){const nextIndex=mediaIndex(key,id);if(nextIndex===index)return;index=nextIndex;render()},scroll(){card.scrollIntoView?.({block:'start'})}});render();
 }
 function sync(scroll=true){const context=lightContext(window.location.hash);if(!context)return;const entry=cases.get(context.key);entry?.set(context.id);if(scroll)entry?.scroll()}
 window.addEventListener('hashchange',()=>sync());window.addEventListener('popstate',()=>sync());
 if(lightContext(window.location.hash)){if(document.readyState==='complete')sync();else window.addEventListener('load',()=>sync(),{once:true})}
 mode.addEventListener('change',()=>{for(const render of renderers)render()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const slot of slots)slot.pause()});
 window.addEventListener('pagehide',()=>{for(const slot of slots)slot.pause()});
 document.getElementById('light-mode').hidden=false;
 return {sync,refresh:()=>{for(const render of renderers)render()}};
}
if(typeof document!=='undefined'&&typeof window!=='undefined')initializeLightView({document,window});
