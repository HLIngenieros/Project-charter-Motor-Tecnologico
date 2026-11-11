# Parametrización y exportación — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El Admin fija las reglas de cálculo de los charters nuevos desde `/admin/parametros`, y cualquier ficha se exporta como PDF (documento completo A4) o JSON.

**Architecture:** El motor compartido recibe un objeto `Reglas` (pesos, umbrales, reparto, proyección, gracia) en lugar de solo `Umbrales`; con `REGLAS_POR_DEFECTO` da exactamente lo de hoy. La API guarda las reglas globales en una tabla de una fila y copia las vigentes a cada charter al crearlo (`charter.reglas` JSON + las columnas de umbrales que ya existen). La exportación JSON la arma un endpoint; el PDF es una vista de impresión en la web que reutiliza la vista del cronograma de la Fase 5 y la curva S en modo estático.

**Tech Stack:** el del proyecto (React + Vite + Tailwind, Fastify + Drizzle + SQLite, Zod, Vitest). Sin dependencias nuevas.

**Spec:** [docs/superpowers/specs/2026-11-11-parametrizacion-y-exportacion-design.md](../superpowers/specs/2026-11-11-parametrizacion-y-exportacion-design.md) (manda sobre este plan) · [docs/analisis-plantilla-excel.md](../analisis-plantilla-excel.md) §4 · [DESIGN.md](../../DESIGN.md) · [docs/planes/fase-5.md](fase-5.md) (vista del cronograma y curva S).

## Sesiones

| Sesión | Tareas | Resultado |
|---|---|---|
| 1 · Reglas | 1–4 | Motor con reglas, API de parámetros y copia al crear, exportar JSON |
| 2 · Web | 5–9 | Reglas en la ficha, pestaña de Admin, exportar JSON y PDF, cierre |

## Decisiones de este plan *(criterio técnico)*

- `calcularCronograma(raices, avances, fecha, reglas = REGLAS_POR_DEFECTO)`: el cuarto parámetro pasa de `Umbrales` a `Reglas`; se actualizan todos los llamadores (API: cortes; web: borrador, vista, Registrar corte, curva).
- `CharterDetalle.umbrales` se reemplaza por `CharterDetalle.reglas: Reglas` (los umbrales van dentro).
- `arbolHistorico` pasa de `apps/web/src/pantallas/ficha/vista.ts` al motor (`packages/shared/src/calculo/historico.ts`) porque el endpoint de exportar lo necesita; la web lo importa de `@charter/shared`.
- Guardado: tabla `parametros` (una fila, `id = 1`) con `reglas` (JSON), `actualizado_por` y `actualizado_en`; en `charter`, columna `reglas` (JSON, sin los umbrales, que siguen en sus columnas). Las reglas por defecto viven solo en el motor; sin fila en `parametros`, rigen ellas.
- El JSON se descarga desde la web con `api()` + `Blob` (mismo manejo de errores que el resto); el nombre del archivo lo arma la web.
- El PDF se abre en una pestaña nueva (`window.open`) en `/charters/:id/imprimir[?corte=]`, que llama `window.print()` una vez cargada.

## Global Constraints

- Todo lo de las Fases 3–5 sigue vigente: español de tú, formato `es-CO`, `{ error: { codigo, mensaje } }`, `cargarCharter` en toda ruta de charters, Admin de solo lectura en charters ajenos, contraste del semáforo, `useVariantes`/movimiento reducido.
- **Con `REGLAS_POR_DEFECTO` todo da igual que hoy**: la prueba de aceptación 12,51 % / 12,47 % y las demás pruebas del motor pasan sin tocarse (solo cambia la firma).
- **Un cambio de reglas solo afecta a los charters creados después.** Un corte registrado no cambia nunca.
- Reglas: `sumaPesos` `'aviso' | 'obligatoria'` · `sinPeso` `'fuera' | 'repartir'` · `umbrales` 0–100 con atención < riesgo < atraso · `reparto` `'calendario' | 'habiles'` · `proyeccion` `'desviacion' | 'ritmo'` · `diasGracia` entero 0–365.
- Copy fijo: «Los cambios aplican a los charters que se creen desde ahora. Los charters existentes conservan sus reglas.» · «Los pesos de las actividades deben sumar 100 % para registrar un corte.» (409 `pesos_incompletos`).
- PDF: A4 vertical, márgenes 14 mm, Chrome y Edge; orden encabezado → razón de ser → objetivos → curva S → cronograma → supuestos y criterios → historial de cortes.
- Ejecución directa; pruebas con cada tarea; suite completa, lint, build y una ronda de navegador al cerrar (Task 9). Commits en español, imperativo y breves, con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. **No hacer push.**

