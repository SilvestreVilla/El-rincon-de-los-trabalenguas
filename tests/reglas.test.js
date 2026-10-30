// Pruebas de las reglas de Firestore (T1-03, DoD punto 5).
// Ejecutar con: npm run test:reglas  (levanta el emulador de Firestore, corre y lo apaga)
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, deleteDoc, where,
} from 'firebase/firestore';

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rincon-trabalenguas',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

after(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'trabalenguas/aprobado1'), { titulo: 'A', estado: 'aprobado' });
    await setDoc(doc(db, 'trabalenguas/pendiente1'), { titulo: 'P', estado: 'pendiente' });
    await setDoc(doc(db, 'usuarios/ana'), { email: 'ana@editorial.com', rol: 'usuario' });
  });
});

const ana = () => env.authenticatedContext('ana', { email: 'ana@editorial.com' }).firestore();
const beto = () => env.authenticatedContext('beto', { email: 'beto@editorial.com' }).firestore();
const visitante = () => env.unauthenticatedContext().firestore();

const usuarioValido = (email) => ({
  email,
  rol: 'usuario',
  aceptoPrivacidad: true,
  mayorDeEdad: true,
  creado: serverTimestamp(),
});

describe('trabalenguas (HU-04, HU-05)', () => {
  test('un visitante lee un trabalenguas aprobado', async () => {
    await assertSucceeds(getDoc(doc(visitante(), 'trabalenguas/aprobado1')));
  });

  test('nadie lee un trabalenguas pendiente', async () => {
    await assertFails(getDoc(doc(visitante(), 'trabalenguas/pendiente1')));
    await assertFails(getDoc(doc(ana(), 'trabalenguas/pendiente1')));
  });

  test('el catálogo filtrado por estado aprobado se puede consultar', async () => {
    const q = query(collection(visitante(), 'trabalenguas'), where('estado', '==', 'aprobado'));
    await assertSucceeds(getDocs(q));
  });

  test('el catálogo sin filtro se rechaza (incluiría pendientes)', async () => {
    await assertFails(getDocs(collection(visitante(), 'trabalenguas')));
  });

  test('el cliente no puede escribir trabalenguas en el Sprint 1', async () => {
    await assertFails(setDoc(doc(ana(), 'trabalenguas/nuevo'), { titulo: 'X', estado: 'aprobado' }));
  });
});

describe('usuarios (HU-01, HU-02)', () => {
  test('el registro crea su documento con rol usuario', async () => {
    await assertSucceeds(setDoc(doc(beto(), 'usuarios/beto'), usuarioValido('beto@editorial.com')));
  });

  test('no se puede registrar con rol moderador', async () => {
    await assertFails(setDoc(doc(beto(), 'usuarios/beto'), { ...usuarioValido('beto@editorial.com'), rol: 'moderador' }));
  });

  test('no se puede registrar sin aceptar el aviso de privacidad', async () => {
    await assertFails(setDoc(doc(beto(), 'usuarios/beto'), { ...usuarioValido('beto@editorial.com'), aceptoPrivacidad: false }));
  });

  test('no se puede registrar sin confirmar la mayoría de edad', async () => {
    await assertFails(setDoc(doc(beto(), 'usuarios/beto'), { ...usuarioValido('beto@editorial.com'), mayorDeEdad: false }));
  });

  test('no se puede registrar con un correo distinto al de su cuenta', async () => {
    await assertFails(setDoc(doc(beto(), 'usuarios/beto'), usuarioValido('otro@editorial.com')));
  });

  test('no se pueden agregar campos extra', async () => {
    await assertFails(setDoc(doc(beto(), 'usuarios/beto'), { ...usuarioValido('beto@editorial.com'), puntos: 999 }));
  });

  test('nadie crea el documento de otra persona', async () => {
    await assertFails(setDoc(doc(beto(), 'usuarios/ana'), usuarioValido('beto@editorial.com')));
  });

  test('cada usuario lee solo su documento (el correo es privado)', async () => {
    await assertSucceeds(getDoc(doc(ana(), 'usuarios/ana')));
    await assertFails(getDoc(doc(beto(), 'usuarios/ana')));
    await assertFails(getDoc(doc(visitante(), 'usuarios/ana')));
  });

  test('un usuario no puede cambiarse el rol', async () => {
    await assertFails(updateDoc(doc(ana(), 'usuarios/ana'), { rol: 'moderador' }));
  });

  test('borrar la cuenta desde el cliente queda cerrado hasta el Sprint 4', async () => {
    await assertFails(deleteDoc(doc(ana(), 'usuarios/ana')));
  });
});

describe('otras colecciones', () => {
  test('cualquier otra colección está cerrada', async () => {
    await assertFails(setDoc(doc(ana(), 'cualquiera/x'), { a: 1 }));
    await assertFails(getDoc(doc(ana(), 'cualquiera/x')));
  });
});

describe('progreso: favoritos (HU-07)', () => {
  test('un usuario marca un favorito en su propio documento', async () => {
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', esFavorito: true }, { merge: true }));
  });

  test('un usuario lee su propio progreso, aunque el documento no exista', async () => {
    await assertSucceeds(getDoc(doc(ana(), 'progreso/ana_t1')));
  });

  test('un usuario consulta sus favoritos filtrando por su usuarioId', async () => {
    const q = query(collection(ana(), 'progreso'), where('usuarioId', '==', 'ana'), where('esFavorito', '==', true));
    await assertSucceeds(getDocs(q));
  });

  test('no se puede consultar el progreso de todos', async () => {
    await assertFails(getDocs(collection(ana(), 'progreso')));
    await assertFails(getDocs(query(collection(ana(), 'progreso'), where('usuarioId', '==', 'beto'))));
  });

  test('un visitante no lee ni escribe progreso', async () => {
    await assertFails(getDoc(doc(visitante(), 'progreso/ana_t1')));
    await assertFails(setDoc(doc(visitante(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', esFavorito: true }));
  });

  test('nadie escribe en el progreso de otra persona', async () => {
    await assertFails(setDoc(doc(beto(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', esFavorito: true }));
    await assertFails(setDoc(doc(beto(), 'progreso/beto_t1'), { usuarioId: 'ana', trabalenguasId: 't1', esFavorito: true }));
  });

  test('no se aceptan campos extra ni un favorito que no sea booleano', async () => {
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', esFavorito: true, puntos: 99 }));
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', esFavorito: 'si' }));
  });
});
