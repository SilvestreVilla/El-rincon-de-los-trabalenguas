# ESTADO.md · El Rincón de los Trabalenguas

> Estado vivo del proyecto. Cambia cada Sprint: actualízalo en la Review y en la planeación.
> El contexto estable (tecnología, modelo de datos, flujo, Definition of Done) está en `CLAUDE.md`.
> Actualizado: 17 de noviembre de 2026 (Sprint 4 · Cierre: Jira ordenado, HU-13 y HU-18 integradas y en revisión).

## 1. Estado de las historias

Corte del 17 de noviembre. «Finalizado» en Jira = integrada a `main`, desplegada en staging y verificada ahí (recorrido completo con cuenta real el 6 nov). **Los puntos 3 (4 navegadores y celular) y 8 (validación del editor) de la DoD se cierran para todo el producto antes de liberar la v1.0** (problemas 3 y 5); si alguno falla, la historia afectada se reabre.

| Historia | Pts | Sprint | Estado (17 nov) |
|---|---|---|---|
| HU-01 Registro | 3 | 1 | Finalizado · PR #1 |
| HU-02 Sesión | 2 | 1 | Finalizado · PR #1 |
| HU-03 Recuperar contraseña | 1 | 1 | Finalizado · PR #1 |
| HU-04 Catálogo | 5 | 1 | Finalizado · PR #1 · semilla de 40 cargada en producción |
| HU-05 Detalle | 3 | 1 | Finalizado · PR #1 |
| HU-06 Búsqueda y filtros | 5 | 1 | Finalizado · PR #2 |
| HU-07 Favoritos | 3 | 1 | Finalizado · PR #3 |
| HU-09 Temporizador | 5 | 1 | Finalizado · PR #4 |
| HU-08 Dominado | 2 | 2 | Finalizado · PR #7 · desde HU-21 el dominado es por logro |
| HU-10 Compartir | 2 | 2 | Finalizado · PR #5 |
| HU-11 Rompehielos | 3 | 2 | Finalizado · PR #8 · falta probar la lectura a 3 m |
| HU-12 Proponer | 5 | 2 | Finalizado · PR #9 |
| HU-15 Mis envíos | 2 | 2 | Finalizado · PR #11 |
| HU-14 Preguntas del trabalenguas | 5 | 3 | Finalizado |
| HU-21 Ruta de aprendizaje | 3 | 3 | Finalizado |
| HU-22 Arma el trabalenguas | 3 | 3 | Finalizado |
| HU-25 Memorama | 3 | 3 | Finalizado · PR #26 corrige la palabra oculta |
| HU-26 Fuente y filtro por fuente | 2 | 4 | Finalizado |
| HU-27 Diez conceptos nuevos (40) | 3 | 4 | Finalizado · semilla cargada |
| HU-13 Validación del editor | 3 | 4 | **En revisión** · PR #29 integrado · falta `npm run test:reglas`, publicar reglas, probar en staging |
| HU-18 Privacidad y eliminar cuenta | 3 | 4 | **En revisión** · PR #30 integrado · mismos pendientes · el aviso tiene 2 [COMPLETAR] |
| HU-23 Karaoke · HU-24 Dilo en voz alta | — | — | Finalizado como **descartadas** (2 nov), sin Sprint |
| HU-16, HU-17, HU-19, HU-20 | — | Reserva | Por hacer · fuera de la v1.0 |

Responsables en Jira: asignados al azar entre los 5 integrantes el 17 de noviembre (todos son desarrolladores; Silvestre además es Scrum Master).

Revisiones en GitHub: la Ing. Neira indicó el 30 de octubre que no se exigen; la evidencia es que el avance se vea en staging.

## 2. Problemas abiertos (en orden)

1. **Publicar las reglas en producción.** El canal de staging usa la misma base de datos que producción, así que HU-12 y HU-15 (colección `envios`) solo funcionan en staging cuando se publiquen las reglas: `npx firebase deploy --only firestore:rules`. También incluye la validación `dominado is bool` de HU-08.
   - **Nuevo (2 nov):** volver a correr la semilla en producción (`set GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json` y `npm run seed`) para que los 30 trabalenguas tengan `ejemplos`. Sin ellos, las preguntas de HU-14 funcionan, pero con 4 preguntas en lugar de 5. La semilla reescribe los 30 documentos (mismo id), no duplica nada.