## Review Focus

1. **Charters existentes tras la migración:** abren con las reglas por defecto y sus umbrales propios; sus cortes dan las mismas cifras que antes de migrar. → Task 3 (prueba de migración).
2. **Admin cambia las reglas con charters creados:** los existentes no cambian; uno nuevo usa las nuevas; un charter nuevo de *otro* usuario también. → Task 3.
3. **`repartir` con pesos que ya suman ≥ 100 %:** las hojas sin peso quedan en 0, fuera del cálculo, sin dividir por cero ni pesos negativos. → Task 1.
4. **Exportar un `?corte=` que no existe o un charter ajeno:** el JSON responde 404 `no_encontrado` (corte) o el 404 del aislamiento (charter); la vista de impresión muestra el último corte con el mismo aviso que la ficha. → Tasks 4 y 8.
5. **`habiles` con una hoja de fin de semana o un corte en sábado:** la hoja cuenta como de 1 día hábil y el planeado de un sábado es el del viernes. → Task 2.

---

## Sesión 1 · Reglas

### Task 1: Motor · reglas, pesos efectivos y gracia

**Files:**
- Create: `packages/shared/src/calculo/reglas.ts`, `packages/shared/src/calculo/historico.ts` (movido desde `apps/web/src/pantallas/ficha/vista.ts`), `packages/shared/src/esquemas/reglas.ts`
- Modify: `calculo/cronograma.ts`, `calculo/cortes.ts`, `calculo/curvas.ts`, `calculo/validacion.ts`, `calculo/index.ts`, `esquemas/index.ts`; en la web, los imports de `arbolHistorico` (borrar `vista.ts` y mover su prueba)
- Test: `packages/shared/test/reglas.test.ts`, `packages/shared/test/historico.test.ts` (desde `apps/web/test/vista-historica.test.ts`)

**Interfaces:**
- Produces (`reglas.ts`):
  ```ts
  export interface Reglas {
    sumaPesos: 'aviso' | 'obligatoria'
    sinPeso: 'fuera' | 'repartir'
    umbrales: Umbrales
    reparto: 'calendario' | 'habiles'
    proyeccion: 'desviacion' | 'ritmo'
    diasGracia: number
  }
  export const REGLAS_POR_DEFECTO: Reglas  // aviso, fuera, 10/25/50, calendario, desviacion, 0
  /** Peso con que entra cada hoja con fechas válidas (repartido si aplica) y si fue automático. */
  export function pesosEfectivos(raices: NodoArbol[], sinPeso: Reglas['sinPeso']): Record<string, { peso: number; auto: boolean }>
  /** true si las hojas programadas suman 100 % (± 0,0001). */
  export function pesosCompletos(raices: NodoArbol[], reglas: Reglas): boolean
  ```
- Changes: `calcularCronograma(raices, avances, fecha, reglas: Reglas = REGLAS_POR_DEFECTO)`; `ResultadoNodo.pesoAuto: boolean`; `hojasProgramadas(raices, reglas = REGLAS_POR_DEFECTO)` devuelve las hojas con su **peso efectivo** en `peso`; `totalesDeFoto(foto, fecha, terminadas, reglas = REGLAS_POR_DEFECTO)`; `curvaSPlaneada(raices, reglas = REGLAS_POR_DEFECTO)`; `validarCronograma(raices, reglas = REGLAS_POR_DEFECTO)` (el aviso `pesos_no_suman_100` usa pesos efectivos; con `obligatoria` su mensaje agrega « Debes completarlos para registrar un corte.»).
- Produces (`esquemas/reglas.ts`): `reglasEntrada` (Zod; `umbrales` con el refinamiento atención < riesgo < atraso, mensaje «Los umbrales deben ir de menor a mayor: atención, riesgo, atraso.»; `diasGracia` entero 0–365) y `type ReglasEntrada`.
- Produces (`historico.ts`): `arbolHistorico(acts, foto): ArbolHistorico` sin cambios de firma.

