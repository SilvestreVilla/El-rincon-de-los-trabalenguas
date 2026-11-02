// HU-22 · Lógica de «Arma el trabalenguas» (sin Firebase ni navegador; se prueba con node).
import { barajar, palabras } from './texto.js';

// Palabras por fragmento según la dificultad: más fácil = menos piezas.
const PALABRAS_POR_FRAGMENTO = { Fácil: 3, Medio: 2, Difícil: 1 };
export const MAXIMO_FRAGMENTOS = 14;

/** Divide el texto en fragmentos { id, texto }, sin pasar de MAXIMO_FRAGMENTOS. */
export function fragmentar(texto, dificultad) {
  const lista = palabras(texto);
  let tamano = PALABRAS_POR_FRAGMENTO[dificultad] ?? 2;
  while (Math.ceil(lista.length / tamano) > MAXIMO_FRAGMENTOS) tamano += 1;
  // Al menos 3 piezas para que haya algo que ordenar.
  while (tamano > 1 && Math.ceil(lista.length / tamano) < 3) tamano -= 1;
  const fragmentos = [];
  for (let i = 0; i < lista.length; i += tamano) {
    fragmentos.push({ id: fragmentos.length, texto: lista.slice(i, i + tamano).join(' ') });
  }
  return fragmentos;
}

const mismaSecuencia = (a, b) => a.length === b.length && a.every((f, i) => f.texto === b[i].texto);

/** Revuelve los fragmentos; nunca los deja en el orden correcto si existe otro orden posible. */
export function revolver(fragmentos, azar = Math.random) {
  const distintos = new Set(fragmentos.map((f) => f.texto)).size;
  if (fragmentos.length < 2 || distintos < 2) return [...fragmentos];
  let revuelto = barajar(fragmentos, azar);
  for (let intento = 0; intento < 50 && mismaSecuencia(revuelto, fragmentos); intento += 1) {
    revuelto = barajar(fragmentos, azar);
  }
  if (mismaSecuencia(revuelto, fragmentos)) revuelto = [...fragmentos.slice(1), fragmentos[0]];
  return revuelto;
}

/**
 * Compara la respuesta (fragmentos en el orden que eligió el usuario) con el orden correcto.
 * Se compara el texto, no el id: si dos fragmentos dicen lo mismo, da igual cuál se puso.
 * Devuelve un booleano por posición.
 */
export function revisar(correctos, respuesta) {
  return correctos.map((f, i) => respuesta[i]?.texto === f.texto);
}
