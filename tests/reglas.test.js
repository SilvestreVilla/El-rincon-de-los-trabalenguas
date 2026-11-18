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
  collection, doc, getDoc, getDocs, increment, query, serverTimestamp, setDoc, updateDoc, deleteDoc, where, writeBatch,
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

  test('un usuario normal no puede escribir trabalenguas', async () => {
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

describe('progreso: temporizador (HU-09)', () => {
  test('un usuario guarda su mejor tiempo y su práctica', async () => {
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), {
      usuarioId: 'ana', trabalenguasId: 't1', mejorTiempoSeg: 7.4, practicas: 1, ultimaPractica: serverTimestamp(),
    }, { merge: true }));
  });

  test('el mejor tiempo debe ser un número mayor a 0', async () => {
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', mejorTiempoSeg: -1 }));
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', mejorTiempoSeg: 0 }));
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', mejorTiempoSeg: 'rápido' }));
  });

  test('las prácticas deben ser un entero y la fecha un timestamp', async () => {
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', practicas: 'muchas' }));
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', ultimaPractica: 'ayer' }));
  });

  test('nadie guarda tiempos en el progreso de otra persona', async () => {
    await assertFails(setDoc(doc(beto(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', mejorTiempoSeg: 5 }));
  });
});

describe('progreso: dominado (HU-08)', () => {
  test('un usuario marca y desmarca un trabalenguas como dominado', async () => {
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', dominado: true }, { merge: true }));
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', dominado: false }, { merge: true }));
  });

  test('un usuario cuenta sus dominados filtrando por su usuarioId', async () => {
    const q = query(collection(ana(), 'progreso'), where('usuarioId', '==', 'ana'), where('dominado', '==', true));
    await assertSucceeds(getDocs(q));
  });

  test('dominado debe ser un booleano', async () => {
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', dominado: 'si' }));
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', dominado: 1 }));
  });

  test('nadie marca dominados en el progreso de otra persona', async () => {
    await assertFails(setDoc(doc(beto(), 'progreso/ana_t1'), { usuarioId: 'ana', trabalenguasId: 't1', dominado: true }));
  });
});

describe('envíos (HU-12)', () => {
  const envioValido = (autorId = 'ana') => ({
    autorId,
    autorNombre: 'Ana López',
    titulo: 'Riesgos rápidos',
    texto: 'Raúl registra riesgos raros en el registro de riesgos.',
    concepto: 'Registro de riesgos',
    definicion: 'Documento donde se anotan los riesgos identificados, su análisis y la respuesta planeada.',
    area: 'Riesgos',
    dificultad: 'Medio',
    estado: 'pendiente',
    creado: serverTimestamp(),
  });

  /** Crea el envío y sube el contador del autor en la misma escritura, como lo hace proponer.js. */
  function proponer(db, datos = envioValido(), uid = 'ana') {
    const lote = writeBatch(db);
    const ref = doc(collection(db, 'envios'));
    lote.set(ref, datos);
    lote.update(doc(db, 'usuarios', uid), { enviosPendientes: increment(1), ultimoEnvio: ref.id });
    return lote.commit();
  }

  const fijarPendientes = (n) => env.withSecurityRulesDisabled((ctx) =>
    updateDoc(doc(ctx.firestore(), 'usuarios/ana'), { enviosPendientes: n }));

  test('un usuario propone un trabalenguas y su contador sube a 1', async () => {
    await assertSucceeds(proponer(ana()));
    const usuario = await getDoc(doc(ana(), 'usuarios/ana'));
    if (usuario.data().enviosPendientes !== 1) throw new Error('el contador debía quedar en 1');
  });

  test('con 4 pendientes se acepta el quinto', async () => {
    await fijarPendientes(4);
    await assertSucceeds(proponer(ana()));
  });

  test('con 5 pendientes se rechaza el sexto', async () => {
    await fijarPendientes(5);
    await assertFails(proponer(ana()));
  });

  test('no se puede crear un envío sin subir el contador', async () => {
    await assertFails(setDoc(doc(ana(), 'envios/e1'), envioValido()));
  });

  test('no se puede tocar el contador sin crear un envío', async () => {
    await assertFails(updateDoc(doc(ana(), 'usuarios/ana'), { enviosPendientes: 1, ultimoEnvio: 'e1' }));
    await assertFails(updateDoc(doc(ana(), 'usuarios/ana'), { enviosPendientes: 0 }));
  });

  test('el contador sube de 1 en 1', async () => {
    const db = ana();
    const lote = writeBatch(db);
    const ref = doc(collection(db, 'envios'));
    lote.set(ref, envioValido());
    lote.update(doc(db, 'usuarios/ana'), { enviosPendientes: 3, ultimoEnvio: ref.id });
    await assertFails(lote.commit());
  });

  test('el envío se guarda como pendiente y a nombre de quien lo envía', async () => {
    await assertFails(proponer(ana(), { ...envioValido(), estado: 'aprobado' }));
    await assertFails(proponer(ana(), envioValido('beto')));
  });

  test('se validan los límites del texto, la definición, el nombre del autor, el área y la dificultad', async () => {
    await assertFails(proponer(ana(), { ...envioValido(), texto: 'Muy corto' }));
    await assertFails(proponer(ana(), { ...envioValido(), texto: 'a'.repeat(501) }));
    await assertFails(proponer(ana(), { ...envioValido(), definicion: 'a'.repeat(201) }));
    await assertFails(proponer(ana(), { ...envioValido(), titulo: '' }));
    await assertFails(proponer(ana(), { ...envioValido(), autorNombre: '' }));
    await assertFails(proponer(ana(), { ...envioValido(), autorNombre: 'a'.repeat(41) }));
    const { autorNombre, ...sinNombre } = envioValido();
    await assertFails(proponer(ana(), sinNombre));
    await assertFails(proponer(ana(), { ...envioValido(), area: 'Finanzas' }));
    await assertFails(proponer(ana(), { ...envioValido(), dificultad: 'Imposible' }));
    await assertFails(proponer(ana(), { ...envioValido(), puntos: 10 }));
  });

  test('un visitante no puede proponer', async () => {
    await assertFails(setDoc(doc(visitante(), 'envios/e1'), envioValido()));
  });

  test('cada autor lee solo sus envíos', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'envios/e1'), { ...envioValido(), creado: new Date() }));
    await assertSucceeds(getDoc(doc(ana(), 'envios/e1')));
    await assertSucceeds(getDocs(query(collection(ana(), 'envios'), where('autorId', '==', 'ana'))));
    await assertFails(getDoc(doc(beto(), 'envios/e1')));
    await assertFails(getDocs(collection(ana(), 'envios')));
    await assertFails(getDoc(doc(visitante(), 'envios/e1')));
  });

  test('un envío no se puede cambiar ni borrar desde el cliente', async () => {
    await env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), 'envios/e1'), { ...envioValido(), creado: new Date() }));
    await assertFails(updateDoc(doc(ana(), 'envios/e1'), { estado: 'aprobado' }));
    await assertFails(deleteDoc(doc(ana(), 'envios/e1')));
  });

  test('los envíos no aparecen en el catálogo', async () => {
    await assertSucceeds(proponer(ana()));
    const catalogo = await getDocs(query(collection(visitante(), 'trabalenguas'), where('estado', '==', 'aprobado')));
    if (catalogo.size !== 1) throw new Error('el catálogo solo debía tener el trabalenguas aprobado de la semilla');
  });
});

