// HU-24 · Pruebas de la lógica de «Dilo en voz alta». npm run test:juegos
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { compararDicho, parecidas, UMBRAL } from '../public/js/logica-dilo.js';

const texto = 'Tres tristes tigres tragaban trigo en un trigal.';

describe('Dilo en voz alta (HU-24)', () => {
  test('decirlo completo da 100 % sin importar acentos, mayúsculas ni signos', () => {
    const r = compararDicho('La holgura, ¡qué lujo!', 'la holgura que lujo');
    assert.equal(r.porcentaje, 1);
    assert.ok(r.superada);
  });

  test('las palabras que faltan se marcan y bajan el porcentaje', () => {
    const r = compararDicho(texto, 'tres tristes tigres trigo en un trigal');
    assert.deepEqual(r.palabras.filter((p) => !p.dicha).map((p) => p.palabra), ['tragaban']);
    assert.equal(r.porcentaje, 7 / 8);
    assert.ok(r.superada);
  });

  test('importa el orden: decir las palabras revueltas no cuenta todo', () => {
    const r = compararDicho(texto, 'trigal un en trigo tragaban tigres tristes tres');
    assert.ok(r.porcentaje < UMBRAL);
  });

  test('menos del 80 % no supera la etapa', () => {
    assert.equal(compararDicho(texto, 'tres tristes tigres').superada, false);
    assert.equal(compararDicho(texto, '').porcentaje, 0);
  });

  test('tolera la h muda y una letra de diferencia en palabras largas', () => {
    assert.ok(parecidas('holgura', 'olgura'));
    assert.ok(parecidas('cronograma', 'cronogramas'));
    assert.ok(!parecidas('tres', 'tras'));
  });
});
