# Despliegue en Vercel + Neon · Plan de implementación

> **Para agentes:** usar superpowers:executing-plans (ejecución directa, según CLAUDE.md). Pasos con casillas `- [ ]`.

**Objetivo:** dejar la app en un link fijo de `*.vercel.app`, con la base en Neon, sin depender del PC.

**Arquitectura:** SQLite se reemplaza por Postgres (Neon en producción, PGlite en desarrollo y pruebas), la capa de datos de la API pasa a `async`, y Vercel sirve la web estática más una función que reenvía `/api` a Fastify.

**Stack:** Drizzle (`pg-core`, `node-postgres`, `pglite`), `pg`, `@electric-sql/pglite`, Vercel (función Node + rewrites), Neon Free.

**Spec:** [docs/superpowers/specs/2026-11-11-despliegue-vercel-neon-design.md](../superpowers/specs/2026-11-11-despliegue-vercel-neon-design.md)

**Sesiones:** 1 = Tasks 1–4 (base y API asíncrona, suite en verde) · 2 = Tasks 5–7 (fecha, acceso, Vercel y publicación).

## Restricciones globales

- El contrato HTTP de la API no cambia: mismas rutas, códigos de error y formas JSON (las pruebas web no se tocan).
- Fechas y marcas siguen como texto ISO (`'YYYY-MM-DD'` y `toISOString()`).
- Nada de SQLite en el código final: se quitan `better-sqlite3` y `@types/better-sqlite3`.
- `@electric-sql/pglite` solo se importa con `import()` dinámico, para que no entre en la función de Vercel.
- Mensajes y nombres en español, como el resto del código.
- No hacer push: el usuario lo hace desde GitHub Desktop. El primer despliegue lo conecta el usuario en Vercel.

## Foco de revisión

1. Dos guardados del cronograma a la vez con la misma `version`: uno gana y el otro recibe 409 `cronograma_desactualizado` (antes lo garantizaba SQLite síncrono). Prueba en Task 4.
2. Registro con correo repetido en carrera: debe dar 409 `registro_rechazado`, no 500 (Drizzle envuelve el error de Postgres en `cause`). Prueba en Task 2.
3. Un corte con fecha de hoy registrado a las 8 p. m. de Bogotá (01:00 UTC del día siguiente) no puede dar `fecha_futura`, y uno de mañana sí. Prueba en Task 5.
4. Arranque en frío de la función: la primera petición espera a que Fastify esté listo y las siguientes reutilizan la misma app y el mismo pool. Prueba en Task 6.
5. Recargar una ruta profunda (`/charters/<id>?corte=…`) en Vercel debe servir la SPA, no un 404; y `/api/<ruta inexistente>` debe devolver el 404 JSON de la API, no `index.html`. Verificación en Task 7.

---

**Antes de empezar:** exportar el JSON de RF1 desde la app actual (menú Exportar) y guardarlo fuera del repo, por si se quiere recargar en Neon (Task 7, paso 6). Después de la Task 1, la base SQLite deja de leerse.

### Task 1: Esquema Postgres y conexión

**Archivos:**
- Modificar: `apps/api/src/db/esquema.ts`, `apps/api/src/db/conexion.ts`, `apps/api/src/db/semilla.ts`, `apps/api/drizzle.config.ts`, `apps/api/package.json`, `apps/api/src/config.ts`, `.env.ejemplo`, `.gitignore`
- Borrar: `apps/api/drizzle/*` (SQL y `meta/`) → generar `apps/api/drizzle/0000_inicial.sql` nuevo
- Crear: `apps/api/src/db/errores.ts`
- Pruebas: `apps/api/test/db.test.ts`, `apps/api/test/config.test.ts`

**Interfaces:**
- Produce:
  - `type BaseDatos = PgDatabase<PgQueryResultHKT, typeof esquema>` (de `drizzle-orm/pg-core`).
  - `abrirDb(destino: string): Promise<BaseDatos>` — si `destino` empieza con `postgres://` o `postgresql://`, `Pool` de `pg` (`max: 3`) + `drizzle-orm/node-postgres`; si es `':memory:'`, PGlite en memoria; si no, PGlite en esa carpeta (crea la carpeta). No migra.
  - `prepararDb(db: BaseDatos): Promise<void>` — aplica migraciones con el migrador del driver que la abrió (`drizzle-orm/pglite/migrator` o `drizzle-orm/node-postgres/migrator`; guardar el tipo en un `WeakMap<BaseDatos, 'pg' | 'pglite'>`) y llama a `sembrar`.
  - `crearDb(destino: string): Promise<BaseDatos>` = `abrirDb` + `prepararDb` (desarrollo, CLI y pruebas).
  - `sembrar(db): Promise<void>`.
  - `esViolacionUnica(error: unknown): boolean` en `db/errores.ts` — `true` si `error.code === '23505'` o `error.cause?.code === '23505'`.
  - `Config.urlDb: string` reemplaza a `rutaDb`: `entorno.DATABASE_URL ?? '../../data/pglite'`. Se quita `RUTA_DB`.

