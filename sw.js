const CACHE_NAME = 'school-cache-v19'; 
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'simg.jpg',
  'gadwal-q.jpeg',
  'gadwal-april.jpeg',
  'QUERO_mascot.png',
  'ta3lem.jpg',
  'dev-img.jpg',
  'icon-192.png',
  'icon-512.png'
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});