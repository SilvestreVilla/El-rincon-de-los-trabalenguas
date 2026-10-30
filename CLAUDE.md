# CLAUDE.md · El Rincón de los Trabalenguas

> Contexto para Claude Code. Guárdalo en la raíz del repo como `CLAUDE.md`: Claude Code lo lee solo al abrir la carpeta.
> Actualizado: 30 de octubre de 2026. Aquí va solo el contexto estable; el estado de cada Sprint está en `ESTADO.md`.

## 1. Qué es este proyecto

Proyecto Scrum del **Equipo 2** para la materia *Administración de Proyectos de Software* (FIME-UANL, Ing. Leticia Amalia Neira Tovar).

**Producto:** «El Rincón de los Trabalenguas: aprende a administrar proyectos trabalenguando». Es una plataforma web donde equipos de trabajo practican trabalenguas construidos sobre conceptos de administración de proyectos (AP). El cliente es una editorial de software de AP: [COMPLETAR nombre]. Un representante de la editorial es el Product Owner, y un editor de contenido valida los conceptos.

Lo que se califica no es solo el código, sino **la evidencia de Scrum**: backlog, Sprints, Definition of Done, pull requests revisados, burndown y Jira al día. Cuida ambas cosas.

## 2. Idioma y estilo

- Todo en **español de México**: interfaz, commits, pull requests, comentarios del código y respuestas.
- Términos de Scrum en inglés: Product Owner, Scrum Master, Sprint, Product Backlog, Definition of Done, Daily, Review.
- Textos de la interfaz: claros, sin errores de ortografía (la Definition of Done lo exige).

## 3. Tecnología (no cambiarla sin acuerdo del equipo)

- HTML, CSS y JavaScript **sin frameworks ni compilación** (módulos ES nativos).
- Firebase SDK web **10.14.1** importado desde `https://www.gstatic.com/firebasejs/10.14.1/...`.
- Firebase: Authentication (correo y contraseña), Firestore y Hosting.
- Seguridad: los datos de Firestore se pintan con `textContent` o con la función `el()` de `public/js/ui.js`. **Nunca con `innerHTML`.**
- En `localhost`, `public/js/firebase.js` conecta solo a los emuladores (Auth en 9099, Firestore en 8080, Hosting en 5000).

### Estructura

```
public/                  sitio que se publica en Hosting
  index.html             catálogo + búsqueda y filtros (HU-04, HU-06)
  trabalenguas.html      detalle + favorito + temporizador (HU-05, HU-07, HU-09)
  favoritos.html         «Mis favoritos» (HU-07)
  registro.html, login.html, recuperar.html, perfil.html (HU-01 a HU-03)
  privacidad.html        borrador de aviso de privacidad (HU-18 lo termina)
  css/estilos.css        guía de estilos (variables en :root)
  js/firebase-config.js  configuración del proyecto real (no es secreta)
  js/firebase.js         inicializa Firebase y conecta los emuladores en local
  js/ui.js               el(), etiquetas de área y dificultad, navegación según la sesión, usuarioActual()
  js/catalogo.js, detalle.js, favoritos.js, mis-favoritos.js, temporizador.js, registro.js, login.js, recuperar.js, perfil.js
data/trabalenguas.json   semilla: 30 trabalenguas, 6 por área
scripts/seed.js          carga la semilla (Admin SDK, idempotente)
firestore.rules          reglas de seguridad
tests/reglas.test.js     pruebas de reglas (node:test + @firebase/rules-unit-testing)
.github/pull_request_template.md   checklist de la Definition of Done
```

### Modelo de datos (Firestore)

- `usuarios/{uid}`: `email`, `rol` (siempre «usuario» desde el cliente; «moderador» lo asigna el PO en la consola), `aceptoPrivacidad`, `mayorDeEdad`, `creado`. Solo el dueño lo lee. Nadie cambia su rol.
- `trabalenguas/{id}`: `titulo`, `texto` (20 a 500 caracteres), `concepto`, `definicion` (máx. 200), `area` (Scrum, Planeación, Riesgos, Calidad, Liderazgo), `dificultad` (Fácil, Medio, Difícil), `autorNombre`, `estado` (aprobado, pendiente, rechazado), `creado`. Solo se leen los aprobados. El cliente no escribe aquí todavía.
- `progreso/{uid}_{trabalenguasId}`: `usuarioId`, `trabalenguasId`, `esFavorito`, `dominado`, `mejorTiempoSeg`, `practicas`, `ultimaPractica`. Cada usuario lee y escribe solo lo suyo; no se borra.

Cualquier colección nueva (por ejemplo, `partidas` o los envíos de HU-12) necesita: regla nueva en `firestore.rules`, sus pruebas en `tests/reglas.test.js` y publicar las reglas.

