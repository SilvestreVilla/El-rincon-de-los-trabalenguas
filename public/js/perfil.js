// HU-02 · Perfil con sesión iniciada y cierre de sesión (T1-11, T1-12)
// HU-18 · Eliminar la cuenta (con contraseña y confirmación escrita)
import { signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { auth, db } from './firebase.js';
import { errorCampo, usuarioActual } from './ui.js';
import { eliminarCuenta } from './eliminar-cuenta.js';

const $ = (id) => document.getElementById(id);

const usuario = await usuarioActual();
if (!usuario) {
  location.replace('login.html');
} else {
  if (new URLSearchParams(location.search).has('nuevo')) $('bienvenida').classList.remove('oculto');

  $('perfil-correo').textContent = usuario.email;
  let rol = 'usuario';
  let desde = new Date(usuario.metadata.creationTime);
  try {
    const datos = (await getDoc(doc(db, 'usuarios', usuario.uid))).data();
    if (datos?.rol) rol = datos.rol;
    if (datos?.creado?.toDate) desde = datos.creado.toDate();
  } catch (e) {
    console.error('No se pudo leer el perfil', e);
  }
  $('perfil-rol').textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
  // HU-13: el editor de contenido entra a la moderación desde su perfil.
  if (rol === 'moderador') $('ir-moderar').classList.remove('oculto');
  $('perfil-desde').textContent = desde.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  $('perfil-cargando').classList.add('oculto');
  $('perfil').classList.remove('oculto');
  $('zona-eliminar').classList.remove('oculto');

  $('cerrar-sesion').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    await signOut(auth);
    location.href = 'index.html';
  });

  // ---------- HU-18 · Eliminar la cuenta ----------
  const form = $('form-eliminar');
  const contrasena = $('eliminar-contrasena');
  const confirmacion = $('eliminar-confirmacion');
  const avisoEliminar = $('aviso-eliminar');

  $('abrir-eliminar').addEventListener('click', () => {
    $('abrir-eliminar').classList.add('oculto');
    form.classList.remove('oculto');
    contrasena.focus();
  });
  $('cancelar-eliminar').addEventListener('click', () => {
    form.reset();
    form.classList.add('oculto');
    avisoEliminar.classList.add('oculto');
    $('abrir-eliminar').classList.remove('oculto');
    $('abrir-eliminar').focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const sinContrasena = contrasena.value ? '' : 'Escribe tu contraseña.';
    const sinConfirmar = confirmacion.value.trim().toUpperCase() === 'ELIMINAR' ? '' : 'Escribe ELIMINAR para confirmar.';
    errorCampo(contrasena, $('error-eliminar-contrasena'), sinContrasena);
    errorCampo(confirmacion, $('error-eliminar-confirmacion'), sinConfirmar);
    if (sinContrasena || sinConfirmar) {
      (sinContrasena ? contrasena : confirmacion).focus();
      return;
    }

    const botones = form.querySelectorAll('button');
    botones.forEach((b) => { b.disabled = true; });
    avisoEliminar.classList.add('oculto');
    try {
      const r = await eliminarCuenta(usuario, contrasena.value, (paso) => { $('eliminar-progreso').textContent = paso; });
      $('perfil').classList.add('oculto');
      $('zona-eliminar').classList.add('oculto');
      $('eliminada-detalle').textContent = r.anonimas
        ? `Borramos tus datos. ${r.anonimas === 1 ? 'Tu trabalenguas publicado sigue en el catálogo' : `Tus ${r.anonimas} trabalenguas publicados siguen en el catálogo`} con autor «Anónimo». Gracias por participar.`
        : 'Borramos tus datos. Gracias por participar.';
      $('cuenta-eliminada').classList.remove('oculto');
      $('eliminada-titulo').focus?.();
    } catch (err) {
      console.error('No se pudo eliminar la cuenta', err);
      const contrasenaMala = ['auth/invalid-credential', 'auth/wrong-password', 'auth/invalid-login-credentials'].includes(err.code);
      avisoEliminar.className = 'aviso aviso-error';
      avisoEliminar.textContent = contrasenaMala
        ? 'La contraseña no es correcta. No se borró nada.'
        : err.code === 'auth/too-many-requests'
          ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo. No se borró nada.'
          : 'No pudimos terminar de eliminar tu cuenta. Revisa tu conexión y vuelve a intentarlo: se borrará lo que falte.';
      if (contrasenaMala) errorCampo(contrasena, $('error-eliminar-contrasena'), 'Contraseña incorrecta.');
      $('eliminar-progreso').textContent = '';
      botones.forEach((b) => { b.disabled = false; });
    }
  });
}
