// HU-07 · Guardar favoritos desde el detalle (RF-04)
// El favorito vive en progreso/{uid}_{trabalenguasId}; HU-08 y HU-09 usarán el mismo documento.
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { usuarioActual } from './ui.js';

export async function iniciarFavorito(trabalenguasId) {
  const boton = document.getElementById('btn-favorito');
  const error = document.getElementById('favorito-error');
  const usuario = await usuarioActual();
  let activo = false;

  const pintar = () => {
    boton.textContent = activo ? '★ En mis favoritos' : '☆ Guardar en favoritos';
    boton.setAttribute('aria-pressed', String(activo));
  };

  const referencia = usuario ? doc(db, 'progreso', `${usuario.uid}_${trabalenguasId}`) : null;
  if (referencia) {
    try {
      const instantanea = await getDoc(referencia);
      activo = instantanea.exists() && instantanea.data().esFavorito === true;
    } catch (e) {
      console.error('No se pudo leer el favorito', e);
    }
  }
  pintar();

  boton.addEventListener('click', async () => {
    // Un visitante que intenta marcar un favorito va a iniciar sesión.
    if (!usuario) {
      location.href = 'login.html';
      return;
    }
    boton.disabled = true;
    error.classList.add('oculto');
    try {
      await setDoc(referencia, { usuarioId: usuario.uid, trabalenguasId, esFavorito: !activo }, { merge: true });
      activo = !activo;
      pintar();
    } catch (e) {
      console.error('No se pudo guardar el favorito', e);
      error.textContent = 'No pudimos guardar tu favorito. Revisa tu conexión e inténtalo de nuevo.';
      error.classList.remove('oculto');
    } finally {
      boton.disabled = false;
    }
  });
}