## 4. Comandos (la laptop del equipo usa Windows cmd)

```
npm install
npm run emuladores                     # Auth, Firestore, Hosting y UI (requiere Java 11+)
set FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
node scripts/seed.js                   # semilla en el emulador (npm run seed:emulador no sirve en cmd)
npm run test:reglas                    # pruebas de reglas (requiere Java)
npm run deploy:staging                 # canal staging
npx firebase deploy --only firestore:rules   # publica reglas en producción
npm run deploy                         # producción: hosting + reglas + índices (solo lo aceptado en la Review)
```

- En cmd **no** se ponen comentarios con `#` en la misma línea del comando.
- En PowerShell, la variable se define con `$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"` (y `$env:GOOGLE_APPLICATION_CREDENTIALS="serviceAccount.json"` para la semilla en producción).
- Los emuladores también abren su interfaz web en http://localhost:4000.
- Semilla en producción: `set GOOGLE_APPLICATION_CREDENTIALS=serviceAccount.json` y luego `npm run seed`. Ese archivo es una llave privada: nunca se sube, nunca se pega en el chat, y se borra al terminar.

## 5. Firebase, GitHub y Jira

- **Firebase:** proyecto `rincon-de-los-trabalenguas`, región `nam5`, plan Spark.
  - Correo y contraseña habilitado, contraseñas de mínimo 8 caracteres en modo exigir, protección contra enumeración de correos activa.
  - Staging: https://rincon-de-los-trabalenguas--staging-u9q1zu2n.web.app. El canal vence 30 días después del último `npm run deploy:staging`; cada despliegue renueva el plazo.
  - Producción: https://rincon-de-los-trabalenguas.web.app
  - Los emuladores y las pruebas usan el proyecto `demo-rincon-trabalenguas`, así que nunca tocan producción.
- **GitHub:** https://github.com/SilvestreVilla/El-rincon-de-los-trabalenguas
  - Rama principal `main`. Su protección está pendiente (ver `ESTADO.md`).
  - Desarrolladores: diegoooolpzz06, daevev, osmarsolis22. Dueño: SilvestreVilla.
- **Jira:** sitio silvestrevilla520.atlassian.net, proyecto «Scrum 1» (clave `SCRUM`), tablero 1.
  - Las historias HU-01 a HU-20 son SCRUM-5 a SCRUM-24 (HU-n = SCRUM-(n+4)).
  - Puntos en el campo «Story point estimate» (`customfield_10016`).
  - Etiquetas por historia: `HU-xx`, `Sprint-n` o `Reserva`, y `MoSCoW-…`.
  - Estados: Por hacer, En curso, En revisión, Finalizado.
  - Ids de Sprint en Jira: «Sprint 1 · Base» = 2, «Sprint 2 · Práctica» = 1. Cuál está activo se anota en `ESTADO.md`.
  - SCRUM-1 a SCRUM-4 son tareas de ejemplo de Jira, no historias.

## 6. Flujo de trabajo y Definition of Done

**Flujo:** una rama por historia (`HU-xx-nombre`, por ejemplo `HU-06-busqueda-filtros`), commits con el prefijo `HU-xx:`, y pull request hacia `main` con la plantilla. **Otro** desarrollador debe aprobar en GitHub (*Review changes → Approve*). Al final se publica en staging y se pega el enlace en el pull request.

**Definition of Done** (8 puntos):
1. Cumple sus criterios de aceptación y el PO la validó.
2. Pull request revisado por otro desarrollador en GitHub.
3. Funciona en 4 navegadores y en celular.
4. Sin errores en la consola.
5. Las reglas de Firestore que toca están probadas en el emulador.
6. Desplegada en staging.
7. Textos sin errores de ortografía y con la guía de estilos.
8. Todo concepto de AP mostrado fue verificado por el editor de la editorial.

## 7. Estado del proyecto

El estado de las historias, los problemas abiertos, la replanificación y las decisiones de diseño pendientes están en **`ESTADO.md`**, que se actualiza cada Sprint. Léelo antes de empezar cualquier historia.

## 8. Backlog pendiente con criterios de aceptación

**HU-08 Marcar como dominado** (Must, 2 pts)
Como usuario, necesito marcar un trabalenguas como dominado, para llevar registro de lo que ya domino.
- Al marcar «dominado», el contador de dominados del usuario cambia de inmediato.
- Se puede desmarcar y el contador se ajusta.

**HU-10 Compartir en el chat del equipo** (Should, 2 pts)
Como usuario, necesito compartir un trabalenguas en el chat de mi equipo, para retar a mis compañeros.
- Cada detalle tiene una URL única.
- El botón copia el enlace o abre el menú de compartir del dispositivo.
- El enlace funciona sin sesión iniciada.

