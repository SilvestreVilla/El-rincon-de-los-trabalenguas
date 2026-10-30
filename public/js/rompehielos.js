// HU-11 · Rompehielos del Daily (T2-18, T2-19)
// Muestra el trabalenguas del día con su concepto. Funciona sin iniciar sesión:
// las reglas ya permiten leer los trabalenguas aprobados a cualquier visitante.
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { claveDelDia, trabalenguasDelDia } from './dia.js';
import './ui.js';

const $ = (id) => document.getElementById(id);
const escenario = $('escenario');
const botonPantalla = $('pantalla-completa');
const botonSalir = $('salir-pantalla');

let catalogo = [];
let claveMostrada = null;

function pintar() {
  claveMostrada = claveDelDia();
  const t = trabalenguasDelDia(catalogo, claveMostrada);
  if (!t) {
    escenario.classList.add('oculto');
    $('rompehielos-vacio').classList.remove('oculto');
    return;
  }
  $('rompehielos-vacio').classList.add('oculto');
  escenario.classList.remove('oculto');
  $('rh-texto').textContent = `«${t.texto}»`;
  $('rh-concepto').textContent = t.concepto;
  $('rh-definicion').textContent = t.definicion;
  $('rh-area').textContent = t.area;
  const fecha = new Date(`${claveMostrada}T12:00:00Z`);
  $('rh-fecha').textContent = new Intl.DateTimeFormat('es-MX', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(fecha);
  document.title = `Rompehielos · El Rincón de los Trabalenguas`;
}

async function cargar() {
  $('rompehielos-error').classList.add('oculto');
  $('rompehielos-cargando').classList.remove('oculto');
  try {
    const instantanea = await getDocs(query(collection(db, 'trabalenguas'), where('estado', '==', 'aprobado')));
    catalogo = instantanea.docs.map((d) => ({ id: d.id, ...d.data() }));
    $('rompehielos-cargando').classList.add('oculto');
    pintar();
  } catch (e) {
    console.error('No se pudo cargar el Rompehielos', e);
    $('rompehielos-cargando').classList.add('oculto');
    $('rompehielos-error').classList.remove('oculto');
  }
}

// ---------- Pantalla completa (T2-19) ----------
// Si el navegador rechaza la API nativa, el modo presentación igual llena la ventana.
function activarPresentacion(activa) {
  document.body.classList.toggle('presentacion', activa);
  botonPantalla.textContent = activa ? 'Salir de pantalla completa' : 'Pantalla completa';
  botonPantalla.setAttribute('aria-pressed', String(activa));
}

async function entrar() {
  activarPresentacion(true);
  if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
    try { await document.documentElement.requestFullscreen(); } catch { /* queda el modo presentación */ }
  }
  botonSalir.focus();
}

async function salir() {
  activarPresentacion(false);
  if (document.fullscreenElement && document.exitFullscreen) {
    try { await document.exitFullscreen(); } catch { /* ya salió */ }
  }
  botonPantalla.focus();
}

botonPantalla.addEventListener('click', () => (document.body.classList.contains('presentacion') ? salir() : entrar()));
botonSalir.addEventListener('click', salir);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.body.classList.contains('presentacion')) salir();
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) activarPresentacion(false);
});

// Si la pantalla queda proyectada pasada la medianoche, cambia sola al trabalenguas nuevo.
setInterval(() => { if (catalogo.length && claveDelDia() !== claveMostrada) pintar(); }, 60000);

$('reintentar').addEventListener('click', cargar);
cargar();
