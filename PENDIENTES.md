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
- [ ] Motor: `pct` no numérico se trata como 0 (hoy lanza) y `construirArbol` rechaza ids repetidos (`id_duplicado`). Hacerlo antes del `PUT` del cronograma (T4.1).
- [ ] La prueba de zona horaria debe verificar que `TZ` sí se aplicó (hoy no podría fallar).
- [x] Web: un error que no sea 401 en `/auth/yo` (API caída) muestra un aviso de conexión en vez de mandar a `/entrar`; `JSON.parse` protegido en `api/cliente.ts` — 2026-11-09
- [x] Contraste: el color de la categoría solo va en el punto y el fondo del chip; el texto es `tinta` (T3.2) — 2026-11-09
- [x] Regla de estado por brecha en puntos (10 / 25 / 50) con estado `vencida` y conteo de vencidas en agrupadoras (§4.4) — 2026-11-09
- [x] Actualizar la demo del semáforo en el [resumen visual](https://claude.ai/artifact/NX8tLwQ1npVZoC9NcrffBC) con la regla por brecha — 2026-11-09
- [ ] T5.4: fijar los tonos de amarillo, naranja y vinotinto del semáforo con prueba de contraste.
- Seguridad y despliegue (helmet, argon2, purga de sesiones, dominio en la web, bundle) quedaron en T8.5; cerrar sesiones al desactivar, en T7.1.

## Fase 3 · Charter básico

Plan: [docs/planes/fase-3.md](docs/planes/fase-3.md). Sesiones: API (Tasks 1–3) · web base, portafolio y ficha (Tasks 4–6) · listas, estado y cierre (Tasks 7–9).

- [x] T3.1 · API de charters y listas — 2026-11-09
- [x] T3.2 · Portafolio — 2026-11-09
- [~] T3.3 · Ficha · Definición · hechos encabezado, razón de ser y guardado automático; faltan listas, estado y eliminar (Tasks 7–8)

## Fase 4 · Cronograma y cortes

- [ ] T4.1 · API de cronograma
- [ ] T4.2 · Editor de cronograma A–J con cálculo vivo
- [ ] T4.3 · API de cortes con foto de línea base
- [ ] T4.4 · Pantalla de cortes
- [ ] T4.5 · Hito: primer charter real del líder de TI

## Fase 5 · Visualización

- [ ] T5.1 · Resumen con KPIs y selector de corte
- [ ] T5.2 · Curva S
- [ ] T5.3 · Gantt
- [ ] T5.4 · Avance por grupo y semáforos
- [ ] T5.5 · Portafolio con avance

## Fase 6 · Complementos

- [ ] T6.1 · Indicadores y mediciones
- [ ] T6.2 · Riesgos
- [ ] T6.3 · Presupuesto con desglose

## Fase 7 · Admin

- [ ] T7.1 · Cuentas
- [ ] T7.2 · Catálogos (categorías y áreas)
- [ ] T7.3 · Lectura global de charters

## Fase 8 · Cierre v1.0

- [ ] T8.1 · Exportar a PDF
- [ ] T8.2 · Charters de prueba A1, D1 y C1
- [ ] T8.3 · Pulido responsive y de movimiento
- [ ] T8.4 · Pruebas E2E
- [ ] T8.5 · Build de producción y guía de despliegue

**Próxima tarea sugerida:** Fase 3, Tasks 7–9 (listas ordenables, estado del charter y eliminar, cierre de la fase con capturas).

## Registro de sesiones

| Fecha | Tareas | Resumen |
|---|---|---|
| 2026-11-09 | T0.1–T0.3 | Repo movido a la raíz, análisis del Excel (hallados doble conteo de pesos y la fila 1.2 mal calculada), README y especificación de cálculos. Commit 05596eb |
| 2026-11-09 | T1.1–T1.2 | Decisiones cerradas (independiente de HH, registro por dominio, Admin de solo lectura, sin aprobación, local primero). Arquitectura, plan general y plan detallado de la Fase 2 aprobados. Jerarquía del Excel verificada por fórmulas de peso (12,51 % / 12,47 %) |
| 2026-11-09 | T2.1–T2.9 | Fase 2 completa: monorepo, fixture del Excel, motor validado (12,51 % / 12,47 % y columna K hoja por hoja), esquemas Zod, base con 15 tablas, auth por dominio con sesiones y CSRF, aislamiento por dueño, sistema de diseño y pantallas de acceso. Revisión final: 0 críticos; corregidos fechas inexistentes, `CONFIAR_PROXY` y carga del `.env`. 129 pruebas, lint y build en verde. Commits f67264d…c80ad68. Después: clave mínima de 8 caracteres (usuario) y corrección de procesos de desarrollo huérfanos (EADDRINUSE). El usuario decidió ajustar la regla de estado en la próxima sesión |
| 2026-11-09 | — | Resumen visual de la propuesta publicado como artefacto privado: problema, demo del cálculo con Gantt y curva S, diagrama de arquitectura interactivo (5 escenarios y modo local/servidor), plan por fases y stack. Sin cambios de código |
| 2026-11-09 | Regla de estado | Semáforo por brecha en puntos (verde < 10, amarillo < 25, naranja < 50, rojo ≥ 50) y estado `vencida` (vinotinto); agrupadoras cuentan sus hojas vencidas. Migración 0001 con umbrales 10/25/50 (corregido el `INSERT` que generó drizzle-kit). 134 pruebas y lint en verde. Commit 03aed49. Instalada la skill Impeccable (global, con hook) para las maquetas |
| 2026-11-09 | T1.3 | PRODUCT.md (líder de proyecto, éxito = dejar el Excel). Ficha elegida entre tres estructuras: documento vivo. Maquetas de portafolio, ficha (Gantt arrastrable, detalle A–J en línea, impresión A4), registro de corte "solo lo que toca" y vista celular, con port mínimo del motor. Tres rondas de revisión y DESIGN.md. Al aprobar, el usuario pidió la curva S protagonista (animada, con semáforo por corte, brecha, proyección y zoom). Desde ahora, Impeccable austero en validación |
| 2026-11-09 | T3.1 | Plan de la Fase 3 aprobado (9 tareas, repartidas en tres sesiones). Demo del semáforo del resumen visual con la regla por brecha. API de charters, catálogos y listas con aislamiento, solo lectura de cerrados y catálogos inactivos conservados. Lint excluye `docs/maquetas`. 169 pruebas, lint y build en verde. Commits 94d2fd0, 6ef31c6, eb402c4 |
| 2026-11-09 | T3.2, T3.3 (parcial) | Fase 3, Tasks 4–6: tokens del semáforo, chips, formato es-CO, cliente de charters y aviso de conexión; portafolio con filtros en la URL, estados vacíos y diálogo de nuevo charter; ficha con banda fija, índice, edición en su sitio y cola de guardado serial (reintentar y aviso al cerrar). Sin semáforo ni curva en el portafolio hasta T5.5. 44 pruebas web, tipos, lint y build en verde. Commits 763ba0f, d8a46c1, 3e529e8. Revisado también el uso de agentes y del plugin superpowers: el usuario decidió no cambiar la configuración por ahora |
