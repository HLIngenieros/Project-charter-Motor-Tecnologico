# Fase 7 · Admin — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El Admin gestiona cuentas y catálogos sin la consola, cualquier usuario puede cambiar su clave, y el portafolio gana un tablero consolidado (para todos) con la vista «Todos» del Admin.

**Architecture:** Tipos, entradas Zod y la paleta de categorías en `shared`. La API suma `modulos/admin/cuentas.ts` y `modulos/admin/catalogos.ts` bajo `/api/admin` (ya protegido con `exigirAdmin`) y `GET /api/charters?ver=todos`. En la web, dos pestañas nuevas en `AreaAdmin`, la pantalla `/cuenta/clave` y el tablero del portafolio calculado en la web con una función pura sobre `CharterResumen[]`.

**Tech Stack:** el del proyecto (React + Vite + Tailwind + Motion, Fastify + Drizzle + Postgres/PGlite, Zod, Vitest). Sin dependencias nuevas.

**Spec:** [docs/superpowers/specs/2026-11-12-fase-7-admin-design.md](../superpowers/specs/2026-11-12-fase-7-admin-design.md) (manda sobre este plan) · [DESIGN.md](../../DESIGN.md) · maqueta elegida: opción A (tablero + tabla).

## Sesiones

| Sesión        | Tareas | Resultado                                                            |
| ------------- | ------ | -------------------------------------------------------------------- |
| 1 · API       | 1–4    | Shared, cuentas, catálogos con migración y `?ver=todos`              |
| 2 · Admin web | 5–7    | Cambiar clave, pestañas Cuentas y Catálogos, Default preseleccionada |
| 3 · Tablero   | 8–9    | Tablero del portafolio, vista «Todos», verificación y documentación  |

## Decisiones de este plan _(criterio técnico)_

- Rutas nuevas, todas bajo `rutasAdmin` (`/api/admin`, ya con `exigirSesion` + `exigirAdmin`):
  - `GET /cuentas` · `POST /cuentas/:id/restablecer-clave` · `PATCH /cuentas/:id`
  - `GET /catalogos/categorias` · `POST /catalogos/categorias` · `PATCH /catalogos/categorias/:id` · `DELETE /catalogos/categorias/:id` (ídem con `areas`).
- Orden de los catálogos: la web manda `orden` en el `PATCH` de las dos filas que intercambia (subir/bajar). Sin endpoint de reordenar.
- Default: id fijo `019a6a00-0000-7000-8000-000000000000`, `orden: 0` (las 3 del Comité ya tienen 1–3), `protegida: true`, color del par neutro de la paleta. La siembra va en `sembrar` (idempotente, `onConflictDoNothing`); la migración solo agrega la columna.
- Clave temporal: 12 caracteres de `ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789` con `crypto.randomInt`. El Admin **sí** puede restablecer su propia clave (no rompe nada; cierra también su sesión).
- `ultimo_admin` (409) se valida igual aunque `sobre_si_mismo` lo haga casi inalcanzable: defensa en profundidad.
- Tablero: función pura en la web; recibe la lista **filtrada por texto, área, categoría y dueño** (no por estado ni por `semaforo`, para que la barra no se vacíe al pulsarla) y cuenta solo charters `activo`. La tabla sí aplica todos los filtros.
- `useCharters(ver: 'mios' | 'todos' = 'mios')` con clave de query `['charters', ver]`; las invalidaciones existentes de `CLAVES.charters` siguen funcionando por prefijo.

## Global Constraints

