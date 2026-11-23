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