- [ ] **Step 1: Pruebas** en `reglas.test.ts`:
  - `REGLAS_POR_DEFECTO` sobre el fixture del Excel da 12,51 % / 12,47 % (igual que la prueba de aceptación).
  - `pesosEfectivos` con `repartir`: hojas con peso 0,3 y 0,3 y dos con fechas y peso `null` → las vacías reciben 0,2 cada una con `auto: true`; una con peso `0` escrito queda en 0 y `auto: false`; una sin fechas no recibe nada.
  - `repartir` con pesos que ya suman 1,1 → las vacías quedan en 0 y el proyecto pondera solo sobre las demás.
  - `calcularCronograma` con `repartir` marca `pesoAuto` en el resultado de la hoja repartida.
  - `diasGracia: 3`: hoja con fin 10-mar al 50 % → al 12-mar no es `vencida`, al 14-mar sí; su agrupadora cuenta `vencidas: 1` solo el 14.
  - `pesosCompletos`: 0,5 + 0,5 → true; 0,5 + 0,4 → false; con `repartir` y una vacía, 0,5 + 0,4 + vacía → true.
  - `validarCronograma` con `obligatoria` y pesos en 90 % → el mensaje termina en «Debes completarlos para registrar un corte.».
  - `reglasEntrada` rechaza umbrales 25/10/50 con el mensaje de orden y `diasGracia: 1.5`.
- [ ] **Step 2:** `npm test -w @charter/shared -- reglas` → FALLA.
- [ ] **Step 3:** Implementar. La gracia entra en `estadoDe` (`t > fin + diasGracia`), para hojas y agrupadoras; los pesos efectivos se calculan una vez al comienzo de `calcularCronograma`.
- [ ] **Step 4:** Mover `arbolHistorico` y su prueba; `npm test -w @charter/shared` y `npm test -w @charter/web` → PASAN (todas las previas sin cambios de valores).
- [ ] **Step 5:** Commit `Agrega las reglas de pesos y de gracia al motor`.

### Task 2: Motor · días hábiles y proyección por ritmo

**Files:**
- Modify: `packages/shared/src/calculo/fechas.ts`, `calculo/cronograma.ts`
- Test: `packages/shared/test/reglas-calculo.test.ts`

**Interfaces:**
- Produces (`fechas.ts`): `diasHabiles(desde: number, hasta: number): number` (días lunes a viernes entre dos números de día, ambos incluidos; 0 si `hasta < desde`), `sumarHabiles(dia: number, n: number): number` (avanza o retrocede `n` días hábiles; desde un sábado o domingo, cuenta desde el siguiente hábil hacia adelante o el anterior hacia atrás).
- Consumes: `Reglas` (Task 1).
- Comportamiento:
  - `reparto: 'habiles'` → por hoja: `durH = max(1, diasHabiles(ini, fin))`, `pv = recortar(diasHabiles(ini, min(t, fin)) / durH)` (con una hoja sin días hábiles, `pv = t >= fin ? 1 : 0`), `desv = (ev − pv) × durH`, forecast `max(t, sumarHabiles(fin, −round(desv)))`. `dur` del resultado sigue en días calendario. Agrupadoras: `desv` con `diasHabiles(ini, fin)`.
  - `proyeccion: 'ritmo'` → por hoja con `ev < 1` y `spi > 0`: forecast `max(t, ini + ceil(durX / spi) − 1)` en la unidad del reparto (`durX` = calendario o hábiles; con hábiles, `sumarHabiles(ini, ceil(durH / spi) − 1)`); si `spi` es `null` o 0, la regla de desviación. Agrupadoras y proyecto: el mayor de sus hojas, como hoy.

- [ ] **Step 1: Pruebas:**
  - `diasHabiles` lun 2-mar-2026 a dom 8-mar-2026 → 5; sáb a dom → 0.
  - Hoja lun 2-mar a vie 13-mar, `habiles`: el sáb 7-mar tiene el mismo `pv` que el vie 6-mar (5/10 = 0,5).
  - Hoja sáb 7-mar a dom 8-mar, `habiles`: `pv` 0 el 7-mar y 1 el 8-mar; está programada.
  - `ritmo`: hoja de 10 días (1–10 mar), al 5-mar con 25 % real (spi 0,5) → forecast 20-mar; con `desviacion` la misma hoja da `max(t, fin − desv)` como hoy.
  - `ritmo` en una hoja por iniciar (pv 0) → forecast igual al de `desviacion`.
- [ ] **Step 2:** `npm test -w @charter/shared -- reglas-calculo` → FALLA; implementar; → PASA, y toda la suite de shared sigue pasando.
- [ ] **Step 3:** Commit `Agrega el reparto por días hábiles y la proyección por ritmo`.

