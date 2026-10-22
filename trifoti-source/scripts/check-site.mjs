import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {projects} from '../dist/project-data.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dist=resolve(root,'dist');
const html=readFileSync(resolve(dist,'index.html'),'utf8');
const css=readFileSync(resolve(dist,'style.css'),'utf8');
const app=readFileSync(resolve(dist,'app.js'),'utf8');
for(const [,url] of app.matchAll(/(?:from\s*|import\s*\()['\"]([^'\"]+)['\"]/g))assert(existsSync(resolve(dist,url.split(/[?#]/)[0])),`Missing module ${url}`);
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'All HTML IDs must be unique');
for(const [,url] of html.matchAll(/\b(?:src|href|poster)="([^"]+)"/g)){
 if(url.startsWith('#project/'))assert(Object.hasOwn(projects,url.slice('#project/'.length)),`Missing case route ${url}`);
 else if(url.startsWith('#'))assert(ids.includes(url.slice(1)),`Missing anchor ${url}`);
 else if(!/^(?:https?:|data:)/.test(url))assert(existsSync(resolve(dist,url.split(/[?#]/)[0])),`Missing file ${url}`);
}
for(const [,url] of css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))assert(existsSync(resolve(dist,url)),`Missing style asset ${url}`);
let photos=0,videos=0;
for(const [key,project] of Object.entries(projects)){
 assert(project.title&&project.description&&project.media.length,`Incomplete case ${key}`);
 assert(html.includes(`data-project="${key}"`),`Case card missing ${key}`);
 for(const item of project.media){
  assert(item.caption,`Media caption missing in ${key}`);
  assert(existsSync(resolve(dist,item.src)),`Media file missing ${item.src}`);
  if(item.type==='video'){videos++;assert(item.poster&&existsSync(resolve(dist,item.poster)),'Video poster missing')}
  else photos++;
 }
}
assert.equal(Object.keys(projects).length,6);assert.equal(photos,23);assert.equal(videos,2);
assert(projects.stdAwards.attribution.includes('Технопарка РГСУ'));
assert.equal(projects.stdAwards.media.length,3);
assert.equal(projects.stdAwards.sources.length,2);
assert(projects.stdAwards.sources.every(source=>new URL(source.url).protocol==='https:'));
assert(html.includes('data-filter="awards"'));
assert(html.includes('aria-describedby="bear-keyboard-help"'));assert(ids.includes('bear-keyboard-help'));assert(html.includes('aria-controls="bear-video bear-gif"'));
assert(html.includes('aria-labelledby="case-title"'));assert(html.includes('aria-labelledby="review-title"'));
assert(html.includes('name="reference"'));assert(html.includes('не отправляется объединению'));
const brief=html.match(/<form id="brief-form">([\s\S]*?)<\/form>/)[1];
assert.deepEqual([...brief.matchAll(/\bname="([^"]+)"/g)].map(match=>match[1]).sort(),['budget','deadline','direction','idea','name','reference']);
assert(/<textarea id="brief-text" readonly/.test(brief),'Copy fallback must be readonly and have no storage field name');
assert(brief.includes('id="brief-draft-status" role="status"'));
assert(brief.includes('id="brief-text-fallback" hidden'));
const optimized=statSync(resolve(dist,'assets/logo.webp')).size,original=statSync(resolve(dist,'assets/logo.png')).size;
assert(optimized<original*.15,'Header logo should be at least 85% smaller');
console.log(`Passed: unique IDs, local links/assets, 6 cases, ${photos} photos, ${videos} videos, dialog labels, truthful local brief.`);
console.log(`Header logo: ${original} → ${optimized} bytes (${Math.round((1-optimized/original)*100)}% smaller). Original retained.`);
