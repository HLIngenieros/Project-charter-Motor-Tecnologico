# Fase 3 · Charter básico — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cada usuario crea, abre, filtra y edita sus charters: portafolio con lista de columnas fijas y ficha «documento vivo» con encabezado, razón de ser, objetivo general y listas ordenables, con guardado automático.

**Architecture:** La API suma dos módulos: `catalogos` (lectura de categorías y áreas) y `charters` (CRUD y listas), siempre pasando por `cargarCharter`. Los esquemas de entrada y los tipos de respuesta viven en `@charter/shared`. La web reemplaza `Inicio` por el portafolio y agrega la ficha en `/charters/:id`; la ficha edita en su sitio y guarda por una cola serial (PATCH del charter y PUT de cada lista).

**Tech Stack:** el de la Fase 2 (Fastify 5, Drizzle, Zod 4, React 19, React Router 7, TanStack Query 5, Tailwind 4, Motion 12, Vitest y Testing Library). Sin dependencias nuevas.

**Spec:** [docs/pantallas.md](../pantallas.md) §1–2 y maquetas [portafolio.html](../maquetas/portafolio.html) y [ficha.html](../maquetas/ficha.html) · [docs/arquitectura.md](../arquitectura.md) §2, §5.2, §5.5, §7 y §9 · [DESIGN.md](../../DESIGN.md) · Plan maestro: [docs/plan-implementacion.md](../plan-implementacion.md) (T3.1–T3.3)

## Global Constraints

- Todas las constantes de la Fase 2 siguen vigentes (español de tú, `{ error: { codigo, mensaje, campos? } }`, cabecera `X-Requested-With: charter`, UUID v7, fechas `YYYY-MM-DD`, marcas ISO UTC, fracciones 0–1).
- Toda ruta con `:id` de charter usa `cargarCharter(db, id, usuario, modo)`: ajeno o inexistente → 404 `no_encontrado`; Admin escribiendo → 403 `solo_lectura`; cerrado o cancelado → 409 `charter_cerrado`.
- `GET /api/charters` devuelve **solo los del usuario**, también para el Admin (la lectura global es T7.3).
- Límites: nombre 1–200, código ≤ 20, responsable, patrocinador y revisión ≤ 120, razón de ser y objetivo general ≤ 4000, ítem de lista 1–1000, máximo 50 ítems por lista. El texto se recorta (`trim`).
- Colores: el de una categoría solo va en el chip de categoría (punto de 6 px, texto `tinta` sobre su `colorFondo`) y en el borde superior de 3 px; nunca en títulos (resuelve el pendiente de contraste de `#D98A00`).
- Texto de estado siempre con la variante `-texto` del semáforo; `acento` solo para foco y selección.
- Formato `es-CO`: fechas `9 nov 2026`, porcentajes `12,5 %`.
- Movimiento con `useVariantes` (respeta `prefers-reduced-motion`).
- Ejecución directa: pruebas con cada tarea; suite completa, lint, build y una ronda de capturas al cerrar (Task 9). Commits en español, imperativo y breves, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **No hacer push.**

## Review Focus

1. **Ediciones rápidas que se solapan** (escribir, salir del campo y volver a escribir antes de que responda la API): los guardados salen en orden y gana el último valor; recargar muestra ese valor. → Task 6.
2. **Nombre vacío o solo espacios en la ficha:** no se envía; el campo vuelve al valor anterior y muestra «Escribe el nombre del charter». → Task 6.
3. **Categoría o área desactivada que el charter ya usa:** la ficha la sigue mostrando («(inactiva)») y guardar otros campos no falla; solo se rechaza **cambiar a** una inactiva. → Tasks 2 y 6.
4. **Sesión vencida o charter cerrado en otra pestaña durante el guardado:** 401 lleva a `/entrar`; 409 `charter_cerrado` recarga la ficha y la deja en solo lectura con el aviso de reabrir. → Task 8.
5. **Cerrar la pestaña con cambios sin guardar:** mientras la cola tenga trabajo pendiente se pide confirmación (`beforeunload`). → Task 6.

---

### Task 1: Esquemas compartidos del charter

