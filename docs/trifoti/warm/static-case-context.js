import {staticContext,modeLinks} from './view-context.js?v=20261026-directions';
export function initializeStaticContext({document,window}){
 const page=document.querySelector('[data-static-case]');if(!page)return;
 function sync(){const context=staticContext(page.dataset.staticCase,window.location.hash);if(!context)return;const links=modeLinks(context.key,context.id);for(const link of document.querySelectorAll('[data-view-mode]'))link.href='../'+links[link.dataset.viewMode]}
 window.addEventListener('hashchange',sync);window.addEventListener('pageshow',sync);sync();
}
if(typeof document!=='undefined'&&typeof window!=='undefined')initializeStaticContext({document,window});
