import {projects} from './project-data.js?v=20261026-directions';
import {caseKeys,exactLink} from './exploration-data.js?v=20261026-directions';
export const referenceBlock=key=>`${projects[key].title}\n${projects[key].attribution||projects[key].type}\n${exactLink(key)}`;
// Recognize only complete blocks written by this site. Arbitrary older prose is opaque.
export function referenceParts(value=''){
 const blocks=value.split('\n\n');
 const parts=blocks.map(text=>({text,key:caseKeys.find(key=>text===referenceBlock(key))||null}));
 if(!parts[0].key&&parts.slice(1).every(part=>part.key))parts[0].key=caseKeys.find(key=>parts[0].text===projects[key].title)||null;
 return parts;
}
export function appendSelectionReference(current,ids){
 const valid=[...new Set(Array.isArray(ids)?ids:[])].filter(key=>caseKeys.includes(key)).slice(0,3);
 const recognized=new Set(referenceParts(current).map(p=>p.key));
 const blocks=valid.filter(key=>!recognized.has(key)&&!current.includes(exactLink(key))).map(referenceBlock);
 if(!blocks.length)return {value:current,added:0};
 const value=current+(current?'\n\n':'')+blocks.join('\n\n');
 return value.length>6000?{value:current,added:0,tooLong:true}:{value,added:blocks.length};
}
export function removeCaseReference(current,key){if(!caseKeys.includes(key))return current;return referenceParts(current).filter(p=>p.key!==key).map(p=>p.text).join('\n\n')}
export function mountReferenceManager({host,field,document,onChange,focusFallback}){
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 function refresh(){
  host.hidden=!field.value;host.replaceChildren();if(!field.value)return;
  const title=el('h4','Референсы в брифе');title.tabIndex=-1;host.append(title);
  const parts=referenceParts(field.value),keys=[...new Set(parts.map(p=>p.key).filter(Boolean))];
  for(const key of keys){const row=el('div');row.className='reference-item';row.append(el('span',projects[key].title));const remove=el('button','Убрать');remove.type='button';remove.setAttribute('aria-label','Убрать из брифа: '+projects[key].title);remove.addEventListener('click',()=>{field.value=removeCaseReference(field.value,key);refresh();onChange();(host.hidden?focusFallback:host.querySelector('button')||host.querySelector('h4'))?.focus({preventScroll:true})});row.append(remove);host.append(row)}
  const legacy=parts.filter(p=>!p.key).map(p=>p.text).join('\n\n');
  if(legacy){const details=el('details'),summary=el('summary','Сохранённый текст референса'),text=el('p',legacy);text.className='reference-legacy';details.append(summary,text);host.append(details);const remove=el('button','Убрать сохранённый текст'),cancel=el('button','Отмена');remove.type=cancel.type='button';cancel.hidden=true;let confirming=false;remove.addEventListener('click',()=>{if(!confirming){confirming=true;remove.textContent='Подтвердить удаление текста';cancel.hidden=false;return}field.value=referenceParts(field.value).filter(p=>p.key).map(p=>p.text).join('\n\n');refresh();onChange();(host.hidden?focusFallback:host.querySelector('button')||host.querySelector('h4'))?.focus({preventScroll:true})});cancel.addEventListener('click',()=>{confirming=false;cancel.hidden=true;remove.textContent='Убрать сохранённый текст';remove.focus({preventScroll:true})});details.append(remove,cancel)}
 }
 refresh();return {refresh};
}
