// The independent controller runs while the header is parsed, before main can
// paint. A blocked script leaves the original native links visible.
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
export const start='<!-- header-navigation:inline:start -->';
export const end='<!-- header-navigation:inline:end -->';
export function renderHeaderInline(source) {
  if(source.split('export function initializeHeaderNavigation').length!==2) throw new Error('Expected one canonical controller export');
  if (/<\/script/i.test(source) || /^\s*import\b/m.test(source)) throw new Error('Unsupported inline controller source');
  const code=source.replace('export function initializeHeaderNavigation','function initializeHeaderNavigation').trimEnd();
  if (/\bexport\s/m.test(code)) throw new Error('Unsupported controller export');
  return `${start}\n<script>\n(() => {\n"use strict";\n${code}\n})();\n</script>\n${end}`;
}
export function renderPage(html,source) {
  const count=token=>html.split(token).length-1;
  if (count(start)!==count(end)||count(start)>1||html.indexOf(end)<html.indexOf(start)) throw new Error('Invalid inline markers');
  if (count(start)) html=html.slice(0,html.indexOf(start))+html.slice(html.indexOf(end)+end.length);
  const external=[...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*(["'])([^"']*header-navigation\.js[^"']*)\1[^>]*>\s*<\/script>/g)];
  if(external.length>1 || external.some(m=>!/^\.?\/?header-navigation\.js(?:\?[^\s]*)?$/.test(m[2]))) throw new Error('Unexpected header script');
  for(const match of external) html=html.replace(match[0],'');
  html=html.replace(/^[ \t]+$/gm,'');
  if(/<script\b[^>]*header-navigation\.js/i.test(html)) throw new Error('Unrecognized header script');
  const boundary=html.match(/<\/header>\s*(?=<main id="main">)/);
  if(!boundary)throw new Error('Missing header/main boundary');
  return html.replace(boundary[0],`</header>\n${renderHeaderInline(source)}\n`);
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
  const index=new URL('../dist/index.html',import.meta.url);
  const html=readFileSync(index,'utf8');
  const output=renderPage(html,readFileSync(new URL('../dist/header-navigation.js',import.meta.url),'utf8'));
  if(process.argv.includes('--check')) {if(output!==html)throw new Error('Header inline block is stale; run npm run build:header');}
  else writeFileSync(index,output);
}
