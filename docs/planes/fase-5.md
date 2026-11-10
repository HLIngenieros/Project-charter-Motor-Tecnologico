# Fase 5 · Visualización — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La ficha dice de un vistazo cómo va el charter y cómo iba: curva S protagonista, semáforo con los umbrales del charter, ficha vista en cualquier corte pasado (solo lectura) y portafolio con avance, estado y mini curva.

**Architecture:** El motor compartido suma la geometría de la curva (proyección y lectura por fecha) y el armado de un árbol con la foto de un corte. La API amplía el detalle del charter (umbrales) y el resumen del portafolio (estado, vencidas y serie de cortes). La web lee el corte elegido de la URL (`?corte=`) en `Ficha.tsx` y reparte una **vista** del cronograma —la del borrador en vivo o la histórica de la foto— a la banda, la curva y el Gantt. Las gráficas son SVG propio animado con Motion.

**Tech Stack:** el de la Fase 4. **Sin dependencias nuevas:** no se instala ECharts (se actualiza `docs/arquitectura.md`).

**Spec:** [docs/superpowers/specs/2026-11-10-fase-5-visualizacion-design.md](../superpowers/specs/2026-11-10-fase-5-visualizacion-design.md) (manda sobre todo lo demás) · [docs/pantallas.md](../pantallas.md) §1 y «Curva S protagonista» · maquetas [ficha.html](../maquetas/ficha.html), [curva.js](../maquetas/curva.js), [portafolio.html](../maquetas/portafolio.html), [corte.html](../maquetas/corte.html) · [docs/analisis-plantilla-excel.md](../analisis-plantilla-excel.md) §4.3–§4.4 · [DESIGN.md](../../DESIGN.md) · Plan maestro: T5.1–T5.5.

## Sesiones

| Sesión | Tareas | Resultado |
|---|---|---|
| 1 · Datos | 1–3 | Motor de la curva y de la foto, API ampliada, semáforo con contraste y umbrales del charter |
| 2 · Ficha | 4–6 | Corte elegido y modo histórico, curva S, Gantt completado |
| 3 · Portafolio y cierre | 7–9 | Portafolio con avance, mini curva en Registrar corte, verificación de fase |

## Decisiones de este plan *(criterio técnico)*

- **Vista del cronograma:** `Ficha.tsx` arma una `VistaCronograma` única (en vivo o histórica) y la pasa a banda, curva y Gantt; así las tres cifras salen siempre del mismo cálculo.
- **Gantt histórico sin `terminadaEn`:** el detalle del corte no trae la fecha en que cada hoja llegó al 100 %; en la vista histórica una hoja terminada proyecta su fin en la fecha del corte. Solo afecta el fin proyectado de hojas terminadas; la banda usa los totales guardados.
- **Proyección de la curva:** la línea base desplazada por el retraso del motor (`forecast` del proyecto − fin de línea base), que arranca en el último punto real y termina en el `forecast`. Así curva y Gantt dan la misma fecha.
- **Mini curva** (portafolio y Registrar corte): planeado y real **en las fechas de corte**, sin ejes; un solo componente.
- El resumen del portafolio calcula estado y vencidas del último corte con `listarCortes` de cada charter (pocos charters por usuario; se revisa en T8.5 si hiciera falta).

## Global Constraints

- Todo lo de las Fases 3 y 4 sigue vigente (español de tú, formato `es-CO`, `{ error: { codigo, mensaje } }`, `cargarCharter` en toda ruta, `acento` = lo medido en cortes, selección y foco; texto de estado con la variante `-texto`; `useVariantes` y movimiento reducido).
- **Un corte registrado no cambia:** cortes anteriores al último, historial y portafolio usan lo guardado y la foto; la vista actual recalcula en vivo con el cronograma actual y los avances del último corte.
- **Fin proyectado = el del motor** (`ResultadoNodo.forecast`, §4.3) en curva, Gantt y detalle.
- Semáforo por brecha con los **umbrales del charter** (por defecto 10/25/50) y vencida vinotinto.
- Contraste: texto de chip ≥ 4,5:1 sobre su fondo; relleno de barra y punto de corte ≥ 3:1 sobre `barra`/`superficie`.
- Rendimiento: con 170 actividades, arrastrar una barra no se traba (sin virtualizar salvo que la medición lo pida).
- Ejecución directa: pruebas con cada tarea; suite completa, lint, build y una ronda de capturas al cerrar (Task 9). Commits en español, imperativo y breves, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **No hacer push.**

