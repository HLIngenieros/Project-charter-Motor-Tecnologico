# CLAUDE.md

Memoria del proyecto para Claude. Mantenerla breve: si algo cambia, se edita la sección en vez de añadir otra.

## Proyecto

- **Qué es:** plataforma web donde cualquier usuario crea su propio Project Charter, aislado de los demás, con cronograma y registro real de avances (cortes con historial).
- **Fuentes:** `docs/referencias/Project Charter TI 2025 Rev.B.xlsx` (hoja ID & TI = contenido y cálculos) y `docs/referencias/Informe_Global_Priorizacion_Comite_IA_2.pdf` (identidad visual).
- **Responsable:** Juan David Urbina (Transformación Digital, Grupo HL).
- **Idioma:** español. Tratar de **tú**, cordial y sin exceso de palabras.

## Forma de trabajo

- Flujo superpowers: brainstorming → spec → plan → ejecución, con el diseño aprobado antes de implementar.
- Tareas y registro de sesiones en [PENDIENTES.md](PENDIENTES.md).
- **"Cerremos sesión"** significa, en este orden:
  1. Actualizar este CLAUDE.md (decisiones y lo aprendido).
  2. Actualizar PENDIENTES.md y la documentación afectada.
  3. Hacer commit en español, en imperativo y breve.
- **No hacer push:** el usuario lo hace manualmente desde GitHub Desktop.
- **Impeccable, austero:** una ronda de capturas propia y listo; sin revisor final, re-revisiones ni documentador salvo que el usuario lo pida (ahorro de tokens).
- **Ejecución de planes:** directa (sin subagente por tarea), con superpowers para pensar y skills de front para diseño y animaciones. Las pruebas se escriben con cada tarea; la verificación formal (suite completa, lint, build y navegador) es al cerrar cada fase.

## Repositorio

- GitHub: `HLIngenieros/Project-charter-Motor-Tecnologico` (privado), rama `main`.
- Se reutiliza el repo del trabajo anterior (dashboard estático "Motor Tecnológico" de otro equipo), que se descartó. Sus archivos quedan en el historial hasta el commit `f38039d`; `dashboard/js/calculo.js` tiene un port útil de las fórmulas del Excel.

## Estructura

| Ruta | Contenido |
|---|---|
| `README.md` | Requerimientos, identidad visual y arquitectura propuesta |
| `docs/arquitectura.md` | Arquitectura: perfiles, stack, modelo de datos, API, motor, despliegue |
| `docs/plan-implementacion.md` | Plan general por fases y tareas con criterios de terminado |
| `docs/planes/fase-N.md` | Plan detallado de cada fase (pasos, interfaces y pruebas) |
| `docs/analisis-plantilla-excel.md` | Análisis del Excel, errores encontrados y **especificación de cálculos** (§4) |
| `docs/referencias/` | Excel y PDF fuente |
| `PENDIENTES.md` | Fases, tareas y registro de sesiones |
| `PRODUCT.md` / `DESIGN.md` | Contexto de producto y sistema visual (Impeccable); `.impeccable/` guarda su configuración y el contrato de dirección |
| `docs/pantallas.md` y `docs/maquetas/` | Flujos aprobados (T1.3) y maquetas HTML navegables con port mínimo del motor |
| `packages/shared/` | Motor de cálculo (`src/calculo`) y esquemas Zod (`src/esquemas`); fixture del Excel en `test/fixtures/id-ti.json` |
| `apps/api/` | Fastify: `db/` (esquema, migraciones en `drizzle/`), `auth/`, `modulos/charters/` (`acceso.ts` = único control de acceso, `servicio.ts`, `rutas.ts`), `modulos/catalogos/`, `cli/admin.ts` |
| `apps/web/` | React: `componentes/`, `pantallas/`, `app/` (rutas, layout), `api/` (cliente y sesión), `estilos/tokens.css` |
| `scripts/extraer_fixture.py` | Regenera el fixture desde el Excel |

