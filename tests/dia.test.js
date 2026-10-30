// HU-11 · T2-18: el trabalenguas del día es el mismo para todos y cambia al día siguiente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { claveDelDia, trabalenguasDelDia } from '../public/js/dia.js';

const lista = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

test('mismo día y mismo catálogo dan el mismo trabalenguas, sin importar el orden recibido', () => {
  const invertida = [...lista].reverse();
  assert.equal(trabalenguasDelDia(lista, '2026-10-29').id, trabalenguasDelDia(invertida, '2026-10-29').id);
});

test('al día siguiente cambia', () => {
  assert.notEqual(trabalenguasDelDia(lista, '2026-10-29').id, trabalenguasDelDia(lista, '2026-10-30').id);
});

test('recorre todo el catálogo antes de repetir', () => {
  const vistos = new Set();
  for (let d = 1; d <= lista.length; d++) vistos.add(trabalenguasDelDia(lista, `2026-11-0${d}`).id);
  assert.equal(vistos.size, lista.length);
});

test('catálogo vacío devuelve null', () => {
  assert.equal(trabalenguasDelDia([], '2026-10-29'), null);
});

test('el día se cuenta en hora de Monterrey, no en UTC', () => {
  // 2026-10-30 03:00 UTC sigue siendo 29 de octubre en Monterrey (UTC-6)
  assert.equal(claveDelDia(new Date('2026-10-30T03:00:00Z')), '2026-10-29');
  assert.equal(claveDelDia(new Date('2026-10-30T06:30:00Z')), '2026-10-30');
});
