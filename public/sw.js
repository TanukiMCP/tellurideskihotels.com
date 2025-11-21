// Service Worker for Telluride Ski Hotels PWA
// Provides offline support for trail map and essential assets

const CACHE_NAME = 'telluride-ski-v3'; // Incremented version to force update
const OFFLINE_CACHE = 'telluride-offline-v3';

// Assets to cache immediately on install
const ESSENTIAL_ASSETS = [
  '/',
  '/trail-map',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching essential assets');
        return cache.addAll(ESSENTIAL_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  
  // CRITICAL: Never cache CSS, JS, or other immutable assets
  // These have immutable cache headers and should be served directly from network/CDN
  const isImmutableAsset = 
    url.pathname.startsWith('/_astro/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.match(/\.(css|js|woff2?|ttf|eot)$/i);
  
  if (isImmutableAsset) {
    // Let browser/CDN handle these - don't interfere
    return;
  }
  
  // Handle local tiles
  if (url.pathname.startsWith('/tiles/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(OFFLINE_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle Mapbox tiles - cache with fallback to local tiles
  if (url.hostname.includes('mapbox.com') || url.hostname.includes('tiles.mapbox.com')) {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(OFFLINE_CACHE).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          
          // Fallback to local OSM tiles if Mapbox fails
          const tileMatch = url.pathname.match(/\/v4\/mapbox\.\w+\/(\d+)\/(\d+)\/(\d+)/);
          if (tileMatch) {
            const [, z, x, y] = tileMatch;
            return caches.match(`/tiles/osm/${z}/${x}/${y}.png`);
          }
          
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // Skip other external requests
  if (!url.origin.includes(self.location.origin)) return;

  // Only cache HTML pages and data files, not CSS/JS
  event.respondWith(
    fetch(event.request).then(response => {
      // Only cache HTML pages and specific data files
      if (response.ok && 
          (event.request.mode === 'navigate' || 
           event.request.url.includes('/trail-map') ||
           event.request.url.includes('/data/'))) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // Fallback to cache only for navigation requests
      if (event.request.mode === 'navigate') {
        return caches.match(event.request).then(cached => {
          return cached || caches.match('/').then(fallback => {
            return fallback || new Response('Offline', { status: 503 });
          });
        });
      }
      // For non-navigation requests, let them fail normally
      return fetch(event.request);
    })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
