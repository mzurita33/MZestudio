// MZ Estudio Jurídico, versión 2: movimiento al hacer scroll.
// Se carga después de main.js. Si algo falla, el sitio se ve completo igual (los estados ocultos dependen de la clase "js").
(function () {
  'use strict';

  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* Retraso escalonado entre elementos hermanos que se revelan juntos (las tarjetas de áreas) */
  document.querySelectorAll('.areas').forEach(function (grupo) {
    grupo.querySelectorAll(':scope > .revelar').forEach(function (el, i) {
      el.style.setProperty('--d', (i * 0.16) + 's');
    });
  });

  /* Las tarjetas vuelven a su transición corta una vez que terminaron de entrar (para que el hover no se sienta lento) */
  document.querySelectorAll('.area').forEach(function (a) {
    if (!a.classList.contains('oculto')) { a.classList.add('listo'); return; }
    a.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'opacity') a.classList.add('listo');
    });
  });

  /* Títulos de sección: se parten en palabras que suben una a una */
  if (!reducir) {
    document.querySelectorAll('.seccion__cabeza h2').forEach(function (h) {
      var texto = h.textContent.trim();
      h.textContent = '';
      texto.split(/\s+/).forEach(function (palabra, i, todas) {
        var w = document.createElement('span');
        var in_ = document.createElement('span');
        w.className = 'w';
        in_.textContent = palabra;
        in_.style.setProperty('--i', i);
        w.appendChild(in_);
        h.appendChild(w);
        if (i < todas.length - 1) h.appendChild(document.createTextNode(' '));
      });
      h.classList.add('split');
    });
  }

  /* Marca como visibles los bloques que usan animaciones propias */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.split, .pasos').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.split, .pasos').forEach(function (el) { el.classList.add('visible'); });
  }

  /* Barra de progreso, header que se esconde al bajar y parallax de la foto */
  var barra = document.querySelector('.progreso');
  var header = document.querySelector('.header');
  var foto = document.querySelector('.quien__foto');
  var imagen = foto ? foto.querySelector('img') : null;
  var ultimoY = window.scrollY;
  var esperando = false;

  function actualizar() {
    esperando = false;
    var y = window.scrollY;
    var alto = root.scrollHeight - window.innerHeight;

    if (barra) barra.style.setProperty('--p', alto > 0 ? Math.min(1, y / alto) : 0);

    if (header) {
      var menuAbierto = document.querySelector('.menu-btn[aria-expanded="true"]');
      var bajando = y > ultimoY + 4;
      var subiendo = y < ultimoY - 4;
      if (y < 160 || subiendo || menuAbierto || header.contains(document.activeElement)) header.classList.remove('oculto');
      else if (bajando) header.classList.add('oculto');
    }
    ultimoY = y;

    if (imagen && !reducir) {
      var r = foto.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var progreso = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        imagen.style.setProperty('--py', Math.max(-1, Math.min(1, progreso)) * -26 + 'px');
      }
    }
  }

  function alScroll() {
    if (!esperando) { esperando = true; window.requestAnimationFrame(actualizar); }
  }
  window.addEventListener('scroll', alScroll, { passive: true });
  window.addEventListener('resize', alScroll);
  actualizar();
})();
