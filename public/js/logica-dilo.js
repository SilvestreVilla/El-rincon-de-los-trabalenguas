// HU-24 · Lógica de «Dilo en voz alta» (sin Firebase ni navegador; se prueba con node).
import { limpiarPalabra, palabras } from './texto.js';

export const UMBRAL = 0.8; // 80 % de las palabras reconocidas para superar la etapa

function distancia(a, b) {
  const fila = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let previo = fila[0];
    fila[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const guardado = fila[j];
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, previo + (a[i - 1] === b[j - 1] ? 0 : 1));
      previo = guardado;
    }
  }
  return fila[b.length];
}

/**
 * ¿El reconocedor oyó la palabra? Tolera errores típicos: la h muda («olgura» por «holgura»)
 * y una letra de diferencia en palabras de 5 letras o más.
 */
export function parecidas(esperada, oida) {
  if (!esperada || !oida) return false;
  if (esperada === oida) return true;
  const sinH = (p) => p.replace(/^h/, '');
  if (sinH(esperada) === sinH(oida)) return true;
  return esperada.length >= 5 && distancia(esperada, oida) <= 1;
}

/**
 * Compara el texto con lo que se dijo, respetando el orden (subsecuencia común más larga).
 * Devuelve { palabras: [{ palabra, dicha }], porcentaje (0 a 1), superada }.
 */
export function compararDicho(texto, transcripcion) {
  const originales = palabras(texto);
  const esperadas = originales.map(limpiarPalabra);
  const oidas = palabras(transcripcion).map(limpiarPalabra).filter(Boolean);
  const n = esperadas.length;
  const m = oidas.length;
  const tabla = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      tabla[i][j] = parecidas(esperadas[i], oidas[j]) ? tabla[i + 1][j + 1] + 1 : Math.max(tabla[i + 1][j], tabla[i][j + 1]);
    }
  }
  const dichas = new Array(n).fill(false);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (parecidas(esperadas[i], oidas[j])) { dichas[i] = true; i += 1; j += 1; }
    else if (tabla[i + 1][j] >= tabla[i][j + 1]) i += 1;
    else j += 1;
  }
  // Las «palabras» que son solo signos (por ejemplo «—») no cuentan.
  const cuentan = esperadas.map((p) => p.length > 0);
  const total = cuentan.filter(Boolean).length || 1;
  const aciertos = dichas.filter((d, i) => d && cuentan[i]).length;
  const porcentaje = aciertos / total;
  return {
    palabras: originales.map((palabra, i) => ({ palabra, dicha: dichas[i] || !cuentan[i] })),
    porcentaje,
    superada: porcentaje >= UMBRAL,
  };
}
