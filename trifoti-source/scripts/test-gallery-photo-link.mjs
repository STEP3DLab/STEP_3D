import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {projects} from '../dist/project-data.js';
import {updateGalleryPhotoLink} from '../dist/gallery-photo-link.js';
const file=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
function fixture(){
 const attrs=new Map(),link={hidden:true,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)};
 const document={activeElement:null},viewer={focus(options){assert.equal(options.preventScroll,true);document.activeElement=viewer}};
 return{link,attrs,document,viewer,update(item){updateGalleryPhotoLink({item,link,viewer,document})}};
}
test('All 23 existing photographs link to their real original, not a thumbnail',()=>{
 const f=fixture();let count=0;
 for(const project of Object.values(projects))for(const item of project.media){
  f.update(item);
  if(item.type==='video'){assert.equal(f.link.hidden,true);assert.equal(f.attrs.has('href'),false);continue}
  count++;assert.equal(f.link.hidden,false);assert.equal(f.attrs.get('href'),item.src);
  assert(existsSync(new URL('../dist/'+f.attrs.get('href'),import.meta.url)));
  assert.equal(f.attrs.get('aria-label'),`Открыть фото крупно в новой вкладке: ${item.caption}`);
 }
 assert.equal(count,23);
});
test('Changing photographs replaces the destination without changing media data or focus',()=>{
 const f=fixture(),items=projects.restoration.media,original=JSON.stringify(items);f.document.activeElement=f.link;
 for(const item of [items[0],items[5],items[1],items[0]]){f.update(item);assert.equal(f.attrs.get('href'),item.src);assert.equal(f.document.activeElement,f.link)}
 assert.equal(JSON.stringify(items),original);
});
test('Switching to video clears the old photo destination and preserves a visible focus target',()=>{
 const f=fixture();f.update(projects.mascot.media[0]);f.document.activeElement=f.link;
 f.update(projects.mascot.media[9]);assert.equal(f.link.hidden,true);assert.equal(f.attrs.has('href'),false);assert.equal(f.attrs.has('aria-label'),false);assert.equal(f.document.activeElement,f.viewer);
 f.update(projects.mascot.media[8]);assert.equal(f.link.hidden,false);assert.equal(f.document.activeElement,f.viewer);
});
test('Video does not steal focus from the active thumbnail or native video control',()=>{
 const f=fixture(),elsewhere={};f.document.activeElement=elsewhere;f.update(projects.gesture.media[0]);assert.equal(f.document.activeElement,elsewhere);
});
test('Only known local image paths may become destinations',()=>{
 for(const src of ['https://example.com/image.webp','//example.com/image.webp','javascript:alert(1)','data:image/png;base64,x','assets/projects/../private.png','assets/projects/foo.mp4','assets/previews/foo.webp',null,undefined]){
  const f=fixture();f.update(projects.mascot.media[0]);f.update({src,caption:'test'});assert.equal(f.link.hidden,true);assert.equal(f.attrs.has('href'),false);
 }
});
test('Native action warns visibly about the new tab and has safe target semantics',()=>{
 const app=file('app.js');
 assert.match(app,/<a class="gallery-photo-link" id="gallery-photo-link" target="_blank" rel="noopener noreferrer" hidden>Открыть фото крупно <span>в новой вкладке<\/span><\/a>/);
 assert.match(app,/updateGalleryPhotoLink\(\{item,link:\$\('#gallery-photo-link'\),viewer,document\}\)/);
 assert.match(app,/gallery-photo-link\.js\?v=20261024-photo-details/);
 assert.doesNotMatch(file('gallery-photo-link.js'),/window\.open|fetch\(|localStorage|sessionStorage|innerHTML|addEventListener|history\.|location\./);
 assert.match(file('style.css'),/\.gallery-photo-link\{[^}]*min-height:44px/);
 assert.match(file('style.css'),/\.gallery-photo-link\[hidden\]\{display:none\}/);
 assert.doesNotMatch(file('style.css'),/touch-action:none/);
 assert.match(file('index.html'),/style\.css\?v=20261024-brief-tools/);
 assert.match(file('index.html'),/app\.js\?v=20261024-brief-tools/);
});