- Todo lo vigente de fases anteriores: español de tú, `es-CO`, `{ error: { codigo, mensaje, campos? } }`, `X-Requested-With: charter`, `exigirAdmin` (403 `solo_admin`, nunca 404), contraste y `useVariantes`/movimiento reducido, responsive a 390 px sin `scrollWidth` mayor que el viewport.
- Copy fijo: «¿Olvidaste tu clave? Contacta al administrador del sistema.» · «Pásasela a la persona; al entrar deberá cambiarla.» · «Tu clave fue restablecida. Elige una nueva para seguir.» · «Default» · «Sin área» · «Sin categoría» · «Sin corte o sin iniciar» · «Mis charters» / «Todos» · «Todos los charters».
- Errores nuevos: 400 `sobre_si_mismo`, 409 `ultimo_admin`, 409 `nombre_repetido`, 409 `en_uso`, 409 `protegida`, 400 `datos_invalidos` (color fuera de paleta), 404 `no_encontrado`.
- Segmentos del tablero: `verde` = `al_dia` | `terminada`; `amarillo` = `en_atencion`; `naranja` = `en_riesgo`; `rojo` = `atrasada`; `vencida` = `vencida`; `neutro` = sin corte | `por_iniciar` | `sin_programar`. Por el `estado` global de `ultimoCorte`.
- Cifras: activos · en rojo o vencidos (`atrasada` | `vencida`) · avance = promedio simple de `ev` y `pv` de activos con corte · sin corte reciente = activos sin corte o con `hoyISO() − fecha > 30` días.
- Ejecución directa; pruebas con cada tarea; suite completa, lint, build y una ronda de navegador al cerrar (Task 9). Commits en español, imperativo y breves, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **No hacer push.**

## Review Focus

1. **Cookie vieja tras desactivar y reactivar**: la sesión anterior da 401, no revive. → Task 2.
2. **Usuario con clave restablecida que abre un enlace profundo** (`/charters/:id`): termina en `/cuenta/clave`, y tras cambiarla, en el portafolio; ninguna pantalla queda en un 403 `debe_cambiar_clave` sin salida. → Task 5.
3. **Renombrar una categoría a un nombre existente con otra capitalización o tilde** («automatizacion»): 409 `nombre_repetido` y el campo vuelve al nombre anterior con el mensaje. → Tasks 3 y 7.
4. **Pulsar un segmento de barra con filtro de estado activo**: la barra no se vacía ni cambia de forma; la tabla muestra la intersección y el chip permite quitarlo. → Task 8.
5. **No-Admin con `?ver=todos` en la URL**: la API da 403 y la web ignora el parámetro (no muestra el selector y lista solo lo propio). → Tasks 4 y 8.

---

## Sesión 1 · API

### Task 1: Shared · tipos, entradas y paleta

**Files:**

- Create: `packages/shared/src/esquemas/admin.ts`
- Modify: `packages/shared/src/esquemas/index.ts`, `packages/shared/src/esquemas/charter.ts` (`CharterResumen`)
- Test: `packages/shared/test/esquemas/admin.test.ts`

**Interfaces:**

- Produces:
  - `interface CuentaAdmin { id; nombre; correo; esAdmin: boolean; activo: boolean; debeCambiarClave: boolean; charters: number; ultimoAcceso: string | null; creadoEn: string }`
  - `editarCuentaEntrada = z.object({ activo: z.boolean().optional(), esAdmin: z.boolean().optional() }).strict()` con refinamiento «al menos un campo».
  - `PALETA_CATEGORIAS: readonly { color: string; colorFondo: string }[]` (8 pares; incluye los 3 de la semilla y el neutro de Default como `PALETA_CATEGORIAS[0]`).
  - `crearCatalogoEntrada = z.object({ nombre: z.string().trim().min(1).max(80) })`; `crearCategoriaEntrada = crearCatalogoEntrada.extend({ color })` donde `color` debe ser un `color` de la paleta.
  - `editarCategoriaEntrada` / `editarAreaEntrada`: `{ nombre?, color? (solo categoría), activa?, orden?: z.number().int().min(0) }`, estrictas, al menos un campo.
  - `interface CatalogoAdmin { id; nombre; activa: boolean; orden: number; charters: number }` y `interface CategoriaAdmin extends CatalogoAdmin { color; colorFondo; protegida: boolean }`.
  - `CharterResumen.propietario: { id: string; nombre: string }`.

