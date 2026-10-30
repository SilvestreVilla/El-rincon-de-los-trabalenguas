// HU-10 · Compartir un trabalenguas (RF-10)
// Cada detalle ya tiene una URL única (trabalenguas.html?id=…) y se puede abrir sin sesión,
// porque las reglas permiten leer los trabalenguas aprobados a cualquiera.
// En celular abre el menú de compartir del dispositivo; en computadora copia el enlace.

const boton = document.getElementById('btn-compartir');
const estado = document.getElementById('compartir-estado');
const id = new URLSearchParams(location.search).get('id');

function enlace() {
  return `${location.origin}${location.pathname}?id=${encodeURIComponent(id)}`;
}

function aviso(texto) {
  estado.textContent = texto;
}

async function copiar(url) {
  try {
    await navigator.clipboard.writeText(url);
    aviso('¡Enlace copiado! Pégalo en el chat de tu equipo.');
  } catch (e) {
    // Sin permiso de portapapeles: se muestra el enlace para copiarlo a mano.
    window.prompt('Copia este enlace:', url);
  }
}

async function compartir() {
  const url = enlace();
  const titulo = document.getElementById('detalle-titulo').textContent;
  const esTactil = window.matchMedia('(pointer: coarse)').matches;

  if (esTactil && navigator.share) {
    try {
      await navigator.share({ title: titulo, text: `Te reto con este trabalenguas: ${titulo}`, url });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // la persona cerró el menú
    }
  }
  await copiar(url);
}

if (boton && id) boton.addEventListener('click', compartir);