describe('mis envíos (HU-15)', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      const base = { titulo: 'T', texto: 'Texto de prueba con más de veinte caracteres.', concepto: 'C', definicion: 'D', area: 'Scrum', dificultad: 'Fácil', creado: new Date() };
      await setDoc(doc(db, 'envios/ana1'), { ...base, autorId: 'ana', estado: 'pendiente' });
      await setDoc(doc(db, 'envios/ana2'), { ...base, autorId: 'ana', estado: 'rechazado', motivo: 'La definición no corresponde al concepto.' });
      await setDoc(doc(db, 'envios/beto1'), { ...base, autorId: 'beto', estado: 'pendiente' });
    });
  });

  test('el autor ve todos sus envíos, con el motivo de los rechazados', async () => {
    const mios = await assertSucceeds(getDocs(query(collection(ana(), 'envios'), where('autorId', '==', 'ana'))));
    if (mios.size !== 2) throw new Error('ana debía ver sus 2 envíos');
    const rechazado = mios.docs.find((d) => d.id === 'ana2').data();
    if (!rechazado.motivo) throw new Error('el motivo del rechazo debía ser visible para su autor');
  });

  test('nadie ve los envíos ni los motivos de otra persona', async () => {
    await assertFails(getDocs(query(collection(beto(), 'envios'), where('autorId', '==', 'ana'))));
    await assertFails(getDoc(doc(beto(), 'envios/ana2')));
  });
});

