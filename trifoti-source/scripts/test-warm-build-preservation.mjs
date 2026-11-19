import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const source=new URL('../warm/runtime/',import.meta.url);
const output=new URL('../../trifoti/warm/',import.meta.url);
const html=readFileSync(new URL('index.html',output),'utf8');
test('warm runtime has independent authoritative sources',()=>{
 for(const file of readdirSync(source).filter(f=>/\.(js|css)$/.test(f))) assert.equal(readFileSync(new URL(file,source),'utf8'),readFileSync(new URL(file,output),'utf8'),file);
});
test('warm bear controls match its runtime contract',()=>{
 assert.match(html,/<div[^>]*id="bear-stage"[^>]*aria-describedby="bear-keyboard-help"/);
 assert.doesNotMatch(html.match(/<video[^>]*id="bear-video"[^>]*>/)[0],/\bcontrols\b/);
 for(const id of ['bear-keyboard-help','rotate-toggle','bear-reset']) assert.doesNotMatch(html.match(new RegExp('<[^>]*id="'+id+'"[^>]*>'))[0],/\bhidden\b/);
});
test('warm meeting empty state remains visible without base-only initialization',()=>{
 const meeting=readFileSync(new URL('meeting.html',output),'utf8');
 assert.doesNotMatch(meeting,/id="meeting-(loading|selection)"/);
 assert.match(meeting,/<section id="meeting-empty"><h1>Какие работы показать\?/);
 assert.match(meeting,/<noscript>.*cases\/red7-panels\.html/s);
});
