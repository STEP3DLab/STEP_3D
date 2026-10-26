import {projects} from './project-data.js?v=20261026-directions';
import {selectionIds} from './exploration-data.js?v=20261026-directions';
import {createMediaSlot} from './portfolio-media.js?v=20261026-portfolio-tools';
import {galleryArrow} from './dialog-controls.js?v=20261022-gallery';
export function meetingFrames(ids){return selectionIds(ids.join(',')).flatMap(key=>projects[key].media.map((item,index)=>({key,item,index})))}
export function meetingRoute(hash){
 if(typeof hash!=='string'||hash.length>140)return {ids:[],index:0};
 const match=/^#show\/([a-zA-Z0-9,-]+)\/(\d{1,2})$/.exec(hash);if(!match)return {ids:[],index:0};
 const ids=selectionIds(match[1]),length=meetingFrames(ids).length;return {ids,index:Math.max(0,Math.min(Number(match[2]),length-1))};
}
export function meetingHash(ids,index=0){const safe=selectionIds(ids.join(',')),length=meetingFrames(safe).length;return safe.length?'#show/'+safe.join(',')+'/'+Math.max(0,Math.min(Number.isInteger(index)?index:0,length-1)):''}
export function initializeMeeting({document,window}){
 const get=id=>document.getElementById(id),player=get('meeting-player');if(!player)return null;
 const host=get('meeting-media'),status=get('meeting-media-status'),load=get('meeting-load'),select=get('meeting-case'),exit=get('meeting-exit');
 let ids=[],frames=[],index=0;const slot=createMediaSlot({document,host,status,onError:()=>{load.hidden=false;load.textContent='Повторить загрузку'}});
 function render(){
  const frame=frames[index];if(!frame)return;const p=projects[frame.key],item=frame.item;
  const displaced=get('meeting-sources').contains?.(document.activeElement)||host.contains?.(document.activeElement)||document.activeElement===load;
  get('meeting-title').textContent=p.title;get('meeting-direction').textContent=p.direction;
  get('meeting-caption').textContent=(item.type==='video'?'Постер видео. ':'')+item.caption;
  get('meeting-credit').textContent=(p.attribution||p.type)+(!p.attribution?' Персональные роли участников в этом кейсе не уточнены.':'');
  get('meeting-counter').textContent=`${index+1} / ${frames.length}`;get('meeting-case-link').href='cases/'+frame.key+'.html#media-'+item.src.split('/').pop().replace(/\.[^.]+$/,'');
  const sources=get('meeting-sources');sources.replaceChildren();for(const source of p.sources||[]){const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.textContent=source.label;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',source.label+' — новая вкладка');li.append(a);sources.append(li)}
  select.value=frame.key;get('meeting-prev').disabled=get('meeting-next').disabled=frames.length<2;
  load.hidden=item.type!=='video';load.textContent='Показать управление видео';slot.show(item);
  exit.href='index.html?from=meeting#explore/'+ids.join(',');
  if(displaced)get('meeting-stage').focus({preventScroll:true});
 }
 function sync(){const route=meetingRoute(window.location.hash);if(ids.join(',')===route.ids.join(',')&&index===route.index&&frames.length)return;ids=route.ids;index=route.index;frames=meetingFrames(ids);slot.clear();player.hidden=!frames.length;get('meeting-empty').hidden=!!frames.length;exit.href=ids.length?'index.html?from=meeting#explore/'+ids.join(','):'index.html#projects';select.replaceChildren();for(const key of ids){const option=document.createElement('option');option.value=key;option.textContent=projects[key].title;select.append(option)}if(frames.length)render();}
 function go(next){if(!frames.length)return;index=(next+frames.length)%frames.length;window.history.replaceState(window.history.state,'',meetingHash(ids,index));render()}
 get('meeting-prev').addEventListener('click',()=>go(index-1));get('meeting-next').addEventListener('click',()=>go(index+1));
 select.addEventListener('change',()=>{const next=frames.findIndex(frame=>frame.key===select.value);if(next>=0)go(next)});
 load.addEventListener('click',()=>{const item=frames[index]?.item;if(!item)return;slot.show(item,{video:item.type==='video'});get('meeting-caption').textContent=(item.type==='video'?'Видео. ':'')+item.caption;load.textContent='Повторить загрузку';});
 document.addEventListener('keydown',event=>{
  if(event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
  // Browser/assistive shortcuts, native controls and editable fields remain native.
  const native=event.target.isContentEditable||event.target.closest('video,audio,input,textarea,select,[contenteditable]:not([contenteditable="false"])');
  if(native)return;
  if(event.key==='Escape'){event.preventDefault();exit.click();return}
  if(player.hidden)return;const direction=galleryArrow(event);
  if(direction){event.preventDefault();go(index+direction)}else if(event.key==='Home'||event.key==='End'){event.preventDefault();go(event.key==='Home'?0:frames.length-1)}
 });
 get('meeting-skip').addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||player.hidden)return;event.preventDefault();const stage=get('meeting-stage'),header=document.querySelector('.meeting-top');stage.style.scrollMarginTop=(Math.ceil(header.getBoundingClientRect().height)+8)+'px';stage.focus({preventScroll:true});stage.scrollIntoView({block:'start'})});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)slot.pause()});window.addEventListener('pagehide',slot.pause);
 window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);sync();return {sync,go};
}
if(typeof document!=='undefined'&&typeof window!=='undefined')initializeMeeting({document,window});
