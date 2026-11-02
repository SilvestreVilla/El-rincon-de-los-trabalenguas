// HU-14 · Juego «Completar la frase» (etapa 3 de la ruta: Completa)
// Partida de 5 preguntas. Si se llega desde la ruta (?id=), ese trabalenguas es la primera pregunta.
// Acertar la pregunta de un trabalenguas completa su etapa «Completa».
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad, usuarioActual } from './ui.js';
import { completarEtapa, enlaceDetalle, registrarEtapa } from './ruta.js';
import { armarPartida, esCorrecta } from './logica-completar.js';

const $ = (id) => document.getElementById(id);
const idInicial = new URLSearchParams(location.search).get('id');

let todos = [];
let partida = [];
let actual = 0;
let aciertos = [];

async function cargar() {
  try {
    const instantanea = await getDocs(query(collection(db, 'trabalenguas'), where('estado', '==', 'aprobado')));
    todos = instantanea.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('No se pudo cargar el catálogo', e);
    $('juego-cargando').textContent = 'No pudimos cargar el juego. Revisa tu conexión y recarga la página.';
    return;
  }
  if (todos.length < 4) {
    $('juego-cargando').textContent = 'Todavía no hay suficientes trabalenguas aprobados para jugar.';
    return;
  }
  if (idInicial && todos.some((t) => t.id === idInicial)) {
    $('volver-detalle').href = enlaceDetalle(idInicial);
  } else {
    $('volver-detalle').href = 'index.html';
    $('volver-detalle').lastChild.textContent = ' Volver al catálogo';
  }
  const usuario = await usuarioActual();
  if (!usuario) {
    $('completar-sesion').replaceChildren('Puedes jugar sin cuenta, pero tu avance no se guarda. ', el('a', { href: 'login.html' }, 'Inicia sesión'), ' para guardarlo.');
  }
  $('juego-cargando').classList.add('oculto');
  $('juego').classList.remove('oculto');
  nuevaPartida();
}

function nuevaPartida() {
  partida = armarPartida(todos, idInicial);
  actual = 0;
  aciertos = [];
  $('resultado').classList.add('oculto');
  $('completar-final').classList.add('oculto');
  $('completar-pregunta').classList.remove('oculto');
  pintarPregunta();
}

function pintarPregunta() {
  const p = partida[actual];
  $('juego-titulo').textContent = 'Completar la frase';
  $('juego-meta').replaceChildren(
    el('span', { class: 'completar-contador' }, `Pregunta ${actual + 1} de ${partida.length}`),
    etiquetaArea(p.t.area), etiquetaDificultad(p.t.dificultad));
  $('completar-frase').textContent = `«${p.frase}»`;
  $('completar-retro').classList.add('oculto');
  $('completar-siguiente').classList.add('oculto');
  $('completar-opciones').replaceChildren(...p.opciones.map((opcion) => {
    const boton = el('button', { type: 'button', class: 'opcion' }, opcion);
    boton.addEventListener('click', () => responder(opcion));
    return boton;
  }));
  $('completar-opciones').querySelector('button').focus();
}

function responder(opcion) {
  const p = partida[actual];
  const bien = esCorrecta(p, opcion);
  aciertos.push(bien);
  for (const boton of $('completar-opciones').querySelectorAll('button')) {
    boton.disabled = true;
    if (esCorrecta(p, boton.textContent)) boton.classList.add('bien');
    else if (boton.textContent === opcion) boton.classList.add('mal');
  }
  $('completar-frase').textContent = `«${p.t.texto}»`;
  $('completar-veredicto').textContent = bien ? '¡Correcto!' : `Casi. La palabra era «${p.oculta.palabra}».`;
  $('completar-veredicto').className = `completar-veredicto ${bien ? 'bien' : 'mal'}`;
  $('completar-concepto').textContent = p.t.concepto;
  $('completar-definicion').textContent = p.t.definicion;
  $('completar-retro').classList.remove('oculto');
  const ultima = actual === partida.length - 1;
  $('completar-siguiente').textContent = ultima ? 'Ver resultado' : 'Siguiente pregunta';
  $('completar-siguiente').classList.remove('oculto');
  $('completar-siguiente').focus();

  // La etapa del trabalenguas de la ruta se registra al final con su mensaje; las demás, en segundo plano.
  if (bien && p.t.id !== idInicial) {
    completarEtapa(p.t.id, 'completa').catch((e) => console.error('No se pudo guardar la etapa', e));
  }
}

function terminar() {
  const total = aciertos.filter(Boolean).length;
  $('completar-pregunta').classList.add('oculto');
  $('juego-meta').replaceChildren();
  $('completar-puntaje').textContent = `${total} de ${partida.length}`;
  $('completar-mensaje').textContent = total === partida.length ? '¡Partida perfecta!'
    : total >= 3 ? '¡Buen trabajo! Repasa las definiciones de las que fallaste.' : 'Sigue practicando: vuelve a leer los trabalenguas en su ruta.';
  $('completar-resumen').replaceChildren(...partida.map((p, i) => el('li', { class: aciertos[i] ? 'bien' : 'mal' },
    el('span', { 'aria-hidden': 'true' }, aciertos[i] ? '✓ ' : '✗ '),
    el('span', { class: 'sr-only' }, aciertos[i] ? 'Acertaste: ' : 'Fallaste: '),
    el('a', { href: enlaceDetalle(p.t.id) }, p.t.titulo), ` · ${p.t.concepto}`)));
  $('completar-final').classList.remove('oculto');
  $('completar-otra').focus();

  const inicial = partida.findIndex((p) => p.t.id === idInicial);
  if (inicial !== -1) {
    if (aciertos[inicial]) {
      registrarEtapa($('resultado'), idInicial, 'completa');
    } else {
      const r = $('resultado');
      r.className = 'resultado-etapa resultado-error';
      r.replaceChildren(el('p', {}, `Para superar la etapa 3 de «${partida[inicial].t.titulo}» necesitas acertar su pregunta. Juega otra partida: siempre sale primero.`));
    }
  }
}

$('completar-siguiente').addEventListener('click', () => {
  if (actual === partida.length - 1) return terminar();
  actual += 1;
  pintarPregunta();
});
$('completar-otra').addEventListener('click', nuevaPartida);

cargar();
