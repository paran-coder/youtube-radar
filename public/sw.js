/* Offline static shell only. YouTube API requests and credentials are never cached. */
const CACHE='youtube-radar-static-v1.4.0';
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch('/',{cache:'reload'});
   if(response.ok){await cache.put('/',response.clone());const html=await response.text();const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(m=>m[1]);await Promise.all([...new Set(assets)].map(async path=>{try{await cache.add(path);}catch{/* asset can be retried */}}));}
  }catch{/* offline at install: next visit can install again */}
 })());self.skipWaiting();
});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('youtube-radar-static-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})());});
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(r=>{if(r.ok){const clone=r.clone();void caches.open(CACHE).then(c=>c.put('/',clone));}return r;}).catch(async()=>await (await caches.open(CACHE)).match('/')||new Response('Offline cache unavailable',{status:503})));return;
 }
 if(url.pathname.startsWith('/assets/')||url.pathname.endsWith('/favicon.svg')){
  event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(req);if(cached)return cached;const response=await fetch(req);if(response.ok)void cache.put(req,response.clone());return response;})());
 }
});
