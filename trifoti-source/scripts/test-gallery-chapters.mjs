import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chaptersFor,activeChapter,mountGalleryChapters} from '../dist/gallery-chapters.js';
import {projects} from '../dist/project-data.js';
const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const module=readFileSync(new URL('../dist/gallery-chapters.js',import.meta.url),'utf8');
test('Bear chapters point only to existing verified materials without reordering media',()=>{
 assert.deepEqual(chaptersFor('mascot').map(({label,index})=>[label,index]),[['Эскиз',8],['Форма',9],['Цвет',0]]);
 const media=projects.mascot.media;assert.equal(media.length,10);
 assert.match(media[8].src,/sketch.webp$/);assert.match(media[9].src,/clay-turntable.mp4$/);assert.equal(media[9].type,'video');assert.match(media[0].src,/white-front.webp$/);
 assert.deepEqual(chaptersFor('mascot').flatMap(c=>c.indices).sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8,9]);
 for(const key of Object.keys(projects).filter(k=>k!=='mascot'))assert.deepEqual(chaptersFor(key),[]);
 assert.deepEqual(chaptersFor('unknown'),[]);
});
test('Every next/previous/thumbnail slide maps to one active chapter',()=>{
 for(let i=0;i<10;i++)assert.equal(activeChapter('mascot',i),i===8?0:i===9?1:2);
 assert.equal(activeChapter('pink',0),-1);assert.equal(activeChapter('mascot',-1),-1);
});
function element(tag){return{tag,children:[],attributes:{},handlers:{},append(child){this.children.push(child)},prepend(child){this.children.unshift(child)},setAttribute(name,value){this.attributes[name]=value},addEventListener(name,fn){this.handlers[name]=fn}}}
test('Native buttons jump without replacing focused controls and keep aria state synchronized',()=>{
 const host=element('div'),viewer=element('div');host.append(viewer);const selected=[];
 const update=mountGalleryChapters({key:'mascot',host,document:{createElement:element},onSelect:index=>selected.push(index)});
 const group=host.children[0],buttons=group.children[1].children;
 assert.equal(host.children[1],viewer);assert.equal(group.attributes.role,'group');assert.equal(buttons.length,3);
 for(const b of buttons){assert.equal(b.tag,'button');assert.equal(b.type,'button');assert.equal(b.attributes['aria-controls'],'gallery-viewer')}
 for(const index of [0,8,9,7,8,0]){update(index);assert.deepEqual(buttons.map(b=>b.attributes['aria-pressed']),[0,1,2].map(i=>String(i===activeChapter('mascot',index))))}
 buttons.forEach(b=>b.handlers.click());assert.deepEqual(selected,[8,9,0]);assert.equal(group.children[1].children[0],buttons[0]);
});
test('Other cases mount no controls and receive a harmless updater',()=>{
 const host=element('div');const update=mountGalleryChapters({key:'pink',host,document:{createElement(){throw Error('unexpected creation')}},onSelect(){throw Error('unexpected select')}});
 update(0);assert.equal(host.children.length,0);
});
test('Integration retains gallery controls, pauses replaced video and never starts autoplay',()=>{
 assert.match(app,/onSelect:showSlide/);assert.match(app,/updateGalleryChapters\(galleryIndex\)/);
 assert.match(app,/showSlide\(routeMedia\?mediaIndex\(key,routeMedia\):frameMemory.recall\(key,p.media.length\),false,false\);if\(!projectDialog.open\)/);
 assert.match(app,/\$\$\('video',viewer\).forEach\(video=>video.pause\(\)\);viewer.replaceChildren\(\)/);
 assert.match(app,/media.controls=true;media.muted=true;media.playsInline=true;media.preload='metadata'/);
 assert.doesNotMatch(module,/\.play\(|autoplay|setInterval|\.focus\(|scrollIntoView|keydown|tabindex/);
 assert.match(app,/keepDialogFocus\(dialog\)/);
});
test('Chapter targets reflow, show focus and have no motion requirements',()=>{
 assert.match(css,/\.gallery-chapters-controls\{display:flex;flex-wrap:wrap;gap:8px\}/);
 assert.match(css,/\.gallery-chapters-controls button\{min-height:44px;min-width:64px/);
 assert.match(css,/\.gallery-chapters-controls button:focus-visible\{outline:2px solid var\(--ink\);outline-offset:3px\}/);
 const chapterCSS=css.split('/* Small explicit chapter')[1].split('/* Context first')[0];assert.doesNotMatch(chapterCSS,/animation|transition|overflow:hidden|position:fixed/);
});
