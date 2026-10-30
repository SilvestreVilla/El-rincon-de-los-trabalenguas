// HU-15 · Página «Mis envíos»
// Lista los envíos del usuario (envios/{id}, HU-12) con su estado y, si se rechazó, el motivo.
// El motivo lo captura el editor al rechazar (HU-13). Se ordena en el cliente para no necesitar índice.
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { el, etiquetaArea, etiquetaDificultad, usuarioActual } from './ui.js';

const lista = document.getElementById('envios');
const vacio = document.getElementById('envios-vacio');
const error = document.getElementById('envios-error');
const cargando = document.getElementById('envios-cargando');

const ESTADOS = {
  pendiente: { texto: 'Pendiente de revisión', clase: 'estado-pendiente' },
  aprobado: { texto: 'Aprobado', clase: 'estado-aprobado' },
  rechazado: { texto: 'Rechazado', clase: 'estado-rechazado' },
};

const formatoFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

function tarjeta(envio) {
  const estado = ESTADOS[envio.estado] ?? ESTADOS.pendiente;
  const fecha = envio.creado?.toDate ? formatoFecha.format(envio.creado.toDate()) : '';
  return el('li', {},
    el('article', { class: 'tarjeta tarjeta-estatica' },
      el('div', { class: 'tarjeta-fila' },
        el('span', { class: `estado-envio ${estado.clase}` }, estado.texto),
        fecha && el('span', { class: 'ayuda' }, `Enviado el ${fecha}`)),
      el('h2', {}, envio.titulo),
      el('p', { class: 'tarjeta-texto' }, `«${envio.texto}»`),
      el('div', { class: 'tarjeta-fila' }, etiquetaArea(envio.area), etiquetaDificultad(envio.dificultad)),
      envio.estado === 'rechazado' && el('p', { class: 'motivo-rechazo' },
        el('strong', {}, 'Motivo: '), envio.motivo || 'El editor no indicó un motivo.'),
      envio.estado === 'aprobado' && el('p', { class: 'ayuda' }, 'Ya aparece en el catálogo.'),
      el('p', { class: 'tarjeta-concepto' }, 'Concepto: ', el('strong', {}, envio.concepto)),
    ),
  );
}

async function cargar(usuario) {
  try {
    // Las reglas solo permiten consultar los envíos propios, filtrando por autorId.
    const instantanea = await getDocs(query(collection(db, 'envios'), where('autorId', '==', usuario.uid)));
    const envios = instantanea.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.creado?.toMillis?.() ?? 0) - (a.creado?.toMillis?.() ?? 0));

    cargando.classList.add('oculto');
    if (envios.length === 0) {
      vacio.classList.remove('oculto');
      return;
    }
    lista.replaceChildren(...envios.map(tarjeta));
    lista.classList.remove('oculto');
  } catch (e) {
    console.error('No se pudieron cargar los envíos', e);
    cargando.classList.add('oculto');
    error.classList.remove('oculto');
  }
}

const usuario = await usuarioActual();
if (!usuario) location.replace('login.html');
else cargar(usuario);
