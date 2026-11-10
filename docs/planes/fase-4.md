# Fase 4 · Cronograma y cortes — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El dueño arma el cronograma de su charter en un Gantt interactivo dentro de la ficha (detalle A–J en línea, K–N calculados al instante) y registra cortes de avance que guardan una foto de la línea base; la banda de estado y el historial muestran la situación al último corte.

**Architecture:** La API suma dos módulos, `cronograma` (GET/PUT del árbol completo en una transacción con número de versión) y `cortes` (lista, detalle, PUT por fecha y DELETE), siempre detrás de `cargarCharter`. Los totales de un corte se calculan con el motor sobre su foto. La web agrega la sección Cronograma a la ficha (estado local del árbol con operaciones puras, guardado automático por la cola existente), el historial de cortes y la pantalla `/charters/:id/corte`.

**Tech Stack:** el de la Fase 3. Sin dependencias nuevas: el Gantt es DOM + eventos de puntero (ECharts llega con la curva S en la Fase 5).

**Spec:** [docs/pantallas.md](../pantallas.md) §2 («Cronograma como Gantt») y §3, maquetas [ficha.html](../maquetas/ficha.html) y [corte.html](../maquetas/corte.html) · [docs/arquitectura.md](../arquitectura.md) §5.3, §5.4, §6 y §7 · [docs/analisis-plantilla-excel.md](../analisis-plantilla-excel.md) §4 · [DESIGN.md](../../DESIGN.md) · Plan maestro: [docs/plan-implementacion.md](../plan-implementacion.md) (T4.1–T4.5)

## Sesiones

| Sesión | Tareas | Resultado |
|---|---|---|
| 1 · Backend | 1–3 | Esquemas, API de cronograma y API de cortes con pruebas |
| 2 · Gantt | 4–6 | Cronograma editable en la ficha, con arrastre y escala |
| 3 · Cortes y cierre | 7–9 | Banda con cifras, historial, registrar corte, verificación de fase |

T4.5 (primer charter real) la hace el líder de TI después de la sesión 3; los ajustes se anotan en PENDIENTES.

## Decisiones de este plan *(criterio técnico)*

- **Guardado automático del cronograma** por la cola de la ficha (no botón explícito como decía la §7 de la arquitectura): la ficha es documento vivo y el Gantt se edita arrastrando. Se envía el árbol completo 800 ms después del último cambio. Se actualiza la arquitectura en la Task 9.
- **Versión entera** `charter.cronograma_version` (no `actualizado_en`) para el control de concurrencia: los `PATCH` del encabezado cambian `actualizado_en` y darían falsos 409.
- **PUT sobre una fecha con corte = editar ese corte:** cambia % real y nota, conserva la foto y recalcula totales (§5.3). Un corte nuevo toma la foto de la línea base vigente.
- **Situación actual** (banda, Gantt) = línea base vigente + avances del último corte, evaluada en la fecha de ese corte; sin cortes, a hoy con real 0. El selector de fecha es de la Fase 5.
- **Estado y vencidas de cada corte** se calculan al leer, desde su foto (pocos cortes × ≤ 500 hojas). Los totales guardados siguen sirviendo al portafolio.

## Global Constraints

- Todo lo de la Fase 3 sigue vigente (español de tú, `{ error: { codigo, mensaje, campos? } }`, `X-Requested-With: charter`, UUID v7, fechas `YYYY-MM-DD`, marcas ISO UTC, fracciones 0–1, `es-CO`: `9 nov 2026`, `12,5 %`, `useVariantes`, texto de estado con la variante `-texto`, `acento` = lo medido en cortes, selección y foco).
- Toda ruta usa `cargarCharter(db, id, usuario, modo)`: lectura para GET, `escritura` para PUT/DELETE (cerrado → 409 `charter_cerrado`, Admin → 403 `solo_lectura`).
- Límites: máximo **500 actividades** y **6 niveles**; nombre ≤ 300, entregable ≤ 1000, hasta 5 responsables de ≤ 120; nota del corte ≤ 2000; % real 0–1.
- Semáforo por brecha (PV − EV) en puntos con los umbrales del motor (10/25/50) y **vencida** vinotinto.
- Una hoja sin peso o sin fechas, o con fin antes del inicio, es **sin programar**: no entra en cortes ni totales.
- Ejecución directa: pruebas con cada tarea; suite completa, lint, build y una ronda de capturas al cerrar (Task 9). Commits en español, imperativo y breves, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **No hacer push.**

