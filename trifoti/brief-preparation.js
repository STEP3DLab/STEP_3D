import {projects} from './project-data.js?v=20261024-case-story';
import {caseKeys,exactLink} from './exploration-data.js';

// Optional preparation only: no new named fields, storage, upload or requests.
export const preparationDirections=Object.freeze([
 {name:'Дизайн и архитектура',question:'Хотите изменить пространство?',note:'Интерьер, экстерьер или отдельный элемент среды.',materials:['Фото пространства или места установки','Примерные размеры или план, если есть','Примеры атмосферы, цвета и материалов']},
 {name:'Скульптура',question:'Нужен образ в объёме?',note:'Персонаж, скульптура или арт-объект.',materials:['Эскиз, описание образа или примеры','Примерный размер и фото места установки','Пожелания к материалу и условиям размещения']},
 {name:'Бытовой дизайн',question:'Нужен предмет для повседневной жизни?',note:'Начните с его функции и того, как им будут пользоваться.',materials:['Описание назначения и использования','Основные размеры и ограничения места','Примеры формы, цвета или удобных решений']},
 {name:'Сувениры, призы, награды',question:'Нужен памятный предмет?',note:'Сувенир, приз или награда для события.',materials:['Повод, получатели и примерный тираж','Символика, логотип или эскиз, если есть','Пожелания к размеру, упаковке и сроку']}
]);
const commonMaterials=['Короткое описание задумки','Примеры того, что нравится','Известные размеры или ограничения'];
export function preparationMaterials(direction){return preparationDirections.find(item=>item.name===direction)?.materials||commonMaterials}
export const ideaQuestions=Object.freeze(['Понятно ли, для кого и зачем нужен объект?','Указано ли, где и как им будут пользоваться?','Есть ли ориентир по размеру или важные ограничения?','Понятно ли, что нравится в выбранных примерах?']);
export function appendSelectionReference(current,ids){
 const valid=[...new Set(Array.isArray(ids)?ids:[])].filter(key=>caseKeys.includes(key)).slice(0,3);
 const blocks=valid.filter(key=>!current.includes(exactLink(key))).map(key=>{
  const project=projects[key];return `${project.title}\n${project.attribution||project.type}\n${exactLink(key)}`;
 });
 if(!blocks.length)return {value:current,added:0};
 const value=current+(current?'\n\n':'')+blocks.join('\n\n');
 return value.length>6000?{value:current,added:0,tooLong:true}:{value,added:blocks.length};
}
export function mountBriefPreparation({form,document,window}){
 const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node};
 const details=el('details');details.className='brief-preparation';details.id='brief-preparation';
 const summary=el('summary','Нужна помощь с брифом?');details.append(summary);
 const body=el('div');body.className='brief-preparation-body';details.append(body);
 body.append(el('p','Необязательно. Можно пропустить любой пункт и сохранить бриф с тем, что уже известно. Отметки ниже не попадают в бриф и исчезнут после обновления страницы.'));
 const navigation=el('details');navigation.append(el('summary','Как выбрать направление?'));
 for(const direction of preparationDirections){
  const item=el('div');item.className='brief-direction-option';item.append(el('p',direction.question),el('p',direction.note));
  const button=el('button',direction.name);button.type='button';
  button.addEventListener('click',()=>{form.elements.namedItem('direction').value=direction.name;form.elements.namedItem('direction').dispatchEvent(new window.Event('change',{bubbles:true}));notice.textContent=`Выбрано: ${direction.name}. Поле направления можно изменить в любой момент.`});
  item.append(button);navigation.append(item);
 }
 const unsure=el('button','Пока не знаю');unsure.type='button';unsure.addEventListener('click',()=>{const field=form.elements.namedItem('direction');field.selectedIndex=0;field.dispatchEvent(new window.Event('change',{bubbles:true}));notice.textContent='Можно пока не выбирать направление.'});navigation.append(unsure);body.append(navigation);
 const notice=el('p');notice.className='form-note';notice.setAttribute('role','status');body.append(notice);
 const materials=el('section');materials.append(el('h4','Что можно подготовить к разговору'));const materialNote=el('p','Если материалы есть, держите их под рукой. Загружать или передавать их здесь не нужно.');materials.append(materialNote);const list=el('div');list.className='brief-checklist';materials.append(list);body.append(materials);
 const selfCheck=el('details');selfCheck.append(el('summary','Самопроверка описания идеи'));
 selfCheck.append(el('p','Это вопросы для вас, а не оценка готовности. Неизвестное можно обсудить позже. Текст брифа не изменяется автоматически.'));
 const checks=[];for(const question of ideaQuestions){const label=el('label'),check=el('input');check.type='checkbox';label.append(check,document.createTextNode(question));checks.push(check);selfCheck.append(label)}body.append(selfCheck);
 const close=el('button','Свернуть подсказки');close.type='button';close.addEventListener('click',()=>{details.open=false;summary.focus()});body.append(close);
 form.querySelector('.brief-intro').after(details);
 let previousDirection=null;const checkedMaterials=new Map();
 function refresh(){const direction=form.elements.namedItem('direction').value;if(previousDirection===direction)return;previousDirection=direction;list.replaceChildren();for(const text of preparationMaterials(direction)){const label=el('label'),check=el('input');check.type='checkbox';check.checked=checkedMaterials.get(direction+'|'+text)||false;check.addEventListener('change',()=>checkedMaterials.set(direction+'|'+text,check.checked));label.append(check,document.createTextNode(text));list.append(label)}}
 function reset(){checkedMaterials.clear();for(const check of checks)check.checked=false;previousDirection=null;notice.textContent='';refresh()}
 refresh();return {refresh,reset};
}
