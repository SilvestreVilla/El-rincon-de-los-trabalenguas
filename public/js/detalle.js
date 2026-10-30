// HU-05 · Detalle con concepto y definición (T1-20, T1-21)
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { etiquetaArea, etiquetaDificultad } from './ui.js';
import { iniciarFavorito } from './favoritos.js';

const $ = (id) => document.getElementById(id);

function noEncontrado() {
  $('detalle-cargando').classList.add('oculto');
  $('no-encontrado').classList.remove('oculto');
  document.title = 'Trabalenguas no encontrado · El Rincón de los Trabalenguas';
}

async function cargar() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return noEncontrado();

  let instantanea;
  try {
    instantanea = await getDoc(doc(db, 'trabalenguas', id));
  } catch (e) {
    // Un id inexistente o no aprobado lo bloquean las reglas (permission-denied):
    // para el usuario es lo mismo que «no encontrado».
    if (e.code === 'permission-denied') return noEncontrado();
    console.error('No se pudo cargar el trabalenguas', e);
    $('detalle-cargando').textContent = 'No pudimos cargar el trabalenguas. Revisa tu conexión y recarga la página.';
    return;
  }
  if (!instantanea.exists() || instantanea.data().estado !== 'aprobado') return noEncontrado();

  const t = instantanea.data();
  document.title = `${t.titulo} · El Rincón de los Trabalenguas`;
  $('detalle-meta').replaceChildren(etiquetaArea(t.area), etiquetaDificultad(t.dificultad));
  $('detalle-titulo').textContent = t.titulo;
  $('detalle-texto').textContent = `«${t.texto}»`;
  $('detalle-autor').textContent = t.autorNombre ?? 'Anónimo';
  $('concepto-nombre').textContent = t.concepto;
  $('concepto-definicion').textContent = t.definicion;
  $('concepto-area').textContent = t.area;
  $('concepto-dificultad').textContent = t.dificultad;

  $('detalle-cargando').classList.add('oculto');
  $('detalle').classList.remove('oculto');

  iniciarFavorito(id); // HU-07
}

cargar();
