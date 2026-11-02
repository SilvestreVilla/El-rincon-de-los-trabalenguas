// HU-22 · Juego «Arma el trabalenguas» (etapa 2 de la ruta: Ordena)
import { el } from './ui.js';
import { iniciarPaginaJuego, registrarEtapa } from './ruta.js';
import { fragmentar, revisar, revolver } from './logica-armar.js';

const $ = (id) => document.getElementById(id);

iniciarPaginaJuego('ordena', (t, id) => {
  const banco = $('banco');
  const respuesta = $('respuesta');
  const estado = $('armar-estado');
  const deshacer = $('deshacer');
  const reiniciar = $('reiniciar');

  const correctos = fragmentar(t.texto, t.dificultad);
  const orden = revolver(correctos);
  let elegidos = []; // fragmentos en el orden que los tocó el usuario
  let terminado = false;

  function pintar(marcas = null) {
    const usados = new Set(elegidos.map((f) => f.id));
    banco.replaceChildren(...orden.map((f) => {
      const boton = el('button', { type: 'button', class: 'ficha', disabled: usados.has(f.id) || terminado }, f.texto);
      boton.addEventListener('click', () => elegir(f));
      return boton;
    }));
    respuesta.replaceChildren(...elegidos.map((f, i) => el('li', {
      class: `ficha ficha-colocada${marcas ? (marcas[i] ? ' bien' : ' mal') : ''}`,
    }, f.texto, marcas && !marcas[i] ? el('span', { class: 'sr-only' }, ' (fuera de lugar)') : null)));
    respuesta.classList.toggle('vacia', elegidos.length === 0);
    deshacer.disabled = elegidos.length === 0 || terminado;
    reiniciar.disabled = elegidos.length === 0 || terminado;
  }

  function elegir(fragmento) {
    if (terminado) return;
    elegidos.push(fragmento);
    estado.textContent = '';
    if (elegidos.length < correctos.length) {
      pintar();
      // Mantener el foco en el banco para seguir con el teclado.
      banco.querySelector('button:not(:disabled)')?.focus();
      return;
    }
    const marcas = revisar(correctos, elegidos);
    const errores = marcas.filter((m) => !m).length;
    if (errores === 0) {
      terminado = true;
      pintar(marcas);
      estado.textContent = '¡Correcto! Lo armaste en orden.';
      registrarEtapa($('resultado'), id, 'ordena');
    } else {
      pintar(marcas);
      estado.textContent = errores === 1
        ? 'Casi: hay 1 fragmento fuera de lugar (marcado en rojo). Deshaz o reinicia para corregirlo.'
        : `Hay ${errores} fragmentos fuera de lugar (marcados en rojo). Deshaz o reinicia para corregirlos.`;
      deshacer.focus();
    }
  }

  deshacer.addEventListener('click', () => {
    elegidos.pop();
    estado.textContent = '';
    pintar();
  });
  reiniciar.addEventListener('click', () => {
    elegidos = [];
    estado.textContent = '';
    pintar();
    banco.querySelector('button')?.focus();
  });

  $('armar-total').textContent = String(correctos.length);
  pintar();
});