**Files:**
- Create: `packages/shared/src/esquemas/charter.ts`
- Modify: `packages/shared/src/esquemas/index.ts` (exportarlo)
- Modify: `apps/api/src/db/esquema.ts` (importar `ESTADOS_CHARTER` y `TIPOS_LISTA` de `@charter/shared` en vez de declararlos)
- Test: `packages/shared/test/esquemas/charter.test.ts`

**Interfaces:**
- Produces (Zod): `ESTADOS_CHARTER = ['activo','pausado','cerrado','cancelado'] as const`, `estadoCharter`; `TIPOS_LISTA = ['objetivo','supuesto','criterio_exito'] as const`, `tipoLista`.
- `charterCrear`: `{ nombre, categoriaId?: string | null, areaId?: string | null, razonDeSer?: string }`. Mensaje del nombre vacío: «Escribe el nombre del charter».
- `charterEditar`: todos opcionales y `.strict()`: `nombre, codigo (''→null), categoriaId, areaId, responsable, patrocinador, revision, razonDeSer, objetivoGeneral, estado`. Objeto vacío → error «No hay cambios para guardar».
- `listaEntrada`: `{ items: Array<{ texto: string }> }` (máx. 50).
- Tipos inferidos: `EstadoCharter`, `TipoLista`, `CharterCrear`, `CharterEditar`, `ListaEntrada`.
- Tipos de respuesta (interfaces TS):
  ```ts
  interface CategoriaPublica { id: string; nombre: string; color: string; colorFondo: string; activa: boolean }
  interface AreaPublica { id: string; nombre: string; activa: boolean }
  interface ItemLista { id: string; texto: string }
  interface CharterResumen {
    id: string; nombre: string; codigo: string | null; responsable: string
    estado: EstadoCharter; categoria: CategoriaPublica | null; area: AreaPublica | null
    actualizadoEn: string
    ultimoCorte: { fecha: string; pv: number; ev: number } | null
  }
  interface CharterDetalle {
    id: string; nombre: string; codigo: string | null; categoriaId: string | null; areaId: string | null
    responsable: string; patrocinador: string; revision: string; razonDeSer: string; objetivoGeneral: string
    estado: EstadoCharter; creadoEn: string; actualizadoEn: string
    propietario: { id: string; nombre: string }
    listas: Record<TipoLista, ItemLista[]>
    permisos: { editar: boolean; reabrir: boolean }
  }
  ```

- [ ] **Step 1: Pruebas** en `charter.test.ts`:
  - `charterCrear.parse({ nombre: '  Plan TI  ' }).nombre` → `'Plan TI'`; `{ nombre: '   ' }` falla con `'Escribe el nombre del charter'`; nombre de 201 caracteres falla.
  - `charterEditar.parse({ codigo: '' }).codigo` → `null`; `{}` falla con `'No hay cambios para guardar'`; `{ propietarioId: 'x' }` falla (estricto); `{ estado: 'borrador' }` falla.
  - `listaEntrada` acepta 50 ítems y rechaza 51; rechaza `{ texto: ' ' }`.
- [ ] **Step 2:** `npm test -w @charter/shared -- charter` → FALLA.
- [ ] **Step 3:** Implementar los esquemas y mover las constantes; `npm run build` debe seguir compilando la API.
- [ ] **Step 4:** `npm test -w @charter/shared` y `npm test -w @charter/api` → PASAN.
- [ ] **Step 5:** Commit `Agrega los esquemas compartidos del charter`.

---

### Task 2: API de catálogos y charters

**Files:**
- Create: `apps/api/src/modulos/catalogos/rutas.ts`
- Create: `apps/api/src/modulos/charters/servicio.ts`, `apps/api/src/modulos/charters/rutas.ts`
- Modify: `apps/api/src/app.ts` (registrar `rutasCatalogos` en `/api` y `rutasCharters` en `/api/charters`)
- Modify: `apps/api/test/ayudas.ts`
- Test: `apps/api/test/charters.test.ts`

