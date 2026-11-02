// HU-14 · Lógica de «Completar la frase» (sin Firebase ni navegador; se prueba con node).
// La palabra oculta y los distractores se generan aquí: no se guardan datos de juego en Firestore
// (decisión del 2 de noviembre), así que el juego funciona con cualquier trabalenguas aprobado.
import { barajar, limpiarPalabra, palabras } from './texto.js';

export const PREGUNTAS_POR_PARTIDA = 5;

// Artículos, preposiciones y otras palabras cortas que no sirven como palabra oculta.
const VACIAS = new Set(('el la los las un una unos unas lo al del de a en y e o u ni que con por para sin sobre entre '
  + 'se su sus le les me te nos mi tu si no es son mas muy ya como pero cada este esta esto ese esa').split(' '));

const sinSignos = (palabra) => palabra.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
const sirve = (limpia) => limpia.length >= 3 && !VACIAS.has(limpia);

/** Palabra oculta: la más larga del texto que no sea artículo ni preposición (en empate, la primera). */
export function palabraOculta(texto) {
  let mejor = null;
  palabras(texto).forEach((original, indice) => {
    const limpia = limpiarPalabra(original);
    if (!sirve(limpia)) return;
    if (!mejor || limpia.length > mejor.limpia.length) mejor = { indice, palabra: sinSignos(original), limpia };
  });
  return mejor;
}

/** Texto con la palabra oculta cambiada por un hueco; conserva la puntuación de alrededor. */
export function fraseConHueco(texto, oculta, hueco = '_____') {
  return palabras(texto).map((p, i) => (i === oculta.indice ? p.replace(oculta.palabra, hueco) : p)).join(' ');
}

/**
 * 3 distractores: palabras de otros trabalenguas, de preferencia de la misma área y de largo parecido.
 * Nunca usa palabras del propio trabalenguas ni repite opciones.
 */
export function distractores(objetivo, oculta, todos, azar = Math.random, cuantos = 3) {
  const propias = new Set(palabras(objetivo.texto).map(limpiarPalabra));
  const vistos = new Set([oculta.limpia]);
  const candidatos = (lista) => {
    const salida = [];
    for (const t of lista) {
      for (const original of palabras(t.texto)) {
        const limpia = limpiarPalabra(original);
        if (!sirve(limpia) || propias.has(limpia) || vistos.has(limpia)) continue;
        vistos.add(limpia);
        salida.push({ palabra: sinSignos(original), limpia });
      }
    }
    // Barajar y luego preferir las de largo parecido (orden estable).
    return barajar(salida, azar).sort((a, b) => Math.abs(a.limpia.length - oculta.limpia.length) - Math.abs(b.limpia.length - oculta.limpia.length));
  };
  const otros = todos.filter((t) => t.id !== objetivo.id);
  const elegidos = candidatos(otros.filter((t) => t.area === objetivo.area)).slice(0, cuantos);
  if (elegidos.length < cuantos) {
    elegidos.push(...candidatos(otros.filter((t) => t.area !== objetivo.area)).slice(0, cuantos - elegidos.length));
  }
  return elegidos.map((d) => d.palabra);
}

/**
 * Arma una partida. Si se da idInicial, ese trabalenguas es la primera pregunta (viene de su ruta).
 * Cada pregunta: { t, oculta, frase, opciones (4, revueltas) }.
 */
// Los distractores copian el uso de mayúscula de la respuesta, para que no la delaten.
function igualarMayuscula(palabra, modelo) {
  const mayuscula = modelo.charAt(0) === modelo.charAt(0).toUpperCase() && modelo.charAt(0) !== modelo.charAt(0).toLowerCase();
  const resto = palabra.slice(1);
  return (mayuscula ? palabra.charAt(0).toUpperCase() : palabra.charAt(0).toLowerCase()) + resto;
}

export function armarPartida(todos, idInicial = null, azar = Math.random, cuantas = PREGUNTAS_POR_PARTIDA) {
  const utiles = todos.filter((t) => palabraOculta(t.texto));
  const primero = utiles.find((t) => t.id === idInicial);
  const resto = barajar(utiles.filter((t) => t !== primero), azar);
  const elegidos = (primero ? [primero, ...resto] : resto).slice(0, cuantas);
  return elegidos.map((t) => {
    const oculta = palabraOculta(t.texto);
    return {
      t,
      oculta,
      frase: fraseConHueco(t.texto, oculta),
      opciones: barajar([oculta.palabra, ...distractores(t, oculta, todos, azar).map((d) => igualarMayuscula(d, oculta.palabra))], azar),
    };
  });
}

export const esCorrecta = (pregunta, opcion) => limpiarPalabra(opcion) === pregunta.oculta.limpia;
