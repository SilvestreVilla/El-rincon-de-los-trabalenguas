// HU-23 · Pruebas de la lógica del Karaoke de velocidad. npm run test:juegos
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { SIGUIENTE_VELOCIDAD, VELOCIDADES, duracionTotal, tiempos } from '../public/js/logica-karaoke.js';

describe('Karaoke de velocidad (HU-23)', () => {
  test('cada velocidad es más rápida que la anterior', () => {
    assert.ok(VELOCIDADES.lenta.ppm < VELOCIDADES.normal.ppm);
    assert.ok(VELOCIDADES.normal.ppm < VELOCIDADES.rapida.ppm);
  });

  test('después de una coma o un punto hay una pausa más larga', () => {
    const [a, b] = tiempos(['Sprint,', 'Daily'], 120);
    assert.equal(b, 500);
    assert.equal(a, 750);
  });

  test('la lectura rápida dura menos que la lenta', () => {
    const lista = 'Tres tristes tigres tragaban trigo'.split(' ');
    assert.ok(duracionTotal(lista, VELOCIDADES.rapida.ppm) < duracionTotal(lista, VELOCIDADES.lenta.ppm));
  });

  test('las velocidades suben hasta rápida', () => {
    assert.equal(SIGUIENTE_VELOCIDAD.lenta, 'normal');
    assert.equal(SIGUIENTE_VELOCIDAD.normal, 'rapida');
  });
});
