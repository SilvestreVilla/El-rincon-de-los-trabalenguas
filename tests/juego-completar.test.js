// HU-14 · Pruebas de las preguntas del trabalenguas. npm run test:juegos
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { armarPreguntas, esCorrecta, fraseConHueco, minimoParaSuperar, palabraOculta } from '../public/js/logica-completar.js';
import { normalizar } from '../public/js/texto.js';

const { trabalenguas: todos } = JSON.parse(readFileSync(new URL('../data/trabalenguas.json', import.meta.url), 'utf8'));

describe('Preguntas del trabalenguas (HU-14)', () => {
  test('la palabra oculta es la más larga que no sea artículo ni preposición', () => {
    const o = palabraOculta('El equipo de desarrollo, con su Sprint.');
    assert.equal(o.palabra, 'desarrollo');
  });

  test('el hueco conserva la puntuación', () => {
    const texto = 'Planea, prioriza y entrega.';
    assert.equal(fraseConHueco(texto, palabraOculta(texto)), 'Planea, _____ y entrega.');
  });

  test('si la palabra oculta se repite, se ocultan todas las veces (HU-14, revisión del 6 de noviembre)', () => {
    const texto = 'La tarea con holgura holgada se huelga; la tarea sin Holgura no se huelga ni un rato.';
    const frase = fraseConHueco(texto, palabraOculta(texto));
    assert.equal(frase, 'La tarea con _____ holgada se huelga; la tarea sin _____ no se huelga ni un rato.');
  });

  test('con varios huecos, el enunciado avisa que es la misma palabra', () => {
    const t = todos.find((x) => x.id === 'holgura-holgada');
    assert.equal(armarPreguntas(t, todos)[0].enunciado, '¿Qué palabra falta? Es la misma en los 2 huecos.');
    const unico = todos.find((x) => x.id === 'tres-tristes-tareas');
    assert.equal(armarPreguntas(unico, todos)[0].enunciado, '¿Qué palabra falta en el trabalenguas?');
  });

  test('en ningún trabalenguas de la semilla queda visible la respuesta de la frase', () => {
    for (const t of todos) {
      const p = armarPreguntas(t, todos).find((x) => x.tipo === 'palabra');
      const visibles = p.cita.split(/\s+/).map((w) => normalizar(w).replace(/[^a-z0-9]/g, ''));
      assert.ok(!visibles.includes(normalizar(p.correcta)), `${t.id}: ${p.cita}`);
    }
  });

  test('cada trabalenguas de la semilla tiene 5 preguntas con 4 opciones distintas y una sola correcta', () => {
    for (const t of todos) {
      const preguntas = armarPreguntas(t, todos);
      assert.deepEqual(preguntas.map((p) => p.tipo), ['palabra', 'concepto', 'definicion', 'situacion', 'ejemplo'], t.id);
      for (const p of preguntas) {
        assert.equal(p.opciones.length, 4, `${t.id} ${p.tipo}`);
        assert.equal(new Set(p.opciones.map(normalizar)).size, 4, `${t.id} ${p.tipo}`);
        assert.equal(p.opciones.filter((o) => esCorrecta(p, o)).length, 1, `${t.id} ${p.tipo}`);
      }
    }
  });

  test('los distractores son de la misma área cuando alcanza', () => {
    const t = todos.find((x) => x.id === 'holgura-holgada');
    const p = armarPreguntas(t, todos).find((x) => x.tipo === 'concepto');
    const dePlaneacion = new Set(todos.filter((x) => x.area === 'Planeación').map((x) => x.concepto));
    assert.ok(p.opciones.every((o) => dePlaneacion.has(o)));
  });

  test('la situación y el ejemplo usan ejemplos distintos del mismo concepto', () => {
    const t = todos[0];
    const ps = armarPreguntas(t, todos);
    const situacion = ps.find((x) => x.tipo === 'situacion').cita;
    const ejemplo = ps.find((x) => x.tipo === 'ejemplo').correcta;
    assert.notEqual(situacion, ejemplo);
    assert.ok(t.ejemplos.includes(situacion) && t.ejemplos.includes(ejemplo));
  });

  test('sin ejemplos (un envío nuevo) hay 4 preguntas y una es del área', () => {
    const { ejemplos, ...sinEjemplos } = todos[3];
    const ps = armarPreguntas({ ...sinEjemplos, id: 'nuevo' }, todos);
    assert.deepEqual(ps.map((p) => p.tipo), ['palabra', 'concepto', 'definicion', 'area']);
  });

  test('se supera con 4 de 5 o 3 de 4', () => {
    assert.equal(minimoParaSuperar(5), 4);
    assert.equal(minimoParaSuperar(4), 3);
  });
});
