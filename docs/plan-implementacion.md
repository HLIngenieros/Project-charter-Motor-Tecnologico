# Plan de implementación · Project Charters Grupo HL

Plan general por fases y tareas. La arquitectura está en [arquitectura.md](arquitectura.md) y los cálculos en [analisis-plantilla-excel.md §4](analisis-plantilla-excel.md#4-cálculos-de-la-plataforma). El estado diario se lleva en [PENDIENTES.md](../PENDIENTES.md).

> **Cómo se usa:** este es el plan maestro. Antes de ejecutar cada fase se escribe su plan detallado (pasos pequeños, pruebas primero) en `docs/planes/fase-N.md`, y se ejecuta tarea por tarea. Una tarea está **terminada** solo cuando se cumple su criterio y pasan las pruebas.

## Resumen

| Fase | Objetivo | Resultado visible |
|---|---|---|
| 1 · Diseño | Cerrar arquitectura, plan y pantallas | Documentos y maquetas aprobados |
| 2 · Cimientos | Monorepo, motor de cálculo, base de datos y auth | Login funcionando y el motor validado contra el Excel |
| 3 · Charter básico | Portafolio y ficha con definición | Crear y editar charters propios |
| 4 · Cronograma y cortes | Árbol A–J, cálculo vivo y cortes | El primer charter real con seguimiento |
| 5 · Visualización | Resumen, curva S, Gantt y semáforos | Tablero del charter |
| 6 · Complementos | Indicadores, riesgos y presupuesto | Charter completo, como el Excel |
| 7 · Admin | Cuentas, catálogos y lectura global | Parametrización y supervisión |
| 8 · Cierre | PDF, datos de prueba, pulido y despliegue | Versión 1.0 lista para el servidor interno |

**Primer hito de uso real:** al terminar la Fase 4, el líder de TI ya puede registrarse, crear la primera iniciativa con su cronograma y registrar cortes.

---

## Fase 1 · Diseño

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T1.1 · Arquitectura | [docs/arquitectura.md](arquitectura.md) | Aprobada por el usuario |
| T1.2 · Plan general | Este documento | Aprobado por el usuario |
| T1.3 · Pantallas y flujos | Maquetas (HTML) de login, portafolio, ficha (resumen, cronograma, cortes) y vista celular; `docs/pantallas.md` | Aprobadas por el usuario. Se puede hacer en paralelo con la Fase 2 y debe estar lista antes de la Fase 3 |

## Fase 2 · Cimientos

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T2.1 · Monorepo | `apps/api`, `apps/web` y `packages/shared` con npm workspaces, TS estricto, ESLint, Prettier y Vitest; `npm run dev` levanta los dos servidores | `npm run dev`, `npm test` y `npm run build` funcionan sin errores |
| T2.2 · Fixture del Excel | `scripts/extraer_fixture.py` y `packages/shared/test/fixtures/id-ti.json` (actividades, pesos, fechas y % real al 13-mar-2025, más la columna K esperada) | El JSON reproduce las 167 filas y el árbol se reconstruye bien |
| T2.3 · Motor de cálculo | `construirArbol`, `calcularCronograma`, `curvaSPlaneada`, `curvaSReal`, `avancePorGrupo`, `validarCronograma` y `cumplimientoIndicador`, con pruebas | Pasan las pruebas unitarias y la de aceptación: **12,51 % / 12,47 %**, y K coincide hoja por hoja |
| T2.4 · Esquemas compartidos | Esquemas Zod de entradas y respuestas de la API | Los usan la API y la web sin duplicar tipos |
| T2.5 · Base de datos | Esquema Drizzle completo (§5 de la arquitectura), migraciones, semilla de categorías y conexión | Las migraciones se aplican sobre una base vacía y las pruebas corren en memoria |
| T2.6 · Autenticación | Registro con dominio, login, logout, `/auth/yo`, sesiones, límite de intentos y CLI para promover Admin | Pruebas de API: dominio rechazado, clave corta, login correcto, sesión expirada y cuenta desactivada |
| T2.7 · Aislamiento | `cargarCharter(id, usuario, modo)` y guardas por ruta | Pruebas: un usuario recibe 404 en todo charter ajeno; el Admin lee pero no escribe |
| T2.8 · Sistema de diseño | Tokens Tailwind (colores, tipografías, radios, sombras), fuentes locales, componentes base (botón, campo, tarjeta, pestañas, tabla, diálogo, aviso), layout con encabezado y animaciones base | Página de muestra de componentes en escritorio y celular |
| T2.9 · Pantallas de acceso | `/entrar` y `/registro` con validación y animación; rutas protegidas | Flujo registro → login → logout funcionando en el navegador |

## Fase 3 · Charter básico

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T3.1 · API de charters | CRUD de charter, listas (objetivos, supuestos, criterios) y catálogos de lectura | Pruebas de API, incluido el aislamiento |
| T3.2 · Portafolio | Tarjetas de mis charters con filtros (estado, categoría, área) y estado vacío invitando a crear el primero | Crear, abrir y filtrar desde la web |
| T3.3 · Ficha · Definición | Encabezado (nombre, código, categoría, área, responsable, patrocinador, revisión, estado), razón de ser, objetivo general y listas ordenables | Se edita y se guarda; recargar conserva los cambios |

## Fase 4 · Cronograma y cortes

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T4.1 · API de cronograma | `GET/PUT` del árbol completo en una transacción, con control de `actualizado_en` (409) | Pruebas: guardar, reordenar, eliminar con avances y conflicto |
| T4.2 · Editor de cronograma | Tabla-árbol A–J editable (agregar, indentar, sacar de nivel, mover, eliminar, varios responsables), K–N calculados al instante y avisos de validación | Se arma un cronograma de 3 niveles con teclado y ratón; los cálculos coinciden con el motor |
| T4.3 · API de cortes | Crear, editar y eliminar cortes; foto de la línea base y totales guardados | Pruebas: corte completo, reemplazo en la misma fecha, foto intacta tras editar la línea base |
| T4.4 · Pantalla de cortes | Lista de cortes con variación; formulario precargado con el % anterior y el planeado; aviso si el % real baja | Registrar un corte desde escritorio y desde celular |
| T4.5 · Hito: primer charter real | El líder de TI crea la primera iniciativa con su cronograma | Uso real sin bloqueos; los ajustes se anotan en PENDIENTES |

## Fase 5 · Visualización

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T5.1 · Resumen del charter | KPIs animados (planeado, real, desviación, fecha proyectada, estado) y selector de fecha de corte | Cambiar la fecha recalcula todo al instante |
| T5.2 · Curva S | Planeada (semanal) y real (por cortes), con zoom y tooltip | Coincide con el motor; con el fixture del Excel se dibuja bien |
| T5.3 · Gantt | Barras de línea base, relleno según el real, marca de la fecha proyectada y línea de corte; colapsable por grupo y sincronizado con el editor | Se ve bien con 170 filas y en celular con desplazamiento |
| T5.4 · Avance por grupo y semáforos | Barras PV vs EV por agrupadora de nivel 1 y semáforo con los umbrales del charter | Los estados coinciden con la §4.4 |
| T5.5 · Portafolio con avance | Las tarjetas muestran el % real vs planeado y el semáforo del último corte | Visible en el portafolio |

## Fase 6 · Complementos

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T6.1 · Indicadores | Tabla con meta estructurada, mediciones por periodo, cumplimiento, semáforo y una gráfica por indicador | Cumplimiento según la §4.6 |
| T6.2 · Riesgos | Tabla editable y ordenable | Se edita y se guarda |
| T6.3 · Presupuesto | Rubros con desglose opcional (cantidad × valor unitario) y total en COP | Los totales cuadran |

## Fase 7 · Admin

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T7.1 · Cuentas | Listado, desactivar o reactivar, restablecer clave (temporal con cambio obligatorio), otorgar o quitar Admin | Pruebas de API y flujo en la web. Desactivar y restablecer clave llaman a `cerrarSesionesDe` (prueba: reactivar no revive una cookie vieja) |
| T7.2 · Catálogos | CRUD de categorías (con color) y áreas; desactivar si están en uso | Los cambios se reflejan en los formularios |
| T7.3 · Lectura global | `/admin/charters` con filtros por dueño, área, categoría y estado; ficha en modo solo lectura | El Admin ve todo y no ve ningún control de edición; la API rechaza sus escrituras |
| T7.4 · Parametrización | `/admin/parametros`: reglas de pesos, umbrales, reparto del planeado, proyección y días de gracia; cada charter copia las vigentes al crearse. Diseño y plan: [spec](superpowers/specs/2026-11-11-parametrizacion-y-exportacion-design.md), [plan](planes/parametrizacion-exportacion.md) | Un cambio solo afecta a los charters nuevos; los cortes registrados no cambian |

## Fase 8 · Cierre de la versión 1.0

| Tarea | Entregable | Terminada cuando |
|---|---|---|
| T8.1 · Exportar a PDF y JSON | Vista `/charters/:id/imprimir` en A4 al estilo del Informe global (documento completo en el orden de la ficha), con gráficas en SVG; JSON con todo el charter y sus cortes. Plan: [parametrizacion-exportacion.md](planes/parametrizacion-exportacion.md) | El PDF impreso desde Chrome y Edge se ve correcto |
| T8.2 · Charters de prueba | Semilla con A1, D1 y C1 (datos del Informe global) | Se cargan con un comando |
| T8.3 · Pulido responsive y de movimiento | Revisión en 360, 768 y 1440 px, `prefers-reduced-motion` y accesibilidad básica (foco y contraste) | Sin desbordes ni elementos ilegibles |
| T8.4 · E2E | Playwright: registro → charter → cronograma → corte → curva S; y Admin en solo lectura | Pasan en local |
| T8.5 · Producción | Build en un solo proceso, comando de respaldo y guía `docs/despliegue.md` para el servidor interno. Además (revisión de la Fase 2): `@fastify/helmet` con CSP, argon2id con 19 MiB y t = 2, purga de sesiones vencidas, dominio permitido expuesto a la web, host de escucha configurable y división del bundle por rutas | La app corre con `npm start` desde el build |

---

## Dependencias

```
T1.1 ─ T1.2 ─┬─ T2.1 ─ T2.2 ─ T2.3 ─────────────┐
             │        T2.4 ─ T2.5 ─ T2.6 ─ T2.7 ─┼─ T3.x ─ T4.x ─ T5.x ─ T6.x ─ T7.x ─ T8.x
             │                T2.8 ─ T2.9 ───────┘
             └─ T1.3 (antes de T3.2)
```

- El motor (T2.3) no depende de la base de datos: puede avanzar en paralelo con T2.5 a T2.7.
- La Fase 7 solo depende de la Fase 3. Si se necesita supervisar antes, se puede adelantar.
