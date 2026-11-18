# Ajustes de cronograma, pesos, indicadores y riesgos — plan

> **Ejecución:** directa (sin subagente por tarea), con superpowers:executing-plans. Las pruebas se escriben con cada tarea; la verificación formal (suite, lint, build, e2e y navegador) es al cierre. Pasos con casillas (`- [ ]`).

**Objetivo:** pesos relativos por grupo con alertas y resumen, fechas encadenadas con duración en días hábiles, columnas Inicio y Fin con barras del color del estado, indicadores ordenados y riesgos redactados de nuevo.

**Arquitectura:** el motor (`packages/shared`) pasa a leer el `peso` como parte dentro del padre y sigue entregando el peso global de cada hoja, así curva, cortes y PV/EV no cambian. Una conversión en `prepararDb`, marcada por charter, pasa los datos existentes a relativos. Las fechas encadenadas son operaciones puras en `operaciones.ts`.

**Stack:** TypeScript, Vitest, React + Tailwind, Drizzle (Postgres/PGlite).

**Diseño:** [docs/superpowers/specs/2026-11-18-ajustes-cronograma-pesos-design.md](../superpowers/specs/2026-11-18-ajustes-cronograma-pesos-design.md)

**Sesiones:** 1 = Tasks 1–3 (motor y datos) · 2 = Tasks 4–6 (cronograma) · 3 = Tasks 7–10 (pesos web, indicadores, riesgos, cierre).

## Restricciones globales

- Días hábiles = lunes a viernes (`esHabil`, `diasHabiles`, `sumarHabiles` de `calculo/fechas.ts`); sin festivos.
- La duración cuenta inicio y fin: `diasHabiles(aDia(inicio), aDia(fin))`.
- Actividad nueva: inicio = día hábil siguiente al fin de la predecesora; duración 5 días hábiles.
- Predecesora = la última hoja con `fin` antes de la posición en preorden.
- Solo un cambio de **fin** corre lo de abajo; cambiar solo el inicio no corre nada.
- Aviso de corrimiento: «Se corrieron N actividades M días hábiles · Deshacer»; dura 8 s o hasta la siguiente edición.
- Los cortes registrados no se recalculan.
- Textos en español; hooks con prefijo `use…`; nada de `setState` en `useEffect`.

## Foco de revisión

1. **Hoja sin fechas debajo del cambio:** el corrimiento la salta sin fallar y no la cuenta en N. Va en la prueba de Task 5.
2. **Fin movido a un sábado:** Δ = 0, no corre nada ni sale el aviso. Va en la prueba de Task 5.
3. **Charter ya convertido:** correr `prepararDb` dos veces no vuelve a dividir los pesos. Va en la prueba de Task 3.
4. **Grupo cuyas hojas no tienen peso, con la regla «repartir»:** el grupo recibe su parte y sus hojas se reparten el 100 % del grupo. Va en la prueba de Task 1.
5. **Deshacer después de que el autoguardado ya envió:** restaura la lista y se vuelve a guardar sin 409. Va en la prueba de Task 6.

---

### Task 1: Motor con pesos relativos

**Archivos:**

- Modificar: `packages/shared/src/calculo/reglas.ts` (`pesosEfectivos`, `pesosCompletos`)
- Modificar: `packages/shared/src/calculo/cronograma.ts` (`ResultadoNodo`)
- Crear: `packages/shared/src/calculo/pesos.ts` (`aPesosRelativos`) y exportarlo en `index.ts`
- Modificar: `packages/shared/test/calculo/fixture.ts` (`actividadesFixture` devuelve relativos)
- Pruebas: `packages/shared/test/calculo/pesos.test.ts`

**Interfaces:**

