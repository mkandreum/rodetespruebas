const CACHE_NAME = 'rodetes-cache-v-reset';

self.addEventListener('install', (event) => {
    // Force immediate activation
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Unregister this SW immediately to kill the zombie cache
    event.waitUntil(
        self.registration.unregister()
            .then(() => {
                return self.clients.matchAll();
            })
            .then((clients) => {
                clients.forEach(client => client.navigate(client.url));
            })
    );
});

self.addEventListener('fetch', (event) => {
    // Network only - bypass cache completely
    event.respondWith(fetch(event.request));
});
