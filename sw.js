const CACHE_NAME = 'bygog-lab-cache-v2';
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
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    const reqUrl = new URL(event.request.url);
    const sameOrigin = reqUrl.origin === self.location.origin;
    const networkFetch = fetch(event.request)
      .then(response => {
        try {
          // Cache successful same-origin, basic responses only
          if (sameOrigin && response && response.status === 200 && response.type === 'basic') {
            cache.put(event.request, response.clone());
          }
        } catch {}
        return response;
      })
      .catch(() => undefined);

    // Stale-while-revalidate
    return cached || networkFetch || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
