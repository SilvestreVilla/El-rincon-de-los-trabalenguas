// HU-13 · Validación del editor: reglas de la publicación, sin Firebase ni navegador.
// Se prueba con node (tests/logica-moderar.test.js). Los límites son los mismos de firestore.rules.

export const AREAS = ['Scrum', 'Planeación', 'Riesgos', 'Calidad', 'Liderazgo'];
export const DIFICULTADES = ['Fácil', 'Medio', 'Difícil'];
export const FUENTES = ['Guía Scrum', 'PMBOK', 'Guía Scrum y PMBOK', 'Prácticas ágiles', 'Ingeniería de software'];
export const MAX_EJEMPLOS = 3;

const limpio = (valor) => String(valor ?? '').trim().replace(/\s+/g, ' ');

/**
 * Arma el documento que se publica en `trabalenguas` a partir de lo que el editor dejó en el formulario.
 * Quita espacios de más; omite `fuente` si no se eligió y `ejemplos` si no se escribió ninguno.
 * No incluye `creado`: lo pone moderar.js con serverTimestamp().
 */
export function armarPublicacion(valores) {
  const datos = {
    titulo: limpio(valores.titulo),
    texto: limpio(valores.texto),
    concepto: limpio(valores.concepto),
    definicion: limpio(valores.definicion),
    area: limpio(valores.area),
    dificultad: limpio(valores.dificultad),
    autorNombre: limpio(valores.autorNombre),
    estado: 'aprobado',
  };
  const fuente = limpio(valores.fuente);
  if (fuente) datos.fuente = fuente;
  const ejemplos = (valores.ejemplos ?? []).map(limpio).filter(Boolean);
  if (ejemplos.length) datos.ejemplos = ejemplos;
  return datos;
}

function largo(valor, minimo, maximo, nombre) {
  if (valor.length < minimo) return minimo <= 1 ? `Escribe ${nombre}.` : `${nombre[0].toUpperCase()}${nombre.slice(1)} debe tener al menos ${minimo} caracteres.`;
  if (valor.length > maximo) return `${nombre[0].toUpperCase()}${nombre.slice(1)} debe tener máximo ${maximo} caracteres.`;
  return null;
}

/** Errores por campo de una publicación armada con armarPublicacion(). Objeto vacío si está bien. */
export function validarPublicacion(datos) {
  const errores = {};
  const poner = (campo, mensaje) => { if (mensaje) errores[campo] = mensaje; };
  poner('titulo', largo(datos.titulo, 1, 80, 'el título'));
  poner('texto', largo(datos.texto, 20, 500, 'el trabalenguas'));
  poner('concepto', largo(datos.concepto, 1, 60, 'el concepto'));
  poner('definicion', largo(datos.definicion, 1, 200, 'la definición'));
  poner('autorNombre', largo(datos.autorNombre, 1, 40, 'el nombre del autor'));
  if (!AREAS.includes(datos.area)) errores.area = 'Elige un área.';
  if (!DIFICULTADES.includes(datos.dificultad)) errores.dificultad = 'Elige la dificultad.';
  if (datos.fuente !== undefined && !FUENTES.includes(datos.fuente)) errores.fuente = 'Elige una fuente de la lista.';
  if (datos.ejemplos) {
    if (datos.ejemplos.length > MAX_EJEMPLOS) errores.ejemplos = `Máximo ${MAX_EJEMPLOS} ejemplos.`;
    const malo = datos.ejemplos.findIndex((e) => e.length < 20 || e.length > 160);
    if (malo >= 0) errores.ejemplos = `El ejemplo ${malo + 1} debe tener entre 20 y 160 caracteres.`;
  }
  return errores;
}

/** Mensaje de error del motivo de rechazo, o null si es válido (5 a 200 caracteres). */
export function validarMotivo(motivo) {
  const m = limpio(motivo);
  if (m.length < 5) return 'Explica al autor por qué se rechaza (al menos 5 caracteres).';
  if (m.length > 200) return 'El motivo debe tener máximo 200 caracteres.';
  return null;
}

/** Los más antiguos primero: se revisan en el orden en que llegaron. */
export function ordenarPorLlegada(envios) {
  const ms = (e) => (e.creado?.toMillis ? e.creado.toMillis() : 0);
  return [...envios].sort((a, b) => ms(a) - ms(b));
}
