import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('../dist/assets/fonts/',import.meta.url);
const read=name=>readFileSync(new URL(name,base));
const fingerprint=bytes=>createHash('sha256').update(bytes).digest('hex');
const report=JSON.parse(readFileSync(new URL('./font-integrity.json',import.meta.url)));
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const faces=[...css.matchAll(/@font-face\{([^}]+)\}/g)].map(m=>m[1]);
for(const font of report.fonts){
 test(`${font.family}: shipped source and WOFF2 match the fully audited fingerprints`,()=>{
  const source=read(font.family+'.ttf'),web=read(font.family+'.woff2');
  assert.equal(fingerprint(source),font.ttf_sha256);assert.equal(fingerprint(web),font.woff2_sha256);
  assert.equal(source.length,font.ttf_bytes);assert.equal(web.length,font.woff2_bytes);
  assert.equal(web.toString('ascii',0,4),'wOF2');assert.equal(web.readUInt32BE(4),source.readUInt32BE(0));
  assert.equal(web.readUInt32BE(8),web.length);assert.equal(web.readUInt16BE(12),source.readUInt16BE(4));
  assert.equal(web.readUInt16BE(14),0);assert(web.length<font.gzip_ttf_bytes);
 });
 test(`${font.family}: same variable family and weights use one local WOFF2 with swap`,()=>{
  const name=font.family[0].toUpperCase()+font.family.slice(1),face=faces.find(f=>f.startsWith('font-family:'+name+';'));
  assert(face);assert(face.includes(`src:url('assets/fonts/${font.family}.woff2') format('woff2');`));
  assert(face.includes(`font-weight:${font.axes[0][1]} ${font.axes[0][3]};`));assert(face.includes('font-display:swap'));
  assert(!face.includes('unicode-range'));assert(!face.includes('local('));assert(!face.includes('http'));
 });
 test(`${font.family}: original OFL attribution remains beside both font containers`,()=>{
  const name=font.family[0].toUpperCase()+font.family.slice(1),license=read(name+'-OFL.txt').toString('utf8');
  assert(license.includes(`The ${name} Project Authors`));assert(license.includes('SIL OPEN FONT LICENSE Version 1.1'));
  assert(css.includes(`assets/fonts/${name}-OFL.txt`));
 });
}
test('All three complete fonts are smaller without adding faces or subsetting',()=>{
 assert.equal(faces.length,3);assert.equal(report.fonts.reduce((n,f)=>n+f.glyphs,0),3044);
 assert.equal(report.fonts.reduce((n,f)=>n+read(f.family+'.ttf').length,0),1115060);
 assert.equal(report.fonts.reduce((n,f)=>n+read(f.family+'.woff2').length,0),386100);
 assert(!faces.some(face=>/\.ttf|format\('truetype'\)/.test(face)));
 assert.match(html,/style\.css\?v=[^\"]+/);
});
