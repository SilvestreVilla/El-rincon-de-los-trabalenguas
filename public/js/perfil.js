// HU-02 · Perfil con sesión iniciada y cierre de sesión (T1-11, T1-12)
import { signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { auth, db } from './firebase.js';
import { usuarioActual } from './ui.js';

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
  $('perfil-desde').textContent = desde.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  $('perfil-cargando').classList.add('oculto');
  $('perfil').classList.remove('oculto');

  $('cerrar-sesion').addEventListener('click', async (e) => {
    e.currentTarget.disabled = true;
    await signOut(auth);
    location.href = 'index.html';
  });
}
