// Phase 3.3: Basic Service Worker Registration
const CACHE_NAME = 'vent-cache-v1';

// We will add logic here in Phase 3.4 to cache files
self.addEventListener('install', (event) => {
    console.log('Phase 3.3: Service Worker Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Phase 3.3: Service Worker Activated');
});

self.addEventListener('fetch', (event) => {
    // Current behavior: just pass through to network
    event.respondWith(fetch(event.request));
});