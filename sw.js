/* Brookstone Auto Takeoff — service worker.
   Network-first for the app shell so testers always pull the latest build while online,
   with a cached fallback so it still opens offline. Bump CACHE on each release. */
const CACHE = 'autotakeoff-v1';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                     // POSTs (AI worker, email) go straight to network
  if (new URL(req.url).origin !== self.location.origin) return;  // let CDN / worker requests pass through
  e.respondWith(
    fetch(req)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{}); return res; })
      .catch(() => caches.match(req).then(c => c || caches.match('index.html')))
  );
});
