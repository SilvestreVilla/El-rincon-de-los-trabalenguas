// HU-23 · Karaoke de velocidad (etapa 1 de la ruta: Lee)
import { el } from './ui.js';
import { palabras } from './texto.js';
import { iniciarPaginaJuego, registrarEtapa } from './ruta.js';
import { SIGUIENTE_VELOCIDAD, VELOCIDAD_PARA_SUPERAR, VELOCIDADES, duracionTotal, tiempos } from './logica-karaoke.js';

const $ = (id) => document.getElementById(id);

iniciarPaginaJuego('lee', (t, id) => {
  const lista = palabras(t.texto);
  const pantalla = $('karaoke-texto');
  const iniciar = $('karaoke-iniciar');
  const reiniciar = $('karaoke-reiniciar');
  const estado = $('karaoke-estado');
  const confirmar = $('karaoke-confirmar');
  const spans = lista.map((p) => el('span', { class: 'karaoke-palabra' }, p));
  pantalla.replaceChildren(...spans.flatMap((s, i) => (i ? [' ', s] : [s])));

  let indice = -1; // palabra iluminada
  let reloj = null;
  let corriendo = false;
  let superada = false;

  const velocidad = () => document.querySelector('input[name="velocidad"]:checked').value;
  const pintarDuraciones = () => {
    for (const [clave, v] of Object.entries(VELOCIDADES)) {
      $(`duracion-${clave}`).textContent = `${(duracionTotal(lista, v.ppm) / 1000).toFixed(1)} s`;
    }
  };

  function pintar() {
    spans.forEach((s, i) => {
      s.classList.toggle('actual', i === indice);
      s.classList.toggle('leida', i < indice);
    });
  }

  function paso() {
    indice += 1;
    pintar();
    if (indice >= lista.length) return terminar();
    reloj = setTimeout(paso, tiempos(lista, VELOCIDADES[velocidad()].ppm)[indice]);
  }

  function terminar() {
    corriendo = false;
    clearTimeout(reloj);
    iniciar.textContent = 'Leer otra vez';
    habilitarVelocidades(true);
    const v = velocidad();
    if (v === VELOCIDAD_PARA_SUPERAR) {
      estado.textContent = '¿Lo leíste completo en voz alta, sin trabarte?';
      if (!superada) confirmar.classList.remove('oculto');
    } else {
      const siguiente = SIGUIENTE_VELOCIDAD[v];
      document.querySelector(`input[name="velocidad"][value="${siguiente}"]`).checked = true;
      estado.textContent = `¡Bien! Ahora intenta en velocidad ${VELOCIDADES[siguiente].nombre}. La etapa se supera en Rápida.`;
    }
  }

  function habilitarVelocidades(si) {
    document.querySelectorAll('input[name="velocidad"]').forEach((r) => { r.disabled = !si; });
  }

  iniciar.addEventListener('click', () => {
    if (corriendo) { // Pausa
      corriendo = false;
      clearTimeout(reloj);
      iniciar.textContent = 'Continuar';
      estado.textContent = 'En pausa.';
      return;
    }
    if (indice >= lista.length || indice === -1) {
      indice = -1;
      confirmar.classList.add('oculto');
    }
    corriendo = true;
    habilitarVelocidades(false);
    iniciar.textContent = 'Pausa';
    reiniciar.disabled = false;
    estado.textContent = `Leyendo en velocidad ${VELOCIDADES[velocidad()].nombre}…`;
    paso();
  });

  reiniciar.addEventListener('click', () => {
    corriendo = false;
    clearTimeout(reloj);
    indice = -1;
    pintar();
    habilitarVelocidades(true);
    iniciar.textContent = 'Iniciar';
    reiniciar.disabled = true;
    confirmar.classList.add('oculto');
    estado.textContent = '';
  });

  confirmar.addEventListener('click', async () => {
    confirmar.disabled = true;
    const r = await registrarEtapa($('resultado'), id, 'lee');
    if (r) {
      superada = true;
      confirmar.classList.add('oculto');
    }
    confirmar.disabled = false;
  });

  pintarDuraciones();
});
