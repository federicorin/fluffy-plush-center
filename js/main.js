/* Fluffy Plush Center — interacciones
   1. Menú desplegable en celulares
   2. Sombra del encabezado al hacer scroll
   3. Cajitas sorpresa que se abren al tocarlas
   4. Panel de la misión con pestañas
   5. Botón para copiar el mail de contacto */

(() => {
  // ---------- 1. Menú ----------
  const encabezado = document.getElementById('encabezado');
  const botonMenu = encabezado.querySelector('.menu-boton');
  const menu = document.getElementById('menu');

  const cerrarMenu = () => {
    encabezado.classList.remove('encabezado--abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
  };

  botonMenu.addEventListener('click', () => {
    const abierto = encabezado.classList.toggle('encabezado--abierto');
    botonMenu.setAttribute('aria-expanded', String(abierto));
  });

  // Al elegir una sección, el menú se cierra solo
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) cerrarMenu();
  });

  // Tocar fuera del encabezado también lo cierra
  document.addEventListener('click', (e) => {
    if (!encabezado.contains(e.target)) cerrarMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && botonMenu.getAttribute('aria-expanded') === 'true') {
      cerrarMenu();
      botonMenu.focus();
    }
  });

  // ---------- 2. Sombra del encabezado ----------
  const marcarScroll = () => {
    encabezado.classList.toggle('encabezado--con-sombra', window.scrollY > 8);
  };
  window.addEventListener('scroll', marcarScroll, { passive: true });
  marcarScroll();

  // ---------- 3. Cajitas sorpresa ----------
  const cajitas = Array.from(document.querySelectorAll('.cajita'));
  const aviso = document.getElementById('sorpresa-aviso');
  const botonCerrar = document.getElementById('cerrar-cajitas');

  const hayAbiertas = () => cajitas.some((c) => c.getAttribute('aria-pressed') === 'true');

  cajitas.forEach((cajita) => {
    cajita.addEventListener('click', () => {
      const estabaAbierta = cajita.getAttribute('aria-pressed') === 'true';
      cajita.setAttribute('aria-pressed', String(!estabaAbierta));

      if (!estabaAbierta) {
        const nombre = cajita.querySelector('.cajita__nombre').textContent.trim();
        aviso.textContent = `¡Te eligió ${nombre}!`;
      } else if (!hayAbiertas()) {
        aviso.textContent = '';
      }
      botonCerrar.hidden = !hayAbiertas();
    });
  });

  botonCerrar.addEventListener('click', () => {
    cajitas.forEach((c) => c.setAttribute('aria-pressed', 'false'));
    aviso.textContent = '';
    botonCerrar.hidden = true;
    cajitas[0].focus();
  });

  // ---------- Panel de la misión (pestañas) ----------
  const historia = document.querySelector('.historia');
  if (historia) {
    const lista = historia.querySelector('.historia__lista');
    const pestanas = Array.from(historia.querySelectorAll('[role="tab"]'));
    const paneles = pestanas.map((t) => document.getElementById(t.getAttribute('aria-controls')));
    const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const esDeslizable = () => lista.scrollWidth > lista.clientWidth + 1;

    // En celular la lista es una fila deslizable: centra la pestaña elegida
    const centrar = (pestana) => {
      if (!esDeslizable()) return;
      const destino = pestana.offsetLeft - (lista.clientWidth - pestana.offsetWidth) / 2;
      lista.scrollTo({ left: destino, behavior: movimientoReducido ? 'auto' : 'smooth' });
    };

    // Desvanecido en los bordes: avisa que hay más opciones hacia el costado
    const actualizarBordes = () => {
      const max = lista.scrollWidth - lista.clientWidth;
      lista.style.setProperty('--fade-izq', lista.scrollLeft > 4 ? '32px' : '0px');
      lista.style.setProperty('--fade-der', lista.scrollLeft < max - 4 ? '32px' : '0px');
    };
    lista.addEventListener('scroll', actualizarBordes, { passive: true });
    window.addEventListener('resize', actualizarBordes);
    actualizarBordes();

    // Arrastrar con el mouse (con el dedo ya se desliza de forma nativa)
    let arrastre = null;
    let recienArrastrado = false;
    lista.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || !esDeslizable()) return;
      arrastre = { x: e.clientX, scroll: lista.scrollLeft, movido: false };
    });
    window.addEventListener('pointermove', (e) => {
      if (!arrastre) return;
      const dx = e.clientX - arrastre.x;
      if (!arrastre.movido && Math.abs(dx) > 5) {
        arrastre.movido = true;
        lista.classList.add('historia__lista--arrastrando');
      }
      if (arrastre.movido) lista.scrollLeft = arrastre.scroll - dx;
    });
    const soltar = () => {
      if (!arrastre) return;
      if (arrastre.movido) {
        // evita que soltar el arrastre sobre una pestaña la active sin querer
        recienArrastrado = true;
        setTimeout(() => { recienArrastrado = false; }, 0);
      }
      arrastre = null;
      lista.classList.remove('historia__lista--arrastrando');
    };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);

    const activar = (indice, conFoco) => {
      pestanas.forEach((pestana, i) => {
        const activa = i === indice;
        pestana.setAttribute('aria-selected', String(activa));
        pestana.tabIndex = activa ? 0 : -1;
        paneles[i].hidden = !activa;
        // Si el video queda oculto, se pausa
        if (!activa) paneles[i].querySelectorAll('video').forEach((v) => v.pause());
      });
      if (conFoco) pestanas[indice].focus({ preventScroll: true });
      centrar(pestanas[indice]);
    };

    pestanas.forEach((pestana, i) => {
      pestana.addEventListener('click', () => {
        if (recienArrastrado) return;
        historia.classList.add('historia--viva'); // la animación de entrada solo corre al cambiar de pestaña
        activar(i);
      });
      pestana.addEventListener('keydown', (e) => {
        const pasos = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
        let destino = null;
        if (e.key in pasos) destino = (i + pasos[e.key] + pestanas.length) % pestanas.length;
        if (e.key === 'Home') destino = 0;
        if (e.key === 'End') destino = pestanas.length - 1;
        if (destino !== null) {
          e.preventDefault();
          historia.classList.add('historia--viva');
          activar(destino, true);
        }
      });
    });
  }

  // ---------- Copiar el mail ----------
  // Útil cuando la compu no tiene un programa de correo configurado.
  const botonCopiar = document.getElementById('copiar-mail');
  if (botonCopiar) {
    const textoOriginal = botonCopiar.textContent;
    botonCopiar.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(botonCopiar.dataset.mail);
        botonCopiar.textContent = '¡Copiado!';
      } catch {
        botonCopiar.textContent = botonCopiar.dataset.mail; // si no se puede copiar, al menos se ve completo
      }
      setTimeout(() => { botonCopiar.textContent = textoOriginal; }, 2500);
    });
  }

  // ---------- Año del pie ----------
  document.getElementById('anio').textContent = new Date().getFullYear();
})();
