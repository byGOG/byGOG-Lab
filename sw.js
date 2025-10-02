const CACHE_NAME = 'bygog-lab-cache-ba00410a';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'dist/styles.00086b77.css',
  'dist/fab.2ce096b9.css',
  'dist/renderLinks.7448366a.js',
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
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;

    const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
    const isStatic = sameOrigin && /\.(?:css|js|svg|png|jpg|jpeg|webp|ico|json)$/.test(url.pathname);
    const isHashed = sameOrigin && /\.[0-9a-f]{8}\.(?:css|js)$/.test(url.pathname);

    // Network-first for HTML navigations
    if (isHTML) {
      try {
        const net = await fetch(req);
        if (net && net.status === 200) {
          try { await cache.put(req, net.clone()); } catch {}
        }
        return net;
      } catch {
        const cached = await cache.match(req);
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    }

    // Cache-first for versioned (hashed) static assets
    if (isStatic && isHashed) {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const net = await fetch(req);
        if (net && net.status === 200) {
          try { await cache.put(req, net.clone()); } catch {}
        }
        return net;
      } catch {
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    }

    // Stale-while-revalidate for other same-origin static assets
    if (isStatic) {
      const cached = await cache.match(req);
      if (cached) {
        event.waitUntil((async () => {
          try {
            const net = await fetch(req);
            if (net && net.status === 200) await cache.put(req, net.clone());
          } catch {}
        })());
        return cached;
      }
      try {
        const net = await fetch(req);
        if (net && net.status === 200) await cache.put(req, net.clone());
        return net;
      } catch {
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    }

    // Default: pass-through with opportunistic caching for same-origin
    try {
      const net = await fetch(req);
      if (sameOrigin && net && net.status === 200) {
        try { await cache.put(req, net.clone()); } catch {}
      }
      return net;
    } catch {
      const cached = await cache.match(req);
      return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});