describe('progreso: etapas de la ruta (HU-21)', () => {
  const base = { usuarioId: 'ana', trabalenguasId: 't1' };

  test('un usuario completa una etapa y luego otra (merge del mapa)', async () => {
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), { ...base, etapas: { lee: true } }, { merge: true }));
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), { ...base, etapas: { ordena: true } }, { merge: true }));
  });

  test('al completar la última etapa se guarda dominado en la misma escritura', async () => {
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), {
      ...base, etapas: { ordena: true, completa: true, memorama: true }, dominado: true,
    }, { merge: true }));
  });

  test('un documento con las etapas retiradas (lee, dilo) se puede seguir actualizando', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'progreso/ana_t1'), { ...base, etapas: { lee: true, dilo: true } });
    });
    await assertSucceeds(setDoc(doc(ana(), 'progreso/ana_t1'), { ...base, etapas: { memorama: true } }, { merge: true }));
  });

  test('no se aceptan etapas desconocidas', async () => {
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { ...base, etapas: { lee: true, trampa: true } }));
  });

  test('cada etapa debe ser booleana y etapas debe ser un mapa', async () => {
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { ...base, etapas: { memorama: 'si' } }));
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { ...base, etapas: ['lee'] }));
    await assertFails(setDoc(doc(ana(), 'progreso/ana_t1'), { ...base, etapas: true }));
  });

  test('nadie completa etapas en el progreso de otra persona', async () => {
    await assertFails(setDoc(doc(beto(), 'progreso/ana_t1'), { ...base, etapas: { lee: true } }, { merge: true }));
  });
});

