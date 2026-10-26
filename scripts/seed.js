// Carga el catálogo semilla en Firestore (T1-05).
//
// Emulador:   npm run seed:emulador   (con los emuladores encendidos)
// Producción: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run seed
//
// Usa el Admin SDK, que no pasa por las reglas de seguridad. Es idempotente:
// cada trabalenguas se guarda con su id, así que correrlo dos veces no duplica nada.
import { readFileSync } from 'node:fs';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const AREAS = ['Scrum', 'Planeación', 'Riesgos', 'Calidad', 'Liderazgo'];
const DIFICULTADES = ['Fácil', 'Medio', 'Difícil'];

const { trabalenguas } = JSON.parse(readFileSync(new URL('../data/trabalenguas.json', import.meta.url), 'utf8'));

// Validación previa: los mismos límites que tendrá el formulario de envío (HU-12).
const errores = [];
const ids = new Set();
for (const t of trabalenguas) {
  const donde = `«${t.id}»`;
  if (ids.has(t.id)) errores.push(`${donde}: id repetido`);
  ids.add(t.id);
  if (!/^[a-z0-9-]+$/.test(t.id)) errores.push(`${donde}: el id solo admite minúsculas, números y guiones`);
  if (!t.titulo) errores.push(`${donde}: falta el título`);
  if (!t.concepto) errores.push(`${donde}: falta el concepto`);
  if (t.texto.length < 20 || t.texto.length > 500) errores.push(`${donde}: el texto debe tener de 20 a 500 caracteres`);
  if (t.definicion.length > 200) errores.push(`${donde}: la definición pasa de 200 caracteres (${t.definicion.length})`);
  if (!AREAS.includes(t.area)) errores.push(`${donde}: área desconocida «${t.area}»`);
  if (!DIFICULTADES.includes(t.dificultad)) errores.push(`${donde}: dificultad desconocida «${t.dificultad}»`);
}
if (errores.length) {
  console.error('La semilla tiene errores:\n- ' + errores.join('\n- '));
  process.exit(1);
}

const enEmulador = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
initializeApp(enEmulador ? { projectId: 'demo-rincon-trabalenguas' } : { credential: applicationDefault() });
const db = getFirestore();

const lote = db.batch();
for (const { id, ...datos } of trabalenguas) {
  lote.set(db.collection('trabalenguas').doc(id), {
    ...datos,
    autorNombre: 'Equipo editorial',
    estado: 'aprobado',
    creado: FieldValue.serverTimestamp(),
  });
}
await lote.commit();

console.log(`Listo: ${trabalenguas.length} trabalenguas cargados en ${enEmulador ? 'el emulador' : 'Firestore'}.`);
const porArea = Object.fromEntries(AREAS.map((a) => [a, trabalenguas.filter((t) => t.area === a).length]));
console.log('Por área:', porArea);