- [ ] **Paso 1: Dependencias.** `npm i -w apps/api pg @electric-sql/pglite` (PGlite como dependencia normal: la usan el servidor de desarrollo y el CLI) y `npm i -D -w apps/api @types/pg`; `npm rm -w apps/api better-sqlite3 @types/better-sqlite3`.
- [ ] **Paso 2: Reescribir `db.test.ts`** para Postgres:
  - `crearDb(':memory:')` crea las 15 tablas: consulta `information_schema.tables where table_schema = 'public' and table_name not like '__drizzle%'`, mismo listado que hoy.
  - Las claves foráneas se cumplen: insertar un `charter` con `propietarioId` inexistente rechaza.
  - `sembrar` dos veces deja 3 categorías.
  - `esViolacionUnica` es `true` al insertar dos `usuario` con el mismo correo (error real de PGlite atrapado) y `false` para `new Error('x')`.
  - Se eliminan las pruebas de `pragma` y `sqlite_master`. El resto de casos de `db.test.ts` se convierten a `await`.
- [ ] **Paso 3: `config.test.ts`**: `leerConfig({}).urlDb === '../../data/pglite'` y `leerConfig({ DATABASE_URL: 'postgresql://x' }).urlDb === 'postgresql://x'`. Correr y ver que fallan.
- [ ] **Paso 4: Esquema.** Cambiar a `pgTable`, `AnyPgColumn`, `boolean(nombre)` en `booleano`, `doublePrecision` donde hoy hay `real`; `text`, `integer`, `index`, `uniqueIndex` y `primaryKey` desde `drizzle-orm/pg-core`. Ni nombres de tabla ni de columna cambian.
- [ ] **Paso 5: Migración.** `drizzle.config.ts` con `dialect: 'postgresql'`. Borrar `apps/api/drizzle/`, correr `npx drizzle-kit generate --name inicial` en `apps/api` y revisar el SQL (15 tablas, claves foráneas con `cascade`/`restrict`/`set null` iguales a las de hoy, índice único de `corte`).
- [ ] **Paso 6: `conexion.ts`, `semilla.ts`, `errores.ts` y `config.ts`** con las firmas de arriba. `.env.ejemplo`: `DATABASE_URL=` comentado con un ejemplo de Neon y la nota «vacío = PGlite en data/pglite». `.gitignore`: `data/pglite/`.
- [ ] **Paso 7:** `npx vitest run test/db.test.ts test/config.test.ts` en `apps/api` → PASA. (El resto de la suite falla hasta la Task 4; es esperado.)
- [ ] **Paso 8: Commit** «Cambia la base a Postgres (Neon y PGlite)».

### Task 2: Autenticación, sesiones y CLI asíncronos

**Archivos:**
- Modificar: `apps/api/src/auth/{cuentas,sesiones,guardas,rutas}.ts`, `apps/api/src/cli/admin.ts`, `apps/api/src/servidor.ts`, `apps/api/src/app.ts`, `apps/api/test/ayudas.ts`
- Pruebas: `apps/api/test/{auth,cli,humo}.test.ts`

**Interfaces:**
- Consume: `crearDb`, `BaseDatos`, `esViolacionUnica` (Task 1).
- Produce:
  - `construirApp({ db, config })`: `db` pasa a ser **obligatorio** (ya no crea una base en memoria; `crearDb` es asíncrono).
  - `nuevaApp()` en `test/ayudas.ts` usa `await crearDb(':memory:')`. Para que la suite no se alargue, una plantilla migrada por archivo de prueba y `PGlite.clone()` por caso: `crearDbPrueba(): Promise<BaseDatos>` en `ayudas.ts`.
  - Todas las funciones de `cuentas.ts` y `sesiones.ts` que tocan la base devuelven `Promise`. `promoverAdmin` sigue lanzando `Error('usuario_inexistente')`, ahora detectado con `.returning({ id })` vacío en vez de `changes`.

