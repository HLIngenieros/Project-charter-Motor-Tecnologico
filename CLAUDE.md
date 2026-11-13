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

| Ruta                                   | Contenido                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md`                            | Requerimientos, identidad visual y arquitectura propuesta                                                                                                                                  |
| `docs/arquitectura.md`                 | Arquitectura: perfiles, stack, modelo de datos, API, motor, despliegue                                                                                                                     |
| `docs/plan-implementacion.md`          | Plan general por fases y tareas con criterios de terminado                                                                                                                                 |
| `docs/planes/fase-N.md`                | Plan detallado de cada fase (pasos, interfaces y pruebas)                                                                                                                                  |
| `docs/superpowers/specs/`              | Diseños aprobados antes de cada plan (Fase 5 en adelante)                                                                                                                                  |
| `docs/analisis-plantilla-excel.md`     | Análisis del Excel, errores encontrados y **especificación de cálculos** (§4)                                                                                                              |
| `docs/referencias/`                    | Excel y PDF fuente                                                                                                                                                                         |
| `PENDIENTES.md`                        | Fases, tareas y registro de sesiones                                                                                                                                                       |
| `PRODUCT.md` / `DESIGN.md`             | Contexto de producto y sistema visual (Impeccable); `.impeccable/` guarda su configuración y el contrato de dirección                                                                      |
| `docs/pantallas.md` y `docs/maquetas/` | Flujos aprobados (T1.3) y maquetas HTML navegables con port mínimo del motor                                                                                                               |
| `packages/shared/`                     | Motor de cálculo (`src/calculo`) y esquemas Zod (`src/esquemas`); fixture del Excel en `test/fixtures/id-ti.json`                                                                          |
| `apps/api/`                            | Fastify: `db/` (esquema, migraciones en `drizzle/`), `auth/`, `modulos/charters/` (`acceso.ts` = único control de acceso, `servicio.ts`, `rutas.ts`), `modulos/catalogos/`, `cli/admin.ts` |
| `apps/web/`                            | React: `componentes/`, `pantallas/`, `app/` (rutas, layout), `api/` (cliente y sesión), `estilos/tokens.css`                                                                               |
| `scripts/extraer_fixture.py`           | Regenera el fixture desde el Excel                                                                                                                                                         |

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
- 2026-11-11 · **Parametrización del Admin** (`/admin/parametros`): reglas de pesos (suma obligatoria, repartir el peso vacío; un 0 escrito excluye), umbrales, reparto por días calendario o hábiles, proyección por desviación o ritmo (SPI por hoja) y días de gracia. **Cada charter copia las vigentes al crearse**; cambiarlas no toca a los existentes ni a sus cortes · Usuario / Claude.
- 2026-11-11 · **Exportar la ficha**: PDF como documento completo en el orden de la ficha (vista de impresión del navegador, A4) y JSON con todo el charter y sus cortes, solo exportación. Se exporta lo que se ve (`?corte=`) · Usuario / Claude.
- 2026-11-11 · Rutas de Admin con `exigirAdmin` (403 `solo_admin`), no 404: ocultar una ruta de Admin no protege nada · Claude.
- 2026-11-11 · El motor recibe `Reglas` (no `Umbrales`); `CharterDetalle.reglas` reemplaza a `umbrales`. `arbolHistorico` vive en el motor (lo usan la ficha y la exportación) · Claude.
- 2026-11-11 · Registrar corte y la ficha usan las reglas del charter; con suma obligatoria e incompleta, «Guardar corte» queda deshabilitado con aviso. Una hoja con peso repartido muestra su peso efectivo y «auto» · Claude (plan).
- 2026-11-11 · PDF: pie en cajas de margen de `@page` inyectadas con `<style>` (llevan el nombre del charter); curva a 688 px (182 mm útiles); `window.print()` una vez, tras cargar y `document.fonts.ready` · Claude.
- 2026-11-11 · Mini curva S del portafolio: escala vertical hasta un poco más del mayor valor (a 0–100 % se ve plana) y solo desde 1024 px. El aviso que deja otra pantalla en `state` se guarda al montar y se borra con `navigate(…, { replace: true, state: null })` · Claude.
- 2026-11-11 · **Despliegue en Vercel + Neon** (link fijo, uso personal por ahora; el PC no puede estar siempre prendido). Postgres en todas partes: Neon en producción, PGlite en desarrollo y pruebas; se quita SQLite y la base se regenera (no se migran datos). Fecha de hoy en `America/Bogota` y `CORREOS_PERMITIDOS` para limitar el registro. Reemplaza «local primero, servidor interno después» · Usuario / Claude.
- 2026-11-11 · Presupuesto (`rubro.valor`, `valor_unitario`) en `bigint` modo número: `integer` de Postgres es de 32 bits. El guardado del cronograma hace primero el `UPDATE … WHERE cronograma_version = v` dentro de la transacción (bloquea la fila; el simultáneo da 409) · Claude.
- 2026-11-11 · **Publicar al final**: se termina todo (Fases 6, 7 y 8) y se despliega en la Fase 8 (T8.5 = Task 7 del plan de Vercel). T4.5 se da por cumplida con RF1 · Usuario.
- 2026-11-11 · La función de Vercel (`apps/api/src/vercel.ts`) no migra: lo hace `npm run migrar` en el build. Arranca la app una vez por instancia y olvida un arranque fallido para reintentar · Claude.
- 2026-11-12 · **Fase 6:** riesgos en tabla + matriz probabilidad × impacto (1–5, solo la calificación vigente); presupuesto solo planeado, total y barras por rubro con desglose; indicadores solo definición (sin mediciones por ahora) · Usuario. Nivel de riesgo fijo (1–4 bajo, 5–9 medio, 10–15 alto, 16–25 crítico); ids generados por la web y upsert (no borrar y reinsertar: `medicion` cuelga de `indicador`); valor de rubro con desglose lo calcula el servidor; meta opcional; en un corte pasado se ven los valores actuales · Claude.
- 2026-11-12 · Complementos en la ficha: una fila vacía desaparece al salir de **toda la fila** (no de un campo); la matriz de riesgos es `role=group` con puntos `role=img` enfocables (un `img` anidado esconde sus hijos) · Claude.
- 2026-11-12 · **Fase 7:** olvido de clave = «Contacta al administrador del sistema» (sin correos); el Admin restablece con clave temporal y cambio obligatorio (`/cuenta/clave`, pantalla nueva). Categoría **«Default»** sembrada (protegida, preseleccionada al crear); las áreas las crea el Admin. Lectura total = **tablero en el portafolio para todo usuario** (cifras + semáforo por área y categoría, opción A) y selector «Mis charters / Todos» del Admin · Usuario. Tablero por el estado global del último corte; promedio simple; sin corte reciente = 30 días; no hay borrado de cuentas ni auto-desactivación · Claude.
- 2026-11-12 · Paleta de categorías: 8 pares fijos en `shared` (`PALETA_CATEGORIAS`) con texto `tinta` ≥ 4,5:1; el punto llega a 3:1 salvo el ámbar del Comité, que se conserva por identidad. «Default» se reconoce por `protegida` (también en `CategoriaPublica`) · Claude.
- 2026-11-12 · Tablero: segmento por el estado global del último corte; Dueño como columna solo desde `lg` (debajo, «de …» en la línea de datos); un `dueno` en la URL fuera de «Todos» se ignora; «Limpiar filtros» conserva `ver`. En celular el menú dice «Admin» y «Clave» · Claude.
- 2026-11-13 · Cronograma: el nombre en la fila del Gantt se ve en hasta 2 líneas y el detalle es una tarjeta con Actividad y Entregable en campos que crecen con el texto. T8.2 cumplida con los charters reales (RF1, PC1, AC1) · Usuario / Claude.
- 2026-11-13 · T8.3: bajo 640 px el encabezado lleva Admin, clave y salir en un menú «Cuenta» (`MenuAcciones` con `boton`/`claseBoton`) y la banda de la ficha va en dos filas. Registro limitado a 20 por IP por hora; dos cortes nuevos simultáneos = 409 `corte_simultaneo`. En la curva S, la etiqueta del fin se acorta u omite si choca con la del corte (`textoFin` en `geometria.ts`) · Claude.
- 2026-11-09 · Semáforo por brecha (PV − EV) en puntos: verde < 10, amarillo < 25, naranja < 50, rojo ≥ 50, y **vencida** (vinotinto) si pasó el fin sin el 100 %. Agrupadoras cuentan sus hojas vencidas · Usuario.

## Estado actual

- **T1.3 aprobada (2026-11-09):** maquetas en `docs/maquetas/` (abrir con `python -m http.server` dentro de la carpeta) y flujos en `docs/pantallas.md`. PRODUCT.md y DESIGN.md creados.
- **Fase 3 cerrada (2026-11-09).**
- **Fase 4 cerrada (2026-11-10).** T4.5 cumplida con RF1 (2026-11-11).
- **Fase 5 cerrada (2026-11-11):** diseño en `docs/superpowers/specs/2026-11-10-fase-5-visualizacion-design.md`, plan en `docs/planes/fase-5.md`. `componentes/MiniCurvaS.tsx` la usan el portafolio y Registrar corte.
- **Primer charter real:** RF1 · Radicación de facturas (Comité IA, eje Automatización; responsable Jorge Espinosa, patrocinador Área ID & TI). Redacción, listas y cronograma (25 actividades, 23 nov 2026 – 10 abr 2027) cargados el 2026-11-11 a partir de la reunión. Indicadores y riesgos propuestos esperan la Fase 6.
- **T8.4 cerrada (2026-11-13). Siguiente:** T8.5 (publicar). E2E en `e2e/` (`playwright.config.ts` en la raíz). Los `.docx` del Comité IA de la raíz quedan fuera del repo.
- **PC1 y AC1 (2026-11-13):** PC1 · Plataforma de Control Diario de Cantidades (eje Analítica & Datos, Jonathan Giraldo; amplía la app de horas hombre de ID & TI con la captura de cantidades) y AC1 · Asistente de consulta de especificaciones técnicas, de calidad y HSE (eje Gestión del Conocimiento, Juan Carlos Trujillo; un asistente por proyecto). Ficha completa propuesta y cargada a partir de las transcripciones; falta evaluarla con cada equipo.
- **Parametrización y exportación cerradas (2026-11-11):** diseño en `docs/superpowers/specs/2026-11-11-parametrizacion-y-exportacion-design.md`, plan en `docs/planes/parametrizacion-exportacion.md`. Web: `pantallas/admin/` (`AreaAdmin` con pestañas como enlaces, `Parametrizacion`; `SoloAdmin` en las rutas), `MenuExportar` en la banda, `api/exportar.ts` y `pantallas/imprimir/` (`Imprimir` sin `Layout`, `CronogramaImpresion`, `imprimir.css`). La impresión reutiliza `SeccionCurvaS` con `estatica` y `ancho`.
- **Despliegue en curso:** diseño en `docs/superpowers/specs/2026-11-11-despliegue-vercel-neon-design.md`, plan en `docs/planes/despliegue-vercel.md`. Tasks 1–6 hechas el 2026-11-11 (Postgres, API asíncrona, fecha de Bogotá, `CORREOS_PERMITIDOS`, adaptador y `vercel.json`). La Task 7 (Neon, Vercel, verificación, RF1 a Neon y documentación) queda para la Fase 8. Respaldo de la base SQLite y JSON de los 8 charters (RF1 incluido) en `Documents/Desarrollos/respaldo-projectcharter-2026-11-11/`; la base local de PGlite arrancó vacía: recargar RF1 antes de la Fase 6.
- **Fase 6 cerrada (2026-11-12):** diseño en `docs/superpowers/specs/2026-11-12-fase-6-complementos-design.md`, plan en `docs/planes/fase-6.md`. API en `modulos/charters/complementos.ts` (`leerComplementos` en el detalle, upsert que conserva ids). Web en `pantallas/ficha/complementos/`: `useColeccion` (copia local que guarda la colección completa por la cola: 800 ms, al salir de un campo o de la fila; nunca adopta la respuesta), `controles.tsx`, `SeccionIndicadores`, `SeccionRiesgos` + `MatrizRiesgos` (SVG, `estatica` para el PDF), `SeccionPresupuesto` (total, barras, desglose; con líneas útiles el valor es su suma y sin ellas se conserva el escrito) y `nivel.ts`. PDF en `pantallas/imprimir/ComplementosImpresion.tsx`. `pesos`/`leerPesos` en `formato.ts`. **RF1 tiene una propuesta de 6 indicadores, 8 riesgos y presupuesto (COP 22,2 M) para evaluar con el Comité.** **Siguiente:** Fase 7 (Admin) y Fase 8.
- **Fase 7 diseñada (2026-11-12):** diseño en `docs/superpowers/specs/2026-11-12-fase-7-admin-design.md`, plan en `docs/planes/fase-7.md` (9 tareas, 3 sesiones: API · Admin web · tablero y cierre). **Sesión 1 hecha (2026-11-12):** `modulos/admin/cuentas.ts` y `catalogos.ts` bajo `/api/admin`, `ID_DEFAULT` en `semilla.ts`, `listarCharters(db, { propietarioId? })`. **Sesión 2 hecha (2026-11-12):** `pantallas/CambiarClave.tsx` (`RUTA_CLAVE` en `RutaProtegida`), `pantallas/admin/Cuentas.tsx` y `Catalogos.tsx`, `componentes/MenuAcciones.tsx`. **Fase 7 cerrada (2026-11-12):** tablero en `pantallas/portafolio/Tablero.tsx` con cálculo puro en `datosTablero.ts`; filtros `dueno` y `semaforo` (`sem=eje:grupo:segmento`) en `filtrar.ts` (`filtrarParaTablero` no aplica estado ni segmento); `useCharters(ver)`. **Siguiente: Fase 8.**
- Registro con «Confirmar clave» y `componentes/CampoClave.tsx` (mostrar u ocultar la clave), en Entrar y Registro.
- Base: `db/conexion.ts` con `abrirDb` (URL `postgres://` → `pg`; `':memory:'` o carpeta → PGlite, solo con `import()` dinámico), `prepararDb` (migra y siembra), `crearDb` = ambas, y `cerrarDb`. `esViolacionUnica` (código `23505`) en `db/errores.ts`. Pruebas: `crearDbPrueba()` de `test/ayudas.ts` clona una plantilla migrada por archivo y cierra los clones en `afterEach`.
- Ficha a una fecha: `useVistaCronograma` (`?corte=`) arma la `VistaCronograma` que comparten banda, curva y Gantt; en un corte pasado todo es solo lectura. Curva S en `pantallas/ficha/curva/` (`geometria.ts` puro, `CurvaS` en SVG). Reglas de los charters: `apps/api/src/modulos/admin/parametros.ts` (`reglasDeCharter`, `columnasDeReglas`).
- Cronograma web en `pantallas/ficha/cronograma/`: `operaciones.ts` (puras), `useBorradorCronograma(id, encolar)` (copia local; adopta lo de la API en la primera edición; versión en un ref), `escala.ts`, `PistaGantt`. El borrador vive en `Ficha.tsx` y lo comparten la banda (`BandaEstado` con `situacion`) y `SeccionCronograma`. Los cortes usan los umbrales del charter; la ficha, los de por defecto (el detalle no los trae).
- Cortes web: historial en `pantallas/ficha/SeccionHistorial.tsx`; pantalla en `pantallas/corte/` (`RegistrarCorte` prepara las filas y monta `Formulario` con `key`; `clasificar.ts` puro; `FilaAvance`). Al guardar navega a la ficha con `state.aviso`. `Cifra` anima números con un `MotionValue`.
- La ficha guarda con `useColaGuardado(alFallar)` (`pantallas/ficha/colaGuardado.ts`, compartida por `ContextoGuardado`): todo guardado nuevo debe encolarse ahí. `alFallar` atiende 401 y 409 `charter_cerrado`. `secciones()` en `Ficha.tsx` lista solo las secciones construidas; al pasar a solo lectura, las secciones se rehacen (`Fragment` con `key`).
- Pruebas web: `test/simular-api.ts` simula `fetch` (la sesión de Ana va por defecto).
- Hallazgo: en el Excel la jerarquía se deduce de las fórmulas de peso (G), no del esquema de filas (roto en 1.3.1 y 1.3.2). Con esa regla da 12,51 % / 12,47 %.

