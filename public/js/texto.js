// Utilidades de texto para los juegos de la ruta de aprendizaje (HU-21 a HU-24).
// No dependen de Firebase ni del navegador: se prueban con node (tests/juegos.test.js).

/** Minúsculas y sin acentos (la ñ queda como n). Solo para comparar, nunca para mostrar. */
export function normalizar(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Palabras tal como se muestran (con su puntuación pegada). */
export function palabras(texto) {
  return String(texto ?? '').split(/\s+/).filter(Boolean);
}

/** Palabra normalizada y sin signos de puntuación, para comparar. */
export function limpiarPalabra(palabra) {
  return normalizar(palabra).replace(/[^a-z0-9]/g, '');
}

/** Copia barajada (Fisher-Yates). `azar` se puede inyectar en las pruebas. */
export function barajar(lista, azar = Math.random) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
