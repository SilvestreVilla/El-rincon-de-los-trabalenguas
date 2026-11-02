# CLAUDE.md · El Rincón de los Trabalenguas

> Contexto para Claude Code. Guárdalo en la raíz del repo como `CLAUDE.md`: Claude Code lo lee solo al abrir la carpeta.
> Actualizado: 2 de noviembre de 2026 (replaneación «Aprender jugando»). Aquí va solo el contexto estable; el estado de cada Sprint está en `ESTADO.md`.

## 1. Qué es este proyecto

Proyecto Scrum del **Equipo 2** para la materia *Administración de Proyectos de Software* (FIME-UANL, Ing. Leticia Amalia Neira Tovar).

**Producto:** «El Rincón de los Trabalenguas: aprende a administrar proyectos trabalenguando». Es una plataforma web donde equipos de trabajo practican trabalenguas construidos sobre conceptos de administración de proyectos (AP). El cliente es una editorial de software de AP: [COMPLETAR nombre]. Un representante de la editorial es el Product Owner, y un editor de contenido valida los conceptos.

Lo que se califica no es solo el código, sino **la evidencia de Scrum**: backlog, Sprints, Definition of Done, pull requests, avances visibles en staging, burndown y Jira al día. Cuida ambas cosas.

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
  rompehielos.html       Rompehielos del Daily (HU-11)
  proponer.html          proponer un trabalenguas (HU-12)
  envios.html            «Mis envíos» con estado y motivo de rechazo (HU-15)
  privacidad.html        borrador de aviso de privacidad (HU-18 lo termina)
  css/estilos.css        guía de estilos (variables en :root)
  js/firebase-config.js  configuración del proyecto real (no es secreta)
  js/firebase.js         inicializa Firebase y conecta los emuladores en local
  js/ui.js               el(), etiquetas de área y dificultad, navegación según la sesión, usuarioActual()
  js/catalogo.js, detalle.js, favoritos.js, mis-favoritos.js, temporizador.js, dominado.js, compartir.js,
     rompehielos.js, dia.js, proponer.js, mis-envios.js, registro.js, login.js, recuperar.js, perfil.js