- [ ] **Paso 1: Prueba nueva en `auth.test.ts`:** «registro concurrente con el mismo correo da un 201 y un 409» — `Promise.all` de dos `registrar(app)` con los mismos datos; se espera `[201, 409]` en cualquier orden y `codigo === 'registro_rechazado'` en el 409. Correr: falla (hoy no compila).
- [ ] **Paso 2:** Convertir `ayudas.ts` (`crearDbPrueba`, `nuevaApp`, `sesionDe` con `await …update(…)`), `app.ts`, `servidor.ts` (`await crearDb(resolve(config.urlDb))` salvo que sea URL de Postgres, que va sin `resolve`) y `cli/admin.ts`.
- [ ] **Paso 3:** Convertir `cuentas.ts`, `sesiones.ts`, `guardas.ts` y `rutas.ts` a `await`. En el registro, `catch` con `esViolacionUnica(error)` en vez de `String(error).includes('UNIQUE')`.
- [ ] **Paso 4:** Adaptar `auth.test.ts`, `cli.test.ts` y `humo.test.ts` (lecturas directas a la base con `await`). `npx vitest run test/auth.test.ts test/cli.test.ts test/humo.test.ts test/db.test.ts` → PASA.
- [ ] **Paso 5: Commit** «Vuelve asíncrona la autenticación».

### Task 3: Charters, catálogos y parámetros asíncronos

**Archivos:**
- Modificar: `apps/api/src/modulos/charters/{acceso,servicio,rutas,exportar}.ts`, `apps/api/src/modulos/catalogos/*`, `apps/api/src/modulos/admin/{parametros,rutas}.ts`
- Pruebas: `apps/api/test/{charters,listas,aislamiento,parametros,exportar}.test.ts`

**Interfaces:**
- Consume: `BaseDatos` (Task 1), sesiones asíncronas (Task 2).
- Produce: `acceso.ts` y `servicio.ts` con las mismas funciones y parámetros que hoy, devolviendo `Promise<…>`. `reglasDeCharter` y `columnasDeReglas` siguen **síncronas** (no tocan la base). Las transacciones usan `db.transaction(async (tx) => …)`.

- [ ] **Paso 1:** Convertir `acceso.ts` primero (lo usan todas las rutas), luego `servicio.ts`, catálogos y parámetros. `onConflictDoUpdate` de `parametros` se mantiene.
- [ ] **Paso 2:** Convertir las lecturas directas a la base en las pruebas de esta lista. `npx vitest run test/charters.test.ts test/listas.test.ts test/aislamiento.test.ts test/parametros.test.ts` → PASA (`exportar.test.ts` puede depender de cortes: queda para la Task 4).
- [ ] **Paso 3: Commit** «Vuelve asíncronos charters, catálogos y parámetros».

### Task 4: Cronograma y cortes asíncronos

**Archivos:**
- Modificar: `apps/api/src/modulos/cronograma/{servicio,rutas}.ts`, `apps/api/src/modulos/cortes/{servicio,rutas}.ts`
- Pruebas: `apps/api/test/{cronograma,cortes,exportar}.test.ts`

**Interfaces:**
- Consume: Tasks 1–3.
- Produce: `guardarCronograma(db, fila, entrada): Promise<CronogramaRespuesta>`. La versión se valida **dentro** de la transacción: el `update(charter)` lleva `where(and(eq(charter.id, fila.id), eq(charter.cronogramaVersion, entrada.version)))` con `.returning()`; si no devuelve fila, lanza el mismo 409 `cronograma_desactualizado` (la transacción se revierte). Se conserva el chequeo previo contra `fila.cronogramaVersion` para el caso normal. El borrado de corte usa `.returning({ id })` en vez de `changes`.

