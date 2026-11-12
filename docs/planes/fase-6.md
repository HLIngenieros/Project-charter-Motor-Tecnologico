# Fase 6 · Indicadores, riesgos y presupuesto — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La ficha gana las secciones Indicadores (solo definición), Riesgos (tabla + matriz probabilidad × impacto) y Presupuesto (total + barras por rubro con desglose), editables en su sitio, en el PDF y en el JSON.

**Architecture:** Esquemas y cálculos puros en `shared` (nivel de riesgo, valor de rubro, total). La API reemplaza cada colección completa con un PUT que conserva los ids que genera la web (upsert + borrado de los que faltan) y las devuelve en `CharterDetalle`. En la web, un hook genérico `useColeccion` maneja la copia local, el guardado por la cola de la ficha y agregar/quitar/mover; cada sección arma su tabla encima.

**Tech Stack:** el del proyecto (React + Vite + Tailwind + Motion, Fastify + Drizzle + Postgres/PGlite, Zod, Vitest). Sin dependencias nuevas (`uuid` ya está en la web).

**Spec:** [docs/superpowers/specs/2026-11-12-fase-6-complementos-design.md](../superpowers/specs/2026-11-12-fase-6-complementos-design.md) (manda sobre este plan) · [DESIGN.md](../../DESIGN.md) · maqueta [docs/maquetas/ficha.html](../maquetas/ficha.html).

## Sesiones

| Sesión     | Tareas | Resultado                                                       |
| ---------- | ------ | --------------------------------------------------------------- |
| 1 · Datos  | 1–2    | Esquemas y cálculos; migración, servicio, rutas, detalle y JSON |
| 2 · Ficha  | 3–4    | `useColeccion`, Indicadores y Riesgos con matriz en la ficha    |
| 3 · Cierre | 5–6    | Presupuesto, PDF, verificación completa, documentación y RF1    |

## Decisiones de este plan _(criterio técnico)_

- `CharterDetalle` gana `indicadores: Indicador[]`, `riesgos: Riesgo[]` y `rubros: Rubro[]` (cada rubro con `lineas`). Como `ExportacionCharter.charter` es el detalle, el JSON los trae solo; además se agrega `complementos` con lo calculado.
- Rutas: `PUT /api/charters/:id/indicadores` `{ items }`, `PUT …/riesgos` `{ items }`, `PUT …/presupuesto` `{ rubros }`. Responden la colección guardada (rubros con el valor calculado).
- Ids: la web genera UUID v7. En la transacción: id repetido en el cuerpo → 400 `id_duplicado`; id que existe en otro charter (o línea de un rubro de otro charter) → 400 `id_ajeno`; se borran las filas propias que no vienen y se hace upsert de las demás (`onConflictDoUpdate`), nunca borrar y reinsertar (las mediciones cuelgan de `indicador` con cascade).
- Guardado web: igual que `ListaEditable` — 800 ms tras dejar de escribir, inmediato al salir de un campo, al cambiar un selector, al agregar, quitar o mover. La copia local nunca adopta la respuesta de la API (los ids ya son estables).
- Una sola migración `0001_complementos`: `riesgo.probabilidad` e `riesgo.impacto` `integer` nulos; `indicador.meta_valor` sin `NOT NULL` ni default.

## Global Constraints

