// One attempt per explicit activation. Old slides and closed dialogs stay inert.
export function watchGalleryMedia({media,type,viewer,status,retry,announcement,document,isCurrent,onRetry,retrying=false,caption='',schedule=setTimeout,cancel=clearTimeout}) {
 let state='loading';
 const timer=schedule(()=>{if(state==='loading'&&isCurrent())status.textContent=retrying?'Повторная загрузка файла…':type==='video'?'Загружаем данные видео…':'Загружаем изображение…'},500);
 const moveFocus=()=>{if(document.activeElement===retry&&isCurrent())viewer.focus({preventScroll:true})};
 viewer.setAttribute('aria-busy','true');
 status.textContent=retrying?'Повторная загрузка файла…':'';
 if(!retrying)moveFocus();
 retry.hidden=!retrying;
 retry.setAttribute('aria-disabled',String(retrying));
 // Replace the previous attempt's handler instead of accumulating listeners.
 retry.onclick=()=>{
  if(state!=='failed'||!isCurrent())return;
  state='retrying';
  onRetry();
 };
 media.addEventListener(type==='video'?'loadedmetadata':'load',()=>{
  if(!isCurrent()||state!=='loading')return;
  cancel(timer);state='ready';viewer.setAttribute('aria-busy','false');status.textContent='';
  moveFocus();retry.hidden=true;retry.setAttribute('aria-disabled','false');
  if(retrying)announcement.textContent=`${type==='video'?'Данные видео получены.':'Изображение загружено.'} ${caption}`;
 },{once:true});
 media.addEventListener('error',()=>{
  if(!isCurrent()||(state!=='loading'&&state!=='ready'))return;
  cancel(timer);state='failed';viewer.setAttribute('aria-busy','false');
  status.textContent='Не удалось загрузить файл. Можно повторить загрузку.';
  retry.hidden=false;retry.setAttribute('aria-disabled','false');
 },{once:true});
 return ()=>{cancel(timer);state='disposed'};
}