### Task 3: API · parámetros globales, copia al crear y reglas en los cortes

**Files:**
- Create: `apps/api/src/modulos/admin/{parametros.ts,rutas.ts}`, migración `apps/api/drizzle/0003_reglas.sql` (con `drizzle-kit generate`; revisar el `INSERT … SELECT` si recrea `charter`)
- Modify: `db/esquema.ts` (tabla `parametros`; `charter.reglas` texto JSON no nulo con default de las reglas por defecto sin umbrales), `app.ts` (registrar `rutasAdmin` con prefijo `/admin`), `modulos/charters/servicio.ts` (`crearCharter` copia; `detalleCharter` trae `reglas`), `modulos/cortes/servicio.ts` (`reglasDe(fila)` reemplaza a `umbralesDe`; `pesos_incompletos`), `packages/shared/src/esquemas/charter.ts` (`CharterDetalle.reglas: Reglas`, sin `umbrales`), el resumen del portafolio si usa umbrales
- Test: `apps/api/test/parametros.test.ts`, `apps/api/test/cortes.test.ts` (casos nuevos)

**Interfaces:**
- Produces (HTTP, con `exigirSesion` + `exigirAdmin` → 403 `solo_admin`):
  - `GET /api/admin/parametros` → `ParametrosRespuesta = { reglas: Reglas; actualizadoPor: { id: string; nombre: string } | null; actualizadoEn: string | null }`
  - `PUT /api/admin/parametros` cuerpo `ReglasEntrada` → `ParametrosRespuesta` (400 con el mensaje de Zod si no valida)
- Produces (`parametros.ts`): `leerReglasVigentes(db): Reglas`, `guardarReglas(db, usuarioId, reglas): ParametrosRespuesta`, `reglasDeCharter(fila: FilaCharter): Reglas` (une la columna JSON con los umbrales de sus columnas).
- `ParametrosRespuesta` va en `packages/shared/src/esquemas/reglas.ts`.

- [ ] **Step 1: Pruebas** en `parametros.test.ts`:
  - Un usuario normal recibe 403 `solo_admin` en GET y PUT.
  - Sin cambios, GET devuelve `REGLAS_POR_DEFECTO` y `actualizadoPor: null`.
  - PUT válido guarda y devuelve `actualizadoPor` con el nombre del Admin; umbrales 25/10/50 → 400.
  - Tras el PUT (umbrales 5/15/30, `sinPeso: 'repartir'`): un charter creado **antes** sigue con 10/25/50 y `fuera` en su detalle; uno creado **después** por otro usuario trae 5/15/30 y `repartir`.
  - Migración: un charter con umbrales 8/20/40 creado antes de migrar (insertarlo en la base de prueba antes de aplicar 0003, o con las columnas directamente) trae esos umbrales y el resto por defecto.
- [ ] **Step 2: Pruebas** en `cortes.test.ts`:
  - Charter con `sumaPesos: 'obligatoria'` y pesos en 90 % → `PUT /cortes/:fecha` nuevo da 409 `pesos_incompletos` con el mensaje fijo; con 100 % pasa.
  - Editar un corte de ese charter cuya foto suma 100 % pasa aunque el cronograma actual ya no sume 100 %.
  - Charter con `repartir` y una hoja sin peso: la foto del corte guarda el peso repartido.
  - Los totales de un corte de un charter existente son los mismos antes y después de cambiar las reglas globales.
- [ ] **Step 3:** `npm test -w @charter/api -- parametros cortes` → FALLA; implementar; → PASAN; `npm test` completo pasa (la web puede fallar en tipos hasta la Task 5: en ese caso, ajustar ya los usos de `charter.umbrales` → `charter.reglas.umbrales` en `Ficha.tsx` y los fixtures `detalle` de las pruebas web, sin más cambios).
- [ ] **Step 4:** Commit `Agrega los parámetros globales y la copia de reglas al crear un charter`.

### Task 4: API · exportar el charter en JSON

**Files:**
- Create: `apps/api/src/modulos/charters/exportar.ts`, `packages/shared/src/esquemas/exportacion.ts`
- Modify: `modulos/charters/rutas.ts` (ruta), `esquemas/index.ts`
- Test: `apps/api/test/exportar.test.ts`

