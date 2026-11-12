# Pendientes

**Estados:** `[ ]` pendiente · `[~]` en curso · `[x]` hecha. Detalle y criterios de terminado de cada tarea en [docs/plan-implementacion.md](docs/plan-implementacion.md).

## Fase 0 · Arranque

- [x] T0.1 · Limpiar el proyecto, mover el repo a la raíz y archivar el trabajo anterior — 2026-11-09
- [x] T0.2 · Analizar el Excel (hoja ID & TI y anexos) y el PDF de identidad — 2026-11-09
- [x] T0.3 · Reescribir el README y especificar los cálculos — 2026-11-09

## Fase 1 · Diseño

- [x] T1.1 · Arquitectura ([docs/arquitectura.md](docs/arquitectura.md)) — 2026-11-09
- [x] T1.2 · Plan general ([docs/plan-implementacion.md](docs/plan-implementacion.md)) — 2026-11-09
- [x] T1.3 · Pantallas y flujos con maquetas · aprobadas el 2026-11-09 con la curva S como protagonista (`docs/maquetas/`, `docs/pantallas.md`)

## Fase 2 · Cimientos

- [x] T2.1 · Monorepo (apps/api, apps/web, packages/shared) — 2026-11-09
- [x] T2.2 · Fixture del Excel en JSON — 2026-11-09
- [x] T2.3 · Motor de cálculo con prueba de aceptación (12,51 % / 12,47 %) — 2026-11-09
- [x] T2.4 · Esquemas Zod compartidos — 2026-11-09
- [x] T2.5 · Base de datos y migraciones — 2026-11-09
- [x] T2.6 · Autenticación (registro por dominio, sesiones, CLI de Admin) — 2026-11-09
- [x] T2.7 · Aislamiento por dueño y lectura del Admin — 2026-11-09
- [x] T2.8 · Sistema de diseño — 2026-11-09
- [x] T2.9 · Pantallas de acceso — 2026-11-09

### Pendientes de la revisión de la Fase 2

