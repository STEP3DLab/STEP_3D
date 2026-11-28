import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projects} from '../dist/project-data.js';
import {visualStories,storyMedia,atlasFrames,atlasPreview,mountVisualStories} from '../dist/visual-stories.js';
import {mediaId} from '../dist/exploration-data.js';
import {thumbnailSource} from '../dist/media-utils.js';
function fixture(){const all=[],opened=[];const document={createElement(tag){const n={tag,children:[],listeners:{},textContent:'',open:false,append(...nodes){this.children.push(...nodes)},replaceChildren(...nodes){this.children=nodes},setAttribute(key,value){this[key]=value},addEventListener(key,fn){this.listeners[key]=fn}};all.push(n);return n}};const host=document.createElement('section');mountVisualStories({host,document,onOpen:(...a)=>opened.push(a)});return{all,host,opened,expand(index){const detail=all.filter(n=>n.tag==='details')[index];detail.open=true;detail.listeners.toggle();return detail},find(text){return all.find(n=>n.textContent===text)}}}
test('Four visual stories resolve only existing media with separate object/model groups',()=>{assert.equal(visualStories.length,4);for(const story of visualStories)for(const group of story.groups)for(const id of group.ids)assert(storyMedia(story.key,id));assert.deepEqual(visualStories[1].groups[1].ids,['model-front','model-angle']);assert.match(visualStories[1].note,/не обозначают/);assert.match(visualStories[2].note,/у доски/);assert.match(visualStories[3].note,/не обозначает состав одного театра/)});
test('Atlas includes every real media item once:23photos2videos; valid preview exists',()=>{assert.equal(atlasFrames().length,Object.values(projects).flatMap(p=>p.media).length);assert.equal(atlasFrames('all','photo').length,28);assert.equal(atlasFrames('all','video').length,2);assert.equal(atlasFrames('gesture','photo').length,0);assert.equal(atlasFrames('missing').length,0);for(const {key,item} of atlasFrames()){assert(projects[key].media.some(existing=>existing.src===item.src));assert(fs.existsSync(new URL('../dist/'+atlasPreview(key,item),import.meta.url)))}});
test('All stories and atlas defer image creation until explicit expansion; reopen does not duplicate',()=>{const f=fixture();assert.equal(f.all.filter(n=>n.tag==='img').length,0);assert.equal(f.all.filter(n=>n.tag==='details').length,5);const d=f.expand(0);assert.equal(f.all.filter(n=>n.tag==='img').length,2);const count=f.all.length;d.listeners.toggle();assert.equal(f.all.length,count);assert.equal(f.all.filter(n=>n.tag==='video').length,0)});
test('Bear paired controls independent and opening targets exact currentframe',()=>{const f=fixture();f.expand(0);const imgs=f.all.filter(n=>n.tag==='img');const red=imgs[1].src;f.all.find(n=>n['aria-label']==='Следующий кадр: Белое исполнение').listeners.click();assert.equal(imgs[0].src,storyMedia('mascot','white-front').src);assert.equal(imgs[1].src,red);const link=f.all.filter(n=>n.tag==='a'&&n.href?.endsWith('/media/white-front')).at(-1);let prevented=false;link.listeners.click({button:0,preventDefault(){prevented=true}});assert(prevented);assert.deepEqual(f.opened[0].slice(0,2),['mascot','white-front']);link.listeners.click({button:0,ctrlKey:true});assert.equal(f.opened.length,1)});
test('Story wraps manually and preserves confirmed attribution/source links',()=>{const f=fixture();f.expand(2);const prev=f.all.find(n=>n['aria-label']==='Предыдущий кадр: Рассказ в трёх фотографиях');prev.listeners.click();assert.equal(f.all.find(n=>n.tag==='img').src,storyMedia('stdAwards','award-ceremony').src);assert(f.find(projects.stdAwards.attribution));for(const source of projects.stdAwards.sources)assert(f.all.some(n=>n.href===source.url&&n.rel==='noopener noreferrer'))});
test('Atlas filters by project and type without removing active select, handles empty results',()=>{const f=fixture();f.expand(4);const selects=f.all.filter(n=>n.tag==='select'),grid=f.all.find(n=>n.className==='visual-atlas-grid');assert.equal(grid.children.length,Object.values(projects).flatMap(p=>p.media).length);selects[0].value='gesture';selects[1].value='photo';selects[1].listeners.change();assert.equal(grid.children.length,1);assert.match(grid.children[0].textContent,/нет материалов/);selects[1].value='video';selects[1].listeners.change();assert.equal(grid.children.length,1);assert.equal(f.all.filter(n=>n.tag==='select')[0],selects[0]);assert(f.all.some(n=>n.textContent==='Видео · '+projects.gesture.title));assert.equal(f.all.filter(n=>n.tag==='video').length,0)});
test('Responsive story frames use real derivatives and retain the original as fallback',()=>{
 const f=fixture();f.expand(1);
 const [object,model]=f.all.filter(n=>n.tag==='img');
 const initial=storyMedia('restoration','initial').src;
 assert.equal(object.src,initial);
 assert.match(object.sizes,/^auto, /);
 assert.equal(object.srcset,'assets/responsive/restoration/initial-480.webp 480w, assets/responsive/restoration/initial-800.webp 800w, '+initial+' 960w');
 assert.equal(model.srcset,'');
 f.all.find(n=>n['aria-label']==='Следующий кадр: Скульптурная модель').listeners.click();
 assert.match(model.srcset,/model-angle-800\.webp 800w/);
 for(const img of [object,model])for(const source of img.srcset.split(', ')){
  assert(fs.existsSync(new URL('../dist/'+source.split(' ')[0],import.meta.url)));
 }
 f.all.find(n=>n['aria-label']==='Следующий кадр: Скульптурная модель').listeners.click();
 assert.equal(model.srcset,'');
 assert.equal(model.src,storyMedia('restoration','model-front').src);
});
test('Visual presentation introduces no storage,networkdata,autoplay,HTMLinjection or generated media',()=>{const source=fs.readFileSync(new URL('../dist/visual-stories.js',import.meta.url),'utf8');for(const pattern of [/localStorage/,/sessionStorage/,/fetch\(/,/sendBeacon/,/innerHTML/,/\.play\(/,/setInterval/])assert.doesNotMatch(source,pattern)});

test('Single-photo atlas cards use lighter full-image previews with unchanged exact gallery targets',()=>{
 const f=fixture();f.expand(4);
 for(const key of ['vmeste-prize','two-figure-composition']){
  const [item]=projects[key].media;
  const source='assets/responsive/'+key+'/'+key+'-480.webp';
  assert.equal(atlasPreview(key,item),source);
  assert(fs.statSync(new URL('../dist/'+source,import.meta.url)).size<fs.statSync(new URL('../dist/'+item.src,import.meta.url)).size);
  assert(f.all.some(n=>n.tag==='img'&&n.src===source&&n.alt===item.caption));
  const link=f.all.find(n=>n.tag==='a'&&n.children.some(img=>img.src===source));
  assert.match(link.href,new RegExp('/'+key+'/media/'));
  link.listeners.click({button:0,preventDefault(){}});
  assert.deepEqual(f.opened.at(-1).slice(0,2),[key,mediaId(item)]);
 }
});
