// HU-25 · Memorama de conceptos (etapa 3 de la ruta: Relaciona)
// Se emparejan los conceptos de AP de un área con su definición. Si se llega desde la ruta (?id=),
// el tablero es del área de ese trabalenguas y lo incluye; al terminar se completa su etapa.
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, usuarioActual } from './ui.js';
import { enlaceDetalle, registrarEtapa } from './ruta.js';
import { AREAS, armarTablero, elegirConceptos, esPareja } from './logica-memorama.js';

const $ = (id) => document.getElementById(id);
const idRuta = new URLSearchParams(location.search).get('id');
const ESPERA_MS = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1600 : 1200;

let todos = [];
let cartas = [];
let volteadas = []; // cartas boca arriba sin pareja (máximo 2)
let encontradas = new Set();
let intentos = 0;
let inicio = 0;
let bloqueado = false;
let terminado = false;

async function cargar() {
  try {
    const instantanea = await getDocs(query(collection(db, 'trabalenguas'), where('estado', '==', 'aprobado')));
    todos = instantanea.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('No se pudo cargar el catálogo', e);
    $('juego-cargando').textContent = 'No pudimos cargar el memorama. Revisa tu conexión y recarga la página.';
    return;
  }
  if (todos.length < 2) {
    $('juego-cargando').textContent = 'Todavía no hay suficientes trabalenguas aprobados para jugar.';
    return;
  }
  const deRuta = todos.find((t) => t.id === idRuta);
  if (deRuta) {
    $('volver-detalle').href = enlaceDetalle(idRuta);
    $('memorama-area').value = deRuta.area;
  } else {
    $('volver-detalle').href = 'index.html';
    $('volver-detalle').lastChild.textContent = ' Volver al catálogo';
    $('memorama-area').value = AREAS[Math.floor(Math.random() * AREAS.length)];
  }
  if (!(await usuarioActual())) {
    $('memorama-sesion').replaceChildren('Puedes jugar sin cuenta, pero tu avance no se guarda. ', el('a', { href: 'login.html' }, 'Inicia sesión'), ' para guardarlo.');
  }
  $('juego-cargando').classList.add('oculto');
  $('juego').classList.remove('oculto');
  nuevaPartida();
}

function nuevaPartida() {
  const area = $('memorama-area').value;
  const incluir = todos.find((t) => t.id === idRuta && t.area === area) ? idRuta : null;
  const conceptos = elegirConceptos(todos, area, incluir);
  cartas = armarTablero(conceptos);
  volteadas = [];
  encontradas = new Set();
  intentos = 0;
  inicio = performance.now();
  bloqueado = false;
  terminado = false;
  $('juego-meta').replaceChildren(etiquetaArea(area), el('span', { class: 'juego-concepto' }, `${conceptos.length} pares`));
  $('memorama-final').classList.add('oculto');
  $('resultado').classList.add('oculto');
  $('memorama-anuncio').textContent = '';
  pintar();
}

function pintar() {
  $('memorama-tablero').replaceChildren(...cartas.map((c, i) => {
    const visible = encontradas.has(c.par) || volteadas.includes(c);
    const boton = el('button', {
      type: 'button',
      class: `carta carta-${c.tipo}${visible ? ' visible' : ''}${encontradas.has(c.par) ? ' encontrada' : ''}`,
      'aria-label': visible ? `${c.tipo === 'concepto' ? 'Concepto' : 'Definición'}: ${c.texto}` : `Carta ${i + 1}, boca abajo`,
      disabled: encontradas.has(c.par) || terminado,
    },
    visible
      ? [el('span', { class: 'carta-tipo' }, c.tipo === 'concepto' ? 'Concepto' : 'Definición'), el('span', { class: 'carta-texto' }, c.texto)]
      : el('span', { class: 'carta-dorso', 'aria-hidden': 'true' }, '?'));
    boton.addEventListener('click', () => voltear(c, i));
    return boton;
  }));
  $('memorama-marcador').textContent = `Parejas: ${encontradas.size} de ${cartas.length / 2} · Intentos: ${intentos}`;
}

function voltear(carta, indice) {
  if (bloqueado || terminado || volteadas.includes(carta) || encontradas.has(carta.par)) return;
  volteadas.push(carta);
  $('memorama-anuncio').textContent = `${carta.tipo === 'concepto' ? 'Concepto' : 'Definición'}: ${carta.texto.replace(/\.$/, '')}.`;
  if (volteadas.length === 2) {
    intentos += 1;
    const [a, b] = volteadas;
    if (esPareja(a, b)) {
      encontradas.add(a.par);
      volteadas = [];
      const concepto = a.tipo === 'concepto' ? a : b;
      $('memorama-anuncio').textContent = `¡Pareja! ${concepto.texto}.`;
      if (encontradas.size === cartas.length / 2) return terminar();
    } else {
      bloqueado = true;
      $('memorama-anuncio').textContent += ' No son pareja.';
      setTimeout(() => {
        volteadas = [];
        bloqueado = false;
        pintar();
        $('memorama-tablero').children[indice]?.focus();
      }, ESPERA_MS);
    }
  }
  pintar();
  $('memorama-tablero').children[indice]?.focus();
}

function terminar() {
  terminado = true;
  pintar();
  const segundos = Math.round((performance.now() - inicio) / 1000);
  const pares = cartas.length / 2;
  $('memorama-resumen').textContent = `Encontraste las ${pares} parejas en ${intentos} intentos y ${segundos} s.`
    + (intentos <= pares + 2 ? ' ¡Excelente memoria!' : '');
  const conceptos = cartas.filter((c) => c.tipo === 'concepto');
  $('memorama-repaso').replaceChildren(...conceptos.map((c) => el('div', {},
    el('dt', {}, c.texto), el('dd', {}, cartas.find((d) => d.par === c.par && d.tipo === 'definicion').texto))));
  $('memorama-final').classList.remove('oculto');
  $('memorama-otra').focus();
  if (cartas.some((c) => c.par === idRuta)) registrarEtapa($('resultado'), idRuta, 'memorama');
}

$('memorama-area').addEventListener('change', nuevaPartida);
$('memorama-otra').addEventListener('click', nuevaPartida);
cargar();
