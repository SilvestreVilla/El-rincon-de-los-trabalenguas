// HU-03 · Recuperar contraseña (T1-14)
import { sendPasswordResetEmail } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth } from './firebase.js';
import { aviso, correoValido, errorCampo } from './ui.js';

const $ = (id) => document.getElementById(id);
const form = $('form-recuperar');
const correo = $('correo');
const enviar = $('enviar');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  aviso($('aviso'), 'error');
  const valor = correo.value.trim();
  if (!correoValido(valor)) {
    errorCampo(correo, $('error-correo'), 'Escribe un correo válido.');
    return;
  }
  errorCampo(correo, $('error-correo'), '');

  enviar.disabled = true;
  enviar.textContent = 'Enviando…';
  try {
    await sendPasswordResetEmail(auth, valor);
  } catch (err) {
    // Criterio de aceptación: el mensaje es el mismo exista o no la cuenta.
    // Solo un fallo de red o de límite se informa distinto.
    if (err.code === 'auth/network-request-failed' || err.code === 'auth/too-many-requests') {
      aviso($('aviso'), 'error', err.code === 'auth/too-many-requests'
        ? 'Hubo demasiados intentos. Espera unos minutos e intenta de nuevo.'
        : 'No hay conexión. Revisa tu internet e intenta de nuevo.');
      enviar.disabled = false;
      enviar.textContent = 'Enviar enlace';
      return;
    }
  }
  $('correo-enviado').textContent = valor;
  form.classList.add('oculto');
  $('enviado').classList.remove('oculto');
  enviar.disabled = false;
  enviar.textContent = 'Enviar enlace';
});

$('otro-correo').addEventListener('click', () => {
  correo.value = '';
  $('enviado').classList.add('oculto');
  form.classList.remove('oculto');
  correo.focus();
});
