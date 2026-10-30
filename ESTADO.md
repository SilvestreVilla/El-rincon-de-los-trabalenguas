# ESTADO.md · El Rincón de los Trabalenguas

> Estado vivo del proyecto. Cambia cada Sprint: actualízalo en la Review y en la planeación.
> El contexto estable (tecnología, modelo de datos, flujo, Definition of Done) está en `CLAUDE.md`.
> Actualizado: 30 de octubre de 2026 (fin del Sprint 1, preparación del Sprint 2).

## 1. Estado de las historias

| Historia | Pts | Sprint | Estado |
|---|---|---|---|
| HU-01 Registro | 3 | 1 | En `main` (PR #1) · en staging |
| HU-02 Sesión | 2 | 1 | En `main` (PR #1) · en staging |
| HU-03 Recuperar contraseña | 1 | 1 | En `main` (PR #1) · en staging |
| HU-04 Catálogo | 5 | 1 | En `main` (PR #1) · en staging · semilla de 30 cargada (sin validar por el editor) |
| HU-05 Detalle | 3 | 1 | En `main` (PR #1) · en staging |
| HU-06 Búsqueda y filtros | 5 | 1 | En `main` (PR #2, diegoooolpzz06) · en staging, probada |
| HU-07 Favoritos | 3 | 1 | En `main` (PR #3, daevev) · reglas publicadas · probada en staging |
| HU-09 Temporizador | 5 | 1 | En `main` (PR #4, daevev) · reglas publicadas · probada en staging |
| HU-08 Dominado | 2 | 2 | En `main` (PR #7) · **falta publicar las reglas** (`dominado is bool`) y desplegar en staging |
| HU-10 Compartir | 2 | 2 | En `main` (PR #5, daevev) · falta desplegar en staging |
| HU-11 Rompehielos | 3 | 2 | En `main` (PR #8, código de Alexzzen24) · falta desplegar en staging y probar la lectura a 3 m |
| HU-12 Proponer | 5 | 2 | Rama `HU-12-proponer` · PR abierto · reglas y pruebas listas |
| HU-15 Mis envíos | 2 | 2 | Sin empezar · depende de HU-12 (la regla de lectura de `envios` ya está) |

Jira (30 oct): HU-01 a HU-07 y HU-09 están en «Sprint 1 · Base» y en «En revisión». HU-08, HU-10, HU-11, HU-12 y HU-15 están en «Sprint 2 · Práctica» (aún sin iniciar); las tres primeras en «En revisión» y las dos últimas en «Por hacer». Ninguna tiene responsable salvo HU-06.

## 2. Problemas abiertos (en orden)

1. **Ningún PR (#1 a #8) tiene una revisión registrada en GitHub.** Alexzzen24 integró los PR #5 a #8 el 30 de octubre, pero sin aprobar ni comentar, así que no cuenta como evidencia para la DoD. Hay que pedir a otro desarrollador que deje un comentario de revisión en cada uno (en los ya integrados, GitHub solo permite comentar). El PR #8 es código de Alexzzen24, así que lo tiene que revisar otra persona.
2. **Proteger `main`:** Settings → Branches → regla para `main` con *Require a pull request* y *Require approvals: 1*. Ya van dos veces que se sube directo (HU-08 y el zip de HU-11).
3. **Publicar las reglas** de HU-08 y HU-12 en producción cuando se acepten: `npx firebase deploy --only firestore:rules`.
4. **Java 11+ en la laptop del equipo.** `npm run test:reglas` ya se corrió (48 de 48 en verde el 30 de octubre), pero con un JDK 21 portátil temporal. Hay que instalar un JDK 21 (por ejemplo, Eclipse Temurin) para que cualquiera pueda correrlo.
5. El editor no ha validado los 30 trabalenguas (DoD 8). El aviso de privacidad sigue en borrador.
6. Producción (`rincon-de-los-trabalenguas.web.app`) quizá ya tenga historias del Sprint 2 sin aceptar. A producción solo debe ir lo aceptado en la Review.
7. Detalle técnico: `npm run seed:emulador` usa sintaxis de bash y no funciona en Windows. Se puede arreglar con `cross-env` o con un script de Node.
8. Limpieza: borrar las ramas `sprint-1` y `HU-08-Marcar-como-dominado` (ya integradas) y las tareas de ejemplo SCRUM-1 a SCRUM-4.
9. Alexzzen24 no aparece en la lista de desarrolladores de `CLAUDE.md`. [COMPLETAR] confirmar si es parte del equipo y agregarlo.
10. El Rompehielos solo aparece en el menú de su propia página. Decidir si se agrega al menú de las demás.

## 3. Replanificación

Aplicada en Jira el 30 de octubre (Sprints y etiquetas). Faltan las fechas y el objetivo del Sprint 2, y que las descripciones de HU-12 y HU-15 dejen de decir «Sprint planeado: Sprint 3».

Velocidad real del Sprint 1: 27 pts (factor de dedicación 27 ÷ 15 = 180 %). [COMPLETAR qué representa el 15: ¿días-persona disponibles?] No es representativa: el Sprint 1 se hizo con mucha ayuda de IA y los puntos son relativos. Se planea con **14 pts por Sprint**, siguiendo a Kniberg («el tiempo que hizo ayer» aplicado con sentido común).

| Sprint | Fechas [SUPUESTO] | Historias | Pts |
|---|---|---|---|
| 1 · Base | 23 al 30 oct | HU-01 a HU-07, HU-09 | 27 real (14 planeados) |
| 2 · Práctica | 31 oct al 6 nov | HU-08, HU-10, HU-11, HU-12, HU-15 | 14 |
| 3 · Comunidad y juego | 7 al 13 nov | HU-13, HU-14 | 13 |
| 4 · Liberación | 14 al 20 nov | HU-16, HU-17, HU-18 + liberación (Lighthouse, navegadores, manual) | 11 |
| Reserva | — | HU-19 (Could, 5) si sobra capacidad · HU-20 (Won't, 13) para la v2.0 | — |

Total: 65 pts planeados (HU-01 a HU-18). HU-12 y HU-15 se adelantan porque HU-13 y HU-14 dependen de que existan envíos.

**Pendiente en Jira:**
1. Cerrar el Sprint 1 después de la Review e iniciar el Sprint 2 con su objetivo y fechas.
2. Configurar los Sprints 3 y 4.
3. Asignar responsable a cada historia.
4. Pasar a «Finalizado» solo lo que cumpla la DoD.
5. Actualizar la tabla de horas y el burndown.

## 4. Decisiones de diseño

El plan Spark no incluye Cloud Functions: todo se hace desde el cliente y se protege con reglas.

1. ~~**HU-12, máximo 5 envíos pendientes.**~~ Decidido el 30 de octubre: colección `envios` + contador `usuarios/{uid}.enviosPendientes`, que sube en el mismo batch que crea el envío. **HU-13 debe bajar el contador** al aprobar o rechazar; mientras no exista, un usuario con 5 pendientes no puede enviar más.
2. ~~**HU-11, «mismo día natural».**~~ Resuelto: usa `America/Monterrey`.
3. **HU-13, nombre del autor.** Los envíos guardan `autorId`, no un nombre, y el moderador no puede leer el correo del autor. Hay que decidir de dónde sale `autorNombre` al publicar. [COMPLETAR]
4. **HU-14, datos del juego.** Si la palabra oculta y los distractores se guardan en `trabalenguas/{id}`, que lee cualquiera, la respuesta queda visible en el cliente. Decidir si se acepta o se guardan aparte. [COMPLETAR]
5. **HU-18, eliminar cuenta.** Hoy las reglas prohíben borrar `usuarios`, `progreso` y `envios`, y el cliente no puede escribir en `trabalenguas` para dejar las aportaciones como «Anónimo». Hay que cambiar las reglas y el modelo de datos («el progreso no se borra»). [COMPLETAR diseño]
6. **HU-16, la racha.** Falta la regla exacta del plan v3.0 (sección 3.2). [COMPLETAR]