## Review Focus

1. **`?corte=` que no es un corte** (fecha inventada, mal escrita o de un corte recién eliminado desde el historial): la ficha muestra el último corte con el aviso «No hay un corte en esa fecha; se muestra el último.», nunca una pantalla rota. → Task 4.
2. **Charter sin cortes o sin cronograma programado:** curva con solo la planeada y «Registra el primer corte», o estado vacío con enlace al cronograma; portafolio con la barra neutra y sin mini curva; selector de corte oculto. → Tasks 5 y 7.
3. **Un solo corte, o un charter al 100 %:** la curva dibuja un punto real; sin proyección si ya terminó (fin proyectado = fecha de terminación); el zoom «Cortes» no colapsa a un ancho cero. → Tasks 1 y 5.
4. **Cambio de corte con una edición del cronograma aún sin enviar:** el guardado pendiente sale igual por la cola; la vista histórica no muestra controles y al volver al último se ven las ediciones. → Task 4.
5. **Línea base modificada después del último corte:** la banda avisa «Línea base modificada desde el corte» y el historial y el portafolio siguen mostrando lo guardado. → Tasks 4 y 7.

---

## Sesión 1 · Datos

### Task 1: Motor de la curva S y árbol de la foto

**Files:**
- Modify: `packages/shared/src/calculo/curvas.ts`, `packages/shared/src/calculo/cortes.ts`, `packages/shared/src/calculo/index.ts`
- Test: `packages/shared/test/calculo/curvas.test.ts`, `packages/shared/test/calculo/cortes.test.ts`

**Interfaces:**
- Produces (`cortes.ts`): `raicesDeFoto(foto: FilaFoto[]): NodoArbol[]` — cada fila como raíz suelta (lo que hoy hace `totalesDeFoto` por dentro; `totalesDeFoto` pasa a usarla).
- Produces (`curvas.ts`):
  ```ts
  type PuntoPlan = { fecha: FechaISO; pv: number }
  type PuntoReal = { fecha: FechaISO; pv: number; ev: number; estado: Estado; vencidas: number }
  /** Línea base desplazada por el retraso; [] si no hay cortes o el proyecto terminó. */
  function proyeccionAlRitmo(planeada: PuntoPlan[], ultimo: { fecha: FechaISO; ev: number }, forecast: FechaISO | null, finLineaBase: FechaISO | null): PuntoPlan[]
  type Lectura = { fecha: FechaISO; pv: number; ev: number | null; tipo: 'corte' | 'entre_cortes' | 'proyeccion' | 'plan'; corte?: PuntoReal }
  function lecturaEn(fecha: FechaISO, planeada: PuntoPlan[], reales: PuntoReal[], proyeccion: PuntoPlan[]): Lectura
  ```
  - `proyeccionAlRitmo`: `d = aDia(forecast) − aDia(finLineaBase)`; primer punto `(ultimo.fecha, ultimo.ev)`; luego cada punto de `planeada` con `pv > ultimo.ev`, corrido `d` días y con fecha > `ultimo.fecha`; último punto `(forecast, 1)`. `[]` si `ultimo.ev ≥ 1 − 1e-9` o falta `forecast`/`finLineaBase`.
  - `lecturaEn`: `pv` interpolado linealmente en `planeada` (0 antes del inicio, 1 después del fin). `ev`: exacto en un corte (`tipo 'corte'`), interpolado entre dos cortes (`'entre_cortes'`), sobre la proyección después del último (`'proyeccion'`), `null` antes del primer corte o sin cortes (`'plan'`).

- [ ] **Step 1: Pruebas** en `curvas.test.ts`:
  - `proyeccionAlRitmo` con planeada lineal de 2026-01-01 (0) a 2026-01-31 (1), `ultimo = { fecha: '2026-01-16', ev: 0.25 }`, forecast `'2026-02-10'`, fin `'2026-01-31'` → el primer punto es `{ '2026-01-16', 0.25 }`, el último `{ '2026-02-10', 1 }` y las fechas crecen.
  - Con `ev: 1` → `[]`; con `forecast: null` → `[]`.
  - `lecturaEn` en la fecha de un corte → `tipo 'corte'` y su `ev`; a mitad entre cortes con ev 0,2 y 0,4 → `ev ≈ 0,3`; antes del primer corte → `ev null`; después del último con proyección → `tipo 'proyeccion'`.
