// HU-25 · Lógica del Memorama de conceptos (sin Firebase ni navegador; se prueba con node).
import { barajar, normalizar } from './texto.js';

export const PARES = 6;
export const AREAS = ['Scrum', 'Planeación', 'Riesgos', 'Calidad', 'Liderazgo'];

/**
 * Elige los trabalenguas del tablero: los del área (con el de la ruta siempre incluido) y,
 * si el área no alcanza, completa con otras. Nunca repite un concepto.
 */
export function elegirConceptos(todos, area, idIncluir = null, azar = Math.random, pares = PARES) {
  const elegidos = [];
  const vistos = new Set();
  const agregar = (t) => {
    const clave = normalizar(t.concepto);
    if (elegidos.length >= pares || vistos.has(clave)) return;
    vistos.add(clave);
    elegidos.push(t);
  };
  const incluir = todos.find((t) => t.id === idIncluir);
  if (incluir) agregar(incluir);
  barajar(todos.filter((t) => t.area === area), azar).forEach(agregar);
  barajar(todos.filter((t) => t.area !== area), azar).forEach(agregar);
  return elegidos;
}

/** Cartas revueltas: una con el concepto y otra con la definición por cada trabalenguas. */
export function armarTablero(conceptos, azar = Math.random) {
  const cartas = conceptos.flatMap((t) => [
    { par: t.id, tipo: 'concepto', texto: t.concepto },
    { par: t.id, tipo: 'definicion', texto: t.definicion },
  ]);
  return barajar(cartas, azar).map((c, i) => ({ ...c, id: i }));
}

export const esPareja = (a, b) => a.id !== b.id && a.par === b.par && a.tipo !== b.tipo;
