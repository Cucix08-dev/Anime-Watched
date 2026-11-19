const CACHE_NAME = "anime-watched-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./style.css",
  "./script.js",
  "./css/animePage.css",
  "./css/header.css",
  "./css/listaUtente.css",
  "./js/animelist.js",
  "./js/download.js",
  "./icona-192.png",
  "./icona-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