- Todo lo de las Fases 3–5 y parametrización sigue vigente: español de tú, formato `es-CO`, `{ error: { codigo, mensaje } }`, `cargarCharter(…, 'escritura')` en todo PUT, Admin de solo lectura en charters ajenos, 409 `charter_cerrado`, `useVariantes`/movimiento reducido, contraste del semáforo.
- Orden en ficha, índice y PDF: encabezado · razón y objetivos · curva S · cronograma · supuestos y éxito · **indicadores · riesgos · presupuesto** · cortes.
- Escala de riesgos 1–5. Etiquetas: 1 Muy baja · 2 Baja · 3 Media · 4 Alta · 5 Muy alta (probabilidad); 1 Muy bajo · 2 Bajo · 3 Medio · 4 Alto · 5 Muy alto (impacto).
- Nivel = probabilidad × impacto: 1–4 `bajo` (tokens `ok`), 5–9 `medio` (`amarillo`), 10–15 `alto` (`naranja`), 16–25 `critico` (`alerta`). Sin alguno de los dos: «Sin calificar», chip neutro, fuera de la matriz.
- Valor de rubro con líneas = `Math.round(Σ cantidad × valorUnitario)`; sin líneas = valor escrito. Total = Σ valores. Valores, cantidades y precios ≥ 0.
- Límites: 50 filas por colección, 50 líneas por rubro; textos cortos (riesgo, nombre, descripción, concepto) 300 caracteres, largos (causa, mitigación, fórmula, observaciones) 1000, unidad 40; valores hasta 10¹³ COP.
- Copy fijo: «Aún no hay indicadores.» / «Agregar indicador» · «Aún no hay riesgos.» / «Agregar riesgo» · «Aún no hay presupuesto.» / «Agregar rubro» · «Agregar línea» · «Presupuesto total» · «Sin meta» · «Sin calificar» · «Sin descripción» · chip «Alto · 12».
- Ejecución directa; pruebas con cada tarea; suite completa, lint, build y una ronda de navegador al cerrar (Task 6). Commits en español, imperativo y breves, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **No hacer push.**

## Review Focus

1. **Editar un indicador que ya tiene mediciones** (filas en `medicion` sembradas a mano): tras el PUT, las mediciones siguen ahí. → Task 2.
2. **Rubro con líneas y un `valor` enviado distinto** (p. ej. 2,5 × 3.333 y `valor: 1`): se guarda 8.333 y el total de la ficha cuadra con la suma de las barras. → Tasks 1 y 2.
3. **Seis riesgos en la misma casilla**: la casilla muestra 3 puntos y «+3»; los seis siguen en la tabla y la casilla tiene nombre accesible con todos. → Task 4.
4. **Una fila con datos pero sin texto** (riesgo con probabilidad e impacto, sin texto): se guarda y muestra «Sin descripción»; una fila totalmente vacía desaparece al salir. → Task 3.
5. **Respuesta lenta de la API mientras se sigue escribiendo**: lo escrito no se pisa y el último envío lleva el último texto. → Task 3.

---

## Sesión 1 · Datos

### Task 1: Shared · esquemas y cálculos

**Files:**

- Create: `packages/shared/src/esquemas/complementos.ts`, `packages/shared/src/calculo/complementos.ts`
- Modify: `packages/shared/src/esquemas/index.ts`, `packages/shared/src/calculo/index.ts`, `packages/shared/src/esquemas/charter.ts` (`CharterDetalle`), `packages/shared/src/esquemas/exportacion.ts`
- Test: `packages/shared/test/calculo/complementos.test.ts`, `packages/shared/test/esquemas/complementos.test.ts`

**Interfaces:**

- Produces (`esquemas/complementos.ts`):
  ```ts
  export const OPERADORES_META = ['>=', '<=', '='] as const
  export const indicadoresEntrada  // z.object({ items: z.array(indicador).max(50) })
  export const riesgosEntrada      // z.object({ items: z.array(riesgo).max(50) })
  export const presupuestoEntrada  // z.object({ rubros: z.array(rubro).max(50) }); rubro.lineas .max(50)
  export interface Indicador { id: string; nombre: string; formula: string; metaOperador: '>=' | '<=' | '='; metaValor: number | null; metaUnidad: string; observaciones: string }
  export interface Riesgo { id: string; riesgo: string; causa: string; mitigacion: string; probabilidad: number | null; impacto: number | null }
  export interface LineaRubro { id: string; concepto: string; cantidad: number; valorUnitario: number }
  export interface Rubro { id: string; descripcion: string; valor: number; lineas: LineaRubro[] }
  export type IndicadoresEntrada / RiesgosEntrada / PresupuestoEntrada  // z.infer
  ```
  `id`: `z.uuid()`. Textos con `.trim().max(n)` (sin `min(1)`). Probabilidad/impacto `z.int().min(1).max(5).nullable()`. `metaValor` `z.number().finite().nullable()`. `cantidad` `z.number().finite().min(0).max(1e9)`; `valor` y `valorUnitario` `z.int().min(0).max(1e13)`.
