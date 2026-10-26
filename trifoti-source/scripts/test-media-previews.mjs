import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {projects} from '../dist/project-data.js';
import {thumbnailSource} from '../dist/media-utils.js';
const dist = new URL('../dist/', import.meta.url);
const items = Object.values(projects).filter(project => project.media.length > 1).flatMap(project => project.media);
const file = path => readFileSync(new URL(path, dist));
const size = path => statSync(new URL(path, dist)).size;
const app = file('app.js').toString();
const webpSize = bytes => {
  assert.equal(bytes.toString('ascii',0,4),'RIFF'); assert.equal(bytes.toString('ascii',8,12),'WEBP');
  // Pillow's RGB lossy previews are ordinary VP8 WebP frames.
  assert.equal(bytes.toString('ascii',12,16),'VP8 ');
  assert.equal(bytes.subarray(23,26).toString('hex'),'9d012a');
  return [bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff];
};

test('Every multi-item case has a real, dimensioned lightweight preview for every slide', () => {
  assert.equal(items.length, 27);
  for (const item of items) {
    const preview = thumbnailSource(item);
    assert(preview.startsWith('assets/previews/')); assert(preview.endsWith('-thumb.webp'));
    assert.deepEqual(webpSize(file(preview)), [180,200]);
    assert(size(preview) < size(item.poster || item.src));
  }
});
test('Preview bytes are at least 85% below the original preview source total', () => {
  const original = items.reduce((sum,item)=>sum+size(item.poster || item.src),0);
  const previews = items.reduce((sum,item)=>sum+size(thumbnailSource(item)),0);
  assert(previews < original * .15);
  console.log(`Gallery preview sources: ${original.toLocaleString('en-US')} → ${previews.toLocaleString('en-US')} bytes (${(100*(1-previews/original)).toFixed(1)}% smaller).`);
});
test('Video previews use their actual posters, never the video file', () => {
  const video = projects.mascot.media.find(item=>item.type==='video');
  assert.equal(thumbnailSource(video),'assets/previews/bear/clay-poster-thumb.webp');
});
test('The main gallery still uses original files; single-item cases do not build hidden thumbnails', () => {
  assert(app.includes('media.src=item.src;viewer.append(media)'));
  assert(app.includes('media.poster=item.poster;media.controls=true'));
  assert(app.includes("media.preload='metadata'"));
  assert(app.includes('if(p.media.length>1)p.media.forEach'));
  assert(app.includes('img.src=thumbnailSource(item);img.width=180;img.height=200;'));
});
test('Portfolio and journal images stay lazy while original project sources remain unchanged', () => {
  const html=file('index.html').toString();
  assert.equal((html.match(/class="project-card/g)||[]).length,Object.keys(projects).length);
  for (const project of Object.values(projects)) for(const item of project.media) {
    assert(item.src.startsWith('assets/projects/')); assert(!item.src.includes('/previews/'));
  }
  const cards=html.match(/<img src="assets\/projects\/[^>]+>/g);
  assert.equal(cards.length,Object.keys(projects).length+5);
  for(const image of cards) assert(image.includes('loading="lazy"'));
});


test('All single-frame lightweight posters are real full-frame derivatives with preserved source hashes',()=>{
 const data=JSON.parse(readFileSync(new URL('./design-audit-poster-measurements.json',import.meta.url),'utf8'));
 assert.equal(data.rows.length,3);assert.deepEqual(new Set(data.rows.map(row=>row.key)),new Set(Object.entries(projects).filter(([,p])=>p.media.length===1).map(([key])=>key)));
 for(const row of data.rows){const item=projects[row.key].media[0];assert.equal(row.source,item.poster||item.src);assert.equal(row.preview,thumbnailSource(item));assert.equal(size(row.source),row.source_bytes);assert.equal(size(row.preview),row.preview_bytes);assert.deepEqual(webpSize(file(row.preview)),[180,200]);for(const kind of ['source','preview'])assert.equal(createHash('sha256').update(file(row[kind])).digest('hex'),row[kind+'_sha256']);assert(row.preview_bytes<row.source_bytes*.25)}
 const sum=key=>data.rows.reduce((n,row)=>n+row[key],0);assert.equal(sum('source_bytes'),451379);assert.equal(sum('preview_bytes'),10910);assert(sum('preview_bytes')<sum('source_bytes')*.025);
 const builder=readFileSync(new URL('./make-media-previews.py',import.meta.url),'utf8');assert.match(builder,/ImageOps.pad/);assert.match(builder,/if len\(project\['media'\]\) < 2 or source.endswith\('\.jpg'\)/);
});
