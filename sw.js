// Brookstone 2D Takeoff — service worker
// Bump VERSION whenever you deploy a new index.html.
const VERSION = 'v1.92';
const CACHE = 'brookstone-takeoff-' + VERSION;

// Core files to cache for offline use. Keep this to files that live in your repo.
// (best.onnx is loaded from disk by you, and onnxruntime comes from a CDN — not cached here.)
const CORE = [
  './',
  './index.html',
  './sw.js'
];

// Install: pre-cache the core files, then activate right away.
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
});

// Activate: delete old version caches and take control of open tabs.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch strategy:
//  - Page/HTML navigations => NETWORK FIRST (always get the newest app when online;
//    fall back to cache only when offline). This is what prevents stale versions.
//  - Everything else same-origin => cache first, update in background.
//  - Cross-origin (CDN, etc.) => just let the network handle it.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  const isPage =
    req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('index.html');

  if (isPage) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  if (sameOrigin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const net = fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => cached);
        return cached || net;
      })
    );
  }
});

// Optional: lets the page tell the SW to activate immediately after an update.
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
