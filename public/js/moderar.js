// HU-13 · Validación del editor
// Solo el rol «moderador» (se asigna en la consola de Firebase) ve la cola de envíos pendientes.
// - Aprobar: en un mismo batch publica trabalenguas/{id del envío}, marca el envío como «aprobado»
//   y baja en 1 el contador usuarios/{autor}.enviosPendientes. El editor puede corregir el texto,
//   el concepto o la definición, elegir la fuente y agregar ejemplos cotidianos (para HU-14).
// - Rechazar: en un mismo batch guarda el motivo en el envío (HU-15 se lo muestra al autor) y baja el contador.
// Las reglas (firestore.rules) exigen que todo vaya junto; la página solo es la interfaz.
import {
  collection, doc, getDoc, getDocs, increment, query, serverTimestamp, where, writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad, usuarioActual } from './ui.js';
import {
  AREAS, DIFICULTADES, FUENTES, MAX_EJEMPLOS, armarPublicacion, ordenarPorLlegada, validarMotivo, validarPublicacion,
} from './logica-moderar.js';

const $ = (id) => document.getElementById(id);
const formatoFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
let pendientes = 0;

function pintarContador() {
  $('moderar-contador').textContent = pendientes === 1 ? '1 envío pendiente' : `${pendientes} envíos pendientes`;
  if (pendientes === 0) $('moderar-vacio').classList.remove('oculto');
}

// ---------- Campos del formulario ----------

function campoTexto(prefijo, nombre, etiqueta, valor, { multilinea = false, maximo, filas = 3, ayuda } = {}) {
  const id = `${prefijo}-${nombre}`;
  const control = multilinea
    ? el('textarea', { id, name: nombre, rows: filas, maxlength: maximo, 'aria-describedby': `${id}-error${ayuda ? ` ${id}-ayuda` : ''}` })
    : el('input', { id, name: nombre, type: 'text', maxlength: maximo, 'aria-describedby': `${id}-error` });
  control.value = valor ?? '';
  return el('div', { class: 'campo' },
    el('label', { for: id }, etiqueta),
    control,
    ayuda && el('span', { id: `${id}-ayuda`, class: 'ayuda' }, ayuda),
    el('span', { id: `${id}-error`, class: 'error-campo oculto' }));
}

function campoLista(prefijo, nombre, etiqueta, opciones, valor, vacio) {
  const id = `${prefijo}-${nombre}`;
  const select = el('select', { id, name: nombre, 'aria-describedby': `${id}-error` },
    vacio !== undefined && el('option', { value: '' }, vacio),
    ...opciones.map((o) => el('option', { value: o }, o)));
  select.value = valor ?? '';
  return el('div', { class: 'campo' },
    el('label', { for: id }, etiqueta),
    select,
    el('span', { id: `${id}-error`, class: 'error-campo oculto' }));
}

function marcarErrores(formulario, prefijo, errores) {
  formulario.querySelectorAll('.error-campo').forEach((span) => { span.textContent = ''; span.classList.add('oculto'); });
  formulario.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
  let primero = null;
  for (const [campo, mensaje] of Object.entries(errores)) {
    const control = formulario.querySelector(`#${prefijo}-${campo === 'ejemplos' ? 'ejemplo1' : campo}`);
    const span = formulario.querySelector(`#${prefijo}-${campo === 'ejemplos' ? 'ejemplo1' : campo}-error`);
    if (span) { span.textContent = mensaje; span.classList.remove('oculto'); }
    if (control) { control.setAttribute('aria-invalid', 'true'); primero ??= control; }
  }
  primero?.focus();
}

// ---------- Tarjeta de un envío ----------

