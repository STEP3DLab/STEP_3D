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

export function initializePortfolioFilters({document,window}){
 if(instances.has(document))return instances.get(document);
 const root=document.getElementById('projects');
 if(!root)return false;
 const buttons=[...root.querySelectorAll('button[data-filter]')];
 const cards=[...root.querySelectorAll('.project-card[data-category][data-project]')];
 const reset=document.getElementById('filter-reset');
 const status=document.getElementById('filter-status');
 const empty=document.getElementById('project-empty');
 const emptyBrief=document.getElementById('empty-category-brief');
 if(!status||!buttons.some(button=>button.dataset.filter==='all'))return false;
 const matches=(card,key)=>key==='all'||card.dataset.category.split(/\s+/).includes(key);
 const countFor=key=>cards.filter(card=>matches(card,key)).length;
 function select(key,persist=true){
  const selected=buttons.find(button=>button.dataset.filter===key);
  if(!selected)return false;
  for(const button of buttons){
   const active=button===selected;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
   const badge=button.querySelector('.filter-count');
   if(badge)badge.textContent=String(countFor(button.dataset.filter));
  }
  for(const card of cards){card.hidden=!matches(card,key);const wrapper=card.closest?.('.project-item');if(wrapper)wrapper.hidden=card.hidden}
  const count=countFor(key),label=selected.dataset.direction||labels[key]||key;
  status.textContent=projectCount(count)+(key==='all'?'':` · ${label}`);
  if(empty)empty.hidden=count>0;
  if(emptyBrief)emptyBrief.setAttribute('aria-label',`Подготовить бриф (${key==='all'?'Все направления':label})`);
  if(reset)reset.hidden=key==='all';
  if(persist&&window){
   try{const url=new URL(window.location.href);if(key==='all')url.searchParams.delete('filter');else url.searchParams.set('filter',key);window.history.replaceState(window.history.state,'',url.href)}catch{}
  }
  return true;
 }
 for(const [index,button] of buttons.entries()){
  button.addEventListener('click',event=>{if(ordinaryClick(event))select(button.dataset.filter)});
  button.addEventListener('keydown',event=>{
   if(event.defaultPrevented||event.isComposing||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
   const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:event.key==='ArrowRight'?(index+1)%buttons.length:event.key==='ArrowLeft'?(index-1+buttons.length)%buttons.length:null;
   if(next===null)return;event.preventDefault();select(buttons[next].dataset.filter);buttons[next].focus();
  });
 }
 reset?.addEventListener('click',()=>{buttons[0].focus();select('all')});
 for(const link of document.querySelectorAll('a[data-show-projects]'))link.addEventListener('click',event=>{
  // Only choose the collection; the native anchor owns scrolling and history.
  if(ordinaryClick(event))select(link.dataset.showProjects);
 });
 const controller={select};instances.set(document,controller);
 const initial=buttons.find(button=>button.getAttribute('aria-pressed')==='true')?.dataset.filter||'all';
 const fromURL=()=>{const key=new URL(window.location.href).searchParams.get('filter');return buttons.some(button=>button.dataset.filter===key)?key:'all'};
 select(window?fromURL():initial,false);
 window?.addEventListener('popstate',()=>select(fromURL(),false));
 return controller;
}
