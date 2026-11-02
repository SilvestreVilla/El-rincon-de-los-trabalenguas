// HU-14 · Preguntas del trabalenguas (etapa 2 de la ruta: Completa)
// 5 preguntas sobre UN trabalenguas: la palabra que falta, su concepto, su definición, una situación
// de la vida diaria y un ejemplo cotidiano. Con 4 aciertos o más se completa la etapa.
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad, usuarioActual } from './ui.js';
import { enlaceDetalle, enlaceEtapa, etapaPorClave, registrarEtapa } from './ruta.js';
import { armarPreguntas, esCorrecta, minimoParaSuperar } from './logica-completar.js';

const $ = (id) => document.getElementById(id);
const TIPOS = {
  palabra: 'La frase', concepto: 'El concepto', definicion: 'La definición', situacion: 'En la vida diaria', ejemplo: 'Ejemplo cotidiano', area: 'El área',
};

let todos = [];
let t = null;
let preguntas = [];
let actual = 0;
let aciertos = [];

async function cargar() {
  try {
    const instantanea = await getDocs(query(collection(db, 'trabalenguas'), where('estado', '==', 'aprobado')));
    todos = instantanea.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('No se pudo cargar el catálogo', e);
    $('juego-cargando').textContent = 'No pudimos cargar las preguntas. Revisa tu conexión y recarga la página.';
    return;
  }
  const id = new URLSearchParams(location.search).get('id');
  t = todos.find((x) => x.id === id) ?? null;
  if (!t) {
    if (id || todos.length === 0) {
      $('juego-cargando').classList.add('oculto');
      $('no-encontrado').classList.remove('oculto');
      return;
    }
    t = todos[Math.floor(Math.random() * todos.length)]; // sin ?id=: uno al azar
  }
  document.title = `Preguntas: ${t.titulo} · El Rincón de los Trabalenguas`;
  $('volver-detalle').href = enlaceDetalle(t.id);
  $('juego-titulo').textContent = t.titulo;
  if (!(await usuarioActual())) {
    $('completar-sesion').replaceChildren('Puedes jugar sin cuenta, pero tu avance no se guarda. ', el('a', { href: 'login.html' }, 'Inicia sesión'), ' para guardarlo.');
  }
  $('juego-cargando').classList.add('oculto');
  $('juego').classList.remove('oculto');
  nuevaPartida();
}

function nuevaPartida() {
  preguntas = armarPreguntas(t, todos);
  actual = 0;
  aciertos = [];
  $('resultado').classList.add('oculto');
  $('completar-final').classList.add('oculto');
  $('completar-pregunta').classList.remove('oculto');
  pintarPregunta();
}

function pintarPregunta() {
  const p = preguntas[actual];
  $('juego-meta').replaceChildren(
    el('span', { class: 'completar-contador' }, `Pregunta ${actual + 1} de ${preguntas.length}`),
    el('span', { class: 'completar-tipo' }, TIPOS[p.tipo]),
    etiquetaArea(t.area), etiquetaDificultad(t.dificultad));
  $('completar-enunciado').textContent = p.enunciado;
  $('completar-cita').textContent = p.cita ? `«${p.cita}»` : '';
  $('completar-cita').classList.toggle('oculto', !p.cita);
  $('completar-cita').classList.toggle('completar-cita-situacion', p.tipo === 'situacion');
  $('completar-retro').classList.add('oculto');
  $('completar-siguiente').classList.add('oculto');
  const largas = p.opciones.some((o) => o.length > 40);
  $('completar-opciones').classList.toggle('largas', largas);
  $('completar-opciones').replaceChildren(...p.opciones.map((opcion) => {
    const boton = el('button', { type: 'button', class: 'opcion' }, opcion);
    boton.addEventListener('click', () => responder(opcion));
    return boton;
  }));
  $('completar-enunciado').focus();
}

function responder(opcion) {
  const p = preguntas[actual];
  const bien = esCorrecta(p, opcion);
  aciertos.push(bien);
  for (const boton of $('completar-opciones').querySelectorAll('button')) {
    boton.disabled = true;
    if (esCorrecta(p, boton.textContent)) boton.classList.add('bien');
    else if (boton.textContent === opcion) boton.classList.add('mal');
  }
  if (p.tipo === 'palabra') $('completar-cita').textContent = `«${t.texto}»`;
  $('completar-veredicto').textContent = bien ? '¡Correcto!' : (p.correcta.length > 40 ? 'Casi. La respuesta correcta está en verde.' : `Casi. La respuesta era «${p.correcta}».`);
  $('completar-veredicto').className = `completar-veredicto ${bien ? 'bien' : 'mal'}`;
  $('completar-concepto').textContent = t.concepto;
  $('completar-definicion').textContent = t.definicion;
  $('completar-retro').classList.remove('oculto');
  const ultima = actual === preguntas.length - 1;
  $('completar-siguiente').textContent = ultima ? 'Ver resultado' : 'Siguiente pregunta';
  $('completar-siguiente').classList.remove('oculto');
  $('completar-siguiente').focus();
}

function terminar() {
  const total = aciertos.filter(Boolean).length;
  const minimo = minimoParaSuperar(preguntas.length);
  const supero = total >= minimo;
  $('completar-pregunta').classList.add('oculto');
  $('juego-meta').replaceChildren(etiquetaArea(t.area), etiquetaDificultad(t.dificultad));
  $('completar-puntaje').textContent = `${total} de ${preguntas.length}`;
  $('completar-mensaje').textContent = total === preguntas.length ? '¡Perfecto! Entiendes el trabalenguas y su concepto.'
    : supero ? '¡Bien! Repasa la pregunta que fallaste.'
      : `Necesitas ${minimo} aciertos para superar la etapa. Repasa el concepto y vuelve a intentarlo.`;
  $('completar-resumen').replaceChildren(...preguntas.map((p, i) => el('li', { class: aciertos[i] ? 'bien' : 'mal' },
    el('span', { 'aria-hidden': 'true' }, aciertos[i] ? '✓ ' : '✗ '),
    el('span', { class: 'sr-only' }, aciertos[i] ? 'Acertaste: ' : 'Fallaste: '),
    `${TIPOS[p.tipo]} · `, el('strong', {}, p.correcta))));
  $('completar-final').classList.remove('oculto');
  $('completar-otra').focus();

  if (supero) {
    registrarEtapa($('resultado'), t.id, 'completa');
  } else {
    const r = $('resultado');
    r.className = 'resultado-etapa resultado-error';
    r.replaceChildren(el('p', {}, 'Esta vez no se superó la etapa. ',
      el('a', { href: enlaceEtapa(etapaPorClave('ordena'), t.id) }, 'Arma el trabalenguas'), ' otra vez o lee su definición en la ruta y vuelve a intentarlo.'));
  }
}

$('completar-siguiente').addEventListener('click', () => {
  if (actual === preguntas.length - 1) return terminar();
  actual += 1;
  pintarPregunta();
});
$('completar-otra').addEventListener('click', nuevaPartida);

cargar();
