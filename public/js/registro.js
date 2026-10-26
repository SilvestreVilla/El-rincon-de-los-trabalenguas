// HU-01 · Registro de usuario (T1-07, T1-08, T1-09)
import { createUserWithEmailAndPassword, deleteUser } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { doc, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { auth, db } from './firebase.js';
import { aviso, correoValido, el, errorCampo, usuarioActual } from './ui.js';

const $ = (id) => document.getElementById(id);
const form = $('form-registro');
const correo = $('correo');
const contrasena = $('contrasena');
const privacidad = $('privacidad');
const mayorEdad = $('mayor-edad');
const enviar = $('enviar');

// Si ya hay sesión, no tiene sentido registrarse otra vez.
usuarioActual().then((u) => { if (u) location.replace('perfil.html'); });

function validar() {
  const errores = {
    correo: correoValido(correo.value) ? '' : 'Escribe un correo válido, por ejemplo nombre@empresa.com.',
    contrasena: contrasena.value.length >= 8 ? '' : 'La contraseña debe tener 8 caracteres o más.',
    casillas: privacidad.checked && mayorEdad.checked ? '' : 'Para crear la cuenta necesitas aceptar el aviso de privacidad y confirmar que eres mayor de edad.',
  };
  errorCampo(correo, $('error-correo'), errores.correo);
  errorCampo(contrasena, $('error-contrasena'), errores.contrasena);
  const errCasillas = $('error-casillas');
  errCasillas.textContent = errores.casillas;
  errCasillas.classList.toggle('oculto', !errores.casillas);
  return !errores.correo && !errores.contrasena && !errores.casillas;
}

const MENSAJES = {
  'auth/invalid-email': 'El correo no es válido.',
  'auth/weak-password': 'La contraseña es muy débil. Usa 8 caracteres o más.',
  'auth/network-request-failed': 'No hay conexión. Revisa tu internet e intenta de nuevo.',
  'auth/too-many-requests': 'Hubo demasiados intentos. Espera unos minutos e intenta de nuevo.',
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  aviso($('aviso'), 'error');
  if (!validar()) return;

  enviar.disabled = true;
  enviar.textContent = 'Creando cuenta…';
  try {
    const { user } = await createUserWithEmailAndPassword(auth, correo.value.trim(), contrasena.value);
    try {
      // Las reglas exigen exactamente estos campos, con rol «usuario».
      await setDoc(doc(db, 'usuarios', user.uid), {
        email: user.email,
        rol: 'usuario',
        aceptoPrivacidad: true,
        mayorDeEdad: true,
        creado: serverTimestamp(),
      });
    } catch (errDoc) {
      // Sin su documento la cuenta queda incompleta: se deshace para poder reintentar.
      await deleteUser(user).catch(() => {});
      throw errDoc;
    }
    location.href = 'perfil.html?nuevo=1';
  } catch (err) {
    console.error('Registro fallido', err);
    if (err.code === 'auth/email-already-in-use') {
      aviso($('aviso'), 'error', 'Ya existe una cuenta con ese correo. ',
        el('a', { href: 'login.html' }, 'Inicia sesión'), ' o usa otro correo.');
    } else {
      aviso($('aviso'), 'error', MENSAJES[err.code] ?? 'No pudimos crear la cuenta. Intenta de nuevo en un momento.');
    }
    enviar.disabled = false;
    enviar.textContent = 'Crear cuenta';
  }
});
