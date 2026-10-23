import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const css=read('style.css'),html=read('index.html'),app=read('app.js');
const flow=css.match(/^\.review-launch\{([^}]*)\}/m)[1];

test('The notes launcher uses document flow at every viewport height',()=>{
 assert.match(flow,/position:static/);assert.match(flow,/transform:none/);
 assert.doesNotMatch(css,/@media\(max-height:500px\)\{\.review-launch/);
 const later=css.slice(css.indexOf(flow)+flow.length);assert.doesNotMatch(later,/\.review-launch\{[^}]*position:(?:fixed|absolute|sticky)/);
});
test('The launcher reserves its own space and cannot mask fields or explanations',()=>{
 assert.match(flow,/margin:18px auto/);assert.match(flow,/width:max-content/);
 assert.doesNotMatch(flow,/overflow:hidden|visibility:hidden|display:none|pointer-events:none|margin:[-]/);
 assert.ok(html.indexOf('id="review-launch"')>html.indexOf('</footer>'));
});
test('Narrow and enlarged-text launchers can wrap without shrinking the touch target',()=>{
 assert.match(flow,/max-width:calc\(100% - 32px\)/);assert.match(flow,/white-space:normal/);
 assert.match(flow,/flex-wrap:wrap/);assert.match(flow,/justify-content:center/);assert.match(flow,/min-height:44px/);
 assert.doesNotMatch(flow,/font-size|line-height|letter-spacing|color|background/);
});
test('The same native button and accessible label remain present once',()=>{
 assert.equal((html.match(/id="review-launch"/g)||[]).length,1);
 const button=html.match(/<button\b([^>]*id="review-launch"[^>]*)>(.*?)<\/button>/s);
 assert.ok(button);assert.doesNotMatch(button[1],/tabindex|hidden|disabled|aria-hidden/);
 assert.match(button[2],/Концепт 01/);assert.match(button[2],/Структура и заметки/);
 assert.ok(!html.match(/<form[^>]*>.*?id="review-launch".*?<\/form>/s));
});
test('The existing short-height footer spacing is retained',()=>{
 assert.match(css,/@media\(max-height:500px\)\{footer\.site-footer\{padding-bottom:28px\}\}/);
});
test('Opening the notes dialog still uses the unchanged native modal path',()=>{
 assert.match(app,/\$\('#review-launch'\)\?\.addEventListener\('click',\(\)=>\$\('#review-dialog'\)\?\.showModal\(\)\)/);
 assert.match(html,/<dialog[^>]*id="review-dialog"/);
});
test('Returning visitors receive the layout fix without replacing application logic',()=>{
 assert.match(html,/style\.css\?v=20261023-bear-chapters/);
 assert.match(html,/app\.js\?v=20261023-viewport/);
});