- [ ] **Step 2: Prueba** en `cortes.test.ts`: `raicesDeFoto` del fixture da tantas raíces como filas, todas `esHoja`, y `totalesDeFoto` sigue dando 12,51 % / 12,47 %.
- [ ] **Step 3:** `npm test -w @charter/shared` → FALLA; implementar; → PASAN.
- [ ] **Step 4:** Commit `Agrega la proyección y la lectura de la curva S al motor`.

---

### Task 2: API · umbrales en el detalle y resumen del portafolio ampliado

**Files:**
- Modify: `packages/shared/src/esquemas/charter.ts`, `apps/api/src/modulos/charters/servicio.ts`, `apps/api/src/modulos/cortes/servicio.ts` (exportar `listarCortes` si no lo está)
- Test: `apps/api/test/charters.test.ts`

**Interfaces:**
- Produces:
  ```ts
  interface CharterDetalle { /* … */ umbrales: Umbrales }
  interface CharterResumen {
    /* … */
    ultimoCorte: { fecha: FechaISO; pv: number; ev: number; estado: Estado; vencidas: number } | null
    cortes: { fecha: FechaISO; pv: number; ev: number }[]   // ascendente; [] sin cortes
  }
  ```
- `listarMisCharters` arma `ultimoCorte` y `cortes` con `listarCortes(db, fila)` de cada charter (valores guardados de la foto, nunca recalculados con el cronograma actual).

- [ ] **Step 1: Pruebas:** un charter con 2 cortes → `cortes` trae ambos en orden ascendente y `ultimoCorte` el segundo con `estado` y `vencidas`; tras cambiar la fecha de una hoja del cronograma (PUT), `ultimoCorte.pv` **no cambia**; sin cortes → `ultimoCorte: null` y `cortes: []`; `GET /charters/:id` trae `umbrales: { atencion: 10, riesgo: 25, atraso: 50 }`.
- [ ] **Step 2:** `npm test -w @charter/api` → FALLA; implementar; → PASAN. Ajustar los tipos que usa la web (`npm run typecheck -w @charter/web`) sin cambiar su comportamiento.
- [ ] **Step 3:** Commit `Amplía el resumen de charters y agrega los umbrales al detalle`.

---

### Task 3: Semáforo · tonos con contraste y umbrales del charter en la ficha

**Files:**
- Create: `apps/web/src/estilos/contraste.ts`
- Modify: `apps/web/src/estilos/tokens.css`, `apps/web/src/componentes/Chip.tsx`, `apps/web/src/pantallas/ficha/cronograma/PistaGantt.tsx` (`COLOR_AVANCE`), `apps/web/src/pantallas/ficha/cronograma/useBorradorCronograma.ts`, `apps/web/src/pantallas/ficha/Ficha.tsx`
- Test: `apps/web/test/contraste.test.ts`, caso nuevo en `apps/web/test/cronograma.test.tsx`

**Interfaces:**
- Produces: `razonContraste(a: string, b: string): number` (WCAG 2.x, hex `#rrggbb`).
- `useBorradorCronograma(id, encolar, umbrales: Umbrales)`: usa los umbrales del charter en `calcularCronograma`.
- Los tonos del semáforo quedan en `tokens.css` como única fuente; la prueba lee los mismos valores (exportarlos desde `contraste.ts` como `TONOS_SEMAFORO` y que `tokens.css` los copie, con comentario de sincronía).

- [ ] **Step 1: Pruebas** en `contraste.test.ts`: `razonContraste('#000000', '#ffffff') ≈ 21`; para cada estado (al día, atención, riesgo, atrasada, vencida) el texto del chip sobre su fondo suave ≥ 4,5 y el relleno de la barra sobre `#c9d6e5`/`#ffffff` ≥ 3 (ajustar los tonos que no pasen, mínimo cambio de luminosidad).
- [ ] **Step 2: Prueba** en `cronograma.test.tsx`: con un charter de umbrales `{ atencion: 5, riesgo: 25, atraso: 50 }` y una hoja con brecha de 7 puntos, la fila muestra «En atención» (con los por defecto sería «Al día»).
- [ ] **Step 3:** `npm test -w @charter/web -- contraste cronograma` → FALLA; implementar; → PASAN.
- [ ] **Step 4:** Commit `Fija los tonos del semáforo y usa los umbrales del charter`.

