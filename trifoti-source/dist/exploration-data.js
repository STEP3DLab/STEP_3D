import {projects} from './project-data.js?v=20261026-directions';
export const PUBLIC_SITE='https://step3dlab.github.io/STEP_3D/trifoti/';
export const caseKeys=Object.keys(projects);
// Asset basenames are permanent public media identifiers, not positional indexes.
export function mediaId(item){return item.src.split('/').pop().replace(/\.[^.]+$/,'')}
export function mediaIndex(key,id){return projects[key]?.media.findIndex(item=>mediaId(item)===id)??-1}
export function parseCaseRoute(hash){
 if(typeof hash!=='string'||hash.length>180)return null;
 const match=/^#project\/([a-zA-Z0-9-]+)(?:\/media\/([a-z0-9-]+))?$/.exec(hash);
 if(!match||!caseKeys.includes(match[1]))return null;
 return {key:match[1],media:match[2]&&mediaIndex(match[1],match[2])>=0?match[2]:null};
}
export function selectionIds(value){
 if(typeof value!=='string'||value.length>100)return [];
 return [...new Set(value.split(',').filter(id=>caseKeys.includes(id)))].slice(0,3);
}
export function selectionRoute(ids){return '#explore/'+selectionIds(ids.join(',')).join(',')}
export function selectionFromHash(hash){return hash.startsWith('#explore/')?selectionIds(hash.slice(9)):null}
export function exactLink(key,id){
 if(!caseKeys.includes(key))return PUBLIC_SITE+'#projects';
 return PUBLIC_SITE+'#project/'+key+(id&&mediaIndex(key,id)>=0?'/media/'+id:'');
}
export const relatedWorks={
 'feather-award':[], 'vmeste-prize':[], 'two-figure-composition':[],
 mascot:[{key:'pink',reason:'Два персонажа: характер выражен через силуэт и мимику.'}],
 pink:[{key:'mascot',reason:'Два персонажа: характер выражен через силуэт и мимику.'}],
 stdAwards:[{key:'rto-traveling-cup',reason:'Скульптурные награды: форма предмета и его вручение.'}],
 'rto-traveling-cup':[{key:'stdAwards',reason:'Скульптурные награды: форма предмета и его вручение.'}],
 restoration:[{key:'gesture',reason:'Внимание к пластике фигур, жестам и деталям формы.'}],
 gesture:[{key:'restoration',reason:'Внимание к пластике фигур, жестам и деталям формы.'}]
};
export const thematicRoutes=[
 {id:'character',title:'Характер персонажа',description:'Силуэт и мимика двух персонажей. Не хронология изготовления.',frames:[['mascot','white-front'],['mascot','red-head'],['pink','pink-side']]},
 {id:'award',title:'Награда как объект',description:'Предмет и церемония в двух наградных проектах из портфолио STEP_3D.',frames:[['stdAwards','award-series'],['stdAwards','award-ceremony'],['rto-traveling-cup','trophy'],['rto-traveling-cup','ceremony']]},
 {id:'form',title:'Внимание к форме',description:'Разные скульптурные задачи: силуэт персонажа, модель композиции и пластика жеста.',frames:[['mascot','white-side'],['restoration','model-angle'],['gesture','gesture-turntable']]}
];
export function technicalNotes(project){return project.sections?.find(section=>section.title==='Изготовление')?.text||'Технология изготовления в этом кейсе не уточнена.'}

export function countedNoun(count,one,few,many){
 const n=Math.abs(count)%100,last=n%10;
 return n>=11&&n<=14?many:last===1?one:last>=2&&last<=4?few:many;
}
