// Minimal Service Worker for PWA installation support
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Network first strategy could be implemented here
    // For now, we just let requests pass through to support online usage
});
