// HU-25 · Pruebas de la lógica del Memorama de conceptos. npm run test:juegos
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { armarTablero, elegirConceptos, esPareja, PARES } from '../public/js/logica-memorama.js';

const { trabalenguas: todos } = JSON.parse(readFileSync(new URL('../data/trabalenguas.json', import.meta.url), 'utf8'));

describe('Memorama de conceptos (HU-25)', () => {
  test('el tablero usa los 6 conceptos del área e incluye el trabalenguas de la ruta', () => {
    const t = todos.find((x) => x.area === 'Riesgos');
    const elegidos = elegirConceptos(todos, 'Riesgos', t.id);
    assert.equal(elegidos.length, PARES);
    assert.ok(elegidos.every((x) => x.area === 'Riesgos'));
    assert.equal(elegidos[0].id, t.id);
  });

  test('si el área tiene pocos conceptos se completa con otras áreas, sin repetir', () => {
    const pocos = todos.filter((x) => x.area !== 'Calidad').concat(todos.filter((x) => x.area === 'Calidad').slice(0, 2));
    const elegidos = elegirConceptos(pocos, 'Calidad');
    assert.equal(elegidos.length, PARES);
    assert.equal(new Set(elegidos.map((x) => x.concepto)).size, PARES);
  });

  test('cada concepto tiene exactamente una carta de definición que es su pareja', () => {
    const cartas = armarTablero(elegirConceptos(todos, 'Scrum'));
    assert.equal(cartas.length, PARES * 2);
    for (const c of cartas) {
      assert.equal(cartas.filter((o) => esPareja(c, o)).length, 1);
    }
  });

  test('dos cartas del mismo tipo nunca son pareja', () => {
    const [a] = armarTablero(elegirConceptos(todos, 'Scrum'));
    assert.equal(esPareja(a, { ...a, id: 99 }), false);
  });
});