## Review Focus

1. **Id de actividad de otro charter en el PUT** (cliente malicioso o copia de datos): 400 `id_invalido`, nunca 500 ni modificar el otro charter. → Task 2.
2. **Dos pestañas editando el cronograma:** la segunda recibe 409 `cronograma_desactualizado`; la web muestra «El cronograma cambió en otra pestaña» con «Recargar» y no pisa nada. → Tasks 2 y 5.
3. **Eliminar una hoja con avances y luego editar ese corte pasado:** el corte conserva la fila «actividad eliminada» con su % y sus totales no cambian. → Task 3.
4. **Arrastres rápidos seguidos:** se envía un solo PUT por ráfaga (800 ms) y cada PUT lleva la versión que devolvió el anterior, aunque esté en vuelo. → Task 5.
5. **Bajar el % real de una hoja respecto al corte anterior:** se permite, pero la fila muestra «Baja frente al corte anterior (60 %)». Un corte con fecha anterior al último se rechaza al crear (400 `corte_anterior`). → Tasks 3 y 8.

---

## Sesión 1 · Backend

### Task 1: Esquemas compartidos de cronograma y cortes

**Files:**
- Create: `packages/shared/src/esquemas/cronograma.ts`, `packages/shared/src/calculo/cortes.ts`
- Modify: `packages/shared/src/esquemas/index.ts`, `packages/shared/src/calculo/index.ts`, `packages/shared/src/esquemas/actividad.ts` (límites de responsables)
- Test: `packages/shared/test/esquemas/cronograma.test.ts`, `packages/shared/test/calculo/cortes.test.ts`

**Interfaces:**
- Produces (Zod): `cronogramaEntrada = { version: number int ≥ 0, actividades: actividadEntrada[] (máx. 500, mensaje «El cronograma admite hasta 500 actividades») }`; `responsables` en `actividadEntrada` pasa a máx. 5 de ≤ 120.
- `corteEntrada = { nota: string trim ≤ 2000 (default ''), avances: { actividadId: string, pct: number 0–1 }[] }` (`.strict()`).
- Tipos de respuesta:
  ```ts
  interface CronogramaRespuesta {
    version: number
    actividades: ActividadEntrada[]          // con responsables, en orden
    ultimoCorte: { fecha: FechaISO; avances: AvancesPorHoja } | null  // avances con terminadaEn
  }
  interface AvanceFoto { actividadId: string; item: string; nombre: string; pct: number; peso: number | null; inicio: FechaISO | null; fin: FechaISO | null; eliminada: boolean }
  interface CorteResumen { fecha: FechaISO; nota: string; pv: number; ev: number; desv: number; estado: Estado; vencidas: number }
  interface CorteDetalle extends CorteResumen { avances: AvanceFoto[] }
  ```
- Motor (`calculo/cortes.ts`):
  - `terminacionesPorHoja(cortes: { fecha: FechaISO; avances: { actividadId: string; pct: number }[] }[]): Record<string, FechaISO>` — fecha del primer corte (por fecha ascendente) en que cada hoja llegó a ≥ 1 − 1e-9.
  - `totalesDeFoto(foto: Pick<AvanceFoto,'actividadId'|'item'|'nombre'|'pct'|'peso'|'inicio'|'fin'>[], fecha: FechaISO, terminadas?: Record<string, FechaISO>): ResultadoNodo` — arma cada fila como raíz suelta (`construirArbol`) y devuelve `calcularCronograma(...).proyecto`. Ponderar sobre hojas da el mismo total que el árbol.
  - `hojasProgramadas(raices: NodoArbol[]): NodoArbol[]` — hojas con peso > 0 y fechas válidas (mismo criterio que `calcularCronograma`).

