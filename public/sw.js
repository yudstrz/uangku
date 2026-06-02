const CACHE_NAME = 'uangku-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests, API calls, next-auth, and webpack HMR
  if (
    request.method !== 'GET' || 
    request.url.includes('/api/') || 
    request.url.includes('/_next/webpack-hmr') ||
    request.url.includes('/_next/static/webpack/')
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // If it's a valid response, cache it (stale-while-revalidate strategy)
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: try to serve from cache
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
        });
      })
  );
});
