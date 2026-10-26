import {briefErrors,formatBrief} from './brief-utils.js?v=20261026-directions';

export function ideaCount(value,limit=4000){
 const length=value.length,remaining=limit-length;
 return {length,near:remaining<=200,text:`${length} / ${limit}${remaining<=0?' · Лимит достигнут':remaining<=200?` · Осталось ${remaining}`:''}`,announcement:remaining<=0?'Лимит описания достигнут: 4000 символов.':remaining<=200?'До лимита описания осталось не более 200 символов.':''};
}
export async function copyBriefText(text,clipboard){
 try{if(typeof clipboard?.writeText!=='function')return false;await clipboard.writeText(text);return true}catch{return false}
}

// Enhances the existing local-only form. No additional fields, storage or requests.
export function initializeBriefTools({form,document,draftSession,draftStatus,onReset,onValidation=()=>{},clipboard=globalThis.navigator?.clipboard}){
 const get=id=>document.getElementById(id),field=key=>form.elements.namedItem(key);
 const values=()=>Object.fromEntries(new FormData(form));
 const preview=get('brief-text'),details=get('brief-text-fallback'),copy=get('brief-copy'),copyStatus=get('brief-copy-status');
 const counter=get('brief-idea-counter'),limitStatus=get('brief-idea-limit'),newButton=get('brief-new'),confirm=get('brief-reset-confirm');
 const touched=new Set();let copying=false,copyRevision=0;
 function error(key){
  const message=briefErrors(values())[key],node=get(`brief-${key}-error`);
  node.textContent=message;node.hidden=!message;field(key).setAttribute('aria-invalid',String(Boolean(message)));
  return Boolean(message);
 }
 function refresh(){
  for(const key of touched)error(key);
  onValidation([...touched].filter(key=>Boolean(briefErrors(values())[key])));
  const count=ideaCount(field('idea').value);counter.textContent=count.text;counter.dataset.nearLimit=String(count.near);
  if(limitStatus.textContent!==count.announcement)limitStatus.textContent=count.announcement;
  if(details.open)preview.value=formatBrief(values());
  if(copyStatus.textContent&&!copying)copyStatus.textContent='';
 }
 function validate(){
  let first;
  for(const key of ['name','idea']){touched.add(key);if(error(key)&&!first)first=field(key)}
  onValidation(['name','idea'].filter(key=>Boolean(briefErrors(values())[key])));
  if(first){first.focus();return false}return true;
 }
 for(const key of ['name','idea'])field(key).addEventListener('blur',()=>{touched.add(key);error(key)});
 copy.addEventListener('click',async()=>{
  if(copying)return;
  copyStatus.textContent='';
  // The primary copy action exports a complete brief. The preview stays available
  // independently so an unfinished draft can still be selected and preserved.
  if(!validate())return;
  const revision=++copyRevision,text=formatBrief(values());preview.value=text;
  copying=true;copy.disabled=true;copyStatus.textContent='Копируем текст…';
  const copied=await copyBriefText(text,clipboard);
  if(revision!==copyRevision)return;
  copying=false;copy.disabled=false;
  if(copied){copyStatus.textContent=formatBrief(values())===text?'Бриф скопирован. Данные никуда не отправлены.':'Скопирована версия до последних изменений. Скопируйте ещё раз, чтобы обновить текст.'}
  else{preview.value=formatBrief(values());details.open=true;copyStatus.textContent='Автоматическое копирование недоступно. Выделите текст в открытом блоке и скопируйте его вручную.';preview.focus();preview.select()}
 });
 function closeConfirmation(){confirm.hidden=true;newButton.setAttribute('aria-expanded','false');newButton.focus()}
 newButton.addEventListener('click',()=>{
  if(!confirm.hidden){closeConfirmation();return}
  confirm.hidden=false;newButton.setAttribute('aria-expanded','true');get('brief-reset-no').focus();
 });
 get('brief-reset-no').addEventListener('click',closeConfirmation);
 confirm.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeConfirmation()}});
 get('brief-reset-yes').addEventListener('click',()=>{
  // Recheck at confirmation time; never delete another tab's newer draft.
  const state=draftSession.clear();
  if(state!=='empty'){draftStatus(state);closeConfirmation();return}
  copyRevision++;copying=false;copy.disabled=false;copyStatus.textContent='';
  for(const key of ['reference','name','idea','budget','deadline'])field(key).value='';
  field('direction').selectedIndex=0;touched.clear();
  for(const key of ['name','idea']){field(key).removeAttribute('aria-invalid');get(`brief-${key}-error`).hidden=true;get(`brief-${key}-error`).textContent=''}
  preview.value=formatBrief(values());details.open=false;confirm.hidden=true;newButton.setAttribute('aria-expanded','false');
  onReset();refresh();draftStatus('empty');get('brief-status').textContent='Новый бриф готов. Предыдущий черновик удалён только из этого браузера.';get('brief-status').dataset.state='ready';field('name').focus();
 });
 // Native constraint validation remains available if this module fails to initialize.
 form.noValidate=true;details.hidden=false;copy.disabled=false;get('brief-reset-controls').hidden=false;refresh();
 return {refresh,validate};
}