- Produces (`calculo/complementos.ts`):
  ```ts
  export type NivelRiesgo = 'bajo' | 'medio' | 'alto' | 'critico'
  export function nivelRiesgo(
    probabilidad: number | null,
    impacto: number | null,
  ): { puntaje: number; nivel: NivelRiesgo } | null
  export function valorRubro(rubro: {
    valor: number
    lineas: { cantidad: number; valorUnitario: number }[]
  }): number
  export function totalPresupuesto(rubros: Parameters<typeof valorRubro>[0][]): number
  ```
- Produces: `CharterDetalle` + `indicadores: Indicador[]`, `riesgos: Riesgo[]`, `rubros: Rubro[]`; `ExportacionCharter` + `complementos: { niveles: Record<string, { puntaje: number; nivel: NivelRiesgo } | null>; totalPresupuesto: number }`.

- [x] **Step 1: Pruebas que fallan**

```ts
// calculo/complementos.test.ts
it('nivel por bordes', () => {
  expect(nivelRiesgo(1, 4)).toEqual({ puntaje: 4, nivel: 'bajo' })
  expect(nivelRiesgo(1, 5)?.nivel).toBe('medio')
  expect(nivelRiesgo(3, 3)?.nivel).toBe('medio')
  expect(nivelRiesgo(2, 5)?.nivel).toBe('alto')
  expect(nivelRiesgo(3, 5)?.nivel).toBe('alto')
  expect(nivelRiesgo(4, 4)?.nivel).toBe('critico')
  expect(nivelRiesgo(5, 5)).toEqual({ puntaje: 25, nivel: 'critico' })
})
it('sin calificar', () => {
  expect(nivelRiesgo(null, 3)).toBeNull()
  expect(nivelRiesgo(4, null)).toBeNull()
})
it('valor de rubro', () => {
  expect(valorRubro({ valor: 5000, lineas: [] })).toBe(5000)
  expect(valorRubro({ valor: 1, lineas: [{ cantidad: 2.5, valorUnitario: 3333 }] })).toBe(8333)
  expect(
    valorRubro({
      valor: 0,
      lineas: [
        { cantidad: 1, valorUnitario: 100 },
        { cantidad: 3, valorUnitario: 50 },
      ],
    }),
  ).toBe(250)
  expect(
    totalPresupuesto([
      { valor: 5000, lineas: [] },
      { valor: 1, lineas: [{ cantidad: 2, valorUnitario: 10 }] },
    ]),
  ).toBe(5020)
  expect(totalPresupuesto([])).toBe(0)
})
// esquemas/complementos.test.ts
it('acepta textos vacíos y nulos, rechaza fuera de rango', () => {
  const id = '0190d7a0-0000-7000-8000-000000000001'
  expect(
    riesgosEntrada.safeParse({
      items: [{ id, riesgo: '', causa: '', mitigacion: '', probabilidad: 3, impacto: null }],
    }).success,
  ).toBe(true)
  expect(
    riesgosEntrada.safeParse({
      items: [{ id, riesgo: 'x', causa: '', mitigacion: '', probabilidad: 6, impacto: 1 }],
    }).success,
  ).toBe(false)
  expect(
    presupuestoEntrada.safeParse({ rubros: [{ id, descripcion: 'x', valor: -1, lineas: [] }] })
      .success,
  ).toBe(false)
  expect(
    indicadoresEntrada.safeParse({
      items: [
        {
          id: 'no-uuid',
          nombre: 'x',
          formula: '',
          metaOperador: '>=',
          metaValor: null,
          metaUnidad: '',
          observaciones: '',
        },
      ],
    }).success,
  ).toBe(false)
})
```

- [x] **Step 2:** `npm test -w packages/shared -- complementos` → FALLA (módulos inexistentes).
- [x] **Step 3:** Implementar esquemas, cálculos, exportarlos en los `index.ts` y ampliar `CharterDetalle` y `ExportacionCharter`.
- [x] **Step 4:** `npm test -w packages/shared` → PASA. `npm run typecheck -w packages/shared` (la API y la web dejan de compilar hasta la Task 2/3: esperado).
- [x] **Step 5:** Commit «Agrega esquemas y cálculos de indicadores, riesgos y presupuesto».

