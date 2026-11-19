import {concepts,appendConcept} from './concept-data.js?v=20261119-context';
export function addConceptReference({form,selectReference,status,location=window.location,history=window.history}) {
 const url=new URL(location.href),key=url.searchParams.get('concept');
 if(!key||url.hash!=='#brief-form')return;
 const reference=form.elements.namedItem('reference');
 const result=appendConcept(reference.value,key);
 if(result.invalid){status.textContent='Этот концепт не найден. Выберите изображение на странице направления.';return;}
 if(result.tooLong){status.textContent='Концепт не добавлен: достигнут лимит примеров. Уберите ненужный пример и откройте ссылку снова.';return;}
 const direction=form.elements.namedItem('direction');
 const fill=direction.selectedIndex===0&&[...direction.options].some(o=>o.value===concepts[key].direction);
 if(fill)direction.value=concepts[key].direction;
 if(result.added||fill)selectReference(result.value);
 status.textContent='В брифе выбран концепт: '+concepts[key].title+'. Ваш текст сохранён. Ничего не отправлено.';
 url.searchParams.delete('concept');history.replaceState(history.state,'',url.href);
}
