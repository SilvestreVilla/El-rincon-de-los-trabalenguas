// HU-24 · Juego «Dilo en voz alta» (etapa 4 de la ruta: Dilo)
// Usa el reconocimiento de voz del navegador (Web Speech API, es-MX) si existe: Chrome y Edge.
// Si no existe o se niega el micrófono, ofrece autoevaluación. La app no graba ni guarda audio.
import { el } from './ui.js';
import { iniciarPaginaJuego, registrarEtapa } from './ruta.js';
import { compararDicho, UMBRAL } from './logica-dilo.js';

const $ = (id) => document.getElementById(id);
const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;

iniciarPaginaJuego('dilo', (t, id) => {
  const pasos = ['dilo-inicio', 'dilo-escuchando', 'dilo-resultado', 'dilo-auto'];
  const mostrar = (paso) => pasos.forEach((p) => $(p).classList.toggle('oculto', p !== paso));
  const estado = $('dilo-estado');
  let superada = false;

  async function superar() {
    if (superada) return;
    const r = await registrarEtapa($('resultado'), id, 'dilo');
    if (r) superada = true;
  }

  // ---------- Autoevaluación (sin micrófono) ----------
  function autoevaluacion(motivo = '') {
    $('dilo-auto-motivo').textContent = motivo;
    $('dilo-auto-texto').classList.add('oculto');
    $('dilo-auto-pregunta').classList.add('oculto');
    $('dilo-auto-listo').classList.remove('oculto');
    mostrar('dilo-auto');
    $('dilo-auto-listo').focus();
  }
  $('dilo-auto-listo').addEventListener('click', () => {
    $('dilo-auto-texto').textContent = `«${t.texto}»`;
    $('dilo-auto-texto').classList.remove('oculto');
    $('dilo-auto-pregunta').classList.remove('oculto');
    $('dilo-auto-listo').classList.add('oculto');
    $('dilo-auto-si').focus();
  });
  $('dilo-auto-si').addEventListener('click', superar);
  $('dilo-auto-no').addEventListener('click', () => {
    estado.textContent = 'Sin problema: repásalo en el karaoke y vuelve a intentarlo.';
    autoevaluacion($('dilo-auto-motivo').textContent);
  });
  $('dilo-usar-auto').addEventListener('click', () => autoevaluacion());

  // ---------- Reconocimiento de voz ----------
  if (!Reconocimiento) {
    $('dilo-empezar').classList.add('oculto');
    $('dilo-usar-auto').classList.add('oculto');
    autoevaluacion('Tu navegador no tiene reconocimiento de voz (funciona en Chrome y Edge). Puedes hacerlo con autoevaluación.');
    return;
  }

  let reconocedor = null;
  let finales = '';
  let parcial = '';
  let error = null;

  function empezar() {
    finales = '';
    parcial = '';
    error = null;
    estado.textContent = '';
    $('dilo-oido').textContent = '';
    reconocedor = new Reconocimiento();
    reconocedor.lang = 'es-MX';
    reconocedor.continuous = true;
    reconocedor.interimResults = true;
    reconocedor.onresult = (evento) => {
      parcial = '';
      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        const r = evento.results[i];
        if (r.isFinal) finales += ` ${r[0].transcript}`;
        else parcial += ` ${r[0].transcript}`;
      }
      $('dilo-oido').textContent = `${finales} ${parcial}`.trim();
    };
    reconocedor.onerror = (evento) => { error = evento.error; };
    reconocedor.onend = terminar;
    try {
      reconocedor.start();
    } catch (e) {
      console.error('No se pudo iniciar el reconocimiento', e);
      autoevaluacion('No pudimos usar el micrófono. Puedes hacerlo con autoevaluación.');
      return;
    }
    mostrar('dilo-escuchando');
    $('dilo-terminar').focus();
  }

  function terminar() {
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      return autoevaluacion('No hay permiso para usar el micrófono. Puedes hacerlo con autoevaluación (o dar permiso en el candado de la barra de direcciones).');
    }
    if (error === 'audio-capture') {
      return autoevaluacion('No encontramos un micrófono. Puedes hacerlo con autoevaluación.');
    }
    if (error === 'network') {
      return autoevaluacion('El reconocimiento de voz necesita internet y no hubo conexión. Puedes hacerlo con autoevaluación.');
    }
    const dicho = `${finales} ${parcial}`.trim();
    if (!dicho) {
      mostrar('dilo-inicio');
      estado.textContent = 'No te escuchamos. Revisa el micrófono, acércate y vuelve a intentarlo.';
      return;
    }
    const r = compararDicho(t.texto, dicho);
    $('dilo-texto').replaceChildren(...r.palabras.flatMap((p, i) => [
      i ? ' ' : '',
      el('span', { class: p.dicha ? 'dicha' : 'faltante' }, p.palabra, p.dicha ? '' : el('span', { class: 'sr-only' }, ' (faltó)')),
    ]));
    const porcentaje = Math.round(r.porcentaje * 100);
    $('dilo-porcentaje').textContent = `${porcentaje} %`;
    $('dilo-veredicto').textContent = r.superada
      ? '¡Lo dijiste de memoria! Las palabras en verde fueron las que reconocimos.'
      : `Necesitas ${Math.round(UMBRAL * 100)} % o más. En gris están las palabras que no reconocimos: repásalas y vuelve a intentarlo.`;
    mostrar('dilo-resultado');
    if (r.superada) superar();
    $('dilo-otra').focus();
  }

  $('dilo-empezar').addEventListener('click', empezar);
  $('dilo-terminar').addEventListener('click', () => reconocedor?.stop());
  $('dilo-otra').addEventListener('click', () => { $('resultado').classList.toggle('oculto', !superada); empezar(); });
  mostrar('dilo-inicio');
});
