// HU-12 · Proponer un trabalenguas (RF-05)
// El envío se guarda en envios/{id} como «pendiente», así que no aparece en el catálogo.
// En la misma escritura (batch) sube el contador usuarios/{uid}.enviosPendientes:
// las reglas exigen que ambos cambios vayan juntos y que el contador no pase de 5.
import { collection, doc, getDoc, increment, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { aviso, errorCampo, usuarioActual } from './ui.js';

const MAX_PENDIENTES = 5;
const AREAS = ['Scrum', 'Planeación', 'Riesgos', 'Calidad', 'Liderazgo'];
const DIFICULTADES = ['Fácil', 'Medio', 'Difícil'];

const $ = (id) => document.getElementById(id);
const form = $('form-proponer');
const enviar = $('enviar');
const campos = ['titulo', 'texto', 'concepto', 'definicion', 'area', 'dificultad'];

let usuario = null;
let pendientes = 0;

function pintarPendientes() {
  const restantes = MAX_PENDIENTES - pendientes;
  if (restantes <= 0) {
    $('pendientes').textContent = `Ya tienes ${MAX_PENDIENTES} propuestas pendientes de revisión. Podrás enviar otra cuando el editor revise alguna.`;
  } else {
    $('pendientes').textContent = pendientes === 1
      ? `Tienes 1 propuesta pendiente de revisión. Puedes enviar ${restantes} más.`
      : `Tienes ${pendientes} propuestas pendientes de revisión. Puedes enviar ${restantes} más.`;
  }
  enviar.disabled = restantes <= 0;
}

function contarCaracteres(id, maximo) {
  const campo = $(id);
  const actualizar = () => { $(`cuenta-${id}`).textContent = `${campo.value.trim().length} / ${maximo}`; };
  campo.addEventListener('input', actualizar);
  actualizar();
}

function valores() {
  return Object.fromEntries(campos.map((id) => [id, $(id).value.trim()]));
}

function validar(v) {
  const errores = {
    titulo: v.titulo ? '' : 'Escribe un título.',
    texto: v.texto.length < 20 ? 'El trabalenguas debe tener 20 caracteres o más.'
      : v.texto.length > 500 ? 'El trabalenguas debe tener 500 caracteres o menos.' : '',
    concepto: v.concepto ? '' : 'Escribe el concepto de administración de proyectos.',
    definicion: !v.definicion ? 'Escribe la definición del concepto.'
      : v.definicion.length > 200 ? 'La definición debe tener 200 caracteres o menos.' : '',
    area: AREAS.includes(v.area) ? '' : 'Elige un área.',
    dificultad: DIFICULTADES.includes(v.dificultad) ? '' : 'Elige la dificultad.',
  };
  for (const id of campos) errorCampo($(id), $(`error-${id}`), errores[id]);
  const primero = campos.find((id) => errores[id]);
  if (primero) $(primero).focus();
  return !primero;
}

async function iniciar() {
  usuario = await usuarioActual();
  // Proponer requiere sesión: el envío queda a nombre del usuario.
  if (!usuario) {
    location.replace('login.html');
    return;
  }
  try {
    const perfil = await getDoc(doc(db, 'usuarios', usuario.uid));
    pendientes = perfil.data()?.enviosPendientes ?? 0;
  } catch (e) {
    console.error('No se pudo leer el contador de envíos', e);
  }
  pintarPendientes();
}

contarCaracteres('texto', 500);
contarCaracteres('definicion', 200);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  aviso($('aviso'), 'error');
  const v = valores();
  if (!validar(v)) return;

  enviar.disabled = true;
  enviar.textContent = 'Enviando…';
  try {
    const lote = writeBatch(db);
    const envio = doc(collection(db, 'envios'));
    lote.set(envio, { autorId: usuario.uid, ...v, estado: 'pendiente', creado: serverTimestamp() });
    lote.update(doc(db, 'usuarios', usuario.uid), { enviosPendientes: increment(1), ultimoEnvio: envio.id });
    await lote.commit();

    pendientes += 1;
    form.reset();
    for (const id of ['texto', 'definicion']) $(id).dispatchEvent(new Event('input'));
    aviso($('aviso'), 'ok', '¡Gracias! Tu propuesta quedó pendiente de revisión. Aparecerá en el catálogo cuando el editor la apruebe.');
  } catch (err) {
    console.error('No se pudo enviar la propuesta', err);
    aviso($('aviso'), 'error', err.code === 'permission-denied'
      ? `No pudimos enviar tu propuesta. Recuerda que puedes tener como máximo ${MAX_PENDIENTES} propuestas pendientes.`
      : 'No pudimos enviar tu propuesta. Revisa tu conexión e inténtalo de nuevo.');
  } finally {
    enviar.textContent = 'Enviar propuesta';
    pintarPendientes();
  }
});

iniciar();
