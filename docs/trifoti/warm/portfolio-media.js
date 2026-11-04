// A single active resource; obsolete events cannot update a newer frame.
// No prefetch, automatic retries, storage, autoplay or background playback.
export function createMediaSlot({document,host,status,onReady=()=>{},onError=()=>{}}){
 let active=null,revision=0;
 function clear(){revision++;if(active?.tagName==='VIDEO'){active.pause();active.removeAttribute('src');active.load?.()}active=null;host.replaceChildren();status.textContent='';}
 function show(item,{preview=false,source=null,video=false}={}){
  clear();const token=revision,node=document.createElement(video?'video':'img');active=node;
  if(video){node.controls=true;node.playsInline=true;node.preload='none';node.poster=item.poster;node.setAttribute('aria-label',item.caption);status.textContent='Нажмите ▶ в управлении видео, чтобы загрузить и воспроизвести его.';}
  else{if(preview)node.className='resource-preview';node.alt=(preview?'Превью. ':'')+item.caption;node.decoding='async';status.textContent='Загрузка изображения…';}
  const current=()=>token===revision&&active===node;
  node.addEventListener(video?'loadeddata':'load',()=>{if(current()){status.textContent=preview?'Лёгкий постер. Оригинал можно загрузить отдельно.':'';onReady()}});
  node.addEventListener('error',()=>{if(current()){status.textContent='Материал не загрузился. Повторите попытку кнопкой ниже или откройте исходный файл.';onError()}});
  node.src=source||(video?item.src:item.poster||item.src);host.append(node);return node;
 }
 function pause(){if(active?.tagName==='VIDEO')active.pause()}
 return {show,clear,pause};
}
