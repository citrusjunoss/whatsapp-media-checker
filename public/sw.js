/**
 * WhatsApp DevTools - Unified Service Worker
 * Capabilities:
 * 1. PWA Local Resource Caching (Offline Shell, CacheFirst for CDN/WASM, StaleWhileRevalidate for Assets)
 * 2. Cross-Origin Isolation (COOP/COEP headers injection for SharedArrayBuffer / FFmpeg WebAssembly)
 */

const CACHE_NAME = 'wa-devtools-cache-v1';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './favicon.svg',
  './pwa-192x192.png',
  './pwa-512x512.png',
  './manifest.webmanifest'
];

// Helper: inject Cross-Origin Isolation headers for SharedArrayBuffer support
function wrapWithIsolationHeaders(response) {
  if (!response || response.status === 0 || response.type === 'opaque') {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

// Install Event: precache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch((err) => {
        console.warn('[SW] Precache warning:', err);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: purge stale caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Message Listener: support skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Interceptor: Smart Caching + COOP/COEP
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-http(s) requests
  if (!request.url.startsWith('http://') && !request.url.startsWith('https://')) {
    return;
  }

  // 1. Navigation requests (HTML pages): Network-First with Offline Cache Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return wrapWithIsolationHeaders(networkResponse);
        })
        .catch(async () => {
          const cachedResponse =
            (await caches.match(request)) ||
            (await caches.match('./index.html')) ||
            (await caches.match('./'));
          if (cachedResponse) {
            return wrapWithIsolationHeaders(cachedResponse);
          }
          return new Response('<h1>离线模式：资源已就绪，请返回主页</h1>', {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // 2. Heavy CDN / WebAssembly (unpkg.com for FFmpeg core, Google Fonts, etc.): Cache-First
  const isCdnOrWasm =
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('cdn') ||
    url.pathname.endsWith('.wasm');

  if (isCdnOrWasm) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return wrapWithIsolationHeaders(cachedResponse);
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return wrapWithIsolationHeaders(networkResponse);
        });
      })
    );
    return;
  }

  // 3. Local static assets (.js, .css, .svg, .png, etc.): Stale-While-Revalidate
  const isStaticAsset =
    url.origin === self.location.origin &&
    (/\.(js|css|svg|png|jpg|jpeg|webp|json|woff2|woff|ttf)$/i.test(url.pathname) ||
      url.pathname.includes('/assets/'));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return wrapWithIsolationHeaders(networkResponse);
          })
          .catch(() => cachedResponse);

        return cachedResponse
          ? wrapWithIsolationHeaders(cachedResponse)
          : fetchPromise;
      })
    );
    return;
  }

  // 4. Default: Network fetch with COOP/COEP isolation fallback
  event.respondWith(
    fetch(request)
      .then((response) => wrapWithIsolationHeaders(response))
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return wrapWithIsolationHeaders(cached);
        throw new Error('Network failed and resource is not cached.');
      })
  );
});
