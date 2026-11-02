// Pruebas de la lógica de los juegos de la ruta (HU-21 a HU-24). No necesitan emulador:
// npm run test:juegos  (cada juego tiene su archivo tests/juego-*.test.js)
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { barajar, limpiarPalabra, normalizar, palabras } from '../public/js/texto.js';

describe('texto (HU-21)', () => {
  test('normalizar quita mayúsculas y acentos', () => {
    assert.equal(normalizar('Planeación ÁGIL'), 'planeacion agil');
  });

  test('palabras conserva la puntuación para mostrarla', () => {
    assert.deepEqual(palabras('  Tres tristes   tigres, comen. '), ['Tres', 'tristes', 'tigres,', 'comen.']);
  });

  test('limpiarPalabra quita signos y acentos', () => {
    assert.equal(limpiarPalabra('¡Sprint!'), 'sprint');
    assert.equal(limpiarPalabra('«Línea»'), 'linea');
  });

  test('barajar no pierde ni repite elementos', () => {
    const lista = [1, 2, 3, 4, 5, 6];
    assert.deepEqual([...barajar(lista)].sort(), lista);
    assert.deepEqual(lista, [1, 2, 3, 4, 5, 6]);
  });
});