- Produce `pesosEfectivos(raices, sinPeso): Record<string, { peso: number; relativo: number; auto: boolean }>`. `peso` = global (producto de los relativos desde la raíz) y `relativo` = parte dentro del padre (la escrita o la repartida). Incluye agrupadoras.
- Produce `pesosCompletos(raices, reglas): boolean`: el primer nivel y cada agrupadora suman 100 % (tolerancia actual).
- Produce `ResultadoNodo.pesoRelativo: number` (nuevo). `peso` sigue siendo el global.
- Produce `aPesosRelativos(acts: ActividadEntrada[]): ActividadEntrada[]`, que convierte pesos globales de hojas a relativos. La agrupadora = suma de los globales de sus hojas descendientes; la hija = global ÷ global del padre. Una hoja `null` queda `null`; una agrupadora sin hojas con peso queda `null`; con padre en 0, las hijas no cambian.
- **Qué cuenta para sumar y repartir** (igual que hoy, por nivel): una hoja con fechas válidas, o una agrupadora con al menos una hoja programada. «Repartir» reparte entre las hermanas que cuentan y tienen `peso == null` lo que falta para 100 %. Un 0 escrito excluye.

- [ ] **Paso 1: escribir las pruebas que fallan**, en `pesos.test.ts`:
  - `global = producto`: grupo A 0,3 con hojas 0,4 y 0,6, y grupo B 0,7 con una hoja de 1. Da globales 0,12, 0,18 y 0,7, y `relativo` 0,4, 0,6 y 1.
  - `repartir por hermanas`: grupo 0,5 con hojas 0,2, null y null. Las null dan relativo 0,4 (auto) y global 0,2.
  - `grupo sin pesos con repartir`: dos grupos null en la raíz, cada uno con hojas null. Cada grupo da 0,5 y sus hojas se reparten su 100 %.
  - `0 escrito excluye`: una hoja con 0 queda en 0 y no recibe reparto.
  - `pesosCompletos`: es false si la raíz suma 1 pero un grupo suma 0,9, y true cuando todo suma 1.
  - `aPesosRelativos`: hojas globales 0,12/0,18/0,7 con grupos null dan grupos 0,3/0,7 y hojas 0,4/0,6/1. Aplicarlo al resultado no cambia nada (idempotente si ya suman 1 por grupo).
- [ ] **Paso 2:** `npx vitest run packages/shared/test/calculo/pesos.test.ts` → FALLA.
- [ ] **Paso 3:** implementar en `reglas.ts` y `pesos.ts`; `calcularCronograma` llena `pesoRelativo`.
- [ ] **Paso 4:** `actividadesFixture()` devuelve `aPesosRelativos(...)`. Con eso, las pruebas actuales del Excel (K/L, 12,51 % / 12,47 %) deben seguir pasando sin tocar los valores esperados.
- [ ] **Paso 5:** `npm test -w packages/shared` → PASA todo.
- [ ] **Paso 6:** commit «Pasa el motor a pesos relativos por grupo».

### Task 2: Avisos y resumen de pesos

**Archivos:**

- Modificar: `packages/shared/src/calculo/validacion.ts`
- Pruebas: `packages/shared/test/calculo/validacion.test.ts` (o la existente de avisos)

**Interfaces:**

- Consume: `pesosEfectivos` de Task 1.
- Produce `Aviso.codigo` con el nuevo valor `'pesos_grupo'`, con `actividadId` de la agrupadora.
- Produce `resumenPesos(raices, reglas): { proyecto: number; grupos: { id: string; item: string; nombre: string; suma: number }[] }`. `proyecto` = suma de los relativos del primer nivel que cuentan. `grupos` trae **solo** las agrupadoras cuya suma ≠ 1.

Textos exactos (con `porcentaje` de `validacion.ts`):

- `pesos_no_suman_100`: «Las actividades del primer nivel suman X % y deberían sumar 100 %.», más la cola actual de suma obligatoria.
- `pesos_grupo`, cuando falta: «Las subactividades de {item} suman X %; falta Y %.» Cuando sobra: «Las subactividades de {item} suman X %; sobra Y %.»

- [ ] **Paso 1: pruebas.** Un grupo a 0,9 da un `pesos_grupo` con «falta 10 %» y su `actividadId`. Un grupo a 1,05 da «sobra 5 %». Un árbol completo no da avisos de pesos. `resumenPesos` da `proyecto` 1 y `grupos` vacío en un árbol completo, y lista solo el grupo incompleto.
- [ ] **Paso 2:** correr → FALLA. **Paso 3:** implementar. **Paso 4:** `npm test -w packages/shared` → PASA.
- [ ] **Paso 5:** commit «Avisa los pesos incompletos de cada grupo».

### Task 3: Conversión de los charters existentes

**Archivos:**