**Interfaces:**
- Produces (HTTP): `GET /api/charters/:id/exportar?corte=YYYY-MM-DD` con `cargarCharter(…, 'lectura')` → `ExportacionCharter`. `corte` omitido o igual al último = vista actual; fecha que no es un corte → 404 `no_encontrado` «No hay un corte en esa fecha.».
- Produces (`exportacion.ts`):
  ```ts
  export interface ExportacionCharter {
    formato: 'project-charter'
    version: 1
    generadoEn: string            // ISO
    corte: FechaISO | null        // fecha exportada; null sin cortes
    charter: CharterDetalle       // incluye listas y reglas
    cronograma: {
      actividades: ActividadEntrada[]                // A–J actuales (en un corte pasado, con peso y fechas de la foto)
      calculo: Record<string, ResultadoNodo>         // a la fecha exportada, con las reglas del charter
      proyecto: ResultadoNodo
    }
    cortes: CorteDetalle[]        // todos, con su foto, del más viejo al más reciente
  }
  ```
- Consumes: `arbolHistorico`, `calcularCronograma`, `reglasDeCharter`, `listarCortes`/`detalleCorte`, `leerCronograma`.
- Cálculo: vista actual = cronograma actual con los avances del último corte (y sus terminaciones) a su fecha, o a hoy sin avances si no hay cortes; corte pasado = `arbolHistorico` con su foto a su fecha (como la ficha). En un corte pasado, `proyecto` toma pv/ev/desv/estado/vencidas del resumen guardado.

- [ ] **Step 1: Pruebas:** dueño recibe `formato`, `version`, 2 cortes con foto, `corte` = último y `cronograma.proyecto.ev` = el del último corte; `?corte=` del primero → `proyecto.pv` = el guardado de ese corte; `?corte=2020-01-01` → 404; otro usuario → 404 del aislamiento; Admin → 200.
- [ ] **Step 2:** `npm test -w @charter/api -- exportar` → FALLA; implementar; → PASA.
- [ ] **Step 3:** Commit `Agrega la exportación del charter en JSON`.

---

## Sesión 2 · Web

### Task 5: Web · reglas del charter en la ficha y en Registrar corte

**Files:**
- Modify: `pantallas/ficha/Ficha.tsx`, `cronograma/useBorradorCronograma.ts`, `useVistaCronograma.ts`, `curva/SeccionCurvaS.tsx`, `cronograma/FilaGantt.tsx`, `cronograma/DetalleActividad.tsx`, `pantallas/corte/RegistrarCorte.tsx` (y su `Formulario`)
- Test: `apps/web/test/cronograma.test.tsx`, `apps/web/test/registrar-corte.test.tsx`

**Interfaces:**
- Consumes: `CharterDetalle.reglas` (Task 3), `ResultadoNodo.pesoAuto`, `pesosCompletos`, `validarCronograma(raices, reglas)` (Task 1).
- Changes: `useBorradorCronograma(id, encolar, reglas: Reglas)`, `useVistaCronograma(charterId, borrador, reglas: Reglas)`, `SeccionCurvaS` recibe `reglas` en lugar de `umbrales` (usa `reglas.umbrales` en `estadoPorBrecha` y pasa `reglas` a `curvaSPlaneada`).
- UI: en el Gantt y el detalle, una hoja con `pesoAuto` muestra su peso efectivo y la marca «auto» (`title="Peso repartido automáticamente"`). Registrar corte usa las reglas del charter (hoy usa las por defecto); con `obligatoria` y pesos incompletos muestra `Aviso tono="alerta"` con el copy fijo y deshabilita «Guardar corte».

- [ ] **Step 1: Pruebas:** con `repartir`, una hoja sin peso muestra «20,0 %» y «auto» en su fila; con `obligatoria` y pesos en 90 %, Registrar corte muestra «Los pesos de las actividades deben sumar 100 % para registrar un corte.» y el botón está deshabilitado; con umbrales del charter 5/25/50, Registrar corte clasifica con ellos (caso de brecha 6,6 → «En atención»).
- [ ] **Step 2:** `npm test -w @charter/web -- cronograma registrar-corte` → FALLA; implementar; → PASAN, y la suite web completa pasa.
- [ ] **Step 3:** Commit `Usa las reglas del charter en la ficha y en Registrar corte`.

### Task 6: Web · área de Admin con la pestaña Parametrización

