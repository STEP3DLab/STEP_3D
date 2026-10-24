const instances=new WeakMap();
const labels={sculpture:'Скульптура',awards:'Сувениры, призы, награды'};

function projectCount(count){
 const last=count%10,lastTwo=count%100;
 const noun=lastTwo>=11&&lastTwo<=14?'проектов':last===1?'проект':last>=2&&last<=4?'проекта':'проектов';
 return `${count} ${noun}`;
}
function ordinaryClick(event){
 return !event.defaultPrevented&&(event.button===undefined||event.button===0)&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey;
}

export function initializePortfolioFilters({document}){
 if(instances.has(document))return instances.get(document);
 const root=document.getElementById('projects');
 if(!root)return false;
 const buttons=[...root.querySelectorAll('button[data-filter]')];
 const cards=[...root.querySelectorAll('.project-card[data-category][data-project]')];
 const status=document.getElementById('filter-status');
 const empty=document.getElementById('project-empty');
 const emptyBrief=document.getElementById('empty-category-brief');
 if(!status||!buttons.some(button=>button.dataset.filter==='all'))return false;
 const matches=(card,key)=>key==='all'||card.dataset.category.split(/\s+/).includes(key);
 const countFor=key=>cards.filter(card=>matches(card,key)).length;
 function select(key){
  const selected=buttons.find(button=>button.dataset.filter===key);
  if(!selected)return false;
  for(const button of buttons){
   const active=button===selected;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
   const badge=button.querySelector('.filter-count');
   if(badge)badge.textContent=String(countFor(button.dataset.filter));
  }
  for(const card of cards)card.hidden=!matches(card,key);
  const count=countFor(key),label=selected.dataset.direction||labels[key]||key;
  status.textContent=projectCount(count)+(key==='all'?'':` · ${label}`);
  if(empty)empty.hidden=count>0;
  if(emptyBrief)emptyBrief.setAttribute('aria-label',`Подготовить бриф (${key==='all'?'Все направления':label})`);
  return true;
 }
 for(const button of buttons)button.addEventListener('click',event=>{if(ordinaryClick(event))select(button.dataset.filter)});
 for(const link of document.querySelectorAll('a[data-show-projects]'))link.addEventListener('click',event=>{
  // Only choose the collection; the native anchor owns scrolling and history.
  if(ordinaryClick(event))select(link.dataset.showProjects);
 });
 const controller={select};instances.set(document,controller);
 const initial=buttons.find(button=>button.getAttribute('aria-pressed')==='true')?.dataset.filter||'all';
 select(initial);
 return controller;
}