data/trabalenguas.json   semilla: 30 trabalenguas, 6 por área
scripts/seed.js          carga la semilla (Admin SDK, idempotente)
firestore.rules          reglas de seguridad
tests/reglas.test.js     pruebas de reglas (node:test + @firebase/rules-unit-testing)
.github/pull_request_template.md   checklist de la Definition of Done
```

### Modelo de datos (Firestore)

- `usuarios/{uid}`: `email`, `rol` (siempre «usuario» desde el cliente; «moderador» lo asigna el PO en la consola), `aceptoPrivacidad`, `mayorDeEdad`, `creado`, y desde HU-12 `enviosPendientes` y `ultimoEnvio`. Solo el dueño lo lee. Nadie cambia su rol. El dueño solo puede subir `enviosPendientes` de 1 en 1 (máx. 5) en el mismo batch que crea un envío.
- `trabalenguas/{id}`: `titulo`, `texto` (20 a 500 caracteres), `concepto`, `definicion` (máx. 200), `area` (Scrum, Planeación, Riesgos, Calidad, Liderazgo), `dificultad` (Fácil, Medio, Difícil), `autorNombre`, `estado` (aprobado, pendiente, rechazado), `creado`. Solo se leen los aprobados. El cliente no escribe aquí todavía.
- `progreso/{uid}_{trabalenguasId}`: `usuarioId`, `trabalenguasId`, `esFavorito`, `dominado`, `mejorTiempoSeg`, `practicas`, `ultimaPractica`, y desde HU-21 `etapas` (mapa con solo `lee`, `ordena`, `completa`, `dilo`, booleanos). Cada usuario lee y escribe solo lo suyo; no se borra. Desde HU-21, `dominado` lo pone la app al completar las 4 etapas; ya no se marca a mano. [PENDIENTE: agregar `etapas` a la regla y sus pruebas]

- `envios/{id}` (HU-12): `autorId`, `autorNombre` (nombre público, 1 a 40), `titulo` (máx. 80), `texto` (20 a 500), `concepto` (máx. 60), `definicion` (máx. 200), `area`, `dificultad`, `estado` («pendiente» al crear), `creado`, y `motivo` cuando el editor lo rechaza (lo escribe HU-13; HU-15 lo muestra). Solo el autor lo lee, con consultas filtradas por `autorId`. El cliente no lo cambia ni lo borra; aprobar o rechazar llega con HU-13.

Cualquier colección nueva (por ejemplo, `partidas`) necesita: regla nueva en `firestore.rules`, sus pruebas en `tests/reglas.test.js` y publicar las reglas.

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
  - Las historias HU-01 a HU-25 son SCRUM-5 a SCRUM-29 (HU-n = SCRUM-(n+4)). HU-21 a HU-25 se agregaron el 2 de noviembre por la retroalimentación de la Review y llevan la etiqueta `Review-Dra`.
  - Lo que no entra a la v1.0 lleva la etiqueta `Fuera-v1.0` (HU-16, HU-17, HU-19, HU-25).
  - Puntos en el campo «Story point estimate» (`customfield_10016`).
  - Etiquetas por historia: `HU-xx`, `Sprint-n` o `Reserva`, y `MoSCoW-…`.
  - Estados: Por hacer, En curso, En revisión, Finalizado.
  - Ids de Sprint en Jira: «Sprint 1 · Base» = 2, «Sprint 2 · Práctica» = 1. Cuál está activo se anota en `ESTADO.md`.
  - SCRUM-1 a SCRUM-4 son tareas de ejemplo de Jira, no historias.

## 6. Flujo de trabajo y Definition of Done

**Flujo:** una rama por historia (`HU-xx-nombre`, por ejemplo `HU-06-busqueda-filtros`), commits con el prefijo `HU-xx:`, y pull request hacia `main` con la plantilla. Al final se publica en staging y se pega el enlace en el pull request. La aprobación de otro desarrollador en GitHub ya no se exige: la Ing. Neira indicó el 30 de octubre de 2026 que basta con que los avances se vean en staging.

El canal de staging usa la misma base de datos y las mismas reglas que producción: una historia que agrega reglas no funciona en staging hasta que se publican (`npx firebase deploy --only firestore:rules`).

**Definition of Done** (8 puntos):
1. Cumple sus criterios de aceptación y el PO la validó.
2. Integrada a `main` por pull request. (La revisión de otro desarrollador ya no se exige desde el 30 de octubre de 2026.)
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

**HU-13 Validación del editor** (Must, 3 pts, Sprint 4)
Como editor de contenido de la editorial, necesito validar, aprobar o rechazar envíos, para que solo se publiquen conceptos correctos.
- Solo los usuarios con rol «moderador» acceden a la moderación; las reglas bloquean a los demás.
- El editor confirma que el concepto y la definición son correctos. Aprobar publica; rechazar exige un motivo.
- Ya no captura datos de juego: HU-14 los genera sola (replaneación del 2 de noviembre, 5 → 3 pts).

**HU-14 Juego «Completar la frase»** (Must, 5 pts, Sprint 3)
Como usuario, necesito jugar «Completar la frase» y ver la definición del concepto al responder, para aprender jugando.
- Cada partida tiene 5 preguntas tomadas de los trabalenguas aprobados.
- La palabra oculta se elige automáticamente (la más larga del texto, sin artículos ni preposiciones) y los 3 distractores salen de palabras de otros trabalenguas de la misma área. No se guardan datos de juego en Firestore.
- 4 opciones en orden aleatorio; al responder se indica si fue correcta y se muestra la definición.
- Al terminar se muestra el puntaje; acertar la pregunta de un trabalenguas completa su etapa «Completa» (HU-21).
- No depende de HU-13 (replaneación del 2 de noviembre, 8 → 5 pts).

**HU-15 Estado de mis envíos** (Should, 2 pts)
Como usuario, necesito ver el estado de mis envíos y el motivo si se rechazaron, para saber qué pasó con mis aportaciones.
- En «Mis envíos» se ve cada envío con su estado y, si fue rechazado, el motivo.

**HU-16 Estadísticas por área de AP** (Should, 5 pts, fuera de la v1.0)
Como usuario, necesito ver mis estadísticas (dominados, conceptos por área, aportaciones, racha y mejor puntaje), para saber qué áreas de AP me faltan.
- El perfil muestra dominados, conceptos dominados por área, aportaciones aprobadas, racha actual y máxima, y mejor puntaje.
- La racha sigue la regla del plan (sección 3.2). [COMPLETAR la regla exacta con el plan v3.0]

**HU-17 Niveles de proyecto** (Could, 3 pts, fuera de la v1.0)
Como usuario, necesito subir de nivel (Integrante → Líder de Sprint → Director de Proyecto), para sentirme motivado a seguir practicando.
- El nivel cambia al cruzar los umbrales de 5 y 15 dominados.
- La insignia «Autor» aparece con una aportación aprobada.

**HU-18 Privacidad y eliminar cuenta** (Must, 3 pts, Sprint 4)
Como usuario, necesito consultar el aviso de privacidad y eliminar mi cuenta, para controlar mis datos.
- El aviso de privacidad es accesible desde el pie de todas las páginas.
- Eliminar la cuenta pide confirmación y borra usuario, progreso y partidas. Sus aportaciones aprobadas quedan como «Anónimo».

**HU-19 Reto por equipos** (Could, 5 pts, fuera de la v1.0): criterios por definir en el refinamiento.
**HU-20 Integración nativa con la editorial** (Won't, 13 pts): queda para la v2.0.

### Ruta de aprendizaje (agregada el 2 de noviembre por la retroalimentación de la Review)

La Dra. Neira observó que todavía no se veía que el usuario *aprenda* los trabalenguas. Cada trabalenguas tiene ahora una ruta de 4 etapas: **1 Lee** (HU-23) → **2 Ordena** (HU-22) → **3 Completa** (HU-14) → **4 Dilo** (HU-24). Al completar las 4, queda dominado.

**HU-21 Ruta de aprendizaje y dominado por logro** (Must, 3 pts, Sprint 3)
Como usuario registrado, necesito ver una ruta de 4 etapas por trabalenguas, para saber qué me falta para aprendérmelo y ver mi avance.
- El detalle muestra la ruta y cuáles etapas están completas (ej. «2 de 4 ✔»).
- Cada juego, al superarse, guarda su etapa en `progreso.etapas`.
- Al completar las 4, `dominado` pasa a `true` automáticamente y se muestra un mensaje de logro.
- Se retira la casilla manual de «dominado» de HU-08.
- Un visitante ve la ruta, pero se le invita a iniciar sesión para guardar el avance.
- Las reglas aceptan `etapas` solo con esas 4 claves booleanas, con pruebas.

**HU-22 Juego «Arma el trabalenguas»** (Must, 3 pts, Sprint 3)
Como usuario, necesito acomodar en orden las palabras revueltas de un trabalenguas, para memorizar su orden.
- El texto se divide en fragmentos (palabras o grupos de 2 a 3 según la dificultad) que se muestran revueltos, nunca ya ordenados.
- Se tocan en orden para formar la frase y se puede deshacer el último.
- Al terminar se indica si es correcto; si no, se marcan los fragmentos fuera de lugar y se puede reintentar.
- Al acertar, se completa la etapa «Ordena».
- Funciona con teclado y en celular. Usa solo `texto`.

**HU-23 Karaoke de velocidad** (Must, 3 pts, Sprint 3)
Como usuario, necesito que las palabras se iluminen a un ritmo creciente mientras leo en voz alta, para practicar ritmo y dicción.
- Tres velocidades (lenta, normal, rápida) en palabras por minuto, definidas en una constante.
- Iniciar / Pausa / Reiniciar; la palabra actual se resalta y las anteriores se atenúan.
- Al terminar en «rápida», el usuario confirma «Lo leí completo» y se completa la etapa «Lee».
- Respeta `prefers-reduced-motion`. Usa solo `texto`.

**HU-24 Juego «Dilo en voz alta»** (Must, 8 pts, Sprint 4, riesgo alto)
Como usuario, necesito decir el trabalenguas de memoria con el micrófono y ver qué palabras dije bien, para comprobar que ya me lo sé.
- Usa la Web Speech API (`SpeechRecognition`, `es-MX`) si el navegador la soporta (Chrome, Edge).
- El texto está oculto mientras se habla; al terminar se muestran en verde las palabras reconocidas y en gris las faltantes (sin acentos ni mayúsculas).
- Se supera con 80 % o más de palabras reconocidas y se completa la etapa «Dilo».
- Sin soporte o sin permiso de micrófono: autoevaluación («¿Lo dijiste completo? Sí / No»).
- El permiso se pide solo al pulsar «Empezar»; no se graba ni se guarda audio.
- Hacer una prueba técnica (spike) al inicio del Sprint 4.

**HU-25 Memorama de conceptos** (Could, 3 pts, fuera de la v1.0)
Como usuario, necesito emparejar conceptos de AP con sus definiciones, para reforzar los conceptos.
- 6 pares al azar de los trabalenguas aprobados, filtrables por área; al terminar, intentos y tiempo.

## 9. Cómo debe trabajar Claude aquí

- Antes de programar una historia, lee `ESTADO.md`, confirma en qué Sprint está y que exista su rama. No adelantes historias sin acuerdo del PO.
- Si la historia tiene una decisión de diseño pendiente en `ESTADO.md` (sección 4), plantéala al usuario antes de programar.
- No hagas push directo a `main`, no integres pull requests y no publiques en producción sin que el usuario lo pida explícitamente.
- Toda regla nueva lleva su prueba en `tests/reglas.test.js`.
- Al terminar, reporta qué criterios de aceptación cumpliste, cuáles de la DoD faltan y qué hay que actualizar en Jira, y actualiza `ESTADO.md`.
- Marca con `[SUPUESTO]` o `[COMPLETAR]` lo que no esté definido; no lo inventes.
