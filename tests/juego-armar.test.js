// HU-22 · Pruebas de la lógica de «Arma el trabalenguas». npm run test:juegos
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { fragmentar, MAXIMO_FRAGMENTOS, revisar, revolver } from '../public/js/logica-armar.js';

describe('Arma el trabalenguas (HU-22)', () => {
  const texto = 'El Scrum Master sirve al equipo y quita impedimentos para que el Sprint avance sin tropiezos';

  test('la dificultad cambia el tamaño de los fragmentos', () => {
    const corto = 'Tres tristes tigres tragaban trigo en un trigal';
    assert.equal(fragmentar(corto, 'Difícil').length, 8);
    assert.equal(fragmentar(corto, 'Medio').length, 4);
    assert.equal(fragmentar(corto, 'Fácil').length, 3);
  });

  test('un texto largo no pasa del máximo de fragmentos', () => {
    assert.ok(fragmentar(texto, 'Difícil').length <= MAXIMO_FRAGMENTOS); // 16 palabras
  });

  test('los fragmentos unidos forman el texto original', () => {
    assert.equal(fragmentar(texto, 'Medio').map((f) => f.texto).join(' '), texto);
  });

  test('nunca se muestran ya en orden', () => {
    const correctos = fragmentar('uno dos', 'Difícil');
    for (let i = 0; i < 20; i += 1) {
      assert.notDeepEqual(revolver(correctos).map((f) => f.texto), ['uno', 'dos']);
    }
  });

  test('revisar marca las posiciones fuera de lugar y acepta fragmentos repetidos', () => {
    const correctos = fragmentar('pato pato ganso', 'Difícil');
    assert.deepEqual(revisar(correctos, [correctos[1], correctos[0], correctos[2]]), [true, true, true]);
    assert.deepEqual(revisar(correctos, [correctos[2], correctos[0], correctos[1]]), [false, true, false]);
  });
});