2. **Proteger `main`** (opcional ahora que no se exigen revisiones): Settings → Branches → regla para `main` con *Require a pull request*, sin aprobaciones. Evita que se suba directo, como pasó con HU-08 y el zip de HU-11.
3. Probar en 4 navegadores y en celular todo el producto antes de liberar la v1.0 (DoD 3 y 4).
4. **Java 11+ en la laptop del equipo.** `npm run test:reglas` ya se corrió (50 de 50 en verde el 30 de octubre, con HU-12 y HU-15), pero con un JDK 21 portátil temporal. Hay que instalar un JDK 21 (por ejemplo, Eclipse Temurin) para que cualquiera pueda correrlo.
5. El editor no ha validado los 40 trabalenguas (DoD 8). El aviso de privacidad quedó redactado en HU-18 (17 nov), pero le faltan el nombre de la editorial y el correo de contacto. [COMPLETAR]
6. Producción (`rincon-de-los-trabalenguas.web.app`) quizá ya tenga historias del Sprint 2 sin aceptar. A producción solo debe ir lo aceptado en la Review.
7. Detalle técnico: `npm run seed:emulador` usa sintaxis de bash y no funciona en Windows. Se puede arreglar con `cross-env` o con un script de Node.
8. Limpieza: borrar las ramas remotas ya integradas (`sprint-1`, `HU-06-busqueda-filtros`, `HU-07-favoritos`, `HU-08-Marcar-como-dominado`, `HU-08-dominado`, `HU-09-temporizador`, `HU-10-compartir`, `HU-11-rompehielos`, `docs-claude-estado`) y las tareas de ejemplo SCRUM-1 a SCRUM-4.
9. Alexzzen24 no aparece en la lista de desarrolladores de `CLAUDE.md`. [COMPLETAR] confirmar si es parte del equipo y agregarlo.
10. El Rompehielos solo aparece en el menú de su propia página. Decidir si se agrega al menú de las demás.

## 3. Replanificación

Sprints en Jira (tablero 1), ordenados el 17 de noviembre:

| Sprint | Id | Fechas | Historias | Pts terminados | Estado |
|---|---|---|---|---|---|
| 1 · Base | 2 | 23 al 30 oct | HU-01 a HU-07, HU-09 | 27 (14 planeados) | Cerrado |
| 2 · Práctica | 1 | 31 oct al 6 nov | HU-08, HU-10, HU-11, HU-12, HU-15 | 14 | Cerrado |
| 3 · Aprender | 35 | 2 al 13 nov | HU-14, HU-21, HU-22, HU-25 | 14 | Cerrado |
| 4 · Cierre | 36 | 14 al 20 nov | HU-13, HU-18, HU-26, HU-27 | 5 de 11 (HU-13 y HU-18 en revisión) | Activo |

- El Sprint 3 empezó el 2 de noviembre, junto con el final del Sprint 2: la replaneación de esa Review se programó de inmediato.
- Los Sprints 2 y 3 se iniciaron y cerraron en Jira el 17 de noviembre con sus fechas reales, para que el informe de velocidad las refleje.
- El objetivo de cada Sprint quedó escrito en Jira.

Velocidad: 27 → 14 → 14 → (11 si se aceptan HU-13 y HU-18). El Sprint 1 no es representativo: se hizo con mucha ayuda de IA y los puntos son relativos. Desde el Sprint 2 se planeó con **14 pts por Sprint**, siguiendo a Kniberg («el tiempo que hizo ayer» aplicado con sentido común). [COMPLETAR qué representa el 15 del factor de dedicación del Sprint 1: ¿días-persona disponibles?]

**Pendiente en Jira:**
1. Pasar HU-13 y HU-18 a «Finalizado» cuando pasen `npm run test:reglas` y la prueba en staging.
2. Cerrar el Sprint 4 en la Review final (20 nov).
3. Exportar el burndown y el informe de velocidad (Informes del tablero) para el documento de cierre.
4. Registrar las horas por integrante. [COMPLETAR]

