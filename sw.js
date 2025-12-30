const CACHE_VERSION = 'v0.2.0-5fc69544';
const CACHE_NAME = `bygog-lab-cache-${CACHE_VERSION}`;
const OFFLINE_URL = 'index.html';

// Core assets for app shell
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'dist/styles.aa97ef9f.css',
  'dist/fab.aab982f1.css',
  'dist/renderLinks.8f1c02e0.js',
  'data/links-index.json',
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
      // Cache core assets
      try {
        await cache.addAll([...urlsToCache, ...smallIcons]);
      } catch (err) {
        console.warn('Cache addAll failed:', err);
      }
      // Immediately activate
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : undefined))
      );
      // Enable navigation preload if supported
      try {
        if (self.registration?.navigationPreload) {
          await self.registration.navigationPreload.enable();
        }
      } catch {}
      // Take control of all clients
      await self.clients.claim();
    })()
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  try {
    const data = event.data || {};
    if (data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
    if (data.type === 'GET_VERSION') {
      event.ports[0]?.postMessage({ version: CACHE_VERSION });
    }
    if (data.type === 'CACHE_URLS' && Array.isArray(data.urls)) {
      event.waitUntil(
        (async () => {
          const cache = await caches.open(CACHE_NAME);
          await cache.addAll(data.urls);
        })()
      );
    }
  } catch {}
});

// Periodic background sync for content updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          // Refresh critical assets
          const refreshUrls = ['data/links-index.json', 'index.html'];
          for (const url of refreshUrls) {
            try {
              const response = await fetch(url, { cache: 'no-store' });
              if (response.ok) {
                await cache.put(url, response);
              }
            } catch {}
          }
        } catch {}
      })()
    );
  }
});

// Push notification support
self.addEventListener('push', event => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Yeni güncelleme mevcut!',
      icon: 'icon/bygog-lab-icon-192.png',
      badge: 'icon/bygog-lab-icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || './',
        dateOfArrival: Date.now()
      },
      actions: [
        { action: 'open', title: 'Aç' },
        { action: 'close', title: 'Kapat' }
      ],
      tag: data.tag || 'bygog-notification',
      renotify: true
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'byGOG Lab', options)
    );
  } catch {}
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') return;
  
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes('byGOG-Lab') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background fetch for large downloads
self.addEventListener('backgroundfetchsuccess', event => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const records = await event.registration.matchAll();
        
        for (const record of records) {
          const response = await record.responseReady;
          await cache.put(record.request, response);
        }
        
        await event.updateUI({ title: 'İndirme tamamlandı!' });
      } catch {}
    })()
  );
});

self.addEventListener('backgroundfetchfail', event => {
  console.warn('Background fetch failed:', event.registration.id);
});

self.addEventListener('backgroundfetchabort', event => {
  console.warn('Background fetch aborted:', event.registration.id);
});

// Advanced fetch handler with modern caching strategies
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;

    const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
    const isStatic = sameOrigin && /\.(?:css|js|svg|png|jpg|jpeg|webp|ico|json|woff2?)$/.test(url.pathname);
    const isHashed = sameOrigin && /\.[0-9a-f]{8,}\.(?:css|js)$/.test(url.pathname);
    const isImage = /\.(?:png|jpg|jpeg|webp|svg|gif|ico)$/i.test(url.pathname);
    const isFont = /\.(?:woff2?|ttf|eot|otf)$/i.test(url.pathname);
    const isJson = sameOrigin && /\.json$/i.test(url.pathname);

    // Network-first for HTML navigations (for fresh content)
    if (isHTML) {
      try {
        // Use navigation preload if available
        const pre = await (event.preloadResponse || Promise.resolve(undefined));
        const net = pre || await fetch(req, { 
          credentials: 'same-origin',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (net && net.status === 200) {
          try { await cache.put(req, net.clone()); } catch {}
        }
        return net;
      } catch {
        const cached = await cache.match(req) || await cache.match(OFFLINE_URL);
        return cached || createOfflineResponse();
      }
    }

    // Stale-while-revalidate for JSON data files
    if (isJson) {
      const cached = await cache.match(req);
      const fetchPromise = fetch(req, { cache: 'no-store' }).then(net => {
        if (net && net.status === 200) {
          cache.put(req, net.clone()).catch(() => {});
        }
        return net;
      }).catch(() => null);

      if (cached) {
        event.waitUntil(fetchPromise);
        return cached;
      }

      const net = await fetchPromise;
      return net || createOfflineResponse();
    }

    // Cache-first for hashed/immutable assets (forever cacheable)
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
        return createOfflineResponse();
      }
    }

    // Cache-first for fonts (rarely change)
    if (isFont) {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const net = await fetch(req);
        if (net && net.status === 200) {
          try { await cache.put(req, net.clone()); } catch {}
        }
        return net;
      } catch {
        return createOfflineResponse();
      }
    }

    // Stale-while-revalidate for images
    if (isImage) {
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(net => {
        if (net && net.status === 200) {
          cache.put(req, net.clone()).catch(() => {});
        }
        return net;
      }).catch(() => null);
      
      if (cached) {
        event.waitUntil(fetchPromise);
        return cached;
      }
      
      const net = await fetchPromise;
      return net || createOfflineResponse();
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
        return createOfflineResponse();
      }
    }

    // Default: Network with cache fallback
    try {
      const net = await fetch(req);
      if (sameOrigin && net && net.status === 200) {
        try { await cache.put(req, net.clone()); } catch {}
      }
      return net;
    } catch {
      const cached = await cache.match(req);
      return cached || createOfflineResponse();
    }
  })());
});

// Create offline response
function createOfflineResponse() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Çevrimdışı - byGOG Lab</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:system-ui,-apple-system,sans-serif;background:#181c22;color:#e5e7eb;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px}
        .offline{max-width:400px}
        .offline-icon{font-size:64px;margin-bottom:20px}
        h1{font-size:24px;margin-bottom:12px;color:#a3bffa}
        p{color:#9ca3af;margin-bottom:20px;line-height:1.6}
        button{background:#3b82f6;color:#fff;border:none;padding:12px 24px;border-radius:8px;font-size:16px;cursor:pointer;transition:background 0.2s}
        button:hover{background:#2563eb}
      </style>
    </head>
    <body>
      <div class="offline">
        <div class="offline-icon">📡</div>
        <h1>Çevrimdışısınız</h1>
        <p>İnternet bağlantınız yok gibi görünüyor. Lütfen bağlantınızı kontrol edin ve tekrar deneyin.</p>
        <button onclick="location.reload()">Tekrar Dene</button>
      </div>
    </body>
    </html>`,
    {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    }
  );
}
