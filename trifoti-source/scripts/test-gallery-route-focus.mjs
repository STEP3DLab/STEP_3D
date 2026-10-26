import {mountRelated} from '../dist/exploration-panel.js';
import {mediaIndex} from '../dist/exploration-data.js';
import {createFrameMemory,thumbnailKey,mountPhotoSwipe} from '../dist/gallery-interactions.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {projects} from '../dist/project-data.js';
import {createProjectNavigation,projectLink} from '../dist/project-navigation.js';
import {mountCaseSections} from '../dist/case-sections.js';
import {mountGalleryChapters} from '../dist/gallery-chapters.js';
import {galleryArrow} from '../dist/dialog-controls.js';

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const render=app.slice(app.indexOf('function openProject(key,routeMedia){'),app.indexOf('\nconst caseNavigation='));

// Execute the actual renderer. This small DOM model explicitly simulates the
// browser dropping focus to BODY when innerHTML removes its active descendant.
// Native focus/Tab/media behavior is checked separately in browser QA.
function fixture(){
 const nodes=new Map(),focusCalls=[],document={activeElement:null};let shows=0,renders=0,slides=0;
 function node(id=''){
  return{id,children:[],parent:null,hidden:false,handlers:{},scrollTop:0,
   replaceChildren(...children){this.children=[];this.append(...children)},
   append(...children){for(const child of children){child.parent=this;this.children.push(child)}},
   prepend(child){child.parent=this;this.children.unshift(child)},
   contains(other){for(let current=other;current;current=current.parent)if(current===this)return true;return false},
   setAttribute(){},addEventListener(type,handler){this.handlers[type]=handler},
   closest(){return null},focus(options){document.activeElement=this;focusCalls.push({node:this,options})},
  };
 }
 const body=node('body'),external=node('outside'),dialog=node('dialog'),host=node('project-content'),close=node('fixed-close'),contextTitle=node('project-dialog-context');
 body.append(external);body.append(dialog);dialog.append(close);dialog.append(host);
 document.activeElement=external;document.createElement=()=>node();
 dialog.open=false;dialog.showModal=()=>{shows++;dialog.open=true;close.focus()};
 nodes.set('project-content',host);nodes.set('project-dialog-context',contextTitle);
 Object.defineProperty(host,'innerHTML',{set(markup){
  renders++;
  if(document.activeElement!==host&&host.contains(document.activeElement))document.activeElement=body;
  host.children.forEach(child=>child.parent=null);host.children=[];
  nodes.clear();nodes.set('project-content',host);nodes.set('project-dialog-context',contextTitle);
  const gallery=node('case-gallery');host.append(gallery);nodes.set('case-gallery',gallery);
  const copy=node('case-copy');host.append(copy);nodes.set('case-copy',copy);
  for(const match of markup.matchAll(/id="([^"]+)"/g)){const element=node(match[1]);host.append(element);nodes.set(element.id,element)}
 }});
 const location={href:'https://example.test/trifoti/#projects',hash:'#projects'},entries=[{hash:location.hash,state:null}];let index=0,nav;
 const move=step=>{if(index+step<0||index+step>=entries.length)return;index+=step;location.hash=entries[index].hash;nav.sync();nav.sync()};
 const history={get state(){return entries[index].state},get length(){return entries.length},
  pushState(state,_,hash){entries.splice(++index);entries.push({state,hash});location.hash=hash},
  replaceState(state,_,hash){entries[index]={state,hash};location.hash=hash},back(){move(-1)},forward(){move(1)}};
 const context={photoDetail:null,exploration:null,unbindCaseSelection(){},mountPhotoDetail(){return {destroy(){},key(){return false}}},mountRelated,mediaIndex,window:{},$$:()=>[],clearMediaWait:()=>{},frameMemory:createFrameMemory(),thumbnailKey,mountPhotoSwipe,mountCaseSections,mountGalleryChapters,updateGalleryChapters:()=>{},projects,projectDialog:dialog,document,galleryProject:null,galleryIndex:0,galleryArrow,projectLink,location,
  $:selector=>selector==='[data-close="project-dialog"]'?close:nodes.get(selector.slice(1)),
  thumbnailSource:item=>item.src,showSlide(value){slides++;context.galleryIndex=value},
 };
 vm.createContext(context);vm.runInContext(render,context);
 vm.runInContext(app.split('\n').find(line=>line.startsWith("projectDialog.addEventListener('keydown'")),context);
 nav=createProjectNavigation({keys:Object.keys(projects),location,history,onOpen:context.openProject,onClose:()=>{dialog.open=false}});
 context.caseNavigation=nav;
 const direct=key=>{history.pushState(null,'','#project/'+key);nav.sync();nav.sync()};
 return{context,document,dialog,host,close,body,external,nodes,focusCalls,direct,history,nav,location,
  get shows(){return shows},get renders(){return renders},get slides(){return slides},
  focusOld(id){const element=id==='nested-control'?node(id):nodes.get(id);if(id==='nested-control')nodes.get('gallery-viewer').append(element);element.focus();focusCalls.length=0;return element},
 };
}