- [ ] **Step 1: Pruebas** de esquemas: 501 actividades → error con el mensaje; 6 responsables → error; `corteEntrada` con `pct: 1.2` → error; campo extra → error.
- [ ] **Step 2: Pruebas** del motor: con el fixture `id-ti.json` como foto (hojas del Excel con su % real al 13-mar-2025), `totalesDeFoto(..., '2025-03-13')` da pv ≈ 0,1251 y ev ≈ 0,1247 (4 decimales); `terminacionesPorHoja` con cortes `[{2025-02-01, a:0.5}, {2025-03-01, a:1}, {2025-04-01, a:1}]` → `{ a: '2025-03-01' }`; `hojasProgramadas` excluye una hoja sin peso y una con fin < inicio.
- [ ] **Step 3:** `npm test -w @charter/shared` → FALLA; implementar; → PASAN.
- [ ] **Step 4:** Commit `Agrega esquemas y cálculos de cronograma y cortes`.

---

### Task 2: API de cronograma (T4.1)

**Files:**
- Create: `apps/api/src/modulos/cronograma/{servicio.ts,rutas.ts}`, migración nueva en `apps/api/drizzle/`
- Modify: `apps/api/src/db/esquema.ts` (`charter.cronogramaVersion: integer('cronograma_version').notNull().default(0)`), `apps/api/src/app.ts` (registrar bajo `/api/charters`)
- Test: `apps/api/test/cronograma.test.ts`

**Interfaces:**
- Consumes: `cargarCharter`, `cronogramaEntrada`, `construirArbol`, `terminacionesPorHoja`.
- Produces: `GET /api/charters/:id/cronograma` → `CronogramaRespuesta`. `PUT` mismo path con `cronogramaEntrada` → `CronogramaRespuesta` con `version + 1`.
- `servicio.ts`: `leerCronograma(db, charterId): CronogramaRespuesta`; `guardarCronograma(db, fila, entrada): CronogramaRespuesta`.
- Reglas del PUT, en este orden:
  1. `entrada.version !== fila.cronogramaVersion` → 409 `cronograma_desactualizado` «El cronograma cambió en otra pestaña. Recarga para ver la última versión.»
  2. `construirArbol` lanza `id_duplicado`, `padre_inexistente` o `ciclo` → 400 con ese código y mensaje «El cronograma no es válido.» Más de 6 niveles → 400 `demasiados_niveles`.
  3. Algún id ya existe en `actividad` con otro `charter_id` → 400 `id_invalido`.
  4. En una transacción: borrar las actividades del charter (cascada a responsables; `avance` no tiene FK y queda), insertar las nuevas con sus responsables (`orden` = posición en la lista), subir `cronograma_version` y tocar `actualizado_en`.
- `ultimoCorte.avances`: pct del corte de fecha mayor, con `terminadaEn` de `terminacionesPorHoja` sobre todos los cortes.

- [ ] **Step 1:** `npx drizzle-kit generate` dentro de `apps/api` (no hay script npm) y **revisar el SQL**: debe ser `ALTER TABLE charter ADD cronograma_version …`; si drizzle-kit recrea la tabla, revisar el `INSERT … SELECT`.
- [ ] **Step 2: Pruebas** en `cronograma.test.ts`:
  - Charter nuevo: `GET` → `{ version: 0, actividades: [], ultimoCorte: null }`.
  - `PUT` de 3 niveles (grupo → subgrupo → 2 hojas con 2 responsables) → `version: 1`; `GET` devuelve lo mismo y en orden.
  - Reordenar (cambiar `orden`) y volver a guardar con `version: 1` → `version: 2`, nuevo orden.
  - `PUT` con `version: 0` tras guardar → 409 `cronograma_desactualizado`.
  - Ids repetidos → 400 `id_duplicado`; padre inexistente → 400 `padre_inexistente`; 7 niveles → 400 `demasiados_niveles`.
  - Id de una actividad del charter de Beto en el PUT de Ana → 400 `id_invalido` y el cronograma de Beto queda igual.
  - Eliminar una hoja que tiene avance en un corte (insertado directo en la tabla) → 200 y el `avance` sigue en la base.
  - Charter cerrado → 409 `charter_cerrado`; Admin → `GET` 200, `PUT` 403; ajeno → 404.
- [ ] **Step 3:** `npm test -w @charter/api -- cronograma` → FALLA; implementar; → PASAN.
- [ ] **Step 4:** Commit `Agrega la API del cronograma con control de versión`.

---

### Task 3: API de cortes (T4.3)

**Files:**
- Create: `apps/api/src/modulos/cortes/{servicio.ts,rutas.ts}`, `apps/api/src/util/hoy.ts` (`hoyISO(): FechaISO` con la fecha local del servidor)
- Modify: `apps/api/src/app.ts`
- Test: `apps/api/test/cortes.test.ts`