- Modificar: `apps/api/src/db/esquema.ts`. En `charter`, agregar `pesosRelativos: boolean('pesos_relativos').notNull().default(true)`.
- Crear: `apps/api/drizzle/0003_*.sql` (generado y revisado a mano). Debe quedar: `ADD COLUMN "pesos_relativos" boolean DEFAULT false NOT NULL;` y luego `ALTER COLUMN ... SET DEFAULT true;`, para que los existentes queden en false y los nuevos en true.
- Crear: `apps/api/src/db/convertirPesos.ts` con `convertirPesosRelativos(db: BaseDatos): Promise<number>` (devuelve cuántos charters convirtió)
- Modificar: `apps/api/src/db/conexion.ts`. `prepararDb` la llama después de `sembrar`.
- Pruebas: `apps/api/test/convertir-pesos.test.ts`

**Interfaces:**

- Consume: `aPesosRelativos`, `construirArbol` y `calcularCronograma` de `@charter/shared`.
- La conversión de cada charter va en una transacción: lee las actividades, aplica `aPesosRelativos`, actualiza solo las filas cuyo `peso` cambió, pone `pesos_relativos = true` y sube `cronograma_version`. Las fotos de los cortes no se tocan.

- [ ] **Paso 1: pruebas.**
  - Un charter insertado con `pesos_relativos=false` y pesos globales (grupo con hojas 0,12/0,18 y una hoja raíz 0,7) queda convertido: grupo 0,3, sus hojas 0,4/0,6 y la hoja raíz sigue en 0,7. La bandera queda en true.
  - El `ev` y el `pv` del proyecto a una fecha son iguales antes y después (calculados con el motor, a 1e-9).
  - Correr `prepararDb` otra vez devuelve 0 convertidos y no cambia los pesos.
  - Un charter creado por la API nace con `pesos_relativos=true`.
- [ ] **Paso 2:** `npx vitest run apps/api/test/convertir-pesos.test.ts --maxWorkers=2` → FALLA.
- [ ] **Paso 3:** `npx drizzle-kit generate` y ajustar el SQL como se indica arriba; implementar `convertirPesosRelativos`.
- [ ] **Paso 4:** correr la prueba → PASA. Correr la suite de la API sola (`npm test -w apps/api -- --maxWorkers=2`) y ajustar las pruebas que armaban cronogramas con agrupadoras usando pesos globales.
- [ ] **Paso 5: prueba con datos reales.** Copiar `data/pglite` al scratchpad, correr `npm run migrar` con `DATABASE_URL=<copia>` y comparar con un script `tsx` el avance de RF1, PC1 y AC1 antes y después. Debe ser idéntico. Borrar el script.
- [ ] **Paso 6:** commit «Convierte los pesos de los charters existentes a relativos».

### Task 4: Columnas Inicio y Fin, barras del color del estado y leyenda

**Archivos:**

- Modificar: `apps/web/src/pantallas/ficha/cronograma/FilaGantt.tsx` (`COLUMNAS` y las celdas)
- Modificar: `apps/web/src/pantallas/ficha/cronograma/PistaGantt.tsx` (fondo de la barra por estado)
- Modificar: `apps/web/src/pantallas/ficha/cronograma/SeccionCronograma.tsx` (cabecera y leyenda)
- Crear: `apps/web/src/pantallas/ficha/cronograma/LeyendaEstados.tsx`
- Pruebas: `apps/web/test/cronograma.test.tsx`

**Interfaces:**

- `COLUMNAS` desde `md`: `60px_minmax(200px,1fr)_64px_72px_72px_minmax(300px,1.35fr)` (Ítem · Actividad · Peso · Inicio · Fin · Gantt). En celular se mantienen Actividad y Gantt.
- Las celdas de fecha usan `fechaCorta` sin el año (como la etiqueta del corte). Una agrupadora muestra las de su `resultado`; si no hay fecha, «—».
- `FONDO_BARRA: Record<string, string>` en `PistaGantt`:

  | Estado      | Clase                                        |
  | ----------- | -------------------------------------------- |
  | al_dia      | `bg-ok-suave`                                |
  | terminada   | `bg-ok-suave`                                |
  | en_atencion | `bg-amarillo-suave` + borde `amarillo-texto` |
  | en_riesgo   | `bg-naranja-suave`                           |
  | atrasada    | `bg-alerta-suave`                            |
  | vencida     | `bg-vencida-suave`                           |
  | otro        | `bg-barra`                                   |

  El avance sigue en `COLOR_AVANCE`. La barra lleva `data-estado`.