## Comandos

- `npm run dev` (API 3100 + web 5173; base PGlite en `data/pglite`, o Postgres si hay `DATABASE_URL`) · `npm test` · `npm run lint` · `npm run build`.
- `npm run e2e`: Playwright con API (`e2e/servidor.ts`, PGlite en memoria con Admin `admin.e2e@…`) y web propias en 3300 y 5300; reutiliza servidores ya levantados en esos puertos.
- `npm run migrar` aplica migraciones y semilla a la base de `DATABASE_URL`; `npm run build:vercel` = migrar + build (lo usa Vercel).
- Admin: registrar la cuenta y luego `npm run admin -- --promover <correo>` (`--quitar` lo retira).
- Si Claude levanta `npm run dev` para verificar, al terminar debe matar **todo el árbol** (`concurrently` y `tsx watch`), no solo el proceso del puerto: un `tsx watch` huérfano relanza la API al cambiar el código y ocupa el 3100 (EADDRINUSE).

## Aprendido

- npm 11 bloquea scripts de instalación: no hace falta aprobarlos (esbuild usa su paquete de plataforma).
- En Git Bash los heredocs largos con JSX/plantillas fallan a veces; usar Write para archivos de código.
- Prettier no debe tocar el fixture ni las migraciones (`.prettierignore`).
- Vite puede quedar con un módulo a medio editar en caché: reiniciar `npm run dev`.
- Con Playwright, `locator.click()` desplaza la página para centrar el elemento: para medir el scroll usar `element.click()` dentro de `evaluate`.
- Las maquetas cargan los scripts con `?v=n`: subir el número al cambiarlos, o el navegador muestra la versión en caché.
- Las pruebas de API usan `sesionDe(app, correo, { admin })` y `crearCharterPrueba` de `test/ayudas.ts`; para ordenar por `actualizado_en`, `pausa()` evita marcas ISO iguales.
- Prettier puede romper una edición hecha con `sed` sobre líneas que reacomodó: correr Prettier después de editar, no antes.
- Lint `react-hooks/immutability`: un hook que reciba un ref y lo modifique debe nombrar el parámetro con sufijo `Ref` (ver `useEnfocarFila`).
- Revisar el SQL de cada migración de `drizzle-kit generate` antes de commitear (claves foráneas, `ON DELETE`, índices).

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
- Windows no distingue mayúsculas en archivos: `tablero.ts` y `Tablero.tsx` en la misma carpeta chocan (el import trae `undefined`). Darles nombres distintos.
- Los escapes (`\s`) se pierden al pasar código por heredoc, `sed` o Python en Bash: para expresiones regulares usar Edit.
- Para leer la base sin detener el `npm run dev` del usuario: copiar `data/pglite` al scratchpad y abrir la copia con un script `tsx` en `apps/api` (`abrirDb` + `detalleCharter` + `leerCronograma`). Para escribir en la real hay que detener el `npm run dev`: probar el script primero sobre la copia y respaldar la base antes.
- Las capturas de Playwright solo se pueden guardar dentro del repo (`.playwright-mcp/`, ignorado), no en el scratchpad.
- Si el Playwright MCP está ocupado por otra sesión («Browser is already in use»), no cerrarlo: `playwright-core` en el scratchpad con el Chromium de `ms-playwright/chromium-1248`, una API aislada (`PUERTO=3200 DATABASE_URL=<scratchpad>/pglite npx tsx src/servidor.ts` en `apps/api`) y la web del 5173 con `page.route` de `/api` hacia el 3200 y la cookie con `addCookies` (dominio `localhost`). Así no se toca la base del usuario. Promover Admin con la API detenida (PGlite bloquea la carpeta).
- PGlite atiende las peticiones de a una: una carrera de Postgres no se reproduce con `Promise.all`; se simula con `vi.spyOn(app.db, 'transaction')` (ver `cortes.test.ts`).
- Git Bash convierte en ruta de Windows un argumento que empieza con `/` (`/charters/…`): pasar rutas de URL sin la barra inicial. Prettier se corre desde la raíz del repo (desde `apps/web/src` no encuentra archivos).