**Interfaces:**
- Consumes: `cargarCharter`, `exigirSesion` (preHandler de ambos módulos), esquemas de Task 1.
- Produces (rutas):
  - `GET /api/categorias` → `CategoriaPublica[]` (todas, por `orden`); `GET /api/areas` → `AreaPublica[]`.
  - `GET /api/charters` → `CharterResumen[]` del usuario, por `actualizadoEn` descendente. `ultimoCorte` = corte de mayor `fecha` (`pvProyecto`, `evProyecto`) o `null`.
  - `POST /api/charters` → 201 `{ id }`.
  - `GET /api/charters/:id` (lectura) → `CharterDetalle`. `permisos.editar` = dueño y estado abierto; `permisos.reabrir` = dueño y estado cerrado o cancelado.
  - `PATCH /api/charters/:id` → `CharterDetalle`. Usa modo `reapertura` solo si el cuerpo es exactamente `{ estado: 'activo' }`; en otro caso, `escritura`.
  - `DELETE /api/charters/:id` (modo `reapertura`: solo el dueño, en cualquier estado) → 204. El borrado en cascada se lleva listas, cronograma y cortes.
- Produces (servicio): `listarMisCharters(db, usuarioId): CharterResumen[]`, `crearCharter(db, usuarioId, datos: CharterCrear): string`, `detalleCharter(db, fila: FilaCharter, usuario: UsuarioSesion): CharterDetalle`, `editarCharter(db, fila: FilaCharter, datos: CharterEditar): void`, `validarCatalogos(db, datos, actual?: FilaCharter): void` (lanza 400 `datos_invalidos` con `campos.categoriaId` o `campos.areaId` = «Elige una categoría válida» / «Elige un área válida» si no existe o está inactiva y es distinta de la actual).
- Produces (ayudas de prueba): `sesionDe(app, correo, { admin?: boolean }): Promise<Record<string, string>>` (registra, opcionalmente promueve en la base, entra y devuelve `{ cookie, 'x-requested-with': 'charter' }`) y `crearCharterPrueba(app, cabeceras, cuerpo?): Promise<string>`.

- [ ] **Step 1: Pruebas** en `charters.test.ts`:
  - Catálogos: `GET /api/categorias` sin sesión → 401; con sesión → 3 categorías con `activa: true`.
  - Crear: 201 con `id`; `GET /:id` devuelve el nombre, `listas` con los tres tipos vacíos, `propietario.nombre` y `permisos` `{ editar: true, reabrir: false }`. Nombre vacío → 400 con `campos.nombre`. `categoriaId` inexistente o inactiva → 400 con `campos.categoriaId`.
  - Listar: Ana ve solo sus 2 charters y no el de Beto; el Admin con un charter propio ve solo el suyo; el editado más reciente va primero; `ultimoCorte` es `null` y, tras insertar dos cortes en la base (`2026-10-01` y `2026-11-01`), es el de `2026-11-01` con su `pv` y `ev`.
  - Editar: `PATCH { responsable: 'Líder TI', codigo: '' }` → 200 con `codigo: null`. `{}` → 400. Charter ajeno → 404. Admin → 403 `solo_lectura`, pero su `GET` → 200 con `permisos` `{ editar: false, reabrir: false }`.
  - Catálogo inactivo ya asignado: con la categoría del charter desactivada en la base, `PATCH { patrocinador: 'Gerencia' }` → 200 y `PATCH { categoriaId: <otra inactiva> }` → 400.
  - Estado: `PATCH { estado: 'cerrado' }` → 200 y `permisos` `{ editar: false, reabrir: true }`; luego `PATCH { nombre: 'X' }` → 409 `charter_cerrado`; `PATCH { estado: 'activo', nombre: 'X' }` → 409; `PATCH { estado: 'activo' }` → 200.
  - Eliminar: dueño → 204 y después `GET` → 404, sin filas en `item_lista`; Admin → 403; ajeno → 404.
  - Sin cabecera CSRF, `POST /api/charters` → 403 `csrf`.
- [ ] **Step 2:** `npm test -w @charter/api -- charters` → FALLA.
- [ ] **Step 3:** Implementar servicio y rutas. `actualizadoEn` del charter cambia con cada `PATCH` (lo hace `$onUpdateFn`).
- [ ] **Step 4:** `npm test -w @charter/api` → PASAN (incluidas las de la Fase 2).
- [ ] **Step 5:** Commit `Agrega la API de charters y catálogos`.

---

### Task 3: API de listas

**Files:**
- Modify: `apps/api/src/modulos/charters/servicio.ts`, `apps/api/src/modulos/charters/rutas.ts`
- Test: `apps/api/test/listas.test.ts`

