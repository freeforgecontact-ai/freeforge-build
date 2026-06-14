/* FreeForge service worker — offline-first. Cache-first même domaine, réseau en secours. */
const CACHE = "freeforge-v2";
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((r) => { if (r && r.ok && r.type === "basic") { const cl = r.clone(); caches.open(CACHE).then((c) => c.put(req, cl)); } return r; }).catch(() => hit || (req.mode === "navigate" ? caches.match("./index.html") : Response.error()));
      return hit || net;
    })
  );
});
