const CACHE_NAME = 'bygog-lab-cache-v1';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'dist/styles.css',
  'dist/renderLinks.js',
  'links.json',
  'icon/byGOG-Lab-icon.svg',
  'icon/byGOG-Lab-logo.svg'
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
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
