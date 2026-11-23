/* Oasis Psique — Service Worker (PWA)
   Estrategia: stale-while-revalidate para recursos del mismo origen.
   Se sirve lo que hay en caché al instante y en segundo plano se
   descarga la versión nueva, que queda lista para la siguiente visita.
   Junto con skipWaiting + clients.claim, las actualizaciones llegan
   sin esperar a que el navegador decida revisar (clave en teléfonos
   que cachean fuerte). Sin conexión, las navegaciones responden
   desde la caché.
   Para forzar una limpieza total, sube el número de CACHE. */
var CACHE = 'oasis-v5';

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      /* Precarga mínima: la portada, para que la app abra sin red
         incluso en la primera visita sin conexión posterior. */
      return cache.addAll(['./', './index.html', './manifest.webmanifest']);
    }).catch(function () { /* sin red en la instalación: se sigue */ })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (nombres) {
      return Promise.all(nombres.map(function (nombre) {
        if (nombre !== CACHE) return caches.delete(nombre);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* externos: red directa */

  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (enCache) {
        var red = fetch(req).then(function (resp) {
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        }).catch(function () {
          /* Sin conexión: si es una navegación, sirve la página
             pedida desde caché o, en su defecto, la portada. */
          if (req.mode === 'navigate') {
            return enCache || cache.match('./index.html');
          }
          return enCache;
        });
        /* Stale-while-revalidate: caché ya, red en segundo plano. */
        return enCache || red;
      });
    })
  );
});