### Task 2: API · migración, servicio, rutas y JSON

**Files:**

- Modify: `apps/api/src/db/esquema.ts` (riesgo + 2 columnas; `metaValor` nulo), `apps/api/src/modulos/charters/servicio.ts` (`detalleCharter`), `apps/api/src/modulos/charters/rutas.ts`, `apps/api/src/modulos/charters/exportar.ts`
- Create: `apps/api/drizzle/0001_complementos.sql` (+ meta, generados), `apps/api/src/modulos/charters/complementos.ts`
- Test: `apps/api/test/complementos.test.ts`; ajustar `apps/api/test/exportar.test.ts`

**Interfaces:**

- Consumes: Task 1 (esquemas, tipos, `valorRubro`, `nivelRiesgo`, `totalPresupuesto`).
- Produces (`complementos.ts`):

  ```ts
  export async function leerComplementos(
    db: BaseDatos,
    charterId: string,
  ): Promise<Pick<CharterDetalle, 'indicadores' | 'riesgos' | 'rubros'>>
  export async function reemplazarIndicadores(
    db: BaseDatos,
    charterId: string,
    items: IndicadoresEntrada['items'],
  ): Promise<Indicador[]>
  export async function reemplazarRiesgos(
    db: BaseDatos,
    charterId: string,
    items: RiesgosEntrada['items'],
  ): Promise<Riesgo[]>
  export async function reemplazarPresupuesto(
    db: BaseDatos,
    charterId: string,
    rubros: PresupuestoEntrada['rubros'],
  ): Promise<Rubro[]>
  ```

  Todas en una transacción, con `orden` = posición, y tocan `charter.actualizado_en` (como `reemplazarLista`). `reemplazarPresupuesto` guarda `valor = valorRubro(rubro)`.

- [x] **Step 1: Migración.** Cambiar `esquema.ts`, correr `npx drizzle-kit generate --name complementos` en `apps/api` y revisar el SQL: solo `ADD COLUMN probabilidad integer`, `ADD COLUMN impacto integer`, `ALTER COLUMN meta_valor DROP NOT NULL` y `DROP DEFAULT`; nada de recrear tablas.
- [x] **Step 2: Pruebas que fallan** (`complementos.test.ts`, con `crearCharterPrueba` y `sesionDe`; ids con `v7()`):
  - `guarda y devuelve en orden` para las tres rutas; `GET /charters/:id` las trae en ese orden.
  - `conserva ids y borra los que faltan`: PUT [A, B], PUT [B'] (B editado) → detalle = [B'] con el mismo id.
  - `editar un indicador conserva sus mediciones`: insertar una fila en `medicion` con `app.db`, PUT el indicador con otro nombre → la medición sigue (Review Focus 1).
  - `el valor de un rubro con líneas es el calculado`: rubro `valor: 1`, línea 2,5 × 3.333 → respuesta y detalle con `valor: 8333` (Review Focus 2).
  - `id de otro charter → 400 id_ajeno` (también una línea de un rubro de otro charter); `id repetido → 400 id_duplicado`.
  - `charter cerrado → 409 charter_cerrado`; `Admin sobre charter ajeno → no escribe` (mismo código que dan hoy las listas); `charter ajeno de otro usuario → 404`.
  - `más de 50 → 400`.
  - En `exportar.test.ts`: el JSON trae `charter.riesgos` y `complementos.niveles[id]` = `{ puntaje: 12, nivel: 'alto' }` y `complementos.totalPresupuesto`.
- [x] **Step 3:** `npm test -w apps/api -- complementos exportar` → FALLA.
- [x] **Step 4:** Implementar `complementos.ts`, sumar `leerComplementos` a `detalleCharter`, las tres rutas en `rutas.ts` (parse Zod → `cargarCharter(…, 'escritura')` → servicio) y `complementos` en `exportarCharter`.
- [x] **Step 5:** `npm test -w apps/api` y `npm run typecheck -w apps/api` → PASA.
- [x] **Step 6:** Commit «Agrega la API de indicadores, riesgos y presupuesto».