**Interfaces:**
- Consumes: `cargarCharter`, `corteEntrada`, `fechaISO`, `construirArbol`, `hojasProgramadas`, `totalesDeFoto`, `terminacionesPorHoja`, `leerCronograma` (Task 2).
- Produces:
  - `GET /api/charters/:id/cortes` → `CorteResumen[]` por fecha ascendente.
  - `GET /api/charters/:id/cortes/:fecha` → `CorteDetalle` (404 `no_encontrado` si no hay corte). `eliminada = true` si la actividad ya no está en el cronograma.
  - `PUT /api/charters/:id/cortes/:fecha` con `corteEntrada` → `CorteDetalle`; 201 si lo creó, 200 si lo editó.
  - `DELETE /api/charters/:id/cortes/:fecha` → 204.
- **Crear** (no hay corte en esa fecha):
  - `fecha > hoyISO()` → 400 `fecha_futura` «La fecha de corte no puede ser posterior a hoy.»; `fecha` < último corte → 400 `corte_anterior` «Ya hay un corte más reciente. Edítalo o usa una fecha posterior.»; sin hojas programadas → 400 `sin_hojas_programadas`.
  - Foto = `hojasProgramadas` del cronograma vigente (item, nombre, peso, inicio, fin). Hojas que no vienen en `avances` toman el pct del corte anterior o 0. Un `actividadId` que no sea hoja programada → 400 `actividad_invalida`.
- **Editar** (ya existe): solo cambia pct de filas de la foto y la nota; un id fuera de la foto → 400 `actividad_invalida`.
- En ambos casos recalcula `pv/ev/desv_proyecto` con `totalesDeFoto(foto, fecha, terminaciones de cortes anteriores)` y toca `charter.actualizado_en`.
- `estado` y `vencidas` de cada `CorteResumen` salen de `totalesDeFoto` al leer.

- [ ] **Step 1: Pruebas** en `cortes.test.ts` (cronograma de 3 hojas: A 50 % ene–feb, B 30 % feb–mar, C 20 % sin fechas):
  - Corte completo `2026-02-15` con A 1, B 0,2 → 201; foto con A y B (C sin programar no entra); `pv`, `ev`, `desv` coinciden con `calcularCronograma` sobre el árbol vigente.
  - Mismo PUT otra vez con B 0,4 y otra nota → 200, un solo corte en la lista, totales recalculados.
  - **Foto intacta:** tras crear el corte, cambiar el peso de A en el cronograma; `GET` del corte conserva el peso viejo y los mismos totales.
  - **Hoja eliminada:** eliminar B del cronograma; el detalle trae B con `eliminada: true`; editar la nota del corte no cambia sus totales.
  - Corte omitiendo B → toma el pct del corte anterior.
  - `2999-01-01` → 400 `fecha_futura`; fecha anterior al último → 400 `corte_anterior`; id de C → 400 `actividad_invalida`; charter sin hojas programadas → 400 `sin_hojas_programadas`; `2026-02-30` → 400.
  - `GET /cortes` trae `estado` y `vencidas`; `DELETE` → 204 y el portafolio (`GET /charters`) refleja el corte anterior como último.
  - Cerrado → 409; Admin lee y no escribe; ajeno → 404.
- [ ] **Step 2:** `npm test -w @charter/api -- cortes` → FALLA; implementar; → PASAN.
- [ ] **Step 3:** `npm test -w @charter/api` completo → PASAN.
- [ ] **Step 4:** Commit `Agrega la API de cortes con foto de la línea base`.

---

## Sesión 2 · Gantt

### Task 4: Cliente y operaciones puras del árbol

**Files:**
- Create: `apps/web/src/api/cronograma.ts`, `apps/web/src/pantallas/ficha/cronograma/operaciones.ts`
- Modify: `apps/web/src/api/charters.ts` (`CLAVES.cronograma(id)`, `CLAVES.cortes(id)`, `CLAVES.corte(id, fecha)`), `apps/web/test/simular-api.ts` (rutas nuevas)
- Test: `apps/web/test/operaciones-cronograma.test.ts`