- `motion.path` no actualiza el `d` puesto en `style` después de montarse: geometría que cambia va en `<path>` normal (transición CSS de `d`) y la entrada con `pathLength` + `stroke-dashoffset` en CSS.
- Medir rendimiento con el build de producción (`vite build` + `vite preview`, que hereda el proxy): React en modo dev es 3–5 veces más lento. Con `memo` en filas, los callbacks deben ser estables (leer por ref lo que cambia con cada respuesta) y lo caro, diferido (`useDeferredValue`).
- Los ids de actividad son únicos en toda la base: dos charters de prueba no pueden reutilizar `A`/`B` (el PUT del cronograma da 400).
- El usuario puede tener su propio `npm run dev` corriendo: antes de levantar otro, revisar los puertos 3100/5173 y no matar procesos que no lancé.
- En Bash, nunca dejar un `cat` sin entrada al final de un comando: se queda esperando hasta el tiempo límite.
- jsdom no parsea las cajas de margen de `@page` («Could not parse CSS stylesheet»): ese `<style>` se omite con `import.meta.env.MODE === 'test'`. El `Blob` de jsdom no trae `text()`: leer con `FileReader`.
- Un archivo con un NUL literal (p. ej. un `join` con el carácter nulo escrito tal cual) bloquea Edit: reemplazarlo por el escape `'\u0000'` (mismo valor).
- Las mutaciones a la API exigen la cabecera `X-Requested-With: charter` (CSRF): al sembrar datos desde el navegador con `fetch`, ponerla o da 403 `csrf`.
- En un texto como `<b>26,9 %</b> de 38,2 %`, el espacio tras `</b>` se pierde si hay salto de línea en JSX: usar `{' '}` (un margen no basta para lectores de pantalla ni pruebas).
- Para cargar datos en un charter ajeno sin su clave: script temporal con `tsx` en `apps/api` que llame a `editarCharter`, `reemplazarLista` y `guardarCronograma` (mismas validaciones Zod), con respaldo previo de la base y borrarlo al terminar. Desde Postgres todo es `async` (`await`).
- Para revisar el PDF sin visor: `page.emulateMedia({ media: 'print' })` con el viewport a 688 px (ancho útil del A4) y medir `scrollWidth`; el número de páginas sale de contar `/Type /Page` en el archivo.

