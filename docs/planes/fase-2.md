# Fase 2 · Cimientos — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Monorepo funcionando con el motor de cálculo validado contra el Excel, la base de datos, la autenticación por dominio, el aislamiento por dueño, el sistema de diseño y las pantallas de acceso.

**Architecture:** Monorepo con npm workspaces: `packages/shared` (motor de cálculo puro y esquemas Zod), `apps/api` (Fastify + Drizzle + SQLite) y `apps/web` (React + Vite + Tailwind). La web y la API comparten origen: en desarrollo, Vite hace de proxy para `/api`.

**Tech Stack:** TypeScript 5.9 (estricto), Node 24, React 19, Vite 7, React Router 7, TanStack Query 5, Tailwind CSS 4, Motion 12, Fastify 5, Drizzle ORM + drizzle-kit, better-sqlite3, @node-rs/argon2, Zod 4, uuid (v7), Vitest 3, Testing Library, Python 3.13 + openpyxl (solo el script del fixture).

**Spec:** [docs/arquitectura.md](../arquitectura.md) · Cálculos: [docs/analisis-plantilla-excel.md §4](../analisis-plantilla-excel.md#4-cálculos-de-la-plataforma) · Plan maestro: [docs/plan-implementacion.md](../plan-implementacion.md)

## Global Constraints

- Sistema independiente: nada de HorasHombre (ni código, ni base, ni sesión).
- Nombres de código, mensajes y textos de la interfaz en **español**. Los mensajes de error van en español y se dirigen al usuario de tú.
- Fechas de negocio: texto `YYYY-MM-DD`. Nunca restar `Date` locales; usar `aDia`/`aISO` (Task 3).
- Porcentajes y pesos como fracción 0–1. Montos `INTEGER` COP.
- IDs: UUID v7 (`v7()` del paquete `uuid`).
- Dominio permitido por defecto: `hlingenieros.com` (variable de entorno `DOMINIO_PERMITIDO`).
- Clave: mínimo 8 caracteres (antes 10; cambiado por el usuario el 2026-11-09), hash con argon2id.
- Sesión: cookie `charter_sesion`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` si `COOKIE_SEGURA=true`. Dura 7 días y se renueva con el uso. En la base se guarda el SHA-256 del token.
- Mutaciones (`POST`, `PUT`, `PATCH`, `DELETE`) exigen la cabecera `X-Requested-With: charter`; si falta, responden 403 `csrf`.
- Errores: `{ error: { codigo, mensaje, campos? } }`.
- Puertos: API 3100, web 5173. Base: `data/charters.db` (ignorada por git).
- Commits en español, en imperativo y breves, con la línea `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **No hacer push.**

## Review Focus

1. **Correos con mayúsculas o espacios** (`" JUrbina@HLIngenieros.com "`): se normalizan y se aceptan. Los dominios parecidos (`x@hlingenieros.com.co`, `x@malhlingenieros.com`, `x@sub.hlingenieros.com`) se rechazan. → Task 8.
2. **Fechas con la zona horaria del servidor** distinta a la de Colombia, y años bisiestos: un día nunca debe correrse. → Task 3.
3. **Cronogramas degenerados** (todas las hojas sin programar, peso 0, una sola hoja de un día): no deben producir `NaN` ni `Infinity`. → Task 4.
4. **Cookie vieja** de una sesión expirada, cerrada o de una cuenta desactivada: responde 401 y la cookie se limpia. → Task 8.
5. **Acceso a un id ajeno:** un usuario que adivina el id de otro charter recibe 404 (nunca 403 ni los datos); un Admin que intenta escribir recibe 403 `solo_lectura`. → Task 9.

---

### Task 1: Monorepo

**Files:**
- Create: `package.json` (raíz, `"private": true`, `"workspaces": ["apps/*", "packages/*"]`), `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.gitignore` (añadir `node_modules`, `dist`, `data/*.db*`, `.env`), `.env.ejemplo`
- Create: `packages/shared/{package.json,tsconfig.json,src/index.ts,test/humo.test.ts}`
- Create: `apps/api/{package.json,tsconfig.json,src/servidor.ts,src/app.ts,src/config.ts,test/humo.test.ts}`
- Create: `apps/web/{package.json,tsconfig.json,vite.config.ts,index.html,src/main.tsx,src/app/App.tsx,test/humo.test.tsx}`

**Interfaces:**
- Produces: paquetes `@charter/shared` (con `exports` hacia `./src/index.ts`; se consume como fuente TS), `@charter/api` y `@charter/web`. Scripts en la raíz: `dev` (API con `tsx watch` y web con Vite en paralelo, usando `concurrently`), `test` (Vitest en los tres), `build`, `lint`, `admin` (Task 8).
- Produces: `construirApp(opciones: { db?: BaseDatos; config: Config }): Promise<FastifyInstance>` en `apps/api/src/app.ts`, con todas las rutas bajo el prefijo `/api`. `GET /api/salud` → `{ ok: true }`.
- Produces: `Config` en `apps/api/src/config.ts`: `{ puerto: number; rutaDb: string; dominioPermitido: string; cookieSegura: boolean }`, leída de `PUERTO`, `RUTA_DB`, `DOMINIO_PERMITIDO` y `COOKIE_SEGURA` con valores por defecto `3100`, `../../data/charters.db`, `hlingenieros.com` y `false`.
- La API se compila con `tsup` empaquetando `@charter/shared` (`noExternal`). Vite hace proxy de `/api` a `http://localhost:3100`.

- [ ] **Step 1:** Verificar que `npm install better-sqlite3 @node-rs/argon2` instala binarios precompilados en Node 24 / Windows (sin node-gyp). Si falla, detenerse y reportar antes de seguir.
- [ ] **Step 2:** Escribir las pruebas de humo: `humo.test.ts` en shared (`expect(VERSION).toBe('0.1.0')`, exportado por `src/index.ts`); en api, `GET /api/salud` con `app.inject` → 200 `{ ok: true }`; en web, `render(<App />)` muestra el texto "Project Charters".
- [ ] **Step 3:** Correr `npm test` → FALLA (no hay implementación).
- [ ] **Step 4:** Implementar el esqueleto mínimo para que pasen.
- [ ] **Step 5:** Correr `npm test`, `npm run lint` y `npm run build` → todo en verde. `npm run dev` levanta los dos servidores, y `http://localhost:5173/api/salud` responde `{"ok":true}` a través del proxy.
- [ ] **Step 6:** Commit `Crea el monorepo con shared, api y web`.

---

### Task 2: Fixture del Excel

**Files:**
- Create: `scripts/extraer_fixture.py`
- Create (generado y versionado): `packages/shared/test/fixtures/id-ti.json`

**Interfaces:**
- Produces: el JSON
  ```ts
  {
    corte: '2025-03-13',
    filas: Array<{
      fila: number            // fila del Excel (20–185)
      item: string            // texto de la columna A, solo informativo
      nombre: string          // B
      entregable: string | null   // F
      peso: number | null     // G solo si es valor (hoja); null en agrupadoras
      inicio: string | null; fin: string | null   // H, I como 'YYYY-MM-DD'
      responsables: string[]  // J separado por '-' y recortado
      padreFila: number | null    // null = primer nivel (hijo de la fila 19)
      esperado: { K: number | null; L: number | null }  // valores cacheados del Excel
    }>
  }
  ```

**Regla de jerarquía (verificada el 2026-11-09):** una fila es agrupadora si su celda G contiene una fórmula. Sus hijas son las filas referenciadas en esa fórmula: `G27`, `+G22+G23`, `SUM(G27:G45)`; los rangos se expanden. Las filas sin padre por fórmula (169–174, hijas de `2.2`, que no tiene fórmula ni fechas) toman como padre la fila anterior más cercana con `outline_level` menor. **El esquema (`outline_level`) no sirve como regla general:** está roto en 1.3.1 y 1.3.2. La fila 19 es la raíz implícita y no se exporta.

- [ ] **Step 1:** Escribir el script con dos lecturas del libro (`data_only=False` para fórmulas y `data_only=True` para valores) y la regla de arriba. Validar con `assert`: 166 filas, 22 agrupadoras (incluida `2.2`), 144 hojas (138 con peso y fechas + 6 sin programar bajo `2.2`), suma de pesos de las hojas con fechas = 1,0 (±1e-9), ninguna fila con dos padres.
- [ ] **Step 2:** Correr `python -I scripts/extraer_fixture.py "docs/referencias/Project Charter TI 2025 Rev.B.xlsx" packages/shared/test/fixtures/id-ti.json` → sale sin errores e imprime `166 filas, 22 agrupadoras, 144 hojas, Σpeso=1.0`.
- [ ] **Step 3:** Commit `Extrae el cronograma del Excel como fixture de pruebas`.

---

### Task 3: Fechas y árbol

**Files:**
- Create: `packages/shared/src/calculo/tipos.ts`, `fechas.ts`, `arbol.ts`, `index.ts`
- Test: `packages/shared/test/calculo/fechas.test.ts`, `arbol.test.ts`, `test/calculo/fixture.ts` (helper que carga `id-ti.json` y lo convierte a `ActividadEntrada[]` con `id = 'f' + fila`)

**Interfaces:**
- Produces (`tipos.ts`):
  ```ts
  type FechaISO = string                       // 'YYYY-MM-DD'
  interface ActividadEntrada {
    id: string; padreId: string | null; orden: number; nombre: string
    entregable?: string | null; peso?: number | null
    inicio?: FechaISO | null; fin?: FechaISO | null; responsables?: string[]
  }
  interface NodoArbol extends ActividadEntrada {
    item: string            // '1', '1.2', '1.2.3'
    nivel: number           // 1 = primer nivel
    esHoja: boolean
    hijos: NodoArbol[]
  }
  ```
- Produces (`fechas.ts`): `aDia(f: FechaISO): number` (días desde 1970-01-01, con `Date.UTC`), `aISO(dia: number): FechaISO`, `sumarDias(f: FechaISO, n: number): FechaISO`.
- Produces (`arbol.ts`): `construirArbol(actividades: ActividadEntrada[]): NodoArbol[]`. Devuelve las raíces ordenadas por `orden` y genera `item` por posición. Lanza `Error('padre_inexistente')` si un `padreId` no existe y `Error('ciclo')` si hay un ciclo. También `recorrerHojas(raices: NodoArbol[]): NodoArbol[]`.

- [ ] **Step 1: Pruebas que fallan.**
  - `aDia('1970-01-02') === 1`; `aISO(aDia(x)) === x` para cada día de 2023-01-01 a 2026-12-31 (incluye 2024-02-29); `aDia('2025-03-13') - aDia('2025-03-12') === 1`. Repetir el bloque con `process.env.TZ = 'America/Bogota'` y `'Pacific/Kiritimati'` (Review Focus 2).
  - `construirArbol`: con 3 niveles desordenados, los ítems salen `1, 1.1, 1.2, 2, 2.1, 2.1.1`; `esHoja` es correcto; lanza `padre_inexistente` y `ciclo` cuando corresponde.
  - Fixture: el árbol tiene 3 raíces (ítems 1, 2 y 3), 144 hojas (138 con peso) y 6 hojas bajo `2.2` sin fechas.
- [ ] **Step 2:** `npm test -w packages/shared` → FALLA.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w packages/shared` → PASA.
- [ ] **Step 5:** Commit `Añade fechas y construcción del árbol al motor de cálculo`.

---

### Task 4: Cálculo del cronograma y prueba de aceptación

**Files:**
- Create: `packages/shared/src/calculo/cronograma.ts`
- Test: `packages/shared/test/calculo/cronograma.test.ts`, `aceptacion-excel.test.ts`

**Interfaces:**
- Consumes: `NodoArbol`, `aDia`, `aISO`, `sumarDias`, `recorrerHojas` (Task 3).
- Produces:
  ```ts
  type Estado = 'sin_programar' | 'por_iniciar' | 'terminada' | 'al_dia' | 'en_atencion' | 'atrasada'
  interface AvanceHoja { pct: number; terminadaEn?: FechaISO | null }   // terminadaEn: fecha del primer corte con 100 %
  type AvancesPorHoja = Record<string, AvanceHoja>
  interface Umbrales { atencion: number; atraso: number }               // por defecto { atencion: -3, atraso: -10 }
  interface ResultadoNodo {
    id: string; item: string; peso: number
    inicio: FechaISO | null; fin: FechaISO | null; dur: number | null
    pv: number; ev: number; desv: number; spi: number | null
    forecast: FechaISO | null; estado: Estado; adelantada: boolean
  }
  interface ResultadoCronograma { proyecto: ResultadoNodo; nodos: Record<string, ResultadoNodo> }   // proyecto.id = 'proyecto', item = ''
  calcularCronograma(raices: NodoArbol[], avances: AvancesPorHoja, fecha: FechaISO, umbrales?: Umbrales): ResultadoCronograma
  ```

**Reglas (§4.2–4.4 del análisis, fijadas aquí):**
- Hoja **sin programar**: sin `inicio`, sin `fin` o con `peso` nulo o 0. Queda fuera de toda suma; su resultado lleva `pv = ev = desv = 0`, `spi = null` y `forecast = null`.
- Hoja: `dur = fin − ini + 1`; `pv = clamp((t − ini + 1) / dur, 0, 1)`; `ev = clamp(avances[id]?.pct ?? 0, 0, 1)`; `desv = (ev − pv) × dur`; `spi = pv > 0 ? ev / pv : null`. El `forecast`: si `ev ≥ 1`, `terminadaEn ?? fecha`; si no, `max(t, fin − round(desv))`.
- Agrupadora y proyecto, sobre sus hojas programadas: `peso = Σ`, `inicio = min`, `fin = max`, `pv` y `ev` ponderados por peso, `desv = (ev − pv) × dur` con su propia `dur`, y `forecast` = máximo de las hojas. Sin hojas programadas → `sin_programar`, con todo en 0 o `null`.
- Estado, en este orden: sin_programar → `terminada` (`ev ≥ 1`) → `por_iniciar` (`pv = 0` y `ev = 0`) → `al_dia` (`desv ≥ atencion`) → `en_atencion` (`desv ≥ atraso`) → `atrasada`. `adelantada = desv > 0`. *(Reemplazada el 2026-11-09 por la regla de brecha en puntos con estado `vencida`: ver §4.4 del análisis.)*

- [ ] **Step 1: Pruebas que fallan** (`cronograma.test.ts`):
  - Hoja 2025-03-01 a 2025-03-10, corte 2025-03-05, pct 0,3 → `pv = 0.5`, `desv = -2`, estado `al_dia`, `forecast = '2025-03-12'`.
  - El mismo caso con pct 0 y corte 2025-03-09 → `pv = 0.9`, `desv = -9`, `en_atencion`; con corte 2025-03-10 y pct 0 → `desv = -10`, `en_atencion`; con un umbral `atraso: -9` → `atrasada`.
  - Corte antes del inicio → `pv = 0` y `por_iniciar`. Con pct 1 y `terminadaEn = '2025-03-08'` → `terminada`, `forecast = '2025-03-08'`.
  - Agrupadora con dos hojas de pesos 0,2 y 0,6 → `pv` ponderado con divisor 0,8 (no 1).
  - Review Focus 3: todas las hojas sin programar, una hoja de peso 0 y una hoja de un día → ningún campo es `NaN` ni `Infinity`; el proyecto queda `sin_programar` en el primer caso.
- [ ] **Step 2: Prueba de aceptación** (`aceptacion-excel.test.ts`): con el fixture y `avances[id] = { pct: esperado.L ?? 0 }`, al `'2025-03-13'`:
  - `proyecto.pv` ≈ `0.1251` y `proyecto.ev` ≈ `0.1247` (`toBeCloseTo(x, 4)`).
  - Para cada hoja programada, `nodos[id].pv` ≈ `esperado.K` (`toBeCloseTo(x, 9)`).
  - Las 6 hojas de `2.2` quedan `sin_programar`.
- [ ] **Step 3:** `npm test -w packages/shared` → FALLA.
- [ ] **Step 4:** Implementar `calcularCronograma` con un recorrido postorden.
- [ ] **Step 5:** `npm test -w packages/shared` → PASA, incluida la aceptación.
- [ ] **Step 6:** Commit `Implementa el cálculo del cronograma validado contra el Excel`.

---

### Task 5: Curvas, avance por grupo, validaciones e indicadores

**Files:**
- Create: `packages/shared/src/calculo/curvas.ts`, `validacion.ts`, `indicadores.ts`
- Test: `packages/shared/test/calculo/curvas.test.ts`, `validacion.test.ts`, `indicadores.test.ts`

**Interfaces:**
- Consumes: `calcularCronograma`, `NodoArbol`, `ResultadoCronograma` (Task 4).
- Produces:
  ```ts
  curvaSPlaneada(raices: NodoArbol[]): { fecha: FechaISO; pv: number }[]
    // puntos en inicio del proyecto, +7, +14… y siempre el fin; [] si el proyecto está sin programar
  curvaSReal(cortes: { fecha: FechaISO; ev: number }[]): { fecha: FechaISO; ev: number }[]   // ordenada por fecha
  avancePorGrupo(raices: NodoArbol[], r: ResultadoCronograma): { id: string; item: string; nombre: string; pv: number; ev: number }[]   // nodos de nivel 1
  interface Aviso { codigo: 'pesos_no_suman_100' | 'fin_antes_de_inicio' | 'sin_programar' | 'nombre_vacio'; actividadId?: string; mensaje: string }
  validarCronograma(raices: NodoArbol[]): Aviso[]
  interface Meta { operador: '>=' | '<=' | '='; valor: number }
  cumplimientoIndicador(meta: Meta, valor: number): { pct: number; estado: 'verde' | 'atencion' | 'rojo' }
  ```

**Reglas:** `pesos_no_suman_100` si `|Σ peso hojas programadas − 1| > 1e-6`. Cumplimiento: con `>=`, `valor / meta`; con `<=`, `meta / valor`; con `=`, 1 si coincide y 0 si no. El tope es 1. Si el divisor es 0, `pct = 1` cuando la meta se cumple y 0 cuando no. Estado: `≥ 1` verde, `≥ 0.8` atención y el resto rojo.

- [ ] **Step 1: Pruebas que fallan:**
  - Curva planeada: con el fixture, el primer punto es `('2025-01-15', ~0)` y el último `('2025-12-19', 1)`; cada intervalo es de 7 días, salvo el último; la curva es monótona no decreciente.
  - `avancePorGrupo` con el fixture devuelve 3 grupos.
  - Validación: 0,5 + 0,4 → `pesos_no_suman_100`; fin < inicio → `fin_antes_de_inicio`; el fixture solo da avisos `sin_programar` (6).
  - Indicadores: `(>=, 85)` con 68 → `{0.8, 'atencion'}`; `(<=, 72)` con 90 → `{0.8, 'atencion'}`; `(<=, 72)` con 0 → `{1, 'verde'}`; `(=, 1)` con 2 → `{0, 'rojo'}`.
- [ ] **Step 2:** FALLA → **Step 3:** implementar → **Step 4:** PASA (`npm test -w packages/shared`).
- [ ] **Step 5:** Exportar todo el motor desde `packages/shared/src/index.ts`. Commit `Completa el motor con curvas, validaciones e indicadores`.

---

### Task 6: Esquemas compartidos (auth y actividades)

**Files:**
- Create: `packages/shared/src/esquemas/auth.ts`, `actividad.ts`, `error.ts`
- Test: `packages/shared/test/esquemas/auth.test.ts`

**Interfaces:**
- Produces:
  ```ts
  esCorreoPermitido(correo: string, dominio: string): boolean   // normaliza con trim + minúsculas; exige terminar en '@' + dominio exacto
  normalizarCorreo(correo: string): string
  registroEntrada  = z.object({ correo, nombre: 2–80 caracteres, clave: mín. 10 y máx. 200 })
  loginEntrada     = z.object({ correo, clave })
  cambiarClaveEntrada = z.object({ claveActual, claveNueva: mín. 10 })
  usuarioPublico   = z.object({ id, correo, nombre, esAdmin: boolean, debeCambiarClave: boolean })
  actividadEntrada = z.object(...)   // forma de ActividadEntrada (Task 3); fechas con regex YYYY-MM-DD; peso 0–1
  respuestaError   = z.object({ error: z.object({ codigo: z.string(), mensaje: z.string(), campos: z.record(z.string()).optional() }) })
  DOMINIO_POR_DEFECTO = 'hlingenieros.com'
  ```
  Tipos inferidos (`RegistroEntrada`, `UsuarioPublico`…). Los mensajes de Zod van en español.
- Los esquemas de charter, cronograma y cortes se agregan en las fases 3 y 4.

- [ ] **Step 1: Pruebas que fallan** (Review Focus 1): `esCorreoPermitido(' JUrbina@HLIngenieros.com ', 'hlingenieros.com') === true`; devuelve `false` para `x@hlingenieros.com.co`, `x@malhlingenieros.com`, `x@sub.hlingenieros.com` y `hlingenieros.com`. `registroEntrada` rechaza una clave de 9 caracteres con el mensaje "La clave debe tener al menos 10 caracteres".
- [ ] **Step 2:** FALLA → **Step 3:** implementar → **Step 4:** PASA.
- [ ] **Step 5:** Commit `Añade esquemas compartidos de autenticación y actividades`.

---

### Task 7: Base de datos

**Files:**
- Create: `apps/api/src/db/esquema.ts`, `conexion.ts`, `semilla.ts`; `apps/api/drizzle.config.ts`; `apps/api/drizzle/` (migraciones generadas)
- Test: `apps/api/test/db.test.ts`

**Interfaces:**
- Produces: `crearDb(ruta: string): BaseDatos`, donde `BaseDatos` es una instancia de Drizzle con el esquema y `ruta` admite `':memory:'`. Activa `PRAGMA foreign_keys = ON` y `journal_mode = WAL`, aplica las migraciones de `apps/api/drizzle` y ejecuta `sembrar(db)` de forma idempotente.
- Produces: tablas de Drizzle con los nombres de la §5 de la arquitectura (`usuario`, `sesion`, `categoria`, `area`, `charter`, `item_lista`, `riesgo`, `indicador`, `medicion`, `rubro`, `rubro_detalle`, `actividad`, `actividad_responsable`, `corte`, `avance`). Las columnas van en snake_case en SQL y en camelCase en TS.
- Restricciones: `usuario.correo` único; `corte (charter_id, fecha)` único; `avance.actividad_id` **sin** clave foránea, con el `item` y el `nombre` copiados; `actividad.padre_id` → `actividad.id` con borrado en cascada; las tablas hijas de `charter` se borran en cascada con él; `charter.categoria_id` y `charter.area_id` usan `ON DELETE RESTRICT`.
- Semilla: las 3 categorías del Comité con sus colores (§5.1).

- [ ] **Step 1: Pruebas que fallan:**
  - `crearDb(':memory:')` crea las 15 tablas y 3 categorías.
  - Llamar dos veces a `sembrar` deja 3 categorías.
  - Insertar dos cortes con la misma fecha y charter lanza un error.
  - Borrar una actividad con avances conserva la fila de `avance`.
  - Borrar un charter borra sus actividades.
- [ ] **Step 2:** FALLA → **Step 3:** escribir el esquema y correr `npx drizzle-kit generate` → **Step 4:** PASA (`npm test -w apps/api`).
- [ ] **Step 5:** `servidor.ts` usa `crearDb(config.rutaDb)`, creando la carpeta `data/` si no existe. `npm run dev` crea `data/charters.db`.
- [ ] **Step 6:** Commit `Crea el esquema de base de datos y las migraciones`.

---

### Task 8: Autenticación

**Files:**
- Create: `apps/api/src/auth/{rutas.ts,sesiones.ts,claves.ts,guardas.ts,limite.ts}`, `apps/api/src/errores.ts`, `apps/api/src/cli/admin.ts`
- Test: `apps/api/test/auth.test.ts`, `apps/api/test/cli.test.ts`

**Interfaces:**
- Consumes: `crearDb`, tablas `usuario` y `sesion` (Task 7); esquemas de auth (Task 6).
- Produces:
  ```ts
  class ErrorApi extends Error { constructor(estado: number, codigo: string, mensaje: string, campos?: Record<string, string>) }
  // errores.ts registra un setErrorHandler que serializa ErrorApi y ZodError (400 'datos_invalidos' con campos)
  interface UsuarioSesion { id: string; correo: string; nombre: string; esAdmin: boolean; debeCambiarClave: boolean }
  // guardas.ts:
  exigirSesion: preHandler   // pone request.usuario: UsuarioSesion o lanza 401 'no_autenticado' y limpia la cookie
  exigirAdmin: preHandler    // tras exigirSesion; 403 'solo_admin'
  crearSesion(db, usuarioId): Promise<string>        // devuelve el token en claro
  cerrarSesionesDe(db, usuarioId): Promise<void>
  promoverAdmin(db, correo: string, valor: boolean): Promise<void>   // lanza 'usuario_inexistente'
  ```
- Rutas:
  - `POST /api/auth/registro`: valida el dominio contra `config.dominioPermitido` (403 `dominio_no_permitido`). Un correo repetido da 409 `registro_rechazado` con el mensaje "No fue posible crear la cuenta con ese correo". Si todo va bien, crea la sesión y responde 201 con `UsuarioPublico`.
  - `POST /api/auth/login`: 401 `credenciales_invalidas` (mismo mensaje si el correo no existe o la clave falla) y 403 `cuenta_inactiva`.
  - `POST /api/auth/logout` → 204. `GET /api/auth/yo` → `UsuarioPublico`. `POST /api/auth/cambiar-clave` → 204, cierra las demás sesiones y pone `debe_cambiar_clave = false`.
- Si `debeCambiarClave` está activo, cualquier ruta fuera de `/api/auth/*` responde 403 `debe_cambiar_clave`.
- **Límite de intentos de login:** 10 por 15 min por IP (`@fastify/rate-limit` en esa ruta) y 10 por 15 min por correo normalizado (`Map` en memoria en `limite.ts`). Responde 429 `demasiados_intentos`.
- **Renovación de la sesión:** si `ultimo_uso` tiene más de 1 hora, se actualizan `ultimo_uso` y `expira_en = ahora + 7 días`, y se reenvía la cookie.
- La cabecera `X-Requested-With` se exige en un hook `onRequest` global para las mutaciones.
- CLI: `npm run admin -- --promover <correo>` y `--quitar <correo>` (script de la raíz que delega en `apps/api`) usa `config.rutaDb`.

- [ ] **Step 1: Pruebas que fallan** (`app.inject` con `crearDb(':memory:')`):
  - El registro feliz devuelve 201 y la cookie `charter_sesion` es `HttpOnly` con `SameSite=Lax`.
  - `" JUrbina@HLIngenieros.com "` se registra como `jurbina@hlingenieros.com`.
  - `x@gmail.com` → 403 `dominio_no_permitido`. Un correo repetido (distinto en mayúsculas) → 409. Una clave de 9 caracteres → 400 con `campos.clave`.
  - Login correcto e incorrecto (el mensaje es idéntico en los dos casos de fallo); el intento 11 → 429.
  - Review Focus 4: una cookie con la sesión vencida (se fuerza `expira_en` en el pasado), una cookie tras logout y una cookie de una cuenta desactivada → 401 `no_autenticado` con `Set-Cookie` que la borra.
  - En la base no existe el token en claro (solo su hash) ni la clave en claro.
  - `POST` sin `X-Requested-With` → 403 `csrf`.
  - `debeCambiarClave`: `GET /api/salud-privada` (ruta de prueba registrada solo en tests, con `exigirSesion`) → 403 hasta que se cambia la clave.
  - CLI: `promoverAdmin` sobre un correo registrado pone `es_admin = 1`; sobre uno inexistente lanza `usuario_inexistente`.
- [ ] **Step 2:** FALLA → **Step 3:** implementar → **Step 4:** PASA (`npm test -w apps/api`).
- [ ] **Step 5:** Commit `Implementa registro por dominio, login y sesiones`.

---

### Task 9: Aislamiento por dueño

**Files:**
- Create: `apps/api/src/modulos/charters/acceso.ts`
- Test: `apps/api/test/aislamiento.test.ts`

**Interfaces:**
- Consumes: `ErrorApi`, `UsuarioSesion` (Task 8); tabla `charter` (Task 7).
- Produces:
  ```ts
  type ModoAcceso = 'lectura' | 'escritura' | 'reapertura'
  cargarCharter(db: BaseDatos, id: string, usuario: UsuarioSesion, modo: ModoAcceso): Promise<FilaCharter>
  ```
  - El charter no existe, o es de otro usuario no Admin → 404 `no_encontrado` (el mismo error en ambos casos).
  - `lectura`: el dueño o un Admin.
  - `escritura`: solo el dueño; si es un Admin y no es el dueño → 403 `solo_lectura`. Si el estado es `cerrado` o `cancelado` → 409 `charter_cerrado`.
  - `reapertura`: solo el dueño y en cualquier estado (lo usará el `PATCH` de estado en la Fase 3).
- Es el **único** punto de control: toda ruta de la Fase 3 en adelante que reciba un `:id` de charter lo debe usar.

- [ ] **Step 1: Pruebas que fallan** (insertando usuarios A, B y Admin, y charters directamente en la base). Review Focus 5:
  - B lee o escribe el charter de A → 404 `no_encontrado`. Un id inexistente → el mismo 404, idéntico byte a byte.
  - El Admin lee el de A → ok; lo escribe → 403 `solo_lectura`.
  - A escribe uno `cerrado` → 409; A lo reabre → ok.
  - El Admin escribe uno propio → ok.
- [ ] **Step 2:** FALLA → **Step 3:** implementar → **Step 4:** PASA.
- [ ] **Step 5:** Commit `Añade el control de acceso por dueño y lectura del Admin`.

---

### Task 10: Sistema de diseño

**Files:**
- Create: `apps/web/src/estilos/{tokens.css,global.css}`
- Create: `apps/web/src/componentes/{Boton,Campo,Tarjeta,Pestanas,Tabla,Dialogo,Aviso,Marca}.tsx`
- Create: `apps/web/src/app/{Layout.tsx,EncabezadoApp.tsx}`, `apps/web/src/pantallas/Muestra.tsx` (ruta `/muestra`, solo en desarrollo)
- Create: `apps/web/src/movimiento.ts`
- Test: `apps/web/test/componentes.test.tsx`

**Interfaces:**
- Produces: tokens de Tailwind 4 (`@theme`) con los valores de la §6 del README.
  - Colores: `--color-institucional: #003366`, `--color-tinta: #0B1F33`, `--color-texto: #3B4B5E`, `--color-texto-2: #5B6C7E`, `--color-texto-3: #7C8CA1`, `--color-linea: #DCE3EC`, `--color-linea-2: #E3E8EF`, `--color-fondo: #EEF2F6`, `--color-acento: #00A9E0`.
  - Estados: `--color-ok: #15A06A`, `--color-info: #1F6FD1`, `--color-neutro: #7C8CA1`, `--color-alerta: #C4513C`.
  - Fuentes: `--font-titulo: 'Sora Variable'`, `--font-texto: 'Plus Jakarta Sans Variable'`, `--font-cifra: 'JetBrains Mono Variable'`, cargadas desde `@fontsource-variable/*` (empaquetadas por Vite, sin CDN).
- Produces: `movimiento.ts` exporta las variantes de Motion `entrada`, `escalonado(i)` y `transicionRuta`, y `usarMovimientoReducido()` (envuelve `useReducedMotion`); con movimiento reducido, las variantes no animan.
- Produces: componentes con props tipadas.
  - `Boton`: `variante: 'primario' | 'secundario' | 'fantasma' | 'peligro'`, `cargando?: boolean`.
  - `Campo`: `etiqueta`, `error?`, `ayuda?`, más las props del input; el error queda asociado con `aria-describedby`.
  - `Dialogo`: `abierto`, `alCerrar`, `titulo`; atrapa el foco y se cierra con Esc.
  - `Aviso`: `tono: 'info' | 'ok' | 'alerta'`.
- La dirección visual exacta (densidad, sombras, radios) sigue las maquetas de T1.3 si ya existen. Si no, toma el Informe global como referencia y se ajusta después.

- [ ] **Step 1: Pruebas que fallan:** `Boton` con `cargando` queda deshabilitado y anuncia "Cargando"; `Campo` con `error` muestra el texto y lo enlaza con `aria-describedby`; `Dialogo` se cierra con Esc y devuelve el foco al disparador.
- [ ] **Step 2:** FALLA → **Step 3:** implementar → **Step 4:** PASA (`npm test -w apps/web`).
- [ ] **Step 5:** Verificar `/muestra` en el navegador a 360 px y 1440 px (Playwright, con captura): sin desborde horizontal, las fuentes cargadas sin peticiones externas (revisar la red) y el contraste del texto sobre fondo ≥ 4,5:1.
- [ ] **Step 6:** Commit `Crea el sistema de diseño con la identidad del Informe global`.

---

### Task 11: Pantallas de acceso

**Files:**
- Create: `apps/web/src/api/{cliente.ts,sesion.ts}`
- Create: `apps/web/src/pantallas/{Entrar,Registro,Inicio}.tsx`, `apps/web/src/app/{rutas.tsx,RutaProtegida.tsx}`
- Test: `apps/web/test/acceso.test.tsx`

**Interfaces:**
- Consumes: `registroEntrada`, `loginEntrada`, `usuarioPublico`, `esCorreoPermitido`, `DOMINIO_POR_DEFECTO` (Task 6); componentes (Task 10); rutas de auth (Task 8).
- Produces:
  ```ts
  api<T>(ruta: string, opciones?: { metodo?: string; cuerpo?: unknown }): Promise<T>
    // fetch a '/api' + ruta, con credentials 'same-origin', 'X-Requested-With: charter' y JSON
    // si la respuesta no es ok, lanza ErrorCliente { estado, codigo, mensaje, campos? }
  usarSesion(): UseQueryResult<UsuarioPublico | null>   // GET /auth/yo; 401 → null
  usarEntrar(), usarRegistrar(), usarSalir()            // mutaciones que invalidan la sesión
  ```
- Rutas:
  - `/entrar` y `/registro` son públicas; con sesión activa redirigen a `/`.
  - `/` usa `RutaProtegida` y por ahora muestra `Inicio` ("Hola, {nombre}" y botón Salir); el portafolio llega en la Fase 3.
  - Con `debeCambiarClave` se redirige a `/cuenta`, que se crea en la Fase 3; por ahora, a un aviso en `Inicio`.
- El formulario de registro valida en el cliente con `registroEntrada` + `esCorreoPermitido(correo, DOMINIO_POR_DEFECTO)`. Muestra "Usa tu correo @hlingenieros.com" y los errores de la API en el campo indicado por `campos`.

- [ ] **Step 1: Pruebas que fallan** (Testing Library con `fetch` simulado):
  - Registro con `x@gmail.com` muestra "Usa tu correo @hlingenieros.com" sin llamar a la API.
  - Un 409 de la API se muestra como aviso.
  - `RutaProtegida` sin sesión redirige a `/entrar`.
  - Un login exitoso navega a `/`.
- [ ] **Step 2:** FALLA → **Step 3:** implementar → **Step 4:** PASA.
- [ ] **Step 5:** Verificación real con `npm run dev` y el navegador, a 360 px y 1440 px:
  - Registrar `prueba@hlingenieros.com` → `/` muestra "Hola, …".
  - Salir → `/entrar`.
  - Entrar de nuevo → `/`.
  - Recargar mantiene la sesión.
  - Con `prefers-reduced-motion` no hay animaciones.
- [ ] **Step 6:** Correr `npm test`, `npm run lint` y `npm run build` en la raíz → todo en verde.
- [ ] **Step 7:** Commit `Añade las pantallas de entrada y registro`. Marcar T2.1–T2.9 en PENDIENTES.md.
