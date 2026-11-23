/* Oasis Psique — Service Worker (PWA)
   Estrategia: red primero para HTML y CSS (las páginas y los estilos
   se ven SIEMPRE en su versión más reciente cuando hay conexión; la
   caché solo responde sin conexión). Imágenes y demás recursos:
   stale-while-revalidate (caché al instante, red en segundo plano).
   Junto con skipWaiting + clients.claim, las actualizaciones llegan
   sin esperar a que el navegador decida revisar (clave en teléfonos
   que cachean fuerte).
   Para forzar una limpieza total, sube el número de CACHE. */
var CACHE = 'oasis-v7';

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

  var esDocumento = req.mode === 'navigate' ||
    /\.(html|css)$/.test(url.pathname) || url.pathname.endsWith('/');

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
        /* HTML/CSS: red primero (la versión nueva se ve al momento).
           Resto: stale-while-revalidate (caché ya, red en segundo plano). */
        return esDocumento ? red : (enCache || red);
      });
    })
  );
});