## Sesión 2 · Ficha

### Task 3: Web · `useColeccion`, cliente e Indicadores

**Files:**

- Create: `apps/web/src/pantallas/ficha/complementos/useColeccion.ts`, `…/complementos/SeccionIndicadores.tsx`, `…/complementos/textos.ts`
- Modify: `apps/web/src/api/charters.ts`, `apps/web/src/pantallas/ficha/Ficha.tsx` (`secciones()` y render tras `SeccionSupuestos`), `apps/web/test/simular-api.ts` (PUT de las tres rutas y detalle con colecciones vacías)
- Test: `apps/web/test/use-coleccion.test.tsx`, `apps/web/test/indicadores.test.tsx`

**Interfaces:**

- Consumes: Task 1 (tipos).
- Produces (`api/charters.ts`): `useGuardarIndicadores(id)`, `useGuardarRiesgos(id)`, `useGuardarPresupuesto(id)` — `useMutation` cuyo `mutationFn(items)` hace el PUT y cuyo `onSuccess` actualiza ese campo de `CLAVES.charter(id)` (como `useGuardarLista`).
- Produces (`useColeccion.ts`):
  ```ts
  export function useColeccion<T extends { id: string }>(opciones: {
    inicial: T[]
    guardar(items: T[]): Promise<unknown> // se encola en useGuardado()
    vacia(item: T): boolean
    limpiar?(item: T): T // al salir (p. ej. quitar líneas vacías)
    maximo: number
  }): {
    filas: T[]
    editar(id: string, cambios: Partial<T>, inmediato?: boolean): void // 800 ms o ya
    agregar(nueva: T, despuesDe?: number): void
    quitar(id: string): void
    mover(id: string, paso: -1 | 1): void
    salir(id: string): void // limpia, quita si vacía, envía
    porEnfocar: React.RefObject<string | null>
  }
  ```
  No envía si la firma (`JSON.stringify`) no cambió; nunca adopta la respuesta.
- Produces (`textos.ts`): `textoMeta(operador, valor: number | null, unidad: string): string` → `'≥ 90 %'`, `'≤ 72 horas'`, `'= 1'`, `null` → `'Sin meta'`. Números con `toLocaleString('es-CO')`.

- [ ] **Step 1: Pruebas que fallan**
  - `use-coleccion`: escribir dispara un solo PUT a los 800 ms (timers falsos, patrón de CLAUDE.md); `salir` de una fila totalmente vacía la quita y envía sin ella; una fila con datos y texto vacío se envía (Review Focus 4); con la respuesta del primer PUT demorada, seguir escribiendo no pisa el texto y el segundo PUT lleva el último (Review Focus 5); `mover` envía el nuevo orden.
  - `indicadores`: agregar un indicador, escribir nombre y meta (≥, 90, %) y salir → PUT con esos valores; en solo lectura se ve «≥ 90 %» y uno sin valor «Sin meta»; el índice muestra «Indicadores» con su cuenta; vacío → «Aún no hay indicadores.».
  - `textoMeta` con los cuatro casos de arriba.
- [ ] **Step 2:** `npm test -w apps/web -- use-coleccion indicadores` → FALLA.
- [ ] **Step 3:** Implementar. Tabla de Indicadores: # · Indicador · Fórmula · Meta (selector de operador con `Selector`, número, unidad) · Observaciones · acciones (subir, bajar, quitar con los íconos de `ListaEditable`). Campos con el estilo de los de `ListaEditable`. En celular la fila se apila. `secciones()` suma `indicadores`, `riesgos`, `presupuesto` (este sin cuenta) tras `supuestos`; Riesgos y Presupuesto se montan en las Tasks 4 y 5.
- [ ] **Step 4:** `npm test -w apps/web` y `npm run typecheck -w apps/web` → PASA.
- [ ] **Step 5:** Commit «Agrega la sección de indicadores a la ficha».

### Task 4: Web · Riesgos y matriz

