import {visiblePortfolioTarget} from './portfolio-disclosure.js?v=20261026-directions';

// Keep a focused return visible through delayed native history restoration.
// Any newer visitor intent stops correction; no timers or history changes.
export function keepFocusedReturnVisible({target,document,window,isOpen,mode,reveal=false}){
 if(!target)return ()=>{};
 let active=true,awaitingBack=mode==='back',returnHash=window.location.hash;
 const inputs=['keydown','pointerdown','touchstart','wheel'];
 function cancel(){
  if(!active)return;active=false;
  window.removeEventListener('scroll',check);window.removeEventListener('popstate',route);window.removeEventListener('hashchange',hashChanged);window.removeEventListener('blur',cancel);window.removeEventListener('pagehide',cancel);
  for(const type of inputs)document.removeEventListener(type,cancel,true);document.removeEventListener('focusin',focusChanged,true);
 }
 function focusChanged(){if(document.activeElement!==target)cancel()}
 function route(){if(awaitingBack){awaitingBack=false;returnHash=window.location.hash}else cancel()}
 function hashChanged(){if(!awaitingBack&&window.location.hash!==returnHash)cancel()}
 function available(){return !isOpen()&&document.activeElement===target&&visiblePortfolioTarget(target)}
 function check(){
  if(!available()){cancel();return}
  const rect=target.getBoundingClientRect(),header=document.querySelector('.header')?.getBoundingClientRect().bottom||0;
  if(rect.bottom>header&&rect.top<window.innerHeight)return;
  target.scrollIntoView({block:'center',behavior:'instant'});
 }
 if(!available()){cancel();return cancel}
 if(reveal)target.scrollIntoView({block:'center',behavior:'instant'});else check();
 if(!active)return cancel;
 window.addEventListener('scroll',check,{passive:true});window.addEventListener('popstate',route);window.addEventListener('hashchange',hashChanged);window.addEventListener('blur',cancel);window.addEventListener('pagehide',cancel);
 for(const type of inputs)document.addEventListener(type,cancel,{capture:true,passive:true});document.addEventListener('focusin',focusChanged,true);
 return cancel;
}
