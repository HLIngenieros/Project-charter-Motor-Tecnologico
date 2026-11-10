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
| `docs/superpowers/specs/` | Diseños aprobados antes de cada plan (Fase 5 en adelante) |
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
- 2026-11-09 · Listas de la ficha con campos propios (no `TextoEditable`): necesitan Enter, Retroceso y Alt + flechas; un ítem vacío desaparece al salir · Claude.
- 2026-11-10 · Fase 4: el cronograma se guarda solo (800 ms tras el último cambio, por la cola de la ficha), no con botón; concurrencia con `charter.cronograma_version` entera (409 `cronograma_desactualizado`), no con `actualizado_en` · Claude (plan aprobado).
- 2026-11-10 · PUT sobre una fecha con corte = editarlo (cambia % y nota, conserva la foto). Un corte nuevo no puede ser futuro ni anterior al último · Claude (plan aprobado).
- 2026-11-10 · Gantt: la escala es una ventana de 3, 6 o 12 meses alrededor del corte; en el campo Actividad, Enter agrega debajo, Tab sangra y Mayús + Tab saca de nivel · Claude.
- 2026-11-10 · Registrar corte: los grupos se rearman al cambiar la fecha, no al escribir; al editar, «Antes» es el corte anterior y se trabaja sobre la foto; la brecha mostrada no baja de 0 · Claude.
- 2026-11-10 · Fase 5: el corte se elige en la banda, en la curva S o en el historial (`?corte=`); la ficha en un corte pasado queda en solo lectura con la foto. Sin bloque de avance por grupo (basta el Gantt con «Plegar a grupos») · Usuario.
- 2026-11-10 · Un corte registrado no cambia aunque se mueva el cronograma; la vista actual recalcula en vivo y avisa «Línea base modificada desde el corte». Fin proyectado = el del motor en todas partes · Usuario / Claude.
- 2026-11-10 · Gráficas en SVG propio con Motion, sin ECharts. Naranja `#de781c` (3:1 sobre blanco); el amarillo no llega a 3:1 y en la curva lleva borde `amarillo-texto` · Claude.
- 2026-11-09 · Semáforo por brecha (PV − EV) en puntos: verde < 10, amarillo < 25, naranja < 50, rojo ≥ 50, y **vencida** (vinotinto) si pasó el fin sin el 100 %. Agrupadoras cuentan sus hojas vencidas · Usuario.

## Estado actual

- **T1.3 aprobada (2026-11-09):** maquetas en `docs/maquetas/` (abrir con `python -m http.server` dentro de la carpeta) y flujos en `docs/pantallas.md`. PRODUCT.md y DESIGN.md creados.
- **Fase 3 cerrada (2026-11-09).**
- **Fase 4 cerrada (2026-11-10).** T4.5 (primer charter real) se omitió por ahora.
- **Fase 5 en curso:** diseño en `docs/superpowers/specs/2026-11-10-fase-5-visualizacion-design.md`, plan en `docs/planes/fase-5.md`. Sesión 1 (Tasks 1–3) hecha; sigue la sesión 2 (Tasks 4–6: corte elegido y modo histórico, curva S, Gantt).
- Cronograma web en `pantallas/ficha/cronograma/`: `operaciones.ts` (puras), `useBorradorCronograma(id, encolar)` (copia local; adopta lo de la API en la primera edición; versión en un ref), `escala.ts`, `PistaGantt`. El borrador vive en `Ficha.tsx` y lo comparten la banda (`BandaEstado` con `situacion`) y `SeccionCronograma`. Los cortes usan los umbrales del charter; la ficha, los de por defecto (el detalle no los trae).
- Cortes web: historial en `pantallas/ficha/SeccionHistorial.tsx`; pantalla en `pantallas/corte/` (`RegistrarCorte` prepara las filas y monta `Formulario` con `key`; `clasificar.ts` puro; `FilaAvance`). Al guardar navega a la ficha con `state.aviso`. `Cifra` anima números con un `MotionValue`.
- La ficha guarda con `useColaGuardado(alFallar)` (`pantallas/ficha/colaGuardado.ts`, compartida por `ContextoGuardado`): todo guardado nuevo debe encolarse ahí. `alFallar` atiende 401 y 409 `charter_cerrado`. `secciones()` en `Ficha.tsx` lista solo las secciones construidas; al pasar a solo lectura, las secciones se rehacen (`Fragment` con `key`).
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
- El preflight de Tailwind pone `svg` en `display: block`: un ícono junto a texto necesita un contenedor flex (`Boton` ya lo trae). Un `<path>` suelto fuera de `<svg>` solo se nota en la consola («tag unrecognized»): revisarla en la ronda de navegador.
- Reordenar nodos con React (`insertBefore`) les quita el foco: tras mover, reenfocar explícitamente (ver `ListaEditable`).
- Lint `react-hooks/set-state-in-effect`: nada de `setState` dentro de `useEffect`; derivar el estado o actualizarlo durante el render comparando con el valor previo (ver `DetalleActividad`).
- Pruebas con debounce: `vi.useFakeTimers({ shouldAdvanceTime: true })` + `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` y `act(() => vi.advanceTimersByTimeAsync(800))`. jsdom no trae `PointerEvent`: en la prueba se usa `MouseEvent`.

- En Windows, vitest puede cargar dos copias de un módulo (letra de unidad en mayúscula y minúscula): en pruebas, no comparar errores con `instanceof`, sino por `name`.
- Un `sr-only` (absoluto) dentro de un contenedor con `overflow-x-auto` se sale y estira la página si el contenedor no es `relative`: revisar `scrollWidth` a 390 px.
- Vitest no entrega el CSS crudo con `?raw`: para leer `tokens.css` en una prueba, `readFileSync(resolve(__dirname, …))` (ver `contraste.test.ts`).
- Los escapes (`\s`) se pierden al pasar código por heredoc, `sed` o Python en Bash: para expresiones regulares usar Edit.
- Las capturas de Playwright solo se pueden guardar dentro del repo (`.playwright-mcp/`, ignorado), no en el scratchpad.

## Glosario

- **Hoja / agrupadora:** actividad sin hijas (lleva peso, fechas y % real) / con hijas (se calcula).
- **Corte:** fecha de corte + % real por hoja + nota. Se guardan todos.
- **Línea base:** fechas y pesos aprobados del cronograma.

## Entorno

- Windows 11, VS Code, PowerShell 5.1 y Git Bash. Python 3.13 con openpyxl; Node 24.
