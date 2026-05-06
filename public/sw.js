const CACHE_NAME = 'mytools-static-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.svg', '/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/');
        return cached || Response.error();
      }),
    );
    return;
  }

  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webmanifest');

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(request).then(async (cachedResponse) => {
      const networkResponsePromise = fetch(request)
        .then(async (networkResponse) => {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || networkResponsePromise || Response.error();
    }),
  );
});