**Interfaces:**
- Produces (hooks): `useCronograma(id)`, `useGuardarCronograma(id)` (mutación `PUT`; escribe la respuesta en la caché), `useCortes(id)`, `useCorte(id, fecha | null)`, `useGuardarCorte(id)` (`{ fecha, entrada }`), `useEliminarCorte(id)`. Las mutaciones de cortes invalidan `cortes`, `cronograma`, `charter(id)` y la lista del portafolio.
- Produces (`operaciones.ts`, funciones puras sobre `ActividadEntrada[]`, devuelven una lista nueva con `orden` renumerado 0..n por padre):
  - `agregar(acts, despuesDe: string | null, id: string): ActividadEntrada[]` — hermana debajo de `despuesDe` (al final si es null), nombre ''.
  - `indentar(acts, id)` — pasa a ser la última hija de la hermana anterior; sin hermana anterior o en el nivel 6 → sin cambios.
  - `desindentar(acts, id)` — pasa a hermana siguiente de su padre; en el nivel 1 → sin cambios.
  - `mover(acts, id, delta: -1 | 1)` — entre hermanas.
  - `eliminar(acts, id)` — con todas sus descendientes.
  - `editar(acts, id, cambios: Partial<Omit<ActividadEntrada,'id'|'padreId'|'orden'>>)`.
  - `moverFechas(acts, id, dias: number, extremo: 'ambos' | 'inicio' | 'fin')` — con `sumarDias`; nunca deja fin < inicio (lo limita a la misma fecha).
  - `descendientes(acts, id): string[]`.

- [ ] **Step 1: Pruebas:** armar 1 › 1.1 › 1.1.1 solo con `agregar` + `indentar` y verificar ítems con `construirArbol`; `indentar` sin hermana anterior no cambia; `desindentar` de 1.1.1 queda 1.2; `mover(-1)` en la primera no cambia; `eliminar` del grupo quita sus 3 descendientes; `moverFechas(…, 3, 'fin')` sobre una barra de 2 días hacia la izquierda con `-5` deja fin = inicio; renumeración de `orden` sin huecos.
- [ ] **Step 2:** `npm test -w @charter/web -- operaciones-cronograma` → FALLA; implementar; → PASAN.
- [ ] **Step 3:** Commit `Agrega el cliente del cronograma y las operaciones del árbol`.

---

### Task 5: Sección Cronograma: filas, detalle A–J y guardado (T4.2)

**Files:**
- Create: `apps/web/src/pantallas/ficha/cronograma/{SeccionCronograma.tsx,FilaGantt.tsx,DetalleActividad.tsx,useBorradorCronograma.ts}`
- Modify: `apps/web/src/pantallas/ficha/{Ficha.tsx,IndiceFicha.tsx}` (sección «Cronograma» entre Objetivos y Supuestos, con contador de actividades y de avisos)
- Test: `apps/web/test/cronograma.test.tsx`

**Interfaces:**
- Consumes: Task 4, `ContextoGuardado` / `useColaGuardado`, `calcularCronograma`, `construirArbol`, `validarCronograma`, `Chip`, `Dialogo`.
- Produces: `useBorradorCronograma(id): { acts: ActividadEntrada[]; arbol: NodoArbol[]; calculo: ResultadoCronograma; avisos: Aviso[]; fechaCalculo: FechaISO; aplicar(op: (a: ActividadEntrada[]) => ActividadEntrada[]): void; conflicto: boolean; recargar(): void }`.
  - Estado local iniciado desde `useCronograma`; `aplicar` actualiza al instante y programa el guardado a 800 ms (reinicia en cada cambio). La tarea encolada lee la **versión vigente en un `ref`** al ejecutarse, y el `ref` se actualiza con cada respuesta.
  - 409 `cronograma_desactualizado` → `conflicto = true`, sin reintento: `Aviso` «El cronograma cambió en otra pestaña.» con «Recargar» (descarta el borrador y vuelve a leer). Otros errores siguen el flujo de la cola (401, 409 `charter_cerrado`).
  - `fechaCalculo` = fecha del último corte o hoy; los avances salen de `ultimoCorte`.
