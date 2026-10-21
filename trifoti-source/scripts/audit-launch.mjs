import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { default as worker } from '../dist/server/index.js';

const origin = 'https://step3d-art.step3d.chatgpt.site';
const env = { ASSETS: { fetch: async () => new Response('Not found', { status: 404 }) } };
const context = { waitUntil() {}, passThroughOnException() {} };
const get = path => worker.fetch(new Request(new URL(path, origin), { headers: { accept: 'text/html' } }), env, context);
const sitemapResponse = await get('/sitemap.xml');
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.ok(urls.length > 20);
const assets = new Set();
const links = new Set();
const titles = new Set();
for (const url of urls) {
  const response = await get(url);
  assert.equal(response.status, 200, url);
  const html = await response.text();
  assert.equal((html.match(/<h1(?:\s|>)/g) || []).length, 1, `Exactly one H1: ${url}`);
  const title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert.ok(title, `Title: ${url}`);
  assert.ok(!titles.has(title), `Unique title: ${url}`);
  titles.add(title);
  assert.ok(html.includes('rel="canonical"'), `Canonical: ${url}`);
  assert.ok(html.includes('name="description"'), `Description: ${url}`);
  assert.ok(!html.includes('__qa.html'), `No QA output: ${url}`);
  for (const match of html.matchAll(/(?:src|poster|href)="(\/(?:images|videos|downloads)\/[^"?]+)(?:\?[^"\s]*)?"/g)) assets.add(match[1]);
  for (const match of html.matchAll(/href="(\/(?!\/)[^"#?]*)(?:[?#][^"]*)?"/g)) {
    if (!/\.(?:svg|png|jpg|webp|pdf|mp4|woff2|css|js|ico)$/.test(match[1])) links.add(match[1]);
  }
}
for (const asset of assets) assert.ok(existsSync(new URL(`../public${asset}`, import.meta.url)), `Asset: ${asset}`);
for (const link of links) {
  if (!link.startsWith('/api/')) assert.equal((await get(link)).status, 200, `Internal link: ${link}`);
}
for (const route of ['/api/leads', '/api/sales', '/api/files/1', '/api/events']) {
  assert.equal((await get(route)).status, 401, `Private API: ${route}`);
}
assert.equal((await get('/does-not-exist')).status, 404);
assert.ok(!existsSync(new URL('../public/__qa.html', import.meta.url)));
assert.ok(!existsSync(new URL('../dist/client/__qa.html', import.meta.url)));
console.log(JSON.stringify({ pages: urls.length, uniqueTitles: titles.size, mediaFiles: assets.size, internalRoutes: links.size, privateAPIs: 4, result: 'passed' }));
