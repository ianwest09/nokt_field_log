/* NOKT FIELD LOG — service worker. Cache-first, precache everything. */
var VERSION = 'nokt-field-log-v7';
var ASSETS = [
  './',
  './index.html',
  './app.css',
  './manifest.json',
  './js/config.js',
  './js/zip.js',
  './js/db.js',
  './js/ui.js',
  './js/photos.js',
  './js/seed.js',
  './js/views/dashboard.js',
  './js/views/factories.js',
  './js/views/fabrics.js',
  './js/views/body.js',
  './js/views/fit.js',
  './js/views/wear.js',
  './js/views/cost.js',
  './js/views/decisions.js',
  './js/views/photolib.js',
  './js/views/reports.js',
  './js/views/settings.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      return Promise.all(ASSETS.map(function (url) {
        return c.add(new Request(url, { cache: 'reload' })).catch(function (err) {
          console.warn('[sw] could not precache', url, err);
        });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        // offline and not cached — fall back to the shell so the SPA still boots
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
