let CACHE_NAME = 'orderly-dex-v1';
const CACHE_VERSION = 'v1';
let cacheNameInitialized = false;

async function initializeCacheName() {
  if (cacheNameInitialized) {
    return;
  }

  try {
    const response = await fetch('/config.js');
    const configText = await response.text();
    
    const jsonText = configText
      .replace(/window\.__RUNTIME_CONFIG__\s*=\s*/, '')
      .replace(/;$/, '')
      .trim();
    
    const config = JSON.parse(jsonText);
    const brokerId = config.VITE_ORDERLY_BROKER_ID || 'orderly';
    
    CACHE_NAME = `${brokerId}-dex-${CACHE_VERSION}`;
    cacheNameInitialized = true;
    console.log('Service Worker cache name:', CACHE_NAME);
  } catch (error) {
    console.warn('Failed to load config, using default cache name:', error);
    CACHE_NAME = `orderly-dex-${CACHE_VERSION}`;
    cacheNameInitialized = true;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(initializeCacheName());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    initializeCacheName().then(() => {
      return caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => !name.endsWith(`-${CACHE_VERSION}`) && name !== CACHE_NAME)
            .map((name) => {
              console.log('Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      });
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    initializeCacheName().then(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      });
    })
  );
});

