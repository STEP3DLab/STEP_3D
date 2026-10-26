import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=new URL('../dist/',import.meta.url);
const bytes=name=>readFileSync(new URL(name,base));
const html=bytes('index.html').toString(),css=bytes('style.css').toString();
const pngSize=buf=>{assert.equal(buf.subarray(1,4).toString(),'PNG');return [buf.readUInt32BE(16),buf.readUInt32BE(20)];};
const webpSize=buf=>{
 assert.equal(buf.subarray(0,4).toString(),'RIFF');assert.equal(buf.subarray(8,12).toString(),'WEBP');
 assert.equal(buf.readUInt32LE(4),buf.length-8);assert.equal(buf.subarray(12,16).toString(),'VP8L');
 assert.equal(buf[20],0x2f);const packed=buf.readUInt32LE(21);
 return [(packed&0x3fff)+1,((packed>>>14)&0x3fff)+1];
};

test('The selected original PNG is preserved byte for byte, not the superseded JPEG',()=>{
 const original=bytes('assets/brand/trifoti-logo-original.png');
 assert.equal(createHash('sha256').update(original).digest('hex'),'1e73c2da3333e33e60de12fe1574ec325f0670aca419e92d2e32e0ca2865d98f');
 assert.deepEqual(pngSize(original),[1254,1254]);assert.equal(original[25],2,'Supplied PNG is opaque RGB, not a cutout');
});
test('Both web derivatives are square, lossless WebP with appropriate pixel sizes',()=>{
 for(const size of [256,512])assert.deepEqual(webpSize(bytes(`assets/brand/trifoti-logo-transparent-${size}.webp`)),[size,size]);
});
test('The header uses one complete mark instead of separated cropped parts',()=>{
 const header=html.match(/<header class="header">([\s\S]*?)<\/header>/)[1];
 assert.equal((header.match(/<img\b/g)||[]).length,1);assert.match(header,/brand-final-image/);
 assert.match(header,/src="assets\/brand\/trifoti-logo-transparent-256\.webp"/);
 assert.match(header,/sizes="\(max-width:800px\) 60px, 76px"/);
 assert.doesNotMatch(header,/brand-icon|brand-type|assets\/logo\.(?:png|webp)/);
});
test('Header and footer brand links retain accessible names and the Home target',()=>{
 for(const marker of ['brand brand-full brand-final','footer-wordmark footer-brand-final']){
  const opening=html.match(new RegExp(`<a\\b[^>]*class="${marker}"[^>]*>`))[0];
  assert.match(opening,/href="#home"/);assert.match(opening,/aria-label="ТРИФОТИ[^\"]*"/);
 }
});
test('The footer uses the same complete logo with reserved geometry and deferred loading',()=>{
 const footer=html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)[1];
 assert.match(footer,/src="assets\/brand\/trifoti-logo-transparent-512\.webp"/);
 assert.match(footer,/width="512" height="512" alt="" loading="lazy"/);
 assert.match(footer,/sizes="\(max-width:480px\) 160px, 192px"/);
 assert.doesNotMatch(footer,/ТРИ<span>Ф<\/span>ОТИ/);
});
test('The logo stays proportionate and keeps its transparent background and original colors',()=>{
 for(const selector of ['.brand.brand-final .brand-final-image','.footer-brand-final img']){
  const start=css.indexOf(selector+'{');assert(start>=0);
  const rule=css.slice(start,css.indexOf('}',start));
  assert.match(rule,/width:100%;height:100%/);assert.match(rule,/object-fit:contain/);
  assert.match(rule,/mix-blend-mode:normal/);assert.match(rule,/transform:none/);assert.match(rule,/filter:none/);
  assert.doesNotMatch(rule,/cover|clip-path|opacity|mask/);
 }
 assert.match(css,/\.brand\.brand-final\{width:76px;height:76px/);
 assert.match(css,/@media\(max-width:800px\)\{\.brand\.brand-final\{width:60px;height:60px\}\}/);
});
test('The favicon also comes from the selected mark and has a fresh URL',()=>{
 assert.deepEqual(pngSize(bytes('assets/brand/trifoti-favicon-transparent-64.png')),[64,64]);
 assert.match(html,/<link rel="icon" href="assets\/brand\/trifoti-favicon-transparent-64\.png" type="image\/png" sizes="64x64">/);
 assert.doesNotMatch(html,/assets\/favicon\.svg/);
});
test('The brand/layout stylesheet is versioned without changing app behavior',()=>{
 assert.match(html,/style\.css\?v=20261026-stories/);
 assert.match(html,/app\.js\?v=20261026-stories/);
});

 test('The background-removed master is RGBA with unchanged square geometry',()=>{
 const png=bytes('assets/brand/trifoti-logo-transparent.png');
 assert.deepEqual(pngSize(png),[1254,1254]);assert.equal(png[25],6);
 });