- `LeyendaEstados()`: una lista (`ul` con `aria-label="Convenciones"`) con un punto y una etiqueta (`ETIQUETA_ESTADO`) para al_dia, en_atencion, en_riesgo, atrasada, vencida, terminada y por_iniciar. Va en la fila de controles del encabezado de la sección.
- Diseño con la skill `impeccable`, en modo austero.

- [ ] **Paso 1: pruebas.** La cabecera tiene «Inicio» y «Fin» y no tiene «Estado». Una hoja del 2026-11-23 al 2026-12-04 muestra «23 nov» y «4 dic». Una hoja atrasada tiene una barra con `data-estado="atrasada"`. La leyenda lista las 7 etiquetas.
- [ ] **Paso 2:** `npx vitest run apps/web/test/cronograma.test.tsx` → FALLA. **Paso 3:** implementar. **Paso 4:** PASA. Ajustar las pruebas existentes que buscaban el chip de estado en la fila.
- [ ] **Paso 5:** commit «Muestra inicio y fin en el cronograma y colorea las barras por estado».

### Task 5: Operaciones de fechas encadenadas

**Archivos:**

- Modificar: `apps/web/src/pantallas/ficha/cronograma/operaciones.ts`
- Pruebas: `apps/web/test/operaciones-cronograma.test.ts`

**Interfaces:**

- Consume: `aDia`, `aISO`, `diasHabiles`, `sumarHabiles` de `@charter/shared`.
- Produce:
  - `duracion(a: ActividadEntrada): number | null`: días hábiles con inicio y fin incluidos; `null` sin fechas o con fechas invertidas.
  - `agregar(acts, despuesDe, id)` (cambia): si existe una predecesora, la nueva lleva `inicio = sumarHabiles(fin, 1)` y `fin = sumarHabiles(inicio, 4)`.
  - `cambiarFechas(acts, id, cambios: { inicio?: FechaISO | null; fin?: FechaISO | null }): { acts: ActividadEntrada[]; corridas: number; delta: number }`. Aplica los cambios. Si `fin` pasa de F (no nulo) a F′ (no nulo), calcula Δ = días hábiles con signo, `F′ > F ? diasHabiles(F+1, F′) : -diasHabiles(F′+1, F)`, y si Δ ≠ 0 corre las hojas de abajo.
  - `fijarDias(acts, id, dias: number)`: es `cambiarFechas` con `fin = sumarHabiles(inicio, dias − 1)`. Requiere inicio; con `dias < 1`, devuelve la misma lista con 0 corridas.
  - `correrDebajo(acts, id, delta): { acts; corridas: number }`: toda hoja con inicio y fin que esté después de `id` en preorden mueve las dos fechas con `sumarHabiles(…, delta)`.
  - `moverFechas(...)` (cambia): devuelve `{ acts, corridas, delta }` y usa `cambiarFechas`. El extremo `inicio` nunca corre nada.
- La lista está en preorden; «hoja» = actividad sin hijas en la lista.

- [ ] **Paso 1: pruebas.**
  - `agregar` debajo de una hoja que termina el viernes 2026-11-27 da inicio el lunes 2026-11-30 y fin el viernes 2026-12-04.
  - `agregar` sin ninguna predecesora con fechas deja la nueva sin fechas.
  - `cambiarFechas` con un fin +1 semana corre 2 hojas de abajo +5 días hábiles (`corridas` 2, `delta` 5) y conserva su duración.
  - Una hoja sin fechas abajo no se mueve y no cuenta.
  - Cambiar solo el inicio deja `corridas` en 0.
  - Un fin movido del viernes al sábado da `delta` 0 y `corridas` 0.
  - Un fin movido hacia atrás corre las de abajo con delta negativo.
  - `fijarDias(…, 10)` sobre un inicio lunes 2026-11-30 da fin el viernes 2026-12-11.
  - `duracion` de lunes a viernes es 5.
