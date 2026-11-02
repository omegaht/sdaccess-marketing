(function () {
  'use strict';

  // ═══ CONFIGURACIÓN DE CONTACTO ═══
  // Número de WhatsApp: código de país + número, solo dígitos (ej.: '50761234567').
  // Mientras esté vacío, el botón flotante no aparece y el formulario se envía por correo.
  var WHATSAPP_NUMERO = '';
  var CORREO_CONTACTO = 'info@sdaccess.com.pa';

  var path = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.v2-nav__links a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('is-active');
    }
  });

  var toggle = document.querySelector('.v2-nav__toggle');
  var nav = document.querySelector('.v2-nav__links');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', nav.classList.contains('is-open'));
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { nav.classList.remove('is-open'); });
    });
  }

  document.querySelectorAll('.ed-carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.ed-carousel__track');
    var slides = carousel.querySelectorAll('.ed-carousel__slide');
    var prevBtn = carousel.querySelector('.ed-carousel__btn--prev');
    var nextBtn = carousel.querySelector('.ed-carousel__btn--next');
    var dotsContainer = carousel.querySelector('.ed-carousel__dots');
    var total = slides.length;
    var current = 0;

    if (!track || total === 0 || !dotsContainer) return;

    var detail = carousel.closest('.ed-detail');
    var title = detail && detail.querySelector('h2');
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carrusel');
    carousel.setAttribute('aria-label', 'Galería' + (title ? ': ' + title.textContent.trim() : ''));

    if (total === 1) {
      carousel.classList.add('is-single');
      return;
    }

    // El track es desplazable: se puede enfocar y mover con las flechas del teclado
    track.setAttribute('tabindex', '0');
    track.setAttribute('aria-label', 'Fotos, use las flechas para cambiar');

    var count = document.createElement('p');
    count.className = 'ed-carousel__count';
    count.setAttribute('aria-live', 'polite');
    carousel.appendChild(count);

    slides.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ed-carousel__dot';
      dot.setAttribute('aria-label', 'Ir a la imagen ' + (i + 1) + ' de ' + total);
      dot.addEventListener('click', function () { goTo(i); });
      dotsContainer.appendChild(dot);
    });

    var dots = dotsContainer.querySelectorAll('.ed-carousel__dot');

    function setActive(index) {
      current = index;
      count.textContent = (index + 1) + ' / ' + total;
      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === index);
        if (i === index) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    function goTo(index) {
      var i = (index + total) % total;
      track.scrollTo({ left: i * track.clientWidth });
      setActive(i);
    }

    // Swipe, trackpad o teclado mueven el track; los puntos siguen la posición real
    var ticking = false;
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== current && i >= 0 && i < total) setActive(i);
      });
    }, { passive: true });

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
    setActive(0);
  });

  var tabs = document.querySelector('.ed-filters');
  if (tabs) {
    var projects = document.querySelectorAll('.ed-proj');
    var status = document.getElementById('projects-status');
    tabs.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.filter;
        var shown = 0;
        tabs.querySelectorAll('button').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        projects.forEach(function (card) {
          var match = cat === 'all' || card.dataset.category === cat;
          card.classList.toggle('is-hidden', !match);
          if (match) shown++;
        });
        if (status) status.textContent = 'Mostrando ' + shown + (shown === 1 ? ' proyecto' : ' proyectos');
      });
    });
  }

  // Videos en bucle: botón de pausa (WCAG 2.2.2) y sin autoplay con movimiento reducido
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('video[autoplay]').forEach(function (video) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ed-video-toggle';
    btn.setAttribute('aria-label', 'Pausar video');
    btn.innerHTML = '<svg class="icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>' +
      '<svg class="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>';

    function sync() {
      btn.setAttribute('aria-pressed', video.paused ? 'true' : 'false');
      btn.setAttribute('aria-label', video.paused ? 'Reproducir video' : 'Pausar video');
    }

    var userStarted = false;
    var userPaused = false;
    if (reduceMotion) {
      video.autoplay = false;
      video.pause();
    }

    btn.addEventListener('click', function () {
      userStarted = true;
      userPaused = !video.paused;
      if (video.paused) video.play(); else video.pause();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            if (!video.paused) video.pause();
          } else if (video.paused && !userPaused && (!reduceMotion || userStarted)) {
            var playing = video.play();
            if (playing && playing.catch) playing.catch(function () {});
          }
        });
      }, { threshold: 0.5 }).observe(video);
    }
    video.addEventListener('play', function () {
      // el autoplay puede arrancar después de quitar el atributo
      if (reduceMotion && !userStarted) video.pause();
      sync();
    });
    video.addEventListener('pause', sync);
    sync();
    video.parentNode.appendChild(btn);
  });

  document.querySelectorAll('.v2-scroll-top').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  var scrollTopBtns = document.querySelectorAll('.v2-scroll-top');
  if (scrollTopBtns.length) {
    var onScroll = function () {
      var show = window.scrollY > 420;
      scrollTopBtns.forEach(function (btn) {
        btn.classList.toggle('is-visible', show);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  // ── WhatsApp ──
  function whatsappUrl(texto) {
    return 'https://wa.me/' + WHATSAPP_NUMERO + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }

  if (WHATSAPP_NUMERO) {
    var wa = document.createElement('a');
    wa.className = 'ed-wa-float v2-wa-float';
    wa.href = whatsappUrl('Hola SD ACCESS, quisiera información sobre sus soluciones de estacionamiento.');
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.setAttribute('aria-label', 'Escríbanos por WhatsApp');
    wa.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
      '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 0 1 12 4z"/>' +
      '<path d="M9.2 7.5c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.2s.9 2.5 1 2.7c.2.2 1.8 2.8 4.4 3.8 2.2.8 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3l-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.3-.1-1-.4-2-1.2-.7-.6-1.2-1.4-1.3-1.7-.1-.2 0-.4.1-.5l.4-.4.3-.4c.1-.2 0-.3 0-.4l-.8-1.9z"/>' +
      '</svg><span>WhatsApp</span>';
    document.body.appendChild(wa);

    document.querySelectorAll('.js-whatsapp-item').forEach(function (li) { li.hidden = false; });
    document.querySelectorAll('.js-whatsapp-link').forEach(function (a) { a.href = whatsappUrl(); });
  }

  // ── Formulario "Cotice su proyecto" ──
  var form = document.getElementById('cotizacion-form');
  if (form) {
    var submitBtn = form.querySelector('.js-cotizacion-submit');
    var mailLink = form.querySelector('.js-cotizacion-mail');
    var errorBox = document.getElementById('cotizacion-error');

    if (WHATSAPP_NUMERO) {
      submitBtn.textContent = 'Enviar por WhatsApp';
      mailLink.hidden = false;
    } else {
      submitBtn.textContent = 'Enviar por correo';
    }

    var armarMensaje = function () {
      var d = new FormData(form);
      var lineas = ['Solicitud de cotización — sitio web SD ACCESS', ''];
      lineas.push('Nombre: ' + (d.get('nombre') || '').trim());
      if ((d.get('empresa') || '').trim()) lineas.push('Empresa: ' + d.get('empresa').trim());
      if ((d.get('telefono') || '').trim()) lineas.push('Teléfono: ' + d.get('telefono').trim());
      if (d.get('tipo')) lineas.push('Tipo de instalación: ' + d.get('tipo'));
      lineas.push('', 'Necesidad:', (d.get('mensaje') || '').trim());
      return lineas.join('\n');
    };

    var validar = function () {
      var ok = true;
      ['nombre', 'mensaje'].forEach(function (name) {
        var campo = form.elements[name];
        var vacio = !campo.value.trim();
        campo.classList.toggle('is-invalid', vacio);
        if (vacio) {
          campo.setAttribute('aria-invalid', 'true');
          campo.setAttribute('aria-describedby', 'cotizacion-error');
          ok = false;
        } else {
          campo.removeAttribute('aria-invalid');
          campo.removeAttribute('aria-describedby');
        }
      });
      errorBox.hidden = ok;
      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first) first.focus();
      }
      return ok;
    };

    var enviarCorreo = function () {
      var asunto = 'Cotización — ' + form.elements.nombre.value.trim();
      window.location.href = 'mailto:' + CORREO_CONTACTO +
        '?subject=' + encodeURIComponent(asunto) +
        '&body=' + encodeURIComponent(armarMensaje());
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validar()) return;
      if (WHATSAPP_NUMERO) {
        window.open(whatsappUrl(armarMensaje()), '_blank', 'noopener');
      } else {
        enviarCorreo();
      }
    });

    mailLink.addEventListener('click', function (e) {
      e.preventDefault();
      if (validar()) enviarCorreo();
    });
  }
  // ═══ Sistema editorial (css/editorial.css) ═══
  var root = document.documentElement;

  // Menú móvil y enlace activo
  var edToggle = document.querySelector('.ed-toggle');
  var edNav = document.getElementById('site-nav');
  if (edNav) {
    edNav.querySelectorAll('a').forEach(function (link) {
      if (link.getAttribute('href') === path) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  if (edToggle && edNav) {
    var setMenu = function (open) {
      edNav.classList.toggle('is-open', open);
      edToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    edToggle.addEventListener('click', function () { setMenu(!edNav.classList.contains('is-open')); });
    edNav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && edNav.classList.contains('is-open')) { setMenu(false); edToggle.focus(); }
    });
    document.addEventListener('click', function (e) {
      if (!edNav.contains(e.target) && !edToggle.contains(e.target)) setMenu(false);
    });
  }

  // Entradas al hacer scroll (.fu, .frame, .sw, .widen, .widenc, .mapin, .st)
  if (root.classList.contains('js')) {
    var edSel = '.fu, .frame, .sw, .widen, .widenc, .mapin, .st';
    var edEls = document.querySelectorAll(edSel);
    var showAll = function () { edEls.forEach(function (el) { el.classList.add('in'); }); };
    if (reduceMotion || !('IntersectionObserver' in window) || window.innerHeight >= root.scrollHeight - 2) {
      showAll();
    } else {
      var edIO = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
      edEls.forEach(function (el) { edIO.observe(el); });
    }
  }

  // Footer "cortina": los elementos entran cuando el footer queda a la vista
  var edFooter = document.querySelector('.ed-footer');
  if (edFooter && !reduceMotion) {
    var onFooterScroll = function () {
      var th = edFooter.offsetHeight * 0.55;
      var near = window.innerHeight + window.scrollY >= root.scrollHeight - th;
      edFooter.classList.toggle('is-out', !near);
    };
    onFooterScroll();
    window.addEventListener('scroll', onFooterScroll, { passive: true });
    window.addEventListener('resize', onFooterScroll);
  }

  // Foco de luz que sigue al cursor en los bloques oscuros
  if (!reduceMotion && window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('[data-spot]').forEach(function (el) {
      var tints = el.querySelectorAll('.tint:not(h2), .tint-soft, .tint-dim, h2.tint .w > span');
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        el.style.setProperty('--mx', x + 'px');
        el.style.setProperty('--my', y + 'px');
        tints.forEach(function (t) {
          var q = t.getBoundingClientRect();
          t.style.setProperty('--hx', (e.clientX - q.left) + 'px');
          t.style.setProperty('--hy', (e.clientY - q.top) + 'px');
        });
      });
    });
  }

  // Catálogo: resalta la categoría visible
  var catLinks = document.querySelectorAll('.ed-catnav a');
  if (catLinks.length) {
    var catSecs = Array.prototype.map.call(catLinks, function (a) { return document.querySelector(a.getAttribute('href')); });
    var spy = function () {
      var cur = 0;
      catSecs.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < 200) cur = i; });
      catLinks.forEach(function (a, i) {
        a.classList.toggle('is-active', i === cur);
        if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    };
    spy();
    window.addEventListener('scroll', spy, { passive: true });
  }

  // Sectores: recorrido automático con pausa (WCAG 2.2.2)
  document.querySelectorAll('[data-sectors]').forEach(function (box) {
    var tabs = box.querySelectorAll('.ed-tab');
    var panels = box.querySelectorAll('.ed-panel');
    var list = box.querySelector('.ed-sector-list');
    var pauseBtn = box.querySelector('[data-pause]');
    if (!tabs.length || tabs.length !== panels.length) return;
    var active = 0;

    function show(i, animate) {
      active = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
      panels.forEach(function (p, k) {
        p.hidden = k !== i;
        p.classList.remove('panel-in');
        if (k === i && animate && !reduceMotion) { void p.offsetWidth; p.classList.add('panel-in'); }
      });
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k, true); });
      var prog = t.querySelector('.ed-prog');
      if (prog) prog.addEventListener('animationend', function () { show((active + 1) % tabs.length, true); });
    });
    if (pauseBtn) {
      if (reduceMotion) pauseBtn.hidden = true;
      pauseBtn.addEventListener('click', function () {
        var paused = list.classList.toggle('is-paused');
        pauseBtn.textContent = paused ? 'Reanudar recorrido' : 'Pausar recorrido';
      });
    }
    show(0, false);
  });
})();
