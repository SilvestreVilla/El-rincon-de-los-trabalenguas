// Utilidades compartidas: navegación según la sesión (HU-02) y ayudas de interfaz.
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { auth } from './firebase.js';

const CLASE_AREA = {
  Scrum: 'area-scrum',
  Planeación: 'area-planeacion',
  Riesgos: 'area-riesgos',
  Calidad: 'area-calidad',
  Liderazgo: 'area-liderazgo',
};
const PUNTOS_DIFICULTAD = { Fácil: '●○○', Medio: '●●○', Difícil: '●●●' };

/** Crea un elemento con texto seguro (nunca innerHTML con datos de Firestore). */
export function el(etiqueta, atributos = {}, ...hijos) {
  const nodo = document.createElement(etiqueta);
  for (const [clave, valor] of Object.entries(atributos)) {
    if (valor === undefined || valor === null || valor === false) continue;
    if (clave === 'class') nodo.className = valor;
    else nodo.setAttribute(clave, valor === true ? '' : valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo === null || hijo === undefined || hijo === false) continue;
    nodo.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return nodo;
}

export function etiquetaArea(area) {
  return el('span', { class: `area ${CLASE_AREA[area] ?? 'area-scrum'}` }, area);
}

export function etiquetaDificultad(dificultad) {
  return el('span', { class: 'dificultad', 'aria-label': `Dificultad: ${dificultad}` },
    `${PUNTOS_DIFICULTAD[dificultad] ?? ''} ${dificultad}`);
}

export function correoValido(correo) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

/** Marca o limpia el error de un campo. */
export function errorCampo(input, mensajeEl, mensaje) {
  if (mensaje) {
    input.setAttribute('aria-invalid', 'true');
    mensajeEl.textContent = mensaje;
    mensajeEl.classList.remove('oculto');
  } else {
    input.removeAttribute('aria-invalid');
    mensajeEl.textContent = '';
    mensajeEl.classList.add('oculto');
  }
}

/** Muestra un aviso general (role="alert") dentro de un contenedor. */
export function aviso(contenedor, tipo, ...contenido) {
  contenedor.replaceChildren(...contenido);
  contenedor.className = `aviso aviso-${tipo}`;
  contenedor.classList.toggle('oculto', contenido.length === 0);
}

// ---------- Navegación según la sesión ----------
const navSesion = document.getElementById('nav-sesion');

function pintarNavVisitante() {
  navSesion.replaceChildren(
    el('a', { href: 'login.html', class: 'boton boton-secundario' }, 'Iniciar sesión'),
    el('a', { href: 'registro.html', class: 'boton' }, 'Crear cuenta'),
  );
}

function pintarNavUsuario(usuario) {
  const inicial = (usuario.email ?? '?').charAt(0).toUpperCase();
  const salir = el('button', { type: 'button', class: 'boton boton-secundario' }, 'Cerrar sesión');
  salir.addEventListener('click', async () => {
    salir.disabled = true;
    await signOut(auth);
    location.href = 'index.html';
  });
  navSesion.replaceChildren(
    el('a', { href: 'favoritos.html', class: 'nav-texto' }, 'Mis favoritos'),
    el('a', { href: 'perfil.html', class: 'chip-usuario', 'aria-label': `Mi perfil: ${usuario.email}` },
      el('span', { class: 'avatar', 'aria-hidden': 'true' }, inicial),
      el('span', {}, usuario.email)),
    salir,
  );
}

if (navSesion) {
  onAuthStateChanged(auth, (usuario) => (usuario ? pintarNavUsuario(usuario) : pintarNavVisitante()));
}

/** Resuelve con el usuario actual cuando Firebase termina de restaurar la sesión. */
export function usuarioActual() {
  return new Promise((resolver) => {
    const dejar = onAuthStateChanged(auth, (usuario) => {
      dejar();
      resolver(usuario);
    });
  });
}