---

## Sesión 2 · Ficha

### Task 4: Corte elegido y modo histórico

**Files:**
- Create: `apps/web/src/pantallas/ficha/vista.ts` (pura), `apps/web/src/pantallas/ficha/useVistaCronograma.ts`, `apps/web/src/pantallas/ficha/SelectorCorte.tsx`
- Modify: `Ficha.tsx`, `BandaEstado.tsx`, `SeccionHistorial.tsx`, `cronograma/SeccionCronograma.tsx`, `cronograma/FilaGantt.tsx`
- Test: `apps/web/test/vista-historica.test.ts`, `apps/web/test/ficha-corte.test.tsx`

**Interfaces:**
- Consumes: `calcularCronograma`, `useCortes`, `useCorte`, `BorradorCronograma`, `CharterDetalle.umbrales` (Task 2).
- Produces (`vista.ts`):
  ```ts
  interface FilaHistorica { noExistia: boolean }   // por id de hoja actual
  function arbolHistorico(acts: ActividadEntrada[], foto: AvanceFoto[]): {
    acts: ActividadEntrada[]            // estructura actual; hojas de la foto con su peso, inicio y fin
    avances: AvancesPorHoja             // pct de la foto, terminadaEn null
    noExistia: Set<string>              // hojas actuales que no están en la foto
    eliminadas: AvanceFoto[]            // filas de la foto con eliminada = true
  }
  ```
  Las hojas `noExistia` quedan sin peso (no entran en el cálculo).
- Produces (`useVistaCronograma.ts`):
  ```ts
  interface VistaCronograma extends Omit<BorradorCronograma, 'aplicar'> {
    aplicar: BorradorCronograma['aplicar']   // no-op en la vista histórica
    historica: null | { fecha: FechaISO; indice: number; total: number; foto: AvanceFoto[]; noExistia: Set<string>; eliminadas: AvanceFoto[]; resumen: CorteResumen }
    /** El cálculo en vivo difiere de lo guardado en el último corte (> 0,0001 en pv o ev). */
    lineaBaseModificada: boolean
  }
  function useVistaCronograma(charterId: string, borrador: BorradorCronograma, umbrales: Umbrales): VistaCronograma & { corteElegido: FechaISO | null; elegirCorte(fecha: FechaISO | null): void; avisoCorte: string | null }
  ```
  - Lee `?corte=` con `useSearchParams`; `elegirCorte(null)` o la fecha del último quita el parámetro. Cambiar de corte hace `push` (atrás vuelve).
  - Fecha que no está en `useCortes` → vista actual y `avisoCorte = 'No hay un corte en esa fecha; se muestra el último.'`.
  - Corte anterior al último → `useCorte(fecha)` + `arbolHistorico` + `calcularCronograma(…, fecha, umbrales)`; `situacion` de la banda = `resumen` guardado.
- UI:
  - `SelectorCorte({ cortes: CorteResumen[], valor: FechaISO | null, alCambiar })`: botón «Corte: 10 nov ▾» en la banda que abre una lista (fecha, chip de estado, real); oculto sin cortes. Usar `Selector` si alcanza, si no un menú como `MenuCharter`.
  - Aviso bajo la banda (`Aviso tono="info"`): «Estás viendo el charter como estaba el 10 oct 2026 (corte 3 de 5). Solo lectura.» + botón «Volver al último corte».
  - En la vista histórica todo en solo lectura: `soloLectura` efectivo = `!permisos.editar || historica !== null` (sin «Registrar corte», sin menú de estado, sin edición de textos ni del Gantt).
  - Gantt: filas `noExistia` con opacidad reducida y rótulo «no existía en este corte»; al final, filas «actividad eliminada» de solo lectura con su %.
  - Banda: con `lineaBaseModificada` en la vista actual, texto pequeño «Línea base modificada desde el corte» bajo las cifras.
  - Historial: acción «Ver la ficha a esta fecha» en cada fila (llama `elegirCorte`) y la fila del corte elegido marcada.

