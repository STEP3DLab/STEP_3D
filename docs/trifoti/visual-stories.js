import {projects} from './project-data.js?v=20261024-case-story';
import {mediaId,exactLink} from './exploration-data.js';
import {thumbnailSource} from './media-utils.js';

// Editorial views of existing assets. These are not production timelines.
export const visualStories=[
 {id:'bear-colours',title:'Медведь: два цветовых исполнения',key:'mascot',note:'Реальные фотографии с разным освещением и ракурсами. Это сопоставление исполнений, не конфигуратор заказа.',groups:[
  {label:'Белое исполнение',ids:['white-edition','white-front','white-side']},
  {label:'Красное исполнение',ids:['red-edition','red-profile','red-three-quarter','red-back','red-head']}]},
 {id:'object-model',title:'Восстановление: объект и модель',key:'restoration',note:'Объект на месте и проработка в модели. Ракурсы не совмещены; фотографии не обозначают последовательность «до / после».',groups:[
  {label:'Объект на месте',ids:['initial','loss-detail','result','result-detail']},
  {label:'Скульптурная модель',ids:['model-front','model-angle']}]},
 {id:'std-story',title:'Награды СТД: образ, серия, вручение',key:'stdAwards',note:'Три стороны одного проекта: обсуждение образа, готовые награды и церемония. На первом фото показана проработка у доски, а не сам процесс производства.',groups:[
  {label:'Рассказ в трёх фотографиях',ids:['design-process','award-series','award-ceremony'],labels:['Обсуждение образа и этапов работы','Готовая серия в мастерской','Вручение премии']}]},
 {id:'rto-story',title:'Кубок РТО: изделие и церемония',key:'rto-traveling-cup',note:'Кубок, команда первого обладателя и общий кадр Спартакиады РТО 2026 года. Общая фотография не обозначает состав одного театра.',groups:[
  {label:'Рассказ в трёх фотографиях',ids:['trophy','ceremony','winners'],labels:['Готовый кубок','Первый обладатель: «Ленком Марка Захарова»','Участники и победители Спартакиады']}]}
];
export function storyMedia(key,id){return projects[key]?.media.find(item=>mediaId(item)===id)}
export function atlasPreview(key,item){return projects[key].media.length<2?(item.poster||item.src):thumbnailSource(item)}
export function atlasFrames(key='all',kind='all'){
 return Object.entries(projects).flatMap(([projectKey,project])=>project.media.map(item=>({key:projectKey,item})))
  .filter(frame=>(key==='all'||frame.key===key)&&(kind==='all'||(kind==='video')===(frame.item.type==='video')));
}
export function mountVisualStories({host,document,onOpen}){
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 const region=el('section',null,'visual-stories');region.setAttribute('aria-label','Визуальные истории и атлас');region.append(el('h3','Рассмотреть подробнее'));
 host.append(region);
 function disclosure(title,build){const details=el('details'),summary=el('summary',title),body=el('div',null,'visual-story-body');details.append(summary,body);let built=false;details.addEventListener('toggle',()=>{if(details.open&&!built){built=true;build(body)}});region.append(details);return details}
 function attribution(host,key){const project=projects[key];host.append(el('p',project.attribution||project.type,'form-note'));const sources=el('div',null,'visual-story-sources');for(const source of project.sources||[]){const link=el('a',source.label);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link)}host.append(sources)}
 function frameLink(key,item,text){const link=el('a',text,'visual-frame-link');link.href=exactLink(key,mediaId(item));link.addEventListener('click',event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onOpen(key,mediaId(item),link)});return link}
 function viewer(key,group){const card=el('article',null,'visual-story-card');card.append(el('h4',group.label));const figure=el('figure'),image=el('img'),caption=el('figcaption');image.loading='lazy';image.decoding='async';image.width=640;image.height=640;figure.append(image,caption);card.append(figure);const controls=el('div',null,'exploration-actions'),previous=el('button','←'),next=el('button','→'),counter=el('span');previous.type=next.type='button';previous.setAttribute('aria-label','Предыдущий кадр: '+group.label);next.setAttribute('aria-label','Следующий кадр: '+group.label);counter.setAttribute('role','status');controls.append(previous,counter,next);card.append(controls);const opener=el('div');card.append(opener);let index=0;
  const update=()=>{const item=storyMedia(key,group.ids[index]);image.src=item.poster||item.src;image.alt=item.caption;caption.textContent=(group.labels?.[index]?group.labels[index]+'. ':'')+item.caption;counter.textContent=`${index+1} / ${group.ids.length}`;opener.replaceChildren(frameLink(key,item,'Открыть этот кадр в галерее'));};
  previous.addEventListener('click',()=>{index=(index+group.ids.length-1)%group.ids.length;update()});next.addEventListener('click',()=>{index=(index+1)%group.ids.length;update()});update();return card;
 }
 for(const story of visualStories)disclosure(story.title,body=>{body.append(el('p',story.note,'form-note'));const grid=el('div',null,story.groups.length===2?'visual-story-grid':'visual-story-single');for(const group of story.groups)grid.append(viewer(story.key,group));body.append(grid);attribution(body,story.key)});
 disclosure('Атлас: 23 фотографии и 2 видео',body=>{
  body.append(el('p','Миниатюры всех кадров: нажмите, чтобы открыть полный кадр с подписью. Видео показаны постерами и запускаются только в галерее по вашему нажатию.','form-note'));
  const filters=el('div',null,'visual-atlas-filters');const projectLabel=el('label','Работа'),projectSelect=el('select'),kindLabel=el('label','Тип материала'),kindSelect=el('select');
  for(const [value,text] of [['all','Все работы'],...Object.entries(projects).map(([key,p])=>[key,p.title])]){const option=el('option',text);option.value=value;projectSelect.append(option)}
  for(const [value,text] of [['all','Фото и видео'],['photo','Только фотографии'],['video','Только видео']]){const option=el('option',text);option.value=value;kindSelect.append(option)}
  projectSelect.value=kindSelect.value='all';projectLabel.append(projectSelect);kindLabel.append(kindSelect);filters.append(projectLabel,kindLabel);body.append(filters);const status=el('p',null,'form-note');status.setAttribute('role','status');const grid=el('div',null,'visual-atlas-grid');body.append(status,grid);
  function render(){const frames=atlasFrames(projectSelect.value,kindSelect.value);status.textContent=`Показано кадров: ${frames.length}.`;grid.replaceChildren();if(!frames.length){grid.append(el('p','Для этой работы нет материалов выбранного типа. Измените фильтр.'));return}for(const {key,item} of frames){const figure=el('figure'),link=frameLink(key,item,null),image=el('img'),caption=el('figcaption');image.src=atlasPreview(key,item);image.alt=item.caption;image.loading='lazy';image.decoding='async';image.width=320;image.height=240;link.append(image,el('span',(item.type==='video'?'Видео · ':'Фото · ')+projects[key].title));caption.textContent=item.caption;figure.append(link,caption,el('p',projects[key].attribution||projects[key].type,'form-note'));grid.append(figure)}}
  projectSelect.addEventListener('change',render);kindSelect.addEventListener('change',render);render();
 });
 return region;
}
