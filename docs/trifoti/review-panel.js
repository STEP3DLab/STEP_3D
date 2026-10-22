export const REVIEW_KEY='trifoti-review-v1';
export const REVIEW_SECTIONS=['Главная и вращающийся медведь','Направления','Проекты','Процесс','Студия','Обсуждение проекта'];
export const REVIEW_DECISIONS=['Обсудить','Оставляем','Доработать','Убрать'];
const emptyReview=()=>({sections:{},notes:''});
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const browserStorage=()=>globalThis.localStorage;

export function normalizeReview(value){
 const review=emptyReview();
 if(!record(value))return{review,state:'invalid'};
 let partial=false;
 if(record(value.sections)){
  for(const [name,decision] of Object.entries(value.sections)){
   if(REVIEW_SECTIONS.includes(name)&&REVIEW_DECISIONS.includes(decision))review.sections[name]=decision;
   else partial=true;
  }
 }else partial=true;
 if(typeof value.notes==='string')review.notes=value.notes;else partial=true;
 return{review,state:partial?'partial':'restored'};
}

export function readReview(getStorage=browserStorage){
 let raw;
 try{raw=getStorage().getItem(REVIEW_KEY)}catch{return{review:emptyReview(),state:'unavailable'}}
 if(raw===null)return{review:emptyReview(),state:'empty'};
 try{return normalizeReview(JSON.parse(raw))}catch{return{review:emptyReview(),state:'invalid'}}
}

export function saveReview(value,getStorage=browserStorage){
 try{
  const {review,state}=normalizeReview(value);
  if(state!=='restored')return false;
  getStorage().setItem(REVIEW_KEY,JSON.stringify(review));return true;
 }catch{return false}
}

export function formatReview(review){
 return `ТРИФОТИ — решения по сайту\nКонцепт 01\n\nСТРУКТУРА\n${REVIEW_SECTIONS.map((name,i)=>`${i+1}. ${name}: ${review.sections[name]||'Обсудить'}`).join('\n')}\n\nВНЕШНИЙ ВИД И ПОЖЕЛАНИЯ\n${review.notes||'Пока без комментариев'}\n\nДОПОЛНИТЬ\n— Согласованные проекты: фото и описания\n— Контакты студии\n`;
}

const messages={
 empty:'Заметки сохраняются только в этом браузере.',
 restored:'Заметки восстановлены из этого браузера.',
 partial:'Часть заметок восстановлена. Проверьте решения по разделам и общий текст.',
 invalid:'Сохранённые заметки не удалось прочитать. Новые правки можно записать ниже.',
 unavailable:'Не удалось прочитать заметки из браузера. Скопируйте важный текст перед закрытием страницы.',
 saved:'Заметки сохранены в этом браузере.',
 failed:'Не удалось сохранить заметки в браузере. Не закрывайте страницу: скопируйте текст или скачайте решения.'
};

export function initializeReviewPanel({document,download,getStorage=browserStorage}){
 const required=id=>{const element=document.getElementById(id);if(!element)throw new Error(`Missing review control: ${id}`);return element};
 const host=required('review-sections'),notes=required('review-notes'),status=required('review-save-status'),exportButton=required('export-review'),exportStatus=required('review-status');
 const recovered=readReview(getStorage),review=recovered.review;
 function report(state){status.textContent=messages[state];status.dataset.state=['partial','invalid','unavailable','failed'].includes(state)?'error':'ready'}
 const save=()=>report(saveReview(review,getStorage)?'saved':'failed');
 const rows=document.createDocumentFragment();
 REVIEW_SECTIONS.forEach((name,i)=>{
  const row=document.createElement('div');row.className='review-section-row';
  const number=document.createElement('span');number.textContent=String(i+1).padStart(2,'0');
  const label=document.createElement('span');label.textContent=name;
  const select=document.createElement('select');select.setAttribute('aria-label',`Решение по разделу «${name}»`);
  REVIEW_DECISIONS.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option)});
  select.value=review.sections[name]||'Обсудить';
  select.addEventListener('change',()=>{review.sections[name]=select.value;save()});
  row.append(number,label,select);rows.append(row);
 });
 notes.value=review.notes;
 notes.addEventListener('input',()=>{review.notes=notes.value;save()});
 exportButton.addEventListener('click',()=>{
  try{download(formatReview(review),'TRIFOTI-site-review.txt');exportStatus.textContent='Скачивание решений запрошено. Если файл не появился, скопируйте заметки.';exportStatus.dataset.state='ready'}
  catch{exportStatus.textContent='Не удалось начать скачивание. Скопируйте заметки и решения по разделам перед закрытием страницы.';exportStatus.dataset.state='error'}
 });
 host.replaceChildren(rows);report(recovered.state);notes.disabled=false;exportButton.disabled=false;
}