- UI (seguir `ficha.html`; impeccable / frontend-design para el detalle):
  - Columnas: ítem · actividad sangrada por nivel · peso · estado (chip del semáforo o «n vencidas») · pista (Task 6 la llena; aquí una barra simple proporcional al rango del proyecto).
  - Agrupadoras en negrita, plegables (botón con `aria-expanded`), con peso = suma de sus hojas.
  - **Clic o Enter en la fila** abre el detalle en línea debajo (sin modal): actividad, entregable, peso (en %, 0–100 con coma decimal), inicio, fin (`input type="date"`), responsables (hasta 5; Enter agrega, Retroceso en vacío quita). En agrupadoras, peso y fechas se muestran calculados y no editables. Debajo, K–N en solo lectura: planeado, real, desviación, duración y forecast.
  - Con el foco en una fila: Tab sangra, Mayús + Tab saca de nivel, Alt + ↑/↓ mueve; tras mover, reenfocar la fila.
  - «+ Agregar actividad» al final y «Agregar debajo» en el detalle; nueva fila con el campo actividad enfocado.
  - «Eliminar» en el detalle: si la actividad o sus hijas tienen avance en `ultimoCorte`, `Dialogo` «Tiene avances registrados. Los cortes pasados los conservan.»; si no, elimina directo.
  - Avisos de `validarCronograma` en línea: el de pesos arriba de la tabla («Los pesos suman 95 %»), los de fila junto a su ítem.
  - Vacío: «Aún no hay actividades» + «+ Agregar actividad».
  - Solo lectura: sin controles de edición; el detalle se abre igual, como texto.
  - Bajo 768 px: solo actividad y pista, de consulta.

- [ ] **Step 1: Pruebas** en `cronograma.test.tsx` (`vi.useFakeTimers` para los 800 ms):
  - Con cronograma vacío, «+ Agregar actividad», escribir «Diseño», Enter, agregar «Maqueta», Tab → «Maqueta» queda como 1.1; tras 800 ms sale **un** `PUT` con `version: 0` y las dos actividades.
  - Escribir peso «40» y fechas en una hoja → la fila muestra el estado y el planeado calculado coincide con `calcularCronograma` sobre las mismas actividades.
  - Dos cambios con la API lenta: el segundo `PUT` sale después del primero y lleva `version: 1` (la que devolvió el primero).
  - `PUT` que responde 409 `cronograma_desactualizado` → «El cronograma cambió en otra pestaña.»; «Recargar» vuelve a pedir el `GET`.
  - Pesos que suman 95 % → «Los pesos suman 95 %».
  - Eliminar una hoja con avance en `ultimoCorte` pide confirmación; una sin avance no.
  - Con `permisos.editar: false` no hay «+ Agregar actividad» ni campos.
- [ ] **Step 2:** `npm test -w @charter/web -- cronograma` → FALLA; implementar; → PASAN.
- [ ] **Step 3:** Commit `Agrega el cronograma editable a la ficha`.

---

### Task 6: Pista del Gantt: escala, arrastre y teclado

**Files:**
- Create: `apps/web/src/pantallas/ficha/cronograma/{PistaGantt.tsx,escala.ts}`
- Modify: `FilaGantt.tsx`, `SeccionCronograma.tsx`
- Test: `apps/web/test/escala-gantt.test.ts`, casos nuevos en `apps/web/test/cronograma.test.tsx`

**Interfaces:**
- Produces (`escala.ts`, puras): `type Escala = 'trimestre' | 'semestre' | 'anio'`; `rangoVisible(arbol, escala, hoy): { desde: FechaISO; hasta: FechaISO }` (cubre el proyecto completo con margen de 7 días y al menos la duración de la escala); `aPorcentaje(fecha, rango): number`; `diasPorPixel(rango, anchoPx): number`; `marcas(rango, escala): { fecha: FechaISO; etiqueta: string }[]` (meses en trimestre/semestre, trimestres en año).
- `PistaGantt({ nodo, resultado, rango, alMover(dias, extremo), soloLectura })`:
  - Hoja: barra de línea base con el real pintado con el color del semáforo; agrupadora: barra resumen delgada con su avance.
  - **Arrastre** con Pointer Events y `setPointerCapture`: el centro mueve (`'ambos'`), los extremos (6 px) cambian `'inicio'` o `'fin'`. Durante el arrastre la barra se desplaza en vivo y un tooltip muestra «12 feb – 3 mar · 20 días»; al soltar llama `alMover` una vez (redondeo a días) y la fila destella (Motion, respeta movimiento reducido).
  - **Teclado** (barra con `tabIndex=0`, `role="slider"` y `aria-valuetext` con las fechas): ← → mueven un día; Mayús + ← → cambian el fin.
  - Línea de corte vertical en `acento` en `fechaCalculo`.