**Interfaces:**
- Produces: `PUT /api/charters/:id/listas/:tipo` (modo `escritura`) con `listaEntrada` → `ItemLista[]` en el orden recibido. `tipo` fuera de `TIPOS_LISTA` → 400 `datos_invalidos`.
- Produces: `reemplazarLista(db, charterId, tipo: TipoLista, items: { texto: string }[]): ItemLista[]` — en una transacción borra los del tipo, inserta con `orden` 0…n−1 e ids nuevos, y toca `charter.actualizadoEn`.

- [ ] **Step 1: Pruebas** en `listas.test.ts`:
  - `PUT …/listas/objetivo` con 3 textos → 200 con 3 ítems en ese orden; `GET /:id` los devuelve igual en `listas.objetivo`.
  - Un segundo `PUT` con 2 textos en otro orden reemplaza (quedan 2) y no toca `supuesto` ni `criterio_exito`.
  - `PUT` con `items: []` deja la lista vacía.
  - `tipo` `riesgo` → 400; 51 ítems → 400; texto vacío → 400 con `campos.items`.
  - Ajeno → 404; Admin → 403; cerrado → 409.
  - Tras el `PUT`, el charter sube al primer lugar de `GET /api/charters`.
- [ ] **Step 2:** `npm test -w @charter/api -- listas` → FALLA.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w @charter/api` → PASAN.
- [ ] **Step 5:** Commit `Agrega el reemplazo de listas del charter`.

---

### Task 4: Base web: tokens, chips, formato y cliente de charters

**Files:**
- Modify: `apps/web/src/estilos/tokens.css` (semáforo completo y `barra`)
- Create: `apps/web/src/componentes/Chip.tsx`, `apps/web/src/formato.ts`, `apps/web/src/api/charters.ts`, `apps/web/src/app/MenuUsuario.tsx`
- Modify: `apps/web/src/api/cliente.ts` (`JSON.parse` protegido), `apps/web/src/app/RutaProtegida.tsx` (aviso de conexión), `apps/web/src/app/Layout.tsx` (prop `ancho`)
- Test: `apps/web/test/base-fase3.test.tsx`

**Interfaces:**
- Tokens nuevos en `@theme` (valores de DESIGN.md): `--color-barra #c9d6e5`, `--color-ok-texto #0e6e48`, `--color-amarillo #d9a400`, `--color-amarillo-suave #fbf3d9`, `--color-amarillo-texto #7a5c00`, `--color-naranja #e07b1f`, `--color-naranja-suave #fcebdc`, `--color-naranja-texto #9a4a0a`, `--color-vencida #7a1f2b`, `--color-vencida-suave #f4e4e6`. Botón (40 px) y campo (44 px, 15 px) ya cumplen DESIGN.md: no cambian.
- `Chip({ tono, children })` con `tono: 'al_dia' | 'terminada' | 'en_atencion' | 'en_riesgo' | 'atrasada' | 'vencida' | 'neutro'` (píldora 12,5 px 600, punto 7 px en el tono base, fondo `-suave`, texto `-texto`). `ChipCategoria({ categoria: CategoriaPublica | null })`: punto 6 px en `color`, fondo `colorFondo`, texto `tinta`; `null` → «Sin categoría» en tono neutro.
- `formato.ts`: `fechaCorta(iso: string): string` (`'2026-11-09'` → `'9 nov 2026'`, sin `Date` local: usar `aDia` del motor), `diasEntre(desde: string, hasta: string): number`, `porcentaje(fraccion: number, decimales = 1): string` (`0.1251` → `'12,5 %'`), `hoyISO(): string` (fecha local del navegador).
- `api/charters.ts`: `CLAVES = { charters: ['charters'], charter: (id) => ['charter', id], categorias: ['categorias'], areas: ['areas'] }`; `useCharters()`, `useCharter(id)`, `useCategorias()`, `useAreas()` (estas dos con `staleTime` de 5 min), `useCrearCharter()`, `useEditarCharter(id)` (su `onSuccess` hace `setQueryData` del detalle e invalida `charters`), `useGuardarLista(id, tipo)`, `useEliminarCharter()` (quita la consulta del detalle e invalida `charters`).
- `cliente.ts`: si la respuesta no es JSON válido, lanza `ErrorCliente(estado, 'respuesta_invalida', 'El servidor respondió algo inesperado. Intenta de nuevo.')`.
- `RutaProtegida`: si `useSesion` falla con un error distinto de 401, muestra `Aviso` de conexión con «Reintentar» (refetch) en vez de ir a `/entrar`.
- `Layout({ ancho?: 'portafolio' | 'ficha' | 'texto', derecha?, children })`: `max-w-[1280px]` / `max-w-[1360px]` / `max-w-6xl` (por defecto `texto`). `derecha` por defecto es `<MenuUsuario />` (nombre y «Salir», extraídos de `Inicio`).

