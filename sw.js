/* Brookstone Auto Takeoff — service worker.
   Network-first for the app shell so testers always pull the latest build while online,
   with a cached fallback so it still opens offline.

   >>> BUMP THIS on every release. Match it to the build badge (t93, t94, ...).
       The version is part of the cache name, so changing it makes `activate`
       delete every older cache and serve a clean shell — no stale t-builds. <<< */
const VERSION = 't93';
const CACHE = 'autotakeoff-' + VERSION;
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  // take over as soon as installed — don't wait for every tab to close
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))) // purge every older build
      .then(() => self.clients.claim())                                                    // control open tabs immediately
  );
});

// let the page force an update without a manual unregister:  navigator.serviceWorker.controller.postMessage('skipWaiting')
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                                  // POSTs (AI worker, email) go straight to network
  if (new URL(req.url).origin !== self.location.origin) return;      // let CDN / worker requests pass through

  // App shell (the page itself) is ALWAYS network-first: a navigation must never be answered
  // from cache while online, or a deployed build can't reach the tester. Cache is offline fallback only.
  const isShell = req.mode === 'navigate' || new URL(req.url).pathname.replace(/\/$/, '/') === '/' ||
                  /\/(index\.html)?$/.test(new URL(req.url).pathname);

  e.respondWith(
    fetch(req, isShell ? { cache: 'no-store' } : undefined)         // shell: bypass HTTP cache too, so GitHub Pages can't hand back a stale copy
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {}); return res; })
      .catch(() => caches.match(req).then(c => c || caches.match('index.html')))
  );
});
