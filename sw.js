import { validateEdition, isNewerEdition } from "./edition-status.js";

const CACHE="tw-shell-v5";
const SHELL=["./","./index.html","./styles.css","./app.js","./edition-status.js","./refresh-client.js","./favicon.svg","./manifest.webmanifest"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil((async()=>{
  const keys=await caches.keys();
  const current=await caches.open(CACHE);
  // Upgrade old installed apps without discarding their validated offline guide.
  for(const name of keys.filter(key=>key.startsWith("tw-shell-")&&key!==CACHE)){
    const old=await caches.open(name);
    for(const city of ["cincinnati","philadelphia","chicago","washington-dc"]){
      const key=new Request(new URL(`./data/${city}/current-weekend.json`,self.location.href));
      const response=await old.match(key);
      if(response){
        try{
          const previous=validateEdition(await response.clone().json(),city);
          let present=null;
          try{const cached=await current.match(key);if(cached)present=validateEdition(await cached.clone().json(),city)}catch{}
          if(!present||isNewerEdition(previous.weekend,present.weekend))await current.put(key,response.clone());
        }catch{}
      }
    }
    await caches.delete(name);
  }
  await self.clients.claim();
})()));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.pathname.endsWith("/refresh-config.json")||url.hostname==="raw.githubusercontent.com"){
    event.respondWith(fetch(event.request,{cache:"no-store"}));return;
  }
  const editionPath=url.pathname.match(/\/data\/([^/]+)\/current-weekend.json$/);
  if(editionPath){
    const cacheKey=new Request(url.origin+url.pathname);
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request,{cache:"no-store"});
        if(!response.ok)return response;
        // Invalid 200 responses must never replace the last good offline guide.
        validateEdition(await response.clone().json(),editionPath[1]);
        const cache=await caches.open(CACHE);
        await cache.put(cacheKey,response.clone());
        return response;
      }catch(error){
        if(url.searchParams.has("check"))throw error;
        return await caches.match(cacheKey)||Response.error();
      }
    })());return;
  }
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)));}
    return response;
  }).catch(()=>caches.match(event.request)));
});
