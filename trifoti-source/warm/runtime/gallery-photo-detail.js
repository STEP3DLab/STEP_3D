// Local original-image inspection. Native scrolling/pinch remain untouched.
export function mountPhotoDetail({viewer,host,document}){
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 const controls=el('div');controls.className='photo-detail';controls.setAttribute('role','group');controls.setAttribute('aria-label','Детали фотографии');host.append(controls);
 const minus=el('button','−'),plus=el('button','Рассмотреть +'),fit=el('button','Вписать'),status=el('span'),pan=el('div');pan.className='photo-pan';status.setAttribute('role','status');status.setAttribute('aria-atomic','true');
 for(const b of [minus,plus,fit])b.type='button';minus.setAttribute('aria-label','Уменьшить фото');plus.setAttribute('aria-label','Увеличить фото');controls.append(plus,minus,fit,status,pan);
 let image=null,zoom=1,loadHandler=null;
 function apply(){
  const active=Boolean(image)&&zoom>1;viewer.classList.toggle('photo-detail-active',active);pan.hidden=!active;minus.disabled=fit.disabled=!active;plus.setAttribute('aria-disabled',String(zoom>=4));
  status.textContent=active?`${Math.round(zoom*100)}% · от вписанного кадра`:'Фото целиком';
  if(!image)return;
  if(!active){image.style.width='';image.style.height='';viewer.scrollLeft=viewer.scrollTop=0;return}
  const ratio=(image.naturalWidth||1)/(image.naturalHeight||1),w=viewer.clientWidth||640,h=viewer.clientHeight||440;
  const width=Math.min(w,h*ratio);image.style.width=`${width*zoom}px`;image.style.height=`${width/ratio*zoom}px`;
 }
 function setZoom(value){const previous=zoom;zoom=Math.max(1,Math.min(4,value));apply();if(zoom===1&&(document.activeElement===minus||document.activeElement===fit||pan.contains(document.activeElement)))plus.focus({preventScroll:true});if(zoom>1&&previous===1){viewer.scrollLeft=Math.max(0,(viewer.scrollWidth-viewer.clientWidth)/2);viewer.scrollTop=Math.max(0,(viewer.scrollHeight-viewer.clientHeight)/2)}}
 function move(x,y){viewer.scrollBy?.({left:x*80,top:y*80,behavior:'instant'})}
 for(const [text,label,x,y] of [['←','Сдвинуть просмотр влево',-1,0],['↑','Сдвинуть просмотр вверх',0,-1],['↓','Сдвинуть просмотр вниз',0,1],['→','Сдвинуть просмотр вправо',1,0]]){const button=el('button',text);button.type='button';button.setAttribute('aria-label',label);button.addEventListener('click',()=>move(x,y));pan.append(button)}
 plus.addEventListener('click',()=>setZoom(zoom+0.5));minus.addEventListener('click',()=>setZoom(zoom-0.5));fit.addEventListener('click',()=>{setZoom(1);plus.focus({preventScroll:true})});
 function reset(){if(zoom===1)return false;setZoom(1);if(pan.contains(document.activeElement))plus.focus({preventScroll:true});return true}
 function setItem(media,item){if(image&&loadHandler)image.removeEventListener('load',loadHandler);zoom=1;image=item.type==='video'?null:media;if(!image&&controls.contains(document.activeElement))viewer.focus({preventScroll:true});controls.hidden=!image;loadHandler=()=>apply();image?.addEventListener('load',loadHandler);apply()}
 function key(event){if(event.defaultPrevented||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.isComposing)return false;if(event.key==='Escape'&&reset()){event.preventDefault();event.stopPropagation();return true}if(!image||!(viewer.contains(event.target)||controls.contains(event.target)))return false;const steps={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(zoom>1&&steps[event.key]){event.preventDefault();move(...steps[event.key]);return true}if(['+','=','-','0'].includes(event.key)){event.preventDefault();setZoom(event.key==='0'?1:zoom+(event.key==='-'?-0.5:0.5));return true}return false}
 return {setItem,key,reset,isZoomed:()=>zoom>1,destroy(){if(image&&loadHandler)image.removeEventListener('load',loadHandler);reset();controls.remove()}};
}
