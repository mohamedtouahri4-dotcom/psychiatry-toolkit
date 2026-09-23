// Psychiatry Toolkit — service worker
// Caches the app shell so the toolkit keeps working with no connection.
// Bump CACHE_NAME whenever index.html changes so the new version is fetched.
const CACHE_NAME = 'psytoolkit-v2';


const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()) 
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) 
  );
});

self.addEventListener('fetch', event => {
  
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {

      if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html')) {
        return fetch(event.request)
          .then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached || caches.match('./index.html'));
      }

          return cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
