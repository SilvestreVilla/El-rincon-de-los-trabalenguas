// HU-11 · Selección determinista del trabalenguas del día (T2-18).
// Módulo sin dependencias de Firebase para poder probarlo con `node --test`.

/** Día calendario en Monterrey (AAAA-MM-DD): todos los usuarios comparten el mismo día. */
export function claveDelDia(fecha = new Date(), zona = 'America/Monterrey') {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}

/** Días transcurridos desde 1970-01-01 para una clave AAAA-MM-DD. */
export function diasDesdeEpoca(clave) {
  const [anio, mes, dia] = clave.split('-').map(Number);
  return Math.floor(Date.UTC(anio, mes - 1, dia) / 86400000);
}

/** Mismo día y mismo catálogo => mismo trabalenguas. Ordena por id para no depender del orden de Firestore. */
export function trabalenguasDelDia(lista, clave = claveDelDia()) {
  if (!lista.length) return null;
  const ordenada = [...lista].sort((a, b) => a.id.localeCompare(b.id));
  return ordenada[diasDesdeEpoca(clave) % ordenada.length];
}
