const CACHE_NAME = 'bygog-lab-cache-v4';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'dist/styles.css',
  'dist/renderLinks.js',
  'links.json',
  'icon/bygog-lab-icon.svg',
  'icon/bygog-lab-logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(urlsToCache);
      } catch (_) {}
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : undefined)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    const reqUrl = new URL(event.request.url);
    const sameOrigin = reqUrl.origin === self.location.origin;
    const networkFetch = fetch(event.request)
      .then(response => {
        try {
          if (sameOrigin && response && response.status === 200 && response.type === 'basic') {
            cache.put(event.request, response.clone());
          }
        } catch {}
        return response;
      })
      .catch(() => undefined);

    return cached || networkFetch || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});

