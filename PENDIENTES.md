# Pendientes

**Estados:** `[ ]` pendiente · `[~]` en curso · `[x]` hecha. Detalle y criterios de terminado de cada tarea en [docs/plan-implementacion.md](docs/plan-implementacion.md).

## Fase 0 · Arranque

- [x] T0.1 · Limpiar el proyecto, mover el repo a la raíz y archivar el trabajo anterior — 2026-11-09
- [x] T0.2 · Analizar el Excel (hoja ID & TI y anexos) y el PDF de identidad — 2026-11-09
- [x] T0.3 · Reescribir el README y especificar los cálculos — 2026-11-09

## Fase 1 · Diseño

- [x] T1.1 · Arquitectura ([docs/arquitectura.md](docs/arquitectura.md)) — 2026-11-09
- [x] T1.2 · Plan general ([docs/plan-implementacion.md](docs/plan-implementacion.md)) — 2026-11-09
- [ ] T1.3 · Pantallas y flujos con maquetas (antes de T3.2)

## Fase 2 · Cimientos

- [ ] T2.1 · Monorepo (apps/api, apps/web, packages/shared)
- [ ] T2.2 · Fixture del Excel en JSON
- [ ] T2.3 · Motor de cálculo con prueba de aceptación (12,51 % / 12,47 %)
- [ ] T2.4 · Esquemas Zod compartidos
- [ ] T2.5 · Base de datos y migraciones
- [ ] T2.6 · Autenticación (registro por dominio, sesiones, CLI de Admin)
- [ ] T2.7 · Aislamiento por dueño y lectura del Admin
- [ ] T2.8 · Sistema de diseño
- [ ] T2.9 · Pantallas de acceso

## Fase 3 · Charter básico

- [ ] T3.1 · API de charters y listas
- [ ] T3.2 · Portafolio
- [ ] T3.3 · Ficha · Definición

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

**Próxima tarea sugerida:** ejecutar la Fase 2 con [docs/planes/fase-2.md](docs/planes/fase-2.md), desde la Task 1 (monorepo). T1.3 antes de la Fase 3.

## Registro de sesiones

| Fecha | Tareas | Resumen |
|---|---|---|
| 2026-11-09 | T0.1–T0.3 | Repo movido a la raíz, análisis del Excel (hallados doble conteo de pesos y la fila 1.2 mal calculada), README y especificación de cálculos. Commit 05596eb |
| 2026-11-09 | T1.1–T1.2 | Decisiones cerradas (independiente de HH, registro por dominio, Admin de solo lectura, sin aprobación, local primero). Arquitectura, plan general y plan detallado de la Fase 2 aprobados. Jerarquía del Excel verificada por fórmulas de peso (12,51 % / 12,47 %) |