for(const key of Object.keys(projects))test(`Replacing focused case content safely enters permanent Close: ${key}`,()=>{
 for(const id of ['gallery-next','gallery-prev','case-share','case-share-url','gallery-viewer','nested-control']){
  const f=fixture();f.direct('mascot');const old=f.focusOld(id);f.host.scrollTop=450;f.dialog.scrollTop=12;
  f.direct(key==='mascot'?'pink':key);if(key==='mascot'){f.focusOld(id);f.history.back()}
  assert.equal(f.document.activeElement,f.close);assert.equal(f.host.contains(old),false);
  assert.equal(f.focusCalls.length,1);assert.equal(f.focusCalls[0].options.preventScroll,true);
  assert.equal(f.nodes.get('case-title').textContent,projects[key].title);
  assert.equal(f.shows,1);assert.equal(f.host.scrollTop,0);assert.equal(f.dialog.scrollTop,0);
  assert.equal(f.nodes.get('gallery-next').hidden,projects[key].media.length===1);
  assert.equal(f.nodes.get('gallery-thumbnails').children.length,projects[key].media.length>1?projects[key].media.length:0);
 }
});

for(const target of ['close','host','dialog','body','external'])test(`Replacement leaves surviving/outside focus untouched: ${target}`,()=>{
 const f=fixture();f.direct('pink');f[target].focus();f.focusCalls.length=0;f.direct('gesture');
 assert.equal(f.document.activeElement,f[target]);assert.equal(f.focusCalls.length,0);assert.equal(f.shows,1);
});

test('First opening still delegates initial focus to native showModal exactly once',()=>{
 const f=fixture();f.direct('gesture');
 assert.equal(f.document.activeElement,f.close);assert.equal(f.shows,1);assert.equal(f.focusCalls.length,1);
 assert.equal(f.focusCalls[0].options,undefined);
});

test('Back and Forward recover removed focus without adding history or disabling plain arrows',()=>{
 const f=fixture();f.direct('mascot');f.direct('pink');f.focusOld('gallery-next');
 f.history.back();assert.equal(f.location.hash,'#project/mascot');assert.equal(f.document.activeElement,f.close);
 const before=f.slides;let prevented=false;
 f.dialog.handlers.keydown({key:'ArrowRight',target:f.close,preventDefault(){prevented=true}});
 assert.equal(prevented,true);assert.equal(f.slides,before+1);assert.equal(f.context.galleryIndex,1);
 f.focusOld('gallery-prev');f.history.forward();
 assert.equal(f.location.hash,'#project/pink');assert.equal(f.document.activeElement,f.close);
 assert.equal(f.history.length,3);assert.equal(f.shows,1);assert.equal(f.renders,4);
 const calls=f.focusCalls.length;f.nav.sync();f.nav.sync();
 assert.equal(f.renders,4);assert.equal(f.focusCalls.length,calls);
});

test('App-owned route replacement and same-case repetitions preserve navigation semantics',()=>{
 const f=fixture();f.nav.open('pink');f.focusOld('case-share-url');f.nav.open('rto-traveling-cup');
 assert.equal(f.document.activeElement,f.close);assert.equal(f.history.length,3);
 const renders=f.renders,calls=f.focusCalls.length;f.nav.open('rto-traveling-cup');
 assert.equal(f.history.length,3);assert.equal(f.renders,renders);assert.equal(f.focusCalls.length,calls);
 assert.equal(f.nav.closed(),'back');assert.equal(f.location.hash,'#project/pink');
});

test('No focus change occurs on a non-case route, and a later opening remains native',()=>{
 const f=fixture();f.direct('pink');f.close.focus();f.focusCalls.length=0;
 f.history.pushState(null,'','#contact');f.nav.sync();
 assert.equal(f.dialog.open,false);assert.equal(f.focusCalls.length,0);
 f.direct('stdAwards');assert.equal(f.shows,2);assert.equal(f.document.activeElement,f.close);
});

test('Actual adjacent controls replace case route and leave focus on visible fixed Close',()=>{
 const f=fixture();f.nav.open('mascot');const first=f.nodes.get('case-next');first.focus();first.handlers.click();
 const keys=Object.keys(projects),next=keys[(keys.indexOf('mascot')+1)%keys.length];
 assert.equal(f.location.hash,'#project/'+next);assert.equal(f.history.length,2);
 assert.equal(f.nodes.get('case-title').textContent,projects[next].title);
 assert.equal(f.document.activeElement,f.close);
 assert.equal(f.nodes.get('case-share-url').value,projectLink(f.location.href,next));
 f.nodes.get('case-prev').handlers.click();assert.equal(f.location.hash,'#project/mascot');
 assert.equal(f.document.activeElement,f.close);
});
test('Actual renderer recalls per-case frame and thumbnail arrows consume global navigation',()=>{
 const f=fixture();f.context.frameMemory.remember('mascot',8);f.nav.open('mascot');assert.equal(f.context.galleryIndex,8);
 const thumb=f.nodes.get('gallery-thumbnails').children[8];
 const event={key:'ArrowRight',target:thumb,preventDefault(){this.defaultPrevented=true}};
 const before=f.slides;thumb.handlers.keydown(event);f.dialog.handlers.keydown(event);
 assert.equal(f.slides,before+1);assert.equal(f.context.galleryIndex,9);
 assert.equal(f.document.activeElement,f.nodes.get('gallery-thumbnails').children[9]);
 f.nav.switchCase('pink');assert.equal(f.context.galleryIndex,0);
 f.nav.switchCase('mascot');assert.equal(f.context.galleryIndex,8);
});

test('Adjacent case handlers do not restore focus to controls below the reset viewport',()=>{
 assert.match(app,/button.addEventListener\('click',\(\)=>caseNavigation.switchCase\(nextKey\)\)/);
 assert.doesNotMatch(app,/switchCase\(nextKey\);\$\('#'\+id\).focus/);
});
