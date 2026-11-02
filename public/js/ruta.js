// HU-21 · Ruta de aprendizaje y dominado por logro
// Cada trabalenguas tiene 4 etapas: 1 Lee (HU-23) → 2 Ordena (HU-22) → 3 Completa (HU-14) → 4 Dilo (HU-24).
// El avance vive en progreso/{uid}_{trabalenguasId}, campo `etapas` (mapa de booleanos).
// Al completar las 4, la app pone `dominado: true`: ya no se marca a mano (antes HU-08).
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad, usuarioActual } from './ui.js';

export const ETAPAS = [
  { clave: 'lee', numero: 1, nombre: 'Lee', juego: 'Karaoke de velocidad', pagina: 'juego-karaoke.html', ayuda: 'Léelo en voz alta al ritmo de las palabras iluminadas.' },
  { clave: 'ordena', numero: 2, nombre: 'Ordena', juego: 'Arma el trabalenguas', pagina: 'juego-armar.html', ayuda: 'Acomoda en orden las palabras revueltas.' },
  { clave: 'completa', numero: 3, nombre: 'Completa', juego: 'Completar la frase', pagina: 'juego-completar.html', ayuda: 'Encuentra la palabra que falta.' },
  { clave: 'dilo', numero: 4, nombre: 'Dilo', juego: 'Dilo en voz alta', pagina: 'juego-dilo.html', ayuda: 'Dilo de memoria, sin ver el texto.' },
];

export const etapaPorClave = (clave) => ETAPAS.find((e) => e.clave === clave);
export const enlaceEtapa = (etapa, trabalenguasId) => `${etapa.pagina}?id=${encodeURIComponent(trabalenguasId)}`;
export const enlaceDetalle = (trabalenguasId) => `trabalenguas.html?id=${encodeURIComponent(trabalenguasId)}`;
export const cuantasCompletas = (etapas) => ETAPAS.filter((e) => etapas?.[e.clave] === true).length;
export const siguientePendiente = (etapas) => ETAPAS.find((e) => etapas?.[e.clave] !== true) ?? null;

const referencia = (usuario, trabalenguasId) => doc(db, 'progreso', `${usuario.uid}_${trabalenguasId}`);

/** Etapas y dominado del usuario para un trabalenguas. Sin sesión, todo vacío. */
export async function leerAvance(usuario, trabalenguasId) {
  if (!usuario) return { etapas: {}, dominado: false };
  const instantanea = await getDoc(referencia(usuario, trabalenguasId));
  const datos = instantanea.exists() ? instantanea.data() : {};
  return { etapas: datos.etapas ?? {}, dominado: datos.dominado === true };
}

/**
 * Marca una etapa como completada. Si con ella quedan las 4, marca el trabalenguas como dominado.
 * Devuelve { guardado, etapas, dominado, recienDominado } o { guardado: false, motivo }.
 */
export async function completarEtapa(trabalenguasId, clave) {
  if (!etapaPorClave(clave)) throw new Error(`Etapa desconocida: ${clave}`);
  const usuario = await usuarioActual();
  if (!usuario) return { guardado: false, motivo: 'sin-sesion' };

  const previo = await leerAvance(usuario, trabalenguasId);
  const etapas = { ...previo.etapas, [clave]: true };
  const completas = cuantasCompletas(etapas) === ETAPAS.length;
  // merge: solo se escribe la etapa (y dominado); favoritos, tiempos y prácticas no se tocan.
  const datos = { usuarioId: usuario.uid, trabalenguasId, etapas: { [clave]: true } };
  if (completas) datos.dominado = true;
  await setDoc(referencia(usuario, trabalenguasId), datos, { merge: true });
  return {
    guardado: true,
    etapas,
    dominado: completas || previo.dominado,
    recienDominado: completas && !previo.dominado,
  };
}

/** Lee un trabalenguas aprobado. Devuelve null si no existe o no está aprobado. */
export async function cargarTrabalenguas(id) {
  if (!id) return null;
  try {
    const instantanea = await getDoc(doc(db, 'trabalenguas', id));
    if (!instantanea.exists() || instantanea.data().estado !== 'aprobado') return null;
    return instantanea.data();
  } catch (e) {
    if (e.code === 'permission-denied') return null;
    throw e;
  }
}

// ---------- Detalle del trabalenguas ----------