**Files:**

- Create: `apps/web/src/pantallas/ficha/complementos/SeccionRiesgos.tsx`, `…/complementos/MatrizRiesgos.tsx`, `…/complementos/nivel.ts` (clases y textos por nivel)
- Modify: `apps/web/src/pantallas/ficha/Ficha.tsx`
- Test: `apps/web/test/riesgos.test.tsx`

**Interfaces:**

- Consumes: `useColeccion`, `useGuardarRiesgos` (Task 3); `nivelRiesgo` (Task 1).
- Produces:

  ```ts
  export function MatrizRiesgos(props: {
    riesgos: Riesgo[] // el número es su posición + 1
    resaltado?: string | null
    alResaltar?(id: string | null): void
    estatica?: boolean // PDF: sin foco ni eventos
  }): JSX.Element
  export const NIVELES: Record<
    NivelRiesgo,
    { texto: string; chip: string; casilla: string; punto: string }
  >
  ```

- [ ] **Step 1: Pruebas que fallan** (`riesgos.test.tsx`):
  - escribir un riesgo y elegir probabilidad 4 e impacto 3 → PUT con `probabilidad: 4, impacto: 3`; la fila muestra el chip «Alto · 12» y la matriz un punto «1» con nombre «Riesgo 1: …, probabilidad 4, impacto 3, nivel alto».
  - un riesgo sin impacto muestra «Sin calificar» y no aparece en la matriz.
  - enfocar el punto resalta su fila (`aria-current` o clase comprobable) y pasar sobre la fila resalta el punto.
  - seis riesgos en la misma casilla → 3 puntos y «+3»; la casilla tiene nombre con los seis números (Review Focus 3).
  - resumen «1 alto · 1 sin calificar»; vacío → «Aún no hay riesgos.» y matriz atenuada; solo lectura sin campos.
- [ ] **Step 2:** `npm test -w apps/web -- riesgos` → FALLA.
- [ ] **Step 3:** Implementar. Matriz SVG 5 × 5 (probabilidad vertical con 5 arriba; impacto horizontal con 5 a la derecha), casillas con el fondo suave del nivel de su puntaje, puntos `tinta` con número blanco, hasta 4 por casilla en 2 × 2 (con más, 3 + «+n»), ejes rotulados «Probabilidad» e «Impacto», texto ≥ 11 px. Resaltado: punto con anillo `acento`, fila con fondo `info-suave`. Tabla: # · Riesgo · Causa · Mitigación · Probabilidad · Impacto · Nivel · acciones; selectores con las etiquetas de la escala. Desde `lg` matriz a la izquierda y tabla a la derecha; por debajo, matriz arriba y filas apiladas como bloques (sin scroll horizontal de la página).
- [ ] **Step 4:** `npm test -w apps/web` → PASA.
- [ ] **Step 5:** Commit «Agrega la sección de riesgos con matriz de probabilidad e impacto».

## Sesión 3 · Cierre

### Task 5: Web · Presupuesto

**Files:**

- Create: `apps/web/src/pantallas/ficha/complementos/SeccionPresupuesto.tsx`
- Modify: `apps/web/src/formato.ts` (`pesos`, `leerPesos`), `apps/web/src/pantallas/ficha/Ficha.tsx`
- Test: `apps/web/test/presupuesto.test.tsx`; casos de `pesos`/`leerPesos` donde se prueba `formato`

**Interfaces:**

- Consumes: `useColeccion` (con `limpiar` = quitar líneas vacías), `useGuardarPresupuesto`, `valorRubro`, `totalPresupuesto`.
- Produces (`formato.ts`): `pesos(n: number): string` → `'182.000.000'`; `leerPesos(texto: string): number | null` → `'182.000.000'` y `'182000000'` dan `182000000`, `''` da `0`, `'abc'` da `null`.