**Files:**
- Create: `apps/web/src/api/admin.ts`, `apps/web/src/pantallas/admin/{AreaAdmin.tsx,Parametrizacion.tsx}`
- Modify: `app/rutas.tsx` (`/admin` → redirige a `/admin/parametros`; ambas con `RutaProtegida` y, si `!esAdmin`, `Navigate` a `/`), `app/MenuUsuario.tsx` (enlace «Administración» solo para Admin)
- Test: `apps/web/test/parametrizacion.test.tsx`

**Interfaces:**
- Produces (`api/admin.ts`): `useParametros()` (GET, clave `['admin', 'parametros']`), `useGuardarParametros()` (PUT; al terminar actualiza la consulta).
- `AreaAdmin({ children })`: título «Administración» y pestañas (por ahora solo «Parametrización», con `aria-current="page"`), dentro de `Layout`.
- `Parametrizacion`: formulario con seis bloques, cada uno con su título, una frase de qué hace y un ejemplo corto:
  - «Suma de pesos»: radio «Solo avisar» / «Obligatoria para registrar un corte».
  - «Actividades sin peso»: radio «Dejarlas fuera del cálculo» / «Repartir lo que falte en partes iguales».
  - «Semáforo»: tres números (Atención, Riesgo, Atraso) en puntos de brecha.
  - «Reparto del planeado»: «Días calendario» / «Días hábiles (lunes a viernes)».
  - «Proyección del fin»: «Por la desviación» / «Al ritmo actual (SPI)».
  - «Vencida»: número «Días de gracia».
  - Arriba, `Aviso tono="info"` con el copy fijo de alcance. Abajo: «Guardar» (deshabilitado sin cambios), «Restablecer valores de fábrica» (carga `REGLAS_POR_DEFECTO` en el formulario, sin guardar) y «Modificado por {nombre} el {fecha}» si hay `actualizadoPor`. Errores de la API en `Aviso tono="alerta"`; al guardar, `Aviso tono="ok"` «Parámetros guardados.».
  - Diseño con la skill de front del proyecto (DESIGN.md: tarjetas, `Selector`/radios existentes, tipografía y espaciado de la ficha).

- [ ] **Step 1: Pruebas:** un usuario normal en `/admin/parametros` termina en `/` y no ve «Administración» en el menú; el Admin ve el enlace, la pantalla carga las reglas, cambia «Atraso» a 40 y guarda → `PUT` con `umbrales.atraso: 40` y aparece «Parámetros guardados.»; «Restablecer valores de fábrica» vuelve a 10/25/50 sin llamar a la API; un 400 de la API se muestra como alerta.
- [ ] **Step 2:** `npm test -w @charter/web -- parametrizacion` → FALLA; implementar; → PASA.
- [ ] **Step 3:** Commit `Agrega la pestaña de parametrización del Admin`.

### Task 7: Web · menú Exportar y descarga JSON

**Files:**
- Create: `apps/web/src/pantallas/ficha/MenuExportar.tsx`, `apps/web/src/api/exportar.ts`
- Modify: `pantallas/ficha/Ficha.tsx` (el menú va en la banda, antes de «Registrar corte», siempre visible: dueño, Admin, solo lectura y vista histórica)
- Test: `apps/web/test/exportar.test.tsx`

**Interfaces:**
- Produces (`api/exportar.ts`): `descargarJson(charter: { id: string; nombre: string; codigo: string | null }, corte: FechaISO | null): Promise<void>` — `api<ExportacionCharter>` con `?corte=` si hay, `Blob` `application/json` con `JSON.stringify(datos, null, 2)` y descarga como `charter-<slug>-<fecha>.json` (slug de `codigo` o, si no hay, `nombre`: minúsculas, sin tildes, guiones; fecha = `datos.corte ?? hoyISO()`). `rutaImpresion(id: string, corte: FechaISO | null): string` → `/charters/:id/imprimir` con `?corte=` si hay.
- `MenuExportar({ charter, corte })`: botón «Exportar ▾» con el patrón de menú de `SelectorCorte`/`MenuCharter`; opciones «PDF» (`window.open(rutaImpresion(…), '_blank')`) y «JSON» (`descargarJson`; error en un `Aviso` bajo la banda o con el mensaje de la API).