describe('validación del editor (HU-13)', () => {
  const ENVIO = {
    autorId: 'ana',
    autorNombre: 'Ana López',
    titulo: 'Riesgos rápidos',
    texto: 'Raúl registra riesgos raros en el registro de riesgos.',
    concepto: 'Registro de riesgos',
    definicion: 'Documento donde se anotan los riesgos identificados, su análisis y la respuesta planeada.',
    area: 'Riesgos',
    dificultad: 'Medio',
    estado: 'pendiente',
  };

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, 'usuarios/mod'), { email: 'mod@editorial.com', rol: 'moderador' });
      await setDoc(doc(db, 'usuarios/ana'), { email: 'ana@editorial.com', rol: 'usuario', enviosPendientes: 2, ultimoEnvio: 'e2' });
      await setDoc(doc(db, 'envios/e1'), { ...ENVIO, creado: new Date() });
      await setDoc(doc(db, 'envios/e2'), { ...ENVIO, titulo: 'Otro', creado: new Date() });
    });
  });

  const mod = () => env.authenticatedContext('mod', { email: 'mod@editorial.com' }).firestore();

  const publicacion = (cambios = {}) => {
    const { autorId, estado, ...resto } = ENVIO;
    return { ...resto, estado: 'aprobado', creado: serverTimestamp(), fuente: 'PMBOK',
      ejemplos: ['Antes de la mudanza anotas qué podría salir mal y qué harías.'], ...cambios };
  };

  /** Como lo hace moderar.js: publica, marca el envío y baja el contador del autor en un batch. */
  function aprobar(db, id = 'e1', datos = publicacion(), opciones = {}) {
    const lote = writeBatch(db);
    if (!opciones.sinPublicar) lote.set(doc(db, 'trabalenguas', id), datos);
    lote.update(doc(db, 'envios', id), { estado: 'aprobado', revisado: serverTimestamp(), ...(opciones.envio ?? {}) });
    if (!opciones.sinContador) lote.update(doc(db, 'usuarios', 'ana'), { enviosPendientes: increment(-1), ultimaRevision: id });
    return lote.commit();
  }

  function rechazar(db, motivo, id = 'e1', opciones = {}) {
    const lote = writeBatch(db);
    lote.update(doc(db, 'envios', id), { estado: 'rechazado', motivo, revisado: serverTimestamp() });
    if (!opciones.sinContador) lote.update(doc(db, 'usuarios', 'ana'), { enviosPendientes: increment(-1), ultimaRevision: id });
    return lote.commit();
  }

  const leerSinReglas = (ruta) => env.withSecurityRulesDisabled(async (ctx) => (await getDoc(doc(ctx.firestore(), ruta))).data());

  test('el moderador ve los envíos pendientes de todos', async () => {
    const pendientes = await assertSucceeds(getDocs(query(collection(mod(), 'envios'), where('estado', '==', 'pendiente'))));
    if (pendientes.size !== 2) throw new Error('el moderador debía ver los 2 envíos pendientes');
  });

  test('un usuario normal no puede ver la cola de moderación', async () => {
    await assertFails(getDocs(query(collection(ana(), 'envios'), where('estado', '==', 'pendiente'))));
    await assertFails(getDocs(query(collection(beto(), 'envios'), where('estado', '==', 'pendiente'))));
    await assertFails(getDocs(query(collection(visitante(), 'envios'), where('estado', '==', 'pendiente'))));
  });

  test('aprobar publica el trabalenguas en el catálogo y baja el contador del autor', async () => {
    await assertSucceeds(aprobar(mod()));
    await assertSucceeds(getDoc(doc(visitante(), 'trabalenguas/e1')));
    const usuario = await leerSinReglas('usuarios/ana');
    if (usuario.enviosPendientes !== 1) throw new Error('el contador debía bajar a 1');
    const envio = (await getDoc(doc(ana(), 'envios/e1'))).data();
    if (envio.estado !== 'aprobado') throw new Error('el autor debía ver su envío aprobado');
  });

  test('el moderador puede corregir el texto antes de publicar; publicar sin ejemplos ni fuente también vale', async () => {
    const { ejemplos, fuente, ...sinExtras } = publicacion({ definicion: 'Lista de riesgos con su análisis y su respuesta.' });
    await assertSucceeds(aprobar(mod(), 'e1', sinExtras));
  });

  test('rechazar exige un motivo y baja el contador del autor', async () => {
    await assertFails(rechazar(mod(), ''));
    await assertFails(rechazar(mod(), 'No'));
    await assertSucceeds(rechazar(mod(), 'La definición no corresponde al concepto.'));
    const usuario = await leerSinReglas('usuarios/ana');
    if (usuario.enviosPendientes !== 1) throw new Error('el contador debía bajar a 1');
  });

  test('con el contador abajo, el autor puede volver a proponer', async () => {
    await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), 'usuarios/ana'), { enviosPendientes: 5 }));
    await assertSucceeds(rechazar(mod(), 'La definición no corresponde al concepto.'));
    const lote = writeBatch(ana());
    const ref = doc(collection(ana(), 'envios'));
    lote.set(ref, { ...ENVIO, creado: serverTimestamp() });
    lote.update(doc(ana(), 'usuarios', 'ana'), { enviosPendientes: increment(1), ultimoEnvio: ref.id });
    await assertSucceeds(lote.commit());
  });

  test('aprobar sin publicar, o publicar sin aprobar, se rechaza', async () => {
    await assertFails(aprobar(mod(), 'e1', publicacion(), { sinPublicar: true }));
    await assertFails(setDoc(doc(mod(), 'trabalenguas/e1'), publicacion()));
  });

  test('aprobar o rechazar sin bajar el contador del autor se rechaza', async () => {
    await assertFails(aprobar(mod(), 'e1', publicacion(), { sinContador: true }));
    await assertFails(rechazar(mod(), 'La definición no corresponde al concepto.', 'e1', { sinContador: true }));
  });

  test('un envío ya revisado no se vuelve a revisar', async () => {
    await assertSucceeds(rechazar(mod(), 'La definición no corresponde al concepto.'));
    await assertFails(aprobar(mod()));
  });

  test('aprobar no lleva motivo', async () => {
    await assertFails(aprobar(mod(), 'e1', publicacion(), { envio: { motivo: 'Muy bien' } }));
  });

  test('la publicación valida sus campos', async () => {
    await assertFails(aprobar(mod(), 'e1', publicacion({ texto: 'Muy corto' })));
    await assertFails(aprobar(mod(), 'e1', publicacion({ estado: 'pendiente' })));
    await assertFails(aprobar(mod(), 'e1', publicacion({ area: 'Marketing' })));
    await assertFails(aprobar(mod(), 'e1', publicacion({ fuente: 'Wikipedia' })));
    await assertFails(aprobar(mod(), 'e1', publicacion({ ejemplos: ['corto'] })));
    await assertFails(aprobar(mod(), 'e1', publicacion({ ejemplos: [] })));
    await assertFails(aprobar(mod(), 'e1', publicacion({ autorId: 'ana' })));
  });

  test('no se publica un trabalenguas que no viene de un envío', async () => {
    await assertFails(setDoc(doc(mod(), 'trabalenguas/inventado'), publicacion()));
  });

  test('un usuario normal no puede aprobar, rechazar ni publicar, ni siquiera su propio envío', async () => {
    await assertFails(aprobar(ana()));
    await assertFails(rechazar(ana(), 'Me arrepentí de enviarlo.'));
    await assertFails(aprobar(beto()));
  });

  test('nadie se asigna el rol de moderador', async () => {
    await assertFails(updateDoc(doc(ana(), 'usuarios/ana'), { rol: 'moderador' }));
    await assertFails(updateDoc(doc(mod(), 'usuarios/ana'), { rol: 'moderador' }));
  });

  test('el moderador no puede bajar contadores sin revisar un envío', async () => {
    await assertFails(updateDoc(doc(mod(), 'usuarios/ana'), { enviosPendientes: increment(-1), ultimaRevision: 'e1' }));
  });

  test('el moderador no puede cambiar ni borrar trabalenguas publicados', async () => {
    await assertFails(updateDoc(doc(mod(), 'trabalenguas/aprobado1'), { titulo: 'Otro' }));
    await assertFails(deleteDoc(doc(mod(), 'trabalenguas/aprobado1')));
  });
});
