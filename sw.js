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
  "./js/download.js"
];


self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("anime-watched-v1").then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});
