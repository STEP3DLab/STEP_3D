const PACK_URL='https://step3dlab.github.io/STEP_3D/trifoti/information-pack.html';
export function packetSelection(hash,allowed){
 if(typeof hash!=='string'||hash.length>180||!hash.startsWith('#cases/'))return [];
 return [...new Set(hash.slice(7).split(',').filter(id=>allowed.includes(id)))].slice(0,3);
}
export function packetURL(ids){return PACK_URL+(ids.length?'#cases/'+ids.join(','):'')}
export function initializeInformationPack({document,window}){
 const get=id=>document.getElementById(id);if(!get('information-pack'))return null;
 // The packet selection owns the hash. Enhance only the in-page skip action;
 // its native href remains useful when JavaScript is unavailable.
 get('pack-skip')?.addEventListener('click',event=>{if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const main=get('information-pack');main.focus({preventScroll:true});main.scrollIntoView({block:'start'})});
 const cards=[...document.querySelectorAll('[data-pack-case]')],choices=[...document.querySelectorAll('[data-pack-choice]')];
 const allowed=cards.map(card=>card.dataset.packCase),feedback=get('pack-feedback'),fallback=get('pack-copy-fallback'),url=get('pack-url');
 let selected=[],revision=0;
 function render(){revision++;fallback.hidden=true;feedback.textContent='';for(const card of cards)card.hidden=!selected.includes(card.dataset.packCase);for(const choice of choices)choice.checked=selected.includes(choice.dataset.packChoice);get('pack-reset').disabled=!selected.length;get('pack-selection-status').textContent=selected.length?`Выбрано работ: ${selected.length} из 3. Состав указан в ссылке этой справки.`:'Работы не выбраны. Можно включить до трёх кейсов с помощью списка выше.';url.value=packetURL(selected)}
 function sync(){selected=packetSelection(window.location.hash,allowed);render()}
 function update(){window.history.replaceState(null,'',selected.length?'#cases/'+selected.join(','):window.location.pathname);render()}
 for(const choice of choices)choice.addEventListener('change',()=>{const key=choice.dataset.packChoice;if(choice.checked&&selected.length===3){choice.checked=false;feedback.textContent='Можно включить не больше трёх работ. Сначала снимите один из выбранных пунктов.';return}selected=choice.checked?[...selected,key]:selected.filter(id=>id!==key);update()});
 get('pack-reset').addEventListener('click',()=>{selected=[];update();choices[0]?.focus()});
 get('pack-print').addEventListener('click',()=>window.print());
 get('pack-copy').addEventListener('click',async()=>{const token=++revision,value=packetURL(selected);let copied=false;try{if(window.navigator.clipboard?.writeText){await window.navigator.clipboard.writeText(value);copied=true}}catch{}if(token!==revision)return;feedback.textContent=copied?'Ссылка скопирована. Она содержит только выбранные публичные ID работ.':'Автоматическое копирование недоступно. Скопируйте ссылку из поля ниже.';fallback.hidden=copied;if(!copied){url.value=value;url.focus();url.select()}});
 window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);
 sync();get('pack-actions').hidden=false;get('pack-chooser').hidden=false;
 return {sync};
}
if(typeof document!=='undefined'&&typeof window!=='undefined')initializeInformationPack({document,window});