- [ ] Límite de intentos por IP también en `POST /auth/registro`.
- [x] Motor: `pct` no numérico (o no finito) cuenta como 0 y `construirArbol` rechaza ids repetidos (`id_duplicado`) — 2026-11-09
- [x] La prueba de zona horaria ya puede fallar: `hoyISO` usa `America/Bogota` y las pruebas de la API corren con `TZ=UTC` — 2026-11-11
- [x] Web: un error que no sea 401 en `/auth/yo` (API caída) muestra un aviso de conexión en vez de mandar a `/entrar`; `JSON.parse` protegido en `api/cliente.ts` — 2026-11-09
- [x] Contraste: el color de la categoría solo va en el punto y el fondo del chip; el texto es `tinta` (T3.2) — 2026-11-09
- [x] Regla de estado por brecha en puntos (10 / 25 / 50) con estado `vencida` y conteo de vencidas en agrupadoras (§4.4) — 2026-11-09
- [x] Actualizar la demo del semáforo en el [resumen visual](https://claude.ai/artifact/NX8tLwQ1npVZoC9NcrffBC) con la regla por brecha — 2026-11-09
- [x] T5.4: tonos del semáforo con prueba de contraste (naranja `#de781c`; amarillo con borde en la curva) — 2026-11-10
- Seguridad y despliegue (helmet, argon2, purga de sesiones, dominio en la web, bundle) quedaron en T8.5; cerrar sesiones al desactivar, en T7.1.

## Fase 3 · Charter básico

Plan: [docs/planes/fase-3.md](docs/planes/fase-3.md). Sesiones: API (Tasks 1–3) · web base, portafolio y ficha (Tasks 4–6) · listas, estado y cierre (Tasks 7–9).

- [x] T3.1 · API de charters y listas — 2026-11-09
- [x] T3.2 · Portafolio — 2026-11-09
- [x] T3.3 · Ficha · Definición (encabezado, razón de ser, listas ordenables, estado, solo lectura y eliminar) — 2026-11-09

## Fase 4 · Cronograma y cortes

- [x] T4.1 · API de cronograma
- [x] T4.2 · Editor de cronograma A–J con cálculo vivo — 2026-11-10
- [x] T4.3 · API de cortes con foto de línea base
- [x] T4.4 · Pantalla de cortes (banda con cifras, historial y Registrar corte) — 2026-11-10
- [x] T4.5 · Hito: primer charter real · RF1 · Radicación de facturas (redacción, listas y cronograma de 25 actividades desde la reunión del Comité IA) — 2026-11-11

## Fase 5 · Visualización

Diseño: [docs/superpowers/specs/2026-11-10-fase-5-visualizacion-design.md](docs/superpowers/specs/2026-11-10-fase-5-visualizacion-design.md). Plan: [docs/planes/fase-5.md](docs/planes/fase-5.md). Sesiones: datos (Tasks 1–3, hecha) · ficha (Tasks 4–6, hecha) · portafolio y cierre (Tasks 7–9, hecha). **Fase cerrada 2026-11-11.**

- [x] T5.1 · Resumen con KPIs y selector de corte (ficha a una fecha en solo lectura) — 2026-11-11
- [x] T5.2 · Curva S — 2026-11-11
- [x] T5.3 · Gantt (fin proyectado, plegar a grupos, `memo`; 170 actividades sin trabarse) — 2026-11-11
- [x] T5.4 · Semáforos (tonos y umbrales del charter; sin bloque de avance por grupo, decisión del usuario) — 2026-11-11
- [x] T5.5 · Portafolio con avance, semáforo, vencidas y mini curva; mini curva en Registrar corte — 2026-11-11

## Fase 6 · Complementos

Diseño: [docs/superpowers/specs/2026-11-12-fase-6-complementos-design.md](docs/superpowers/specs/2026-11-12-fase-6-complementos-design.md). Plan: [docs/planes/fase-6.md](docs/planes/fase-6.md). Sesiones: datos (Tasks 1–2) · ficha (Tasks 3–4) · presupuesto, PDF y cierre (Tasks 5–6).

- [ ] T6.1 · Indicadores (solo definición; las mediciones quedan para después)
  - Cargar en RF1: días hábiles entre el cierre del mes y la radicación completa (meta ≤ 5) · % de facturas radicadas sin intervención manual (meta ≥ 90 %) · facturas pendientes al cierre (meta: tendencia a 0).
- [ ] T6.2 · Riesgos con matriz probabilidad × impacto
  - Cargar en RF1 (riesgo · causa · mitigación): facturas sin orden de compra · órdenes globales agotadas o con precios desactualizados · alerta temprana a Compras y al proyecto. Facturas que no llegan al buzón · el proveedor las retiene o el almacenista las pide a su correo · cruce obligatorio con la DIAN y circular a obras. No se pueden hacer los eventos en la DIAN · falta el XML · exigir PDF + XML en la regla mínima. Reglas de soportes difíciles de estandarizar · muchas excepciones por tipo de proveedor · arrancar con orden de compra + cumplido y sumar reglas por tipo. Contactos de proveedores desactualizados · Compras registra al vendedor, no al área financiera · coordinar con Compras (puede ser otra iniciativa). Alcance que crece · integración con Libra o portal de proveedores · ciclo acotado en el criterio de éxito 4.
- [ ] T6.3 · Presupuesto con barras por rubro y desglose (solo planeado)

## Fase 7 · Admin

- [ ] T7.1 · Cuentas
- [ ] T7.2 · Catálogos (categorías y áreas)
- [ ] T7.3 · Lectura global de charters
- [x] T7.4 · Parametrización (`/admin/parametros`). Plan: [docs/planes/parametrizacion-exportacion.md](docs/planes/parametrizacion-exportacion.md)

## Fase 8 · Cierre v1.0

- [x] T8.1 · Exportar a PDF y JSON (menú en la banda, vista de impresión A4 y descarga JSON)
- [ ] T8.2 · Charters de prueba A1, D1 y C1
- [ ] T8.3 · Pulido responsive y de movimiento
- [ ] T8.4 · Pruebas E2E
- [ ] T8.5 · Build de producción y despliegue → **Task 7 del plan de Vercel + Neon** (decisión del usuario: se publica con todo terminado)

## Despliegue en Vercel + Neon

Diseño: [docs/superpowers/specs/2026-11-11-despliegue-vercel-neon-design.md](docs/superpowers/specs/2026-11-11-despliegue-vercel-neon-design.md). Plan: [docs/planes/despliegue-vercel.md](docs/planes/despliegue-vercel.md). Sesiones: base y API asíncrona (Tasks 1–4) · fecha, acceso, Vercel y publicación (Tasks 5–7).

- [x] Antes de empezar: exportar el JSON de RF1 desde la app actual (los 8 charters y una copia de `charters.db` en `Documents/Desarrollos/respaldo-projectcharter-2026-11-11/`)
- [x] Task 1 · Esquema Postgres y conexión (PGlite / Neon)
- [x] Task 2 · Autenticación, sesiones y CLI asíncronos
- [x] Task 3 · Charters, catálogos y parámetros asíncronos
- [x] Task 4 · Cronograma y cortes asíncronos (versión dentro de la transacción)
- [x] Task 5 · Fecha de Bogotá y `CORREOS_PERMITIDOS` (cierra la prueba de zona horaria) — 2026-11-11
- [x] Task 6 · Adaptador (`apps/api/src/vercel.ts`, `api/index.js`), `vercel.json`, `npm run migrar` y Node 24 — 2026-11-11
- [ ] Task 7 · Publicación con el usuario (Neon, Vercel, verificación, RF1 y documentación) → **en la Fase 8 (T8.5)**

Menor anotado: dos PUT simultáneos que crean un corte en la misma fecha darían 500 por el índice único (no 409).

**Próxima tarea sugerida:** Fase 6 sesión 1 (Tasks 1–2 de [docs/planes/fase-6.md](docs/planes/fase-6.md)), **ejecución directa**, sin más preguntas: diseño y plan aprobados. Luego Fase 7 y Fase 8, que termina publicando (Task 7 del plan de Vercel). RF1 se recarga en PGlite desde el respaldo en la Task 6 (la base local arrancó vacía). Siguen abiertos: límite de intentos en `POST /auth/registro` y el 500 de cortes simultáneos.

## Registro de sesiones

| Fecha      | Tareas                            | Resumen                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-11-09 | T0.1–T0.3                         | Repo movido a la raíz, análisis del Excel (hallados doble conteo de pesos y la fila 1.2 mal calculada), README y especificación de cálculos. Commit 05596eb                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-11-09 | T1.1–T1.2                         | Decisiones cerradas (independiente de HH, registro por dominio, Admin de solo lectura, sin aprobación, local primero). Arquitectura, plan general y plan detallado de la Fase 2 aprobados. Jerarquía del Excel verificada por fórmulas de peso (12,51 % / 12,47 %)                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-11-09 | T2.1–T2.9                         | Fase 2 completa: monorepo, fixture del Excel, motor validado (12,51 % / 12,47 % y columna K hoja por hoja), esquemas Zod, base con 15 tablas, auth por dominio con sesiones y CSRF, aislamiento por dueño, sistema de diseño y pantallas de acceso. Revisión final: 0 críticos; corregidos fechas inexistentes, `CONFIAR_PROXY` y carga del `.env`. 129 pruebas, lint y build en verde. Commits f67264d…c80ad68. Después: clave mínima de 8 caracteres (usuario) y corrección de procesos de desarrollo huérfanos (EADDRINUSE). El usuario decidió ajustar la regla de estado en la próxima sesión                                                                                                                                         |
| 2026-11-09 | —                                 | Resumen visual de la propuesta publicado como artefacto privado: problema, demo del cálculo con Gantt y curva S, diagrama de arquitectura interactivo (5 escenarios y modo local/servidor), plan por fases y stack. Sin cambios de código                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-11-09 | Regla de estado                   | Semáforo por brecha en puntos (verde < 10, amarillo < 25, naranja < 50, rojo ≥ 50) y estado `vencida` (vinotinto); agrupadoras cuentan sus hojas vencidas. Migración 0001 con umbrales 10/25/50 (corregido el `INSERT` que generó drizzle-kit). 134 pruebas y lint en verde. Commit 03aed49. Instalada la skill Impeccable (global, con hook) para las maquetas                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-11-09 | T1.3                              | PRODUCT.md (líder de proyecto, éxito = dejar el Excel). Ficha elegida entre tres estructuras: documento vivo. Maquetas de portafolio, ficha (Gantt arrastrable, detalle A–J en línea, impresión A4), registro de corte "solo lo que toca" y vista celular, con port mínimo del motor. Tres rondas de revisión y DESIGN.md. Al aprobar, el usuario pidió la curva S protagonista (animada, con semáforo por corte, brecha, proyección y zoom). Desde ahora, Impeccable austero en validación                                                                                                                                                                                                                                                |
| 2026-11-09 | T3.1                              | Plan de la Fase 3 aprobado (9 tareas, repartidas en tres sesiones). Demo del semáforo del resumen visual con la regla por brecha. API de charters, catálogos y listas con aislamiento, solo lectura de cerrados y catálogos inactivos conservados. Lint excluye `docs/maquetas`. 169 pruebas, lint y build en verde. Commits 94d2fd0, 6ef31c6, eb402c4                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-11-09 | T3.2, T3.3 (parcial)              | Fase 3, Tasks 4–6: tokens del semáforo, chips, formato es-CO, cliente de charters y aviso de conexión; portafolio con filtros en la URL, estados vacíos y diálogo de nuevo charter; ficha con banda fija, índice, edición en su sitio y cola de guardado serial (reintentar y aviso al cerrar). Sin semáforo ni curva en el portafolio hasta T5.5. 44 pruebas web, tipos, lint y build en verde. Commits 763ba0f, d8a46c1, 3e529e8. Revisado también el uso de agentes y del plugin superpowers: el usuario decidió no cambiar la configuración por ahora                                                                                                                                                                                  |
| 2026-11-09 | T3.3, cierre Fase 3               | Tasks 7–9: listas ordenables (teclado, botones y animación de Motion) para objetivos, supuestos y criterios, con contadores en el índice; menú de estado en la banda (cerrar y cancelar con confirmación), solo lectura con «Reabrir», vista de Admin y eliminar; la cola atiende 401 (a `/entrar`) y 409 `charter_cerrado` (solo lectura con el mensaje). Recorrido en el navegador a 1440 y 390 px: corregidos íconos SVG sin `<svg>` y el ícono apilado en `Boton` (preflight pone `svg` en bloque). 210 pruebas (84 shared · 68 API · 58 web), lint y build en verde. Commits 2cf872b, aa678da y 9c02708. Después, ajustes del motor de la revisión de la Fase 2 (`pct` no numérico = 0 e `id_duplicado`), 212 pruebas, commit bb4f4a9 |
| 2026-11-10 | T4.1, T4.3, T4.2                  | Plan de la Fase 4 (9 tareas en tres sesiones). Sesión 1: esquemas y cálculos de cortes (12,51 % / 12,47 % con la foto), API del cronograma (PUT del árbol completo, versión entera `cronograma_version` con 409, 400 por árbol inválido, más de 6 niveles o ids ajenos) y API de cortes (foto de la línea base, crear o editar por fecha, `fecha_futura`, `corte_anterior`, hojas eliminadas conservadas). Sesión 2: Gantt en la ficha con detalle A–J en línea, guardado automático a 800 ms, arrastre, teclado y escala Trimestre/Semestre/Año. 277 pruebas (99 shared · 92 API · 86 web), tipos y lint en verde; build y navegador quedan para la Task 9. Commits 637f872…ffae5c4                                                       |
| 2026-11-10 | T4.2, T4.4, cierre Fase 4         | Tasks 7–9: banda con cifras animadas (`Cifra`, Motion) y estado del proyecto, historial de cortes con editar y eliminar, pantalla Registrar corte (vencidas / en curso / resto, reclasifica al cambiar la fecha, aviso si baja el %, editar sobre la foto con «actividad eliminada», barra fija en celular). El borrador del cronograma sube a la ficha para que banda y Gantt compartan cálculo. Ronda de navegador a 1440 y 390 px: arreglado el desborde horizontal por un `sr-only` absoluto dentro de la tabla y cifras partidas. Prueba intermitente de aislamiento: `instanceof ErrorApi` fallaba por módulo duplicado en Windows; ahora compara por nombre. 291 pruebas, lint y build en verde                                     |
| 2026-11-10 | Fase 5 · sesión 1                 | Diseño de la Fase 5 con compañero visual (selector de corte en banda, curva e historial; ficha a una fecha en solo lectura; sin bloque de avance por grupo; cortes guardados inmutables) y plan de 9 tareas. Tasks 1–3: proyección y lectura de la curva en el motor, resumen del portafolio con estado, vencidas y serie de cortes, umbrales en el detalle y en la ficha, prueba de contraste del semáforo (naranja `#de781c`). 314 pruebas y lint en verde. Commits 681d883…a29a80d                                                                                                                                                                                                                                                      |
| 2026-11-11 | T5.1–T5.3 · T7.4 y T8.1 (parcial) | Fase 5 sesión 2: selector de corte y ficha a una fecha en solo lectura, curva S protagonista (SVG, entrada por CSS porque `motion.path` no actualizaba el `d`), Gantt con fin proyectado, plegado y `memo` (170 actividades: arrastre p95 17 ms en producción). Pedido nuevo del usuario: parametrización del Admin y exportación PDF/JSON; diseño con maquetas (eligió el PDF completo en el orden de la ficha) y plan de 9 tareas. Sesión 1 del plan: reglas en el motor (pesos, umbrales, días hábiles, ritmo, gracia), parámetros globales con copia al crear y exportación JSON. 373 pruebas y lint en verde. Commits 03a98c3…09ada23                                                                                                 |
| 2026-11-11 | T7.4 y T8.1                       | Sesión 2 del plan de parametrización y exportación: reglas del charter en la ficha y en Registrar corte (peso «auto», suma obligatoria bloquea el corte), pestaña de Parametrización del Admin, menú Exportar (JSON y PDF) y vista de impresión A4 con curva estática, cronograma completo y pie con páginas. 389 pruebas, lint y build en verde; navegador revisado (Admin a 1440 y 390 px, JSON y PDF de un charter de 170 actividades en un corte pasado). Commits 43fc593…495927d                                                                                                                                                                                                                                                      |
| 2026-11-11 | T5.4, T5.5, cierre Fase 5         | Propuesta de redacción para RF1 · Radicación de facturas (primer charter real, a partir de la transcripción del Comité IA): razón de ser, objetivos, supuestos, criterios, indicadores, riesgos y cronograma de 6 fases; cargado en el sistema a pedido del usuario (salvo indicadores y riesgos, sin sección aún). Fase 5 sesión 3: portafolio con avance «real de planeado», barra y chip del semáforo, vencidas, filtro «Con vencidas» y `MiniCurvaS` (desde 1024 px, escala hasta el mayor valor); mini curva con el punto nuevo en Registrar corte; el aviso «Corte guardado» se borra del historial. 396 pruebas, lint y build en verde; navegador a 1440 y 390 px. Commits 33fa829…b086bdd                                          |
| 2026-11-11 | Despliegue (diseño y plan)        | Revisión de pendientes y de opciones de hosting gratuito. El PC no puede estar siempre prendido, así que el usuario eligió Vercel (Hobby, uso personal) + Neon. Diseño: Postgres en todas partes (PGlite en desarrollo y pruebas), API asíncrona, versión del cronograma dentro de la transacción, migraciones en el build, función que reenvía `/api` a Fastify, fecha de Bogotá y `CORREOS_PERMITIDOS`. Plan de 7 tareas en dos sesiones. Sin cambios de código                                                                                                                                                                                                                                                                          |
| 2026-11-11 | Despliegue · sesión 1             | Respaldo previo (JSON de los 8 charters y copia de `charters.db`). Tasks 1–4: SQLite reemplazado por Postgres (PGlite en desarrollo y pruebas, Neon en producción), migración inicial nueva, toda la API asíncrona, registro simultáneo con 409 y versión del cronograma validada dentro de la transacción. Presupuesto en `bigint`. Las pruebas clonan una plantilla de PGlite y cierran los clones (sin eso, sin memoria). 399 pruebas, lint y build en verde; navegador sobre PGlite. Commits ae9bbf7…0165419                                                                                                                                                                                                                           |
| 2026-11-11 | Despliegue · sesión 2 (Tasks 5–6) | `hoyISO` en `America/Bogota` (pruebas de la API con `TZ=UTC` para que puedan fallar), `CORREOS_PERMITIDOS` (403 `correo_no_permitido`), adaptador de Vercel que arranca una vez y reintenta si falla, `api/index.js`, `vercel.json`, `npm run migrar` en el build y Node 24. Build sin PGlite. 408 pruebas, lint y build en verde. El usuario decidió publicar al final (Fase 8), con todo terminado; T4.5 se da por hecha con RF1. Commits d98fd29…HEAD                                                                                                                                                                                                                                                                                   |
| 2026-11-12 | Fase 6 (diseño y plan)            | Commit del campo de clave con «mostrar» y confirmación en el registro (540be8d); la transcripción salió del repo al respaldo. Brainstorming con maquetas: riesgos en tabla + matriz probabilidad × impacto 1–5 (opción A, calificación vigente sin historial), presupuesto solo planeado con total y barras por rubro (opción B), indicadores solo definición (sin mediciones). Revisión del diseño por un subagente; ids generados por la web, valor de rubro calculado por el servidor, meta opcional. Plan de 6 tareas en 3 sesiones. Sin cambios de código de la fase                                                                                                                                                                  |
