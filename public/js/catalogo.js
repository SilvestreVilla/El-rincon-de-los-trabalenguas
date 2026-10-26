// HU-04 · Catálogo de conceptos de AP (T1-17, T1-18)
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad } from './ui.js';

const lista = document.getElementById('catalogo');
const vacio = document.getElementById('catalogo-vacio');
const error = document.getElementById('catalogo-error');
const contador = document.getElementById('contador');
const esqueletos = [...lista.children];

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

async function cargar() {
  error.classList.add('oculto');
  vacio.classList.add('oculto');
  contador.classList.add('oculto');
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
    lista.replaceChildren(...docs.map((d) => tarjeta(d.id, d)));
    contador.replaceChildren(el('strong', {}, String(docs.length)), ' trabalenguas aprobados por la editorial');
    contador.classList.remove('oculto');
  } catch (e) {
    console.error('No se pudo cargar el catálogo', e);
    lista.setAttribute('aria-busy', 'false');
    lista.classList.add('oculto');
    error.classList.remove('oculto');
  }
}

document.getElementById('reintentar').addEventListener('click', cargar);
cargar();