## Decisiones

- 2026-11-09 · Se reutiliza el repo anterior, movido a la raíz · Petición del usuario.
- 2026-11-09 · Varios charters, cualquier usuario crea los suyos; las categorías (ejes) son un catálogo editable y los 3 ejes del Comité son solo ejemplos · Usuario.
- 2026-11-09 · Autenticación muy sencilla pero cuidada visualmente, con usuarios individuales; cada usuario ve solo sus charters (filtrado en backend) · Usuario.
- 2026-11-09 · Captura del cronograma = columnas A–J del Excel; K–N, Gantt y curva S se calculan · Usuario.
- 2026-11-09 · UI interactiva, con animaciones limpias y modernas y gráficas potentes · Usuario. Propuesta: Motion + ECharts.
- 2026-11-09 · Stack: React + Vite + TS + Tailwind / Fastify + Drizzle + SQLite / Zod y motor de cálculo compartidos. Detalle en `docs/arquitectura.md` · Claude.
- 2026-11-09 · Consolidar el avance ponderando sobre las hojas (corrige el doble conteo del Excel) · Claude.
- 2026-11-09 · **Totalmente independiente de HorasHombre**; multiárea; no escalar al modelo de HH (sin roles intermedios ni aprobaciones) · Usuario.
- 2026-11-09 · Registro libre con correo `@hlingenieros.com` (solo valida dominio). Perfiles: usuario y Admin (lectura de todo + parametrización) · Usuario.
- 2026-11-09 · Sin aprobación de charters; línea base editable y cada corte guarda una foto · Usuario / Claude.
- 2026-11-09 · Local primero, después servidor interno. Web responsive · Usuario.
- 2026-11-09 · Clave mínima de 8 caracteres (antes 10) · Usuario.
- 2026-11-09 · Hooks de React con prefijo `use…` (la regla de lint lo exige), no `usar…` · Claude.
- 2026-11-09 · Una hoja con fin antes del inicio cuenta como sin programar y da aviso · Claude.
- 2026-11-09 · Texto de error en `alerta-texto` `#A63F2C` (el `#C4513C` no llega a 4,5:1); cifras grandes en Sora, mono solo en tablas y códigos · Claude.
- 2026-11-09 · `CONFIAR_PROXY=true` solo detrás de IIS; el `.env` de la raíz lo cargan la API y el CLI · Claude (revisión).
- 2026-11-09 · Ficha = **documento vivo** en el orden de la hoja ID & TI; cronograma capturado como **Gantt interactivo** (arrastrar barras); corte "solo lo que toca"; portafolio con avance, semáforo, mini curva S y último corte · Usuario.
- 2026-11-09 · **Curva S protagonista** antes del cronograma: a todo el ancho, animada, con lectura por fecha, semáforo por corte, brecha sombreada y proyección al ritmo actual · Usuario.
- 2026-11-09 · Acento `#00A9E0` = lo medido en cortes (línea de corte y serie Real), selección y foco · Claude.
- 2026-11-09 · Fase 3: crear charter con diálogo desde el portafolio (no `/charters/nuevo`); la ficha solo muestra secciones ya construidas; estado y eliminar en un menú de la banda; guardado automático con cola serial; `GET /charters` solo trae los propios, también al Admin · Claude (plan aprobado).
- 2026-11-09 · Repartir cada fase en sesiones equilibradas · Usuario.
- 2026-11-09 · Portafolio: con corte, estado vacío y barra neutra hasta T5.5; sin corte, «editado el …» (el resumen no trae `creadoEn`). En celular el estado de guardado se ve sobre la hoja para poder reintentar · Claude.
- 2026-11-09 · Semáforo por brecha (PV − EV) en puntos: verde < 10, amarillo < 25, naranja < 50, rojo ≥ 50, y **vencida** (vinotinto) si pasó el fin sin el 100 %. Agrupadoras cuentan sus hojas vencidas · Usuario.

## Estado actual

