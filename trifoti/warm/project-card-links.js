// Native case-page links remain useful when scripting or dialog support is absent.
export function enhanceProjectCards(cards,{dialog,onOpen}){
 if(typeof dialog?.showModal!=='function')return;
 for(const card of cards){
  card.setAttribute('aria-haspopup','dialog');
  card.setAttribute('aria-controls',dialog.id);
  card.addEventListener('click',event=>{
   if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();onOpen(card);
  });
 }
}
