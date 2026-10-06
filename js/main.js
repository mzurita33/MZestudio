// MZ Estudio Jurídico: menú, fades, preselección de área y formulario (Formspree)
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* Menú en celular */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  if (menuBtn && menu) {
    var setMenu = function (abierto) {
      menuBtn.setAttribute('aria-expanded', String(abierto));
      menuBtn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('abierto', abierto);
    };
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* Fades suaves al entrar: solo se ocultan los bloques que todavía no están en pantalla */
  var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bloques = document.querySelectorAll('.revelar');
  if (!reducir && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove('oculto');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    bloques.forEach(function (b) {
      if (b.getBoundingClientRect().top > window.innerHeight) {
        b.classList.add('oculto');
        io.observe(b);
      }
    });
  }

  /* "Consultá sobre [área]" deja elegida esa área en el formulario */
  var selectArea = document.getElementById('area');
  document.querySelectorAll('[data-area]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (selectArea) selectArea.value = link.getAttribute('data-area');
    });
  });

  /* Formulario de contacto */
  var form = document.getElementById('form-contacto');
  if (!form) return;
  var estado = document.getElementById('form-estado');
  var boton = form.querySelector('button[type="submit"]');

  var mensajes = {
    nombre: 'Escribí tu nombre para saber cómo dirigirme a vos.',
    telefono: 'Dejame un teléfono para coordinar la entrevista.',
    mensaje: 'Contame brevemente tu consulta.',
    consentimiento: 'Para enviar la consulta tenés que aceptar la Política de privacidad.'
  };

  function validar(campo) {
    var error = document.getElementById(campo.id + '-error');
    if (!error) return true;
    var ok = campo.type === 'checkbox' ? campo.checked : campo.value.trim() !== '' && campo.checkValidity();
    campo.setAttribute('aria-invalid', String(!ok));
    error.textContent = ok ? '' : mensajes[campo.name];
    error.hidden = ok;
    return ok;
  }

  var requeridos = Array.prototype.slice.call(form.querySelectorAll('[required]'));
  requeridos.forEach(function (campo) {
    // Validación al salir del campo; el error se limpia apenas se corrige
    campo.addEventListener('blur', function () { if (campo.type !== 'checkbox') validar(campo); });
    campo.addEventListener('input', function () { if (campo.getAttribute('aria-invalid') === 'true') validar(campo); });
    campo.addEventListener('change', function () { if (campo.type === 'checkbox') validar(campo); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var invalidos = requeridos.filter(function (c) { return !validar(c); });
    if (invalidos.length) {
      invalidos[0].focus();
      estado.textContent = '';
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Enviando…';
    estado.className = 'form__estado';
    estado.textContent = '';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var nombre = form.nombre.value.trim().split(' ')[0];
      form.innerHTML =
        '<div class="exito" tabindex="-1">' +
        '<p class="rotulo">Pedido enviado</p>' +
        '<h3>Gracias, ' + nombre.replace(/[<>&"]/g, '') + '.</h3>' +
        '<p>Recibí tu mensaje. Te escribo a la brevedad para coordinar día y horario de la entrevista.</p>' +
        '</div>';
      form.querySelector('.exito').focus();
    }).catch(function () {
      boton.disabled = false;
      boton.textContent = 'Enviar consulta';
      estado.className = 'form__estado form__estado--error';
      estado.textContent = 'No se pudo enviar tu pedido. Revisá tu conexión y probá de nuevo, o escribime por WhatsApp al 11 3918-0760.';
    });
  });
})();
