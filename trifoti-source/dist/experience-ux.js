import {formatBrief} from './brief-utils.js?v=20261026-directions';

export function briefCompletion(values){
 const done=['name','idea'].filter(key=>String(values[key]||'').trim()).length;
 return {done,text:done===2?'Можно сохранить · 2 из 2 обязательных полей':`Заполнено ${done} из 2 обязательных полей`};
}
export function ideaPrompts(direction){
 const common=[['Назначение','Для кого и где: '],['Размер','Примерный размер: ']];
 if(direction==='Сувениры и призы')return [...common,['Тираж','Количество изделий: '],['Повод','Событие и символика: ']];
 if(direction==='Дизайн интерьеров')return [['Пространство','Тип пространства: '],['Размер','Площадь или размеры: '],['Задача','Что хочется изменить: ']];
 if(direction==='Макетирование')return [['Задача','Что нужно показать: '],['Масштаб','Масштаб или размеры макета: '],['Детали','Степень детализации: ']];
 return [...common,['Материал','Пожелания к материалу: '],['Образ','Характер и настроение: ']];
}
export function appendIdeaPrompt(value,prompt,limit=4000){
 const addition=(value&&!value.endsWith('\n')?'\n':'')+prompt;
 return value.length+addition.length<=limit?value+addition:null;
}
export function initializeBriefExperience({form,document,window,validate}){
 const get=id=>document.getElementById(id),field=name=>form.elements.namedItem(name);
 const idea=field('idea'),progress=get('brief-progress'),optional=get('brief-optional');
 let direction=null;
 function grow(){idea.style.height='auto';idea.style.height=Math.min(360,Math.max(120,idea.scrollHeight))+'px'}
 function refresh(){
  const state=briefCompletion({name:field('name').value,idea:idea.value});
  get('brief-progress-text').textContent=state.text;get('brief-progress-fill').style.width=`${state.done*50}%`;
  progress.dataset.ready=String(state.done===2);
  if(field('budget').value||field('deadline').value)optional.open=true;
  const selected=field('direction').value;
  if(direction!==selected){
   direction=selected;const host=get('brief-prompt-buttons');host.replaceChildren();
   for(const [label,prompt] of ideaPrompts(direction)){
    const button=document.createElement('button');button.type='button';button.textContent='+ '+label;button.dataset.prompt=prompt;
    button.addEventListener('click',()=>{
     const next=appendIdeaPrompt(idea.value,prompt,idea.maxLength);if(next===null)return;
     idea.value=next;idea.focus();idea.setSelectionRange(next.length,next.length);
     idea.dispatchEvent(new window.Event('input',{bubbles:true}));
    });host.append(button);
   }
  }
  for(const button of get('brief-prompt-buttons').querySelectorAll('button'))button.disabled=appendIdeaPrompt(idea.value,button.dataset.prompt,idea.maxLength)===null;
  grow();
 }
 function showErrors(keys){
  get('brief-error-summary').hidden=!keys.length;
  for(const link of get('brief-error-summary').querySelectorAll('a'))link.hidden=!keys.includes(link.dataset.errorFor);
 }
 for(const link of get('brief-error-summary').querySelectorAll('a'))link.addEventListener('click',event=>{
  event.preventDefault();field(link.dataset.errorFor).focus();
 });
 function preparePrint(){get('brief-print-text').textContent=formatBrief(Object.fromEntries(new FormData(form)));document.body.classList.add('brief-printing')}
 get('brief-print').addEventListener('click',()=>{if(validate()){preparePrint();window.print()}});
 window.addEventListener('beforeprint',preparePrint);
 window.addEventListener('afterprint',()=>document.body.classList.remove('brief-printing'));
 window.addEventListener('resize',grow);
 progress.hidden=false;get('brief-prompts').hidden=false;get('brief-print').hidden=false;refresh();
 return {refresh,showErrors};
}
export function initializeBackToTop({document,window}){
 const link=document.getElementById('back-to-top'),hero=document.getElementById('home'),contact=document.getElementById('contact'),footer=document.querySelector('.site-footer'),stories=document.querySelector('.category-stories');
 if(!link||!window.IntersectionObserver)return;
 let heroVisible=true,contactVisible=false,footerVisible=false,storiesVisible=false;
 const observer=new window.IntersectionObserver(entries=>{
  for(const entry of entries){if(entry.target===hero)heroVisible=entry.isIntersecting;if(entry.target===contact)contactVisible=entry.isIntersecting;if(entry.target===footer)footerVisible=entry.isIntersecting;if(entry.target===stories)storiesVisible=entry.isIntersecting}
  // Keep a focused control present until the visitor moves away.
  if(document.activeElement!==link)link.hidden=heroVisible||contactVisible||footerVisible||storiesVisible;
 });
 for(const target of [hero,contact,footer,stories])if(target)observer.observe(target);
 link.addEventListener('blur',()=>{link.hidden=heroVisible||contactVisible||footerVisible||storiesVisible});
}