- [ ] **Step 1: Pruebas** — `editarCuentaEntrada` rechaza `{}` y claves extra; `crearCategoriaEntrada` rechaza un color fuera de `PALETA_CATEGORIAS` y nombre vacío o de solo espacios; la paleta tiene 8 pares sin colores repetidos.
- [ ] **Step 2:** `npx vitest run packages/shared/test/esquemas/admin.test.ts` → FAIL.
- [ ] **Step 3: Implementar** los tipos y esquemas en `admin.ts` y exportarlos. Los pares de la paleta los fija Task 7 con la prueba de contraste; aquí basta que existan (texto `tinta` sobre `colorFondo` ≥ 4,5:1 y `color` sobre blanco ≥ 3:1 se verifica allí).
- [ ] **Step 4:** prueba en verde; `npx tsc -b` mostrará los usos de `CharterResumen` sin `propietario` (se corrigen en Task 4 y en las simulaciones web de Task 8).
- [ ] **Step 5: Commit** «Agrega tipos y esquemas de administración».

### Task 2: API · cuentas

**Files:**

- Create: `apps/api/src/modulos/admin/cuentas.ts`, `apps/api/test/cuentas.test.ts`
- Modify: `apps/api/src/modulos/admin/rutas.ts`

**Interfaces:**

- Consumes: `CuentaAdmin`, `editarCuentaEntrada` (Task 1); `cerrarSesionesDe`, `cifrarClave`.
- Produces: `listarCuentas(db): Promise<CuentaAdmin[]>` (orden por nombre; `charters` = conteo por `propietario_id`; `ultimoAcceso` = `max(sesion.ultimo_uso)`), `restablecerClave(db, id): Promise<{ claveTemporal: string }>`, `editarCuenta(db, yoId, id, cuerpo): Promise<CuentaAdmin>`.

- [ ] **Step 1: Pruebas** (`sesionDe(app, …, { admin: true })`):
  - `GET /api/admin/cuentas` como Admin trae a todos con `charters` y `ultimoAcceso`; como usuario, 403 `solo_admin` en las tres rutas.
  - Restablecer: responde `claveTemporal` de 12 caracteres del alfabeto; la cookie vieja de la cuenta da 401; `POST /api/auth/login` con la temporal entra y `GET /api/charters` da 403 `debe_cambiar_clave`; `POST /api/auth/cambiar-clave` la quita.
  - Desactivar: la cookie de la cuenta da 401 y el login da 403 `cuenta_inactiva`. **Reactivar no revive la cookie vieja** (sigue 401) y el login vuelve a funcionar.
  - Dar y quitar Admin cambian `esAdmin`.
  - `PATCH` sobre sí mismo con `activo: false` o `esAdmin: false` → 400 `sobre_si_mismo`; id inexistente → 404; `{}` → 400.
- [ ] **Step 2:** `npm test -w apps/api -- cuentas` → FAIL.
- [ ] **Step 3: Implementar** el servicio y las rutas. `editarCuenta` corre en transacción: si queda sin ningún `es_admin AND activo`, 409 `ultimo_admin`. Desactivar y restablecer llaman a `cerrarSesionesDe(db, id)` (sin excepción).
- [ ] **Step 4:** pruebas en verde.
- [ ] **Step 5: Commit** «Agrega la API de cuentas del Admin».

### Task 3: API · catálogos, migración y Default

**Files:**

- Create: `apps/api/src/modulos/admin/catalogos.ts`, `apps/api/drizzle/0002_*.sql` (generada), `apps/api/test/catalogos.test.ts`
- Modify: `apps/api/src/db/esquema.ts` (`categoria.protegida`), `apps/api/src/db/semilla.ts`, `apps/api/src/modulos/admin/rutas.ts`, `apps/api/src/modulos/charters/servicio.ts` (`aCategoria` sin cambios de forma pública)

**Interfaces:**

- Consumes: entradas y `CategoriaAdmin`/`CatalogoAdmin` (Task 1).
- Produces: `listarCategoriasAdmin(db)`, `listarAreasAdmin(db)`, `crearCategoria(db, cuerpo)`, `crearArea(db, cuerpo)`, `editarCategoria(db, id, cuerpo)`, `editarArea(db, id, cuerpo)`, `eliminarCategoria(db, id)`, `eliminarArea(db, id)`. `ID_DEFAULT` exportado desde `semilla.ts`.

