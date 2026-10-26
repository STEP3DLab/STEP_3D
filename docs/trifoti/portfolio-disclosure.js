// A target inside a closed details element is not a valid focus destination.
export function visiblePortfolioTarget(target){
 if(!target?.isConnected||target.hidden||target.closest?.('[hidden],[inert]'))return false;
 for(let node=target.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS'&&!node.open)return false;
 return true;
}
export function initializePortfolioDisclosure({document,window}){
 const catalog=document.getElementById('all-projects');if(!catalog)return null;
 const reveal=()=>{catalog.open=true};
 const sync=()=>{if(new URL(window.location.href).searchParams.has('filter')||window.location.hash.startsWith('#explore/'))reveal()};
 for(const link of document.querySelectorAll('a[data-show-projects]'))link.addEventListener('click',event=>{if(!event.defaultPrevented&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&(event.button===0||event.button===undefined))reveal()});
 window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);sync();return {reveal,sync};
}