function tarjeta(envio, usuario) {
  const p = `envio-${envio.id}`;
  const fecha = envio.creado?.toDate ? formatoFecha.format(envio.creado.toDate()) : '';
  const avisoTarjeta = el('div', { class: 'aviso oculto', role: 'alert' });
  const ejemplos = Array.from({ length: MAX_EJEMPLOS }, (_, i) => campoTexto(p, `ejemplo${i + 1}`, `Ejemplo cotidiano ${i + 1} (opcional)`, '',
    { multilinea: true, maximo: 160, filas: 2, ayuda: i === 0 ? 'De 20 a 160 caracteres. Con ejemplos, la etapa «Completa» tiene 5 preguntas; sin ellos, 4.' : undefined }));

  const confirmar = el('input', { type: 'checkbox', id: `${p}-confirmo` });
  const aprobar = el('button', { type: 'submit', class: 'boton' }, 'Aprobar y publicar');
  const formAprobar = el('form', { class: 'moderar-form', novalidate: true, 'aria-label': `Publicar «${envio.titulo}»` },
    campoTexto(p, 'titulo', 'Título', envio.titulo, { maximo: 80 }),
    campoTexto(p, 'texto', 'Trabalenguas', envio.texto, { multilinea: true, maximo: 500, filas: 3 }),
    el('div', { class: 'campos-par' },
      campoTexto(p, 'concepto', 'Concepto de AP', envio.concepto, { maximo: 60 }),
      campoTexto(p, 'autorNombre', 'Nombre del autor', envio.autorNombre || 'Comunidad', { maximo: 40 })),
    campoTexto(p, 'definicion', 'Definición', envio.definicion, { multilinea: true, maximo: 200, filas: 2 }),
    el('div', { class: 'campos-par' },
      campoLista(p, 'area', 'Área', AREAS, envio.area),
      campoLista(p, 'dificultad', 'Dificultad', DIFICULTADES, envio.dificultad)),
    campoLista(p, 'fuente', 'Fuente del concepto', FUENTES, '', 'Sin fuente'),
    ...ejemplos,
    el('div', { class: 'casilla' }, confirmar,
      el('label', { for: `${p}-confirmo` }, 'Confirmo que el concepto y la definición son correctos.')),
    el('span', { id: `${p}-confirmo-error`, class: 'error-campo oculto' }),
    el('div', { class: 'acciones' }, aprobar));

  const motivo = campoTexto(p, 'motivo', 'Motivo del rechazo (lo verá el autor)', '', { multilinea: true, maximo: 200, filas: 2, ayuda: 'De 5 a 200 caracteres.' });
  const rechazar = el('button', { type: 'submit', class: 'boton boton-secundario boton-peligro' }, 'Rechazar');
  const formRechazar = el('form', { class: 'moderar-form moderar-rechazo', novalidate: true, 'aria-label': `Rechazar «${envio.titulo}»` },
    motivo, el('div', { class: 'acciones' }, rechazar));

  const item = el('li', {},
    el('article', { class: 'tarjeta tarjeta-estatica moderar-tarjeta', 'aria-labelledby': `${p}-h` },
      el('div', { class: 'tarjeta-fila' },
        el('span', { class: 'estado-envio estado-pendiente' }, 'Pendiente'),
        fecha && el('span', { class: 'ayuda' }, `Enviado el ${fecha}`),
        el('span', { class: 'ayuda' }, `por ${envio.autorNombre || 'un usuario sin nombre público'}`)),
      el('h2', { id: `${p}-h` }, envio.titulo),
      el('p', { class: 'tarjeta-texto' }, `«${envio.texto}»`),
      el('div', { class: 'tarjeta-fila' }, etiquetaArea(envio.area), etiquetaDificultad(envio.dificultad)),
      el('p', { class: 'tarjeta-concepto' }, 'Concepto: ', el('strong', {}, envio.concepto), ` — ${envio.definicion}`),
      avisoTarjeta,
      el('details', { class: 'moderar-detalles', open: true },
        el('summary', {}, 'Revisar y publicar'), formAprobar),
      el('details', { class: 'moderar-detalles' },
        el('summary', {}, 'Rechazar'), formRechazar)));

  const bloquear = (si) => { aprobar.disabled = si; rechazar.disabled = si; };

  const terminar = (mensaje) => {
    pendientes -= 1;
    pintarContador();
    item.replaceChildren(el('div', { class: 'aviso aviso-ok', role: 'status' }, ...mensaje));
  };

  const fallo = (e, accion) => {
    console.error(`No se pudo ${accion} el envío`, e);
    avisoTarjeta.className = 'aviso aviso-error';
    avisoTarjeta.textContent = e.code === 'permission-denied'
      ? `No se pudo ${accion}: puede que otro editor ya lo haya revisado. Recarga la página.`
      : `No se pudo ${accion}. Revisa tu conexión e inténtalo de nuevo.`;
    bloquear(false);
  };

  formAprobar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const leer = (n) => formAprobar.querySelector(`#${p}-${n}`).value;
    const datos = armarPublicacion({
      titulo: leer('titulo'), texto: leer('texto'), concepto: leer('concepto'), definicion: leer('definicion'),
      area: leer('area'), dificultad: leer('dificultad'), autorNombre: leer('autorNombre'), fuente: leer('fuente'),
      ejemplos: Array.from({ length: MAX_EJEMPLOS }, (_, i) => leer(`ejemplo${i + 1}`)),
    });
    const errores = validarPublicacion(datos);
    if (!confirmar.checked) errores.confirmo = 'Confirma que revisaste el concepto y la definición.';
    marcarErrores(formAprobar, p, errores);
    if (Object.keys(errores).length) return;

    bloquear(true);
    try {
      const lote = writeBatch(db);
      lote.set(doc(db, 'trabalenguas', envio.id), { ...datos, creado: serverTimestamp() });
      lote.update(doc(db, 'envios', envio.id), { estado: 'aprobado', revisado: serverTimestamp() });
      lote.update(doc(db, 'usuarios', envio.autorId), { enviosPendientes: increment(-1), ultimaRevision: envio.id });
      await lote.commit();
      terminar([`Publicado: «${datos.titulo}». `, el('a', { href: `trabalenguas.html?id=${encodeURIComponent(envio.id)}` }, 'Verlo en el catálogo')]);
    } catch (err) {
      fallo(err, 'publicar');
    }
  });

  formRechazar.addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = formRechazar.querySelector(`#${p}-motivo`).value.trim().replace(/\s+/g, ' ');
    const error = validarMotivo(texto);
    marcarErrores(formRechazar, p, error ? { motivo: error } : {});
    if (error) return;

    bloquear(true);
    try {
      const lote = writeBatch(db);
      lote.update(doc(db, 'envios', envio.id), { estado: 'rechazado', motivo: texto, revisado: serverTimestamp() });
      lote.update(doc(db, 'usuarios', envio.autorId), { enviosPendientes: increment(-1), ultimaRevision: envio.id });
      await lote.commit();
      terminar([`Rechazado: «${envio.titulo}». El autor verá el motivo en «Mis envíos».`]);
    } catch (err) {
      fallo(err, 'rechazar');
    }
  });

  // El editor no debería moderar sus propias propuestas, pero las reglas no lo impiden: se avisa.
  if (envio.autorId === usuario.uid) {
    item.querySelector('.tarjeta-fila').append(el('span', { class: 'ayuda' }, '(es tu propia propuesta)'));
  }
  return item;
}

// ---------- Carga ----------

async function iniciar() {
  const usuario = await usuarioActual();
  if (!usuario) {
    location.replace('login.html');
    return;
  }
  const cargando = $('moderar-cargando');
  try {
    const perfil = await getDoc(doc(db, 'usuarios', usuario.uid));
    if (perfil.data()?.rol !== 'moderador') {
      cargando.classList.add('oculto');
      $('moderar-sin-permiso').classList.remove('oculto');
      return;
    }
    const resultado = await getDocs(query(collection(db, 'envios'), where('estado', '==', 'pendiente')));
    const envios = ordenarPorLlegada(resultado.docs.map((d) => ({ id: d.id, ...d.data() })));
    pendientes = envios.length;
    cargando.classList.add('oculto');
    pintarContador();
    if (envios.length) {
      $('moderar-lista').replaceChildren(...envios.map((envio) => tarjeta(envio, usuario)));
      $('moderar-lista').classList.remove('oculto');
    }
  } catch (e) {
    console.error('No se pudieron cargar los envíos', e);
    cargando.classList.add('oculto');
    $('moderar-error').classList.remove('oculto');
  }
}

iniciar();