- [ ] **Step 1: Pruebas** de `arbolHistorico`: hoja presente en la foto con otras fechas → toma las de la foto; hoja creada después → en `noExistia` y sin peso; fila de la foto eliminada → en `eliminadas`; agrupadoras intactas.
- [ ] **Step 2: Pruebas** en `ficha-corte.test.tsx` (con `simular-api`):
  - Con 3 cortes, `?corte=<el primero>` → la banda muestra el planeado y el real **guardados** de ese corte, el aviso «Estás viendo… (corte 1 de 3)», sin «Registrar corte» ni «+ Agregar actividad».
  - «Volver al último corte» quita el parámetro y vuelven los controles.
  - `?corte=2020-01-01` → vista actual y «No hay un corte en esa fecha; se muestra el último.»
  - Elegir en `SelectorCorte` y en «Ver la ficha a esta fecha» cambia la URL.
  - Mover una barra (teclado) y luego elegir un corte anterior antes de los 800 ms → el `PUT` del cronograma igual sale; al volver, la barra está movida.
  - Cronograma cambiado tras el último corte → «Línea base modificada desde el corte».
- [ ] **Step 3:** `npm test -w @charter/web -- vista-historica ficha-corte` → FALLA; implementar; → PASAN (y las pruebas previas de ficha, cronograma e historial siguen pasando).
- [ ] **Step 4:** Commit `Agrega el selector de corte y la ficha a una fecha`.

---

### Task 5: Curva S protagonista

**Files:**
- Create: `apps/web/src/pantallas/ficha/curva/{SeccionCurvaS.tsx,CurvaS.tsx,geometria.ts}`
- Modify: `Ficha.tsx` (sección entre razón de ser y cronograma; índice «Curva S»)
- Test: `apps/web/test/geometria-curva.test.ts`, `apps/web/test/curva-s.test.tsx`

**Interfaces:**
- Consumes: `curvaSPlaneada`, `raicesDeFoto`, `proyeccionAlRitmo`, `lecturaEn` (Task 1); `VistaCronograma`, `elegirCorte` (Task 4); `CorteResumen[]`.
- Produces (`geometria.ts`, pura):
  ```ts
  type Zoom = 'proyecto' | 'cortes'
  function dominio(planeada: PuntoPlan[], reales: PuntoReal[], proyeccion: PuntoPlan[], zoom: Zoom): { desde: number; hasta: number; techo: number }  // días y techo del eje Y (0–1)
  function escalaX(dominio, ancho: number): (fecha: FechaISO) => number
  function escalaY(dominio, alto: number): (v: number) => number
  function trazo(puntos: { x: number; y: number }[]): string                    // 'M… L…'
  function tramosBrecha(planeada, reales): { desde: FechaISO; hasta: FechaISO; estado: Estado }[]   // tramo i = entre corte i−1 (o inicio) y corte i, color del corte i
  ```
  `zoom 'cortes'`: del primer corte − 14 días al último + 14 días (mínimo 42 días de ancho), techo = máx(pv, ev) visible + 10 puntos, tope 1.
- `SeccionCurvaS({ vista: VistaCronograma, cortes: CorteResumen[], elegirCorte: (fecha: FechaISO | null) => void })`:
  - Planeada: en vista actual `curvaSPlaneada(vista.arbol)`; en histórica `curvaSPlaneada(raicesDeFoto(vista.historica.foto))`. Memoizar: `curvaSPlaneada` recalcula el cronograma una vez por semana del proyecto.
  - Reales: `PuntoReal` = cada `CorteResumen` (`fecha`, `pv`, `ev`, `estado`, `vencidas`).
  - En la vista actual el último punto usa `vista.calculo.proyecto` (en vivo) y, si `lineaBaseModificada`, el guardado se dibuja tenue al lado. En la histórica, los cortes posteriores al elegido van con opacidad 0,3.
  - Lectura por defecto en el corte vigente; al mover el puntero, `lecturaEn` de la fecha bajo él. Muestra fecha, planeado, real, brecha, chip (y vencidas) y «Fin al ritmo actual» (= `forecast` del proyecto).
  - Puntos de corte con el color de su estado (borde vinotinto con vencidas), clicables (`button` dentro del SVG con `aria-label="Corte del 10 oct 2026, en atención"`) → `elegirCorte`.
  - Brecha sombreada por tramo, franja inferior con el semáforo corte a corte, línea vertical del corte en `acento`, proyección punteada.
  - Animación de entrada (planeada, luego real, brecha y puntos) y transición de geometría al recalcular o hacer zoom, con Motion; con movimiento reducido, sin animación.
  - Selector «Todo el proyecto» / «Cortes».
  - Vacíos: sin hojas programadas → «Programa el cronograma para ver la curva S» con enlace a `#cronograma`; sin cortes → solo planeada + «Registra el primer corte para ver el avance real».
  - Bajo 640 px: 260 px de alto y la lectura en dos filas.
  - SVG `role="img"` con `aria-label` de resumen; la lectura es texto.