- [ ] **Paso 1: Prueba nueva en `cronograma.test.ts`:** «dos guardados simultáneos con la misma versión: uno 200 y otro 409» — dos `PUT` con `version: 0` y árboles distintos en `Promise.all`; se espera `[200, 409]` en cualquier orden, y un `GET` posterior trae `version: 1` y el árbol del que ganó.
- [ ] **Paso 2:** Correr: falla.
- [ ] **Paso 3:** Convertir `cronograma` y `cortes` a `await`, con la versión dentro de la transacción como arriba.
- [ ] **Paso 4: Suite completa** (`npm test` en la raíz), `npm run lint` y `npm run build` → todo en verde. Las 396 pruebas previas siguen pasando más las nuevas.
- [ ] **Paso 5:** `npm run dev`, registrar una cuenta, crear un charter, cronograma y un corte en el navegador; revisar que `data/pglite` se creó. Matar todo el árbol de procesos al terminar (ver CLAUDE.md).
- [ ] **Paso 6: Commit** «Vuelve asíncronos cronograma y cortes, con versión dentro de la transacción».

### Task 5: Fecha de Bogotá y correos permitidos

**Archivos:**
- Modificar: `apps/api/src/util/hoy.ts`, `apps/api/src/config.ts`, `apps/api/src/auth/rutas.ts`, `.env.ejemplo`
- Pruebas: `apps/api/test/hoy.test.ts` (crear o reemplazar la prueba de zona horaria actual), `apps/api/test/auth.test.ts`, `apps/api/test/config.test.ts`

**Interfaces:**
- Produce:
  - `hoyISO(ahora = new Date()): FechaISO` — fecha en `America/Bogota`, con `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' })` (da `YYYY-MM-DD`), sin depender de `TZ`.
  - `Config.correosPermitidos: string[]` — de `CORREOS_PERMITIDOS`, separados por coma, recortados y en minúscula; `[]` si no está.
  - Registro: si `correosPermitidos.length > 0` y el correo (en minúscula) no está, `ErrorApi(403, 'correo_no_permitido', 'Este correo no tiene acceso. Pide que lo agreguen.', { correo: 'Este correo no tiene acceso. Pide que lo agreguen.' })`, después de validar el dominio.

- [ ] **Paso 1: Pruebas:**
  - `hoyISO(new Date('2026-11-12T01:00:00Z')) === '2026-11-11'` (8 p. m. en Bogotá) y `hoyISO(new Date('2026-11-12T05:00:00Z')) === '2026-11-12'`. Así la prueba ya no depende de `TZ` (cierra el pendiente de la Fase 2).
  - `cortes.test.ts`: con `vi.setSystemTime(new Date('2026-11-12T01:00:00Z'))`, un corte del `2026-11-11` se acepta y uno del `2026-11-12` da 400 `fecha_futura`.
  - `config.test.ts`: `CORREOS_PERMITIDOS=' Ana@hlingenieros.com, b@hlingenieros.com '` → `['ana@hlingenieros.com', 'b@hlingenieros.com']`.
  - `auth.test.ts`: con la lista definida, un correo fuera de ella da 403 `correo_no_permitido` y uno de la lista da 201; sin lista, cualquiera del dominio da 201.
- [ ] **Paso 2:** Correr: fallan.
- [ ] **Paso 3:** Implementar. `.env.ejemplo`: `CORREOS_PERMITIDOS=` con comentario «vacío = cualquiera del dominio».
- [ ] **Paso 4:** Las pruebas anteriores → PASAN.
- [ ] **Paso 5: Commit** «Usa la fecha de Bogotá y permite limitar los correos del registro».

### Task 6: Adaptador para Vercel

**Archivos:**
- Crear: `apps/api/src/vercel.ts`, `apps/api/src/cli/migrar.ts`, `api/index.js` (raíz), `vercel.json` (raíz)
- Modificar: `apps/api/tsup.config.ts`, `apps/api/package.json`, `package.json` (raíz)
- Prueba: `apps/api/test/vercel.test.ts`

**Interfaces:**
- Consume: `abrirDb`, `prepararDb` (Task 1), `construirApp` (Task 2), `leerConfig`.
- Produce:
  - `crearManejador(iniciar: () => Promise<FastifyInstance>): (req: IncomingMessage, res: ServerResponse) => Promise<void>` en `vercel.ts`: guarda la promesa de `iniciar()` la primera vez (`??=`), espera `app.ready()` y hace `app.server.emit('request', req, res)`.
  - `export default crearManejador(async () => construirApp({ config: leerConfig(), db: await abrirDb(leerConfig().urlDb) }))` en el mismo archivo (sin migrar: eso lo hace el build).
  - `cli/migrar.ts`: `cargarEntorno`, `await prepararDb(await abrirDb(urlDb))`, imprime «Base lista» y cierra.
  - Scripts: `apps/api` → `"migrar": "tsx src/cli/migrar.ts"`; raíz → `"migrar": "npm run migrar -w apps/api"` y `"build:vercel": "npm run migrar && npm run build"`.
  - `tsup.config.ts`: `entry: ['src/servidor.ts', 'src/vercel.ts']`, `external: ['@electric-sql/pglite']`.
  - `api/index.js`: `export { default } from '../apps/api/dist/vercel.js'`.
  - `vercel.json`:
    ```json
    {
      "framework": null,
      "installCommand": "npm ci",
      "buildCommand": "npm run build:vercel",
      "outputDirectory": "apps/web/dist",
      "regions": ["iad1"],
      "rewrites": [
        { "source": "/api/(.*)", "destination": "/api" },
        { "source": "/((?!api/).*)", "destination": "/index.html" }
      ]
    }
    ```

