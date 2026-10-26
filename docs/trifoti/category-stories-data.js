import {projects} from './project-data.js?v=20261026-directions';
import {mediaId,countedNoun} from './exploration-data.js?v=20261026-directions';

// Directions are stable public route IDs; membership and counts come from cases.
export const storyCategories=[
 {id:'interiors',title:'Дизайн интерьеров',service:'service-design',intro:'Дизайн интерьеров — от общего образа пространства до его деталей.'},
 {id:'sculpture',title:'Скульптура',service:'service-sculpture',cover:'mascot'},
 {id:'awards',title:'Сувениры и призы',service:'service-awards',cover:'stdAwards'},
 {id:'modelmaking',title:'Макетирование',service:'service-everyday',intro:'Макеты помогают представить идею в объёме. Начинаем с задачи, масштаба и нужной степени детализации.'}
].map(category=>({...category,keys:Object.keys(projects).filter(key=>projects[key].direction===category.title)}));
export const categoryAliases=Object.freeze({design:'interiors',everyday:'modelmaking'});
export const storyCategory=id=>storyCategories.find(category=>category.id===(categoryAliases[id]||id));
export function storyFrames(id){return (storyCategory(id)?.keys||[]).flatMap(key=>projects[key].media.map((item,index)=>({key,item,index,id:mediaId(item)})))}
export function categoryCount(category){const frames=storyFrames(category.id);return `${category.keys.length} ${countedNoun(category.keys.length,'проект','проекта','проектов')} · ${frames.length} ${countedNoun(frames.length,'кадр','кадра','кадров')}`}
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
 const index=storyFrames(category).findIndex(frame=>frame.key===key&&frame.id===id);
 return index<0?null:{category:group.id,key,id,index};
}
export function firstStoryRoute(id){const first=storyFrames(id)[0];return storyRoute(id,first?.key,first?.id)}
