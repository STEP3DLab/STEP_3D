import {projects as publishedProjects} from './project-data.js?v=20261104-red7';
import {mediaId,countedNoun} from './exploration-data.js?v=20261104-red7';

export const storyProjects={...publishedProjects,
"chess-set":{
  "title": "Шахматы для «Комплекс-Сервис»",
  "caseUrl": "https://technopark-rgsu.ru/skb/projects/17/",
  "attribution": "Проект и фотографии Технопарка РГСУ.",
  "media": [
    {
      "type": "image",
      "src": "photos/work/chess1.webp",
      "caption": "Сине-белые шахматы для корпоративного подарка."
    },
    {
      "type": "image",
      "src": "photos/work/chess2.webp",
      "caption": "Фигуры и игровое поле с нескольких ракурсов."
    }
  ]
},
"stage-lamp":{
  "title": "Лампа для мюзикла «Последняя сказка»",
  "caseUrl": "https://technopark-rgsu.ru/skb/projects/14/",
  "attribution": "Проект и фотографии Технопарка РГСУ.",
  "media": [
    {
      "type": "image",
      "src": "photos/work/lamp2.webp",
      "caption": "Готовая лампа с мозаичным рисунком."
    },
    {
      "type": "image",
      "src": "photos/work/lamp1.webp",
      "caption": "Подборка кадров изготовления и сборки лампы."
    }
  ]
},
"atelier-concept":{
  "title": "Мастерская Фёдора Паршина",
  "concept": true,
  "attribution": "Художественная визуализация для ТРИФОТИ.",
  "media": [
    {
      "type": "image",
      "src": "scenes/parshin-atelier-20261106.webp",
      "caption": "Предметная композиция в светлой мастерской."
    }
  ]
},
 'atlas-concept':{title:'Атлас с ажурным глобусом и колонкой',concept:true,attribution:'Концепт из предоставленного изображения. Изготовление не подтверждено.',media:[{type:'image',src:'concepts/atlas.webp',caption:'Концепт подставки под колонку: фигура Атласа и ажурный глобус. Статичное изображение, не интерактивная 3D-модель.'}]},
 'wolves-concept':{title:'Медаль «Волки»',concept:true,attribution:'Концепт из предоставленного изображения. Не заявляется как выполненный заказ клуба.',media:[{type:'image',src:'concepts/wolves.webp',caption:'Концепт хоккейной медали: лицевая и оборотная стороны на одном изображении. Изготовление не подтверждено.'}]}
};
const projects=storyProjects;
export const storyCategories=[
 {id:'corporate',title:'Корпоративные заказы',service:'service-corporate',keys:['chess-set','atlas-concept','wolves-concept']},
 {id:'sculpture',title:'Парковая и монументальная скульптура',service:'service-sculpture',keys:Object.keys(publishedProjects).filter(k=>publishedProjects[k].direction==='Скульптура')},
 {id:'interiors',title:'Дизайн интерьеров',service:'service-design',keys:['red7-panels','atelier-concept']},
 {id:'awards',title:'Награды',service:'service-awards',keys:Object.keys(publishedProjects).filter(k=>publishedProjects[k].direction==='Сувениры и призы')},
 {id:'industrial',title:'Промышленный дизайн',service:'service-industrial',keys:['stage-lamp','atlas-concept']},
 {id:'artobjects',title:'Арт-объекты',service:'service-artobjects',keys:['red7-panels']}
];
export const categoryAliases=Object.freeze({design:'interiors',modelmaking:'industrial'});
export const storyCategory=id=>storyCategories.find(category=>category.id===(categoryAliases[id]||id));
export function storyFrames(id){return (storyCategory(id)?.keys||[]).flatMap(key=>projects[key].media.map((item,index)=>({key,item,index,id:mediaId(item)})))}
export function categoryCount(category){const frames=storyFrames(category.id);if(category.concepts)return `${category.keys.length} концепта · не изготовленные изделия`;return `${category.keys.length} ${countedNoun(category.keys.length,'проект','проекта','проектов')} · ${frames.length} ${countedNoun(frames.length,'кадр','кадра','кадров')}`}
export function storyRoute(category,key,id){
 const group=storyCategory(category);if(!group)return null;
 if(!group.keys.length)return '#stories/'+group.id+'/intro';
 return storyFrames(category).some(frame=>frame.key===key&&frame.id===id)?`#stories/${group.id}/${key}/${id}`:null;
}
export function parseStoryRoute(hash){
 if(typeof hash!=='string'||hash.length>220)return null;
 const match=/^#stories\/([a-z-]+)\/([a-zA-Z0-9-]+)(?:\/([a-z0-9-]+))?$/.exec(hash);if(!match)return null;
 const [_,category,key,id]=match,group=storyCategory(category);if(!group)return null;
 if(!group.keys.length)return key==='intro'&&!id?{category:group.id,key:null,id:null,index:0}:null;
 if(key==='intro'&&!id){const first=storyFrames(category)[0];return {category:group.id,key:first.key,id:first.id,index:0};}
 const index=storyFrames(category).findIndex(frame=>frame.key===key&&frame.id===id);
 return index<0?null:{category:group.id,key,id,index};
}
export function firstStoryRoute(id){const first=storyFrames(id)[0];return storyRoute(id,first?.key,first?.id)}
