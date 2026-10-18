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

  /* El placeholder del mensaje depende del área elegida: solo Marcas lleva una guía */
  var selectArea = document.getElementById('area');
  var campoMensaje = document.getElementById('mensaje');
  var PLACEHOLDER_MARCAS = 'Para revisar si tu marca está disponible, contame:\n1. El nombre de la marca\n2. A qué se dedica tu emprendimiento\n3. Si tenés logo o es solo el nombre';
  function actualizarPlaceholder() {
    if (!selectArea || !campoMensaje) return;
    campoMensaje.placeholder = selectArea.value === 'Marcas (Propiedad intelectual)' ? PLACEHOLDER_MARCAS : '';
  }
  if (selectArea) selectArea.addEventListener('change', actualizarPlaceholder);

  /* "Consultá sobre [área]" deja elegida esa área en el formulario */
  document.querySelectorAll('[data-area]').forEach(function (link) {
    link.addEventListener('click', function () {
      if (selectArea) selectArea.value = link.getAttribute('data-area');
      actualizarPlaceholder();
    });
  });
  // Estado inicial (y al volver con el formulario ya completado por el navegador)
  actualizarPlaceholder();

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

  var WHATSAPP = '5491139180760';

  // Mensaje que viaja por WhatsApp con lo que completó la persona
  function mensajeWhatsApp() {
    var texto = form.mensaje.value.trim();
    var lineas = [
      'Hola Martin, quiero hacer una consulta.',
      '',
      'Nombre: ' + form.nombre.value.trim(),
      'Teléfono: ' + form.telefono.value.trim(),
      'Área: ' + form.area.value
    ];
    if (texto) lineas.push('', 'Consulta:', texto);
    return lineas.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var invalidos = requeridos.filter(function (c) { return !validar(c); });
    if (invalidos.length) {
      invalidos[0].focus();
      estado.textContent = '';
      return;
    }

    var waUrl = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(mensajeWhatsApp());
    var nombre = form.nombre.value.trim().split(' ')[0].replace(/[<>&"]/g, '');

    boton.disabled = true;
    boton.textContent = 'Enviando…';
    estado.className = 'form__estado';
    estado.textContent = '';

    // Se abre WhatsApp en el mismo gesto del clic (así los navegadores no lo bloquean).
    // Si no se abre, el botón de la pantalla de confirmación lo hace.
    window.open(waUrl, '_blank', 'noopener');

    // Respaldo: la consulta también llega por el formulario
    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      mostrarConfirmacion('Consulta enviada', 'Gracias, ' + nombre + '.',
        'Recibí tu consulta. Se abrió WhatsApp con el mensaje listo: tocá Enviar ahí para que me llegue más rápido. Si no se abrió, usá este botón.');
    }).catch(function () {
      // El formulario falló, pero el mensaje ya quedó listo en WhatsApp
      mostrarConfirmacion('Último paso', 'Falta un paso, ' + nombre + '.',
        'No pude enviar el formulario, pero tu consulta quedó lista en WhatsApp. Tocá el botón para enviarla.');
    });

    function mostrarConfirmacion(rotulo, titulo, texto) {
      form.innerHTML =
        '<div class="exito" tabindex="-1">' +
        '<p class="rotulo">' + rotulo + '</p>' +
        '<h3>' + titulo + '</h3>' +
        '<p>' + texto + '</p>' +
        '<a class="btn" href="' + waUrl + '" target="_blank" rel="noopener">Enviar por WhatsApp</a>' +
        '</div>';
      form.querySelector('.exito').focus();
    }
  });
})();