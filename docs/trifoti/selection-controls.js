import {projects} from './project-data.js?v=20261026-directions';
import {visiblePortfolioTarget} from './portfolio-disclosure.js?v=20261026-directions';
export function bindSelectionButton({button,key,controller,status}){
 if(!projects[key])return ()=>{};
 button.hidden=false;button.type='button';button.setAttribute('aria-label','Добавить в подборку: '+projects[key].title);
 const unsubscribe=controller.subscribe(ids=>{if(status)status.textContent='';const selected=ids.includes(key);button.textContent=selected?'✓ В подборке · убрать':'+ В подборку';button.setAttribute('aria-pressed',String(selected));button.setAttribute('aria-label',(selected?'Убрать из подборки: ':'Добавить в подборку: ')+projects[key].title)});
 button.addEventListener('click',()=>{const result=controller.toggle(key);if(status){status.textContent=result.message;status.dataset.state=result.ok?'ready':'error'}});return unsubscribe;
}
export function selectionReturnTarget(document,key){
 const card=document.querySelector(`[data-selection="${key}"]`),filter=document.querySelector('[data-filter][aria-pressed="true"]');
 return visiblePortfolioTarget(card)?card:visiblePortfolioTarget(filter)?filter:document.getElementById('all-projects-summary');
}
export function mountSelectionSummary({host,document,controller}){
 const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n};
 const region=el('section');region.className='selection-summary';region.setAttribute('aria-label','Ваша подборка');const title=el('h3'),list=el('ul'),actions=el('div'),compare=el('button','Сравнить выбранное'),meeting=el('a','Показать на встрече'),status=el('p');status.className='form-note';status.setAttribute('role','status');compare.type='button';compare.addEventListener('click',()=>controller.showSelection());actions.className='exploration-actions';actions.append(compare,meeting);region.append(title,list,actions,status);host.append(region);
 controller.subscribe(ids=>{region.hidden=!ids.length;title.textContent=`Ваша подборка · ${ids.length} из 3`;compare.textContent=ids.length<2?'Открыть подборку':'Сравнить выбранное';meeting.href='meeting.html#show/'+ids.join(',')+'/0';list.replaceChildren();for(const key of ids){const item=el('li'),name=el('span',projects[key].title),remove=el('button','Убрать');remove.type='button';remove.setAttribute('aria-label','Убрать из подборки: '+projects[key].title);remove.addEventListener('click',()=>{controller.toggle(key,false);if(!region.hidden)(list.querySelector('button')||compare).focus({preventScroll:true});else selectionReturnTarget(document,key)?.focus({preventScroll:true})});item.append(name,remove);list.append(item)}});
 return {region,status};
}
