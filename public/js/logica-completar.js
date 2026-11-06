// HU-14 · Lógica de las preguntas del trabalenguas (sin Firebase ni navegador; se prueba con node).
// Cada partida es sobre UN trabalenguas: la palabra que falta, su concepto, su definición y
// ejemplos de la vida diaria (campo `ejemplos` de la semilla, validado por el editor).
// Los distractores salen de otros trabalenguas, de preferencia de la misma área.
import { barajar, limpiarPalabra, normalizar, palabras } from './texto.js';

export const UMBRAL = 0.75; // 4 de 5 (o 3 de 4) para superar la etapa
export const minimoParaSuperar = (total) => Math.ceil(total * UMBRAL);
const AREAS = ['Scrum', 'Planeación', 'Riesgos', 'Calidad', 'Liderazgo'];

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

/**
 * Texto con la palabra oculta cambiada por un hueco en TODAS las veces que aparece
 * (sin importar mayúsculas ni acentos), para que la respuesta no quede a la vista.
 * Conserva la puntuación de alrededor.
 */
export function fraseConHueco(texto, oculta, hueco = '_____') {
  return palabras(texto).map((p) => (limpiarPalabra(p) === oculta.limpia ? p.replace(sinSignos(p), hueco) : p)).join(' ');
}

// Los distractores copian el uso de mayúscula de la respuesta, para que no la delaten.
function igualarMayuscula(palabra, modelo) {
  const inicial = modelo.charAt(0);
  const mayuscula = inicial === inicial.toUpperCase() && inicial !== inicial.toLowerCase();
  return (mayuscula ? palabra.charAt(0).toUpperCase() : palabra.charAt(0).toLowerCase()) + palabra.slice(1);
}

/** 3 palabras de otros trabalenguas (misma área primero, largo parecido), nunca del propio. */
export function distractoresPalabra(objetivo, oculta, todos, azar = Math.random, cuantos = 3) {
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
    return barajar(salida, azar).sort((a, b) => Math.abs(a.limpia.length - oculta.limpia.length) - Math.abs(b.limpia.length - oculta.limpia.length));
  };
  const otros = todos.filter((t) => t.id !== objetivo.id);
  const elegidos = candidatos(otros.filter((t) => t.area === objetivo.area)).slice(0, cuantos);
  if (elegidos.length < cuantos) elegidos.push(...candidatos(otros.filter((t) => t.area !== objetivo.area)).slice(0, cuantos - elegidos.length));
  return elegidos.map((d) => igualarMayuscula(d.palabra, oculta.palabra));
}

/**
 * Opciones: la correcta y 3 distractores sacados de `extraer(t)` de otros trabalenguas,
 * primero de la misma área. Sin repetidos (ignorando acentos y mayúsculas).
 */
function opciones(correcta, objetivo, todos, extraer, azar, cuantos = 3) {
  const vistos = new Set([normalizar(correcta), normalizar(extraer(objetivo) ?? '')]);
  const tomar = (lista) => barajar(lista, azar).map(extraer).filter((v) => {
    if (!v || vistos.has(normalizar(v))) return false;
    vistos.add(normalizar(v));
    return true;
  });
  const otros = todos.filter((t) => t.id !== objetivo.id && normalizar(t.concepto) !== normalizar(objetivo.concepto));
  const elegidos = tomar(otros.filter((t) => t.area === objetivo.area)).slice(0, cuantos);
  if (elegidos.length < cuantos) elegidos.push(...tomar(otros.filter((t) => t.area !== objetivo.area)).slice(0, cuantos - elegidos.length));
  return barajar([correcta, ...elegidos], azar);
}

const tieneEjemplos = (t) => Array.isArray(t.ejemplos) && t.ejemplos.length > 0;

/**
 * Preguntas de un trabalenguas: { tipo, enunciado, cita, opciones, correcta, explicacion }.
 * Con ejemplos: palabra, concepto, definición, situación y ejemplo (5).
 * Sin ejemplos (por ejemplo, un envío nuevo): palabra, concepto, definición y área (4).
 */
export function armarPreguntas(t, todos, azar = Math.random) {
  const lista = [];
  const oculta = palabraOculta(t.texto);
  if (oculta) {
    const cita = fraseConHueco(t.texto, oculta);
    const huecos = cita.split('_____').length - 1;
    lista.push({
      tipo: 'palabra',
      enunciado: huecos > 1 ? `¿Qué palabra falta? Es la misma en los ${huecos} huecos.` : '¿Qué palabra falta en el trabalenguas?',
      cita,
      correcta: oculta.palabra,
      opciones: barajar([oculta.palabra, ...distractoresPalabra(t, oculta, todos, azar)], azar),
      explicacion: `«${t.texto}»`,
    });
  }
  lista.push({
    tipo: 'concepto',
    enunciado: '¿Qué concepto de administración de proyectos trabaja este trabalenguas?',
    cita: t.texto,
    correcta: t.concepto,
    opciones: opciones(t.concepto, t, todos, (x) => x.concepto, azar),
    explicacion: `${t.concepto}: ${t.definicion}`,
  });
  lista.push({
    tipo: 'definicion',
    enunciado: `¿Qué significa «${t.concepto}»?`,
    cita: null,
    correcta: t.definicion,
    opciones: opciones(t.definicion, t, todos, (x) => x.definicion, azar),
    explicacion: `${t.concepto}: ${t.definicion}`,
  });
  if (tieneEjemplos(t)) {
    const [situacion, ejemplo = situacion] = barajar(t.ejemplos, azar);
    lista.push({
      tipo: 'situacion',
      enunciado: 'En la vida diaria, ¿a qué concepto corresponde esta situación?',
      cita: situacion,
      correcta: t.concepto,
      opciones: opciones(t.concepto, t, todos, (x) => x.concepto, azar),
      explicacion: `Es un ejemplo de ${t.concepto}: ${t.definicion}`,
    });
    const unEjemplo = (x) => (tieneEjemplos(x) ? x.ejemplos[Math.floor(azar() * x.ejemplos.length)] : null);
    lista.push({
      tipo: 'ejemplo',
      enunciado: `¿Cuál de estas situaciones es un ejemplo cotidiano de «${t.concepto}»?`,
      cita: null,
      correcta: ejemplo,
      opciones: opciones(ejemplo, t, todos.filter(tieneEjemplos), unEjemplo, azar),
      explicacion: `${t.concepto}: ${t.definicion}`,
    });
  } else {
    lista.push({
      tipo: 'area',
      enunciado: `¿A qué área de administración de proyectos pertenece «${t.concepto}»?`,
      cita: null,
      correcta: t.area,
      opciones: barajar([t.area, ...barajar(AREAS.filter((a) => a !== t.area), azar).slice(0, 3)], azar),
      explicacion: `${t.concepto} es del área de ${t.area}.`,
    });
  }
  return lista;
}

export const esCorrecta = (pregunta, opcion) => normalizar(opcion) === normalizar(pregunta.correcta);
