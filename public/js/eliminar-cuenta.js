// HU-18 · Eliminar la cuenta
// Orden (cada paso lo permiten las reglas de firestore.rules solo al dueño):
//   1. Reautenticar con la contraseña: Firebase exige un inicio de sesión reciente para borrar la cuenta,
//      y así se valida antes de borrar cualquier dato.
//   2. Borrar todo su progreso (favoritos, tiempos, etapas de la ruta y dominados).
//   3. Borrar sus envíos. Si uno ya está publicado, su trabalenguas queda como «Anónimo» en el mismo batch.
//   4. Borrar usuarios/{uid}.
//   5. Borrar el usuario de Firebase Authentication.
// No existe una colección `partidas`: el resultado de los juegos vive en `progreso` (paso 2).
// Si algo falla a la mitad, se puede volver a intentar: cada paso borra lo que quede.
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { collection, doc, getDoc, getDocs, query, where, writeBatch } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';

export const NOMBRE_ANONIMO = 'Anónimo';
const MAX_POR_LOTE = 450; // Firestore permite 500 escrituras por batch.

/** Ejecuta grupos de operaciones en batches; un grupo nunca se parte entre dos batches. */
async function enLotes(grupos) {
  let lote = writeBatch(db);
  let cuenta = 0;
  for (const grupo of grupos) {
    if (cuenta + grupo.length > MAX_POR_LOTE) {
      await lote.commit();
      lote = writeBatch(db);
      cuenta = 0;
    }
    grupo.forEach((op) => op(lote));
    cuenta += grupo.length;
  }
  if (cuenta) await lote.commit();
}

/**
 * Elimina la cuenta y los datos personales del usuario. `avisar(texto)` recibe el paso en curso.
 * Lanza el error de Firebase si algo falla (por ejemplo, `auth/invalid-credential` con una contraseña incorrecta).
 * Devuelve cuántos documentos borró o anonimizó, para el mensaje final.
 */
export async function eliminarCuenta(usuario, contrasena, avisar = () => {}) {
  avisar('Verificando tu contraseña…');
  await reauthenticateWithCredential(usuario, EmailAuthProvider.credential(usuario.email, contrasena));

  avisar('Borrando tu progreso…');
  const progreso = await getDocs(query(collection(db, 'progreso'), where('usuarioId', '==', usuario.uid)));
  await enLotes(progreso.docs.map((d) => [(lote) => lote.delete(doc(db, 'progreso', d.id))]));

  avisar('Borrando tus envíos…');
  const envios = await getDocs(query(collection(db, 'envios'), where('autorId', '==', usuario.uid)));
  const grupos = [];
  let anonimas = 0;
  for (const envio of envios.docs) {
    const grupo = [];
    if (envio.data().estado === 'aprobado') {
      // Solo se anonimiza si el trabalenguas sigue publicado; si ya no existe, basta con borrar el envío.
      let publicado = false;
      try {
        publicado = (await getDoc(doc(db, 'trabalenguas', envio.id))).exists();
      } catch (e) {
        if (e.code !== 'permission-denied') throw e;
      }
      if (publicado) {
        anonimas += 1;
        grupo.push((lote) => lote.update(doc(db, 'trabalenguas', envio.id), { autorNombre: NOMBRE_ANONIMO }));
      }
    }
    grupo.push((lote) => lote.delete(doc(db, 'envios', envio.id)));
    grupos.push(grupo);
  }
  // El trabalenguas anónimo y el borrado de su envío van en el mismo batch (las reglas lo exigen).
  await enLotes(grupos);

  avisar('Borrando tu cuenta…');
  await writeBatch(db).delete(doc(db, 'usuarios', usuario.uid)).commit();
  await deleteUser(usuario);

  return { progreso: progreso.size, envios: envios.size, anonimas };
}