- [ ] **Step 1: Pruebas:**
  - Tras `prepararDb`, `GET /api/categorias` trae «Default» primero y luego las 3 del Comité; sembrar dos veces no duplica.
  - Crear categoría con color de la paleta → 201 con `colorFondo` del par; color fuera → 400; nombre «automatizacion» o «AUTOMATIZACIÓN» → 409 `nombre_repetido` (comparación con `normalizar` sin tildes ni mayúsculas, también al renombrar, excluyendo la propia fila).
  - Crear y renombrar área; listado admin incluye inactivas y `charters`.
  - `DELETE` de una categoría o área con un charter → 409 `en_uso`; sin charters → 204.
  - Default: `activa: false` → 409 `protegida`; `DELETE` → 409 `protegida`; renombrarla y cambiar su color sí se permite.
  - Desactivada: `POST /api/charters` con ella → 400 (comportamiento existente de `validarCatalogos`).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementar.** Agregar `protegida: booleano('protegida').notNull().default(false)` a `categoria`; `npx drizzle-kit generate` y **revisar el SQL** (solo `ALTER TABLE … ADD COLUMN`). Default en `CATEGORIAS` de `semilla.ts` con `protegida: true`. Normalización de nombres: reutilizar o mover a `shared` la misma lógica de `normalizar` de `filtrar.ts` (NFD sin diacríticos, minúsculas, `trim`).
- [ ] **Step 4:** pruebas de catálogos y `db.test.ts` en verde.
- [ ] **Step 5: Commit** «Agrega la API de catálogos y la categoría Default».

### Task 4: API · `GET /charters?ver=todos` y dueño

**Files:**

- Modify: `apps/api/src/modulos/charters/servicio.ts` (`listarMisCharters` → `listarCharters(db, { propietarioId?: string })`), `apps/api/src/modulos/charters/rutas.ts`
- Test: `apps/api/test/charters.test.ts`, `apps/api/test/aislamiento.test.ts`

**Interfaces:**

- Produces: `GET /api/charters?ver=todos` (solo Admin) → `CharterResumen[]` de todos, con `propietario`. Sin el parámetro, solo los propios (también para el Admin).

- [ ] **Step 1: Pruebas:** Admin con `ver=todos` ve los charters de Ana y Beto con `propietario.nombre`; sin parámetro, solo los suyos; usuario con `ver=todos` → 403 `solo_admin`; `ver=otra` → 400.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementar** con un `innerJoin` a `usuario` para `propietario`; el filtro por dueño solo si `propietarioId` viene.
- [ ] **Step 4:** suite de la API en verde (`npm test -w apps/api`; si falta memoria, con 2 workers como en la Fase 6).
- [ ] **Step 5: Commit** «Agrega la vista de todos los charters para el Admin».

---

## Sesión 2 · Admin web

### Task 5: Web · cambiar clave y olvido

**Files:**

- Create: `apps/web/src/pantallas/CambiarClave.tsx`, `apps/web/test/cambiar-clave.test.tsx`
- Modify: `apps/web/src/api/sesion.ts` (`useCambiarClave`), `apps/web/src/app/rutas.tsx`, `apps/web/src/app/RutaProtegida.tsx`, `apps/web/src/app/MenuUsuario.tsx`, `apps/web/src/pantallas/Entrar.tsx`, `apps/web/src/pantallas/portafolio/Portafolio.tsx` (quitar el aviso de `debeCambiarClave`)

**Interfaces:**

- Produces: ruta `/cuenta/clave` dentro de `RutaProtegida`; `useCambiarClave()` → `POST /auth/cambiar-clave` `{ claveActual, claveNueva }` y, al terminar, `invalidateQueries(CLAVE_SESION)`.

- [ ] **Step 1: Pruebas:**
  - Entrar muestra el texto de olvido.
  - Con sesión `debeCambiarClave: true`, abrir `/charters/x` termina en `/cuenta/clave` con «Tu clave fue restablecida. Elige una nueva para seguir.»; sin la marca, `/cuenta/clave` muestra el formulario sin ese texto y el menú tiene «Cambiar clave».
  - Claves nuevas distintas → error en «Confirmar clave» sin enviar; `400 clave_incorrecta` → error en «Clave actual»; éxito → navega a `/` con `state.aviso` «Clave cambiada».
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementar.** `RutaProtegida`: si `sesion.data.debeCambiarClave` y la ruta no es `/cuenta/clave`, `<Navigate to="/cuenta/clave" replace />`. Formulario con tres `CampoClave` (mismas validaciones que Registro: mínimo 8). `MenuUsuario`: enlace «Cambiar clave» y «Administración» → `/admin/cuentas`.
- [ ] **Step 4:** en verde.
- [ ] **Step 5: Commit** «Agrega la pantalla para cambiar la clave».

