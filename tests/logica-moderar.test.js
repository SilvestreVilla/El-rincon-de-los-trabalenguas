// HU-13 · Pruebas de la lógica de moderación (sin Firebase). Ejecutar con: npm run test:juegos
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { armarPublicacion, ordenarPorLlegada, validarMotivo, validarPublicacion } from '../public/js/logica-moderar.js';

const valores = {
  titulo: '  Riesgos   rápidos ',
  texto: 'Raúl registra riesgos raros en el registro de riesgos.',
  concepto: 'Registro de riesgos',
  definicion: 'Documento donde se anotan los riesgos identificados, su análisis y la respuesta planeada.',
  area: 'Riesgos',
  dificultad: 'Medio',
  autorNombre: 'Ana López',
  fuente: '',
  ejemplos: ['', '   '],
};

test('armarPublicacion limpia espacios y omite fuente y ejemplos vacíos', () => {
  const datos = armarPublicacion(valores);
  assert.equal(datos.titulo, 'Riesgos rápidos');
  assert.equal(datos.estado, 'aprobado');
  assert.equal('fuente' in datos, false);
  assert.equal('ejemplos' in datos, false);
  assert.deepEqual(validarPublicacion(datos), {});
});

test('armarPublicacion conserva la fuente y solo los ejemplos escritos', () => {
  const datos = armarPublicacion({ ...valores, fuente: 'PMBOK', ejemplos: ['Antes de viajar anotas qué podría salir mal.', ''] });
  assert.equal(datos.fuente, 'PMBOK');
  assert.deepEqual(datos.ejemplos, ['Antes de viajar anotas qué podría salir mal.']);
  assert.deepEqual(validarPublicacion(datos), {});
});

test('validarPublicacion marca los campos fuera de límite', () => {
  const errores = validarPublicacion(armarPublicacion({ ...valores, texto: 'Corto', concepto: '', area: 'Marketing', ejemplos: ['corto'] }));
  assert.deepEqual(Object.keys(errores).sort(), ['area', 'concepto', 'ejemplos', 'texto']);
  assert.match(errores.texto, /20 caracteres/);
});

test('validarPublicacion rechaza una fuente que no está en la lista', () => {
  assert.ok(validarPublicacion(armarPublicacion({ ...valores, fuente: 'Wikipedia' })).fuente);
});

test('validarMotivo exige de 5 a 200 caracteres', () => {
  assert.ok(validarMotivo(''));
  assert.ok(validarMotivo('  No '));
  assert.ok(validarMotivo('x'.repeat(201)));
  assert.equal(validarMotivo('La definición no corresponde al concepto.'), null);
});

test('ordenarPorLlegada pone primero los más antiguos', () => {
  const fecha = (ms) => ({ toMillis: () => ms });
  const orden = ordenarPorLlegada([{ id: 'b', creado: fecha(2) }, { id: 'a', creado: fecha(1) }, { id: 'c' }]);
  assert.deepEqual(orden.map((e) => e.id), ['c', 'a', 'b']);
});
