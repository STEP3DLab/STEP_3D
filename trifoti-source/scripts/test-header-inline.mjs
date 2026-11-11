import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {renderPage,renderHeaderInline,start,end} from './render-header-inline.mjs';
const read=name=>readFileSync(new URL('../dist/'+name,import.meta.url),'utf8');
const source=read('header-navigation.js'),html=read('index.html');
const base='<html><head>{script}</head><body><header class="header">unchanged header</header><main id="main">unchanged content</main></body></html>';
test('One synchronous controller exactly matches tested module and runs before main',()=>{
 const block=renderHeaderInline(source);assert(html.includes(block));assert.equal(html.split(start).length,2);assert.equal(html.split(end).length,2);
 assert(html.indexOf('</header>')<html.indexOf(start));assert(html.indexOf(end)<html.indexOf('<main id="main">'));assert.doesNotMatch(html,/<script[^>]*src=[^>]*header-navigation/);
 new Script(block.match(/<script>([\s\S]*?)<\/script>/)[1]);assert.equal(renderPage(html,source),html);
 for(const prefix of ['../../trifoti/','../../docs/trifoti/'])assert.equal(readFileSync(new URL(prefix+'index.html',import.meta.url),'utf8'),html);
});
test('Generator preserves content and is idempotent for both quote styles',()=>{
 for(const quote of ['"',"'"]){const output=renderPage(base.replace('{script}',`<script type="module" src=${quote}./header-navigation.js?v=test${quote}></script>`),source);assert.equal(renderPage(output,source),output);assert(output.includes('unchanged header'));assert(output.includes('unchanged content'));}
});
test('Unsafe scripts, duplicate scripts and malformed boundaries fail closed',()=>{
 assert.throws(()=>renderHeaderInline(source.replace('export function initializeHeaderNavigation','function unrelated')));
 assert.throws(()=>renderHeaderInline(source+source));
 for(const extra of ['\nexport const future=1;', '\nimport x from "x";', '\n// </script>'])assert.throws(()=>renderHeaderInline(source+extra));
 for(const script of [end+start,start+start+end+end,'<script src=header-navigation.js></script>','<script src="header-navigation.js"></script>'.repeat(2),'<script src="https://example.test/header-navigation.js"></script>'])assert.throws(()=>renderPage(base.replace('{script}',script),source));
 assert.throws(()=>renderPage(base.replace('{script}','').replace('<main id="main">','<main>'),source));
});
test('No-JS and CSP-blocked inline retain native links and no delayed second controller',()=>{
 assert.match(read('style.css'),/\.header:not\(\.nav-ready\) nav\{display:flex/);assert.match(html,/<button class="menu-button" hidden/);
 assert.doesNotMatch(read('app.js'),/header-navigation|initializeHeaderNavigation/);assert.doesNotMatch(renderHeaderInline(source),/fetch\(|localStorage|sessionStorage|navigator\./);
});
