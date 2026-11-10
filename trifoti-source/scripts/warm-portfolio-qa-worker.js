// Test-only service worker. Used by warm-portfolio-qa.html on a local HTTP preview.
// Production HTML is served unchanged; only test image responses are substituted.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (!/\/photos\/portfolio\/(view|cover)-\d+\.webp$/.test(url.pathname)) return;
  event.respondWith((async () => {
    const client = await self.clients.get(event.clientId);
    const scenario = new URL(client?.url || self.location.href).searchParams.get('scenario');
    const view = url.pathname.includes('/view-');
    const number = Number(url.pathname.match(/-(\d+)\.webp$/)[1]);
    const retry = url.searchParams.has('retry');
    if (view && (scenario === 'failure' || (scenario === 'retry' && !retry))) return Response.error();
    if (view && scenario === 'broken') return new Response('not an image', {headers: {'Content-Type': 'image/webp'}});
    const delay = view && scenario === 'timeout' ? 22000
      : view && scenario === 'slow' ? 1800
      : view && scenario === 'race' && number === 2 ? 2400
      : view && scenario === 'race' && number === 3 ? 400
      : view && scenario === 'retry' && retry ? 900 : 0;
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#cedcdd"/><circle cx="400" cy="270" r="150" fill="#1e4578"/><text x="400" y="510" font-family="sans-serif" font-size="32" text-anchor="middle" fill="#182230">Test image ${number}</text></svg>`;
    return new Response(svg, {headers: {'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store'}});
  })());
});
