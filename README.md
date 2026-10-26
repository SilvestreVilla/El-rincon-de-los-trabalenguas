# El Rincón de los Trabalenguas

Aprende a administrar proyectos trabalenguando. Plataforma web en la que los equipos practican trabalenguas construidos sobre conceptos de administración de proyectos (Scrum, planeación, riesgos, calidad y liderazgo).

Proyecto Scrum del **Equipo 2**, Administración de Proyectos de Software, FIME-UANL.

## Estado: Sprint 1 · Base

**Sprint Goal:** un integrante de equipo puede registrarse y explorar el catálogo semilla de conceptos de AP.

| Historia | Qué hace | Página |
|---|---|---|
| HU-01 Registro (3 pts) | Crea la cuenta y el documento `usuarios/{uid}` con rol «usuario»; pide aviso de privacidad y mayoría de edad | `registro.html` |
| HU-02 Iniciar y cerrar sesión (2 pts) | Error genérico con credenciales incorrectas; la sesión persiste al recargar | `login.html`, `perfil.html` |
| HU-03 Recuperar contraseña (1 pt) | Envía el enlace; el mensaje es el mismo exista o no la cuenta | `recuperar.html` |
| HU-04 Catálogo (5 pts) | Solo trabalenguas aprobados, con título, concepto, área y dificultad; estados de carga, vacío y error | `index.html` |
| HU-05 Detalle (3 pts) | Texto, concepto, definición, área, dificultad y autor; «Trabalenguas no encontrado» si no existe o no está aprobado | `trabalenguas.html?id=…` |

## Tecnología

- HTML, CSS y JavaScript sin frameworks ni compilación (módulos ES).
- Firebase: Authentication (correo y contraseña), Firestore y Hosting. SDK web 10.14.1 desde el CDN de Google.
- Reglas de seguridad en `firestore.rules`, con pruebas en `tests/`.

```
public/            sitio que se publica en Firebase Hosting
  js/firebase-config.js   ← aquí van los datos de su proyecto
  js/firebase.js          inicializa Firebase y usa los emuladores en localhost
  js/ui.js                navegación según la sesión y utilidades
data/trabalenguas.json    catálogo semilla (30 trabalenguas, 6 por área)
scripts/seed.js           carga la semilla en Firestore
firestore.rules           reglas de seguridad
tests/reglas.test.js      pruebas de las reglas (emulador)
```

## Correr en local (emuladores)

Requisitos: Node 18 o más y Java 11 o más (lo pide el emulador de Firestore).

```bash
npm install
npm run emuladores          # Auth :9099, Firestore :8080, Hosting :5000, UI :4000
# en otra terminal:
npm run seed:emulador       # carga los 30 trabalenguas
```

Abre http://localhost:5000. En `localhost` la app se conecta sola a los emuladores, así que no necesita un proyecto real. Los correos de recuperación no se envían: el enlace aparece en la UI de emuladores (http://localhost:4000/auth).

## Pruebas de las reglas

```bash
npm run test:reglas
```

Levanta el emulador de Firestore, corre las 16 pruebas de `tests/reglas.test.js` y lo apaga. La Definition of Done exige que pasen al 100 % antes de aprobar un pull request que toque las reglas.

## Conectar el proyecto real de Firebase

1. En [Firebase Console](https://console.firebase.google.com) crea el proyecto (plan Spark, gratis).
2. **Authentication → Método de acceso:** habilita *Correo electrónico/contraseña*. En **Configuración → Políticas de contraseña** pon mínimo 8 caracteres y deja activa la **protección contra la enumeración de correos**.
3. **Authentication → Plantillas:** cambia el idioma de las plantillas de correo a español.
4. **Firestore Database:** créala en modo producción (región `nam5` o la más cercana).
5. **Configuración del proyecto → Tus apps:** registra una app web y copia el objeto `firebaseConfig` en `public/js/firebase-config.js`.
6. En `.firebaserc` va el ID real del proyecto.

> Ya hecho para el proyecto `rincon-de-los-trabalenguas` (región `nam5`, plan Spark). Los emuladores siguen usando el proyecto `demo-rincon-trabalenguas`, así que las pruebas locales nunca tocan producción.

7. Despliega:

```bash
npx firebase login
npm run deploy:staging      # canal de vista previa (DoD: desplegado en staging)
npm run deploy              # producción: hosting + reglas + índices
```

8. Carga la semilla en producción con una cuenta de servicio (Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada). **Nunca subas ese archivo al repositorio** (`.gitignore` ya lo excluye):

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run seed
```

## Pendientes antes de cerrar el Sprint

- [ ] El editor de contenido de la editorial valida los 30 conceptos y definiciones de `data/trabalenguas.json` (DoD punto 8).
- [ ] Texto definitivo del aviso de privacidad (`public/privacidad.html` tiene un borrador marcado con [COMPLETAR]).
- [ ] Prueba de Lighthouse en staging con red 4G simulada: LCP menor a 3 s (T1-19, RNF-02).
- [ ] Matriz de navegadores: Chrome, Firefox, Edge y Safari, escritorio y celular (T1-22).

## Flujo de trabajo

- `main` está protegida: todo entra por pull request revisado por otro desarrollador.
- Una rama por historia o tarea: `hu-04-catalogo`, `t1-03-reglas`…
- La plantilla del pull request trae la checklist de la Definition of Done.