/** Pinta la ruta de 4 etapas en la página de detalle (#ruta). */
export async function iniciarRuta(trabalenguasId) {
  const lista = document.getElementById('ruta-etapas');
  const resumen = document.getElementById('ruta-resumen');
  const nota = document.getElementById('ruta-nota');
  const usuario = await usuarioActual();

  let avance = { etapas: {}, dominado: false };
  let total = null;
  if (usuario) {
    const [a, d] = await Promise.allSettled([
      leerAvance(usuario, trabalenguasId),
      getDocs(query(collection(db, 'progreso'), where('usuarioId', '==', usuario.uid), where('dominado', '==', true))),
    ]);
    if (a.status === 'fulfilled') avance = a.value;
    else console.error('No se pudo leer el avance de la ruta', a.reason);
    if (d.status === 'fulfilled') total = d.value.size;
    else console.error('No se pudo leer el contador de dominados', d.reason);
  }

  const siguiente = siguientePendiente(avance.etapas);
  lista.replaceChildren(...ETAPAS.map((etapa) => {
    const hecha = avance.etapas[etapa.clave] === true;
    const esSiguiente = !avance.dominado && siguiente?.clave === etapa.clave;
    return el('li', { class: `ruta-etapa${hecha ? ' hecha' : ''}${esSiguiente ? ' siguiente' : ''}` },
      el('span', { class: 'ruta-numero', 'aria-hidden': 'true' }, hecha ? '✓' : String(etapa.numero)),
      el('div', { class: 'ruta-info' },
        el('strong', {}, `${etapa.numero}. ${etapa.nombre}`),
        el('span', {}, `${etapa.juego} · ${etapa.ayuda}`),
        el('span', { class: 'sr-only' }, hecha ? 'Completada.' : 'Pendiente.')),
      el('a', { href: enlaceEtapa(etapa, trabalenguasId), class: `boton ${esSiguiente ? '' : 'boton-secundario'}` },
        hecha ? 'Repetir' : 'Jugar'));
  }));

  const completas = cuantasCompletas(avance.etapas);
  if (avance.dominado) {
    resumen.replaceChildren(el('span', { class: 'insignia-dominado' }, '✓ Dominado'), ` ${completas} de 4 etapas`);
  } else {
    resumen.textContent = `${completas} de 4 etapas`;
  }

  if (!usuario) {
    nota.replaceChildren('Puedes jugar sin cuenta, pero tu avance no se guarda. ',
      el('a', { href: 'login.html' }, 'Inicia sesión'), ' para guardarlo.');
  } else if (total === null) {
    nota.textContent = 'No pudimos cargar tu contador de dominados.';
  } else {
    nota.textContent = `Completa las 4 etapas para dominarlo. Llevas ${total} ${total === 1 ? 'trabalenguas dominado' : 'trabalenguas dominados'}.`;
  }
}

// ---------- Páginas de juego ----------

/**
 * Esqueleto común de las páginas de juego: lee ?id=, carga el trabalenguas, pinta el encabezado
 * (etapa, título, área, dificultad, concepto) y llama a alCargar(trabalenguas, id).
 */
export async function iniciarPaginaJuego(clave, alCargar) {
  const etapa = etapaPorClave(clave);
  const $ = (id) => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');

  let t;
  try {
    t = await cargarTrabalenguas(id);
  } catch (e) {
    console.error('No se pudo cargar el trabalenguas', e);
    $('juego-cargando').textContent = 'No pudimos cargar el trabalenguas. Revisa tu conexión y recarga la página.';
    return;
  }
  if (!t) {
    $('juego-cargando').classList.add('oculto');
    $('no-encontrado').classList.remove('oculto');
    return;
  }

  document.title = `${etapa.juego}: ${t.titulo} · El Rincón de los Trabalenguas`;
  $('volver-detalle').href = enlaceDetalle(id);
  $('juego-etapa').textContent = `Etapa ${etapa.numero} de 4 · ${etapa.nombre}`;
  $('juego-titulo').textContent = t.titulo;
  $('juego-meta').replaceChildren(etiquetaArea(t.area), etiquetaDificultad(t.dificultad),
    el('span', { class: 'juego-concepto' }, 'Concepto: ', el('strong', {}, t.concepto)));
  $('juego-cargando').classList.add('oculto');
  $('juego').classList.remove('oculto');
  await alCargar(t, id);
}

/**
 * Guarda la etapa y pinta el resultado en `contenedor`: mensaje de logro, avance «n de 4»
 * y enlace a la siguiente etapa pendiente (o al detalle).
 */
export async function registrarEtapa(contenedor, trabalenguasId, clave) {
  const etapa = etapaPorClave(clave);
  contenedor.className = 'resultado-etapa';
  contenedor.replaceChildren(el('p', {}, 'Guardando tu avance…'));
  contenedor.classList.remove('oculto');

  let r;
  try {
    r = await completarEtapa(trabalenguasId, clave);
  } catch (e) {
    console.error('No se pudo guardar la etapa', e);
    contenedor.classList.add('resultado-error');
    contenedor.replaceChildren(el('p', {}, 'Superaste la etapa, pero no pudimos guardar tu avance. Revisa tu conexión e inténtalo de nuevo.'));
    return null;
  }

  if (!r.guardado) {
    contenedor.replaceChildren(
      el('p', { class: 'resultado-titulo' }, `¡Etapa ${etapa.numero} superada!`),
      el('p', {}, 'Tu avance no se guardó porque no has iniciado sesión. ', el('a', { href: 'login.html' }, 'Iniciar sesión')),
      el('div', { class: 'acciones-detalle' }, el('a', { href: enlaceDetalle(trabalenguasId), class: 'boton boton-secundario' }, 'Volver a la ruta')));
    return r;
  }

  const siguiente = siguientePendiente(r.etapas);
  const acciones = el('div', { class: 'acciones-detalle' });
  if (siguiente) acciones.append(el('a', { href: enlaceEtapa(siguiente, trabalenguasId), class: 'boton' }, `Siguiente: ${siguiente.nombre} →`));
  acciones.append(el('a', { href: enlaceDetalle(trabalenguasId), class: 'boton boton-secundario' }, 'Volver a la ruta'));

  if (r.recienDominado) {
    contenedor.classList.add('resultado-logro');
    contenedor.replaceChildren(
      el('p', { class: 'resultado-titulo' }, '🏆 ¡Dominaste este trabalenguas!'),
      el('p', {}, 'Completaste las 4 etapas: lo leíste, lo ordenaste, lo completaste y lo dijiste de memoria.'),
      acciones);
  } else {
    contenedor.replaceChildren(
      el('p', { class: 'resultado-titulo' }, `¡Etapa ${etapa.numero} superada! Llevas ${cuantasCompletas(r.etapas)} de 4.`),
      acciones);
  }
  return r;
}