- [ ] **Step 1: Pruebas** en `base-fase3.test.tsx`: `fechaCorta('2026-11-09')` → `'9 nov 2026'`; `porcentaje(0.1251)` → `'12,5 %'`; `diasEntre('2026-10-19', '2026-11-09')` → `21`; `ChipCategoria` con `null` muestra «Sin categoría»; `api()` con cuerpo `'<html>'` y estado 502 lanza `codigo: 'respuesta_invalida'`; `RutaProtegida` con `/auth/yo` → 500 muestra «Reintentar» y no navega a `/entrar`.
- [ ] **Step 2:** `npm test -w @charter/web -- base-fase3` → FALLA.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w @charter/web` → PASAN.
- [ ] **Step 5:** Commit `Agrega tokens del semáforo, chips y cliente de charters`.

---

### Task 5: Portafolio

**Files:**
- Create: `apps/web/src/pantallas/portafolio/{Portafolio.tsx,FiltrosPortafolio.tsx,FilaCharter.tsx,DialogoNuevoCharter.tsx,filtrar.ts}`
- Modify: `apps/web/src/app/rutas.tsx` (`/` → `Portafolio`); Delete: `apps/web/src/pantallas/Inicio.tsx`
- Test: `apps/web/test/portafolio.test.tsx`

**Interfaces:**
- Consumes: `useCharters`, `useCategorias`, `useAreas`, `useCrearCharter`, `Chip`, `ChipCategoria`, `formato`, `Dialogo`, `Campo`, `Boton`, `Layout ancho="portafolio"`.
- Produces: `filtrarCharters(lista: CharterResumen[], f: FiltrosPortafolio): CharterResumen[]` con `FiltrosPortafolio = { texto: string; categoria: 'todas' | 'ninguna' | string; area: 'todas' | string; estado: 'todos' | EstadoCharter | 'sin_cortes' }`. El texto busca en nombre, código y responsable, sin distinguir mayúsculas ni tildes (`normalize('NFD')`).
- Filtros en la URL (`useSearchParams`: `q`, `categoria`, `area`, `estado`), así sobreviven a recargar y a volver atrás. El filtro de área solo aparece si algún charter tiene área.
- Lista de columnas fijas (maqueta): charter (nombre en `tinta`, `ChipCategoria`, responsable y código) · avance · estado · último corte. Sin corte, las columnas de avance y estado muestran «Sin cortes» y «Registra el primer corte» en `texto-2`; la mini curva S, el semáforo y las vencidas llegan con T5.5. Con corte: real de planeado (`porcentaje`), `fechaCorta` y «hace n días» (en `amarillo-texto` si pasan de 21). Un charter pausado, cerrado o cancelado lleva un `Chip` neutro con su estado junto al nombre. Toda la fila es un enlace a `/charters/:id`.
- Bajo 768 px cada charter se apila (nombre, avance + estado, último corte). Entrada escalonada (35 ms, hasta 12 filas).
- `DialogoNuevoCharter`: nombre (obligatorio, con foco), categoría (`select` de las activas, opcional) y razón de ser (opcional, `textarea`). «Crear charter» queda en `cargando` mientras responde (evita el doble envío) y al terminar navega a `/charters/:id`. Los errores de campo de la API se pintan en su campo.
- Estados: sin charters («Aún no tienes charters», qué es un charter en una línea y «+ Nuevo charter»); sin resultados («Ningún charter coincide» y «Limpiar filtros»); cargando (`Cargando`); error (`Aviso` con «Reintentar»).
- Contador «n de m charters».

- [ ] **Step 1: Pruebas** en `portafolio.test.tsx` (con `fetch` simulado):
  - `filtrarCharters`: «potenciacion» encuentra «Potenciación…»; `categoria: 'ninguna'` deja solo los sin categoría; `estado: 'sin_cortes'` deja los de `ultimoCorte: null`.
  - Sin charters se ve «Aún no tienes charters»; con 3, «3 de 3 charters» y tres enlaces a `/charters/<id>`.
  - Escribir en la búsqueda filtra y actualiza el contador; «Limpiar filtros» los quita.
  - Corte de hace 30 días muestra «hace 30 días»; un charter sin cortes muestra «Registra el primer corte».
  - Nuevo charter: nombre vacío no envía y muestra «Escribe el nombre del charter»; con nombre envía `POST /api/charters` una sola vez aunque se haga doble clic y navega a `/charters/<id>`.
- [ ] **Step 2:** `npm test -w @charter/web -- portafolio` → FALLA.
- [ ] **Step 3:** Implementar siguiendo `portafolio.html` (frontend-design / impeccable para el detalle visual).
- [ ] **Step 4:** `npm test -w @charter/web` → PASAN.
- [ ] **Step 5:** Commit `Agrega el portafolio con filtros y creación de charters`.

---

### Task 6: Ficha: estructura, edición en sitio y guardado automático

**Files:**
- Create: `apps/web/src/pantallas/ficha/{Ficha.tsx,BandaEstado.tsx,IndiceFicha.tsx,SeccionEncabezado.tsx,SeccionRazon.tsx,colaGuardado.ts}`
- Create: `apps/web/src/componentes/TextoEditable.tsx`
- Modify: `apps/web/src/app/rutas.tsx` (`/charters/:id` → `Ficha`)
- Test: `apps/web/test/ficha.test.tsx`, `apps/web/test/cola-guardado.test.ts`

**Interfaces:**
- Consumes: `useCharter`, `useEditarCharter`, `useCategorias`, `useAreas`, `ChipCategoria`, `Layout ancho="ficha"`.
- Produces: `useColaGuardado(): { estado: 'guardado' | 'guardando' | 'error'; ultimoGuardado: string | null; error: ErrorCliente | null; encolar(tarea: () => Promise<unknown>): void; reintentar(): void }`. Ejecuta las tareas **de una en una y en orden**; si una falla se detiene, pasa a `error` y `reintentar` la vuelve a lanzar. Mientras haya tareas pendientes registra `beforeunload`. La ficha la comparte por `ContextoGuardado` (la usan las Tasks 7 y 8).
- Produces: `TextoEditable({ etiqueta, valor, alGuardar(v: string): void, multilinea?, placeholder?, maximo?, requerido?: string, soloLectura?, como?: 'titulo' | 'texto' })`. Es un `textarea` con `field-sizing: content` (o `input` si no es multilínea) estilizado como texto: hover con fondo tenue y subrayado interior de 1 px, foco con anillo `acento` de 2 px. Llama a `alGuardar` al salir del campo y tras 800 ms sin teclear, solo si el valor recortado cambió. Escape revierte; Enter en una línea sale del campo. Si `requerido` y el valor queda vacío, no guarda, revierte y muestra el mensaje `requerido`. La `etiqueta` va como `aria-label`. Con `soloLectura` es texto plano.
- Estructura (maqueta, sin las secciones de fases posteriores):
  - **Banda de estado fija** bajo la banda institucional: miga «Mis charters / nombre», nombre, `Chip` «Sin cortes» (neutro) y la ranura de acciones que llena la Task 8. Planeado, real, brecha y «Registrar corte» llegan en las Fases 4 y 5.
  - **Índice lateral** (216 px): Encabezado, Razón de ser, Objetivos (contador), Supuestos y éxito (contador); marca la sección visible (`IntersectionObserver`) y abajo el estado de la cola: «Guardando…», «Guardado hace un momento» (punto `ok`) o «No se pudo guardar · Reintentar» (`alerta-texto`). Bajo 1024 px pasa a una fila deslizable fija.
  - **Hoja:** encabezado (nombre como titular editable con `requerido`; línea con código editable, área y «creado el …»; ficha de 4 celdas: responsable, patrocinador, categoría con `select`, revisión), y razón de ser y objetivo general a dos columnas (una sola bajo 768 px).
  - Los `select` de categoría y área listan las activas más la actual, rotulada «(inactiva)» si lo está. El área solo se muestra si hay áreas en el catálogo o el charter tiene una.
- Cada `alGuardar` encola `PATCH /api/charters/:id` con solo ese campo. Un 404 muestra «No encontramos ese charter» con enlace al portafolio.

- [ ] **Step 1: Pruebas** en `cola-guardado.test.ts`: dos tareas encoladas seguidas, la primera más lenta, terminan en orden (1, 2); si la primera falla, la segunda no corre hasta `reintentar`; con una tarea pendiente se registra el listener de `beforeunload` y se quita al vaciarse.
- [ ] **Step 2: Pruebas** en `ficha.test.tsx` (con `fetch` simulado):
  - Carga el detalle y muestra nombre, responsable, razón de ser y el índice.
  - Cambiar el responsable y salir del campo envía `PATCH` con `{ responsable: '…' }` y el índice termina en «Guardado hace un momento».
  - Dos ediciones seguidas del objetivo general con la API lenta envían dos `PATCH` en orden y el último cuerpo trae el segundo valor.
  - Borrar el nombre y salir no envía nada, restaura el nombre y muestra «Escribe el nombre del charter».
  - Un `PATCH` que responde 500 muestra «No se pudo guardar»; «Reintentar» lo reenvía.
  - Con la categoría del charter inactiva, el `select` la muestra con «(inactiva)».
- [ ] **Step 3:** `npm test -w @charter/web -- ficha cola-guardado` → FALLA.
- [ ] **Step 4:** Implementar siguiendo `ficha.html` (frontend-design / impeccable para el detalle visual y el movimiento).
- [ ] **Step 5:** `npm test -w @charter/web` → PASAN.
- [ ] **Step 6:** Commit `Agrega la ficha con edición en sitio y guardado automático`.

---

### Task 7: Ficha: listas ordenables

**Files:**
- Create: `apps/web/src/pantallas/ficha/{ListaEditable.tsx,SeccionObjetivos.tsx,SeccionSupuestos.tsx}`
- Test: `apps/web/test/lista-editable.test.tsx`

**Interfaces:**
- Consumes: `useGuardarLista`, `ContextoGuardado`, `TextoEditable`.
- Produces: `ListaEditable({ titulo, tipo: TipoLista, items: ItemLista[], textoAgregar: string, textoVacio: string, numerada?: boolean, soloLectura?: boolean })`.
  - Estado local `{ clave, texto }[]`; la `clave` es el id del servidor al cargar o un id local al agregar, y **no se reemplaza** tras guardar (así no se pierde el foco). Se envían solo los textos no vacíos.
  - Cada cambio (texto guardado, agregar con texto, quitar, mover) encola un `PUT` de la lista completa.
  - Teclado: Enter al final de un ítem crea uno nuevo debajo con el foco; Retroceso en un ítem vacío lo quita y enfoca el anterior; Alt + ↑ / ↓ lo mueve. Botones «Subir», «Bajar» y «Quitar» (íconos SVG de 16 px con `aria-label`) visibles al pasar o con foco en la fila. El movimiento se anima con `layout` de Motion.
  - Vacía: `textoVacio` en `texto-2` y el botón fantasma `textoAgregar`.
- Secciones: «Objetivos específicos» (`objetivo`, numerada, «+ Agregar objetivo»); «Supuestos» (`supuesto`) y «Criterios de éxito» (`criterio_exito`) a dos columnas. El índice muestra sus contadores.

- [ ] **Step 1: Pruebas** en `lista-editable.test.tsx`:
  - «+ Agregar objetivo», escribir «Capacitar usuarios» y salir envía `PUT …/listas/objetivo` con `{ items: [{ texto: 'Capacitar usuarios' }] }`.
  - Con 3 ítems, Alt + ↓ en el primero envía el orden 2, 1, 3 y el foco sigue en el ítem movido.
  - «Quitar» en el segundo envía los otros dos.
  - Un ítem agregado y dejado vacío no se envía.
  - Retroceso en un ítem vacío lo quita y enfoca el anterior.
  - Con `soloLectura` no hay campos ni botones.
- [ ] **Step 2:** `npm test -w @charter/web -- lista-editable` → FALLA.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w @charter/web` → PASAN.
- [ ] **Step 5:** Commit `Agrega las listas ordenables de la ficha`.

