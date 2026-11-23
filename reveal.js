/* Oasis Psique — aparición progresiva al hacer scroll.
   Inocuo por diseño: el estado oculto inicial lo pone este JS
   (clase .reveal-on en <html>); si el JS falla o el navegador no
   tiene IntersectionObserver, todo el contenido se ve normal.
   Respeta prefers-reduced-motion: sin animación. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  var els = document.querySelectorAll(
    '.nav-card, .nav-destacada, .nav-oficial, .sec-head, .agente-card, ' +
    '.tarjeta, .vitrina, .question, .technique-item, .content, .accordion'
  );
  if (!els.length) return;
  document.documentElement.classList.add('reveal-on');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      io.unobserve(el);
      el.classList.add('revelado');
      /* Al terminar la transición se retiran las clases para que
         el hover y los transform propios de cada tarjeta manden. */
      setTimeout(function () { el.classList.remove('revelar', 'revelado'); }, 480);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
  els.forEach(function (el) { el.classList.add('revelar'); io.observe(el); });
})();

/* ============================================================
   PWA — Oasis Psique como app web descargable
   Sección independiente y defensiva: registra el service worker
   y ofrece el botón de instalación SOLO cuando el navegador lo
   permite (Android/Chrome) o con instrucciones (iOS/Safari).
   Si algo falla, el sitio queda exactamente como está.
   ============================================================ */
(function () {
  try {
    /* --- 1. Registro del service worker --- */
    if ('serviceWorker' in navigator &&
        (location.protocol === 'https:' || location.protocol === 'http:')) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {
          /* Sin SW el sitio sigue funcionando igual. */
        });
      });
    }

    /* --- 2. Botón de instalación --- */
    var yaInstalada =
      (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true;
    if (yaInstalada) return;
    try { if (sessionStorage.getItem('oasis-pwa-oculto')) return; } catch (e) {}

    var estilo = document.createElement('style');
    estilo.textContent =
      '.pwa-instalar{position:fixed;left:50%;transform:translateX(-50%);' +
      'bottom:calc(14px + env(safe-area-inset-bottom, 0px));z-index:999;' +
      'display:none;align-items:center;gap:.55em;background:#800020;color:#fff;' +
      'border:1px solid #C9A227;border-radius:999px;padding:.7em 1.25em;' +
      'font:600 .95rem/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;' +
      'box-shadow:0 8px 24px rgba(67,0,19,.35);cursor:pointer}' +
      '.pwa-instalar.visible{display:inline-flex}' +
      '.pwa-instalar:active{background:#5f0018}' +
      '.pwa-instalar .pwa-x{font-weight:400;opacity:.75;margin-left:.25em;' +
      'padding:0 .15em}' +
      'html.pwa-visible body{padding-bottom:84px}' +
      '.pwa-ayuda{position:fixed;left:50%;transform:translateX(-50%);' +
      'bottom:calc(14px + env(safe-area-inset-bottom, 0px));z-index:1000;' +
      'display:none;width:min(92vw,380px);background:#FBF7EF;color:#430013;' +
      'border:1px solid #C9A227;border-radius:18px;padding:18px 20px;' +
      'box-shadow:0 12px 32px rgba(67,0,19,.35);' +
      'font:400 .95rem/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}' +
      '.pwa-ayuda.visible{display:block}' +
      '.pwa-ayuda strong{color:#800020}' +
      '.pwa-ayuda ol{margin:.5em 0 .8em 1.2em;padding:0}' +
      '.pwa-ayuda button{background:#800020;color:#fff;border:0;' +
      'border-radius:999px;padding:.55em 1.2em;font:600 .9rem system-ui;' +
      'cursor:pointer}';
    document.head.appendChild(estilo);

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'pwa-instalar';
    boton.innerHTML = 'Instalar la app <span class="pwa-x" aria-hidden="true">×</span>';
    boton.setAttribute('aria-label', 'Instalar Oasis Psique como aplicación');
    document.body.appendChild(boton);

    var ayuda = document.createElement('div');
    ayuda.className = 'pwa-ayuda';
    ayuda.setAttribute('role', 'dialog');
    ayuda.setAttribute('aria-label', 'Cómo instalar Oasis Psique en iPhone');
    ayuda.innerHTML =
      '<strong>Instala Oasis Psique en tu iPhone</strong>' +
      '<ol><li>Toca el botón <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba).</li>' +
      '<li>Elige <strong>«Agregar a pantalla de inicio»</strong>.</li>' +
      '<li>Confirma con <strong>«Agregar»</strong>.</li></ol>' +
      '<button type="button">Entendido</button>';
    document.body.appendChild(ayuda);

    function mostrar() {
      boton.classList.add('visible');
      document.documentElement.classList.add('pwa-visible');
    }
    function ocultar() {
      boton.classList.remove('visible');
      ayuda.classList.remove('visible');
      document.documentElement.classList.remove('pwa-visible');
      try { sessionStorage.setItem('oasis-pwa-oculto', '1'); } catch (e) {}
    }
    ayuda.querySelector('button').addEventListener('click', ocultar);

    /* Android / Chrome de escritorio: el navegador ofrece instalar. */
    var promptGuardado = null;
    window.addEventListener('beforeinstallprompt', function (ev) {
      ev.preventDefault();
      promptGuardado = ev;
      mostrar();
    });
    window.addEventListener('appinstalled', ocultar);

    /* iOS / Safari: no hay prompt; se muestran las instrucciones. */
    var ua = navigator.userAgent || '';
    var esIOS = /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var esSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    if (esIOS && esSafari) mostrar();

    boton.addEventListener('click', function (ev) {
      if (ev.target.classList.contains('pwa-x')) { ocultar(); return; }
      if (promptGuardado) {
        promptGuardado.prompt();
        promptGuardado.userChoice.then(function () {
          promptGuardado = null;
          ocultar();
        });
      } else if (esIOS) {
        ayuda.classList.add('visible');
        boton.classList.remove('visible');
      }
    });
  } catch (e) {
    /* La capa PWA nunca debe romper el sitio. */
  }
})();
