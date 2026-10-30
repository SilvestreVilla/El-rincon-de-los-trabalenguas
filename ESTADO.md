# ESTADO.md · El Rincón de los Trabalenguas

> Estado vivo del proyecto. Cambia cada Sprint: actualízalo en la Review y en la planeación.
> El contexto estable (tecnología, modelo de datos, flujo, Definition of Done) está en `CLAUDE.md`.
> Actualizado: 30 de octubre de 2026 (fin del Sprint 1).

## 1. Estado de las historias

| Historia | Pts | Estado |
|---|---|---|
| HU-01 Registro | 3 | En `main` (PR #1) · en staging |
| HU-02 Sesión | 2 | En `main` (PR #1) · en staging |
| HU-03 Recuperar contraseña | 1 | En `main` (PR #1) · en staging |
| HU-04 Catálogo | 5 | En `main` (PR #1) · en staging · semilla de 30 cargada (sin validar por el editor) |
| HU-05 Detalle | 3 | En `main` (PR #1) · en staging |
| HU-06 Búsqueda y filtros | 5 | En `main` (PR #2, diegoooolpzz06) · en staging, probada |
| HU-07 Favoritos | 3 | En `main` (PR #3, daevev) · reglas publicadas · probada en staging |
| HU-09 Temporizador | 5 | En `main` (PR #4, daevev) · reglas publicadas · probada en staging |
| HU-10 Compartir | 2 | **PR #5 abierto**, sin revisión. Código revisado: cumple los 3 criterios |
| HU-08 Dominado | 2 | Se subió directo a `main` y se revirtió. La rama `HU-08-Marcar-como-dominado` ya no sirve para el PR (ver problema 3) |
| HU-11 Rompehielos | 3 | Alexzzen24 subió `rompehielos-daily.zip` directo a `main` (30 oct). El código está bien (día en `America/Monterrey`, con pruebas), pero dentro de un zip: no se publica ni pasó por PR |
| HU-12 Proponer | 5 | Sin empezar · sin rama |
| HU-15 Mis envíos | 2 | Sin empezar · sin rama · depende de HU-12 |

Jira (30 oct): SCRUM-5 a SCRUM-9 están «En revisión». HU-08, HU-10 y HU-11 están «Por hacer» con `Sprint-2`; HU-12 y HU-15 siguen con la etiqueta `Sprint-3` (la replanificación no se ha aplicado).

## 2. Problemas abiertos (en orden)

1. **Ningún PR (#1 a #5) tiene una aprobación registrada**, y todos los integró SilvestreVilla. Hay que conseguir que otro desarrollador apruebe o comente en cada uno; sin eso no se cumple la DoD. En los PR ya integrados probablemente GitHub solo permita comentar: la evidencia será el comentario de revisión.
2. **Proteger `main`:** Settings → Branches → regla para `main` con *Require a pull request* y *Require approvals: 1*.
3. **HU-08:** el commit de la rama (`f27c65f`) ya está en la historia de `main` y luego se revirtió, así que un PR desde esa rama sale vacío. Hay que crear una rama nueva desde `main`, revertir el revert (`git revert efaf238`), agregar a las reglas `dominado is bool` (hoy acepta el campo sin validar el tipo) con su prueba, y abrir el PR desde ahí.
4. **`npm run test:reglas` nunca se ha corrido** en una computadora con Java. Las reglas se probaron a mano en producción y pasaron, pero la DoD pide la corrida automática.
5. El editor no ha validado los 30 trabalenguas (DoD 8). El aviso de privacidad sigue en borrador.
6. Producción (`rincon-de-los-trabalenguas.web.app`) quizá ya tenga historias del Sprint 2 sin aceptar. A producción solo debe ir lo aceptado en la Review.
7. Detalle técnico: `npm run seed:emulador` usa sintaxis de bash y no funciona en Windows. Se puede arreglar con `cross-env` o con un script de Node.
8. Limpieza: borrar la rama `sprint-1` (ya integrada, local y en `origin`) y las tareas de ejemplo SCRUM-1 a SCRUM-4.
9. El comentario del encabezado de `firestore.rules` dice que HU-12 y HU-13 llegan en el Sprint 3; con la replanificación, HU-12 pasa al Sprint 2. Corregirlo en la rama de HU-12.
10. **HU-11:** sacar el código del zip a una rama `HU-11-rompehielos`, abrir su PR y borrar `rompehielos-daily.zip` de `main`. Alexzzen24 no aparece en la lista de desarrolladores de `CLAUDE.md`: [COMPLETAR] confirmar si es parte del equipo.

## 3. Replanificación propuesta (pendiente de aplicar)

Velocidad real del Sprint 1: 27 pts (factor de dedicación 27 ÷ 15 = 180 %). [COMPLETAR qué representa el 15: ¿días-persona disponibles?] No es representativa: el Sprint 1 se hizo con mucha ayuda de IA y los puntos son relativos. Se planea con **14 pts por Sprint**, siguiendo a Kniberg («el tiempo que hizo ayer» aplicado con sentido común).

| Sprint | Fechas [SUPUESTO] | Historias | Pts |
|---|---|---|---|
| 1 · Base | 23 al 30 oct | HU-01 a HU-07, HU-09 | 27 real (14 planeados) |
| 2 · Práctica | 31 oct al 6 nov | HU-08, HU-10, HU-11, HU-12, HU-15 | 14 |
| 3 · Comunidad y juego | 7 al 13 nov | HU-13, HU-14 | 13 |
| 4 · Liberación | 14 al 20 nov | HU-16, HU-17, HU-18 + liberación (Lighthouse, navegadores, manual) | 11 |
| Reserva | — | HU-19 (Could, 5) si sobra capacidad · HU-20 (Won't, 13) para la v2.0 | — |

Total: 65 pts planeados (HU-01 a HU-18). HU-12 y HU-15 se adelantan porque HU-13 y HU-14 dependen de que existan envíos.

Nota: HU-08 ya está programada y HU-10 ya tiene PR, así que del Sprint 2 solo unos 10 pts son trabajo nuevo. El margen puede ir a cumplir la DoD pendiente (aprobaciones, `test:reglas`, validación del editor).

**Para aplicarlo en Jira:**
1. Cerrar el Sprint 1 después de la Review.
2. Configurar los Sprints 2 a 4 con su nombre, objetivo y fechas.
3. Mover las historias a su Sprint y cambiar sus etiquetas `Sprint-n`.
4. Pasar a «Finalizado» solo lo que cumpla la DoD.
5. Actualizar la tabla de horas y el burndown.

## 4. Decisiones de diseño pendientes (resolver en el refinamiento)

El plan Spark no incluye Cloud Functions: todo se hace desde el cliente y se protege con reglas.

1. **HU-12, máximo 5 envíos pendientes.** Las reglas no pueden contar documentos. Hace falta un contador (por ejemplo, en `usuarios/{uid}`), pero hoy la regla de update de `usuarios` no permite cambiar ningún campo. [COMPLETAR diseño]
2. ~~**HU-11, «mismo día natural».**~~ Resuelto en el código del zip: usa `America/Monterrey`.
3. **HU-14, datos del juego.** Si la palabra oculta y los distractores se guardan en `trabalenguas/{id}`, que lee cualquiera, la respuesta queda visible en el cliente. Decidir si se acepta o se guardan aparte. [COMPLETAR]
4. **HU-18, eliminar cuenta.** Hoy las reglas prohíben borrar `usuarios` y `progreso`, y el cliente no puede escribir en `trabalenguas` para dejar las aportaciones como «Anónimo». Hay que cambiar las reglas y el modelo de datos («el progreso no se borra»). [COMPLETAR diseño]
5. **HU-16, la racha.** Falta la regla exacta del plan v3.0 (sección 3.2). [COMPLETAR]