- [ ] **Paso 2:** correr → FALLA. **Paso 3:** implementar. **Paso 4:** PASA.
- [ ] **Paso 5:** commit «Encadena las fechas del cronograma en días hábiles».

### Task 6: Duración en el detalle y aviso de corrimiento con Deshacer

**Archivos:**

- Modificar: `apps/web/src/pantallas/ficha/cronograma/DetalleActividad.tsx` (campo «Días hábiles»; Inicio y Fin vía `cambiarFechas`)
- Modificar: `apps/web/src/pantallas/ficha/cronograma/SeccionCronograma.tsx` (`alMover`, acciones y estado del aviso)
- Modificar: `apps/web/src/pantallas/ficha/cronograma/PistaGantt.tsx` (`textoFechas` dice «N días hábiles»)
- Crear: `apps/web/src/pantallas/ficha/cronograma/AvisoCorrimiento.tsx`
- Pruebas: `apps/web/test/cronograma.test.tsx`

**Interfaces:**

- `AccionesDetalle` gana `cambiarFechas(cambios)` y `fijarDias(dias: number)`. El detalle ya no manda fechas por `aplicar`.
- En `SeccionCronograma`, un estado `corrimiento: { previo: ActividadEntrada[]; corridas: number; delta: number } | null`. Se llena dentro del `aplicar(op)` y se lee del resultado de la operación. Deshacer hace `aplicar(() => previo)` y limpia el estado. Se limpia a los 8 s y con cualquier otra edición.
- `AvisoCorrimiento({ corridas, delta, alDeshacer })` con `role="status"`. Texto: «Se corrieron {N} actividades {|M|} días hábiles {antes|después}» (singular con 1) y el botón «Deshacer».
- El campo de días es `inputMode="numeric"` y se confirma al salir o con Enter, con el mismo patrón que el peso: texto local y previo comparado durante el render. Solo aparece en hojas con inicio.

- [ ] **Paso 1: pruebas.**
  - Escribir 10 en «Días hábiles» cambia el fin y el autoguardado envía el PUT con el fin nuevo.
  - Cambiar el fin de la primera hoja muestra el aviso con N correcto, y «Deshacer» restaura las fechas y envía otro PUT sin 409.
  - El aviso desaparece a los 8 s (con temporizadores falsos).
  - «Agregar actividad» crea la hoja con las fechas encadenadas.
- [ ] **Paso 2:** correr → FALLA. **Paso 3:** implementar. **Paso 4:** PASA.
- [ ] **Paso 5:** commit «Agrega la duración en días hábiles y el aviso de corrimiento».

### Task 7: Pesos relativos en la ficha

**Archivos:**

- Modificar: `FilaGantt.tsx` (peso relativo, el global en `title` y la marca de suma en las agrupadoras)
- Modificar: `DetalleActividad.tsx` (campo de peso también en agrupadoras; la etiqueta dice «Peso en {padre o el proyecto} (%)» y debajo «= X % del proyecto»)
- Crear: `apps/web/src/pantallas/ficha/cronograma/ResumenPesos.tsx`, que reemplaza el `Aviso` de pesos en `SeccionCronograma`
- Revisar: `pantallas/corte/RegistrarCorte.tsx` y `pantallas/imprimir/CronogramaImpresion.tsx` muestran `resultado.peso` (global); sin cambio si ya es así
- Pruebas: `apps/web/test/cronograma.test.tsx`

**Interfaces:**

- Consume: `ResultadoNodo.pesoRelativo` (Task 1), `resumenPesos` y `Aviso 'pesos_grupo'` (Task 2).
- `ResumenPesos({ resumen, alAbrir(id) })`, siempre visible si hay actividades:
  - completo: «Pesos: proyecto 100 % ✓»;
  - incompleto: «Pesos: proyecto 92 % · falta 8 %», con cada grupo incompleto como botón «1.2 suma 90 %» que abre la fila.
  - El tono es ámbar si falta y alerta (`alerta-texto`) si sobra.
- Marca en la fila de una agrupadora con `pesos_grupo`: «suma 90 %» con el mismo tono, junto al peso.
- Con la regla obligatoria, el aviso de «Guardar corte» sigue saliendo de `pesosCompletos`.