**Replaneación del 2 de noviembre («Aprender jugando»).** En la Review, la Dra. Neira observó que todavía no se veía que el usuario aprenda los trabalenguas y sugirió más juegos. El PO agregó HU-21 a HU-25 (SCRUM-25 a SCRUM-29, etiqueta `Review-Dra`) y reordenó el backlog: cada trabalenguas tiene una ruta de 4 etapas (Lee, Ordena, Completa, Dilo) y queda dominado al completarlas. HU-14 genera sola la palabra oculta y los distractores, así que baja de 8 a 5 pts y deja de depender de HU-13, que baja de 5 a 3 y pasa al Sprint 4. HU-16, HU-17, HU-19 y HU-25 quedan fuera de la v1.0 (etiqueta `Fuera-v1.0`). Las estimaciones nuevas son propuestas: el equipo las confirma con planning poker en el refinamiento.

**Ajuste del mismo 2 de noviembre (ruta de 3 etapas).** HU-21 a HU-24 se programaron e integraron (PR #17 a #21), pero al probarlos el PO decidió que el karaoke (HU-23) y «Dilo en voz alta» (HU-24) no aportaban al objetivo de *entender* los conceptos: se descartan y se retiran del código. Entra el Memorama (HU-25) como etapa 3, y HU-14 cambia a 5 preguntas sobre el mismo trabalenguas (frase, concepto, definición y dos de vida diaria), para lo que la semilla gana 2 ejemplos cotidianos por concepto. La ruta queda Ordena → Completa → Relaciona. Esto libera 8 pts del Sprint 4; el PO decide si entra HU-17 (Niveles) o se deja holgura para la liberación. [COMPLETAR decisión del PO]

## 4. Decisiones de diseño

El plan Spark no incluye Cloud Functions: todo se hace desde el cliente y se protege con reglas.

1. ~~**HU-12, máximo 5 envíos pendientes.**~~ Decidido el 30 de octubre: colección `envios` + contador `usuarios/{uid}.enviosPendientes`, que sube en el mismo batch que crea el envío. **HU-13 debe bajar el contador** al aprobar o rechazar, y al rechazar debe guardar el motivo en el campo `motivo` del envío (HU-15 ya lo muestra); mientras no exista, un usuario con 5 pendientes no puede enviar más.
2. ~~**HU-11, «mismo día natural».**~~ Resuelto: usa `America/Monterrey`.
3. ~~**HU-13, nombre del autor.**~~ Decidido el 30 de octubre: el formulario de HU-12 pedirá «Nombre con el que quieres aparecer» (obligatorio, máx. 40 caracteres) y se guardará en el envío como `autorNombre`; el moderador lo ve antes de aprobar. Falta agregar el campo al formulario y a las reglas de `envios`. Los envíos hechos antes no tienen nombre: el moderador tendrá que capturarlo o publicarlos como «Comunidad». [SUPUESTO]
4. ~~**HU-14, datos del juego.**~~ Decidido el 2 de noviembre: no se guardan. La palabra oculta y los distractores se generan en el cliente a partir de los trabalenguas aprobados.
7. ~~**HU-21, campo `etapas`.**~~ Hecho: la regla de `progreso` acepta `etapas` (booleanos `ordena`, `completa`, `memorama`, y `lee`/`dilo` de las etapas retiradas), con pruebas. [SUPUESTO: un usuario podría marcar etapas desde la consola del navegador; se acepta porque el progreso es personal y no compite con nadie]
5. ~~**HU-18, eliminar cuenta.**~~ Resuelto el 17 de noviembre (PR de HU-18) [SUPUESTO: el PO lo valida en la Review]. Sin Cloud Functions, el cliente borra en este orden: reautenticación con contraseña → su `progreso` → sus `envios` (si uno está publicado, en el mismo batch su trabalenguas pasa a `autorNombre: «Anónimo»`) → `usuarios/{uid}` → usuario de Authentication. Las reglas permiten cada paso solo al dueño y solo poner «Anónimo» en sus propias aportaciones. No existe la colección `partidas`: los resultados de los juegos están en `progreso`. Si falla a la mitad, se puede reintentar.
8. ~~**HU-13, cómo se publica.**~~ Resuelto el 17 de noviembre (PR #29) [SUPUESTO: el PO lo valida]. Aprobar publica `trabalenguas/{id del envío}` en el mismo batch que marca el envío y baja el contador del autor. El editor puede corregir el texto antes de publicar y agregar fuente y ejemplos cotidianos. El rol se asigna en la consola de Firebase (ver `CLAUDE.md`, sección 4).
6. **HU-16, la racha.** Falta la regla exacta del plan v3.0 (sección 3.2). [COMPLETAR] (HU-16 quedó fuera de la v1.0.)