---

### Task 8: Ficha: estado del charter, solo lectura y eliminar

**Files:**
- Create: `apps/web/src/pantallas/ficha/MenuCharter.tsx`
- Modify: `apps/web/src/pantallas/ficha/{Ficha.tsx,BandaEstado.tsx}`, `apps/web/src/pantallas/ficha/colaGuardado.ts` (manejo de 401 y 409)
- Test: `apps/web/test/ficha-estado.test.tsx`

**Interfaces:**
- Consumes: `useEditarCharter`, `useEliminarCharter`, `Dialogo`, `Chip`, `Aviso`.
- Produces: `MenuCharter` en la banda de estado: botón con el estado actual («Activo ▾» con ícono SVG, no carácter) que abre un menú (`role="menu"`, flechas y Escape) con «Activo», «Pausado», «Cerrado», «Cancelado» y, separado, «Eliminar charter…».
  - Pasar a cerrado o cancelado pide confirmación en `Dialogo`: «El charter quedará en solo lectura. Podrás reabrirlo cuando quieras.»
  - Eliminar pide confirmación con el nombre del charter y botón `peligro` «Eliminar charter»; al terminar va a `/` y el charter ya no está en la lista.
- **Solo lectura:** la ficha se pinta con `soloLectura = !detalle.permisos.editar` (todos los `TextoEditable`, `select` y `ListaEditable` sin controles). Si `permisos.reabrir`, un `Aviso` arriba de la hoja dice «Este charter está cerrado.» (o «cancelado») con el botón «Reabrir» (`PATCH { estado: 'activo' }`). Si no es el dueño (Admin), el aviso dice «Charter de {propietario.nombre} · solo lectura» y no hay `MenuCharter`.
- **Errores de la cola:** 401 → limpia la sesión (`setQueryData(CLAVE_SESION, null)`) y la ruta protegida lleva a `/entrar`; 409 `charter_cerrado` → descarta lo pendiente, recarga el detalle (queda en solo lectura) y muestra el mensaje de la API.

