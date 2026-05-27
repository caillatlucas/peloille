const CACHE_NAME = 'bentosite-cache-v3';
const PRECACHE_ASSETS = [
  '/bentosite/',
  '/bentosite/favicon.png',
  '/bentosite/icon-192x192.png',
  '/bentosite/icon-512x512.png',
  '/bentosite/models/model.glb'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('PWA Service Worker - precaching warming skipped:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA Service Worker - deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Strategy 1: NetworkFirst for page navigation (ensures fresh HTML document)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request) || caches.match('/bentosite/');
        })
    );
    return;
  }

  // Strategy 2: CacheFirst for GLB model and icons (large/static files)
  if (url.pathname.includes('/models/') || url.pathname.includes('/icon-') || url.pathname.includes('favicon')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return response;
        });
      })
    );
    return;
  }

  // Strategy 3: StaleWhileRevalidate for JS chunks and CSS (fast load + background update)
  if (url.pathname.includes('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Fallback: Default to network
  event.respondWith(fetch(event.request));
});
