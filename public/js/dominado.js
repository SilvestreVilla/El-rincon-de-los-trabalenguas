// HU-08 · Marcar como dominado (RF-04)
// El estado vive en progreso/{uid}_{trabalenguasId}, campo `dominado`, en el mismo documento
// que usan HU-07 (esFavorito) y HU-09 (mejorTiempoSeg, practicas, ultimaPractica).
// Solo se escribe `dominado` (más los campos de identificación) con merge: el resto no se toca.
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { usuarioActual } from './ui.js';

export async function iniciarDominado(trabalenguasId) {
  const boton = document.getElementById('btn-dominado');
  const contador = document.getElementById('contador-dominados');
  const error = document.getElementById('dominado-error');
  const usuario = await usuarioActual();
  let activo = false;
  let total = null; // null = desconocido (visitante o lectura fallida)

  const pintar = () => {
    boton.textContent = activo ? '✓ Dominado' : 'Marcar como dominado';
    boton.setAttribute('aria-pressed', String(activo));
    if (!usuario) {
      contador.replaceChildren('Inicia sesión para llevar la cuenta de tus trabalenguas dominados. ',
        Object.assign(document.createElement('a'), { href: 'login.html', textContent: 'Iniciar sesión' }));
    } else if (total === null) {
      contador.textContent = 'No pudimos cargar tu contador de dominados.';
    } else {
      contador.textContent = total === 1
        ? 'Has dominado 1 trabalenguas'
        : `Has dominado ${total} trabalenguas`;
    }
  };

  const referencia = usuario ? doc(db, 'progreso', `${usuario.uid}_${trabalenguasId}`) : null;
  if (referencia) {
    // Estado de este trabalenguas y total del usuario, en paralelo.
    const [estado, dominados] = await Promise.allSettled([
      getDoc(referencia),
      getDocs(query(collection(db, 'progreso'), where('usuarioId', '==', usuario.uid), where('dominado', '==', true))),
    ]);
    if (estado.status === 'fulfilled') {
      activo = estado.value.exists() && estado.value.data().dominado === true;
    } else {
      console.error('No se pudo leer el estado de dominado', estado.reason);
    }
    if (dominados.status === 'fulfilled') {
      total = dominados.value.size;
    } else {
      console.error('No se pudo leer el contador de dominados', dominados.reason);
    }
  }
  pintar();

  boton.addEventListener('click', async () => {
    // Un visitante que intenta marcar un trabalenguas va a iniciar sesión.
    if (!usuario) {
      location.href = 'login.html';
      return;
    }
    boton.disabled = true;
    error.classList.add('oculto');
    const nuevo = !activo;
    // Cambio inmediato en pantalla; si falla el guardado se revierte.
    activo = nuevo;
    if (total !== null) total += nuevo ? 1 : -1;
    pintar();
    try {
      await setDoc(referencia, { usuarioId: usuario.uid, trabalenguasId, dominado: nuevo }, { merge: true });
    } catch (e) {
      console.error('No se pudo guardar el estado de dominado', e);
      activo = !nuevo;
      if (total !== null) total += nuevo ? -1 : 1;
      pintar();
      error.textContent = 'No pudimos guardar tu progreso. Revisa tu conexión e inténtalo de nuevo.';
      error.classList.remove('oculto');
    } finally {
      boton.disabled = false;
    }
  });
}
