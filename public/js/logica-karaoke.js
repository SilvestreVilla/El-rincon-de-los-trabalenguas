// HU-23 · Lógica del Karaoke de velocidad (sin Firebase ni navegador; se prueba con node).

// Palabras por minuto de cada velocidad. La etapa se supera leyendo en «rapida».
export const VELOCIDADES = {
  lenta: { nombre: 'Lenta', ppm: 90 },
  normal: { nombre: 'Normal', ppm: 140 },
  rapida: { nombre: 'Rápida', ppm: 200 },
};
export const VELOCIDAD_PARA_SUPERAR = 'rapida';
export const SIGUIENTE_VELOCIDAD = { lenta: 'normal', normal: 'rapida', rapida: 'rapida' };

/** Milisegundos que se ilumina cada palabra. Después de una coma o un punto hay una pausa de 50 % más. */
export function tiempos(lista, ppm) {
  const base = 60000 / ppm;
  return lista.map((p) => Math.round(/[,.;:!?…»]$/.test(p) ? base * 1.5 : base));
}

export const duracionTotal = (lista, ppm) => tiempos(lista, ppm).reduce((a, b) => a + b, 0);
