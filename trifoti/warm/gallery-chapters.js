// Navigation landmarks, not a claimed production timeline. Media order stays intact.
const bearChapters=[
 {label:'Эскиз',index:8,indices:[8]},
 {label:'Форма',index:9,indices:[9]},
 {label:'Цвет',index:0,indices:[0,1,2,3,4,5,6,7]}
];
export function chaptersFor(key){return key==='mascot'?bearChapters:[]}
export function activeChapter(key,index){return chaptersFor(key).findIndex(chapter=>chapter.indices.includes(index))}
export function mountGalleryChapters({key,host,document,onSelect}){
 const chapters=chaptersFor(key);
 if(!chapters.length)return()=>{};
 const group=document.createElement('div');group.className='gallery-chapters';
 group.setAttribute('role','group');group.setAttribute('aria-label','Исследуйте характер медведя');
 const heading=document.createElement('p');heading.className='gallery-chapters-title';heading.textContent='Исследуйте характер';group.append(heading);
 const controls=document.createElement('div');controls.className='gallery-chapters-controls';
 const buttons=chapters.map(chapter=>{
  const button=document.createElement('button');button.type='button';button.textContent=chapter.label;
  button.setAttribute('aria-controls','gallery-viewer');button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>onSelect(chapter.index));controls.append(button);return button;
 });
 group.append(controls);host.prepend(group);
 return index=>{const active=activeChapter(key,index);buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===active)))};
}