- [ ] **Paso 1: pruebas.** Una agrupadora cuyas hijas suman 90 % muestra «suma 90 %» en su fila y el resumen dice «1 suma 90 %» (o el ítem que toque). Escribir el peso de la agrupadora en el detalle envía el PUT con ese peso. La fila de una hoja muestra el relativo, y su `title` dice «12 % del proyecto».
- [ ] **Paso 2:** FALLA. **Paso 3:** implementar. **Paso 4:** PASA. Ajustar las pruebas de `ficha` y de `corte` que asumían el aviso anterior.
- [ ] **Paso 5:** commit «Muestra pesos relativos y el resumen de pesos en la ficha».

### Task 8: Indicadores ordenados

**Archivos:**

- Modificar: `apps/web/src/pantallas/ficha/complementos/SeccionIndicadores.tsx` (`COLUMNAS` y bloque de meta)
- Pruebas: `apps/web/test/indicadores.test.tsx` (las que ya existen deben seguir pasando)

**Interfaces:**

- `COLUMNAS` desde `md`: `28px_minmax(0,1fr)_minmax(0,1.25fr)_9.5rem_minmax(0,1.25fr)_auto`. Fórmula y Observaciones quedan del mismo ancho.
- Bloque de meta: operador (`select` angosto), valor de `w-[5rem]` alineado a la derecha y unidad de `w-[3.5rem]`, en una línea.
- Fórmula y Observaciones: área que crece con el texto (el mismo control que ya usan), con la misma altura mínima y `items-start`.

- [ ] **Paso 1:** ajustar el diseño. Revisar a 1280 y 390 px en el navegador: sin desborde y con `scrollWidth` igual al ancho de la ventana.
- [ ] **Paso 2:** `npx vitest run apps/web/test/indicadores.test.tsx` → PASA.
- [ ] **Paso 3:** commit «Ordena las columnas de los indicadores».

### Task 9: Redacción de los riesgos de RF1, PC1 y AC1

**Archivos:**

- Crear: `docs/propuestas/riesgos-2026-11-18.md`, con el antes y el después por charter y riesgo: nombre, causas y mitigación. Probabilidad e impacto no cambian.

- [ ] **Paso 1:** leer los riesgos actuales de Neon (MCP `run_sql`, solo lectura, proyecto `long-thunder-56263689`) y del contexto de cada charter (objetivo, alcance, cronograma).
- [ ] **Paso 2:** redactar.
  - **Nombre:** dice qué puede pasar y su efecto, en ≤ 120 caracteres.
  - **Causas:** 2–3 causas concretas.
  - **Mitigación:** acciones verificables con responsable o rol cuando se sepa.
- [ ] **Paso 3: pausa.** Mostrar el documento al usuario y esperar su visto bueno o sus cambios.
- [ ] **Paso 4:** respaldar los riesgos actuales (JSON en `respaldo-projectcharter-2026-11-18/`). Cargar en Neon con un script `tsx` temporal que use el upsert de `complementos.ts` (mismas validaciones y mismos ids), primero contra una copia. Repetir en la base local si el `npm run dev` del usuario está detenido; si no, por la API desde el navegador. Borrar el script.
- [ ] **Paso 5:** commit del documento, «Propone y carga la nueva redacción de los riesgos».

### Task 10: Cierre

- [ ] **Paso 1:** `npm test` (la API aparte, con `--maxWorkers=2`), `npm run lint`, `npm run build` y `npm run e2e` → todo verde. Ajustar los E2E que usaban la columna Estado o pesos globales.
- [ ] **Paso 2:** una ronda en el navegador (1280 y 390 px) sobre RF1:
  - columnas y leyenda;
  - arrastrar un fin y ver el corrimiento y Deshacer;
  - días hábiles;
  - resumen y marcas de pesos;
  - indicadores.
    Revisar la consola.
- [ ] **Paso 3:** pasar `unslop` sobre la leyenda, el resumen de pesos, el aviso de corrimiento y los indicadores, respetando la dirección actual de DESIGN.md.
- [ ] **Paso 4:** «Cerremos sesión»: CLAUDE.md (decisiones: pesos relativos, encadenamiento, días hábiles), PENDIENTES.md y commit. Al publicar, el build de Vercel corre `migrar` y convierte los pesos en Neon: antes, respaldar Neon con una rama (`create_branch`, con aprobación del usuario).