- [ ] **Step 1: Pruebas que fallan** (`presupuesto.test.tsx`):
  - agregar dos rubros (96.000.000 y 40.000.000) → «Presupuesto total» «COP 136.000.000»; la barra del mayor al 100 % y la del otro al 41,7 % (ancho en `style`).
  - desplegar el desglose (botón con `aria-expanded`), agregar línea 2,5 × 3.333 → el valor del rubro pasa a cifra «8.333» (sin campo) y el PUT lleva la línea; borrar la línea → el valor 8.333 queda editable.
  - una línea vacía desaparece al salir del rubro; vacío → «Aún no hay presupuesto.»; solo lectura muestra barras y desglose sin campos.
- [ ] **Step 2:** `npm test -w apps/web -- presupuesto` → FALLA.
- [ ] **Step 3:** Implementar. Arriba «Presupuesto total» y la cifra en Sora (`Cifra`). Filas: descripción · barra (`institucional` sobre `fondo`, ancho relativo al mayor, transición de ancho con Motion y movimiento reducido) · valor tabular a la derecha (campo con `inputMode="numeric"` si no hay líneas) · acciones (desglose, subir, bajar, quitar). Desglose: concepto · cantidad · valor unitario · subtotal + «Agregar línea». Al pie, el total. En celular la barra pasa bajo la descripción.
- [ ] **Step 4:** `npm test -w apps/web` → PASA.
- [ ] **Step 5:** Commit «Agrega la sección de presupuesto con barras y desglose».

### Task 6: PDF, verificación y cierre

**Files:**

- Create: `apps/web/src/pantallas/imprimir/ComplementosImpresion.tsx`
- Modify: `apps/web/src/pantallas/imprimir/Imprimir.tsx` (tres `Seccion` entre «Criterios de éxito» y «Historial de cortes»), `imprimir.css` si hace falta; docs: `CLAUDE.md`, `PENDIENTES.md`, `docs/plan-implementacion.md` (T6.1–T6.3 según el spec), `README.md` §6–8 si cambia el alcance
- Test: `apps/web/test/imprimir.test.tsx`

- [ ] **Step 1: Prueba que falla:** la vista de impresión con un charter con 1 indicador, 1 riesgo (4 × 3) y 1 rubro muestra, en orden, «Indicadores», «Riesgos» (tabla + matriz estática sin elementos enfocables) y «Presupuesto» con el total; sin colecciones, cada sección dice su texto de vacío.
- [ ] **Step 2:** Implementar: Indicadores en tabla; Riesgos con `MatrizRiesgos estatica` arriba y su resumen al lado, tabla debajo a todo el ancho; Presupuesto con total, barras y desglose como subfilas. `break-inside: avoid` en filas, matriz y cada rubro.
- [ ] **Step 3: Verificación completa:** `npm test`, `npm run lint`, `npm run build` → todo en verde (anotar el conteo de pruebas).
- [ ] **Step 4: Navegador** (con el `npm run dev` del usuario si corre; si no, levantarlo y matar el árbol al final): recargar RF1 desde el JSON del respaldo si la base está vacía (script temporal con `tsx`, ver CLAUDE.md); cargar indicadores, riesgos y presupuesto de prueba; revisar 1440 y 390 px (`scrollWidth` sin desborde), resaltado punto ↔ fila, consola limpia y el PDF emulado a 688 px.
- [ ] **Step 5:** Documentación (CLAUDE.md: decisiones y estado; PENDIENTES.md: registro; plan maestro) y commit «Cierra la Fase 6».

---

## Autorrevisión

- **Cobertura del spec:** riesgos (datos, nivel, matriz, enlace, edición, celular, vacío) → T1, T2, T4; presupuesto (valor calculado, precisiones, barras, desglose) → T1, T2, T5; indicadores (meta opcional, «Sin meta») → T1–T3; API (PUT, ids, concurrencia, filas incompletas, límites) → T1, T2; ficha (índice, cola, solo lectura, corte pasado = valores actuales) → T3–T5 (solo lectura ya llega por `soloLectura` de la ficha); PDF y JSON → T2, T6; RF1 → T6.
- **Tipos:** `Indicador`, `Riesgo`, `Rubro`, `LineaRubro`, `NivelRiesgo`, `nivelRiesgo`, `valorRubro`, `totalPresupuesto`, `useColeccion`, `MatrizRiesgos` usados con el mismo nombre en todas las tareas.