- [ ] **Step 1: Pruebas** en `ficha-estado.test.tsx`:
  - Elegir «Cerrado» y confirmar envía `PATCH { estado: 'cerrado' }`; con la respuesta, los campos quedan como texto y aparece «Reabrir»; «Reabrir» envía `PATCH { estado: 'activo' }`.
  - «Pausado» no pide confirmación.
  - Detalle con `permisos: { editar: false, reabrir: false }` y otro propietario muestra «Charter de Beto Ruiz · solo lectura» y ningún botón de menú.
  - Eliminar: confirmar envía `DELETE` y navega a `/`.
  - Un `PATCH` que responde 409 `charter_cerrado` deja la ficha en solo lectura con el mensaje; uno que responde 401 manda a `/entrar`.
- [ ] **Step 2:** `npm test -w @charter/web -- ficha-estado` → FALLA.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** `npm test -w @charter/web` → PASAN.
- [ ] **Step 5:** Commit `Agrega el estado del charter, el modo de solo lectura y el borrado`.

---

### Task 9: Cierre de la fase

**Files:**
- Modify: `PENDIENTES.md`, `CLAUDE.md`, `docs/pantallas.md` (lo que cambió al construir)

- [ ] **Step 1:** `npm test`, `npm run lint` y `npm run build` → todo en verde. Anotar el total de pruebas.
- [ ] **Step 2:** Navegador (Playwright) con `npm run dev`: registrar, crear dos charters, filtrar, editar encabezado, razón de ser y listas, recargar y ver los cambios, cerrar y reabrir, eliminar. Capturas a 1440 y 390 px del portafolio (vacío y con charters) y de la ficha. Una sola ronda de ajustes visuales. Matar **todo** el árbol de `npm run dev` al terminar.
- [ ] **Step 3:** Marcar T3.1–T3.3 en `PENDIENTES.md`, el pendiente de contraste de categoría y el de conexión en `/auth/yo`; registrar la sesión. Actualizar «Estado actual» de `CLAUDE.md`.
- [ ] **Step 4:** Commit `Cierra la Fase 3`.
