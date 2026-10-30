// HU-04 · Catálogo de conceptos de AP (T1-17, T1-18)
// HU-06 · Búsqueda y filtros combinables (T2-02)
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad } from './ui.js';

const lista = document.getElementById('catalogo');
const vacio = document.getElementById('catalogo-vacio');
const error = document.getElementById('catalogo-error');
const contador = document.getElementById('contador');
const esqueletos = [...lista.children];

// Controles de búsqueda y filtros (los ids vienen de index.html)
const campoBusqueda = document.getElementById('busqueda');
const campoArea = document.getElementById('filtro-area');
const campoDificultad = document.getElementById('filtro-dificultad');
const sinResultados = document.getElementById('sin-resultados');
const botonesLimpiar = [document.getElementById('limpiar'), document.getElementById('limpiar-vacio')];

// Aquí guardamos todos los trabalenguas aprobados que llegan de Firestore
let todos = [];

function tarjeta(id, t) {
  return el('li', {},
    el('a', { href: `trabalenguas.html?id=${encodeURIComponent(id)}`, class: 'tarjeta' },
      el('div', { class: 'tarjeta-fila' }, etiquetaArea(t.area), etiquetaDificultad(t.dificultad)),
      el('h2', {}, t.titulo),
      el('p', { class: 'tarjeta-texto' }, `«${t.texto}»`),
      el('p', { class: 'tarjeta-concepto' }, 'Concepto: ', el('strong', {}, t.concepto)),
    ),
  );
}

// Quita mayúsculas y acentos, solo para comparar
function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// Devuelve solo los trabalenguas que cumplen texto Y área Y dificultad
function filtrar() {
  const busqueda = normalizar(campoBusqueda.value.trim());
  const area = campoArea.value;
  const dificultad = campoDificultad.value;

  return todos.filter((t) => {
    const coincideArea = !area || t.area === area;
    const coincideDificultad = !dificultad || t.dificultad === dificultad;
    const coincideTexto =
      !busqueda ||
      normalizar(t.texto).includes(busqueda) ||
      normalizar(t.concepto).includes(busqueda);
    return coincideArea && coincideDificultad && coincideTexto;
  });
}

function actualizarContador(visibles) {
  if (visibles === todos.length) {
    contador.replaceChildren(el('strong', {}, String(visibles)), ' trabalenguas aprobados por la editorial');
  } else {
    contador.replaceChildren(el('strong', {}, String(visibles)), ` de ${todos.length} trabalenguas`);
  }
  contador.classList.remove('oculto');
}

// Vuelve a dibujar la lista con lo que pasa el filtro
function pintar() {
  if (lista.getAttribute('aria-busy') === 'true') return; // aún cargando
  const visibles = filtrar();

  if (visibles.length === 0) {
    lista.classList.add('oculto');
    sinResultados.classList.remove('oculto');
  } else {
    sinResultados.classList.add('oculto');
    lista.classList.remove('oculto');
    lista.replaceChildren(...visibles.map((d) => tarjeta(d.id, d)));
  }
  actualizarContador(visibles.length);
}

async function cargar() {
  error.classList.add('oculto');
  vacio.classList.add('oculto');
  contador.classList.add('oculto');
  sinResultados.classList.add('oculto');
  lista.classList.remove('oculto');
  lista.replaceChildren(...esqueletos);
  lista.setAttribute('aria-busy', 'true');

  try {
    // Las reglas solo permiten consultar con este filtro: un visitante nunca recibe pendientes.
    const instantanea = await getDocs(query(collection(db, 'trabalenguas'), where('estado', '==', 'aprobado')));
    const docs = instantanea.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

    lista.setAttribute('aria-busy', 'false');
    if (docs.length === 0) {
      lista.classList.add('oculto');
      vacio.classList.remove('oculto');
      return;
    }
    todos = docs;
    pintar();
  } catch (e) {
    console.error('No se pudo cargar el catálogo', e);
    lista.setAttribute('aria-busy', 'false');
    lista.classList.add('oculto');
    error.classList.remove('oculto');
  }
}

// Deja los controles en su estado inicial y vuelve a mostrar todo
function limpiar() {
  campoBusqueda.value = '';
  campoArea.value = '';
  campoDificultad.value = '';
  pintar();
  campoBusqueda.focus();
}

botonesLimpiar.forEach((boton) => boton.addEventListener('click', limpiar));
campoBusqueda.addEventListener('input', pintar);
campoArea.addEventListener('change', pintar);
campoDificultad.addEventListener('change', pintar);

document.getElementById('reintentar').addEventListener('click', cargar);
cargar();