// Psychiatry Toolkit — service worker
// Incrémente CACHE_NAME à chaque changement visible de l'app (thème, contenu, nouveau module...)
// pour forcer les appareils déjà installés à récupérer la nouvelle version.
const CACHE_NAME = 'psytoolkit-v2';

// Fichiers locaux essentiels au fonctionnement hors ligne.
// Adapte cette liste si tes icônes ont d'autres noms/chemins dans ton dépôt.
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
      .then(() => self.skipWaiting()) // active la nouvelle version sans attendre la fermeture des onglets
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // prend le contrôle immédiat des pages déjà ouvertes
  );
});

self.addEventListener('fetch', event => {
  // On ne gère que les requêtes GET same-origin ; le reste (polices Google, etc.) passe par le réseau normalement.
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      // Network-first pour index.html : on essaie toujours d'avoir la dernière version en ligne,
      // et on retombe sur le cache seulement si le réseau échoue (mode hors ligne).
      if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html')) {
        return fetch(event.request)
          .then(response => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
            return response;
          })
          .catch(() => cached || caches.match('./index.html'));
      }

      // Cache-first pour le reste (icônes, manifest) : plus rapide, ça change rarement.
      return cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