- **T1.3 aprobada (2026-11-09):** maquetas en `docs/maquetas/` (abrir con `python -m http.server` dentro de la carpeta) y flujos en `docs/pantallas.md`. PRODUCT.md y DESIGN.md creados.
- **Fase 3 en curso** con plan en `docs/planes/fase-3.md`, repartida en tres sesiones: API (Tasks 1–3) y web base, portafolio y ficha (Tasks 4–6), hechas · listas, estado y cierre (Tasks 7–9), siguiente.
- La ficha guarda con `useColaGuardado` (`pantallas/ficha/colaGuardado.ts`, compartida por `ContextoGuardado`); las Tasks 7 y 8 deben encolar por ahí. `SECCIONES` en `Ficha.tsx` lista solo las secciones construidas; la Task 7 pasa los objetivos específicos a la columna derecha de «Razón de ser», como en la maqueta.
- Pruebas web: `test/simular-api.ts` simula `fetch` (la sesión de Ana va por defecto).
- Hallazgo: en el Excel la jerarquía se deduce de las fórmulas de peso (G), no del esquema de filas (roto en 1.3.1 y 1.3.2). Con esa regla da 12,51 % / 12,47 %.

## Comandos

- `npm run dev` (API 3100 + web 5173) · `npm test` · `npm run lint` · `npm run build`.
- Admin: registrar la cuenta y luego `npm run admin -- --promover <correo>` (`--quitar` lo retira).
- Si Claude levanta `npm run dev` para verificar, al terminar debe matar **todo el árbol** (`concurrently` y `tsx watch`), no solo el proceso del puerto: un `tsx watch` huérfano relanza la API al cambiar el código y ocupa el 3100 (EADDRINUSE).

## Aprendido

- npm 11 bloquea scripts de instalación: no hace falta aprobarlos (better-sqlite3 trae binario; esbuild usa su paquete de plataforma).
- En Git Bash los heredocs largos con JSX/plantillas fallan a veces; usar Write para archivos de código.
- Prettier no debe tocar el fixture ni las migraciones (`.prettierignore`).
- Vite puede quedar con un módulo a medio editar en caché: reiniciar `npm run dev`.
- Con Playwright, `locator.click()` desplaza la página para centrar el elemento: para medir el scroll usar `element.click()` dentro de `evaluate`.
- Las maquetas cargan los scripts con `?v=n`: subir el número al cambiarlos, o el navegador muestra la versión en caché.
- Las pruebas de API usan `sesionDe(app, correo, { admin })` y `crearCharterPrueba` de `test/ayudas.ts`; para ordenar por `actualizado_en`, `pausa()` evita marcas ISO iguales.
- Prettier puede romper una edición hecha con `sed` sobre líneas que reacomodó: correr Prettier después de editar, no antes.
- `drizzle-kit generate` en SQLite recrea la tabla y copia **todas** las columnas, incluso las nuevas que no existen en la vieja: revisar el `INSERT … SELECT` de cada migración antes de commitear.

- Un campo editable no adopta el valor de la API mientras su propio envío va en camino; si no, una respuesta vieja pisa lo último escrito.
- El estado `isPending` de una mutación llega un render tarde: para evitar el doble envío, usar un `ref`.
- Testing Library: `getByLabelText` también encuentra contenedores con `aria-labelledby`; no etiquetar una sección con el mismo texto que su campo.
- Tailwind: nada de clases armadas con plantillas ni `bg-[url(...)]` con comillas; la flecha del `select` va en `style` (`FLECHA` de `Selector.tsx`).

## Glosario

- **Hoja / agrupadora:** actividad sin hijas (lleva peso, fechas y % real) / con hijas (se calcula).
- **Corte:** fecha de corte + % real por hoja + nota. Se guardan todos.
- **Línea base:** fechas y pesos aprobados del cronograma.

## Entorno

- Windows 11, VS Code, PowerShell 5.1 y Git Bash. Python 3.13 con openpyxl; Node 24.
