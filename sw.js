const CACHE_NAME = 'bygog-lab-cache-v6';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'dist/styles.css',
  'dist/fab.css',
  'dist/renderLinks.js',
  'links.json',
  'icon/bygog-lab-icon.svg',
  'icon/bygog-lab-logo.svg'
];

// Pre-cache a curated set of very small icons to improve first paint
// Keep this list limited to tiny SVGs (<5KB) to avoid bloating cache
const smallIcons = [
  'icon/fallback.svg',
  'icon/amd.svg',
  'icon/android.svg',
  'icon/buster.svg',
  'icon/chrome.svg',
  'icon/discord.svg',
  'icon/github.svg',
  'icon/gmail.svg',
  'icon/googledrive.svg',
  'icon/rustdesk.svg',
  'icon/steam.svg',
  'icon/teamviewer.svg',
  'icon/telegram.svg',
  'icon/tor.svg',
  'icon/ubuntu.svg',
  'icon/ublock.svg',
  'icon/visualstudiocode.svg',
  'icon/winconfigs.svg',
  'icon/yahoo.svg',
  'icon/zenbrowser.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll([...urlsToCache, ...smallIcons]);
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
