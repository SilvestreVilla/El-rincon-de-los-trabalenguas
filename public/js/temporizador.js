// HU-09 · Temporizador y mejor tiempo (RF-04)
// Guarda en progreso/{uid}_{trabalenguasId}: mejorTiempoSeg, practicas y ultimaPractica.
// Cada tiempo guardado cuenta como práctica para la racha (regla de la sección 3.2 del plan).
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { usuarioActual } from './ui.js';

const formato = (segundos) => `${segundos.toFixed(1)} s`;

export async function iniciarTemporizador(trabalenguasId) {
  const boton = document.getElementById('btn-temporizador');
  const pantalla = document.getElementById('tiempo');
  const mejor = document.getElementById('mejor-tiempo');
  const estado = document.getElementById('temporizador-estado');

  const usuario = await usuarioActual();
  const referencia = usuario ? doc(db, 'progreso', `${usuario.uid}_${trabalenguasId}`) : null;
  let mejorTiempo = null;
  let inicio = 0;
  let reloj = null;

  const pintarMejor = () => {
    mejor.textContent = mejorTiempo === null
      ? 'Aún no tienes un mejor tiempo.'
      : `Tu mejor tiempo: ${formato(mejorTiempo)}`;
  };

  if (referencia) {
    try {
      const instantanea = await getDoc(referencia);
      const guardado = instantanea.exists() ? instantanea.data().mejorTiempoSeg : null;
      mejorTiempo = typeof guardado === 'number' ? guardado : null;
    } catch (e) {
      console.error('No se pudo leer el mejor tiempo', e);
    }
  }
  pintarMejor();

  function iniciar() {
    estado.textContent = '';
    inicio = performance.now();
    pantalla.textContent = formato(0);
    reloj = setInterval(() => {
      pantalla.textContent = formato((performance.now() - inicio) / 1000);
    }, 100);
    boton.textContent = 'Detener';
  }

  async function detener() {
    clearInterval(reloj);
    // Un decimal; mínimo 0.1 s para que sea un tiempo válido.
    const segundos = Math.max(0.1, Math.round((performance.now() - inicio) / 100) / 10);
    pantalla.textContent = formato(segundos);
    boton.textContent = 'Iniciar';

    if (!usuario) {
      estado.replaceChildren('Inicia sesión para guardar tu tiempo. ', Object.assign(document.createElement('a'), { href: 'login.html', textContent: 'Iniciar sesión' }));
      return;
    }

    boton.disabled = true;
    const esMejor = mejorTiempo === null || segundos < mejorTiempo;
    const datos = {
      usuarioId: usuario.uid,
      trabalenguasId,
      practicas: increment(1),
      ultimaPractica: serverTimestamp(),
    };
    if (esMejor) datos.mejorTiempoSeg = segundos;
    try {
      await setDoc(referencia, datos, { merge: true });
      if (esMejor) {
        mejorTiempo = segundos;
        pintarMejor();
        estado.textContent = '¡Nuevo mejor tiempo!';
      } else {
        estado.textContent = 'Tiempo guardado como práctica.';
      }
    } catch (e) {
      console.error('No se pudo guardar el tiempo', e);
      estado.textContent = 'No pudimos guardar tu tiempo. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      boton.disabled = false;
    }
  }

  boton.addEventListener('click', () => (reloj === null || boton.textContent === 'Iniciar' ? iniciar() : detener()));
}
