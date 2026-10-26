// HU-02 · Iniciar sesión (T1-11, T1-12)
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth } from './firebase.js';
import { aviso, usuarioActual } from './ui.js';

const $ = (id) => document.getElementById(id);
const enviar = $('enviar');

usuarioActual().then((u) => { if (u) location.replace('perfil.html'); });

$('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  aviso($('aviso'), 'error');
  const correo = $('correo').value.trim();
  const contrasena = $('contrasena').value;

  enviar.disabled = true;
  enviar.textContent = 'Entrando…';
  try {
    await signInWithEmailAndPassword(auth, correo, contrasena);
    location.href = 'perfil.html';
  } catch (err) {
    // Criterio de aceptación: con credenciales incorrectas, un error genérico
    // que no revele si el correo existe.
    let mensaje = 'El correo o la contraseña no son correctos.';
    if (err.code === 'auth/too-many-requests') mensaje = 'Hubo demasiados intentos. Espera unos minutos o recupera tu contraseña.';
    if (err.code === 'auth/network-request-failed') mensaje = 'No hay conexión. Revisa tu internet e intenta de nuevo.';
    aviso($('aviso'), 'error', mensaje);
    enviar.disabled = false;
    enviar.textContent = 'Iniciar sesión';
  }
});