- [ ] **Step 1: Pruebas** de `geometria.ts`: `dominio` con zoom `cortes` y un solo corte mide ≥ 42 días; `escalaX` lleva `desde` a 0 y `hasta` al ancho; `trazo` de dos puntos da `'M0 100 L50 0'`; `tramosBrecha` con 2 cortes devuelve 2 tramos con el estado de cada corte.
- [ ] **Step 2: Pruebas** en `curva-s.test.tsx`: con 2 cortes muestra la lectura del último («Planeado 38,2 %»…) y «Fin al ritmo actual»; clic en el punto del primer corte cambia `?corte=`; sin cortes muestra «Registra el primer corte…»; sin cronograma, «Programa el cronograma…»; con 1 corte al 100 % no hay proyección.
- [ ] **Step 3:** `npm test -w @charter/web -- geometria-curva curva-s` → FALLA; implementar; → PASAN.
- [ ] **Step 4:** Commit `Agrega la curva S a la ficha`.

---

### Task 6: Gantt · fin proyectado, plegar a grupos y etiqueta del corte

**Files:**
- Modify: `cronograma/PistaGantt.tsx`, `cronograma/FilaGantt.tsx`, `cronograma/SeccionCronograma.tsx`, `cronograma/escala.ts`
- Test: `apps/web/test/cronograma.test.tsx`, `apps/web/test/escala-gantt.test.ts`

**Interfaces:**
- Consumes: `ResultadoNodo.forecast`, `VistaCronograma` (la sección recibe la vista en lugar del borrador; mismo contrato).
- Produces:
  - Marca de fin proyectado en cada hoja con `forecast > fin`: extensión punteada desde el fin de línea base hasta el `forecast`, en el tono del semáforo de la hoja; `title`/tooltip «Fin proyectado 3 mar 2026».
  - Botones «Plegar a grupos» (pliega todas las agrupadoras de nivel 1) y «Desplegar todo» en la cabecera de la sección.
  - `marcas(rango, escala, fechaCorte?)` omite la etiqueta de mes que quede a menos de 36 px de la etiqueta del corte (o la desplaza): las dos no se superponen.
  - `FilaGantt` envuelto en `memo`, con callbacks estables, para que un arrastre solo re-renderice la fila movida y sus agrupadoras.

- [ ] **Step 1: Pruebas:** una hoja atrasada con `forecast` posterior a su fin muestra la marca con «Fin proyectado …»; una al día no; «Plegar a grupos» deja visibles solo las filas de nivel 1 y «Desplegar todo» las devuelve; `marcas` con el corte el 10 nov y la etiqueta «nov» en el 1 nov no devuelve ambas pegadas (distancia < umbral).
- [ ] **Step 2:** `npm test -w @charter/web -- cronograma escala-gantt` → FALLA; implementar; → PASAN.
- [ ] **Step 3:** Rendimiento: en el navegador, con un cronograma de 170 actividades (generarlo con un script en la consola o por la API), arrastrar una barra y medir en el Performance panel que ningún frame del arrastre pasa de ~50 ms. Si pasa, memoizar más (cálculo de filas visibles, `PistaGantt`) antes de pensar en virtualizar. Anotar la medición en el commit.
- [ ] **Step 4:** Commit `Completa el Gantt con el fin proyectado y el plegado por grupos`.

---

## Sesión 3 · Portafolio y cierre

### Task 7: Portafolio con avance y mini curva

**Files:**
- Create: `apps/web/src/componentes/MiniCurvaS.tsx`
- Modify: `apps/web/src/pantallas/portafolio/{FilaCharter.tsx,filtrar.ts,FiltrosPortafolio.tsx}`
- Test: `apps/web/test/portafolio.test.tsx`, `apps/web/test/componentes.test.tsx`

