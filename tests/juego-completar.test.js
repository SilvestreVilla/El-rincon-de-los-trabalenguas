// HU-14 · Pruebas de la lógica de «Completar la frase». npm run test:juegos
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { armarPartida, distractores, esCorrecta, fraseConHueco, palabraOculta } from '../public/js/logica-completar.js';

const semilla = JSON.parse(readFileSync(new URL('../data/trabalenguas.json', import.meta.url), 'utf8'));
const todos = (Array.isArray(semilla) ? semilla : semilla.trabalenguas);

describe('Completar la frase (HU-14)', () => {
  test('la palabra oculta es la más larga que no sea artículo ni preposición', () => {
    const o = palabraOculta('El equipo de desarrollo, con su Sprint.');
    assert.equal(o.palabra, 'desarrollo');
    assert.equal(o.indice, 3);
  });

  test('el hueco conserva la puntuación', () => {
    const texto = 'Planea, prioriza y entrega.';
    assert.equal(fraseConHueco(texto, palabraOculta(texto)), 'Planea, _____ y entrega.');
  });

  test('los distractores no repiten la respuesta ni salen del propio trabalenguas', () => {
    for (const t of todos) {
      const o = palabraOculta(t.texto);
      const d = distractores(t, o, todos);
      assert.equal(d.length, 3, t.id);
      const propias = t.texto.toLowerCase();
      for (const p of d) {
        assert.ok(!esCorrecta({ oculta: o }, p), `${t.id}: ${p}`);
        assert.ok(!propias.includes(` ${p.toLowerCase()} `), `${t.id}: ${p}`);
      }
      assert.equal(new Set(d.map((p) => p.toLowerCase())).size, 3, t.id);
    }
  });

  test('una partida tiene 5 preguntas distintas con 4 opciones y empieza por el trabalenguas pedido', () => {
    const id = todos[7].id;
    const partida = armarPartida(todos, id);
    assert.equal(partida.length, 5);
    assert.equal(partida[0].t.id, id);
    assert.equal(new Set(partida.map((p) => p.t.id)).size, 5);
    for (const p of partida) {
      assert.equal(p.opciones.length, 4);
      assert.equal(p.opciones.filter((o) => esCorrecta(p, o)).length, 1);
    }
  });

  test('todos los trabalenguas de la semilla sirven para el juego', () => {
    for (const t of todos) assert.ok(palabraOculta(t.texto), t.id);
  });
});

test('las opciones usan la misma mayúscula inicial que la respuesta', () => {
  for (const p of armarPartida(todos, null, Math.random, todos.length)) {
    const mayus = (w) => w[0] === w[0].toUpperCase();
    assert.ok(p.opciones.every((o) => mayus(o) === mayus(p.oculta.palabra)), p.opciones.join(','));
  }
});
