// Navigation only describes the viewport. It never moves focus or scrolls.
export function currentSection(sections,readingLine){
 return sections.filter(section=>section.top<=readingLine&&section.bottom>readingLine)
  .sort((a,b)=>b.top-a.top)[0]?.id||null;
}
export function revealService(hash,document){
 if(!/^#service-(design|sculpture|modelmaking|awards)$/.test(hash))return false;
 const target=document.getElementById(hash.slice(1));
 if(!target||target.tagName!=='DETAILS')return false;
 target.open=true;
 return true;
}
export function initializeSectionNavigation({document,window}){
 const links=[...document.querySelectorAll('#navigation a[href^="#"]')];
 const targets=links.map(link=>({link,target:document.getElementById(link.getAttribute('href').slice(1))})).filter(item=>item.target);
 const header=document.querySelector('.header');
 let queued=false;
 const update=()=>{
  queued=false;
  const line=Math.min(window.innerHeight-1,Math.max(0,header?.getBoundingClientRect().bottom||0)+16);
  const active=currentSection(targets.map(({target})=>({id:target.id,...pickBounds(target.getBoundingClientRect())})),line);
  for(const {link,target} of targets){
   if(target.id===active)link.setAttribute('aria-current','location');
   else link.removeAttribute('aria-current');
  }
 };
 function schedule(){if(!queued){queued=true;window.requestAnimationFrame(update)}}
 function route(){revealService(window.location.hash,document);schedule()}
 // Native same-hash links do not fire hashchange. Reveal before the normal anchor action.
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href^="#service-"]');
  if(link&&!event.defaultPrevented&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey){revealService(link.getAttribute('href'),document);schedule()}
 });
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule);
 window.addEventListener('hashchange',route);
 window.addEventListener('popstate',route);
 window.addEventListener('pageshow',route);
 window.addEventListener('load',schedule);
 document.addEventListener('toggle',schedule,true);
 if(window.ResizeObserver){const observer=new window.ResizeObserver(schedule);observer.observe(document.body)}
 route();
 return {update,route};
}
function pickBounds(rect){return {top:rect.top,bottom:rect.bottom}}