**Interfaces:**
- Consumes: `CharterResumen` ampliado (Task 2), `chipDe`, `TONOS` del semáforo.
- Produces: `MiniCurvaS({ puntos: { fecha: FechaISO; pv: number; ev: number }[], ancho?: number, alto?: number, extra?: { fecha: FechaISO; pv: number; ev: number } })` — SVG estático: planeado (`institucional`) y real (`acento`) por los puntos, punto final con el color del estado; `extra` = punto nuevo (Task 8). `aria-hidden` (la fila ya dice las cifras). Sin puntos → no dibuja nada.
- `FiltrosPortafolio.estado` suma `'con_vencidas'` (`ultimoCorte.vencidas > 0`), etiqueta «Con vencidas».
- Fila (según `pantallas.md` §1): avance «26,9 % de 38,2 %» con barra y marca del planeado; mini curva; chip de estado del último corte y, debajo, «n vencidas» en vinotinto; último corte con fecha y «hace n días», en `amarillo-texto` si pasan más de 21 días. Sin cortes: «Registra el primer corte» y barra neutra. Celular: apilado y sin mini curva.

- [ ] **Step 1: Pruebas:** fila con corte muestra «26,9 % de 38,2 %», el chip del estado y «2 vencidas»; corte de hace 30 días → «hace 30 días» con la clase de ámbar; filtro «Con vencidas» deja solo los que tienen; sin cortes → «Registra el primer corte»; `MiniCurvaS` con 3 puntos dibuja dos `path` y con 0 no dibuja.
- [ ] **Step 2:** `npm test -w @charter/web -- portafolio componentes` → FALLA; implementar; → PASAN.
- [ ] **Step 3:** Commit `Muestra el avance y la mini curva en el portafolio`.

---

### Task 8: Registrar corte · mini curva y aviso que no reaparece

**Files:**
- Modify: `apps/web/src/pantallas/corte/RegistrarCorte.tsx`, `apps/web/src/pantallas/ficha/Ficha.tsx`
- Test: `apps/web/test/registrar-corte.test.tsx`, `apps/web/test/historial.test.tsx`

**Interfaces:**
- Consumes: `MiniCurvaS` (Task 7), `useCortes`.
- Resumen fijo: `MiniCurvaS` con los cortes guardados anteriores a la fecha y `extra` = el punto nuevo en vivo (`proyecto.pv`/`ev` del formulario). En modo editar, el corte editado se reemplaza por el punto en vivo. Oculta bajo 768 px.
- Ficha: al mostrar `state.aviso`, limpiarlo con `navigate(location.pathname + location.search, { replace: true, state: null })` una sola vez (el aviso queda visible en ese render).

- [ ] **Step 1: Pruebas:** al escribir 100 % en una hoja, el punto `extra` de la mini curva cambia (atributo de posición distinto); tras guardar, la ficha muestra «Corte guardado» y luego de re-montar con el mismo historial ya no aparece.
- [ ] **Step 2:** `npm test -w @charter/web -- registrar-corte historial` → FALLA; implementar; → PASAN.
- [ ] **Step 3:** Commit `Agrega la mini curva al registrar corte y limpia el aviso al volver`.

---

### Task 9: Cierre de la fase

**Files:**
- Modify: `PENDIENTES.md`, `CLAUDE.md`, `docs/arquitectura.md` (Gráficas: SVG propio + Motion, sin ECharts; §5 respuesta ampliada de `GET /charters` y `umbrales` del detalle; ruta `?corte=`), `docs/pantallas.md` (lo que cambió al construir: selector A+B, modo histórico, «Plegar a grupos», sin bloque de avance por grupo)

- [ ] **Step 1:** `npm test`, `npm run lint` y `npm run build` → todo en verde. Anotar el total de pruebas.
- [ ] **Step 2:** Navegador (Playwright) con `npm run dev`: charter con cronograma de 3 niveles y 3 cortes (uno con vencidas); ver la curva (entrada animada, lectura al pasar, zoom), elegir un corte desde la banda, desde un punto y desde el historial, volver al último; mover una barra y ver curva y banda transformarse; «Plegar a grupos»; portafolio con 3 charters (con cortes, sin cortes, con vencidas); Registrar corte con la mini curva. Capturas a 1440 y 390 px de ficha (curva y Gantt), portafolio y Registrar corte. Revisar la consola. Una sola ronda de ajustes visuales. Matar **todo** el árbol de `npm run dev` al terminar.
- [ ] **Step 3:** Marcar T5.1–T5.5 en `PENDIENTES.md`, registrar la sesión y actualizar «Estado actual», «Decisiones» y «Aprendido» de `CLAUDE.md`.
- [ ] **Step 4:** Commit `Cierra la Fase 5`.