### Task 6: Web · Admin › Cuentas

**Files:**

- Create: `apps/web/src/pantallas/admin/Cuentas.tsx`, `apps/web/test/admin-cuentas.test.tsx`
- Modify: `apps/web/src/api/admin.ts` (`useCuentas`, `useRestablecerClave`, `useEditarCuenta`), `apps/web/src/pantallas/admin/AreaAdmin.tsx` (`PESTANAS`: Cuentas, Catálogos, Parametrización), `apps/web/src/app/rutas.tsx`

**Interfaces:**

- Consumes: rutas de Task 2.
- Produces: ruta `/admin/cuentas` con `SoloAdmin`; `/admin` redirige a `/admin/cuentas`.

- [ ] **Step 1: Pruebas:**
  - La tabla lista nombre, correo, chip «Admin», estado, charters y «nunca» si `ultimoAcceso` es nulo.
  - Búsqueda sin tildes («jose» encuentra «José») y filtro Activas / Desactivadas / Todas.
  - Restablecer → confirmación → diálogo con la clave y el texto fijo; «Copiar» llama a `navigator.clipboard.writeText`; al cerrar, la clave ya no está en el DOM.
  - Desactivar y Dar Admin envían el `PATCH` esperado; en la fila propia no están «Desactivar» ni «Quitar Admin».
  - Error `ultimo_admin` se muestra en un `Aviso`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementar** con `Tabla`, `Chip`, `Dialogo` y un menú por fila como `MenuCharter`. Bajo `md`, cada cuenta como bloque.
- [ ] **Step 4:** en verde.
- [ ] **Step 5: Commit** «Agrega la gestión de cuentas del Admin».

### Task 7: Web · Admin › Catálogos y Default preseleccionada

**Files:**

- Create: `apps/web/src/pantallas/admin/Catalogos.tsx`, `apps/web/test/admin-catalogos.test.tsx`
- Modify: `apps/web/src/api/admin.ts` (consultas y mutaciones de catálogos; al terminar, invalidan también `CLAVES.categorias` y `CLAVES.areas`), `apps/web/src/app/rutas.tsx`, `apps/web/src/pantallas/portafolio/DialogoNuevoCharter.tsx`, `packages/shared/src/esquemas/admin.ts` (valores finales de `PALETA_CATEGORIAS`), `apps/web/test/contraste.test.ts`

**Interfaces:**

- Consumes: rutas de Task 3, `PALETA_CATEGORIAS`, `ID_DEFAULT` no se usa en la web (Default se reconoce por `protegida`).

- [ ] **Step 1: Pruebas:**
  - Contraste: por cada par de la paleta, `razonContraste(tinta, colorFondo) ≥ 4.5` y `razonContraste(color, '#FFFFFF') ≥ 3`.
  - Catálogos: dos bloques con sus filas; renombrar guarda al salir del campo; 409 `nombre_repetido` devuelve el nombre anterior y muestra el mensaje; subir/bajar envía dos `PATCH` con `orden` intercambiado; «Eliminar» solo con `charters === 0`; Default sin «Desactivar» ni «Eliminar».
  - Selector de color con los 8 pares como `radiogroup` con nombre accesible.
  - `DialogoNuevoCharter` abre con la categoría `protegida` seleccionada.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3: Implementar.** Fijar los 8 pares (los 3 de la semilla + neutro + 4 nuevos que pasen la prueba).
- [ ] **Step 4:** en verde, más `npm test -w apps/web`.
- [ ] **Step 5: Commit** «Agrega la gestión de catálogos del Admin».

---

## Sesión 3 · Tablero y cierre