- [ ] **Paso 1: Prueba `vercel.test.ts`:** con `crearManejador` sobre una app de `nuevaApp()` montada en `http.createServer(manejador)` en un puerto libre:
  - `GET /api/salud` → 200 `{ ok: true }`.
  - Dos peticiones seguidas llaman a `iniciar` una sola vez (contador en el `iniciar` falso).
  - Dos peticiones simultáneas en frío (`Promise.all`) también llaman a `iniciar` una sola vez.
- [ ] **Paso 2:** Correr: falla. Implementar. Correr: PASA.
- [ ] **Paso 3:** `npm run build` en la raíz deja `apps/api/dist/vercel.js` sin PGlite dentro (`grep -c pglite apps/api/dist/vercel.js` → 0, salvo el `import()` externo).
- [ ] **Paso 4: Commit** «Agrega el adaptador y la configuración de Vercel».

### Task 7: Publicación (con el usuario)

**Archivos:**
- Modificar: `docs/arquitectura.md` (§10 Despliegue y §3 Stack), `README.md` (cómo correr y desplegar), `CLAUDE.md`, `PENDIENTES.md`

Pasos que hace el **usuario** en el navegador; Claude guía y verifica:

- [ ] **Paso 1 · Neon:** crear el proyecto (región AWS `us-east-1`) y copiar la cadena de conexión **pooled** (`…-pooler…`, con `sslmode=require`).
- [ ] **Paso 2 · Push** del usuario desde GitHub Desktop.
- [ ] **Paso 3 · Vercel:** «Add New Project» → importar `HLIngenieros/Project-charter-Motor-Tecnologico`, raíz del repo, sin cambiar los comandos (los toma de `vercel.json`). Variables: `DATABASE_URL`, `COOKIE_SEGURA=true`, `CONFIAR_PROXY=true`, `DOMINIO_PERMITIDO=hlingenieros.com`, `CORREOS_PERMITIDOS=<tu correo>`. Desplegar.
- [ ] **Paso 4 · Verificar** en el link:
  - `/api/salud` → `{"ok":true}`.
  - `/api/no-existe` → 404 JSON de la API (no `index.html`).
  - Registrarse, crear un charter, cronograma y un corte, recargar con F5 en `/charters/<id>?corte=…` (sirve la SPA), cerrar sesión y volver a entrar.
  - Exportar PDF y JSON.
  - La cookie `charter_sesion` lleva `Secure`.
- [ ] **Paso 5 · Admin:** desde el PC, `DATABASE_URL=<neon> npm run admin -- --promover <correo>`.
- [ ] **Paso 6 (opcional, si el usuario lo pide) · RF1:** script temporal con `tsx` que lea el JSON exportado del charter local y llame a `editarCharter`, `reemplazarLista` y `guardarCronograma` contra Neon; borrarlo al terminar.
- [ ] **Paso 7 · Documentación y cierre:** §10 de `docs/arquitectura.md` (local con PGlite; producción en Vercel + Neon; variables; migrar en el build; respaldo = historial de Neon), README, CLAUDE.md (decisión y comandos) y PENDIENTES.md (T8.5 parcial y la prueba de zona horaria hecha). Commit «Publica la app en Vercel con Neon».

**Si la función no arranca en Vercel** (p. ej., no encuentra `apps/api/dist/vercel.js` porque las funciones se empaquetan antes del build): pasar al soporte de Fastify sin configuración de Vercel (entrada en `apps/api/src/index.ts`) o empaquetar con `includeFiles` en `vercel.json`. Revisar los registros de la función en el panel de Vercel antes de cambiar nada.
