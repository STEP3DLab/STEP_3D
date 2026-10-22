import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const links=[...html.matchAll(/<a\b([^>]*\bdata-service="([^"]+)"[^>]*)>([^<]*)<\/a>/g)];
const attr=(text,name)=>text.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

test('All four service CTAs retain their visible label, target and contextual accessible name',()=>{
 assert.equal(links.length,4);
 const names=new Set();
 for(const [,attrs,service,visible] of links){
  assert.equal(visible,service==='3D-модель и производство'?'Обсудить задачу ↗':'Обсудить идею ↗');
  assert.equal(attr(attrs,'href'),'#contact');
  const name=attr(attrs,'aria-label');
  assert.ok(name.startsWith(visible));assert.ok(name.includes(service));names.add(name);
 }
 assert.equal(names.size,4);
});
test('Every service still selects one existing brief option',()=>{
 const select=html.match(/<select name="direction"[^>]*>(.*?)<\/select>/s)[1];
 const options=[...select.matchAll(/<option>([^<]+)<\/option>/g)].map(m=>m[1]);
 assert.equal(options.length,5);
 for(const [, ,service] of links)assert.ok(options.includes(service));
});
test('Only the existing name and idea fields are visibly and natively required',()=>{
 const labels=[...html.matchAll(/<label>([^<]*)<(input|textarea)\b([^>]*)>/g)];
 const required=labels.filter(m=>/\brequired\b/.test(m[3]));
 assert.deepEqual(required.map(m=>attr(m[3],'name')),['name','idea']);
 for(const [,label] of required)assert.match(label,/\(обязательно\)$/);
 for(const [,label,,attrs] of labels.filter(m=>['budget','deadline'].includes(attr(m[3],'name')))){
  assert.doesNotMatch(label,/обязательно/);assert.doesNotMatch(attrs,/\brequired\b/);
 }
});
test('The brief retains its original six stored fields and local-only explanation',()=>{
 const form=html.match(/<form id="brief-form">(.*?)<\/form>/s)[1];
 assert.deepEqual([...form.matchAll(/\bname="([^"]+)"/g)].map(m=>m[1]),['reference','name','direction','idea','budget','deadline']);
 assert.match(form,/Бриф скачивается файлом, а не отправляется студии/);
});