- [ ] **Step 1: Pruebas** (con `URL.createObjectURL` y `window.open` simulados): «JSON» pide `/api/charters/c1/exportar` y descarga `charter-plan-ti-2026-11-09.json`; en la vista de un corte pasado pide `?corte=2026-11-02`; «PDF» abre `/charters/c1/imprimir?corte=2026-11-02`; el menú aparece también en solo lectura.
- [ ] **Step 2:** `npm test -w @charter/web -- exportar` → FALLA; implementar; → PASA.
- [ ] **Step 3:** Commit `Agrega el menú Exportar con la descarga en JSON`.

### Task 8: Web · vista de impresión (PDF)

**Files:**
- Create: `apps/web/src/pantallas/imprimir/{Imprimir.tsx,CronogramaImpresion.tsx,imprimir.css}`
- Modify: `app/rutas.tsx` (`/charters/:id/imprimir`, con `RutaProtegida`, **sin** `Layout`), `pantallas/ficha/curva/CurvaS.tsx` (props `estatica?: boolean` y `ancho?: number`), `pantallas/ficha/cronograma/escala.ts` (`rangoProyecto`)
- Test: `apps/web/test/imprimir.test.tsx`

**Interfaces:**
- Consumes: `useCharter`, `useBorradorCronograma` (con un `encolar` que no hace nada: la vista no edita), `useVistaCronograma` (lee `?corte=` igual que la ficha), `useCortes`, `CurvaS`, `PistaGantt` (`soloLectura`), `chipDe`, formato.
- Produces:
  - `CurvaS` con `estatica`: sin animaciones de entrada, sin capa de puntero ni lectura, puntos de corte como círculos SVG (sin botones); con `ancho`, no mide con `ResizeObserver`.
  - `rangoProyecto(p: { inicio: FechaISO | null; fin: FechaISO | null; forecast?: FechaISO | null }): Rango` — del inicio − 7 días al mayor de fin y forecast + 8 días.
  - `CronogramaImpresion({ vista })`: tabla con todas las filas desplegadas; columnas ítem, actividad (sangrada por nivel), peso, inicio, fin, estado (chip), real %, pista (`PistaGantt` a `rangoProyecto`); `thead` que se repite en cada hoja; filas con `break-inside: avoid`.
  - `Imprimir`: secciones en el orden de las Global Constraints, con los mismos datos que la ficha (lista vacía → «Sin registrar»); aviso de `?corte=` inválido como en la ficha; pie con nombre del charter, «Corte del …», «Generado el …» y «Página n de m»; en pantalla, una barra (oculta al imprimir) con «Imprimir o guardar como PDF» y «Volver a la ficha». Llama `window.print()` una sola vez cuando charter, cronograma y cortes cargaron.
  - `imprimir.css`: `@page { size: A4; margin: 14mm }`, secciones `break-inside: avoid-page` cuando caben, la curva nunca se parte, colores con `print-color-adjust: exact`.

- [ ] **Step 1: Pruebas** (con `window.print` simulado): las secciones aparecen en el orden fijado (por sus títulos); el cronograma lista todas las filas aunque haya agrupadoras; con `?corte=` del primer corte el encabezado muestra los valores guardados de ese corte y «Corte del 2 nov 2026»; `?corte=2020-01-01` muestra el aviso «No hay un corte en esa fecha; se muestra el último.»; `window.print` se llama una vez; la curva no tiene botones de corte.
- [ ] **Step 2:** `npm test -w @charter/web -- imprimir curva-s` → FALLA; implementar; → PASAN (las pruebas de la curva interactiva siguen pasando).
- [ ] **Step 3:** Commit `Agrega la vista de impresión de la ficha`.

### Task 9: Cierre

- [ ] **Step 1:** `npm test`, `npm run lint` y `npm run build` → todo en verde.
- [ ] **Step 2:** Navegador (Chromium, build de producción): `/admin/parametros` como Admin a 1440 y 390 px; exportar JSON y abrir la vista de impresión de un charter con 3 cortes y de uno en un corte pasado; revisar la vista previa de impresión (`page.pdf` de Playwright en A4) — sin filas ni curva partidas, pie con página n de m, colores del semáforo visibles; consola sin errores.
- [ ] **Step 3:** Documentación: `docs/arquitectura.md` (tabla `parametros`, `charter.reglas`, rutas `/admin/parametros` y `/charters/:id/exportar`, vista `/imprimir`), `docs/plan-implementacion.md` (T7.4 Parametrización nueva y T8.1 hecha con JSON), `PENDIENTES.md` y `CLAUDE.md` (decisiones).
- [ ] **Step 4:** Commit `Cierra la parametrización y la exportación`.