- Selector de escala (Trimestre · Semestre · Año) en la cabecera de la sección; las marcas en la cabecera de la pista.

- [ ] **Step 1: Pruebas** de `escala.ts`: rango de un proyecto ene–mar en escala año dura ≥ 365 días y contiene ene–mar; `aPorcentaje(desde) = 0` y `aPorcentaje(hasta) = 100`; `marcas` en trimestre devuelve meses con etiqueta «ene», «feb»…
- [ ] **Step 2: Pruebas** en `cronograma.test.tsx`: foco en la barra y → mueve inicio y fin un día y programa el `PUT`; Mayús + ← solo cambia el fin; un `pointerdown`/`pointermove`/`pointerup` simulado sobre el extremo derecho con `diasPorPixel` conocido mueve solo el fin; en solo lectura la barra no es `slider`.
- [ ] **Step 3:** `npm test -w @charter/web -- escala-gantt cronograma` → FALLA; implementar; → PASAN.
- [ ] **Step 4:** Commit `Agrega el arrastre, el teclado y la escala del Gantt`.

---

## Sesión 3 · Cortes y cierre

### Task 7: Banda de estado con cifras e historial de cortes

**Files:**
- Create: `apps/web/src/pantallas/ficha/SeccionHistorial.tsx`, `apps/web/src/componentes/Cifra.tsx` (número animado)
- Modify: `apps/web/src/pantallas/ficha/{BandaEstado.tsx,Ficha.tsx,IndiceFicha.tsx}`
- Test: `apps/web/test/historial.test.tsx`

**Interfaces:**
- Consumes: `useBorradorCronograma` (situación actual), `useCortes`, `useEliminarCorte`, `Chip`, `Dialogo`.
- Produces: `Cifra({ valor: number, formato: (n) => string })` — anima de su valor anterior al nuevo en 400 ms con Motion (`useVariantes`; sin animación si hay movimiento reducido).
- **Banda:** el chip «Sin cortes» pasa a ser el estado del proyecto (o «Sin cortes» si no hay); se suman planeado, real, brecha (con `-texto` del semáforo), vencidas (enlace a la sección Cronograma), «Último corte 9 nov 2026» y el botón primario «Registrar corte» (enlace a `/charters/:id/corte`; oculto en solo lectura). Las cifras usan `Cifra` y se recalculan al editar el cronograma.
- **Historial** (al final de la hoja, sección «Cortes» en el índice con contador): tabla fecha · estado · planeado · real · brecha · nota (recortada a una línea). Cada fila: «Editar» (va a `/charters/:id/corte?fecha=…`) y «Eliminar» con `Dialogo` «Se eliminará el corte del 9 nov 2026. Sus avances no se pueden recuperar.». Vacío: «Aún no hay cortes. Registra el primero cuando arranque el trabajo.»

- [ ] **Step 1: Pruebas** en `historial.test.tsx`: con 2 cortes la tabla los lista del más reciente al más viejo con «12,5 %»; la banda muestra el planeado y el real del último y «Último corte 9 nov 2026»; eliminar confirma, envía `DELETE …/cortes/2026-11-09` y la fila desaparece; en solo lectura no hay «Registrar corte» ni «Eliminar».
- [ ] **Step 2:** `npm test -w @charter/web -- historial` → FALLA; implementar; → PASAN.
- [ ] **Step 3:** Commit `Agrega las cifras de la banda y el historial de cortes`.

---

### Task 8: Pantalla Registrar corte (T4.4)

**Files:**
- Create: `apps/web/src/pantallas/corte/{RegistrarCorte.tsx,FilaAvance.tsx,clasificar.ts}`
- Modify: `apps/web/src/app/rutas.tsx` (`/charters/:id/corte`)
- Test: `apps/web/test/clasificar-corte.test.ts`, `apps/web/test/registrar-corte.test.tsx`