### Task 8: Web · tablero del portafolio y vista «Todos»

**Files:**

- Create: `apps/web/src/pantallas/portafolio/tablero.ts`, `apps/web/src/pantallas/portafolio/Tablero.tsx`, `apps/web/test/tablero.test.ts`, `apps/web/test/portafolio-tablero.test.tsx`
- Modify: `apps/web/src/api/charters.ts` (`useCharters(ver)`), `apps/web/src/pantallas/portafolio/filtrar.ts`, `Portafolio.tsx`, `FiltrosPortafolio.tsx`, `FilaCharter.tsx` (columna Dueño opcional), `apps/web/test/simular-api.ts` y simulaciones con `propietario`

**Interfaces:**

- Produces:
  - `type Segmento = 'verde' | 'amarillo' | 'naranja' | 'rojo' | 'vencida' | 'neutro'`; `segmentoDe(c: CharterResumen): Segmento`.
  - `interface GrupoTablero { id: string | 'ninguna'; nombre: string; conteo: Record<Segmento, number>; total: number }`
  - `interface Tablero { activos: number; enRojo: number; avance: { pv: number; ev: number } | null; sinCorteReciente: number; porArea: GrupoTablero[]; porCategoria: GrupoTablero[] }`
  - `calcularTablero(lista: CharterResumen[], hoy: FechaISO): Tablero` — solo `estado === 'activo'`; grupos ordenados por nombre con «Sin área» / «Sin categoría» al final; grupos con `total` 0 fuera.
  - `FiltrosPortafolio` suma `dueno: 'todos' | string` y `semaforo: { eje: 'area' | 'categoria'; grupo: string; segmento: Segmento } | null` (URL: `dueno`, `sem=area:<id>:<segmento>`).

- [ ] **Step 1: Pruebas puras** (`tablero.test.ts`): mapeo de los 8 estados a segmentos; terminado y cerrado (estado del charter) no cuentan como activos; `avance` es el promedio simple (dos charters 20/40 y 60/80 → ev 40, pv 60) y `null` sin cortes; sin corte reciente cuenta el de hace 31 días y no el de hace 30; un charter sin área cae en «Sin área»; la suma de segmentos de cada grupo es su `total`.
- [ ] **Step 2: Pruebas de pantalla:**
  - Usuario: tablero con las 4 cifras y barras; sin selector «Mis charters / Todos»; con `?ver=todos` en la URL pide `/charters` (no `?ver=todos`).
  - Admin: el selector cambia a «Todos los charters», pide `/charters?ver=todos`, muestra la columna y el filtro Dueño.
  - Clic en un segmento (botón «Financiera: 2 en rojo») filtra la tabla y muestra un chip que lo quita; la barra sigue igual con el filtro de estado activo.
  - Sin charters no hay tablero.
- [ ] **Step 3:** FAIL.
- [ ] **Step 4: Implementar.** `Tablero.tsx` usa `Cifra` y tonos del semáforo existentes (amarillo con borde `amarillo-texto`); cifras en 4 columnas desde `md`, 2 × 2 debajo. `ver` vive en la URL; si el usuario no es Admin se trata como `mios`.
- [ ] **Step 5:** pruebas web en verde.
- [ ] **Step 6: Commit** «Agrega el tablero del portafolio y la vista de todos».

### Task 9: Cierre de la fase

- [ ] **Step 1:** `npm test`, `npm run lint`, `npm run build` en verde (anotar los conteos).
- [ ] **Step 2: Navegador** (con el `npm run dev` del usuario si está arriba, sin levantar otro): a 1440 y 390 px, Cuentas (restablecer y entrar con la temporal hasta cambiarla), Catálogos (crear área, color, Default), portafolio de usuario y «Todos» del Admin con clic en barras. Revisar consola y `scrollWidth` a 390.
- [ ] **Step 3: Documentación:** PENDIENTES.md (T7.1–T7.3 hechas, registro de sesión), CLAUDE.md (estado y decisiones), `docs/plan-implementacion.md` (T7.3 ahora es el tablero en el portafolio), `docs/arquitectura.md` (rutas de admin).
- [ ] **Step 4: Commit** «Cierra la Fase 7».
