// HU-07 · Página «Mis favoritos»
import { collection, doc, getDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad, usuarioActual } from './ui.js';

const lista = document.getElementById('favoritos');
const vacio = document.getElementById('favoritos-vacio');
const error = document.getElementById('favoritos-error');
const cargando = document.getElementById('favoritos-cargando');

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

async function cargar(usuario) {
  try {
    const progreso = await getDocs(query(
      collection(db, 'progreso'),
      where('usuarioId', '==', usuario.uid),
      where('esFavorito', '==', true),
    ));
    const ids = progreso.docs.map((d) => d.data().trabalenguasId);
    const lecturas = await Promise.all(ids.map((id) => getDoc(doc(db, 'trabalenguas', id)).catch(() => null)));
    const favoritos = lecturas
      .filter((s) => s && s.exists() && s.data().estado === 'aprobado')
      .map((s) => ({ id: s.id, ...s.data() }))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

    cargando.classList.add('oculto');
    if (favoritos.length === 0) {
      vacio.classList.remove('oculto');
      return;
    }
    lista.replaceChildren(...favoritos.map((f) => tarjeta(f.id, f)));
    lista.classList.remove('oculto');
  } catch (e) {
    console.error('No se pudieron cargar los favoritos', e);
    cargando.classList.add('oculto');
    error.classList.remove('oculto');
  }
}

const usuario = await usuarioActual();
if (!usuario) location.replace('login.html');
else cargar(usuario);