- Cada clon de PGlite es una instancia WASM: sin cerrarlo, la suite de la API se queda sin memoria (Fatal OOM). La plantilla tarda ~2 s y cada clon ~0,3 s; `apps/api/vitest.config.ts` sube el límite a 30 s.
- Con `PgDatabase` genérica, `db.execute` devuelve `unknown`: castear a `{ rows: … }`. Drizzle en Postgres no tiene `.get()/.all()/.run()`: `const [fila] = await …limit(1)` y `.returning()` en vez de `changes`.
- Drizzle con una tabla genérica (`T extends typeof a | typeof b`): `.from(tabla)` no compila; usar `.from(tabla as PgTable)`. Upsert de varias filas: `onConflictDoUpdate({ target, set })` con `sql.raw('excluded."columna"')` por columna (ver `desdeExcluido` en `complementos.ts`).
- La suite de la API no debe correr junto con otra suite: la plantilla de PGlite pasa de 30 s y fallan las primeras pruebas de cada archivo. Correrla sola (`--maxWorkers=2`).
- Prettier sobre `src` entero deja `FilaCharter.tsx` con un cambio solo de fin de línea: revisar `git status` y revertirlo con `git checkout --`.
- Este PC está en hora de Bogotá: una prueba de fechas «de Bogotá» pasa aunque el código use la zona local. Por eso `apps/api/vitest.config.ts` fija `TZ=UTC`. Probar `npm run migrar` con `DATABASE_URL=<carpeta del scratchpad>` (PGlite aparte), nunca sobre `data/pglite` con el `npm run dev` del usuario corriendo.
- `tsx watch` del usuario relanza la API al cambiar el código: tras cambios de base, su `npm run dev` ya corre con lo nuevo (sirve para verificar sin levantar otro).
- Con el `npm run dev` del usuario, la base PGlite está bloqueada: los datos se cargan por la API desde el navegador de Playwright (la cookie de `localhost` sirve en cualquier puerto) con `X-Requested-With: charter`.
- El Tailwind del dev server puede no generar las clases de un archivo nuevo: revisar con `vite build --outDir <scratchpad>` + `vite preview`. `vite preview` fija la lista de archivos al arrancar: tras reconstruir, reiniciarlo (y matar el `node` hijo, no solo el envoltorio).

- E2E: el radio `sr-only` de «Mis charters / Todos» no se puede `check()`; se hace clic en su texto. La banda y el resumen del corte no tienen espacio entre etiqueta y cifra en `textContent`: comprobar con `/Real\s*70,0 %/`. Las fechas de las pruebas van en el pasado para que el planeado no dependa del día.

## Glosario

- **Hoja / agrupadora:** actividad sin hijas (lleva peso, fechas y % real) / con hijas (se calcula).
- **Corte:** fecha de corte + % real por hoja + nota. Se guardan todos.
- **Línea base:** fechas y pesos aprobados del cronograma.

## Entorno

- Windows 11, VS Code, PowerShell 5.1 y Git Bash. Python 3.13 con openpyxl; Node 24.
