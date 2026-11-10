// Local QA only: control the header module response, never production requests.
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin===self.location.origin && url.pathname==='/fixed-streamed.html'){
    event.respondWith((async()=>{
      const html=await (await fetch('/fixed-normal.html')).text();
      const boundary=html.indexOf('<!-- warm-header-navigation:start -->');
      const encoder=new TextEncoder();
      const stream=new ReadableStream({async start(controller){
        controller.enqueue(encoder.encode(html.slice(0,boundary)));
        await new Promise(resolve=>setTimeout(resolve,3500));
        controller.enqueue(encoder.encode(html.slice(boundary)));controller.close();
      }});
      return new Response(stream,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    })());return;
  }
  if(url.origin!==self.location.origin || url.pathname!=='/header-navigation.js') return;
  event.respondWith((async()=>{
    if(url.searchParams.has('block'))return Response.error();
    const delay=Number(url.searchParams.get('delay'))||0;
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    return fetch('/header-source.js');
  })());
});