**HU-11 Rompehielos del Daily** (Should, 3 pts)
Como líder de equipo, necesito proyectar el Rompehielos del Daily en pantalla completa, para abrir la reunión con energía y un concepto nuevo.
- Todos los usuarios ven el mismo trabalenguas durante el mismo día natural, y cambia al día siguiente. Se elige de forma determinista por fecha; no hace falta servidor.
- «Pantalla completa» muestra el trabalenguas en letra grande, legible a 3 m, con su concepto.
- Funciona sin sesión iniciada para poder proyectarlo en la sala.
- No es un minijuego: no lleva puntos ni respuestas.

**HU-12 Proponer un trabalenguas** (Must, 5 pts)
Como usuario, necesito proponer un trabalenguas sobre un concepto de AP, para compartir lo que sé con otros equipos.
- El formulario valida título, texto (20 a 500 caracteres), concepto, definición (máx. 200), área y dificultad.
- El envío se guarda como «pendiente» y no aparece en el catálogo.
- Un usuario puede tener como máximo 5 envíos pendientes a la vez.

**HU-13 Validación del editor** (Must, 5 pts)
Como editor de contenido de la editorial, necesito validar, aprobar o rechazar envíos y capturar los datos del juego, para que solo se publiquen conceptos correctos.
- Solo los usuarios con rol «moderador» acceden a la moderación; las reglas bloquean a los demás.
- El editor confirma que el concepto y la definición son correctos. Aprobar publica; rechazar exige un motivo.
- Al aprobar se capturan la palabra oculta y 3 distractores para el juego.

**HU-14 Juego «Completar la frase»** (Must, 8 pts)
Como usuario, necesito jugar «Completar la frase» y ver la definición del concepto al responder, para aprender jugando.
- Cada partida tiene 5 preguntas de trabalenguas con datos de juego.
- 4 opciones en orden aleatorio; al responder se indica si fue correcta y se muestra la definición.
- Al terminar se guarda la partida y se actualiza el mejor puntaje.

**HU-15 Estado de mis envíos** (Should, 2 pts)
Como usuario, necesito ver el estado de mis envíos y el motivo si se rechazaron, para saber qué pasó con mis aportaciones.
- En «Mis envíos» se ve cada envío con su estado y, si fue rechazado, el motivo.

**HU-16 Estadísticas por área de AP** (Must, 5 pts)
Como usuario, necesito ver mis estadísticas (dominados, conceptos por área, aportaciones, racha y mejor puntaje), para saber qué áreas de AP me faltan.
- El perfil muestra dominados, conceptos dominados por área, aportaciones aprobadas, racha actual y máxima, y mejor puntaje.
- La racha sigue la regla del plan (sección 3.2). [COMPLETAR la regla exacta con el plan v3.0]

**HU-17 Niveles de proyecto** (Should, 3 pts)
Como usuario, necesito subir de nivel (Integrante → Líder de Sprint → Director de Proyecto), para sentirme motivado a seguir practicando.
- El nivel cambia al cruzar los umbrales de 5 y 15 dominados.
- La insignia «Autor» aparece con una aportación aprobada.

**HU-18 Privacidad y eliminar cuenta** (Must, 3 pts)
Como usuario, necesito consultar el aviso de privacidad y eliminar mi cuenta, para controlar mis datos.
- El aviso de privacidad es accesible desde el pie de todas las páginas.
- Eliminar la cuenta pide confirmación y borra usuario, progreso y partidas. Sus aportaciones aprobadas quedan como «Anónimo».

**HU-19 Reto por equipos** (Could, 5 pts, reserva): criterios por definir en el refinamiento.
**HU-20 Integración nativa con la editorial** (Won't, 13 pts): queda para la v2.0.

## 9. Cómo debe trabajar Claude aquí

- Antes de programar una historia, lee `ESTADO.md`, confirma en qué Sprint está y que exista su rama. No adelantes historias sin acuerdo del PO.
- Si la historia tiene una decisión de diseño pendiente en `ESTADO.md` (sección 4), plantéala al usuario antes de programar.
- No hagas push directo a `main`, no integres pull requests y no publiques en producción sin que el usuario lo pida explícitamente.
- Toda regla nueva lleva su prueba en `tests/reglas.test.js`.
- Al terminar, reporta qué criterios de aceptación cumpliste, cuáles de la DoD faltan y qué hay que actualizar en Jira, y actualiza `ESTADO.md`.
- Marca con `[SUPUESTO]` o `[COMPLETAR]` lo que no esté definido; no lo inventes.
