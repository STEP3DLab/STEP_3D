import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url));
const css=read('style.css').toString(),html=read('index.html').toString(),subset=read('assets/fonts/trifoti-headline.woff2');
const report=JSON.parse(readFileSync(new URL('./headline-integrity.json',import.meta.url)));
test('Tiny embedded subset equals audited binary and original font remains available',()=>{
 const face=css.match(/@font-face\{font-family:TrifotiHeadline;([^}]+)\}/)?.[1];assert(face);const encoded=face.match(/data:font\/woff2;base64,([^']+)/)?.[1];assert(encoded);
 assert.deepEqual(Buffer.from(encoded,'base64'),subset);assert(subset.length<8192);assert.equal(subset.toString('ascii',0,4),'wOF2');assert.equal(subset.readUInt32BE(8),subset.length);
 assert.equal(createHash('sha256').update(subset).digest('hex'),report.sha256);assert(face.includes('font-weight:600;font-display:block'));
 assert(css.includes('font-family:TrifotiHeadline,Oswald,Manrope,sans-serif;'));assert(css.includes('Copyright 2016 The Oswald Project Authors. SIL OFL'));
});
test('Subset covers the full unchanged slogan and uppercase transform',()=>{
 const slogan=html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)[1].replace(/<[^>]*>/g,'');for(const character of slogan+slogan.toUpperCase()+' ')assert(report.codepoints.includes(character.codePointAt(0)));
 assert.equal(report.weight,600);assert(report.outlines_and_advances_equal);assert.match(css,/\.hero h1 span\{white-space:normal;overflow-wrap:break-word\}/);
});
test('Main mirrors match the new font and stylesheet, with fresh CSS version',()=>{
 assert(html.includes('&amp;load=20261111-stable'));for(const prefix of ['../../trifoti/','../../docs/trifoti/']){assert.deepEqual(readFileSync(new URL(prefix+'assets/fonts/trifoti-headline.woff2',import.meta.url)),subset);assert.equal(readFileSync(new URL(prefix+'style.css',import.meta.url),'utf8'),css);}
});