**Interfaces:**
- Consumes: `useCronograma`, `useCortes`, `useCorte`, `useGuardarCorte`, `hojasProgramadas`, `calcularCronograma`, `Cifra`, `Chip`.
- Produces (`clasificar.ts`, pura): `clasificarHojas(hojas: NodoArbol[], pcts: Record<string, number>, fecha: FechaISO): { vencidas: NodoArbol[]; enCurso: NodoArbol[]; resto: NodoArbol[] }` — vencidas: fin < fecha y pct < 1; en curso: inicio ≤ fecha ≤ fin y pct < 1; resto: lo demás. Cada grupo en orden de ítem.
- Pantalla (seguir `corte.html`):
  - **Modo nuevo** (sin `?fecha`): fecha por defecto hoy, mínimo el día siguiente al último corte, máximo hoy; referencia «Corte anterior: 2 nov 2026». Precarga cada hoja con el pct del último corte.
  - **Modo editar** (`?fecha=…`): fecha fija, hojas y pesos de la **foto** del corte (`useCorte`), filas `eliminada` rotuladas «actividad eliminada»; nota precargada.
  - Grupos «Vencidas», «En curso» y «Mostrar las n restantes» (plegado). Al cambiar la fecha se reclasifican.
  - Fila: actividad, ítem, responsable, fin · «Antes 40 %» · campo % (0–100, coma decimal) con atajo «100 %» · chip de estado en vivo · barra de real con marca del planeado a la fecha. Filas cambiadas se tiñen. Si el % baja frente al anterior: «Baja frente al corte anterior (60 %)» en `atencion-texto`.
  - **Resumen fijo a la derecha** (barra fija abajo bajo 768 px): chip, planeado, real y brecha con `Cifra`; nota (≤ 2000); «Cancelar» (vuelve a la ficha) y «Guardar corte». Guardar envía solo `{ nota, avances }` de todas las hojas mostradas, vuelve a la ficha y muestra «Corte guardado».
  - Errores de la API (`corte_anterior`, `fecha_futura`, `sin_hojas_programadas`) se muestran junto al botón con su mensaje. Sin hojas programadas, la pantalla lo dice de entrada con enlace al cronograma.
  - Solo lectura (cerrado o Admin): redirige a la ficha.
  - La mini curva S del resumen queda para la Fase 5.

- [ ] **Step 1: Pruebas** de `clasificarHojas`: al 2026-03-10, hoja con fin 2026-03-01 y pct 0,5 → vencida; con pct 1 → resto; hoja 2026-03-01 a 2026-03-31 → en curso; hoja que inicia en abril → resto.
- [ ] **Step 2: Pruebas** en `registrar-corte.test.tsx`: precarga los pct del último corte y muestra «Antes 40 %»; escribir 100 en una vencida la saca de vencidas tras cambiar la fecha; bajar de 60 a 50 muestra el aviso; «Guardar corte» envía `PUT …/cortes/<hoy>` con todas las hojas y navega a la ficha; con `?fecha=` usa la foto y muestra «actividad eliminada»; un 400 `corte_anterior` muestra su mensaje.
- [ ] **Step 3:** `npm test -w @charter/web -- clasificar-corte registrar-corte` → FALLA; implementar; → PASAN.
- [ ] **Step 4:** Commit `Agrega la pantalla para registrar cortes`.

---

### Task 9: Cierre de la fase

**Files:**
- Modify: `PENDIENTES.md`, `CLAUDE.md`, `docs/arquitectura.md` (§5.3 versión del cronograma, §6 rutas y códigos nuevos, §7 guardado automático), `docs/pantallas.md` (lo que cambió al construir)

- [ ] **Step 1:** `npm test`, `npm run lint` y `npm run build` → todo en verde. Anotar el total de pruebas.
- [ ] **Step 2:** Navegador (Playwright) con `npm run dev`: crear charter, armar un cronograma de 3 niveles con teclado y ratón, arrastrar barras, recargar y verlo igual; registrar dos cortes (uno desde 390 px), editar el primero, cambiar un peso y comprobar que el historial no cambia; eliminar una hoja con avances. Capturas a 1440 y 390 px de la ficha con cronograma y de Registrar corte. Revisar la consola. Una sola ronda de ajustes visuales. Matar **todo** el árbol de `npm run dev` al terminar.
- [ ] **Step 3:** Marcar T4.1–T4.4 en `PENDIENTES.md` (T4.5 queda para el líder de TI), registrar la sesión y actualizar «Estado actual» y «Decisiones» de `CLAUDE.md`.
- [ ] **Step 4:** Commit `Cierra la Fase 4`.
